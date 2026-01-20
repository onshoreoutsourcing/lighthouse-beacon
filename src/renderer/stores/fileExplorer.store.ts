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
import type { FileEntry, FileOperationEvent } from '@shared/types';
import { debounce } from '@renderer/utils/debounce';

interface FileExplorerState {
  // State
  rootPath: string | null;
  files: FileEntry[];
  isLoading: boolean;
  error: string | null;
  expandedFolders: Set<string>;
  selectedFilePath: string | null;

  // Actions
  setRootPath: (path: string) => Promise<void>;
  loadDirectory: (path: string) => Promise<void>;
  toggleFolder: (path: string) => Promise<void>;
  loadFolderContents: (path: string) => Promise<void>;
  selectFile: (path: string | null) => void;
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

/**
 * Recursively finds a node in the file tree by path
 * @param entries - Array of file entries to search
 * @param targetPath - Path to find
 * @returns Found FileEntry or null
 */
const findNodeInTree = (entries: FileEntry[], targetPath: string): FileEntry | null => {
  for (const entry of entries) {
    if (entry.path === targetPath) {
      return entry;
    }
    if (entry.children) {
      const found = findNodeInTree(entry.children, targetPath);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Updates a specific node in the file tree
 * @param entries - Array of file entries
 * @param targetPath - Path of node to update
 * @param updates - Partial updates to apply
 * @returns New array with updated node
 */
const updateNodeInTree = (
  entries: FileEntry[],
  targetPath: string,
  updates: Partial<FileEntry>
): FileEntry[] => {
  return entries.map((entry) => {
    if (entry.path === targetPath) {
      return { ...entry, ...updates };
    }
    if (entry.children) {
      return {
        ...entry,
        children: updateNodeInTree(entry.children, targetPath, updates),
      };
    }
    return entry;
  });
};

/**
 * Extracts parent directory path from a file path
 * @param filePath - Full file path
 * @returns Parent directory path
 */
const getParentDirectory = (filePath: string): string => {
  const lastSlashIndex = filePath.lastIndexOf('/');
  if (lastSlashIndex === -1) return filePath;
  return filePath.substring(0, lastSlashIndex);
};

export const useFileExplorerStore = create<FileExplorerState>((set, get) => {
  // Debounced refresh function (500ms max wait)
  // Prevents UI thrashing during rapid file operations
  const refreshQueue = new Set<string>();
  const debouncedRefresh = debounce(() => {
    const pathsToRefresh = Array.from(refreshQueue);
    refreshQueue.clear();

    // Refresh each affected directory
    pathsToRefresh.forEach((dirPath) => {
      // Refresh the directory if it's currently loaded and expanded
      const { rootPath, expandedFolders } = get();
      if (rootPath && (dirPath === rootPath || expandedFolders.has(dirPath))) {
        void get().loadDirectory(dirPath);
      }
    });
  }, 500);

  // Set up file operation event listener (Feature 3.4 - Wave 3.4.1)
  if (typeof window !== 'undefined' && window.electronAPI) {
    window.electronAPI.fileOperations.onFileOperation((event: FileOperationEvent) => {
      // Only process successful operations that modify files
      if (!event.success) return;
      if (!['write', 'edit', 'delete'].includes(event.operation)) return;

      const { rootPath } = get();
      if (!rootPath) return;

      // Queue affected directories for refresh
      event.paths.forEach((path) => {
        // For file operations, refresh parent directory
        const parentDir = getParentDirectory(path);
        if (parentDir.startsWith(rootPath)) {
          refreshQueue.add(parentDir);
        }
      });

      // Trigger debounced refresh
      debouncedRefresh();
    });
  }

  return {
    // Initial state
    rootPath: null,
    files: [],
    isLoading: false,
    error: null,
    expandedFolders: new Set<string>(),
    selectedFilePath: null,

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
     * Toggles a folder's expand/collapse state and lazy loads contents
     * @param path - Absolute path to the folder
     */
    toggleFolder: async (path: string) => {
      const { files, expandedFolders } = get();

      // Find the folder node in the tree
      const folder = findNodeInTree(files, path);
      if (!folder || folder.type !== 'directory') {
        return;
      }

      // Toggle expanded state
      const isExpanding = !folder.isExpanded;

      // Update expanded state in tree
      const updatedFiles = updateNodeInTree(files, path, { isExpanded: isExpanding });

      // Update expandedFolders set
      const newExpandedFolders = new Set(expandedFolders);
      if (isExpanding) {
        newExpandedFolders.add(path);
      } else {
        newExpandedFolders.delete(path);
      }

      set({ files: updatedFiles, expandedFolders: newExpandedFolders });

      // Lazy load contents if expanding and not already loaded
      if (isExpanding && folder.children === undefined) {
        await get().loadFolderContents(path);
      }
    },

    /**
     * Loads folder contents via IPC and updates the tree
     * @param path - Absolute path to the folder
     */
    loadFolderContents: async (path: string) => {
      // Set loading state
      const updatedFilesLoading = updateNodeInTree(get().files, path, { isLoading: true });
      set({ files: updatedFilesLoading });

      try {
        // Call IPC handler to read directory
        const result = await window.electronAPI.fileSystem.readDirectory(path);

        if (result.success) {
          // Sort entries: folders first, then alphabetically
          const sortedEntries = sortFileEntries(result.data.entries);

          // Get current node to preserve state
          const currentNode = findNodeInTree(get().files, path);

          // Update node with children and clear loading state
          // IMPORTANT: Explicitly preserve isExpanded state
          const updatedFiles = updateNodeInTree(get().files, path, {
            children: sortedEntries,
            isLoading: false,
            isExpanded: currentNode?.isExpanded ?? true, // Preserve or default to true since we're loading
          });

          set({ files: updatedFiles });
        } else {
          // Handle error - clear loading state but keep expanded
          const errorMessage =
            result.error instanceof Error
              ? result.error.message
              : 'Failed to read directory contents';

          const currentNode = findNodeInTree(get().files, path);
          const updatedFiles = updateNodeInTree(get().files, path, {
            children: [], // Empty children array indicates load attempted but failed/empty
            isLoading: false,
            isExpanded: currentNode?.isExpanded ?? true, // Preserve expanded state
          });

          set({ files: updatedFiles, error: errorMessage });
        }
      } catch (err) {
        // Handle unexpected errors
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

        const currentNode = findNodeInTree(get().files, path);
        const updatedFiles = updateNodeInTree(get().files, path, {
          children: [],
          isLoading: false,
          isExpanded: currentNode?.isExpanded ?? true, // Preserve expanded state
        });

        set({ files: updatedFiles, error: errorMessage });
      }
    },

    /**
     * Selects a file (only files, not folders)
     * Accepts null to clear selection (e.g., when all editor tabs are closed)
     * @param path - Absolute path to the file, or null to clear selection
     */
    selectFile: (path: string | null) => {
      set({ selectedFilePath: path });
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
        expandedFolders: new Set<string>(),
        selectedFilePath: null,
      });
    },
  };
});
