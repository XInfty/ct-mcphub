import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { IStrata, IGroupServerConfig, ServerConfig } from '../types/index.js';
import { loadSettings, saveSettings } from '../config/index.js';
import { notifyToolChanged } from './mcpService.js';
import { getDataService } from './services.js';

// Directory for storing Open-Strata config files
const STRATA_CONFIG_DIR = process.env.STRATA_CONFIG_DIR || '/data/srv/ct-mcphub/data/stratas';

// Ensure config directory exists
if (!fs.existsSync(STRATA_CONFIG_DIR)) {
  fs.mkdirSync(STRATA_CONFIG_DIR, { recursive: true });
}

// Helper function to get strata PATH environment variable
const getStrataPath = (): string => {
  const homePath = process.env.HOME || '/home/auctor';
  return `${homePath}/.local/bin:/usr/local/bin:/usr/bin:/bin`;
};

// Helper function to normalize strata servers configuration
const normalizeStrataServers = (servers: IGroupServerConfig[]): IGroupServerConfig[] => {
  return servers.map((server) => ({
    name: server.name,
    tools: server.tools || 'all',
  }));
};

// Translate MCPHub ServerConfig to Open-Strata format
interface OpenStrataServerConfig {
  command?: string;
  args?: string[];
  url?: string;
  headers?: Record<string, string>;
  env?: Record<string, string>;
  enabled: boolean;
  type?: string;
}

interface OpenStrataConfig {
  mcp: {
    servers: {
      [key: string]: OpenStrataServerConfig;
    };
  };
}

const translateServerConfig = (mcpServerConfig: ServerConfig, serverName: string, settings: any): OpenStrataServerConfig => {
  const config: OpenStrataServerConfig = {
    enabled: true,
    type: 'streamable-http',
  };

  // All servers are accessed via MCPHub HTTP endpoint
  const baseUrl = settings.systemConfig?.install?.baseUrl || 'http://localhost:13131';
  config.url = `${baseUrl}/mcp/${serverName}`;

  // Add authorization if configured
  if (settings.systemConfig?.accessToken) {
    config.headers = {
      Authorization: `Bearer ${settings.systemConfig.accessToken}`
    };
  }

  return config;
};

// Generate Open-Strata config file from strata definition
const generateOpenStrataConfig = (strata: IStrata): OpenStrataConfig => {
  const settings = loadSettings();
  const openStrataConfig: OpenStrataConfig = {
    mcp: {
      servers: {},
    },
  };

  strata.servers.forEach((serverRef) => {
    const mcpServer = settings.mcpServers[serverRef.name];
    if (!mcpServer) {
      console.warn(`[strataService] Server ${serverRef.name} not found in mcpServers`);
      return;
    }

    openStrataConfig.mcp.servers[serverRef.name] = translateServerConfig(mcpServer, serverRef.name, settings);
  });

  return openStrataConfig;
};

// Get MCP server name for a strata
const getStrataServerName = (strataName: string): string => {
  return `strata-${strataName}`;
};

// Get all stratas
export const getAllStratas = (): IStrata[] => {
  const settings = loadSettings();
  const dataService = getDataService();
  return dataService.filterData
    ? dataService.filterData(settings.stratas || [])
    : settings.stratas || [];
};

// Get strata by ID or name
export const getStrataByIdOrName = (key: string): IStrata | undefined => {
  const stratas = getAllStratas();
  return stratas.find((strata) => strata.id === key || strata.name === key) || undefined;
};

// Create a new strata
export const createStrata = (
  name: string,
  description?: string,
  servers: IGroupServerConfig[] = [],
  owner?: string,
): IStrata | null => {
  try {
    const settings = loadSettings();
    const stratas = settings.stratas || [];

    // Check if strata with same name already exists
    if (stratas.some((strata) => strata.name === name)) {
      console.error(`[strataService] Strata with name '${name}' already exists`);
      return null;
    }

    // Check if managed server name would conflict
    const serverName = getStrataServerName(name);
    if (settings.mcpServers[serverName]) {
      console.error(`[strataService] Server name '${serverName}' already exists`);
      return null;
    }

    // Normalize servers configuration and filter out non-existent servers
    const normalizedServers = normalizeStrataServers(servers);
    const validServers: IGroupServerConfig[] = normalizedServers.filter((serverConfig) => {
      if (!settings.mcpServers[serverConfig.name]) {
        console.warn(
          `[strataService] Server '${serverConfig.name}' not found, excluding from strata`,
        );
        return false;
      }
      return true;
    });

    if (validServers.length === 0) {
      console.error('[strataService] No valid servers provided for strata');
      return null;
    }

    // Create strata object
    const newStrata: IStrata = {
      id: uuidv4(),
      name,
      description,
      servers: validServers,
      owner: owner || 'admin',
    };

    // Generate Open-Strata config file
    const openStrataConfig = generateOpenStrataConfig(newStrata);
    const configPath = path.join(STRATA_CONFIG_DIR, `${newStrata.id}.json`);

    try {
      fs.writeFileSync(configPath, JSON.stringify(openStrataConfig, null, 2), 'utf-8');
      console.log(`[strataService] Created Open-Strata config: ${configPath}`);
    } catch (error) {
      console.error('[strataService] Failed to write Open-Strata config:', error);
      return null;
    }

    // Generate MCP server entry for this strata
    const mcpServerConfig: ServerConfig = {
      enabled: true,
      owner: newStrata.owner,
      type: 'stdio',
      command: 'strata',
      args: ['--config-path', configPath],
      env: {
        PATH: getStrataPath(),
      },
      _managedBy: `strata:${newStrata.id}`,
    };

    // Initialize stratas array if it doesn't exist
    if (!settings.stratas) {
      settings.stratas = [];
    }

    // Add strata and managed server to settings
    settings.stratas.push(newStrata);
    settings.mcpServers[serverName] = mcpServerConfig;

    // Save settings
    if (!saveSettings(settings)) {
      // Rollback: remove config file
      try {
        fs.unlinkSync(configPath);
      } catch (e) {
        console.error('[strataService] Failed to rollback config file:', e);
      }
      return null;
    }

    console.log(`[strataService] Created strata '${name}' with ID ${newStrata.id}`);

    // Notify MCPHub to reload the new server
    notifyToolChanged(serverName);

    return newStrata;
  } catch (error) {
    console.error('[strataService] Failed to create strata:', error);
    return null;
  }
};

// Update an existing strata
export const updateStrata = (id: string, data: Partial<IStrata>): IStrata | null => {
  try {
    const settings = loadSettings();
    if (!settings.stratas) {
      return null;
    }

    const strataIndex = settings.stratas.findIndex((strata) => strata.id === id);
    if (strataIndex === -1) {
      console.error(`[strataService] Strata with ID '${id}' not found`);
      return null;
    }

    const oldStrata = settings.stratas[strataIndex];
    const oldServerName = getStrataServerName(oldStrata.name);

    // Check if name is being changed and would conflict
    if (data.name && data.name !== oldStrata.name) {
      if (settings.stratas.some((s) => s.id !== id && s.name === data.name)) {
        console.error(`[strataService] Strata with name '${data.name}' already exists`);
        return null;
      }

      const newServerName = getStrataServerName(data.name);
      if (newServerName !== oldServerName && settings.mcpServers[newServerName]) {
        console.error(`[strataService] Server name '${newServerName}' already exists`);
        return null;
      }
    }

    // Merge updates
    const updatedStrata: IStrata = {
      ...oldStrata,
      ...data,
      id: oldStrata.id, // ID cannot be changed
    };

    // Normalize servers if provided
    if (data.servers) {
      updatedStrata.servers = normalizeStrataServers(data.servers).filter((serverConfig) => {
        if (!settings.mcpServers[serverConfig.name]) {
          console.warn(
            `[strataService] Server '${serverConfig.name}' not found, excluding from strata`,
          );
          return false;
        }
        return true;
      });

      if (updatedStrata.servers.length === 0) {
        console.error('[strataService] No valid servers provided for strata update');
        return null;
      }
    }

    // Update Open-Strata config file
    const openStrataConfig = generateOpenStrataConfig(updatedStrata);
    const configPath = path.join(STRATA_CONFIG_DIR, `${updatedStrata.id}.json`);

    try {
      fs.writeFileSync(configPath, JSON.stringify(openStrataConfig, null, 2), 'utf-8');
      console.log(`[strataService] Updated Open-Strata config: ${configPath}`);
    } catch (error) {
      console.error('[strataService] Failed to update Open-Strata config:', error);
      return null;
    }

    // Update strata in settings
    settings.stratas[strataIndex] = updatedStrata;

    // Handle server name change
    const newServerName = getStrataServerName(updatedStrata.name);
    if (newServerName !== oldServerName) {
      // Remove old server entry
      delete settings.mcpServers[oldServerName];

      // Create new server entry
      settings.mcpServers[newServerName] = {
        enabled: true,
        owner: updatedStrata.owner,
        type: 'stdio',
        command: 'strata',
        args: ['--config-path', configPath],
        env: {
          PATH: getStrataPath(),
        },
        _managedBy: `strata:${updatedStrata.id}`,
      };
    }

    // Save settings
    if (!saveSettings(settings)) {
      return null;
    }

    console.log(`[strataService] Updated strata '${updatedStrata.name}' (ID: ${id})`);

    // Notify MCPHub to reload the server
    notifyToolChanged(newServerName);
    if (newServerName !== oldServerName) {
      notifyToolChanged(oldServerName); // Notify old name too
    }

    return updatedStrata;
  } catch (error) {
    console.error('[strataService] Failed to update strata:', error);
    return null;
  }
};

// Delete a strata
export const deleteStrata = (id: string): boolean => {
  try {
    const settings = loadSettings();
    if (!settings.stratas) {
      return false;
    }

    const strata = settings.stratas.find((s) => s.id === id);
    if (!strata) {
      console.error(`[strataService] Strata with ID '${id}' not found`);
      return false;
    }

    const serverName = getStrataServerName(strata.name);

    // Remove Open-Strata config file
    const configPath = path.join(STRATA_CONFIG_DIR, `${strata.id}.json`);
    try {
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
        console.log(`[strataService] Deleted Open-Strata config: ${configPath}`);
      }
    } catch (error) {
      console.warn('[strataService] Failed to delete config file:', error);
      // Continue anyway
    }

    // Remove MCP server entry
    delete settings.mcpServers[serverName];

    // Remove strata
    settings.stratas = settings.stratas.filter((s) => s.id !== id);

    // Save settings
    if (!saveSettings(settings)) {
      return false;
    }

    console.log(`[strataService] Deleted strata '${strata.name}' (ID: ${id})`);

    // Notify MCPHub
    notifyToolChanged(serverName);

    return true;
  } catch (error) {
    console.error('[strataService] Failed to delete strata:', error);
    return false;
  }
};
