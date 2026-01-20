/**
 * DeleteTool
 *
 * AI tool for deleting files and directories from the project.
 * Implements ToolExecutor interface for integration with the tool framework.
 *
 * Features:
 * - Individual file deletion
 * - Empty directory deletion
 * - Recursive directory deletion (requires explicit flag)
 * - Deletion metadata (type, items deleted)
 * - SOC logging for compliance
 *
 * Security:
 * - Path validation via PathValidator
 * - Sandboxed to project root directory
 * - ALWAYS prompts for permission (no session trust)
 * - Recursive deletion requires explicit flag
 *
 * Usage:
 * const tool = new DeleteTool(projectRoot);
 * const result = await tool.execute({ path: 'temp/file.txt' }, context);
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
import { FileOperationEventService } from '../services/FileOperationEventService';

interface DeleteToolParams {
  path: string;
  recursive?: boolean;
}

interface DeleteToolResult {
  path: string;
  type: 'file' | 'directory';
  itemsDeleted: number;
}

export class DeleteTool implements ToolExecutor {
  private validator: PathValidator;

  constructor(projectRoot: string) {
    this.validator = new PathValidator(projectRoot);
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'delete_file',
      description:
        'Delete a file or directory from the project. Empty directories can be deleted without flags. Non-empty directories require recursive flag. ALWAYS prompts for user confirmation.',
      parameters: {
        path: {
          type: 'string',
          description:
            'Path to the file or directory to delete (relative to project root or absolute within project)',
          required: true,
        },
        recursive: {
          type: 'boolean',
          description:
            'Required for deleting non-empty directories. If true, recursively deletes directory and all contents. Default: false. Use with caution.',
        },
      },
      requiredParameters: ['path'],
      permissionRequirement: 'always_prompt',
      riskLevel: 'high',
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

    // Validate recursive if provided
    if (parameters.recursive !== undefined && typeof parameters.recursive !== 'boolean') {
      errors.push({
        parameter: 'recursive',
        message: 'recursive must be a boolean',
        expected: 'boolean',
        received: typeof parameters.recursive,
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
      const params = parameters as DeleteToolParams;

      // Validate path security
      const pathValidation = this.validator.validate(params.path);
      if (!pathValidation.isValid) {
        return {
          success: false,
          error: pathValidation.error || 'Invalid path',
          duration: Date.now() - startTime,
        };
      }

      const filePath = pathValidation.absolutePath!;

      // Check if path exists
      let stats;
      try {
        stats = await fs.stat(filePath);
      } catch {
        return {
          success: false,
          error: `Path not found: '${params.path}'. Nothing to delete.`,
          duration: Date.now() - startTime,
        };
      }

      const isDirectory = stats.isDirectory();
      const recursive = params.recursive ?? false;

      // Handle directory deletion
      if (isDirectory) {
        // Check if directory is empty
        const entries = await fs.readdir(filePath);
        const isEmpty = entries.length === 0;

        if (!isEmpty && !recursive) {
          return {
            success: false,
            error: `Directory '${params.path}' is not empty. Set recursive to true to delete directory and all contents. This will permanently delete ${entries.length} item(s).`,
            duration: Date.now() - startTime,
          };
        }

        // Count items being deleted
        const itemsDeleted = await this.countDirectoryItems(filePath);

        // Delete directory
        await fs.rm(filePath, { recursive: true, force: false });

        const result: DeleteToolResult = {
          path: params.path,
          type: 'directory',
          itemsDeleted,
        };

        // SOC logging
        // eslint-disable-next-line no-console
        console.log(`[DeleteTool] Deleted directory ${params.path} (${itemsDeleted} items)`);

        // Emit file operation event (Feature 3.4 - Wave 3.4.1)
        const eventService = FileOperationEventService.getInstance();
        eventService.emitFileOperation(
          eventService.createEvent('delete', [params.path], true, undefined, {
            type: 'directory',
            itemsDeleted,
          })
        );

        return {
          success: true,
          data: result,
          duration: Date.now() - startTime,
        };
      }

      // Handle file deletion
      await fs.unlink(filePath);

      const result: DeleteToolResult = {
        path: params.path,
        type: 'file',
        itemsDeleted: 1,
      };

      // SOC logging
      // eslint-disable-next-line no-console
      console.log(`[DeleteTool] Deleted file ${params.path}`);

      // Emit file operation event (Feature 3.4 - Wave 3.4.1)
      const eventService = FileOperationEventService.getInstance();
      eventService.emitFileOperation(
        eventService.createEvent('delete', [params.path], true, undefined, {
          type: 'file',
          itemsDeleted: 1,
        })
      );

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[DeleteTool] Execution error:', error);
      return {
        success: false,
        error: `Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}. Check permissions.`,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Recursively count items in a directory
   */
  private async countDirectoryItems(dirPath: string): Promise<number> {
    let count = 0;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        count++; // Count this entry

        if (entry.isDirectory()) {
          const subDirPath = `${dirPath}/${entry.name}`;
          count += await this.countDirectoryItems(subDirPath);
        }
      }
    } catch {
      // If we can't read a directory, just return current count
    }

    return count;
  }
}
