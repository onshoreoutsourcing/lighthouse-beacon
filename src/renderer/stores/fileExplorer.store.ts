/**
 * File Explorer Store
 *
 * Manages file explorer state including root path, directory contents,
 * loading state, and error handling.
 *
 * Features:
 * - Root directory path management
 * - Directory contents loading via IPC
 * - Loading and error state management
 * - Automatic sorting (folders first, then alphabetically)
 */

import { create } from 'zustand';
import type { FileEntry } from '@shared/types';

interface FileExplorerState {
  // State
  rootPath: string | null;
  files: FileEntry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setRootPath: (path: string) => Promise<void>;
  loadDirectory: (path: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Sorts file entries with folders first, then alphabetically by name
 * @param entries - Array of file entries to sort
 * @returns Sorted array of file entries
 */
const sortFileEntries = (entries: FileEntry[]): FileEntry[] => {
  return [...entries].sort((a, b) => {
    // Folders first
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;

    // Then alphabetically by name
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
};

export const useFileExplorerStore = create<FileExplorerState>((set, get) => ({
  // Initial state
  rootPath: null,
  files: [],
  isLoading: false,
  error: null,

  /**
   * Sets the root path and loads the directory contents
   * @param path - Absolute path to the directory
   */
  setRootPath: async (path: string) => {
    set({ rootPath: path, error: null });
    await get().loadDirectory(path);
  },

  /**
   * Loads directory contents from the file system via IPC
   * @param path - Absolute path to the directory to load
   */
  loadDirectory: async (path: string) => {
    set({ isLoading: true, error: null });

    try {
      // Call IPC handler via preload script
      const result = await window.electronAPI.fileSystem.readDirectory(path);

      if (result.success) {
        // Sort entries: folders first, then alphabetically
        const sortedEntries = sortFileEntries(result.data.entries);
        set({ files: sortedEntries, isLoading: false });
      } else {
        // Handle error from IPC
        const errorMessage =
          result.error instanceof Error ? result.error.message : 'Failed to read directory';
        set({ files: [], error: errorMessage, isLoading: false });
      }
    } catch (err) {
      // Handle unexpected errors
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      set({ files: [], error: errorMessage, isLoading: false });
    }
  },

  /**
   * Clears the current error state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Resets the store to initial state
   */
  reset: () => {
    set({
      rootPath: null,
      files: [],
      isLoading: false,
      error: null,
    });
  },
}));
