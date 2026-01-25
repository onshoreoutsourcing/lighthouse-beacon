import { app, BrowserWindow } from 'electron';
import { WindowManager } from './services/WindowManager';
import { MenuService } from './services/MenuService';
import { registerFileSystemHandlers, unregisterFileSystemHandlers } from './ipc/fileSystemHandlers';
import {
  registerConversationHandlers,
  unregisterConversationHandlers,
} from './ipc/conversationHandlers';
import { registerAIHandlers, unregisterAIHandlers } from './ipc/aiHandlers';
import { registerToolHandlers, unregisterToolHandlers } from './ipc/toolHandlers';
import { registerLogHandlers, unregisterLogHandlers } from './ipc/logHandlers';
import { registerWorkflowHandlers, unregisterWorkflowHandlers } from './ipc/workflow-handlers';
import { registerWorkflowDebugHandlers } from './ipc/workflow-debug-handlers';
import { registerVectorHandlers, unregisterVectorHandlers } from './ipc/vector-handlers';
import { registerRAGHandlers, unregisterRAGHandlers } from './ipc/rag-handlers';
import { initializeLogger, logger } from './logger';

// Initialize logger before any other operations
initializeLogger();

// Global reference to WindowManager instance
let windowManager: WindowManager | null = null;

/**
 * Application lifecycle: Handle uncaught exceptions
 * Log errors without crashing to prevent data loss
 */
process.on('uncaughtException', (error) => {
  logger.error('[Main] Uncaught Exception', {
    error: error.message,
    stack: error.stack,
    name: error.name,
  });
});

process.on('unhandledRejection', (reason, _promise) => {
  logger.error('[Main] Unhandled Rejection', {
    reason: String(reason),
    // Promise parameter not logged to avoid [object Object] stringification
  });
});

/**
 * Creates the main application window using WindowManager service
 */
const createMainWindow = (): void => {
  windowManager = new WindowManager();
  windowManager.createMainWindow();
};

/**
 * Application lifecycle: Ready event
 * Called when Electron has finished initialization
 */
void app.whenReady().then(() => {
  // Create application menu
  MenuService.createMenu();

  // Register IPC handlers before creating windows
  registerFileSystemHandlers();
  registerConversationHandlers();
  registerAIHandlers();
  registerToolHandlers();
  registerLogHandlers();
  registerWorkflowHandlers();
  registerWorkflowDebugHandlers();
  registerVectorHandlers();
  registerRAGHandlers();

  createMainWindow();

  /**
   * macOS specific: Re-create window when dock icon is clicked
   * and no other windows are open
   */
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

/**
 * Application lifecycle: All windows closed
 * Quit on Windows/Linux, stay open on macOS (dock behavior)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Application lifecycle: Before quit
 * Clean up resources before application terminates
 */
app.on('before-quit', () => {
  // Unregister IPC handlers
  unregisterFileSystemHandlers();
  unregisterConversationHandlers();
  // Fire-and-forget async cleanup (app is quitting anyway)
  void unregisterAIHandlers();
  unregisterToolHandlers();
  unregisterLogHandlers();
  unregisterWorkflowHandlers();
  unregisterVectorHandlers();
  unregisterRAGHandlers();

  if (windowManager) {
    windowManager.destroy();
    windowManager = null;
  }
});
