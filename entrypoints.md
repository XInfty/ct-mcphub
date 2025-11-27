# Application Entrypoints for MCPHub

## Main Entrypoints
- **Backend**: `src/index.ts` - Main application entry point
- **Frontend**: `frontend/src/main.tsx` - React application entry point
- **CLI**: `bin/cli.js` - Command-line interface

## Server Startup
1. `src/index.ts` imports and initializes `AppServer` from `server.ts`
2. `AppServer.initialize()` sets up:
   - i18n initialization
   - Default user creation
   - Middleware setup
   - Route setup
   - MCP server initialization
   - Frontend serving setup
3. `AppServer.start()` starts the Express server on configured port

## API Endpoints
- **MCP Unified**: `/mcp` - Unified MCP server access
- **MCP Group**: `/mcp/{group}` - Group-specific MCP access
- **MCP Server**: `/mcp/{server}` - Individual server access
- **SSE**: `/sse` - Server-Sent Events endpoint
- **Dashboard**: `/` - Web dashboard (served from frontend build)
- **API**: `/api/*` - REST API endpoints for configuration

## Development Entrypoints
- **Dev Server**: `pnpm dev` - Concurrent backend + frontend
- **Backend Dev**: `pnpm backend:dev` - Backend with tsx watch
- **Frontend Dev**: `pnpm frontend:dev` - Vite dev server

## Docker Entrypoint
- **Container**: `entrypoint.sh` executes the CMD
- **Default CMD**: `pnpm start` runs the built application
- **Dev CMD**: `pnpm dev` for development in container

## Configuration Entrypoints
- **Settings File**: `mcp_settings.json` - MCP server configuration
- **Environment**: `.env` file for environment variables
- **Docker Config**: Mount config files as volumes

## Key Initialization Flow
1. Load configuration from `mcp_settings.json`
2. Initialize database connections
3. Set up MCP server clients based on configuration
4. Start Express server with routes and middleware
5. Serve frontend static files
6. Begin accepting connections