import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * WindowManager - Manages Electron BrowserWindow lifecycle and configuration
 *
 * Responsibilities:
 * - Create main window with proper security settings
 * - Calculate responsive window sizing (80% of screen, with constraints)
 * - Handle window lifecycle events (ready-to-show, closed)
 * - Support cross-platform window behavior (macOS, Windows, Linux)
 *
 * Security configuration (per ADR-001):
 * - contextIsolation: true
 * - nodeIntegration: false
 * - sandbox: true
 * - DevTools only in development mode
 */
export class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  /**
   * Creates the main application window with responsive sizing and security configuration
   *
   * Window sizing:
   * - 80% of primary display dimensions
   * - Maximum: 1920x1080
   * - Minimum: 1024x768
   *
   * @returns The created BrowserWindow instance
   */
  public createMainWindow(): BrowserWindow {
    const { width, height } = this.calculateWindowSize();

    // Create the browser window with security-first configuration
    this.mainWindow = new BrowserWindow({
      width,
      height,
      minWidth: 1024,
      minHeight: 768,
      webPreferences: {
        // Security configuration (ADR-001: Electron Security)
        preload: path.join(__dirname, '../../preload/index.js'),
        nodeIntegration: false, // Prevent Node.js access in renderer
        contextIsolation: true, // Isolate context for security
        sandbox: true, // Enable sandbox for renderer process
      },
      show: false, // Prevent flickering - show when ready
    });

    this.setupWindowLifecycle();
    this.loadContent();

    return this.mainWindow;
  }

  /**
   * Gets the current main window instance
   *
   * @returns The main window instance or null if not created
   */
  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  /**
   * Destroys the main window and cleans up resources
   */
  public destroy(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.destroy();
    }
    this.mainWindow = null;
  }

  /**
   * Calculates responsive window size based on screen dimensions
   *
   * Strategy:
   * - Use 80% of primary display size
   * - Enforce maximum of 1920x1080
   * - Enforce minimum of 1024x768
   *
   * @returns Object with width and height in pixels
   */
  private calculateWindowSize(): { width: number; height: number } {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    // Calculate 80% of screen size
    const targetWidth = Math.floor(screenWidth * 0.8);
    const targetHeight = Math.floor(screenHeight * 0.8);

    // Apply constraints: min 1024x768, max 1920x1080
    const width = Math.min(Math.max(targetWidth, 1024), 1920);
    const height = Math.min(Math.max(targetHeight, 768), 1080);

    return { width, height };
  }

  /**
   * Sets up window lifecycle event handlers
   *
   * Events:
   * - ready-to-show: Show window to prevent flickering
   * - closed: Clean up window reference
   */
  private setupWindowLifecycle(): void {
    if (!this.mainWindow) {
      return;
    }

    // Show window when ready to prevent flickering
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Clean up reference when window is closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  /**
   * Loads appropriate content based on environment
   *
   * Development: Load from Vite dev server with DevTools
   * Production: Load from built files
   */
  private loadContent(): void {
    if (!this.mainWindow) {
      return;
    }

    // In development, electron-vite should set VITE_DEV_SERVER_URL
    // Fallback to localhost:5173 if not set (development mode detection)
    const devServerUrl =
      process.env['VITE_DEV_SERVER_URL'] ??
      (process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : undefined);

    if (devServerUrl !== undefined) {
      // Development mode: load from Vite dev server
      void this.mainWindow.loadURL(devServerUrl);

      // Open DevTools in development mode only
      this.mainWindow.webContents.openDevTools();
    } else {
      // Production mode: load from built files
      void this.mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
    }
  }
}
