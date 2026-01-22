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
  LogEntry,
  WorkflowStartedEvent,
  StepStartedEvent,
  StepCompletedEvent,
  StepFailedEvent,
  WorkflowCompletedEvent,
  Workflow,
  WorkflowMetadata,
  WorkflowExecutionResult,
  ValidationResult,
} from '@shared/types';
import {
  IPC_CHANNELS,
  CONVERSATION_CHANNELS,
  FILE_OPERATION_CHANNELS,
  WORKFLOW_EXECUTION_CHANNELS,
} from '@shared/types';

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
   * Log Management Operations (Feature 7.1)
   */
  logs: {
    /**
     * Read recent log entries from log file
     * @returns Array of recent log entries (last 100)
     */
    read: (): Promise<Result<LogEntry[]>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.LOGS_READ);
    },

    /**
     * Export log file to user-selected location
     * Shows save dialog and copies log file with timestamped filename
     * @returns Path where logs were exported
     */
    export: (): Promise<Result<string>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.LOGS_EXPORT);
    },

    /**
     * Clear log file
     * Deletes the log file (it will be recreated on next log entry)
     * @returns Clear result
     */
    clear: (): Promise<Result<void>> => {
      return ipcRenderer.invoke(IPC_CHANNELS.LOGS_CLEAR);
    },
  },

  /**
   * Workflow Operations (Feature 9.1 - Wave 9.1.3)
   */
  workflow: {
    /**
     * Load workflow from file
     * @param filePath - Workflow file path or name
     * @returns Load result with workflow or error
     */
    load: (filePath: string): Promise<Result<{ workflow: Workflow }>> => {
      return ipcRenderer.invoke('workflow:load', filePath);
    },

    /**
     * Save workflow to file
     * @param workflow - Workflow definition
     * @param fileName - Optional custom file name
     * @returns Save result with file path or error
     */
    save: (workflow: Workflow, fileName?: string): Promise<Result<{ filePath: string }>> => {
      return ipcRenderer.invoke('workflow:save', workflow, fileName);
    },

    /**
     * Execute workflow with inputs
     * @param request - Execution request (workflow and inputs)
     * @returns Execution result
     */
    execute: (request: {
      workflow: Workflow | string;
      inputs: Record<string, unknown>;
      workflowId?: string;
    }): Promise<Result<WorkflowExecutionResult>> => {
      return ipcRenderer.invoke('workflow:execute', request);
    },

    /**
     * Validate workflow without saving
     * @param workflow - Workflow definition
     * @returns Validation result
     */
    validate: (workflow: Workflow): Promise<ValidationResult> => {
      return ipcRenderer.invoke('workflow:validate', workflow);
    },

    /**
     * List all saved workflows
     * @returns Array of workflow metadata
     */
    list: (): Promise<Result<{ workflows: WorkflowMetadata[] }>> => {
      return ipcRenderer.invoke('workflow:list');
    },

    /**
     * Workflow Execution Events (Feature 9.2 - Wave 9.2.2)
     */
    execution: {
      /**
       * Subscribe to workflow execution events
       * @param workflowId - Optional workflow ID to filter events
       * @returns Subscription result
       */
      subscribe: (workflowId?: string): Promise<Result<{ subscribed: boolean }>> => {
        return ipcRenderer.invoke(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE, workflowId);
      },

      /**
       * Unsubscribe from workflow execution events
       * @returns Unsubscription result
       */
      unsubscribe: (): Promise<Result<{ unsubscribed: boolean }>> => {
        return ipcRenderer.invoke(WORKFLOW_EXECUTION_CHANNELS.UNSUBSCRIBE);
      },

      /**
       * Subscribe to workflow started events
       * @param callback - Callback to receive workflow started events
       * @returns Cleanup function to remove listener
       */
      onWorkflowStarted: (callback: (event: WorkflowStartedEvent) => void): (() => void) => {
        const listener = (_event: unknown, data: WorkflowStartedEvent) => callback(data);
        ipcRenderer.on(WORKFLOW_EXECUTION_CHANNELS.WORKFLOW_STARTED, listener);
        return () =>
          ipcRenderer.removeListener(WORKFLOW_EXECUTION_CHANNELS.WORKFLOW_STARTED, listener);
      },

      /**
       * Subscribe to step started events
       * @param callback - Callback to receive step started events
       * @returns Cleanup function to remove listener
       */
      onStepStarted: (callback: (event: StepStartedEvent) => void): (() => void) => {
        const listener = (_event: unknown, data: StepStartedEvent) => callback(data);
        ipcRenderer.on(WORKFLOW_EXECUTION_CHANNELS.STEP_STARTED, listener);
        return () => ipcRenderer.removeListener(WORKFLOW_EXECUTION_CHANNELS.STEP_STARTED, listener);
      },

      /**
       * Subscribe to step completed events
       * @param callback - Callback to receive step completed events
       * @returns Cleanup function to remove listener
       */
      onStepCompleted: (callback: (event: StepCompletedEvent) => void): (() => void) => {
        const listener = (_event: unknown, data: StepCompletedEvent) => callback(data);
        ipcRenderer.on(WORKFLOW_EXECUTION_CHANNELS.STEP_COMPLETED, listener);
        return () =>
          ipcRenderer.removeListener(WORKFLOW_EXECUTION_CHANNELS.STEP_COMPLETED, listener);
      },

      /**
       * Subscribe to step failed events
       * @param callback - Callback to receive step failed events
       * @returns Cleanup function to remove listener
       */
      onStepFailed: (callback: (event: StepFailedEvent) => void): (() => void) => {
        const listener = (_event: unknown, data: StepFailedEvent) => callback(data);
        ipcRenderer.on(WORKFLOW_EXECUTION_CHANNELS.STEP_FAILED, listener);
        return () => ipcRenderer.removeListener(WORKFLOW_EXECUTION_CHANNELS.STEP_FAILED, listener);
      },

      /**
       * Subscribe to workflow completed events
       * @param callback - Callback to receive workflow completed events
       * @returns Cleanup function to remove listener
       */
      onWorkflowCompleted: (callback: (event: WorkflowCompletedEvent) => void): (() => void) => {
        const listener = (_event: unknown, data: WorkflowCompletedEvent) => callback(data);
        ipcRenderer.on(WORKFLOW_EXECUTION_CHANNELS.WORKFLOW_COMPLETED, listener);
        return () =>
          ipcRenderer.removeListener(WORKFLOW_EXECUTION_CHANNELS.WORKFLOW_COMPLETED, listener);
      },
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
