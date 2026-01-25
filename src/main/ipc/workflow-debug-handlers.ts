/**
 * Workflow Debug IPC Handlers
 * Wave 9.4.6: Step-by-Step Debugging
 *
 * Provides IPC handlers for workflow debugging operations:
 * - Debug mode control (ON/OFF)
 * - Breakpoint management (add, remove, toggle, list)
 * - Execution control (pause, resume, step-over, continue)
 * - Variable inspection and editing
 * - Debug event forwarding to renderer
 */

import { ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log';
import { WORKFLOW_DEBUG_CHANNELS } from '../../shared/types';
import type { DebugMode } from '../services/workflow/DebugExecutor';
import { DebugExecutor } from '../services/workflow/DebugExecutor';

/**
 * Register all workflow debug IPC handlers
 */
export function registerWorkflowDebugHandlers(): void {
  const debugExecutor = DebugExecutor.getInstance();

  // Forward debug events to renderer
  setupDebugEventForwarding(debugExecutor);

  // Debug mode control
  ipcMain.handle(WORKFLOW_DEBUG_CHANNELS.SET_MODE, (_event, mode: DebugMode) => {
    try {
      debugExecutor.setMode(mode);
      log.info('[IPC] Debug mode set', { mode });
      return { success: true };
    } catch (error) {
      log.error('[IPC] Failed to set debug mode', { error, mode });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(WORKFLOW_DEBUG_CHANNELS.GET_MODE, () => {
    try {
      const mode = debugExecutor.getMode();
      return { success: true, data: mode };
    } catch (error) {
      log.error('[IPC] Failed to get debug mode', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(WORKFLOW_DEBUG_CHANNELS.GET_STATE, () => {
    try {
      const state = debugExecutor.getState();
      const stepMode = debugExecutor.getStepMode();
      return { success: true, data: { state, stepMode } };
    } catch (error) {
      log.error('[IPC] Failed to get debug state', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Breakpoint management
  ipcMain.handle(
    WORKFLOW_DEBUG_CHANNELS.ADD_BREAKPOINT,
    (_event, nodeId: string, enabled?: boolean) => {
      try {
        debugExecutor.addBreakpoint(nodeId, enabled);
        log.info('[IPC] Breakpoint added', { nodeId, enabled });
        return { success: true };
      } catch (error) {
        log.error('[IPC] Failed to add breakpoint', { error, nodeId });
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  ipcMain.handle(WORKFLOW_DEBUG_CHANNELS.REMOVE_BREAKPOINT, (_event, nodeId: string) => {
    try {
      debugExecutor.removeBreakpoint(nodeId);
      log.info('[IPC] Breakpoint removed', { nodeId });
      return { success: true };
    } catch (error) {
      log.error('[IPC] Failed to remove breakpoint', { error, nodeId });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(WORKFLOW_DEBUG_CHANNELS.TOGGLE_BREAKPOINT, (_event, nodeId: string) => {
    try {
      debugExecutor.toggleBreakpoint(nodeId);
      log.info('[IPC] Breakpoint toggled', { nodeId });
      return { success: true };
    } catch (error) {
      log.error('[IPC] Failed to toggle breakpoint', { error, nodeId });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(WORKFLOW_DEBUG_CHANNELS.GET_BREAKPOINTS, () => {
    try {
      const breakpoints = debugExecutor.getBreakpoints();
      return { success: true, data: breakpoints };
    } catch (error) {
      log.error('[IPC] Failed to get breakpoints', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(WORKFLOW_DEBUG_CHANNELS.CLEAR_BREAKPOINTS, () => {
    try {
      debugExecutor.clearAllBreakpoints();
      log.info('[IPC] All breakpoints cleared');
      return { success: true };
    } catch (error) {
      log.error('[IPC] Failed to clear breakpoints', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Execution control
  ipcMain.handle(WORKFLOW_DEBUG_CHANNELS.PAUSE, () => {
    try {
      debugExecutor.pause();
      log.info('[IPC] Pause requested');
      return { success: true };
    } catch (error) {
      log.error('[IPC] Failed to pause', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(WORKFLOW_DEBUG_CHANNELS.RESUME, () => {
    try {
      debugExecutor.resume();
      log.info('[IPC] Resume requested');
      return { success: true };
    } catch (error) {
      log.error('[IPC] Failed to resume', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(WORKFLOW_DEBUG_CHANNELS.STEP_OVER, () => {
    try {
      debugExecutor.stepOver();
      log.info('[IPC] Step over requested');
      return { success: true };
    } catch (error) {
      log.error('[IPC] Failed to step over', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(WORKFLOW_DEBUG_CHANNELS.CONTINUE, () => {
    try {
      debugExecutor.continue();
      log.info('[IPC] Continue requested');
      return { success: true };
    } catch (error) {
      log.error('[IPC] Failed to continue', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Variable inspection
  ipcMain.handle(WORKFLOW_DEBUG_CHANNELS.GET_CONTEXT, () => {
    try {
      const context = debugExecutor.getCurrentContext();
      return { success: true, data: context };
    } catch (error) {
      log.error('[IPC] Failed to get debug context', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(WORKFLOW_DEBUG_CHANNELS.SET_VARIABLE, (_event, path: string, value: unknown) => {
    try {
      debugExecutor.setVariable(path, value);
      log.info('[IPC] Variable set', { path, value });
      return { success: true };
    } catch (error) {
      log.error('[IPC] Failed to set variable', { error, path });
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  log.info('[IPC] Workflow debug handlers registered');
}

/**
 * Forward debug events from DebugExecutor to renderer process
 */
function setupDebugEventForwarding(debugExecutor: DebugExecutor): void {
  debugExecutor.on('paused', (context) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send(WORKFLOW_DEBUG_CHANNELS.PAUSED, context);
    });
  });

  debugExecutor.on('resumed', (workflowId: string, nodeId: string) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send(WORKFLOW_DEBUG_CHANNELS.RESUMED, { workflowId, nodeId });
    });
  });

  debugExecutor.on('breakpointAdded', (nodeId: string) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send(WORKFLOW_DEBUG_CHANNELS.BREAKPOINT_ADDED, { nodeId });
    });
  });

  debugExecutor.on('breakpointRemoved', (nodeId: string) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send(WORKFLOW_DEBUG_CHANNELS.BREAKPOINT_REMOVED, { nodeId });
    });
  });

  debugExecutor.on('breakpointToggled', (nodeId: string, enabled: boolean) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send(WORKFLOW_DEBUG_CHANNELS.BREAKPOINT_TOGGLED, { nodeId, enabled });
    });
  });

  debugExecutor.on('modeChanged', (mode: string) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send(WORKFLOW_DEBUG_CHANNELS.MODE_CHANGED, { mode });
    });
  });

  debugExecutor.on('variableChanged', (path: string, value: unknown) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window) => {
      window.webContents.send(WORKFLOW_DEBUG_CHANNELS.VARIABLE_CHANGED, { path, value });
    });
  });

  log.info('[IPC] Debug event forwarding setup complete');
}
