/**
 * Editor Store
 *
 * Manages editor state including open files and active tab.
 * Provides actions for opening, closing, and switching between files.
 *
 * Features:
 * - Multiple open files with tab management
 * - Active file tracking
 * - File loading via IPC
 * - Automatic language detection
 * - Duplicate prevention (same file won't be opened twice)
 */

import { create } from 'zustand';
import { detectLanguage } from '@renderer/utils/languageDetection';

/**
 * Represents an open file in the editor
 */
interface OpenFile {
  /** Absolute file path (unique identifier) */
  path: string;
  /** File name for display in tab */
  name: string;
  /** File content */
  content: string;
  /** Monaco language identifier */
  language: string;
  /** Has unsaved changes (for future editing features) */
  isDirty?: boolean;
}

/**
 * Editor state interface
 */
interface EditorState {
  // State
  /** Array of open files */
  openFiles: OpenFile[];
  /** Path of currently active file */
  activeFilePath: string | null;

  // Actions
  /** Opens a file (or activates if already open) */
  openFile: (path: string) => Promise<void>;
  /** Closes a file */
  closeFile: (path: string) => void;
  /** Sets the active file */
  setActiveFile: (path: string) => void;
  /** Resets store to initial state */
  reset: () => void;
}

/**
 * Extracts filename from absolute path
 * @param path - Absolute file path
 * @returns Filename with extension
 */
const getFileName = (path: string): string => {
  return path.split('/').pop() || path;
};

/**
 * Editor store for managing open files and active tab
 */
export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  openFiles: [],
  activeFilePath: null,

  /**
   * Opens a file in the editor
   * If file is already open, just switches to it.
   * If not open, loads content via IPC and adds to openFiles.
   *
   * @param path - Absolute path to the file
   */
  openFile: async (path: string) => {
    const { openFiles } = get();

    // Check if file is already open
    const existingFile = openFiles.find((f) => f.path === path);

    if (existingFile) {
      // File already open, just activate it
      set({ activeFilePath: path });
      return;
    }

    try {
      // Load file content via IPC
      const result = await window.electronAPI.fileSystem.readFile(path);

      if (!result.success) {
        console.error('Failed to load file:', result.error?.message || 'Unknown error');
        return;
      }

      // Create new OpenFile object
      const newFile: OpenFile = {
        path,
        name: getFileName(path),
        content: result.data.content,
        language: detectLanguage(path),
        isDirty: false,
      };

      // Add file to openFiles and set as active
      set({
        openFiles: [...openFiles, newFile],
        activeFilePath: path,
      });
    } catch (err) {
      console.error('Error opening file:', err instanceof Error ? err.message : err);
    }
  },

  /**
   * Closes a file
   * If closing the active file, switches to an adjacent file.
   *
   * @param path - Absolute path to the file to close
   */
  closeFile: (path: string) => {
    const { openFiles, activeFilePath } = get();

    // Find index of file to close
    const fileIndex = openFiles.findIndex((f) => f.path === path);
    if (fileIndex === -1) return;

    // Remove file from array (immutable)
    const newOpenFiles = openFiles.filter((f) => f.path !== path);

    // Determine new active file if we're closing the active one
    let newActiveFilePath = activeFilePath;

    if (activeFilePath === path) {
      if (newOpenFiles.length === 0) {
        // No files left, set to null
        newActiveFilePath = null;
      } else if (fileIndex < newOpenFiles.length) {
        // Set to file that takes the closed file's position
        const fileAtIndex = newOpenFiles[fileIndex];
        newActiveFilePath = fileAtIndex ? fileAtIndex.path : null;
      } else {
        // Closed last file, activate the new last file
        const lastFile = newOpenFiles[newOpenFiles.length - 1];
        newActiveFilePath = lastFile ? lastFile.path : null;
      }
    }

    set({
      openFiles: newOpenFiles,
      activeFilePath: newActiveFilePath,
    });
  },

  /**
   * Sets the active file (switches tabs)
   *
   * @param path - Absolute path to the file to activate
   */
  setActiveFile: (path: string) => {
    const { openFiles } = get();

    // Verify file exists in openFiles
    const fileExists = openFiles.some((f) => f.path === path);

    if (fileExists) {
      set({ activeFilePath: path });
    } else {
      console.warn(`Cannot set active file: ${path} is not open`);
    }
  },

  /**
   * Resets the store to initial state
   */
  reset: () => {
    set({
      openFiles: [],
      activeFilePath: null,
    });
  },
}));
