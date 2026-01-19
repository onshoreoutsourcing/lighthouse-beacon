import { ipcMain, dialog } from 'electron';
import type {
  DirectoryContents,
  DirectorySelection,
  FileContents,
  Result,
  WriteFileOptions,
} from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { FileSystemService } from '../services/FileSystemService';

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

  // eslint-disable-next-line no-console
  console.log('File system IPC handlers registered');
}

/**
 * Unregister all file system IPC handlers
 * Call this during app cleanup
 */
export function unregisterFileSystemHandlers(): void {
  ipcMain.removeHandler(IPC_CHANNELS.DIR_SELECT);
  ipcMain.removeHandler(IPC_CHANNELS.FS_READ_DIR);
  ipcMain.removeHandler(IPC_CHANNELS.FS_READ_FILE);
  ipcMain.removeHandler(IPC_CHANNELS.FS_WRITE_FILE);

  fileSystemService = null;

  // eslint-disable-next-line no-console
  console.log('File system IPC handlers unregistered');
}
