/**
 * ToolExecutionService
 *
 * Central service for executing AI tool requests. Coordinates tool lookup, validation,
 * permission checking, and execution with comprehensive error handling.
 *
 * Execution Flow:
 * 1. Lookup tool in registry
 * 2. Validate parameters
 * 3. Check permissions (if required)
 * 4. Execute tool
 * 5. Log to SOC
 * 6. Return result
 *
 * Features:
 * - Tool validation before execution
 * - Permission integration
 * - Execution timing
 * - Comprehensive error handling
 * - AI-friendly error messages
 * - SOC logging
 *
 * Usage:
 * const service = new ToolExecutionService(registry, permissionService);
 * const result = await service.executeTool('read_file', { path: '/foo/bar.txt' });
 */

import type { ToolExecutionContext, ToolExecutionResult, ToolValidationError } from '@shared/types';
import { PermissionDecision } from '@shared/types';
import type { ToolRegistry } from './ToolRegistry';
import type { PermissionService } from './PermissionService';
import { logger } from '@main/logger';

/**
 * Tool execution service
 */
export class ToolExecutionService {
  constructor(
    private registry: ToolRegistry,
    private permissionService: PermissionService
  ) {}

  /**
   * Execute a tool by name with parameters
   *
   * @param toolName - Name of tool to execute
   * @param parameters - Tool parameters
   * @param conversationId - Optional conversation ID
   * @returns Execution result
   */
  async executeTool(
    toolName: string,
    parameters: Record<string, unknown>,
    conversationId?: string
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      // 1. Lookup tool
      const executor = this.registry.getTool(toolName);
      if (!executor) {
        return this.createErrorResult(
          `Unknown tool '${toolName}'. Available tools: ${this.registry.getAllToolNames().join(', ')}`,
          startTime
        );
      }

      // Get tool definition
      const definition = executor.getDefinition();

      // 2. Validate parameters
      const validationErrors = executor.validate(parameters);
      if (validationErrors.length > 0) {
        return this.createValidationErrorResult(validationErrors, startTime);
      }

      // 3. Check permissions (if required)
      if (definition.permissionRequirement !== 'none') {
        const decision = await this.permissionService.checkPermission(
          toolName,
          parameters,
          definition.riskLevel,
          definition.permissionRequirement !== 'always_prompt'
        );

        if (decision === PermissionDecision.DENIED) {
          logger.warn('[ToolExecutionService] Permission denied', {
            toolName,
            parameters,
          });
          return this.createErrorResult(
            `Permission denied for operation '${toolName}'. User declined the request.`,
            startTime
          );
        }

        if (decision === PermissionDecision.TIMEOUT) {
          logger.warn('[ToolExecutionService] Permission timeout', {
            toolName,
            parameters,
          });
          return this.createErrorResult(
            `Permission timeout for operation '${toolName}'. No response received within 5 minutes.`,
            startTime
          );
        }
      }

      // 4. Execute tool
      logger.info('[ToolExecutionService] Executing tool', {
        toolName,
        parameters,
      });

      const context: ToolExecutionContext = {
        toolName,
        parameters,
        timestamp: new Date(),
        conversationId,
      };

      const result = await executor.execute(parameters, context);

      // 5. Log successful execution
      const duration = Date.now() - startTime;

      // Warn if execution took more than 1 second
      if (duration > 1000) {
        logger.warn('[ToolExecutionService] Slow tool execution detected', {
          toolName,
          duration,
          threshold: 1000,
        });
      } else {
        logger.info('[ToolExecutionService] Tool execution complete', {
          toolName,
          duration,
          success: result.success,
        });
      }

      return result;
    } catch (error) {
      // 6. Handle execution errors
      const duration = Date.now() - startTime;

      logger.error('[ToolExecutionService] Tool execution failed', {
        toolName,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return this.createErrorResult(this.formatExecutionError(error, toolName), startTime);
    }
  }

  /**
   * Get all tool schemas for AI
   *
   * @returns Array of tool definitions
   */
  getAllToolSchemas() {
    return this.registry.getAllSchemas();
  }

  /**
   * Create error result
   *
   * @param errorMessage - Error message
   * @param startTime - Execution start time
   * @returns Error result
   */
  private createErrorResult(errorMessage: string, startTime: number): ToolExecutionResult {
    return {
      success: false,
      error: errorMessage,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Create validation error result
   *
   * @param errors - Validation errors
   * @param startTime - Execution start time
   * @returns Error result with helpful validation messages
   */
  private createValidationErrorResult(
    errors: ToolValidationError[],
    startTime: number
  ): ToolExecutionResult {
    const errorMessage =
      'Invalid parameters:\n' +
      errors
        .map((err) => {
          let msg = `  - ${err.parameter}: ${err.message}`;
          if (err.expected) {
            msg += ` (expected: ${err.expected})`;
          }
          if (err.received) {
            msg += ` (received: ${err.received})`;
          }
          return msg;
        })
        .join('\n');

    return this.createErrorResult(errorMessage, startTime);
  }

  /**
   * Format execution error into AI-friendly message
   *
   * @param error - Error object
   * @param toolName - Tool that failed
   * @returns Formatted error message
   */
  private formatExecutionError(error: unknown, toolName: string): string {
    if (error instanceof Error) {
      // File system errors
      if (error.message.includes('ENOENT')) {
        return `File or directory not found. Please check the path and try again.`;
      }
      if (error.message.includes('EACCES') || error.message.includes('EPERM')) {
        return `Permission denied accessing file or directory. Check file permissions.`;
      }
      if (error.message.includes('EISDIR')) {
        return `Path is a directory, not a file. Specify a file path instead.`;
      }
      if (error.message.includes('ENOTDIR')) {
        return `Path component is not a directory. Check the path structure.`;
      }

      // Generic error
      return `Tool '${toolName}' failed: ${error.message}`;
    }

    return `Tool '${toolName}' failed with unexpected error.`;
  }
}
