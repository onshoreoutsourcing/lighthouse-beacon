/**
 * PermissionService
 *
 * Manages tool execution permissions and user approval flow.
 * Implements three-tier permission system: ALWAYS_ALLOW, PROMPT, ALWAYS_DENY
 * with optional session trust for eligible operations.
 *
 * Permission Tiers:
 * - Read/glob/grep: ALWAYS_ALLOW (auto-approved)
 * - Write/edit: PROMPT with session trust option
 * - Delete/bash: ALWAYS_PROMPT (no session trust)
 *
 * Features:
 * - Per-tool permission configuration
 * - Session trust state management
 * - Permission request queueing
 * - Timeout handling (5 minutes)
 * - SOC logging of all decisions
 * - Permission persistence to disk
 *
 * Usage:
 * const service = new PermissionService();
 * await service.initialize(); // Load persisted permissions
 * const granted = await service.checkPermission('write_file', params);
 */

import { app } from 'electron';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type {
  PermissionLevel,
  PermissionRequest,
  PermissionResponse,
  PermissionDecision,
  SessionTrustState,
  ToolRiskLevel,
} from '@shared/types';
import { PermissionLevel as PL, PermissionDecision as PD } from '@shared/types';

/**
 * Default permission configuration for each tool type
 */
const DEFAULT_PERMISSIONS: Record<string, PermissionLevel> = {
  // Low-risk: Always allow
  read_file: PL.ALWAYS_ALLOW,
  glob: PL.ALWAYS_ALLOW,
  grep: PL.ALWAYS_ALLOW,

  // Medium-risk: Prompt with session trust
  write_file: PL.PROMPT,
  edit_file: PL.PROMPT,

  // High-risk: Always prompt (no session trust in config, handled by tool definition)
  delete_file: PL.PROMPT,
  bash: PL.PROMPT,
};

/**
 * Permission request timeout (5 minutes)
 */
const PERMISSION_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Permission persistence file name
 */
const PERMISSIONS_FILE = 'permissions.json';

/**
 * Pending permission request
 */
interface PendingPermissionRequest {
  request: PermissionRequest;
  resolve: (decision: PermissionDecision) => void;
  timeout: NodeJS.Timeout;
}

/**
 * Persisted permission configuration
 */
interface PersistedPermissions {
  version: number;
  permissions: Record<string, PermissionLevel>;
  updatedAt: string;
}

/**
 * Permission service for managing tool execution permissions
 */
export class PermissionService {
  private permissions: Map<string, PermissionLevel> = new Map();
  private sessionTrust: Map<string, SessionTrustState> = new Map();
  private pendingRequests: Map<string, PendingPermissionRequest> = new Map();
  private requestCallback?: (request: PermissionRequest) => void;

  constructor() {
    // Initialize default permissions
    for (const [toolName, level] of Object.entries(DEFAULT_PERMISSIONS)) {
      this.permissions.set(toolName, level);
    }
  }

  /**
   * Initialize service and load persisted permissions
   * Call this after construction before using the service
   */
  async initialize(): Promise<void> {
    try {
      await this.loadPermissions();
      // eslint-disable-next-line no-console
      console.log('[PermissionService] Initialized with persisted permissions');
    } catch {
      // eslint-disable-next-line no-console
      console.log('[PermissionService] Initialized with default permissions (no persisted file)');
    }
  }

  /**
   * Set callback for sending permission requests to UI
   *
   * @param callback - Callback to invoke when permission request is needed
   */
  setRequestCallback(callback: (request: PermissionRequest) => void): void {
    this.requestCallback = callback;
  }

  /**
   * Get path to permissions file
   *
   * @returns Absolute path to permissions.json
   */
  private getPermissionsFilePath(): string {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, PERMISSIONS_FILE);
  }

  /**
   * Load permissions from disk
   * Falls back to defaults if file is missing or corrupt
   */
  private async loadPermissions(): Promise<void> {
    const filePath = this.getPermissionsFilePath();

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const persisted = JSON.parse(fileContent) as PersistedPermissions;

      // Validate schema version
      if (persisted.version !== 1) {
        console.warn('[PermissionService] Unknown permissions file version, using defaults');
        return;
      }

      // Validate permission values
      for (const [toolName, level] of Object.entries(persisted.permissions)) {
        if (level === PL.ALWAYS_ALLOW || level === PL.PROMPT || level === PL.ALWAYS_DENY) {
          this.permissions.set(toolName, level);
        } else {
          console.warn(
            `[PermissionService] Invalid permission level for ${toolName}: ${String(level)}, using default`
          );
        }
      }

      // eslint-disable-next-line no-console
      console.log(`[PermissionService] Loaded ${this.permissions.size} permissions from disk`);
    } catch (error) {
      // File doesn't exist or is corrupt - use defaults
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('[PermissionService] Failed to load permissions file:', error);
      }
      // Defaults already set in constructor
    }
  }

  /**
   * Save current permissions to disk
   */
  private async savePermissions(): Promise<void> {
    const filePath = this.getPermissionsFilePath();

    try {
      // Convert Map to Record for JSON serialization
      const permissionsRecord: Record<string, PermissionLevel> = {};
      for (const [toolName, level] of this.permissions.entries()) {
        permissionsRecord[toolName] = level;
      }

      const persisted: PersistedPermissions = {
        version: 1,
        permissions: permissionsRecord,
        updatedAt: new Date().toISOString(),
      };

      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      // Write atomically by writing to temp file then renaming
      const tempFile = `${filePath}.tmp`;
      await fs.writeFile(tempFile, JSON.stringify(persisted, null, 2), 'utf-8');
      await fs.rename(tempFile, filePath);

      // eslint-disable-next-line no-console
      console.log('[PermissionService] Saved permissions to disk');
    } catch (error) {
      console.error('[PermissionService] Failed to save permissions:', error);
    }
  }

  /**
   * Check if tool execution is permitted
   *
   * @param toolName - Tool requesting permission
   * @param parameters - Tool parameters
   * @param riskLevel - Tool risk level
   * @param allowSessionTrust - Whether session trust is allowed
   * @returns Promise resolving to permission decision
   */
  async checkPermission(
    toolName: string,
    parameters: Record<string, unknown>,
    riskLevel: ToolRiskLevel,
    allowSessionTrust: boolean
  ): Promise<PermissionDecision> {
    // Check session trust first
    if (this.sessionTrust.has(toolName)) {
      // eslint-disable-next-line no-console
      console.log(`[PermissionService] Session trust granted for ${toolName}`);
      return PD.APPROVED;
    }

    // Get permission level for this tool
    const permissionLevel = this.permissions.get(toolName) ?? PL.PROMPT;

    // ALWAYS_ALLOW: Auto-approve
    if (permissionLevel === PL.ALWAYS_ALLOW) {
      // eslint-disable-next-line no-console
      console.log(`[PermissionService] Auto-approved: ${toolName}`);
      return PD.APPROVED;
    }

    // ALWAYS_DENY: Auto-deny
    if (permissionLevel === PL.ALWAYS_DENY) {
      // eslint-disable-next-line no-console
      console.log(`[PermissionService] Auto-denied: ${toolName}`);
      return PD.DENIED;
    }

    // PROMPT: Request user approval
    return this.requestUserPermission(toolName, parameters, riskLevel, allowSessionTrust);
  }

  /**
   * Request permission from user via UI
   *
   * @param toolName - Tool name
   * @param parameters - Tool parameters
   * @param riskLevel - Risk level
   * @param allowSessionTrust - Whether session trust option should be shown
   * @returns Promise resolving to user decision
   */
  private async requestUserPermission(
    toolName: string,
    parameters: Record<string, unknown>,
    riskLevel: ToolRiskLevel,
    allowSessionTrust: boolean
  ): Promise<PermissionDecision> {
    if (!this.requestCallback) {
      console.error('[PermissionService] No request callback set - denying by default');
      return PD.DENIED;
    }

    // Create permission request
    const request: PermissionRequest = {
      id: this.generateRequestId(),
      toolName,
      parameters,
      riskLevel,
      allowSessionTrust,
      timestamp: new Date(),
    };

    // Create promise for user response
    return new Promise<PermissionDecision>((resolve) => {
      // Set up timeout
      // eslint-disable-next-line no-undef
      const timeout = setTimeout(() => {
        // eslint-disable-next-line no-console
        console.log(`[PermissionService] Permission request timeout for ${toolName}`);
        this.pendingRequests.delete(request.id);
        resolve(PD.TIMEOUT);
      }, PERMISSION_TIMEOUT_MS);

      // Store pending request
      this.pendingRequests.set(request.id, {
        request,
        resolve,
        timeout,
      });

      // Send request to UI
      this.requestCallback!(request);
    });
  }

  /**
   * Handle permission response from user
   *
   * @param response - User's permission response
   */
  handlePermissionResponse(response: PermissionResponse): void {
    const pending = this.pendingRequests.get(response.requestId);

    if (!pending) {
      console.warn(
        `[PermissionService] Received response for unknown request: ${response.requestId}`
      );
      return;
    }

    // Clear timeout
    // eslint-disable-next-line no-undef
    clearTimeout(pending.timeout);

    // Remove from pending
    this.pendingRequests.delete(response.requestId);

    // Handle session trust if approved
    if (response.decision === PD.APPROVED && response.trustForSession) {
      this.grantSessionTrust(pending.request.toolName);
    }

    // Log decision
    // eslint-disable-next-line no-console
    console.log(
      `[PermissionService] Permission ${response.decision} for ${pending.request.toolName}` +
        (response.trustForSession ? ' (session trust granted)' : '')
    );

    // Resolve promise
    pending.resolve(response.decision);
  }

  /**
   * Grant session trust for a tool type
   *
   * @param toolName - Tool to trust
   */
  private grantSessionTrust(toolName: string): void {
    this.sessionTrust.set(toolName, {
      toolName,
      grantedAt: new Date(),
    });
    // eslint-disable-next-line no-console
    console.log(`[PermissionService] Session trust granted for ${toolName}`);
  }

  /**
   * Clear session trust for a tool (or all tools)
   *
   * @param toolName - Tool to clear trust for (undefined = all)
   */
  clearSessionTrust(toolName?: string): void {
    if (toolName) {
      this.sessionTrust.delete(toolName);
      // eslint-disable-next-line no-console
      console.log(`[PermissionService] Cleared session trust for ${toolName}`);
    } else {
      this.sessionTrust.clear();
      // eslint-disable-next-line no-console
      console.log('[PermissionService] Cleared all session trust');
    }
  }

  /**
   * Get current session trust state
   *
   * @returns Map of trusted tools
   */
  getSessionTrustState(): Map<string, SessionTrustState> {
    return new Map(this.sessionTrust);
  }

  /**
   * Set permission level for a tool
   *
   * @param toolName - Tool name
   * @param level - Permission level
   */
  async setPermissionLevel(toolName: string, level: PermissionLevel): Promise<void> {
    this.permissions.set(toolName, level);
    // eslint-disable-next-line no-console
    console.log(`[PermissionService] Set permission for ${toolName}: ${level}`);

    // Persist to disk
    await this.savePermissions();
  }

  /**
   * Get permission level for a tool
   *
   * @param toolName - Tool name
   * @returns Permission level (defaults to PROMPT)
   */
  getPermissionLevel(toolName: string): PermissionLevel {
    return this.permissions.get(toolName) ?? PL.PROMPT;
  }

  /**
   * Get all permission settings
   *
   * @returns Record of all tool permissions
   */
  getAllPermissions(): Record<string, PermissionLevel> {
    const result: Record<string, PermissionLevel> = {};
    for (const [toolName, level] of this.permissions.entries()) {
      result[toolName] = level;
    }
    return result;
  }

  /**
   * Generate unique request ID
   *
   * @returns Unique request ID
   */
  private generateRequestId(): string {
    return `perm-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Clean up service (cancel pending requests)
   */
  shutdown(): void {
    // Cancel all pending requests
    for (const pending of this.pendingRequests.values()) {
      // eslint-disable-next-line no-undef
      clearTimeout(pending.timeout);
      pending.resolve(PD.DENIED);
    }
    this.pendingRequests.clear();

    // Clear session trust
    this.sessionTrust.clear();

    // eslint-disable-next-line no-console
    console.log('[PermissionService] Shutdown complete');
  }
}
