import { app, BrowserWindow } from 'electron';
import { WindowManager } from './services/WindowManager';
import { MenuService } from './services/MenuService';
import { registerFileSystemHandlers, unregisterFileSystemHandlers } from './ipc/fileSystemHandlers';

// Global reference to WindowManager instance
let windowManager: WindowManager | null = null;

/**
 * Application lifecycle: Handle uncaught exceptions
 * Log errors without crashing to prevent data loss
 */
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // In production, you might want to log to file or error reporting service
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to log to file or error reporting service
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

  if (windowManager) {
    windowManager.destroy();
    windowManager = null;
  }
});
