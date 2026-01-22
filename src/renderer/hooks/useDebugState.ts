/**
 * useDebugState Hook
 * Wave 9.4.6: Step-by-Step Debugging
 *
 * Custom React hook for managing workflow debugging state.
 * Provides interface to debug executor backend via IPC.
 *
 * Features:
 * - Debug mode control (ON/OFF)
 * - Breakpoint management (add, remove, toggle, list)
 * - Execution control (pause, resume, step-over, continue)
 * - Variable inspection and editing
 * - Real-time debug event subscriptions
 */

import { useState, useEffect, useCallback } from 'react';
import type { DebugMode, DebugState, Breakpoint, DebugContext, StepMode } from '@shared/types';

/**
 * Debug state interface
 */
interface UseDebugStateReturn {
  // State
  debugMode: DebugMode;
  debugState: DebugState;
  stepMode: StepMode;
  breakpoints: Breakpoint[];
  currentContext: DebugContext | null;

  // Actions
  setDebugMode: (mode: DebugMode) => Promise<void>;
  addBreakpoint: (nodeId: string, enabled?: boolean) => Promise<void>;
  removeBreakpoint: (nodeId: string) => Promise<void>;
  toggleBreakpoint: (nodeId: string) => Promise<void>;
  clearAllBreakpoints: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stepOver: () => Promise<void>;
  continue: () => Promise<void>;
  setVariable: (path: string, value: unknown) => Promise<void>;

  // Utilities
  hasBreakpoint: (nodeId: string) => boolean;
  isBreakpointEnabled: (nodeId: string) => boolean;
  refreshState: () => Promise<void>;
}

/**
 * useDebugState Hook
 */
export const useDebugState = (): UseDebugStateReturn => {
  const [debugMode, setDebugModeState] = useState<DebugMode>('OFF');
  const [debugState, setDebugState] = useState<DebugState>('RUNNING');
  const [stepMode, setStepMode] = useState<StepMode>('NONE');
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);
  const [currentContext, setCurrentContext] = useState<DebugContext | null>(null);

  // Initialize state from backend
  const refreshState = useCallback(async () => {
    try {
      // Get debug mode
      const modeResult = await window.electron.workflowDebug.getMode();
      if (modeResult.success && modeResult.data) {
        setDebugModeState(modeResult.data as DebugMode);
      }

      // Get debug state and step mode
      const stateResult = await window.electron.workflowDebug.getState();
      if (stateResult.success && stateResult.data) {
        const data = stateResult.data as { state: DebugState; stepMode: StepMode };
        setDebugState(data.state);
        setStepMode(data.stepMode);
      }

      // Get breakpoints
      const breakpointsResult = await window.electron.workflowDebug.getBreakpoints();
      if (breakpointsResult.success && breakpointsResult.data) {
        setBreakpoints(breakpointsResult.data as Breakpoint[]);
      }

      // Get current context
      const contextResult = await window.electron.workflowDebug.getContext();
      if (contextResult.success) {
        setCurrentContext((contextResult.data as DebugContext) || null);
      }
    } catch (error) {
      console.error('[useDebugState] Failed to refresh state:', error);
    }
  }, []);

  // Subscribe to debug events
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Mode changed
    unsubscribers.push(
      window.electron.workflowDebug.events.onModeChanged((data: { mode: DebugMode }) => {
        setDebugModeState(data.mode);
      })
    );

    // Paused
    unsubscribers.push(
      window.electron.workflowDebug.events.onPaused((context) => {
        setDebugState('PAUSED');
        setCurrentContext(context);
      })
    );

    // Resumed
    unsubscribers.push(
      window.electron.workflowDebug.events.onResumed(() => {
        setDebugState('RUNNING');
        setCurrentContext(null);
      })
    );

    // Breakpoint added
    unsubscribers.push(
      window.electron.workflowDebug.events.onBreakpointAdded((data: { nodeId: string }) => {
        setBreakpoints((prev) => [
          ...prev.filter((bp) => bp.nodeId !== data.nodeId),
          { nodeId: data.nodeId, enabled: true },
        ]);
      })
    );

    // Breakpoint removed
    unsubscribers.push(
      window.electron.workflowDebug.events.onBreakpointRemoved((data: { nodeId: string }) => {
        setBreakpoints((prev) => prev.filter((bp) => bp.nodeId !== data.nodeId));
      })
    );

    // Breakpoint toggled
    unsubscribers.push(
      window.electron.workflowDebug.events.onBreakpointToggled(
        (data: { nodeId: string; enabled: boolean }) => {
          setBreakpoints((prev) =>
            prev.map((bp) => (bp.nodeId === data.nodeId ? { ...bp, enabled: data.enabled } : bp))
          );
        }
      )
    );

    // Variable changed
    unsubscribers.push(
      window.electron.workflowDebug.events.onVariableChanged(
        (data: { path: string; value: unknown }) => {
          // Update current context with new variable value
          if (currentContext) {
            // Note: This is a simplified update. Full implementation would properly
            // update nested paths in the context.
            console.log('[useDebugState] Variable changed:', data);
          }
        }
      )
    );

    // Initial state refresh
    refreshState();

    // Cleanup subscriptions
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [refreshState]);

  // Set debug mode
  const setDebugMode = useCallback(async (mode: DebugMode) => {
    try {
      const result = await window.electron.workflowDebug.setMode(mode);
      if (!result.success) {
        console.error('[useDebugState] Failed to set debug mode:', result.error);
      }
    } catch (error) {
      console.error('[useDebugState] Failed to set debug mode:', error);
    }
  }, []);

  // Add breakpoint
  const addBreakpoint = useCallback(async (nodeId: string, enabled = true) => {
    try {
      const result = await window.electron.workflowDebug.addBreakpoint(nodeId, enabled);
      if (!result.success) {
        console.error('[useDebugState] Failed to add breakpoint:', result.error);
      }
    } catch (error) {
      console.error('[useDebugState] Failed to add breakpoint:', error);
    }
  }, []);

  // Remove breakpoint
  const removeBreakpoint = useCallback(async (nodeId: string) => {
    try {
      const result = await window.electron.workflowDebug.removeBreakpoint(nodeId);
      if (!result.success) {
        console.error('[useDebugState] Failed to remove breakpoint:', result.error);
      }
    } catch (error) {
      console.error('[useDebugState] Failed to remove breakpoint:', error);
    }
  }, []);

  // Toggle breakpoint
  const toggleBreakpoint = useCallback(async (nodeId: string) => {
    const existingBreakpoint = breakpoints.find((bp) => bp.nodeId === nodeId);

    if (existingBreakpoint) {
      // Toggle or remove
      if (existingBreakpoint.enabled) {
        // If enabled, disable it (toggle)
        try {
          const result = await window.electron.workflowDebug.toggleBreakpoint(nodeId);
          if (!result.success) {
            console.error('[useDebugState] Failed to toggle breakpoint:', result.error);
          }
        } catch (error) {
          console.error('[useDebugState] Failed to toggle breakpoint:', error);
        }
      } else {
        // If disabled, remove it
        await removeBreakpoint(nodeId);
      }
    } else {
      // Add new breakpoint
      await addBreakpoint(nodeId);
    }
  }, [breakpoints, addBreakpoint, removeBreakpoint]);

  // Clear all breakpoints
  const clearAllBreakpoints = useCallback(async () => {
    try {
      const result = await window.electron.workflowDebug.clearBreakpoints();
      if (!result.success) {
        console.error('[useDebugState] Failed to clear breakpoints:', result.error);
      }
    } catch (error) {
      console.error('[useDebugState] Failed to clear breakpoints:', error);
    }
  }, []);

  // Pause execution
  const pause = useCallback(async () => {
    try {
      const result = await window.electron.workflowDebug.pause();
      if (!result.success) {
        console.error('[useDebugState] Failed to pause:', result.error);
      }
    } catch (error) {
      console.error('[useDebugState] Failed to pause:', error);
    }
  }, []);

  // Resume execution
  const resume = useCallback(async () => {
    try {
      const result = await window.electron.workflowDebug.resume();
      if (!result.success) {
        console.error('[useDebugState] Failed to resume:', result.error);
      }
    } catch (error) {
      console.error('[useDebugState] Failed to resume:', error);
    }
  }, []);

  // Step over
  const stepOver = useCallback(async () => {
    try {
      const result = await window.electron.workflowDebug.stepOver();
      if (!result.success) {
        console.error('[useDebugState] Failed to step over:', result.error);
      }
    } catch (error) {
      console.error('[useDebugState] Failed to step over:', error);
    }
  }, []);

  // Continue
  const continueExecution = useCallback(async () => {
    try {
      const result = await window.electron.workflowDebug.continue();
      if (!result.success) {
        console.error('[useDebugState] Failed to continue:', result.error);
      }
    } catch (error) {
      console.error('[useDebugState] Failed to continue:', error);
    }
  }, []);

  // Set variable
  const setVariable = useCallback(async (path: string, value: unknown) => {
    try {
      const result = await window.electron.workflowDebug.setVariable(path, value);
      if (!result.success) {
        console.error('[useDebugState] Failed to set variable:', result.error);
      }
    } catch (error) {
      console.error('[useDebugState] Failed to set variable:', error);
    }
  }, []);

  // Check if node has breakpoint
  const hasBreakpoint = useCallback(
    (nodeId: string): boolean => {
      return breakpoints.some((bp) => bp.nodeId === nodeId);
    },
    [breakpoints]
  );

  // Check if breakpoint is enabled
  const isBreakpointEnabled = useCallback(
    (nodeId: string): boolean => {
      const breakpoint = breakpoints.find((bp) => bp.nodeId === nodeId);
      return breakpoint ? breakpoint.enabled : false;
    },
    [breakpoints]
  );

  return {
    // State
    debugMode,
    debugState,
    stepMode,
    breakpoints,
    currentContext,

    // Actions
    setDebugMode,
    addBreakpoint,
    removeBreakpoint,
    toggleBreakpoint,
    clearAllBreakpoints,
    pause,
    resume,
    stepOver,
    continue: continueExecution,
    setVariable,

    // Utilities
    hasBreakpoint,
    isBreakpointEnabled,
    refreshState,
  };
};
