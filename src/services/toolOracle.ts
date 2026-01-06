/**
 * Tool Oracle - LLM-based tool discovery and recommendation
 *
 * Analyzes user goals and recommends relevant tools from available MCP servers.
 */

import OpenAI from 'openai';
import { getSmartRoutingConfig } from '../utils/smartRouting.js';
import { Tool } from '../types/index.js';
import { OracleStore, ToolSelection, OracleSelection, DEFAULT_TTL } from './oracleStore.js';
import { v4 as uuidv4 } from 'uuid';

interface OracleRecommendation {
  tool: string;
  reason: string;
}

export class ToolOracle {
  private static instance: ToolOracle;
  private openai: OpenAI | null = null;
  private store: OracleStore;

  private constructor() {
    this.store = OracleStore.getInstance();
    this.initializeOpenAI();
  }

  static getInstance(): ToolOracle {
    if (!ToolOracle.instance) {
      ToolOracle.instance = new ToolOracle();
    }
    return ToolOracle.instance;
  }

  private initializeOpenAI(): void {
    const config = getSmartRoutingConfig();

    if (!config.enabled || !config.openaiApiKey) {
      console.warn('Tool Oracle not enabled or OpenAI API key not configured');
      return;
    }

    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
      baseURL: config.openaiApiBaseUrl,
    });

    console.log('Tool Oracle initialized with OpenAI');
  }

  /**
   * Discover tools based on user goal
   */
  async discover(
    sessionId: string,
    goal: string,
    availableTools: Tool[],
    context: string = ''
  ): Promise<{ selectionId: string; recommendations: ToolSelection[] }> {
    if (!this.openai) {
      throw new Error('Tool Oracle not initialized. Check smart routing configuration.');
    }

    if (!goal || goal.trim().length === 0) {
      throw new Error('Goal is required for tool discovery');
    }

    if (!availableTools || availableTools.length === 0) {
      throw new Error('No available tools to recommend from');
    }

    console.log(`[Tool Oracle] Discovering tools for goal: "${goal}"`);
    console.log(`[Tool Oracle] Available tools count: ${availableTools.length}`);

    // Format tools for Oracle prompt
    const toolsPrompt = this.formatToolsForOracle(availableTools);

    // Create system prompt
    const systemPrompt = this.createSystemPrompt(toolsPrompt);

    // Create user prompt
    const userPrompt = this.createUserPrompt(goal, context);

    // Call OpenAI
    let recommendations: OracleRecommendation[];
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from Oracle');
      }

      console.log(`[Tool Oracle] Raw response: ${content.substring(0, 500)}...`);

      const parsed = JSON.parse(content);
      recommendations = parsed.recommendations || [];

      console.log(`[Tool Oracle] Parsed ${recommendations.length} recommendations`);
    } catch (error) {
      console.error('[Tool Oracle] Error calling OpenAI:', error);
      throw new Error(`Oracle failed: ${error}`);
    }

    // Validate and enrich recommendations
    const validatedTools = this.validateRecommendations(recommendations, availableTools);

    console.log(`[Tool Oracle] Validated ${validatedTools.length} tools`);

    // Create selection
    const selectionId = uuidv4().substring(0, 8);
    const selection: OracleSelection = {
      id: selectionId,
      sessionId,
      goal,
      tools: validatedTools,
      status: 'pending',
      comment: '',
      createdAt: Date.now(),
      ttlSeconds: DEFAULT_TTL,
    };

    this.store.saveSelection(selection);

    return {
      selectionId,
      recommendations: validatedTools,
    };
  }

  /**
   * Activate tools from a selection
   */
  activate(selectionId: string, comment: string = ''): ToolSelection[] {
    const selection = this.store.getSelection(selectionId);

    if (!selection) {
      throw new Error(`Selection '${selectionId}' not found or expired`);
    }

    // Update selection status
    this.store.updateSelectionStatus(selectionId, 'accepted', comment);

    // Activate tools for the session
    this.store.activateTools(selection.sessionId, selection.tools);

    console.log(
      `[Tool Oracle] Activated ${selection.tools.length} tools for session ${selection.sessionId}`
    );

    return selection.tools;
  }

  /**
   * Get activated tools for a session
   */
  getActivatedTools(sessionId: string): ToolSelection[] {
    return this.store.getActivatedTools(sessionId);
  }

  /**
   * Check if a tool is activated for a session
   */
  isToolActivated(sessionId: string, toolName: string): boolean {
    return this.store.isToolActivated(sessionId, toolName);
  }

  /**
   * Format tools for Oracle prompt
   */
  private formatToolsForOracle(tools: Tool[]): string {
    const lines: string[] = [];

    for (const tool of tools) {
      lines.push(`### ${tool.name}`);
      if (tool.description) {
        lines.push(`**Description**: ${tool.description}`);
      }

      // Add input schema summary
      if (tool.inputSchema?.properties) {
        const params = Object.keys(tool.inputSchema.properties);
        if (params.length > 0) {
          lines.push(`**Parameters**: ${params.slice(0, 5).join(', ')}${params.length > 5 ? '...' : ''}`);
        }
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Create system prompt for Oracle
   */
  private createSystemPrompt(toolsPrompt: string): string {
    return `You are a Tool Oracle - an expert system that recommends the most relevant MCP tools for a given goal.

# Your Task

Analyze the user's goal and recommend ALL potentially relevant tools from the available tools list.
Use a BROAD inclusion strategy - recommend any tool that could help achieve the goal.

# Available Tools

${toolsPrompt}

# Response Format

Return a JSON object with this structure:
{
  "recommendations": [
    {
      "tool": "exact_tool_name",
      "reason": "brief explanation why this tool is relevant"
    }
  ]
}

# Guidelines

1. **Exact Names**: Use the EXACT tool name as shown in the available tools list
2. **Broad Inclusion**: Recommend ALL tools that could be relevant, even tangentially
3. **Clear Reasons**: Explain briefly why each tool helps achieve the goal
4. **No Hallucination**: Only recommend tools from the available list above
5. **Prioritize**: Put most relevant tools first, but include all potentially useful ones

Remember: It's better to recommend too many tools than to miss a useful one. The user will decide which to use.`;
  }

  /**
   * Create user prompt
   */
  private createUserPrompt(goal: string, context: string): string {
    let prompt = `# Goal\n\n${goal}`;

    if (context && context.trim().length > 0) {
      prompt += `\n\n# Additional Context\n\n${context}`;
    }

    prompt += '\n\nRecommend all relevant tools that could help achieve this goal.';

    return prompt;
  }

  /**
   * Validate recommendations against available tools
   */
  private validateRecommendations(
    recommendations: OracleRecommendation[],
    availableTools: Tool[]
  ): ToolSelection[] {
    const validated: ToolSelection[] = [];
    const toolMap = new Map(availableTools.map((t) => [t.name, t]));

    for (const rec of recommendations) {
      const toolName = rec.tool;
      const tool = toolMap.get(toolName);

      if (!tool) {
        // Try fuzzy match
        const fuzzyMatch = this.findFuzzyMatch(toolName, availableTools);
        if (fuzzyMatch) {
          console.log(`[Tool Oracle] Fuzzy matched: ${toolName} -> ${fuzzyMatch.name}`);
          validated.push({
            tool: fuzzyMatch.name,
            reason: rec.reason,
            schema: {
              name: fuzzyMatch.name,
              description: fuzzyMatch.description || '',
              inputSchema: fuzzyMatch.inputSchema || {},
            },
          });
        } else {
          console.warn(`[Tool Oracle] Tool not found and no fuzzy match: ${toolName}`);
        }
        continue;
      }

      validated.push({
        tool: tool.name,
        reason: rec.reason,
        schema: {
          name: tool.name,
          description: tool.description || '',
          inputSchema: tool.inputSchema || {},
        },
      });
    }

    return validated;
  }

  /**
   * Find fuzzy match for a tool name
   */
  private findFuzzyMatch(hallucinated: string, tools: Tool[]): Tool | null {
    const keywords = hallucinated
      .toLowerCase()
      .replace(/[-_.]/g, ' ')
      .split(' ')
      .filter((k) => k.length > 2);

    let bestMatch: Tool | null = null;
    let bestScore = 0;

    for (const tool of tools) {
      const toolName = tool.name.toLowerCase();
      let score = 0;

      for (const keyword of keywords) {
        if (toolName.includes(keyword)) {
          score += 1;
        }
      }

      if (score > bestScore && score >= 2) {
        bestScore = score;
        bestMatch = tool;
      }
    }

    return bestMatch;
  }
}
