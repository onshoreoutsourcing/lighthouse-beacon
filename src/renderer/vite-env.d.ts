/// <reference types="vite/client" />

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

/**
 * TypeScript declarations for window.electronAPI
 * These types match the API exposed in preload/index.ts via contextBridge
 */
declare global {
  interface Window {
    /**
     * Electron API exposed through preload script
     * Provides secure access to file system and other native operations
     */
    electronAPI: {
      onMenuEvent: (channel: string, callback: () => void) => void;
      removeMenuListener: (channel: string, callback: () => void) => void;
      fileSystem: {
        selectDirectory: () => Promise<Result<DirectorySelection>>;
        readDirectory: (dirPath: string) => Promise<Result<DirectoryContents>>;
        readFile: (filePath: string) => Promise<Result<FileContents>>;
        writeFile: (options: WriteFileOptions) => Promise<Result<string>>;
        selectFile: () => Promise<Result<FileSelection>>;
        showSaveDialog: (defaultPath?: string) => Promise<Result<SaveDialogResult>>;
        createDirectory: (options: CreateFolderOptions) => Promise<Result<string>>;
      };
      versions: {
        node: () => string;
        chrome: () => string;
        electron: () => string;
      };
    };
  }
}
