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
  Conversation,
  ConversationListItem,
  AIStatus,
  AppSettings,
  StreamOptions,
  ToolDefinition,
  ToolExecutionResult,
  PermissionRequest,
  PermissionResponse,
  FileOperationEvent,
} from '@shared/types';
import { IPC_CHANNELS, CONVERSATION_CHANNELS, FILE_OPERATION_CHANNELS } from '@shared/types';

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
    ] as const;

    if ((validChannels as readonly string[]).includes(channel)) {
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
   * AI Service Operations (Feature 2.1)
   */
  ai: {
    /**
     * Initialize AI service with stored API key
     * @returns Initialization result with status
     */
    initialize: (): Promise<Result<{ status: AIStatus }>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.AI_INITIALIZE);
    },

    /**
     * Send non-streaming message to AI
     * @param message - Message to send
     * @param options - Optional conversation ID and system prompt
     * @returns AI response as string
     */
    sendMessage: (message: string, options?: StreamOptions): Promise<Result<string>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.AI_SEND_MESSAGE, message, options);
    },

    /**
     * Send streaming message to AI
     * @param message - Message to send
     * @param options - Optional conversation ID and system prompt
     * @returns Promise that resolves when streaming starts
     */
    streamMessage: (message: string, options?: StreamOptions): Promise<Result<void>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.AI_STREAM_MESSAGE, message, options);
    },

    /**
     * Cancel current AI request
     * @returns Cancellation result
     */
    cancel: (): Promise<Result<void>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.AI_CANCEL);
    },

    /**
     * Get AI service status
     * @returns Current AI service status
     */
    getStatus: (): Promise<Result<AIStatus>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.AI_STATUS);
    },

    /**
     * Subscribe to streaming token events
     * @param callback - Callback to receive tokens
     * @returns Cleanup function to remove listener
     */
    onStreamToken: (callback: (token: string) => void): (() => void) => {
      const listener = (_event: unknown, token: string) => callback(token);
      ipcRenderer.on(IPC_CHANNELS.AI_STREAM_TOKEN, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.AI_STREAM_TOKEN, listener);
    },

    /**
     * Subscribe to stream complete events
     * @param callback - Callback to receive full response
     * @returns Cleanup function to remove listener
     */
    onStreamComplete: (callback: (fullResponse: string) => void): (() => void) => {
      const listener = (_event: unknown, fullResponse: string) => callback(fullResponse);
      ipcRenderer.on(IPC_CHANNELS.AI_STREAM_COMPLETE, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.AI_STREAM_COMPLETE, listener);
    },

    /**
     * Subscribe to stream error events
     * @param callback - Callback to receive error message
     * @returns Cleanup function to remove listener
     */
    onStreamError: (callback: (error: string) => void): (() => void) => {
      const listener = (_event: unknown, error: string) => callback(error);
      ipcRenderer.on(IPC_CHANNELS.AI_STREAM_ERROR, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.AI_STREAM_ERROR, listener);
    },
  },

  /**
   * Settings Operations (Feature 2.1)
   */
  settings: {
    /**
     * Get all application settings
     * @returns Application settings
     */
    get: (): Promise<Result<AppSettings>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET);
    },

    /**
     * Update application settings
     * @param updates - Partial settings to update
     * @returns Update result
     */
    update: (updates: Partial<AppSettings>): Promise<Result<void>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_UPDATE, updates);
    },

    /**
     * Check if API key exists (never returns actual key)
     * @returns Boolean indicating if API key is configured
     */
    hasApiKey: (): Promise<Result<{ hasApiKey: boolean }>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_API_KEY_STATUS);
    },

    /**
     * Set API key in encrypted storage
     * @param apiKey - Anthropic API key to store
     * @returns Set result
     */
    setApiKey: (apiKey: string): Promise<Result<void>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET_API_KEY, apiKey);
    },

    /**
     * Remove API key from storage
     * @returns Remove result
     */
    removeApiKey: (): Promise<Result<void>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_REMOVE_API_KEY);
    },
  },

  /**
   * Tool Framework Operations (Feature 2.3)
   */
  tools: {
    /**
     * Execute a tool by name with parameters
     * @param toolName - Name of tool to execute
     * @param parameters - Tool parameters
     * @param conversationId - Optional conversation ID
     * @returns Tool execution result
     */
    execute: (
      toolName: string,
      parameters: Record<string, unknown>,
      conversationId?: string
    ): Promise<Result<ToolExecutionResult>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.TOOL_EXECUTE, toolName, parameters, conversationId);
    },

    /**
     * Get all tool schemas for AI
     * @returns Array of tool definitions
     */
    getSchemas: (): Promise<Result<ToolDefinition[]>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.TOOL_GET_SCHEMAS);
    },

    /**
     * Send permission response to main process
     * @param response - Permission response from user
     * @returns Response result
     */
    respondToPermission: (response: PermissionResponse): Promise<Result<void>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.TOOL_PERMISSION_RESPONSE, response);
    },

    /**
     * Subscribe to permission request events
     * @param callback - Callback to receive permission requests
     * @returns Cleanup function to remove listener
     */
    onPermissionRequest: (callback: (request: PermissionRequest) => void): (() => void) => {
      const listener = (_event: unknown, request: PermissionRequest) => callback(request);
      ipcRenderer.on(IPC_CHANNELS.TOOL_PERMISSION_REQUEST, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.TOOL_PERMISSION_REQUEST, listener);
    },
  },

  /**
   * Conversation Operations (Feature 2.2 - Wave 2.2.4)
   */
  conversation: {
    /**
     * Save conversation to storage
     * @param conversation - Conversation to save
     * @returns Saved conversation with updated metadata
     */
    save: (conversation: Conversation): Promise<Result<Conversation>> => {
      return ipcRenderer.invoke(CONVERSATION_CHANNELS.CONVERSATION_SAVE, conversation);
    },

    /**
     * Load conversation by ID
     * @param conversationId - ID of conversation to load
     * @returns Loaded conversation
     */
    load: (conversationId: string): Promise<Result<Conversation>> => {
      return ipcRenderer.invoke(CONVERSATION_CHANNELS.CONVERSATION_LOAD, conversationId);
    },

    /**
     * List all conversations
     * @returns Array of conversation list items
     */
    list: (): Promise<Result<ConversationListItem[]>> => {
      return ipcRenderer.invoke(CONVERSATION_CHANNELS.CONVERSATION_LIST);
    },

    /**
     * Delete conversation by ID
     * @param conversationId - ID of conversation to delete
     */
    delete: (conversationId: string): Promise<Result<void>> => {
      return ipcRenderer.invoke(CONVERSATION_CHANNELS.CONVERSATION_DELETE, conversationId);
    },
  },

  /**
   * File Operation Events (Feature 3.4 - Wave 3.4.1)
   */
  fileOperations: {
    /**
     * Subscribe to file operation events
     * @param callback - Callback to receive file operation events
     * @returns Cleanup function to remove listener
     */
    onFileOperation: (callback: (event: FileOperationEvent) => void): (() => void) => {
      const listener = (_event: unknown, operationEvent: FileOperationEvent) =>
        callback(operationEvent);
      ipcRenderer.on(FILE_OPERATION_CHANNELS.FILE_OPERATION_EVENT, listener);
      return () =>
        ipcRenderer.removeListener(FILE_OPERATION_CHANNELS.FILE_OPERATION_EVENT, listener);
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
