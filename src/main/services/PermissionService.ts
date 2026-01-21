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
import { setTimeout, clearTimeout } from 'node:timers';
import type {
  PermissionLevel,
  PermissionRequest,
  PermissionResponse,
  PermissionDecision,
  SessionTrustState,
  ToolRiskLevel,
} from '@shared/types';
import { PermissionLevel as PL, PermissionDecision as PD } from '@shared/types';
import { logger } from '@main/logger';

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
  private saveTimeout?: NodeJS.Timeout;
  private readonly SAVE_DEBOUNCE_MS = 1000; // 1 second debounce

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
      logger.info('[PermissionService] Initialized with persisted permissions', {
        permissionCount: this.permissions.size,
      });
    } catch {
      logger.info('[PermissionService] Initialized with default permissions (no persisted file)', {
        permissionCount: this.permissions.size,
      });
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
        logger.warn('[PermissionService] Unknown permissions file version, using defaults', {
          version: persisted.version,
        });
        return;
      }

      // Validate permission values
      for (const [toolName, level] of Object.entries(persisted.permissions)) {
        if (level === PL.ALWAYS_ALLOW || level === PL.PROMPT || level === PL.ALWAYS_DENY) {
          this.permissions.set(toolName, level);
        } else {
          logger.warn('[PermissionService] Invalid permission level, using default', {
            toolName,
            invalidLevel: String(level),
          });
        }
      }

      logger.info('[PermissionService] Loaded permissions from disk', {
        permissionCount: this.permissions.size,
      });
    } catch (error) {
      // File doesn't exist or is corrupt - use defaults
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warn('[PermissionService] Failed to load permissions file', {
          error: error instanceof Error ? error.message : String(error),
        });
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

      logger.info('[PermissionService] Saved permissions to disk', {
        permissionCount: this.permissions.size,
        filePath,
      });
    } catch (error) {
      logger.error('[PermissionService] Failed to save permissions', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
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
    const startTime = Date.now();

    // Check session trust first
    if (this.sessionTrust.has(toolName)) {
      const duration = Date.now() - startTime;
      logger.info('[PermissionService] Session trust granted', {
        toolName,
        duration,
      });
      return PD.APPROVED;
    }

    // Get permission level for this tool
    const permissionLevel = this.permissions.get(toolName) ?? PL.PROMPT;

    // ALWAYS_ALLOW: Auto-approve
    if (permissionLevel === PL.ALWAYS_ALLOW) {
      const duration = Date.now() - startTime;
      logger.info('[PermissionService] Auto-approved', {
        toolName,
        reason: 'ALWAYS_ALLOW permission level',
        duration,
      });
      return PD.APPROVED;
    }

    // ALWAYS_DENY: Auto-deny
    if (permissionLevel === PL.ALWAYS_DENY) {
      const duration = Date.now() - startTime;
      logger.warn('[PermissionService] Auto-denied', {
        toolName,
        reason: 'ALWAYS_DENY permission level',
        duration,
      });
      return PD.DENIED;
    }

    // PROMPT: Request user approval
    return this.requestUserPermission(
      toolName,
      parameters,
      riskLevel,
      allowSessionTrust,
      startTime
    );
  }

  /**
   * Request permission from user via UI
   *
   * @param toolName - Tool name
   * @param parameters - Tool parameters
   * @param riskLevel - Risk level
   * @param allowSessionTrust - Whether session trust option should be shown
   * @param startTime - Time when permission check started
   * @returns Promise resolving to user decision
   */
  private async requestUserPermission(
    toolName: string,
    parameters: Record<string, unknown>,
    riskLevel: ToolRiskLevel,
    allowSessionTrust: boolean,
    startTime: number
  ): Promise<PermissionDecision> {
    if (!this.requestCallback) {
      const duration = Date.now() - startTime;
      logger.error('[PermissionService] No request callback set - denying by default', {
        toolName,
        duration,
      });
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

      const timeout = setTimeout(() => {
        const duration = Date.now() - startTime;
        logger.warn('[PermissionService] Permission request timeout', {
          toolName,
          requestId: request.id,
          timeoutMs: PERMISSION_TIMEOUT_MS,
          duration,
        });

        // Warn if decision took longer than 30 seconds
        if (duration > 30000) {
          logger.warn('[PermissionService] Slow permission decision detected', {
            toolName,
            requestId: request.id,
            duration,
            threshold: 30000,
            reason: 'User did not respond within 30 seconds',
          });
        }

        this.pendingRequests.delete(request.id);
        resolve(PD.TIMEOUT);
      }, PERMISSION_TIMEOUT_MS);

      // Store pending request with startTime for tracking
      this.pendingRequests.set(request.id, {
        request,
        resolve: (decision: PermissionDecision) => {
          const duration = Date.now() - startTime;

          // Warn if decision took longer than 30 seconds
          if (duration > 30000) {
            logger.warn('[PermissionService] Slow permission decision detected', {
              toolName,
              requestId: request.id,
              duration,
              threshold: 30000,
              decision,
            });
          } else {
            logger.info('[PermissionService] Permission decision timing', {
              toolName,
              requestId: request.id,
              duration,
              decision,
            });
          }

          resolve(decision);
        },
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
      logger.warn('[PermissionService] Received response for unknown request', {
        requestId: response.requestId,
      });
      return;
    }

    // Clear timeout

    clearTimeout(pending.timeout);

    // Remove from pending
    this.pendingRequests.delete(response.requestId);

    // Handle session trust if approved
    if (response.decision === PD.APPROVED && response.trustForSession) {
      this.grantSessionTrust(pending.request.toolName);
    }

    // Log decision
    logger.info('[PermissionService] Permission decision received', {
      toolName: pending.request.toolName,
      decision: response.decision,
      trustForSession: response.trustForSession || false,
    });

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
    logger.info('[PermissionService] Session trust granted', {
      toolName,
    });
  }

  /**
   * Clear session trust for a tool (or all tools)
   *
   * @param toolName - Tool to clear trust for (undefined = all)
   */
  clearSessionTrust(toolName?: string): void {
    if (toolName) {
      this.sessionTrust.delete(toolName);
      logger.info('[PermissionService] Cleared session trust', {
        toolName,
      });
    } else {
      this.sessionTrust.clear();
      logger.info('[PermissionService] Cleared all session trust');
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
  setPermissionLevel(toolName: string, level: PermissionLevel): void {
    this.permissions.set(toolName, level);
    logger.info('[PermissionService] Set permission level', {
      toolName,
      level,
    });

    // Persist to disk with debouncing to avoid excessive writes
    this.debouncedSavePermissions();
  }

  /**
   * Debounced save to avoid excessive disk writes during rapid permission changes
   */
  private debouncedSavePermissions(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      void this.savePermissions();
      this.saveTimeout = undefined;
    }, this.SAVE_DEBOUNCE_MS);
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
      clearTimeout(pending.timeout);
      pending.resolve(PD.DENIED);
    }
    this.pendingRequests.clear();

    // Clear session trust
    this.sessionTrust.clear();

    logger.info('[PermissionService] Shutdown complete', {
      clearedPendingRequests: this.pendingRequests.size,
    });
  }
}
