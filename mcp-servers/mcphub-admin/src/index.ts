#!/usr/bin/env node
/**
 * MCPHub Admin MCP Server
 *
 * Provides tools to manage MCP servers, groups, and users through the MCPHub REST API.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios, { AxiosError } from "axios";

// Constants
const API_BASE_URL = process.env.MCPHUB_API_URL || "http://localhost:3000/api";
const API_TOKEN = process.env.MCPHUB_API_TOKEN || "";
const CHARACTER_LIMIT = 25000;

// Enums
enum ResponseFormat {
  MARKDOWN = "markdown",
  JSON = "json"
}

// Shared utility functions
async function makeApiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: unknown,
  params?: Record<string, unknown>
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };

  if (API_TOKEN) {
    headers["Authorization"] = `Bearer ${API_TOKEN}`;
  }

  const response = await axios({
    method,
    url: `${API_BASE_URL}/${endpoint}`,
    data,
    params,
    timeout: 30000,
    headers
  });
  return response.data;
}

function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error || "";

      switch (status) {
        case 400:
          return `Error: Invalid request. ${message}. Check your parameters.`;
        case 401:
          return "Error: Authentication required. Set MCPHUB_API_TOKEN environment variable.";
        case 403:
          return "Error: Permission denied. You don't have access to this resource.";
        case 404:
          return `Error: Resource not found. ${message}`;
        case 409:
          return `Error: Conflict. ${message}`;
        case 429:
          return "Error: Rate limit exceeded. Please wait before making more requests.";
        default:
          return `Error: API request failed with status ${status}. ${message}`;
      }
    } else if (error.code === "ECONNREFUSED") {
      return `Error: Cannot connect to MCPHub at ${API_BASE_URL}. Is MCPHub running?`;
    } else if (error.code === "ECONNABORTED") {
      return "Error: Request timed out. Please try again.";
    }
  }
  return `Error: ${error instanceof Error ? error.message : String(error)}`;
}

function truncateResponse(result: string, itemCount: number): string {
  if (result.length > CHARACTER_LIMIT) {
    return result.substring(0, CHARACTER_LIMIT) +
      `\n\n[Response truncated. Showing partial results from ${itemCount} items. Use filters or pagination to see more.]`;
  }
  return result;
}

// Create MCP server instance
const server = new McpServer({
  name: "mcphub-admin-mcp-server",
  version: "1.0.0"
});

// ============================================================================
// SERVER MANAGEMENT TOOLS
// ============================================================================

const ListServersSchema = z.object({
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("Output format: 'markdown' for human-readable or 'json' for structured data")
}).strict();

server.registerTool(
  "mcphub_list_servers",
  {
    title: "List MCP Servers",
    description: `List all configured MCP servers in MCPHub.

Returns all servers with their configuration, status, and available tools.

Args:
  - response_format: Output format ('markdown' or 'json', default: 'markdown')

Returns:
  List of servers with name, type, status (enabled/disabled), and tool count.

Examples:
  - "Show all MCP servers" -> response_format="markdown"
  - "Get servers as JSON for processing" -> response_format="json"`,
    inputSchema: ListServersSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof ListServersSchema>) => {
    try {
      const data = await makeApiRequest<{ data: { mcpServers: Record<string, unknown> } }>("settings");
      const servers = data.data?.mcpServers || {};
      const serverList = Object.entries(servers);

      if (serverList.length === 0) {
        return { content: [{ type: "text", text: "No MCP servers configured." }] };
      }

      let result: string;
      if (params.response_format === ResponseFormat.JSON) {
        result = JSON.stringify({ count: serverList.length, servers }, null, 2);
      } else {
        const lines = [`# MCP Servers (${serverList.length})`, ""];
        for (const [name, config] of serverList) {
          const cfg = config as Record<string, unknown>;
          const enabled = cfg.enabled !== false ? "enabled" : "disabled";
          const type = cfg.type || "stdio";
          const toolCount = Array.isArray(cfg.tools) ? cfg.tools.length : 0;
          lines.push(`## ${name}`);
          lines.push(`- **Type**: ${type}`);
          lines.push(`- **Status**: ${enabled}`);
          lines.push(`- **Tools**: ${toolCount}`);
          lines.push("");
        }
        result = lines.join("\n");
      }

      return { content: [{ type: "text", text: truncateResponse(result, serverList.length) }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

const GetServerSchema = z.object({
  name: z.string().min(1).describe("Server name to retrieve"),
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN)
}).strict();

server.registerTool(
  "mcphub_get_server",
  {
    title: "Get MCP Server Details",
    description: `Get detailed configuration of a specific MCP server.

Args:
  - name: Server name to retrieve
  - response_format: Output format

Returns:
  Complete server configuration including command, args, env, tools, and status.`,
    inputSchema: GetServerSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof GetServerSchema>) => {
    try {
      const data = await makeApiRequest<{ data: { mcpServers: Record<string, unknown> } }>("settings");
      const servers = data.data?.mcpServers || {};
      const serverConfig = servers[params.name];

      if (!serverConfig) {
        return { content: [{ type: "text", text: `Error: Server '${params.name}' not found.` }], isError: true };
      }

      let result: string;
      if (params.response_format === ResponseFormat.JSON) {
        result = JSON.stringify({ name: params.name, ...serverConfig as object }, null, 2);
      } else {
        const cfg = serverConfig as Record<string, unknown>;
        const lines = [`# Server: ${params.name}`, ""];
        lines.push(`- **Type**: ${cfg.type || "stdio"}`);
        lines.push(`- **Status**: ${cfg.enabled !== false ? "enabled" : "disabled"}`);
        if (cfg.command) lines.push(`- **Command**: ${cfg.command}`);
        if (cfg.url) lines.push(`- **URL**: ${cfg.url}`);
        if (Array.isArray(cfg.args)) lines.push(`- **Args**: ${cfg.args.join(" ")}`);
        if (cfg.env) lines.push(`- **Env vars**: ${Object.keys(cfg.env as object).join(", ")}`);
        if (Array.isArray(cfg.tools)) {
          lines.push("", "### Tools");
          for (const tool of cfg.tools as Array<{ name: string; description?: string }>) {
            lines.push(`- **${tool.name}**: ${tool.description || "No description"}`);
          }
        }
        result = lines.join("\n");
      }

      return { content: [{ type: "text", text: result }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

const CreateServerSchema = z.object({
  name: z.string().min(1).max(100).describe("Unique server name"),
  type: z.enum(["stdio", "sse", "streamable-http"]).default("stdio").describe("Server type"),
  command: z.string().optional().describe("Command to run (for stdio type)"),
  args: z.array(z.string()).optional().describe("Command arguments (for stdio type)"),
  url: z.string().url().optional().describe("Server URL (for sse/http types)"),
  env: z.record(z.string()).optional().describe("Environment variables"),
  enabled: z.boolean().default(true).describe("Enable server immediately")
}).strict();

server.registerTool(
  "mcphub_create_server",
  {
    title: "Create MCP Server",
    description: `Create a new MCP server configuration.

Args:
  - name: Unique server name (required)
  - type: Server type - 'stdio', 'sse', or 'streamable-http' (default: 'stdio')
  - command: Command to run for stdio servers
  - args: Command arguments array
  - url: Server URL for sse/http servers
  - env: Environment variables as key-value pairs
  - enabled: Enable server immediately (default: true)

Examples:
  - Create stdio server: name="my-server", type="stdio", command="npx", args=["-y", "@example/mcp-server"]
  - Create SSE server: name="remote-api", type="sse", url="https://api.example.com/mcp"`,
    inputSchema: CreateServerSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof CreateServerSchema>) => {
    try {
      const serverConfig: Record<string, unknown> = {
        type: params.type,
        enabled: params.enabled
      };

      if (params.type === "stdio") {
        if (!params.command) {
          return { content: [{ type: "text", text: "Error: 'command' is required for stdio servers." }], isError: true };
        }
        serverConfig.command = params.command;
        if (params.args) serverConfig.args = params.args;
      } else {
        if (!params.url) {
          return { content: [{ type: "text", text: "Error: 'url' is required for sse/http servers." }], isError: true };
        }
        serverConfig.url = params.url;
      }

      if (params.env) serverConfig.env = params.env;

      await makeApiRequest("servers", "POST", { name: params.name, ...serverConfig });

      return { content: [{ type: "text", text: `Server '${params.name}' created successfully.` }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

const UpdateServerSchema = z.object({
  name: z.string().min(1).describe("Server name to update"),
  command: z.string().optional().describe("New command"),
  args: z.array(z.string()).optional().describe("New arguments"),
  url: z.string().url().optional().describe("New URL"),
  env: z.record(z.string()).optional().describe("New environment variables"),
  enabled: z.boolean().optional().describe("Enable/disable server")
}).strict();

server.registerTool(
  "mcphub_update_server",
  {
    title: "Update MCP Server",
    description: `Update an existing MCP server configuration.

Args:
  - name: Server name to update (required)
  - command: New command (optional)
  - args: New arguments (optional)
  - url: New URL (optional)
  - env: New environment variables (optional)
  - enabled: Enable/disable server (optional)

Only provided fields will be updated.`,
    inputSchema: UpdateServerSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof UpdateServerSchema>) => {
    try {
      const { name, ...updates } = params;
      await makeApiRequest(`servers/${encodeURIComponent(name)}`, "PUT", updates);
      return { content: [{ type: "text", text: `Server '${name}' updated successfully.` }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

const DeleteServerSchema = z.object({
  name: z.string().min(1).describe("Server name to delete")
}).strict();

server.registerTool(
  "mcphub_delete_server",
  {
    title: "Delete MCP Server",
    description: `Delete an MCP server configuration.

WARNING: This permanently removes the server configuration.

Args:
  - name: Server name to delete (required)`,
    inputSchema: DeleteServerSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof DeleteServerSchema>) => {
    try {
      await makeApiRequest(`servers/${encodeURIComponent(params.name)}`, "DELETE");
      return { content: [{ type: "text", text: `Server '${params.name}' deleted successfully.` }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

const ToggleServerSchema = z.object({
  name: z.string().min(1).describe("Server name to toggle")
}).strict();

server.registerTool(
  "mcphub_toggle_server",
  {
    title: "Toggle MCP Server",
    description: `Enable or disable an MCP server.

Toggles the server's enabled state. If enabled, it will be disabled, and vice versa.

Args:
  - name: Server name to toggle (required)`,
    inputSchema: ToggleServerSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof ToggleServerSchema>) => {
    try {
      const response = await makeApiRequest<{ data: { enabled: boolean } }>(`servers/${encodeURIComponent(params.name)}/toggle`, "POST");
      const status = response.data?.enabled ? "enabled" : "disabled";
      return { content: [{ type: "text", text: `Server '${params.name}' is now ${status}.` }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

// ============================================================================
// GROUP MANAGEMENT TOOLS
// ============================================================================

const ListGroupsSchema = z.object({
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN)
}).strict();

server.registerTool(
  "mcphub_list_groups",
  {
    title: "List Server Groups",
    description: `List all server groups in MCPHub.

Groups allow organizing MCP servers and sharing them with users.

Args:
  - response_format: Output format ('markdown' or 'json')

Returns:
  List of groups with their ID, name, description, and server count.`,
    inputSchema: ListGroupsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof ListGroupsSchema>) => {
    try {
      const data = await makeApiRequest<{ data: { groups: Array<{ id: string; name: string; description?: string; servers?: Array<{name: string}> }> } }>("settings");
      const groups = data.data?.groups || [];

      if (!Array.isArray(groups) || groups.length === 0) {
        return { content: [{ type: "text", text: "No groups configured." }] };
      }

      let result: string;
      if (params.response_format === ResponseFormat.JSON) {
        result = JSON.stringify({ count: groups.length, groups }, null, 2);
      } else {
        const lines = [`# Server Groups (${groups.length})`, ""];
        for (const group of groups) {
          lines.push(`## ${group.name} (${group.id})`);
          if (group.description) lines.push(`${group.description}`);
          lines.push(`- **Servers**: ${group.servers?.length || 0}`);
          lines.push("");
        }
        result = lines.join("\n");
      }

      return { content: [{ type: "text", text: truncateResponse(result, groups.length) }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

const GetGroupSchema = z.object({
  id: z.string().min(1).describe("Group ID to retrieve"),
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN)
}).strict();

server.registerTool(
  "mcphub_get_group",
  {
    title: "Get Group Details",
    description: `Get detailed information about a server group.

Args:
  - id: Group ID to retrieve (required)
  - response_format: Output format

Returns:
  Group details including name, description, and list of servers.`,
    inputSchema: GetGroupSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof GetGroupSchema>) => {
    try {
      const response = await makeApiRequest<{ data: { id: string; name: string; description?: string; servers?: Array<{name: string}> } }>(`groups/${encodeURIComponent(params.id)}`);
      const group = response.data;

      let result: string;
      if (params.response_format === ResponseFormat.JSON) {
        result = JSON.stringify(group, null, 2);
      } else {
        const lines = [`# Group: ${group.name}`, ""];
        lines.push(`- **ID**: ${group.id}`);
        if (group.description) lines.push(`- **Description**: ${group.description}`);
        if (group.servers && group.servers.length > 0) {
          lines.push("", "### Servers");
          for (const server of group.servers) {
            lines.push(`- ${typeof server === 'string' ? server : server.name}`);
          }
        } else {
          lines.push("", "*No servers in this group*");
        }
        result = lines.join("\n");
      }

      return { content: [{ type: "text", text: result }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100).describe("Group name"),
  description: z.string().max(500).optional().describe("Group description"),
  servers: z.array(z.string()).optional().describe("Initial server names to add")
}).strict();

server.registerTool(
  "mcphub_create_group",
  {
    title: "Create Server Group",
    description: `Create a new server group.

Args:
  - name: Group name (required)
  - description: Group description (optional)
  - servers: Initial server names to add (optional)

Example:
  - Create group: name="production", description="Production MCP servers", servers=["fetch", "slack"]`,
    inputSchema: CreateGroupSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof CreateGroupSchema>) => {
    try {
      const response = await makeApiRequest<{ data: { id: string } }>("groups", "POST", params);
      const groupId = response.data?.id || "unknown";
      return { content: [{ type: "text", text: `Group '${params.name}' created with ID: ${groupId}` }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

const UpdateGroupSchema = z.object({
  id: z.string().min(1).describe("Group ID to update"),
  name: z.string().min(1).max(100).optional().describe("New group name"),
  description: z.string().max(500).optional().describe("New description")
}).strict();

server.registerTool(
  "mcphub_update_group",
  {
    title: "Update Server Group",
    description: `Update a server group's name or description.

Args:
  - id: Group ID to update (required)
  - name: New group name (optional)
  - description: New description (optional)`,
    inputSchema: UpdateGroupSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof UpdateGroupSchema>) => {
    try {
      const { id, ...updates } = params;
      await makeApiRequest(`groups/${encodeURIComponent(id)}`, "PUT", updates);
      return { content: [{ type: "text", text: `Group '${id}' updated successfully.` }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

const DeleteGroupSchema = z.object({
  id: z.string().min(1).describe("Group ID to delete")
}).strict();

server.registerTool(
  "mcphub_delete_group",
  {
    title: "Delete Server Group",
    description: `Delete a server group.

WARNING: This permanently removes the group. Servers in the group are not deleted.

Args:
  - id: Group ID to delete (required)`,
    inputSchema: DeleteGroupSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof DeleteGroupSchema>) => {
    try {
      await makeApiRequest(`groups/${encodeURIComponent(params.id)}`, "DELETE");
      return { content: [{ type: "text", text: `Group '${params.id}' deleted successfully.` }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

const AddServerToGroupSchema = z.object({
  group_id: z.string().min(1).describe("Group ID"),
  server_name: z.string().min(1).describe("Server name to add")
}).strict();

server.registerTool(
  "mcphub_add_server_to_group",
  {
    title: "Add Server to Group",
    description: `Add an MCP server to a group.

Args:
  - group_id: Group ID (required)
  - server_name: Server name to add (required)`,
    inputSchema: AddServerToGroupSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof AddServerToGroupSchema>) => {
    try {
      await makeApiRequest(`groups/${encodeURIComponent(params.group_id)}/servers`, "POST", { serverName: params.server_name });
      return { content: [{ type: "text", text: `Server '${params.server_name}' added to group '${params.group_id}'.` }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

const RemoveServerFromGroupSchema = z.object({
  group_id: z.string().min(1).describe("Group ID"),
  server_name: z.string().min(1).describe("Server name to remove")
}).strict();

server.registerTool(
  "mcphub_remove_server_from_group",
  {
    title: "Remove Server from Group",
    description: `Remove an MCP server from a group.

Args:
  - group_id: Group ID (required)
  - server_name: Server name to remove (required)`,
    inputSchema: RemoveServerFromGroupSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof RemoveServerFromGroupSchema>) => {
    try {
      await makeApiRequest(`groups/${encodeURIComponent(params.group_id)}/servers/${encodeURIComponent(params.server_name)}`, "DELETE");
      return { content: [{ type: "text", text: `Server '${params.server_name}' removed from group '${params.group_id}'.` }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

// ============================================================================
// USER MANAGEMENT TOOLS
// ============================================================================

const ListUsersSchema = z.object({
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN)
}).strict();

server.registerTool(
  "mcphub_list_users",
  {
    title: "List Users",
    description: `List all users in MCPHub.

Args:
  - response_format: Output format ('markdown' or 'json')

Returns:
  List of users with username and admin status.`,
    inputSchema: ListUsersSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof ListUsersSchema>) => {
    try {
      const response = await makeApiRequest<{ data: Array<{ username: string; isAdmin: boolean }> }>("users");
      const users = response.data || [];

      if (!Array.isArray(users) || users.length === 0) {
        return { content: [{ type: "text", text: "No users found." }] };
      }

      let result: string;
      if (params.response_format === ResponseFormat.JSON) {
        result = JSON.stringify({ count: users.length, users }, null, 2);
      } else {
        const lines = [`# Users (${users.length})`, ""];
        for (const user of users) {
          const role = user.isAdmin ? "Admin" : "User";
          lines.push(`- **${user.username}** (${role})`);
        }
        result = lines.join("\n");
      }

      return { content: [{ type: "text", text: result }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

const GetUserSchema = z.object({
  username: z.string().min(1).describe("Username to retrieve"),
  response_format: z.nativeEnum(ResponseFormat).default(ResponseFormat.MARKDOWN)
}).strict();

server.registerTool(
  "mcphub_get_user",
  {
    title: "Get User Details",
    description: `Get detailed information about a user.

Args:
  - username: Username to retrieve (required)
  - response_format: Output format`,
    inputSchema: GetUserSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof GetUserSchema>) => {
    try {
      const response = await makeApiRequest<{ data: { username: string; isAdmin: boolean; groups?: string[] } }>(`users/${encodeURIComponent(params.username)}`);
      const user = response.data;

      let result: string;
      if (params.response_format === ResponseFormat.JSON) {
        result = JSON.stringify(user, null, 2);
      } else {
        const lines = [`# User: ${user.username}`, ""];
        lines.push(`- **Role**: ${user.isAdmin ? "Admin" : "User"}`);
        if (user.groups && user.groups.length > 0) {
          lines.push("", "### Groups");
          for (const group of user.groups) {
            lines.push(`- ${group}`);
          }
        }
        result = lines.join("\n");
      }

      return { content: [{ type: "text", text: result }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

const CreateUserSchema = z.object({
  username: z.string().min(1).max(100).describe("Username"),
  password: z.string().min(6).describe("Password (min 6 characters)"),
  isAdmin: z.boolean().default(false).describe("Grant admin privileges")
}).strict();

server.registerTool(
  "mcphub_create_user",
  {
    title: "Create User",
    description: `Create a new user in MCPHub.

Args:
  - username: Username (required)
  - password: Password, minimum 6 characters (required)
  - isAdmin: Grant admin privileges (default: false)

Example:
  - Create regular user: username="john", password="secret123"
  - Create admin: username="admin2", password="secret123", isAdmin=true`,
    inputSchema: CreateUserSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof CreateUserSchema>) => {
    try {
      await makeApiRequest("users", "POST", params);
      return { content: [{ type: "text", text: `User '${params.username}' created successfully.` }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

const UpdateUserSchema = z.object({
  username: z.string().min(1).describe("Username to update"),
  password: z.string().min(6).optional().describe("New password"),
  isAdmin: z.boolean().optional().describe("Update admin status")
}).strict();

server.registerTool(
  "mcphub_update_user",
  {
    title: "Update User",
    description: `Update a user's password or admin status.

Args:
  - username: Username to update (required)
  - password: New password (optional)
  - isAdmin: Update admin status (optional)`,
    inputSchema: UpdateUserSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof UpdateUserSchema>) => {
    try {
      const { username, ...updates } = params;
      await makeApiRequest(`users/${encodeURIComponent(username)}`, "PUT", updates);
      return { content: [{ type: "text", text: `User '${username}' updated successfully.` }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

const DeleteUserSchema = z.object({
  username: z.string().min(1).describe("Username to delete")
}).strict();

server.registerTool(
  "mcphub_delete_user",
  {
    title: "Delete User",
    description: `Delete a user from MCPHub.

WARNING: This permanently removes the user account.

Args:
  - username: Username to delete (required)`,
    inputSchema: DeleteUserSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  async (params: z.infer<typeof DeleteUserSchema>) => {
    try {
      await makeApiRequest(`users/${encodeURIComponent(params.username)}`, "DELETE");
      return { content: [{ type: "text", text: `User '${params.username}' deleted successfully.` }] };
    } catch (error) {
      return { content: [{ type: "text", text: handleApiError(error) }], isError: true };
    }
  }
);

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCPHub Admin MCP server running via stdio");
  console.error(`API URL: ${API_BASE_URL}`);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
