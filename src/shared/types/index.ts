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

  // AI Service (Feature 2.1)
  AI_INITIALIZE: 'ai:initialize',
  AI_SEND_MESSAGE: 'ai:send-message',
  AI_STREAM_MESSAGE: 'ai:stream-message',
  AI_STREAM_TOKEN: 'ai:stream-token',
  AI_STREAM_COMPLETE: 'ai:stream-complete',
  AI_STREAM_ERROR: 'ai:stream-error',
  AI_CANCEL: 'ai:cancel',
  AI_STATUS: 'ai:status',

  // Settings (Feature 2.1)
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_GET_API_KEY_STATUS: 'settings:get-api-key-status',
  SETTINGS_SET_API_KEY: 'settings:set-api-key',
  SETTINGS_REMOVE_API_KEY: 'settings:remove-api-key',

  // Tool Framework (Feature 2.3)
  TOOL_EXECUTE: 'tool:execute',
  TOOL_GET_SCHEMAS: 'tool:get-schemas',
  TOOL_PERMISSION_REQUEST: 'tool:permission-request',
  TOOL_PERMISSION_RESPONSE: 'tool:permission-response',

  // Logging (Feature 7.1)
  LOGS_READ: 'logs:read',
  LOGS_EXPORT: 'logs:export',
  LOGS_CLEAR: 'logs:clear',
  LOGS_GET_FILE_SIZE: 'logs:get-file-size',
  LOGS_GET_DISK_SPACE: 'logs:get-disk-space',

  // Log Level Control (Feature 7.1 - User Story 3)
  SETTINGS_SET_LOG_LEVEL: 'settings:set-log-level',
  SETTINGS_GET_LOG_CONFIG: 'settings:get-log-config',
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
 * Export Conversation-related types (Feature 2.2)
 */
export type { Conversation, ConversationMessage, ConversationListItem } from './conversation.types';

/**
 * Export AI-related types (Feature 2.1)
 */
export type {
  AIStatus,
  AIConfig,
  SOCConfig,
  AppSettings,
  StreamOptions,
  AIServiceResponse,
  LoggingConfig,
  LogConfig,
} from './ai.types';

// Conversation IPC Channels (Feature 2.2 - Wave 2.2.4)
export const CONVERSATION_CHANNELS = {
  CONVERSATION_SAVE: 'conversation:save',
  CONVERSATION_LOAD: 'conversation:load',
  CONVERSATION_LIST: 'conversation:list',
  CONVERSATION_DELETE: 'conversation:delete',
} as const;

/**
 * Export Tool Framework types (Feature 2.3)
 */
export type {
  ToolDefinition,
  ToolParameterSchema,
  ToolExecutor,
  ToolExecutionContext,
  ToolExecutionResult,
  ToolValidationError,
  PermissionRequest,
  PermissionResponse,
  SessionTrustState,
} from './tool.types';

export { PermissionLevel, PermissionDecision, type ToolRiskLevel } from './tool.types';

/**
 * Log Entry Types (Feature 7.1)
 */

/**
 * Log level types
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * File Operation Event Types (Feature 3.4 - Wave 3.4.1)
 */

/**
 * Type of file operation performed
 */
export type FileOperationType = 'write' | 'edit' | 'delete' | 'read' | 'glob' | 'grep' | 'bash';

/**
 * File operation event data
 * Emitted by file operation tools to notify UI of changes
 */
export interface FileOperationEvent {
  /** Type of operation performed */
  operation: FileOperationType;
  /** Paths affected by the operation (relative or absolute) */
  paths: string[];
  /** Whether operation succeeded */
  success: boolean;
  /** Timestamp of operation */
  timestamp: number;
  /** Optional error message if operation failed */
  error?: string;
  /** Additional operation-specific metadata */
  metadata?: Record<string, unknown>;
}

// File Operation IPC Channel (Feature 3.4 - Wave 3.4.1)
export const FILE_OPERATION_CHANNELS = {
  FILE_OPERATION_EVENT: 'file-operation:event',
} as const;

/**
 * Workflow Execution Event Types (Feature 9.2 - Wave 9.2.2)
 */

/**
 * Workflow execution started event data
 */
export interface WorkflowStartedEvent {
  workflowId: string;
  startTime: number;
  totalSteps?: number;
}

/**
 * Step execution started event data
 */
export interface StepStartedEvent {
  workflowId: string;
  stepId: string;
  timestamp: number;
  stepIndex?: number;
}

/**
 * Step execution completed event data
 */
export interface StepCompletedEvent {
  workflowId: string;
  stepId: string;
  outputs: Record<string, unknown>;
  duration: number;
  timestamp: number;
}

/**
 * Step execution failed event data
 */
export interface StepFailedEvent {
  workflowId: string;
  stepId: string;
  error: string;
  duration: number;
  timestamp: number;
  exitCode?: number;
}

/**
 * Workflow execution completed event data
 */
export interface WorkflowCompletedEvent {
  workflowId: string;
  totalDuration: number;
  results: Record<string, unknown>;
  timestamp: number;
  successCount: number;
  failureCount: number;
}

// Workflow Execution IPC Channels (Feature 9.2 - Wave 9.2.2)
export const WORKFLOW_EXECUTION_CHANNELS = {
  SUBSCRIBE: 'workflow:execution:subscribe',
  UNSUBSCRIBE: 'workflow:execution:unsubscribe',
  WORKFLOW_STARTED: 'workflow:execution:started',
  STEP_STARTED: 'workflow:execution:step-started',
  STEP_COMPLETED: 'workflow:execution:step-completed',
  STEP_FAILED: 'workflow:execution:step-failed',
  WORKFLOW_COMPLETED: 'workflow:execution:completed',
} as const;

/**
 * Export Workflow types (Feature 9.1 - Wave 9.1.2)
 */
export type {
  Workflow,
  WorkflowMetadata,
  WorkflowInput,
  WorkflowInputType,
  WorkflowStep,
  WorkflowStepBase,
  PythonStep,
  ClaudeStep,
  FileOperationStep,
  ConditionalStep,
  LoopStep,
  InputStep,
  OutputStep,
  UIMetadata,
  NodeUIMetadata,
  ViewportMetadata,
  ValidationError,
  ValidationResult,
  VariableReference,
  VariableResolutionContext,
  VariableResolutionResult,
  YAMLParseOptions,
  YAMLParseResult,
  YAMLSerializeOptions,
} from './workflow.types';

export { StepType } from './workflow.types';
