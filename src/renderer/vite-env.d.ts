/// <reference types="vite/client" />

import type {
  DirectoryContents,
  DirectorySelection,
  FileContents,
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
      fileSystem: {
        selectDirectory: () => Promise<Result<DirectorySelection>>;
        readDirectory: (dirPath: string) => Promise<Result<DirectoryContents>>;
        readFile: (filePath: string) => Promise<Result<FileContents>>;
        writeFile: (options: WriteFileOptions) => Promise<Result<string>>;
      };
      versions: {
        node: () => string;
        chrome: () => string;
        electron: () => string;
      };
    };
  }
}
