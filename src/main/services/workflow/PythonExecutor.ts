/**
 * PythonExecutor Service
 *
 * Provides secure Python script execution with:
 * - Path validation (scripts must be within project directory)
 * - Timeout enforcement (30-second default, configurable)
 * - Process isolation (child_process.spawn)
 * - JSON stdin/stdout interface for data exchange
 * - Comprehensive error handling
 *
 * Security Implementation:
 * - Validates all script paths using PathValidator (ADR-011)
 * - Prevents directory traversal attacks
 * - Enforces execution timeouts to prevent infinite loops
 * - Isolates script execution in separate process
 * - Captures stdout, stderr, and exit codes
 *
 * Architecture:
 * - Follows ADR-016: Python Script Execution Security Strategy
 * - Integrates with existing PathValidator from ADR-011
 * - Uses child_process.spawn for process isolation
 *
 * Usage:
 * const executor = new PythonExecutor(projectRoot);
 * const result = await executor.executeScript('scripts/process.py', { data: 'value' });
 */

import { spawn } from 'node:child_process';
import { PathValidator } from '../../tools/PathValidator';
import { existsSync } from 'node:fs';
import { access, constants } from 'node:fs/promises';
import { setTimeout, clearTimeout } from 'node:timers';
import { ExecutionEvents } from './ExecutionEvents';

/**
 * Result of Python script execution
 */
export interface PythonExecutionResult {
  /** Whether execution was successful */
  success: boolean;
  /** Parsed JSON output from script (if success) */
  output?: Record<string, unknown>;
  /** Error message (if failure) */
  error?: string;
  /** Script exit code */
  exitCode: number;
  /** Standard error output (if any) */
  stderr?: string;
  /** Execution time in milliseconds */
  executionTimeMs: number;
}

/**
 * Options for Python script execution
 */
export interface PythonExecutionOptions {
  /** Timeout in milliseconds (default: 30000 = 30 seconds) */
  timeoutMs?: number;
  /** Python interpreter path (default: 'python3') */
  pythonPath?: string;
  /** Additional command-line arguments for the script */
  args?: string[];
  /** Workflow ID for execution event tracking (optional) */
  workflowId?: string;
  /** Step ID for execution event tracking (optional) */
  stepId?: string;
}

/**
 * Error types for Python execution failures
 */
export enum PythonExecutionErrorType {
  PATH_VALIDATION_FAILED = 'PATH_VALIDATION_FAILED',
  SCRIPT_NOT_FOUND = 'SCRIPT_NOT_FOUND',
  PYTHON_NOT_FOUND = 'PYTHON_NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  SCRIPT_ERROR = 'SCRIPT_ERROR',
  INVALID_OUTPUT = 'INVALID_OUTPUT',
  SPAWN_FAILED = 'SPAWN_FAILED',
}

/**
 * Custom error class for Python execution errors
 */
export class PythonExecutionError extends Error {
  constructor(
    public readonly type: PythonExecutionErrorType,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PythonExecutionError';
  }
}

/**
 * Secure Python script executor
 */
export class PythonExecutor {
  private pathValidator: PathValidator;
  private defaultTimeout: number;
  private pythonPath: string;
  private executionEvents: ExecutionEvents;

  /**
   * Create a new PythonExecutor
   *
   * @param projectRoot - Absolute path to project root directory
   * @param options - Optional configuration
   */
  constructor(
    projectRoot: string,
    options: { defaultTimeoutMs?: number; pythonPath?: string } = {}
  ) {
    this.pathValidator = new PathValidator(projectRoot);
    this.defaultTimeout = options.defaultTimeoutMs || 30000; // 30 seconds default
    this.pythonPath = options.pythonPath || 'python3';
    this.executionEvents = ExecutionEvents.getInstance();
  }

  /**
   * Get the project root directory
   */
  getProjectRoot(): string {
    return this.pathValidator.getProjectRoot();
  }

  /**
   * Check if Python is available on the system
   *
   * @returns True if Python is available, false otherwise
   */
  async checkPythonAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const python = spawn(this.pythonPath, ['--version']);

      python.on('error', () => {
        resolve(false);
      });

      python.on('close', (code) => {
        resolve(code === 0);
      });

      // Timeout check after 2 seconds
      setTimeout(() => {
        python.kill();
        resolve(false);
      }, 2000);
    });
  }

  /**
   * Validate script path is within project directory
   *
   * @param scriptPath - Path to Python script (relative or absolute)
   * @throws PythonExecutionError if path is invalid or outside project
   */
  private validateScriptPath(scriptPath: string): string {
    const validation = this.pathValidator.validate(scriptPath);

    if (!validation.isValid) {
      throw new PythonExecutionError(
        PythonExecutionErrorType.PATH_VALIDATION_FAILED,
        `Script path validation failed: ${validation.error}`,
        { scriptPath, projectRoot: this.pathValidator.getProjectRoot() }
      );
    }

    return validation.absolutePath!;
  }

  /**
   * Check if script file exists and is readable
   *
   * @param absolutePath - Absolute path to script
   * @throws PythonExecutionError if script doesn't exist or isn't readable
   */
  private async checkScriptExists(absolutePath: string): Promise<void> {
    // Check if file exists
    if (!existsSync(absolutePath)) {
      throw new PythonExecutionError(
        PythonExecutionErrorType.SCRIPT_NOT_FOUND,
        `Script file not found: ${absolutePath}`,
        { scriptPath: absolutePath }
      );
    }

    // Check if file is readable
    try {
      await access(absolutePath, constants.R_OK);
    } catch {
      throw new PythonExecutionError(
        PythonExecutionErrorType.SCRIPT_NOT_FOUND,
        `Script file is not readable: ${absolutePath}`,
        { scriptPath: absolutePath }
      );
    }
  }

  /**
   * Validate input data paths (recursively check for file paths)
   *
   * This validates any file paths in the input data to prevent
   * directory traversal attacks via input parameters.
   *
   * @param inputs - Input data to validate
   * @throws PythonExecutionError if any file path is outside project
   */
  private validateInputPaths(inputs: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === 'string' && this.looksLikeFilePath(value)) {
        // Validate file path is within project
        const validation = this.pathValidator.validate(value);
        if (!validation.isValid) {
          throw new PythonExecutionError(
            PythonExecutionErrorType.PATH_VALIDATION_FAILED,
            `Input file path outside project: ${key} = ${value}`,
            { inputKey: key, inputValue: value }
          );
        }
      } else if (typeof value === 'object' && value !== null) {
        // Recursively validate nested objects
        this.validateInputPaths(value as Record<string, unknown>);
      }
    }
  }

  /**
   * Heuristic check if string looks like a file path
   *
   * @param value - String to check
   * @returns True if value looks like a file path
   */
  private looksLikeFilePath(value: string): boolean {
    // Heuristic: contains path separator and has file extension
    // or starts with ./ or ../ or / (Unix) or C:\ (Windows)
    return (
      (/[/\\]/.test(value) && /\.\w+$/.test(value)) ||
      value.startsWith('./') ||
      value.startsWith('../') ||
      value.startsWith('/') ||
      /^[a-zA-Z]:[/\\]/.test(value)
    );
  }

  /**
   * Execute Python script with inputs and return outputs
   *
   * Security features:
   * - Validates script path is within project directory
   * - Validates all input file paths
   * - Enforces timeout to prevent infinite loops
   * - Isolates execution in separate process
   * - Captures all output streams
   *
   * @param scriptPath - Path to Python script (relative to project root)
   * @param inputs - Input data to pass to script via stdin (as JSON)
   * @param options - Execution options (timeout, python path, args)
   * @returns Execution result with output or error
   */
  async executeScript(
    scriptPath: string,
    inputs: Record<string, unknown> = {},
    options: PythonExecutionOptions = {}
  ): Promise<PythonExecutionResult> {
    const startTime = Date.now();
    const { workflowId, stepId } = options;

    // Emit step_started event if tracking is enabled
    if (workflowId && stepId) {
      this.executionEvents.emitStepStarted(workflowId, stepId);
    }

    try {
      // 1. Validate script path (must be within project directory)
      const absoluteScriptPath = this.validateScriptPath(scriptPath);

      // 2. Check if script file exists
      await this.checkScriptExists(absoluteScriptPath);

      // 3. Validate input file paths
      this.validateInputPaths(inputs);

      // 4. Check Python availability
      const pythonAvailable = await this.checkPythonAvailable();
      if (!pythonAvailable) {
        throw new PythonExecutionError(
          PythonExecutionErrorType.PYTHON_NOT_FOUND,
          `Python interpreter not found: ${this.pythonPath}. Please install Python 3.8+`,
          { pythonPath: this.pythonPath }
        );
      }

      // 5. Spawn Python process with timeout
      const timeout = options.timeoutMs || this.defaultTimeout;
      const pythonPath = options.pythonPath || this.pythonPath;
      const args = [absoluteScriptPath, ...(options.args || [])];

      const result = await this.spawnPythonProcess(pythonPath, args, inputs, timeout, startTime);

      // Emit step_completed or step_failed event if tracking is enabled
      if (workflowId && stepId) {
        const duration = Date.now() - startTime;
        if (result.success) {
          this.executionEvents.emitStepCompleted(workflowId, stepId, result.output || {}, duration);
        } else {
          this.executionEvents.emitStepFailed(
            workflowId,
            stepId,
            result.error || 'Unknown error',
            duration,
            result.exitCode
          );
        }
      }

      return result;
    } catch (error) {
      // Convert errors to PythonExecutionResult
      const executionTimeMs = Date.now() - startTime;

      // Emit step_failed event if tracking is enabled
      if (workflowId && stepId) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error during script execution';
        this.executionEvents.emitStepFailed(workflowId, stepId, errorMessage, executionTimeMs, -1);
      }

      if (error instanceof PythonExecutionError) {
        return {
          success: false,
          error: error.message,
          exitCode: -1,
          executionTimeMs,
        };
      }

      // Unexpected error
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during script execution',
        exitCode: -1,
        executionTimeMs,
      };
    }
  }

  /**
   * Spawn Python process and handle communication
   *
   * @param pythonPath - Path to Python interpreter
   * @param args - Command-line arguments (script path + additional args)
   * @param inputs - Input data to send via stdin
   * @param timeoutMs - Timeout in milliseconds
   * @param startTime - Execution start time for metrics
   * @returns Execution result
   */
  private async spawnPythonProcess(
    pythonPath: string,
    args: string[],
    inputs: Record<string, unknown>,
    timeoutMs: number,
    startTime: number
  ): Promise<PythonExecutionResult> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Spawn Python process with isolated stdio
      const python = spawn(pythonPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: timeoutMs,
      });

      // Timeout handler
      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        python.kill('SIGTERM');

        // Force kill after 1 second if SIGTERM doesn't work
        setTimeout(() => {
          if (!python.killed) {
            python.kill('SIGKILL');
          }
        }, 1000);
      }, timeoutMs);

      // Send inputs via stdin as JSON
      try {
        const inputJson = JSON.stringify(inputs);
        python.stdin.write(inputJson);
        python.stdin.end();
      } catch (error) {
        clearTimeout(timeoutHandle);
        python.kill();
        resolve({
          success: false,
          error: `Failed to send inputs to script: ${error instanceof Error ? error.message : 'Unknown error'}`,
          exitCode: -1,
          executionTimeMs: Date.now() - startTime,
        });
        return;
      }

      // Collect stdout
      python.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      // Collect stderr
      python.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Handle process exit
      python.on('close', (code: number | null) => {
        clearTimeout(timeoutHandle);
        const executionTimeMs = Date.now() - startTime;

        // Check if timed out
        if (timedOut) {
          resolve({
            success: false,
            error: `Script execution timed out after ${timeoutMs}ms`,
            exitCode: -1,
            stderr,
            executionTimeMs,
          });
          return;
        }

        // Check exit code
        if (code !== 0) {
          resolve({
            success: false,
            error: `Script exited with code ${code}`,
            exitCode: code || -1,
            stderr,
            executionTimeMs,
          });
          return;
        }

        // Parse JSON output
        try {
          const output = JSON.parse(stdout) as Record<string, unknown>;
          resolve({
            success: true,
            output,
            exitCode: 0,
            stderr: stderr || undefined,
            executionTimeMs,
          });
        } catch (parseError) {
          resolve({
            success: false,
            error: `Invalid JSON output from script: ${parseError instanceof Error ? parseError.message : 'Parse error'}`,
            exitCode: 0,
            stderr: `Raw stdout: ${stdout}\nStderr: ${stderr}`,
            executionTimeMs,
          });
        }
      });

      // Handle spawn errors (Python not found, permission denied, etc.)
      python.on('error', (error) => {
        clearTimeout(timeoutHandle);
        resolve({
          success: false,
          error: `Failed to spawn Python process: ${error.message}`,
          exitCode: -1,
          executionTimeMs: Date.now() - startTime,
        });
      });
    });
  }

  /**
   * Validate a Python script contract (check if it accepts inputs and returns outputs)
   *
   * This is a lightweight validation that checks if the script runs successfully
   * with empty inputs and returns valid JSON.
   *
   * @param scriptPath - Path to Python script
   * @returns True if script appears to follow the contract
   */
  async validateScriptContract(scriptPath: string): Promise<boolean> {
    try {
      const result = await this.executeScript(scriptPath, {}, { timeoutMs: 5000 });
      return result.success;
    } catch {
      return false;
    }
  }
}
