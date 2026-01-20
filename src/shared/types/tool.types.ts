/**
 * Tool Framework Type Definitions
 * Types for AI tool calling, permission system, and tool execution
 */

/**
 * Tool parameter schema (JSON Schema-like)
 */
export interface ToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  properties?: Record<string, ToolParameterSchema>;
  items?: ToolParameterSchema;
  enum?: Array<string | number>;
}

/**
 * Tool risk level for permission system
 */
export type ToolRiskLevel = 'low' | 'medium' | 'high';

/**
 * Permission requirement for tool execution
 */
export type ToolPermissionRequirement = 'none' | 'prompt' | 'always_prompt';

/**
 * Tool definition (schema for AI)
 */
export interface ToolDefinition {
  /** Unique tool name */
  name: string;
  /** Human-readable description for AI */
  description: string;
  /** Parameter schema (JSON Schema format) */
  parameters: Record<string, ToolParameterSchema>;
  /** Required parameter names */
  requiredParameters: string[];
  /** Permission requirement */
  permissionRequirement: ToolPermissionRequirement;
  /** Risk level for UI indication */
  riskLevel: ToolRiskLevel;
}

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
  /** Tool name being executed */
  toolName: string;
  /** Tool parameters */
  parameters: Record<string, unknown>;
  /** Request timestamp */
  timestamp: Date;
  /** Conversation ID if applicable */
  conversationId?: string;
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  /** Execution success */
  success: boolean;
  /** Result data (if successful) */
  data?: unknown;
  /** Error message (if failed) */
  error?: string;
  /** Execution duration in ms */
  duration: number;
}

/**
 * Permission level for tool types
 */
export enum PermissionLevel {
  /** Always allow without prompting */
  ALWAYS_ALLOW = 'ALWAYS_ALLOW',
  /** Prompt user for permission */
  PROMPT = 'PROMPT',
  /** Always deny without prompting */
  ALWAYS_DENY = 'ALWAYS_DENY',
}

/**
 * Permission decision from user
 */
export enum PermissionDecision {
  /** User approved the operation */
  APPROVED = 'APPROVED',
  /** User denied the operation */
  DENIED = 'DENIED',
  /** Operation timed out */
  TIMEOUT = 'TIMEOUT',
}

/**
 * Permission request sent to UI
 */
export interface PermissionRequest {
  /** Unique request ID */
  id: string;
  /** Tool being executed */
  toolName: string;
  /** Tool parameters */
  parameters: Record<string, unknown>;
  /** Risk level for UI */
  riskLevel: ToolRiskLevel;
  /** Whether session trust is allowed for this tool */
  allowSessionTrust: boolean;
  /** Request timestamp */
  timestamp: Date;
}

/**
 * Permission response from user
 */
export interface PermissionResponse {
  /** Request ID being responded to */
  requestId: string;
  /** User's decision */
  decision: PermissionDecision;
  /** Whether to trust this tool type for the session */
  trustForSession: boolean;
}

/**
 * Session trust state for a tool type
 */
export interface SessionTrustState {
  /** Tool type being trusted */
  toolName: string;
  /** When trust was granted */
  grantedAt: Date;
}

/**
 * Tool validation error
 */
export interface ToolValidationError {
  /** Parameter name that failed validation */
  parameter: string;
  /** Error message */
  message: string;
  /** Expected type or format */
  expected?: string;
  /** Received value (sanitized) */
  received?: string;
}

/**
 * Tool executor interface
 * Implemented by each tool (read, write, etc.)
 */
export interface ToolExecutor {
  /**
   * Get tool definition (schema)
   */
  getDefinition(): ToolDefinition;

  /**
   * Validate parameters before execution
   * @param parameters - Parameters to validate
   * @returns Validation errors (empty if valid)
   */
  validate(parameters: Record<string, unknown>): ToolValidationError[];

  /**
   * Execute the tool
   * @param parameters - Validated parameters
   * @param context - Execution context
   * @returns Execution result
   */
  execute(
    parameters: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult>;
}
