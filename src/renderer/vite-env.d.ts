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
  AIStatus,
  AppSettings,
  StreamOptions,
  Conversation,
  ConversationListItem,
  ToolDefinition,
  ToolExecutionResult,
  PermissionRequest,
  PermissionResponse,
  FileOperationEvent,
  LogEntry,
  LogConfig,
  LogLevel,
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
      ai: {
        initialize: () => Promise<Result<{ status: AIStatus }>>;
        sendMessage: (message: string, options?: StreamOptions) => Promise<Result<string>>;
        streamMessage: (message: string, options?: StreamOptions) => Promise<Result<void>>;
        cancel: () => Promise<Result<void>>;
        getStatus: () => Promise<Result<AIStatus>>;
        onStreamToken: (callback: (token: string) => void) => () => void;
        onStreamComplete: (callback: (fullResponse: string) => void) => () => void;
        onStreamError: (callback: (error: string) => void) => () => void;
      };
      settings: {
        get: () => Promise<Result<AppSettings>>;
        update: (updates: Partial<AppSettings>) => Promise<Result<void>>;
        hasApiKey: () => Promise<Result<{ hasApiKey: boolean }>>;
        setApiKey: (apiKey: string) => Promise<Result<void>>;
        removeApiKey: () => Promise<Result<void>>;
        setLogLevel: (level: LogLevel) => Promise<Result<void>>;
        getLogConfig: () => Promise<Result<LogConfig>>;
      };
      tools: {
        execute: (
          toolName: string,
          parameters: Record<string, unknown>,
          conversationId?: string
        ) => Promise<Result<ToolExecutionResult>>;
        getSchemas: () => Promise<Result<ToolDefinition[]>>;
        respondToPermission: (response: PermissionResponse) => Promise<Result<void>>;
        onPermissionRequest: (callback: (request: PermissionRequest) => void) => () => void;
      };
      conversation: {
        save: (conversation: Conversation) => Promise<Result<Conversation>>;
        load: (conversationId: string) => Promise<Result<Conversation>>;
        list: () => Promise<Result<ConversationListItem[]>>;
        delete: (conversationId: string) => Promise<Result<void>>;
      };
      fileOperations: {
        onFileOperation: (callback: (event: FileOperationEvent) => void) => () => void;
      };
      logs: {
        read: () => Promise<Result<LogEntry[]>>;
        export: () => Promise<Result<string>>;
        clear: () => Promise<Result<void>>;
        getFileSize: () => Promise<Result<number>>;
        getDiskSpace: () => Promise<Result<number>>;
        openLogFolder: () => Promise<Result<void>>;
      };
      versions: {
        node: () => string;
        chrome: () => string;
        electron: () => string;
      };
    };
  }
}
