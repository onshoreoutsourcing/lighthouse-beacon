import { ipcMain, dialog } from 'electron';
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
import { FileSystemService } from '../services/FileSystemService';
import { initializeToolsWithProjectRoot } from './toolHandlers';
import { logger } from '../logger';

/**
 * File System IPC Handlers
 *
 * Registers all IPC handlers for file system operations.
 * Uses ipcMain.handle() for proper async/await and error handling.
 *
 * Security:
 * - All operations go through FileSystemService with path validation
 * - Errors are caught and returned as Result types
 * - Internal paths are not exposed to renderer process
 */

// Singleton instance of FileSystemService
let fileSystemService: FileSystemService | null = null;

/**
 * Get or create FileSystemService instance
 */
function getFileSystemService(): FileSystemService {
  if (!fileSystemService) {
    fileSystemService = new FileSystemService();
  }
  return fileSystemService;
}

/**
 * Register all file system IPC handlers
 * Call this function during app initialization
 */
export function registerFileSystemHandlers(): void {
  const fs = getFileSystemService();

  /**
   * DIR_SELECT: Show native directory picker dialog
   * Returns selected directory path or null if cancelled
   */
  ipcMain.handle(IPC_CHANNELS.DIR_SELECT, async (): Promise<Result<DirectorySelection>> => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Project Directory',
        buttonLabel: 'Select',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return {
          success: true,
          data: {
            path: null,
            canceled: true,
          },
        };
      }

      const selectedPath = result.filePaths[0];
      if (!selectedPath) {
        return {
          success: true,
          data: {
            path: null,
            canceled: true,
          },
        };
      }

      // Set as project root in FileSystemService
      await fs.setProjectRoot(selectedPath);

      // Initialize tools with the new project root
      initializeToolsWithProjectRoot(selectedPath);

      return {
        success: true,
        data: {
          path: selectedPath,
          canceled: false,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  });

  /**
   * FS_READ_DIR: Read directory contents
   * Returns list of files and directories with metadata
   */
  ipcMain.handle(
    IPC_CHANNELS.FS_READ_DIR,
    async (_event, dirPath: string): Promise<Result<DirectoryContents>> => {
      try {
        const contents = await fs.readDirectory(dirPath);
        return {
          success: true,
          data: contents,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to read directory'),
        };
      }
    }
  );

  /**
   * FS_READ_FILE: Read file contents
   * Returns file content as string with encoding info
   */
  ipcMain.handle(
    IPC_CHANNELS.FS_READ_FILE,
    async (_event, filePath: string): Promise<Result<FileContents>> => {
      try {
        const contents = await fs.readFile(filePath);
        return {
          success: true,
          data: contents,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to read file'),
        };
      }
    }
  );

  /**
   * FS_WRITE_FILE: Write file contents
   * Returns path of written file
   */
  ipcMain.handle(
    IPC_CHANNELS.FS_WRITE_FILE,
    async (_event, options: WriteFileOptions): Promise<Result<string>> => {
      try {
        const writtenPath = await fs.writeFile(options);
        return {
          success: true,
          data: writtenPath,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to write file'),
        };
      }
    }
  );

  /**
   * FILE_SELECT: Show native file picker dialog
   * Returns selected file path or null if cancelled
   */
  ipcMain.handle(IPC_CHANNELS.FILE_SELECT, async (): Promise<Result<FileSelection>> => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        title: 'Open File',
        buttonLabel: 'Open',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return {
          success: true,
          data: {
            path: null,
            canceled: true,
          },
        };
      }

      const selectedPath = result.filePaths[0];
      return {
        success: true,
        data: {
          path: selectedPath || null,
          canceled: false,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  });

  /**
   * FILE_SAVE_DIALOG: Show native save file dialog
   * Returns selected save path or null if cancelled
   */
  ipcMain.handle(
    IPC_CHANNELS.FILE_SAVE_DIALOG,
    async (_event, defaultPath?: string): Promise<Result<SaveDialogResult>> => {
      try {
        const result = await dialog.showSaveDialog({
          title: 'Save File As',
          buttonLabel: 'Save',
          defaultPath,
        });

        if (result.canceled || !result.filePath) {
          return {
            success: true,
            data: {
              path: null,
              canceled: true,
            },
          };
        }

        return {
          success: true,
          data: {
            path: result.filePath,
            canceled: false,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Unknown error occurred'),
        };
      }
    }
  );

  /**
   * DIR_CREATE: Create a new directory
   * Returns path of created directory
   */
  ipcMain.handle(
    IPC_CHANNELS.DIR_CREATE,
    async (_event, options: CreateFolderOptions): Promise<Result<string>> => {
      try {
        const fullPath = `${options.path}/${options.name}`;
        const createdPath = await fs.createDirectory(fullPath);
        return {
          success: true,
          data: createdPath,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to create directory'),
        };
      }
    }
  );

  logger.info('[FileSystemHandlers] IPC handlers registered');
}

/**
 * Unregister all file system IPC handlers
 * Call this during app cleanup
 */
export function unregisterFileSystemHandlers(): void {
  ipcMain.removeHandler(IPC_CHANNELS.DIR_SELECT);
  ipcMain.removeHandler(IPC_CHANNELS.DIR_CREATE);
  ipcMain.removeHandler(IPC_CHANNELS.FILE_SELECT);
  ipcMain.removeHandler(IPC_CHANNELS.FILE_SAVE_DIALOG);
  ipcMain.removeHandler(IPC_CHANNELS.FS_READ_DIR);
  ipcMain.removeHandler(IPC_CHANNELS.FS_READ_FILE);
  ipcMain.removeHandler(IPC_CHANNELS.FS_WRITE_FILE);

  fileSystemService = null;

  logger.info('[FileSystemHandlers] IPC handlers unregistered');
}
