/**
 * Permission Store
 *
 * Manages permission request state for AI tool operations.
 * Handles incoming permission requests from main process and coordinates user responses.
 *
 * Features:
 * - Single pending request at a time (modal UX)
 * - Session trust state tracking
 * - IPC integration for requests/responses
 * - Auto-cleanup of event listeners
 *
 * Usage:
 * const { pendingRequest, approvePermission, denyPermission } = usePermissionStore();
 */

import { create } from 'zustand';
import type { PermissionRequest, PermissionResponse } from '@shared/types';
import { PermissionDecision } from '@shared/types';

/**
 * Permission state interface
 */
interface PermissionState {
  // State
  /** Currently pending permission request (null if none) */
  pendingRequest: PermissionRequest | null;
  /** Session trust settings per tool type */
  sessionTrust: Set<string>;

  // Actions
  /** Show permission prompt with request */
  showPermissionPrompt: (request: PermissionRequest) => void;
  /** Approve current permission request */
  approvePermission: (trustForSession: boolean) => Promise<void>;
  /** Deny current permission request */
  denyPermission: () => Promise<void>;
  /** Clear current permission request */
  clearRequest: () => void;
  /** Check if tool type is trusted */
  isTrusted: (toolName: string) => boolean;
  /** Clear session trust (all or specific tool) */
  clearSessionTrust: (toolName?: string) => void;
}

/**
 * Permission store for managing permission UI state
 */
export const usePermissionStore = create<PermissionState>((set, get) => ({
  // Initial state
  pendingRequest: null,
  sessionTrust: new Set<string>(),

  /**
   * Show permission prompt
   *
   * @param request - Permission request from main process
   */
  showPermissionPrompt: (request: PermissionRequest) => {
    // Check if already trusted
    if (get().sessionTrust.has(request.toolName)) {
      // Auto-approve trusted operations
      void window.electronAPI.tools.respondToPermission({
        requestId: request.id,
        decision: PermissionDecision.APPROVED,
        trustForSession: false, // Already trusted
      });
      return;
    }

    // Show prompt for user decision
    set({ pendingRequest: request });
  },

  /**
   * Approve current permission request
   *
   * @param trustForSession - Whether to trust this tool type for the session
   */
  approvePermission: async (trustForSession: boolean) => {
    const { pendingRequest } = get();
    if (!pendingRequest) {
      return;
    }

    // Update session trust if requested
    if (trustForSession) {
      set((state) => ({
        sessionTrust: new Set(state.sessionTrust).add(pendingRequest.toolName),
      }));
    }

    // Send approval to main process
    const response: PermissionResponse = {
      requestId: pendingRequest.id,
      decision: PermissionDecision.APPROVED,
      trustForSession,
    };

    const result = await window.electronAPI.tools.respondToPermission(response);

    if (!result.success) {
      console.error('Failed to send permission response:', result.error);
    }

    // Clear pending request
    set({ pendingRequest: null });
  },

  /**
   * Deny current permission request
   */
  denyPermission: async () => {
    const { pendingRequest } = get();
    if (!pendingRequest) {
      return;
    }

    // Send denial to main process
    const response: PermissionResponse = {
      requestId: pendingRequest.id,
      decision: PermissionDecision.DENIED,
      trustForSession: false,
    };

    const result = await window.electronAPI.tools.respondToPermission(response);

    if (!result.success) {
      console.error('Failed to send permission response:', result.error);
    }

    // Clear pending request
    set({ pendingRequest: null });
  },

  /**
   * Clear current permission request without responding
   * (used for cleanup scenarios)
   */
  clearRequest: () => {
    set({ pendingRequest: null });
  },

  /**
   * Check if tool type is trusted for this session
   *
   * @param toolName - Tool name to check
   * @returns True if trusted
   */
  isTrusted: (toolName: string) => {
    return get().sessionTrust.has(toolName);
  },

  /**
   * Clear session trust
   *
   * @param toolName - Optional tool name (undefined = clear all)
   */
  clearSessionTrust: (toolName?: string) => {
    if (toolName) {
      set((state) => {
        const newTrust = new Set(state.sessionTrust);
        newTrust.delete(toolName);
        return { sessionTrust: newTrust };
      });
    } else {
      set({ sessionTrust: new Set() });
    }
  },
}));

/**
 * Initialize permission store event listeners
 * Call this once during app initialization
 */
export function initializePermissionStore(): () => void {
  // Listen for permission requests from main process
  const cleanup = window.electronAPI.tools.onPermissionRequest((request) => {
    usePermissionStore.getState().showPermissionPrompt(request);
  });

  return cleanup;
}
