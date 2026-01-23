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
  WorkflowStartedEvent,
  StepStartedEvent,
  StepCompletedEvent,
  StepFailedEvent,
  WorkflowCompletedEvent,
  Workflow,
  WorkflowMetadata,
  WorkflowExecutionResult,
  ValidationResult,
  DebugMode,
  DebugState,
  StepMode,
  Breakpoint,
  DebugContext,
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
      workflow: {
        load: (filePath: string) => Promise<Result<{ workflow: Workflow }>>;
        save: (workflow: Workflow, fileName?: string) => Promise<Result<{ filePath: string }>>;
        import: (filePath: string) => Promise<Result<{ workflow: Workflow }>>;
        export: (workflow: Workflow, filePath: string) => Promise<Result<{ filePath: string }>>;
        execute: (request: {
          workflow: Workflow | string;
          inputs: Record<string, unknown>;
          workflowId?: string;
          dryRun?: boolean;
        }) => Promise<Result<WorkflowExecutionResult>>;
        validate: (workflow: Workflow) => Promise<ValidationResult>;
        list: () => Promise<Result<{ workflows: WorkflowMetadata[] }>>;
        delete: (filePath: string) => Promise<boolean>;
        generate: (params: {
          description: string;
          projectType?: string;
          language?: string;
          model?: string;
        }) => Promise<{
          success: boolean;
          workflow?: Workflow;
          yaml?: string;
          error?: {
            type: 'claude_api' | 'yaml_parse' | 'schema_validation' | 'unknown';
            message: string;
            details?: string;
            validationErrors?: unknown[];
          };
          metadata?: {
            modelUsed: string;
            tokensUsed?: number;
            durationMs: number;
          };
        }>;
        execution: {
          subscribe: (workflowId?: string) => Promise<Result<{ subscribed: boolean }>>;
          unsubscribe: () => Promise<Result<{ unsubscribed: boolean }>>;
          onWorkflowStarted: (callback: (event: WorkflowStartedEvent) => void) => () => void;
          onStepStarted: (callback: (event: StepStartedEvent) => void) => () => void;
          onStepCompleted: (callback: (event: StepCompletedEvent) => void) => () => void;
          onStepFailed: (callback: (event: StepFailedEvent) => void) => () => void;
          onWorkflowCompleted: (callback: (event: WorkflowCompletedEvent) => void) => () => void;
        };
      };
      versions: {
        node: () => string;
        chrome: () => string;
        electron: () => string;
      };
      workflowDebug: {
        setMode: (mode: DebugMode) => Promise<Result<void>>;
        getMode: () => Promise<Result<DebugMode>>;
        getState: () => Promise<Result<{ state: DebugState; stepMode: StepMode }>>;
        addBreakpoint: (nodeId: string, enabled?: boolean) => Promise<Result<void>>;
        removeBreakpoint: (nodeId: string) => Promise<Result<void>>;
        toggleBreakpoint: (nodeId: string) => Promise<Result<void>>;
        getBreakpoints: () => Promise<Result<Breakpoint[]>>;
        clearBreakpoints: () => Promise<Result<void>>;
        pause: () => Promise<Result<void>>;
        resume: () => Promise<Result<void>>;
        stepOver: () => Promise<Result<void>>;
        continue: () => Promise<Result<void>>;
        getContext: () => Promise<Result<DebugContext | null>>;
        setVariable: (path: string, value: unknown) => Promise<Result<void>>;
        events: {
          onModeChanged: (callback: (data: { mode: DebugMode }) => void) => () => void;
          onPaused: (callback: (context: DebugContext) => void) => () => void;
          onResumed: (callback: () => void) => () => void;
          onBreakpointAdded: (callback: (data: { nodeId: string }) => void) => () => void;
          onBreakpointRemoved: (callback: (data: { nodeId: string }) => void) => () => void;
          onBreakpointToggled: (
            callback: (data: { nodeId: string; enabled: boolean }) => void
          ) => () => void;
          onVariableChanged: (
            callback: (data: { path: string; value: unknown }) => void
          ) => () => void;
        };
      };
    };
  }
}
