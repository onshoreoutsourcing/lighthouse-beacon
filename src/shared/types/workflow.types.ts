/**
 * Workflow type definitions for YAML schema
 * Implements ADR-017: Workflow YAML Schema Design
 *
 * Supports GitHub Actions-style workflow definitions with variable interpolation,
 * multi-step automation, and visual canvas UI metadata persistence.
 */

/**
 * Step types supported in workflow execution
 */
export enum StepType {
  /** Execute Python script */
  PYTHON = 'python',
  /** Claude AI operation with prompt template */
  CLAUDE = 'claude',
  /** File system operation (read, write, delete) */
  FILE_OPERATION = 'file_operation',
  /** Conditional branch (if/else) - Phase 2 */
  CONDITIONAL = 'conditional',
  /** Loop iteration (for/while) - Phase 2 */
  LOOP = 'loop',
  /** Collect user input at runtime */
  INPUT = 'input',
  /** Output/display result */
  OUTPUT = 'output',
}

/**
 * Workflow input parameter types
 */
export type WorkflowInputType = 'string' | 'number' | 'boolean' | 'file' | 'directory' | 'select';

/**
 * Workflow input parameter definition
 */
export interface WorkflowInput {
  /** Unique identifier for the input parameter */
  id: string;
  /** Data type of the input */
  type: WorkflowInputType;
  /** Human-readable label for UI */
  label: string;
  /** Whether this input is required */
  required: boolean;
  /** Default value if not provided */
  default?: string | number | boolean;
  /** Description/help text for the input */
  description?: string;
  /** For 'select' type: available options */
  options?: string[];
  /** Validation pattern (regex) for string inputs */
  pattern?: string;
  /** Minimum value for number inputs */
  min?: number;
  /** Maximum value for number inputs */
  max?: number;
}

/**
 * Base interface for all workflow steps
 */
export interface WorkflowStepBase {
  /** Unique step identifier (must be unique within workflow) */
  id: string;
  /** Step type determines execution behavior */
  type: StepType;
  /** Human-readable label for visual canvas */
  label?: string;
  /** Description of what this step does */
  description?: string;
  /** Step IDs this step depends on (must complete before this runs) */
  depends_on?: string[];
  /** Key-value inputs for step execution */
  inputs?: Record<string, unknown>;
  /** Output variable names this step produces */
  outputs?: string[];
}

/**
 * Python script execution step
 */
export interface PythonStep extends WorkflowStepBase {
  type: StepType.PYTHON;
  /** Path to Python script file (relative to project root) */
  script: string;
  /** Python interpreter to use (default: system python3) */
  interpreter?: string;
  /** Timeout in milliseconds (default: 60000) */
  timeout?: number;
}

/**
 * Claude AI operation step
 */
export interface ClaudeStep extends WorkflowStepBase {
  type: StepType.CLAUDE;
  /** Claude model to use (e.g., claude-sonnet-4) */
  model: string;
  /** Prompt template with variable interpolation */
  prompt_template: string;
  /** System prompt for model context */
  system_prompt?: string;
  /** Maximum tokens to generate */
  max_tokens?: number;
  /** Temperature (0-1) for response randomness */
  temperature?: number;
}

/**
 * File operation step
 */
export interface FileOperationStep extends WorkflowStepBase {
  type: StepType.FILE_OPERATION;
  /** Operation type (read, write, delete, create_dir) */
  operation: 'read' | 'write' | 'delete' | 'create_dir';
}

/**
 * Conditional branch step (Phase 2)
 */
export interface ConditionalStep extends WorkflowStepBase {
  type: StepType.CONDITIONAL;
  /** Condition expression to evaluate */
  condition: string;
  /** Steps to execute if condition is true */
  then_steps: string[];
  /** Steps to execute if condition is false */
  else_steps?: string[];
}

/**
 * Loop iteration step (Phase 2)
 */
export interface LoopStep extends WorkflowStepBase {
  type: StepType.LOOP;
  /** Array to iterate over (can be variable reference) */
  items: string | unknown[];
  /** Step IDs to execute for each iteration */
  loop_steps: string[];
  /** Maximum iterations (safety limit) */
  max_iterations?: number;
}

/**
 * Input collection step
 */
export interface InputStep extends WorkflowStepBase {
  type: StepType.INPUT;
  /** Prompt message to show user */
  prompt: string;
  /** Input type (matches WorkflowInputType) */
  input_type: WorkflowInputType;
  /** Validation pattern for input */
  validation?: string;
}

/**
 * Output display step
 */
export interface OutputStep extends WorkflowStepBase {
  type: StepType.OUTPUT;
  /** Message template to display */
  message: string;
  /** Output format (text, markdown, json) */
  format?: 'text' | 'markdown' | 'json';
}

/**
 * Union type of all step types
 */
export type WorkflowStep =
  | PythonStep
  | ClaudeStep
  | FileOperationStep
  | ConditionalStep
  | LoopStep
  | InputStep
  | OutputStep;

/**
 * Visual canvas node position and size
 */
export interface NodeUIMetadata {
  /** Step ID this metadata corresponds to */
  id: string;
  /** Node position on canvas */
  position: { x: number; y: number };
  /** Node width in pixels */
  width?: number;
  /** Node height in pixels */
  height?: number;
  /** Custom styling/coloring */
  style?: Record<string, unknown>;
}

/**
 * Canvas viewport state
 */
export interface ViewportMetadata {
  /** Zoom level (1.0 = 100%) */
  zoom: number;
  /** Viewport pan X offset */
  x: number;
  /** Viewport pan Y offset */
  y: number;
}

/**
 * UI metadata for visual workflow canvas
 */
export interface UIMetadata {
  /** Node positions and sizes */
  nodes: NodeUIMetadata[];
  /** Canvas viewport state */
  viewport: ViewportMetadata;
  /** Custom canvas settings */
  canvas_settings?: Record<string, unknown>;
}

/**
 * Workflow metadata
 */
export interface WorkflowMetadata {
  /** Workflow name (human-readable) */
  name: string;
  /** Semantic version (major.minor.patch) */
  version: string;
  /** Description of workflow purpose */
  description: string;
  /** Tags for categorization/search */
  tags?: string[];
  /** Author information */
  author?: string;
  /** Creation timestamp */
  created_at?: string;
  /** Last modified timestamp */
  updated_at?: string;
}

/**
 * Complete workflow definition
 * Represents parsed YAML workflow structure
 */
export interface Workflow {
  /** Workflow metadata (name, version, description, tags) */
  workflow: WorkflowMetadata;
  /** Input parameters for workflow execution */
  inputs: WorkflowInput[];
  /** Execution steps (ordered array) */
  steps: WorkflowStep[];
  /** UI metadata for visual canvas persistence */
  ui_metadata?: UIMetadata;
}

/**
 * Validation error with location information
 */
export interface ValidationError {
  /** YAML line number where error occurred */
  line?: number;
  /** Column position in YAML */
  column?: number;
  /** Field path (e.g., "steps.analyze_repo.inputs") */
  field: string;
  /** Error message */
  message: string;
  /** Error severity */
  severity: 'error' | 'warning';
  /** Suggested fix (actionable guidance) */
  suggestion?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether workflow is valid */
  valid: boolean;
  /** Validation errors (empty if valid) */
  errors: ValidationError[];
  /** Validation warnings (non-fatal issues) */
  warnings?: ValidationError[];
}

/**
 * Variable reference in workflow
 * Matches GitHub Actions variable syntax: ${...}
 */
export interface VariableReference {
  /** Original variable reference string (e.g., "${workflow.inputs.repo_path}") */
  raw: string;
  /** Variable scope (workflow, steps, loop) */
  scope: 'workflow' | 'steps' | 'loop';
  /** Path components (e.g., ["inputs", "repo_path"]) */
  path: string[];
  /** For steps scope: the step ID being referenced */
  stepId?: string;
  /** Field in YAML where reference appears */
  field: string;
  /** Line number in YAML */
  line?: number;
}

/**
 * Variable resolution context
 */
export interface VariableResolutionContext {
  /** Workflow input values */
  workflowInputs: Record<string, unknown>;
  /** Step outputs (stepId -> outputs map) */
  stepOutputs: Record<string, Record<string, unknown>>;
  /** Current loop context (for loop steps) */
  loopContext?: {
    item: unknown;
    index: number;
  };
}

/**
 * Variable resolution result
 */
export interface VariableResolutionResult {
  /** Whether all variables resolved successfully */
  success: boolean;
  /** Resolved value (or original string if resolution failed) */
  value: unknown;
  /** Errors encountered during resolution */
  errors?: ValidationError[];
}

/**
 * YAML parsing options
 */
export interface YAMLParseOptions {
  /** Whether to validate schema after parsing */
  validate?: boolean;
  /** Whether to preserve line numbers for error reporting */
  preserveLineNumbers?: boolean;
  /** Maximum file size to parse (bytes) */
  maxFileSize?: number;
}

/**
 * YAML parse result
 */
export interface YAMLParseResult {
  /** Whether parsing succeeded */
  success: boolean;
  /** Parsed workflow object (if successful) */
  workflow?: Workflow;
  /** Parse error (if failed) */
  error?: ValidationError;
  /** Line number mapping (for error reporting) */
  lineNumbers?: Map<string, number>;
}

/**
 * YAML serialization options
 */
export interface YAMLSerializeOptions {
  /** Indentation spaces (default: 2) */
  indent?: number;
  /** Line width before wrapping (default: 80) */
  lineWidth?: number;
  /** Whether to include comments */
  includeComments?: boolean;
}
