import { contextBridge, ipcRenderer } from 'electron';
import type {
  DirectoryContents,
  DirectorySelection,
  FileContents,
  FileSelection,
  SaveDialogResult,
  CreateFolderOptions,
  Result,
  WriteFileOptions,
} from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';

/**
 * Preload Script - Secure IPC Bridge
 *
 * Exposes a limited, safe API to the renderer process using contextBridge.
 * This prevents the renderer from accessing the full Node.js API and ipcRenderer,
 * following Electron security best practices.
 *
 * All IPC calls use invoke/handle pattern for proper async error handling.
 */

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Menu Event Listeners
   */
  onMenuEvent: (channel: string, callback: () => void) => {
    // Only allow specific menu event channels
    const validChannels = [
      IPC_CHANNELS.MENU_OPEN_FOLDER,
      IPC_CHANNELS.MENU_OPEN_FILE,
      IPC_CHANNELS.MENU_NEW_FILE,
      IPC_CHANNELS.MENU_NEW_FOLDER,
      IPC_CHANNELS.MENU_SAVE,
      IPC_CHANNELS.MENU_SAVE_AS,
      IPC_CHANNELS.MENU_SAVE_ALL,
      IPC_CHANNELS.MENU_CLOSE_FOLDER,
    ];

    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },

  /**
   * Remove menu event listener
   */
  removeMenuListener: (channel: string, callback: () => void) => {
    ipcRenderer.removeListener(channel, callback);
  },

  /**
   * File System Operations
   */
  fileSystem: {
    /**
     * Select a directory using native file picker
     * @returns Selected directory path or null if cancelled
     */
    selectDirectory: (): Promise<Result<DirectorySelection>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.DIR_SELECT);
    },

    /**
     * Read directory contents
     * @param dirPath - Directory path to read
     * @returns Directory contents with file entries
     */
    readDirectory: (dirPath: string): Promise<Result<DirectoryContents>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.FS_READ_DIR, dirPath);
    },

    /**
     * Read file contents
     * @param filePath - File path to read
     * @returns File contents as string
     */
    readFile: (filePath: string): Promise<Result<FileContents>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.FS_READ_FILE, filePath);
    },

    /**
     * Write file contents
     * @param options - Write options (path, content, encoding)
     * @returns Path of written file
     */
    writeFile: (options: WriteFileOptions): Promise<Result<string>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.FS_WRITE_FILE, options);
    },

    /**
     * Select a file using native file picker
     * @returns Selected file path or null if cancelled
     */
    selectFile: (): Promise<Result<FileSelection>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.FILE_SELECT);
    },

    /**
     * Show save file dialog
     * @param defaultPath - Optional default file path
     * @returns Selected save path or null if cancelled
     */
    showSaveDialog: (defaultPath?: string): Promise<Result<SaveDialogResult>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.FILE_SAVE_DIALOG, defaultPath);
    },

    /**
     * Create a new directory
     * @param options - Directory creation options (path, name)
     * @returns Path of created directory
     */
    createDirectory: (options: CreateFolderOptions): Promise<Result<string>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.DIR_CREATE, options);
    },
  },

  /**
   * Version information (legacy support)
   */
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
  },
});

// Log to confirm preload script loaded successfully
// eslint-disable-next-line no-console
console.log('Preload script loaded successfully');
