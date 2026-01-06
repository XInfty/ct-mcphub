# Tool Oracle - LLM-Based Smart Routing

## Overview

Tool Oracle replaces the previous vector search-based smart routing with an LLM-powered tool discovery and recommendation system. Instead of keyword-based search, the Oracle analyzes your goal contextually and recommends the most relevant tools using GPT-4.

## Key Concepts

### 1. Discovery → Activation → Usage Workflow

```
1. Discovery: Call activate_superpowers(goal="...")
   → Oracle analyzes goal and recommends relevant tools

2. Activation: Call activate_superpowers(action="activate", selection_id="...")
   → Recommended tools become available for your session

3. Usage: Call call_tool(toolName="...", arguments={...})
   → Execute activated tools
```

### 2. Session-Based Tool Persistence

- Activated tools are stored per session
- Tools remain available throughout the session (1 hour TTL)
- Different sessions have independent tool sets
- No interference between concurrent users

### 3. Dynamic Tool Delivery

When using `$smart` group:
- Initially: Only `activate_superpowers` and `call_tool` are available
- After activation: Activated tools appear in the tool list
- Use `tools/list` to see your activated tools

## Usage

### Basic Workflow

```javascript
// Step 1: Discover tools for your goal
{
  "tool": "activate_superpowers",
  "arguments": {
    "goal": "I need to analyze images and extract text from them"
  }
}

// Response includes selection_id and recommendations
{
  "status": "success",
  "selection_id": "a3f8b2c1",
  "recommendations": [
    {
      "tool": "vision-server.analyze_image",
      "reason": "Can analyze images and detect objects, text, and scenes",
      ...
    },
    {
      "tool": "ocr-server.extract_text",
      "reason": "Specialized in extracting text from images using OCR",
      ...
    }
  ]
}

// Step 2: Activate the recommended tools
{
  "tool": "activate_superpowers",
  "arguments": {
    "action": "activate",
    "selection_id": "a3f8b2c1",
    "comment": "Activating image analysis tools"
  }
}

// Step 3: Use activated tools
{
  "tool": "call_tool",
  "arguments": {
    "toolName": "vision-server.analyze_image",
    "arguments": {
      "image_url": "https://example.com/image.jpg"
    }
  }
}
```

### Advanced: Context for Better Recommendations

```javascript
{
  "tool": "activate_superpowers",
  "arguments": {
    "goal": "Process customer support tickets",
    "context": "Tickets come via email, need sentiment analysis and auto-categorization"
  }
}
```

The Oracle will consider both goal and context for more accurate recommendations.

### Group-Specific Discovery

Use `$smart/{group}` to limit discovery to specific server groups:

```javascript
// Only discover tools from "production" group servers
// Connect to group: $smart/production

{
  "tool": "activate_superpowers",
  "arguments": {
    "goal": "Generate PDF reports"
  }
}
```

## Configuration

Tool Oracle requires smart routing to be enabled in system config:

```json
{
  "systemConfig": {
    "smartRouting": {
      "enabled": true,
      "openaiApiKey": "${OPENAI_API_KEY}",
      "openaiApiBaseUrl": "https://api.openai.com/v1",
      "openaiApiEmbeddingModel": "text-embedding-3-small"
    }
  }
}
```

Or via environment variables:

```bash
SMART_ROUTING_ENABLED=true
OPENAI_API_KEY=sk-...
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

## Architecture

### Components

1. **ToolOracle** (`src/services/toolOracle.ts`)
   - LLM-based tool recommendation
   - Fuzzy matching for tool name validation
   - Goal and context analysis

2. **OracleStore** (`src/services/oracleStore.ts`)
   - Session-based tool persistence
   - Selection management
   - Automatic cleanup of expired data

3. **MCP Service Integration** (`src/services/mcpService.ts`)
   - `handleListToolsRequest`: Dynamic tool list per session
   - `handleCallToolRequest`: Activation validation and tool execution

### Data Flow

```
User Request
    ↓
activate_superpowers(goal="...")
    ↓
ToolOracle.discover()
    ↓
GPT-4 Analysis (OpenAI API)
    ↓
Tool Validation & Fuzzy Matching
    ↓
OracleSelection saved in OracleStore
    ↓
Return recommendations + selection_id
    ↓
activate_superpowers(action="activate", selection_id="...")
    ↓
OracleStore.activateTools(sessionId, tools)
    ↓
Tools available via call_tool
```

## Migration from Vector Search

### Before (Vector Search)

```javascript
// Old workflow
{
  "tool": "search_tools",
  "arguments": {
    "query": "image analysis",
    "limit": 10
  }
}

// Then call_tool
{
  "tool": "call_tool",
  "arguments": {
    "toolName": "vision-server.analyze_image",
    "arguments": {...}
  }
}
```

### After (Tool Oracle)

```javascript
// New workflow
{
  "tool": "activate_superpowers",
  "arguments": {
    "goal": "I need to analyze images and extract text from them"
  }
}

// Activate
{
  "tool": "activate_superpowers",
  "arguments": {
    "action": "activate",
    "selection_id": "...",
    "comment": "Activating image tools"
  }
}

// Then call_tool (same as before)
{
  "tool": "call_tool",
  "arguments": {
    "toolName": "vision-server.analyze_image",
    "arguments": {...}
  }
}
```

### Key Differences

1. **Discovery**: Natural language goals vs keyword search
2. **Activation**: Two-step process (discover → activate)
3. **Intelligence**: LLM understands context and intent
4. **Scope**: Broad inclusion - recommends ALL potentially relevant tools

## Benefits

### 1. Better Tool Discovery
- LLM understands user intent beyond keywords
- Context-aware recommendations
- Discovers related tools you might not know about

### 2. Reduced Hallucination
- Only activated tools are available
- Explicit activation prevents accidental tool usage
- Clear separation between discovery and execution

### 3. Session Isolation
- Each user/session has independent tool sets
- No cross-session interference
- Automatic cleanup prevents memory leaks

### 4. Auditability
- Track which tools were recommended
- See why tools were recommended (reasons)
- User comments on activation

## Troubleshooting

### "Tool Oracle not initialized"

Check smart routing configuration:
```bash
# Verify environment variables
echo $SMART_ROUTING_ENABLED
echo $OPENAI_API_KEY

# Or check system config in settings
```

### "No tools available for discovery"

Ensure MCP servers are connected:
```bash
# Check server status via API or UI
# Servers must be in "connected" state
```

### "Tool not activated for your session"

You must activate tools before using them:
```javascript
// First discover and activate
activate_superpowers(goal="...")
activate_superpowers(action="activate", selection_id="...")

// Then use
call_tool(toolName="...")
```

### "Selection not found or expired"

Selections expire after 5 minutes. Re-discover:
```javascript
// If selection expired, call activate_superpowers again
activate_superpowers(goal="...")
```

## Future Enhancements

Potential improvements:

1. **Skill Recommendations**: Add support for skill discovery (like Ptah)
2. **Learning from Usage**: Track which tools are commonly used together
3. **Multi-LLM Support**: Allow different LLM providers
4. **Custom Oracle Prompts**: User-configurable discovery strategies
5. **Tool Combinations**: Suggest tool pipelines for complex workflows

## See Also

- [Smart Routing Configuration](./SMART_ROUTING.md)
- [MCP Service Architecture](./MCP_SERVICE.md)
- [Group-Based Routing](./GROUPS.md)
