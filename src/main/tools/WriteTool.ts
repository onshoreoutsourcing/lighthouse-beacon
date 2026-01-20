/**
 * WriteTool
 *
 * AI tool for creating and updating files with atomic write operations.
 * Implements ToolExecutor interface for integration with the tool framework.
 *
 * Features:
 * - New file creation
 * - Existing file overwriting
 * - Atomic writes (temp file + rename) to prevent corruption
 * - Automatic parent directory creation
 * - SOC logging for compliance
 *
 * Security:
 * - Path validation via PathValidator
 * - Sandboxed to project root directory
 * - Permission prompt before write operations
 *
 * Usage:
 * const tool = new WriteTool(projectRoot);
 * const result = await tool.execute({ path: 'src/app.ts', content: '...' }, context);
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type {
  ToolDefinition,
  ToolExecutor,
  ToolExecutionContext,
  ToolExecutionResult,
  ToolValidationError,
} from '@shared/types';
import { PathValidator } from './PathValidator';

interface WriteToolParams {
  path: string;
  content: string;
  createParentDirs?: boolean;
}

interface WriteToolResult {
  path: string;
  bytesWritten: number;
  created: boolean;
  parentDirsCreated?: boolean;
}

export class WriteTool implements ToolExecutor {
  private validator: PathValidator;

  constructor(projectRoot: string) {
    this.validator = new PathValidator(projectRoot);
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'write_file',
      description:
        'Write content to a file in the project. Creates new files or overwrites existing ones. Uses atomic writes to prevent corruption. Can optionally create parent directories.',
      parameters: {
        path: {
          type: 'string',
          description:
            'Path to the file to write (relative to project root or absolute within project)',
          required: true,
        },
        content: {
          type: 'string',
          description: 'Content to write to the file (UTF-8 encoding)',
          required: true,
        },
        createParentDirs: {
          type: 'boolean',
          description:
            "If true, creates parent directories if they don't exist. Default: false. Set to true when creating files in new directory structures.",
        },
      },
      requiredParameters: ['path', 'content'],
      permissionRequirement: 'prompt',
      riskLevel: 'medium',
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

    // Validate content
    if (parameters.content === undefined || parameters.content === null) {
      errors.push({
        parameter: 'content',
        message: 'Content is required',
        expected: 'string',
        received: typeof parameters.content,
      });
    } else if (typeof parameters.content !== 'string') {
      errors.push({
        parameter: 'content',
        message: 'Content must be a string',
        expected: 'string',
        received: typeof parameters.content,
      });
    }

    // Validate createParentDirs if provided
    if (
      parameters.createParentDirs !== undefined &&
      typeof parameters.createParentDirs !== 'boolean'
    ) {
      errors.push({
        parameter: 'createParentDirs',
        message: 'createParentDirs must be a boolean',
        expected: 'boolean',
        received: typeof parameters.createParentDirs,
      });
    }

    return errors;
  }

  async execute(
    parameters: Record<string, unknown>,
    _context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      const params = parameters as unknown as WriteToolParams;

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

      // Check if file exists (to determine if this is creation or update)
      let fileExists = false;
      try {
        await fs.access(filePath);
        fileExists = true;
      } catch {
        // File doesn't exist - that's fine
      }

      // Check parent directory
      const parentDir = path.dirname(filePath);
      let parentDirCreated = false;

      try {
        await fs.access(parentDir);
      } catch {
        // Parent directory doesn't exist
        if (params.createParentDirs) {
          try {
            await fs.mkdir(parentDir, { recursive: true });
            parentDirCreated = true;
            // eslint-disable-next-line no-console
            console.log(`[WriteTool] Created parent directories for ${params.path}`);
          } catch (error) {
            return {
              success: false,
              error: `Failed to create parent directories: ${error instanceof Error ? error.message : 'Unknown error'}. Check file permissions.`,
              duration: Date.now() - startTime,
            };
          }
        } else {
          return {
            success: false,
            error: `Parent directory does not exist for '${params.path}'. Set createParentDirs to true to create directories automatically.`,
            duration: Date.now() - startTime,
          };
        }
      }

      // Atomic write: write to temp file, then rename
      const tempFileName = `.${path.basename(filePath)}.${crypto.randomBytes(6).toString('hex')}.tmp`;
      const tempFilePath = path.join(parentDir, tempFileName);

      try {
        // Write to temp file
        await fs.writeFile(tempFilePath, params.content, 'utf-8');

        // Atomic rename
        await fs.rename(tempFilePath, filePath);

        const bytesWritten = Buffer.byteLength(params.content, 'utf-8');

        const result: WriteToolResult = {
          path: params.path,
          bytesWritten,
          created: !fileExists,
        };

        if (parentDirCreated) {
          result.parentDirsCreated = true;
        }

        // SOC logging
        const action = fileExists ? 'Updated' : 'Created';
        // eslint-disable-next-line no-console
        console.log(`[WriteTool] ${action} file ${params.path} (${bytesWritten} bytes)`);

        return {
          success: true,
          data: result,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        // Clean up temp file on error
        try {
          await fs.unlink(tempFilePath);
        } catch {
          // Ignore cleanup errors
        }

        return {
          success: false,
          error: `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}. Check file permissions and disk space.`,
          duration: Date.now() - startTime,
        };
      }
    } catch (error) {
      console.error('[WriteTool] Execution error:', error);
      return {
        success: false,
        error: `Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
      };
    }
  }
}
