/**
 * ReadTool
 *
 * AI tool for reading file contents with optional line range selection.
 * Implements ToolExecutor interface for integration with the tool framework.
 *
 * Features:
 * - Full file reading with UTF-8 encoding
 * - Line range selection (startLine, endLine)
 * - Total line count for AI context
 * - File size warnings for large files
 * - SOC logging for compliance
 *
 * Security:
 * - Path validation via PathValidator
 * - Sandboxed to project root directory
 *
 * Usage:
 * const tool = new ReadTool(projectRoot);
 * const result = await tool.execute({ path: 'src/app.ts' }, context);
 */

import { promises as fs } from 'node:fs';
import type {
  ToolDefinition,
  ToolExecutor,
  ToolExecutionContext,
  ToolExecutionResult,
  ToolValidationError,
} from '@shared/types';
import { PathValidator } from './PathValidator';
import { logger } from '@main/logger';

interface ReadToolParams {
  path: string;
  startLine?: number;
  endLine?: number;
}

interface ReadToolResult {
  content: string;
  totalLines: number;
  path: string;
  linesRead?: { start: number; end: number };
}

export class ReadTool implements ToolExecutor {
  private validator: PathValidator;

  constructor(projectRoot: string) {
    this.validator = new PathValidator(projectRoot);
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'read_file',
      description:
        'Read the contents of a file from the project. Supports reading entire files or specific line ranges. Returns file content, total line count, and metadata.',
      parameters: {
        path: {
          type: 'string',
          description:
            'Path to the file to read (relative to project root or absolute within project)',
          required: true,
        },
        startLine: {
          type: 'number',
          description:
            'Optional: Starting line number (1-based). If provided, only reads from this line onwards.',
        },
        endLine: {
          type: 'number',
          description:
            'Optional: Ending line number (1-based, inclusive). If provided with startLine, reads only the specified range.',
        },
      },
      requiredParameters: ['path'],
      permissionRequirement: 'none',
      riskLevel: 'low',
    };
  }

  validate(parameters: Record<string, unknown>): ToolValidationError[] {
    const errors: ToolValidationError[] = [];

    // Validate path
    if (!parameters.path || typeof parameters.path !== 'string') {
      errors.push({
        parameter: 'path',
        message: 'Path is required and must be a string',
        expected: 'string',
        received: typeof parameters.path,
      });
    } else if (parameters.path.trim() === '') {
      errors.push({
        parameter: 'path',
        message: 'Path cannot be empty',
        expected: 'non-empty string',
        received: 'empty string',
      });
    }

    // Validate startLine if provided
    if (parameters.startLine !== undefined) {
      if (typeof parameters.startLine !== 'number') {
        errors.push({
          parameter: 'startLine',
          message: 'startLine must be a number',
          expected: 'number',
          received: typeof parameters.startLine,
        });
      } else if (parameters.startLine < 1) {
        errors.push({
          parameter: 'startLine',
          message: 'startLine must be >= 1 (line numbers are 1-based)',
          expected: 'number >= 1',
          received: String(parameters.startLine),
        });
      }
    }

    // Validate endLine if provided
    if (parameters.endLine !== undefined) {
      if (typeof parameters.endLine !== 'number') {
        errors.push({
          parameter: 'endLine',
          message: 'endLine must be a number',
          expected: 'number',
          received: typeof parameters.endLine,
        });
      } else if (parameters.endLine < 1) {
        errors.push({
          parameter: 'endLine',
          message: 'endLine must be >= 1 (line numbers are 1-based)',
          expected: 'number >= 1',
          received: String(parameters.endLine),
        });
      }

      // Validate range relationship
      if (
        parameters.startLine !== undefined &&
        typeof parameters.startLine === 'number' &&
        typeof parameters.endLine === 'number' &&
        parameters.endLine < parameters.startLine
      ) {
        errors.push({
          parameter: 'endLine',
          message: 'endLine must be >= startLine',
          expected: `number >= ${parameters.startLine}`,
          received: String(parameters.endLine),
        });
      }
    }

    return errors;
  }

  async execute(
    parameters: Record<string, unknown>,
    _context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const params = parameters as unknown as ReadToolParams;

    try {
      // Validate path security
      const pathValidation = this.validator.validate(params.path);
      if (!pathValidation.isValid) {
        return {
          success: false,
          error: pathValidation.error,
          duration: Date.now() - startTime,
        };
      }

      const filePath = pathValidation.absolutePath!;

      // Check if file exists and is a file
      let stats;
      try {
        stats = await fs.stat(filePath);
      } catch {
        return {
          success: false,
          error: `File not found: '${params.path}'. Please check the path and try again.`,
          duration: Date.now() - startTime,
        };
      }

      if (!stats.isFile()) {
        return {
          success: false,
          error: `Path '${params.path}' is not a file. Use directory listing tools to explore directories.`,
          duration: Date.now() - startTime,
        };
      }

      // Warn about large files (>10MB)
      const maxSafeSize = 10 * 1024 * 1024; // 10MB
      if (stats.size > maxSafeSize) {
        logger.warn('[ReadTool] Large file warning', {
          path: params.path,
          sizeMB: (stats.size / 1024 / 1024).toFixed(2),
        });
      }

      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const totalLines = lines.length;

      // Handle line range selection
      if (params.startLine !== undefined || params.endLine !== undefined) {
        const start = params.startLine ?? 1;
        const end = params.endLine ?? totalLines;

        // Validate range against actual file
        if (start > totalLines) {
          return {
            success: false,
            error: `startLine ${start} exceeds total lines in file (${totalLines}). File has ${totalLines} line(s).`,
            duration: Date.now() - startTime,
          };
        }

        const selectedLines = lines.slice(start - 1, end);
        const result: ReadToolResult = {
          content: selectedLines.join('\n'),
          totalLines,
          path: params.path,
          linesRead: { start, end: Math.min(end, totalLines) },
        };

        // SOC logging
        logger.debug('[ReadTool] Read lines from file', {
          path: params.path,
          lineRange: `${start}-${Math.min(end, totalLines)}`,
          totalLines,
        });

        return {
          success: true,
          data: result,
          duration: Date.now() - startTime,
        };
      }

      // Full file read
      const result: ReadToolResult = {
        content,
        totalLines,
        path: params.path,
      };

      // SOC logging
      logger.debug('[ReadTool] Read full file', {
        path: params.path,
        totalLines,
        sizeBytes: stats.size,
      });

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('[ReadTool] Execution error', {
        path: params.path,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        success: false,
        error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}. Please check file permissions and try again.`,
        duration: Date.now() - startTime,
      };
    }
  }
}
