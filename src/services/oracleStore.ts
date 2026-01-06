/**
 * Session-based storage for Oracle selections and activated tools.
 *
 * Stores tool selections per session to enable dynamic tool availability.
 */

export type SelectionStatus = 'pending' | 'accepted' | 'denied';

export interface ToolSelection {
  tool: string;
  reason: string;
  schema?: {
    name: string;
    description: string;
    inputSchema: any;
  };
}

export interface OracleSelection {
  id: string;
  sessionId: string;
  goal: string;
  tools: ToolSelection[];
  status: SelectionStatus;
  comment: string;
  createdAt: number;
  ttlSeconds: number;
}

export interface SessionTools {
  sessionId: string;
  activatedTools: Map<string, ToolSelection>;
  lastUpdated: number;
}

const DEFAULT_TTL = 300; // 5 minutes

class OracleStore {
  private static instance: OracleStore;

  // Store selections by selection ID
  private selections: Map<string, OracleSelection> = new Map();

  // Store activated tools per session
  private sessionTools: Map<string, SessionTools> = new Map();

  private constructor() {
    // Start cleanup interval
    this.startCleanupInterval();
  }

  static getInstance(): OracleStore {
    if (!OracleStore.instance) {
      OracleStore.instance = new OracleStore();
    }
    return OracleStore.instance;
  }

  /**
   * Save a selection
   */
  saveSelection(selection: OracleSelection): void {
    this.selections.set(selection.id, selection);
  }

  /**
   * Get a selection by ID
   */
  getSelection(selectionId: string): OracleSelection | null {
    const selection = this.selections.get(selectionId);

    if (!selection) {
      return null;
    }

    // Check if expired
    if (this.isExpired(selection)) {
      this.selections.delete(selectionId);
      return null;
    }

    return selection;
  }

  /**
   * Update selection status
   */
  updateSelectionStatus(
    selectionId: string,
    status: SelectionStatus,
    comment: string = ''
  ): boolean {
    const selection = this.selections.get(selectionId);

    if (!selection) {
      return false;
    }

    selection.status = status;
    selection.comment = comment;

    return true;
  }

  /**
   * Activate tools for a session
   */
  activateTools(sessionId: string, tools: ToolSelection[]): void {
    let sessionData = this.sessionTools.get(sessionId);

    if (!sessionData) {
      sessionData = {
        sessionId,
        activatedTools: new Map(),
        lastUpdated: Date.now(),
      };
      this.sessionTools.set(sessionId, sessionData);
    }

    // Add all tools to the session
    for (const tool of tools) {
      sessionData.activatedTools.set(tool.tool, tool);
    }

    sessionData.lastUpdated = Date.now();

    console.log(`Activated ${tools.length} tools for session ${sessionId}`);
  }

  /**
   * Get activated tools for a session
   */
  getActivatedTools(sessionId: string): ToolSelection[] {
    const sessionData = this.sessionTools.get(sessionId);

    if (!sessionData) {
      return [];
    }

    return Array.from(sessionData.activatedTools.values());
  }

  /**
   * Check if a tool is activated for a session
   */
  isToolActivated(sessionId: string, toolName: string): boolean {
    const sessionData = this.sessionTools.get(sessionId);

    if (!sessionData) {
      return false;
    }

    return sessionData.activatedTools.has(toolName);
  }

  /**
   * Clear activated tools for a session
   */
  clearSessionTools(sessionId: string): void {
    this.sessionTools.delete(sessionId);
    console.log(`Cleared activated tools for session ${sessionId}`);
  }

  /**
   * Get all pending selections
   */
  listPendingSelections(): OracleSelection[] {
    const pending: OracleSelection[] = [];

    for (const selection of this.selections.values()) {
      if (selection.status === 'pending' && !this.isExpired(selection)) {
        pending.push(selection);
      }
    }

    return pending;
  }

  /**
   * Check if selection is expired
   */
  private isExpired(selection: OracleSelection): boolean {
    return Date.now() > (selection.createdAt + selection.ttlSeconds * 1000);
  }

  /**
   * Cleanup expired selections and old session tools
   */
  private cleanup(): void {
    const now = Date.now();

    // Cleanup expired selections
    for (const [id, selection] of this.selections.entries()) {
      if (this.isExpired(selection)) {
        this.selections.delete(id);
      }
    }

    // Cleanup old session tools (inactive for more than 1 hour)
    const SESSION_TTL = 60 * 60 * 1000; // 1 hour

    for (const [sessionId, sessionData] of this.sessionTools.entries()) {
      if (now - sessionData.lastUpdated > SESSION_TTL) {
        this.sessionTools.delete(sessionId);
        console.log(`Cleaned up expired session tools for session ${sessionId}`);
      }
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanupInterval(): void {
    // Run cleanup every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }
}

export { OracleStore, DEFAULT_TTL };
