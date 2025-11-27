import { Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';
import { handleCallToolRequest, getServerByName } from '../services/mcpService.js';
import { convertParametersToTypes } from '../utils/parameterConversion.js';
import { getNameSeparator } from '../config/index.js';

/**
 * Interface for tool call request
 */
export interface ToolCallRequest {
  toolName: string;
  arguments?: Record<string, any>;
}

/**
 * Interface for tool search request
 */
export interface ToolSearchRequest {
  query: string;
  limit?: number;
}

/**
 * Interface for tool call result
 */
interface ToolCallResult {
  content?: Array<{
    type: string;
    text?: string;
    [key: string]: any;
  }>;
  isError?: boolean;
  [key: string]: any;
}

/**
 * Call a specific tool with given arguments
 */
export const callTool = async (req: Request, res: Response): Promise<void> => {
  try {
    const { server } = req.params;
    const { toolName, arguments: toolArgs = {} } = req.body as ToolCallRequest;

    if (!toolName) {
      res.status(400).json({
        success: false,
        message: 'toolName is required',
      });
      return;
    }

    // Get the server info to access the tool's input schema
    const serverInfo = getServerByName(server);
    let inputSchema: Record<string, any> = {};

    if (serverInfo) {
      // Find the tool in the server's tools list
      const fullToolName = `${server}${getNameSeparator()}${toolName}`;
      const tool = serverInfo.tools.find(
        (t: any) => t.name === fullToolName || t.name === toolName,
      );
      if (tool && tool.inputSchema) {
        inputSchema = tool.inputSchema as Record<string, any>;
      }
    }

    // Convert parameters to proper types based on the tool's input schema
    const convertedArgs = convertParametersToTypes(toolArgs, inputSchema);

    // Create a mock request structure for handleCallToolRequest
    const mockRequest = {
      params: {
        name: 'call_tool',
        arguments: {
          toolName,
          arguments: convertedArgs,
        },
      },
    };

    const extra = {
      sessionId: req.headers['x-session-id'] || 'api-session',
      server: server || undefined,
      headers: req.headers, // Include request headers for passthrough
    };

    const result = (await handleCallToolRequest(mockRequest, extra)) as ToolCallResult;

    const response: ApiResponse = {
      success: true,
      data: {
        content: result.content || [],
        toolName,
        arguments: convertedArgs,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error calling tool:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to call tool',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};

/**
 * List all available tools from all servers in MCP format
 * GET /tools/list
 */
export const listTools = async (req: Request, res: Response): Promise<void> => {
  try {
    const { getServersInfo } = await import('../services/mcpService.js');
    const serversInfo = await getServersInfo();
    
    const tools: Array<{
      name: string;
      description: string;
      inputSchema: any;
    }> = [];

    for (const serverInfo of serversInfo) {
      if (serverInfo.status === 'connected' && serverInfo.tools) {
        for (const tool of serverInfo.tools) {
          // Remove server prefix from tool name for MCP compatibility
          let toolName = tool.name;
          if (toolName.startsWith(`${serverInfo.name}-`)) {
            toolName = toolName.replace(`${serverInfo.name}-`, '');
          }
          
          tools.push({
            name: toolName,
            description: tool.description || '',
            inputSchema: tool.inputSchema || {}
          });
        }
      }
    }

    const response = {
      tools: tools
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing tools:', error);
    res.status(500).json({
      error: 'Failed to list tools',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
/**
 * Call a tool via MCP protocol endpoint
 * POST /tools/call
 */
export const callToolMCP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name: toolName, arguments: toolArgs = {} } = req.body;

    if (!toolName) {
      res.status(400).json({
        error: 'Tool name is required',
      });
      return;
    }

    // Import necessary functions
    const { handleCallToolRequest, getServersInfo } = await import('../services/mcpService.js');
    
    // Get server info to resolve tool name
    const serversInfo = await getServersInfo();
    let resolvedToolName = toolName;
    let targetServer = undefined;

    // First try to find exact match
    for (const serverInfo of serversInfo) {
      if (serverInfo.status === 'connected' && serverInfo.tools) {
        const exactMatch = serverInfo.tools.find(tool => tool.name === toolName);
        if (exactMatch) {
          resolvedToolName = toolName;
          targetServer = serverInfo.name;
          break;
        }
        
        // Try with server prefix
        const prefixedMatch = serverInfo.tools.find(tool => tool.name === `${serverInfo.name}-${toolName}`);
        if (prefixedMatch) {
          resolvedToolName = prefixedMatch.name;
          targetServer = serverInfo.name;
          break;
        }
      }
    }

    if (!targetServer) {
      res.status(404).json({
        error: `Tool '${toolName}' not found on any connected server`,
      });
      return;
    }

    // Create a mock request structure that matches what handleCallToolRequest expects
    const mockRequest = {
      params: {
        name: resolvedToolName,
        arguments: toolArgs,
      },
    };

    const extra = {
      sessionId: req.headers['x-session-id'] || 'mcp-session',
      server: targetServer,
      headers: req.headers,
    };

    const result = await handleCallToolRequest(mockRequest, extra);

    // Return the result in MCP format
    res.json(result);
  } catch (error) {
    console.error('Error calling tool:', error);
    res.status(500).json({
      error: 'Failed to call tool',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
