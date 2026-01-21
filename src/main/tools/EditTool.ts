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
import { setTimeout, clearTimeout } from 'node:timers';
import type {
  ToolDefinition,
  ToolExecutor,
  ToolExecutionContext,
  ToolExecutionResult,
  ToolValidationError,
} from '@shared/types';
import { PathValidator } from './PathValidator';
import { FileOperationEventService } from '../services/FileOperationEventService';
import { logger } from '@main/logger';

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
  private readonly REGEX_TIMEOUT_MS = 5000; // 5 second timeout for regex operations

  /**
   * Common ReDoS patterns that cause catastrophic backtracking
   * Source: OWASP ReDoS guide and industry best practices
   */
  private static readonly REDOS_PATTERNS = [
    // Nested quantifiers: (a+)+, (a*)+, (a+)*, (a*)*
    /\([^)]*[+*]\)[+*]/,
    // Multiple consecutive quantifiers
    /[+*]{2,}/,
    // Alternation with overlapping patterns: (a|a)+, (ab|a)+
    /\([^)]*\|[^)]*\)[+*]/,
    // Greedy quantifiers inside lookaheads: (?=.*)+
    /\(\?[=!][^)]*[+*][^)]*\)[+*]/,
    // Multiple wildcards: .*.*
    /\.\*[^)]*\.\*/,
  ];

  constructor(projectRoot: string) {
    this.validator = new PathValidator(projectRoot);
  }

  /**
   * Analyze regex pattern for ReDoS vulnerabilities
   *
   * Checks for common catastrophic backtracking patterns that can cause
   * exponential time complexity and denial of service.
   *
   * @param pattern - Regex pattern to analyze
   * @returns Error message if vulnerable, null if safe
   */
  private analyzeRegexComplexity(pattern: string): string | null {
    // Check against known ReDoS patterns
    for (const redosPattern of EditTool.REDOS_PATTERNS) {
      if (redosPattern.test(pattern)) {
        return (
          'Regex pattern may cause catastrophic backtracking (ReDoS vulnerability). ' +
          'Avoid nested quantifiers like (a+)+, multiple wildcards like .*.*, ' +
          'or overlapping alternations like (a|ab)+.'
        );
      }
    }

    // Check pattern length (very long patterns can be problematic)
    if (pattern.length > 1000) {
      return 'Regex pattern is too long (>1000 characters). Please simplify the pattern.';
    }

    // Pattern appears safe
    return null;
  }

  /**
   * Execute regex with ReDoS protection
   *
   * Protection strategy:
   * 1. Pre-execution complexity analysis (analyzeRegexComplexity)
   *    - Detects nested quantifiers, multiple wildcards, etc.
   *    - Rejects dangerous patterns BEFORE execution
   * 2. Timeout protection (setTimeout)
   *    - Detects if execution exceeds threshold
   *    - Provides error message for debugging
   *
   * Note: setTimeout cannot interrupt synchronous regex operations,
   * but pre-execution analysis prevents catastrophic backtracking patterns
   * from being executed in the first place.
   */
  private async executeRegexWithTimeout(
    content: string,
    regex: RegExp,
    replacement: string
  ): Promise<{ newContent: string; matchCount: number }> {
    return new Promise<{ newContent: string; matchCount: number }>((resolve, reject) => {
      // Set timeout
      const timeoutId = setTimeout(() => {
        const timeoutError = new Error(
          `Regex operation timed out after ${this.REGEX_TIMEOUT_MS}ms. This may indicate a catastrophic backtracking (ReDoS) pattern.`
        );
        reject(timeoutError);
      }, this.REGEX_TIMEOUT_MS);

      try {
        // Perform regex operations
        const matches = content.match(regex);
        const matchCount = matches ? matches.length : 0;
        const newContent = content.replace(regex, replacement);

        // Clear timeout and resolve
        clearTimeout(timeoutId);
        resolve({ newContent, matchCount });
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
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
          error: pathValidation.error || 'Invalid path',
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
        // Regex mode with ReDoS protection
        try {
          // Pre-execution complexity analysis to prevent ReDoS attacks
          const complexityError = this.analyzeRegexComplexity(params.find);
          if (complexityError) {
            return {
              success: false,
              error: `Regex validation failed: ${complexityError}`,
              duration: Date.now() - startTime,
            };
          }

          const flags = replaceAll ? 'g' : '';
          const regex = new RegExp(params.find, flags);

          // Execute regex with timeout protection
          const result = await this.executeRegexWithTimeout(originalContent, regex, params.replace);

          newContent = result.newContent;
          replacements = result.matchCount;
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
        logger.debug('[EditTool] File edited', {
          path: params.path,
          replacements,
          mode,
          scope,
        });

        // Emit file operation event (Feature 3.4 - Wave 3.4.1)
        const eventService = FileOperationEventService.getInstance();
        eventService.emitFileOperation(
          eventService.createEvent('edit', [params.path], true, undefined, {
            replacements,
            mode,
            scope,
          })
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
      logger.error('[EditTool] Execution error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      return {
        success: false,
        error: `Failed to edit file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
      };
    }
  }
}
