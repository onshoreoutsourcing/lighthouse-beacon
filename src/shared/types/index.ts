/**
 * Shared TypeScript type definitions for Lighthouse Beacon
 * These types are used across main, renderer, and preload processes
 */

/**
 * Application configuration interface
 */
export interface AppConfig {
  version: string;
  name: string;
  environment: 'development' | 'production' | 'test';
}

/**
 * IPC channel names for inter-process communication
 */
export const IPC_CHANNELS = {
  // App lifecycle
  APP_READY: 'app:ready',
  APP_QUIT: 'app:quit',

  // Directory operations
  DIR_SELECT: 'dir:select',
  DIR_CREATE: 'dir:create',

  // File operations
  FILE_SELECT: 'file:select',
  FILE_SAVE_DIALOG: 'file:saveDialog',

  // File system operations
  FS_READ_DIR: 'fs:readDir',
  FS_READ_FILE: 'fs:readFile',
  FS_WRITE_FILE: 'fs:writeFile',

  // Menu events (renderer receives these)
  MENU_OPEN_FOLDER: 'menu:open-folder',
  MENU_OPEN_FILE: 'menu:open-file',
  MENU_NEW_FILE: 'menu:new-file',
  MENU_NEW_FOLDER: 'menu:new-folder',
  MENU_SAVE: 'menu:save',
  MENU_SAVE_AS: 'menu:save-as',
  MENU_SAVE_ALL: 'menu:save-all',
  MENU_CLOSE_FOLDER: 'menu:close-folder',
} as const;

/**
 * Type-safe IPC channel names
 */
export type IPCChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

/**
 * Result type for operations that can succeed or fail
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * File system entry types
 */
export type FileEntryType = 'file' | 'directory';

/**
 * File system entry metadata
 */
export interface FileEntry {
  name: string;
  path: string;
  type: FileEntryType;
  size: number;
  modified: Date;
  children?: FileEntry[];
  isExpanded?: boolean;
  isLoading?: boolean;
}

/**
 * Directory read result
 */
export interface DirectoryContents {
  path: string;
  entries: FileEntry[];
}

/**
 * File read result
 */
export interface FileContents {
  path: string;
  content: string;
  encoding: string;
}

/**
 * File write options
 */
export interface WriteFileOptions {
  path: string;
  content: string;
  encoding?: string;
}

/**
 * Directory selection result
 */
export interface DirectorySelection {
  path: string | null;
  canceled: boolean;
}

/**
 * File selection result
 */
export interface FileSelection {
  path: string | null;
  canceled: boolean;
}

/**
 * Save dialog result
 */
export interface SaveDialogResult {
  path: string | null;
  canceled: boolean;
}

/**
 * Create folder options
 */
export interface CreateFolderOptions {
  path: string;
  name: string;
}
/**
 * Export Conversation-related types
 */
export type { Conversation, ConversationMessage, ConversationListItem } from './conversation.types';

// Conversation IPC Channels (Feature 2.2 - Wave 2.2.4)
export const CONVERSATION_CHANNELS = {
  CONVERSATION_SAVE: 'conversation:save',
  CONVERSATION_LOAD: 'conversation:load',
  CONVERSATION_LIST: 'conversation:list',
  CONVERSATION_DELETE: 'conversation:delete',
} as const;
