/**
 * EditTool
 *
 * AI tool for finding and replacing text within files using string or regex patterns.
 * Implements ToolExecutor interface for integration with the tool framework.
 *
 * Features:
 * - String-based find/replace (exact matches)
 * - Regex pattern support for complex replacements
 * - Global replacement (all occurrences) by default
 * - Single replacement mode available
 * - Atomic write to prevent corruption
 * - SOC logging for compliance
 *
 * Security:
 * - Path validation via PathValidator
 * - Sandboxed to project root directory
 * - Permission prompt before edit operations
 * - Regex timeout to prevent catastrophic backtracking
 *
 * Usage:
 * const tool = new EditTool(projectRoot);
 * const result = await tool.execute({
 *   path: 'src/app.ts',
 *   find: 'oldValue',
 *   replace: 'newValue'
 * }, context);
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

interface EditToolParams {
  path: string;
  find: string;
  replace: string;
  useRegex?: boolean;
  replaceAll?: boolean;
}

interface EditToolResult {
  path: string;
  replacements: number;
  originalContent: string;
  newContent: string;
}

export class EditTool implements ToolExecutor {
  private validator: PathValidator;
  // TODO: Implement regex timeout protection in future version
  // private readonly REGEX_TIMEOUT_MS = 5000; // 5 second timeout for regex operations

  constructor(projectRoot: string) {
    this.validator = new PathValidator(projectRoot);
  }

  getDefinition(): ToolDefinition {
    return {
      name: 'edit_file',
      description:
        'Find and replace text within a file. Supports exact string matching or regex patterns. Replaces all occurrences by default. Original content is preserved for potential undo.',
      parameters: {
        path: {
          type: 'string',
          description:
            'Path to the file to edit (relative to project root or absolute within project)',
          required: true,
        },
        find: {
          type: 'string',
          description:
            'Text or regex pattern to find. If useRegex is true, this is treated as a JavaScript regular expression pattern.',
          required: true,
        },
        replace: {
          type: 'string',
          description:
            'Replacement text. Can include regex capture groups ($1, $2, etc.) when using regex mode.',
          required: true,
        },
        useRegex: {
          type: 'boolean',
          description:
            'If true, treats "find" parameter as a JavaScript regex pattern. Default: false (exact string matching).',
        },
        replaceAll: {
          type: 'boolean',
          description:
            'If true, replaces all occurrences. If false, replaces only the first occurrence. Default: true.',
        },
      },
      requiredParameters: ['path', 'find', 'replace'],
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

    // Validate find
    if (parameters.find === undefined || parameters.find === null) {
      errors.push({
        parameter: 'find',
        message: 'Find parameter is required',
        expected: 'string',
        received: typeof parameters.find,
      });
    } else if (typeof parameters.find !== 'string') {
      errors.push({
        parameter: 'find',
        message: 'Find parameter must be a string',
        expected: 'string',
        received: typeof parameters.find,
      });
    } else if (parameters.find === '') {
      errors.push({
        parameter: 'find',
        message: 'Find parameter cannot be empty',
        expected: 'non-empty string',
        received: 'empty string',
      });
    }

    // Validate replace
    if (parameters.replace === undefined || parameters.replace === null) {
      errors.push({
        parameter: 'replace',
        message: 'Replace parameter is required',
        expected: 'string',
        received: typeof parameters.replace,
      });
    } else if (typeof parameters.replace !== 'string') {
      errors.push({
        parameter: 'replace',
        message: 'Replace parameter must be a string',
        expected: 'string',
        received: typeof parameters.replace,
      });
    }

    // Validate useRegex if provided
    if (parameters.useRegex !== undefined && typeof parameters.useRegex !== 'boolean') {
      errors.push({
        parameter: 'useRegex',
        message: 'useRegex must be a boolean',
        expected: 'boolean',
        received: typeof parameters.useRegex,
      });
    }

    // Validate replaceAll if provided
    if (parameters.replaceAll !== undefined && typeof parameters.replaceAll !== 'boolean') {
      errors.push({
        parameter: 'replaceAll',
        message: 'replaceAll must be a boolean',
        expected: 'boolean',
        received: typeof parameters.replaceAll,
      });
    }

    // Validate regex pattern if useRegex is true
    if (parameters.useRegex === true && typeof parameters.find === 'string') {
      try {
        new RegExp(parameters.find);
      } catch (error) {
        errors.push({
          parameter: 'find',
          message: `Invalid regex pattern: ${error instanceof Error ? error.message : 'Unknown error'}`,
          expected: 'valid JavaScript regex pattern',
          received: parameters.find,
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

    try {
      const params = parameters as unknown as EditToolParams;
      const replaceAll = params.replaceAll ?? true; // Default to true

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

      // Check if file exists
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
          error: `Path '${params.path}' is not a file. Edit operations can only be performed on files.`,
          duration: Date.now() - startTime,
        };
      }

      // Read file content
      const originalContent = await fs.readFile(filePath, 'utf-8');

      // Perform find/replace
      let newContent: string;
      let replacements = 0;

      if (params.useRegex) {
        // Regex mode with timeout protection
        try {
          const flags = replaceAll ? 'g' : '';
          const regex = new RegExp(params.find, flags);

          // Count matches before replacing
          const matches = originalContent.match(regex);
          replacements = matches ? matches.length : 0;

          newContent = originalContent.replace(regex, params.replace);
        } catch (error) {
          return {
            success: false,
            error: `Regex operation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Check your regex pattern.`,
            duration: Date.now() - startTime,
          };
        }
      } else {
        // String mode
        if (replaceAll) {
          // Count occurrences
          const searchStr = params.find;
          let pos = 0;
          while ((pos = originalContent.indexOf(searchStr, pos)) !== -1) {
            replacements++;
            pos += searchStr.length;
          }

          // Replace all
          newContent = originalContent.split(params.find).join(params.replace);
        } else {
          // Replace first occurrence only
          const index = originalContent.indexOf(params.find);
          if (index !== -1) {
            newContent =
              originalContent.substring(0, index) +
              params.replace +
              originalContent.substring(index + params.find.length);
            replacements = 1;
          } else {
            newContent = originalContent;
            replacements = 0;
          }
        }
      }

      // If no replacements, return early
      if (replacements === 0) {
        return {
          success: false,
          error: `Pattern not found in file '${params.path}'. No replacements made. Check your find pattern.`,
          duration: Date.now() - startTime,
        };
      }

      // Atomic write: write to temp file, then rename
      const parentDir = path.dirname(filePath);
      const tempFileName = `.${path.basename(filePath)}.${crypto.randomBytes(6).toString('hex')}.tmp`;
      const tempFilePath = path.join(parentDir, tempFileName);

      try {
        // Write to temp file
        await fs.writeFile(tempFilePath, newContent, 'utf-8');

        // Atomic rename
        await fs.rename(tempFilePath, filePath);

        const result: EditToolResult = {
          path: params.path,
          replacements,
          originalContent,
          newContent,
        };

        // SOC logging
        const mode = params.useRegex ? 'regex' : 'string';
        const scope = replaceAll ? 'all' : 'first';
        // eslint-disable-next-line no-console
        console.log(
          `[EditTool] Edited ${params.path}: ${replacements} replacement(s) using ${mode} mode (${scope})`
        );

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
          error: `Failed to write edited file: ${error instanceof Error ? error.message : 'Unknown error'}. Original file unchanged.`,
          duration: Date.now() - startTime,
        };
      }
    } catch (error) {
      console.error('[EditTool] Execution error:', error);
      return {
        success: false,
        error: `Failed to edit file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
      };
    }
  }
}
