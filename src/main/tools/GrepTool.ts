/**
 * GrepTool
 *
 * AI tool for searching file contents using literal text or regex patterns.
 * Provides fast content search with result limiting, binary file exclusion,
 * and ReDoS protection.
 *
 * Features:
 * - Literal text and regex search modes
 * - Case-sensitive/insensitive search
 * - File pattern filtering (via glob)
 * - Result limiting (max 500 matches)
 * - Binary file exclusion
 * - ReDoS protection
 * - Performance: <1s for 10k file repos
 * - SOC audit logging
 *
 * Usage:
 * const tool = new GrepTool(fileSystemService);
 * const result = await tool.execute({ pattern: 'TODO', mode: 'text' }, context);
 */

import fg from 'fast-glob';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import type {
  ToolDefinition,
  ToolExecutor,
  ToolExecutionContext,
  ToolExecutionResult,
  ToolValidationError,
} from '@shared/types';
import { PathValidator } from './PathValidator';

/**
 * Grep search mode
 */
export type GrepMode = 'text' | 'regex';

/**
 * Grep tool parameters
 */
export interface GrepParams {
  /** Search pattern (literal text or regex depending on mode) */
  pattern: string;
  /** Search mode: 'text' for literal, 'regex' for regular expression */
  mode?: GrepMode;
  /** Case-insensitive search (default: false) */
  caseInsensitive?: boolean;
  /** File pattern to filter (glob pattern, e.g., "**\/*.ts") */
  filePattern?: string;
  /** Optional directory to search within (relative to project root) */
  cwd?: string;
}

/**
 * Match result
 */
export interface GrepMatch {
  /** File path (relative to project root) */
  file: string;
  /** Line number (1-based) */
  line: number;
  /** Line content (trimmed) */
  content: string;
  /** Match start position in line */
  matchStart: number;
  /** Match end position in line */
  matchEnd: number;
}

/**
 * Grep tool result
 */
export interface GrepResult {
  /** Array of matches */
  matches: GrepMatch[];
  /** Total number of matches found */
  totalMatches: number;
  /** Whether results were truncated */
  truncated: boolean;
  /** Pattern used for search */
  pattern: string;
  /** Search mode used */
  mode: GrepMode;
  /** Number of files searched */
  filesSearched: number;
}

/**
 * GrepTool implementation
 */
export class GrepTool implements ToolExecutor {
  private static readonly MAX_MATCHES = 500;
  private static readonly MAX_LINE_LENGTH = 1000; // Truncate very long lines
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max file size
  private static readonly BINARY_EXTENSIONS = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.bmp',
    '.ico',
    '.pdf',
    '.zip',
    '.tar',
    '.gz',
    '.7z',
    '.rar',
    '.exe',
    '.dll',
    '.so',
    '.dylib',
    '.bin',
    '.dat',
    '.db',
    '.sqlite',
    '.wasm',
    '.ttf',
    '.woff',
    '.woff2',
    '.eot',
    '.otf',
  ]);

  private static readonly DEFAULT_IGNORE = [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.next/**',
    '**/.nuxt/**',
    '**/out/**',
    '**/.cache/**',
  ];

  private projectRoot: string;
  private pathValidator: PathValidator;

  /**
   * Create GrepTool instance
   *
   * @param projectRoot - Project root directory (must be absolute)
   */
  constructor(projectRoot: string) {
    if (!path.isAbsolute(projectRoot)) {
      throw new Error('Project root must be an absolute path');
    }
    this.projectRoot = path.normalize(projectRoot);
    this.pathValidator = new PathValidator(this.projectRoot);
  }

  /**
   * Get tool definition for AI
   */
  getDefinition(): ToolDefinition {
    return {
      name: 'grep',
      description:
        'Search file contents for text patterns or regular expressions. ' +
        'Finds matches across files with line numbers and context. ' +
        'Automatically excludes binary files and common build directories. ' +
        'Returns up to 500 matches with file, line number, and content.',
      parameters: {
        pattern: {
          type: 'string',
          description:
            'Search pattern. In text mode, searches for literal string. ' +
            'In regex mode, uses JavaScript regular expression syntax. ' +
            'Examples: "TODO" (text), "function\\s+\\w+" (regex)',
          required: true,
        },
        mode: {
          type: 'string',
          description:
            'Search mode: "text" for literal text (default), "regex" for regular expression',
          required: false,
          enum: ['text', 'regex'],
        },
        caseInsensitive: {
          type: 'boolean',
          description: 'Perform case-insensitive search. Default: false (case-sensitive)',
          required: false,
        },
        filePattern: {
          type: 'string',
          description:
            'Optional glob pattern to filter files. ' +
            'Examples: "**/*.ts" (TypeScript files), "src/**/*.{js,jsx}" (JS files in src)',
          required: false,
        },
        cwd: {
          type: 'string',
          description:
            'Optional subdirectory to search within (relative to project root). ' +
            'Example: "src" to search only in src directory',
          required: false,
        },
      },
      requiredParameters: ['pattern'],
      permissionRequirement: 'none', // Read-only operation
      riskLevel: 'low',
    };
  }

  /**
   * Validate tool parameters
   */
  validate(parameters: Record<string, unknown>): ToolValidationError[] {
    const errors: ToolValidationError[] = [];

    // Validate pattern
    if (!parameters.pattern) {
      errors.push({
        parameter: 'pattern',
        message: 'Pattern is required',
        expected: 'non-empty string',
        received: String(parameters.pattern),
      });
    } else if (typeof parameters.pattern !== 'string') {
      errors.push({
        parameter: 'pattern',
        message: 'Pattern must be a string',
        expected: 'string',
        received: typeof parameters.pattern,
      });
    } else if (parameters.pattern.trim() === '') {
      errors.push({
        parameter: 'pattern',
        message: 'Pattern cannot be empty',
        expected: 'non-empty string',
        received: '""',
      });
    }

    // Validate mode if provided
    if (parameters.mode !== undefined) {
      if (typeof parameters.mode !== 'string') {
        errors.push({
          parameter: 'mode',
          message: 'Mode must be a string',
          expected: '"text" or "regex"',
          received: typeof parameters.mode,
        });
      } else if (parameters.mode !== 'text' && parameters.mode !== 'regex') {
        errors.push({
          parameter: 'mode',
          message: 'Mode must be "text" or "regex"',
          expected: '"text" or "regex"',
          received: parameters.mode,
        });
      }
    }

    // Validate regex pattern if mode is regex
    if (parameters.mode === 'regex' && typeof parameters.pattern === 'string') {
      try {
        // Test regex compilation and check for ReDoS patterns
        new RegExp(parameters.pattern);

        // Check for dangerous nested quantifiers (basic ReDoS protection)
        if (this.isReDoSVulnerable(parameters.pattern)) {
          errors.push({
            parameter: 'pattern',
            message:
              'Regex pattern contains dangerous nested quantifiers that could cause ReDoS. ' +
              'Avoid patterns like (a+)+ or (a*)*',
            expected: 'safe regex pattern',
            received: parameters.pattern,
          });
        }
      } catch (error) {
        errors.push({
          parameter: 'pattern',
          message: `Invalid regex pattern: ${error instanceof Error ? error.message : 'Unknown error'}`,
          expected: 'valid regex pattern',
          received: parameters.pattern,
        });
      }
    }

    // Validate caseInsensitive if provided
    if (
      parameters.caseInsensitive !== undefined &&
      typeof parameters.caseInsensitive !== 'boolean'
    ) {
      errors.push({
        parameter: 'caseInsensitive',
        message: 'caseInsensitive must be a boolean',
        expected: 'boolean',
        received: typeof parameters.caseInsensitive,
      });
    }

    // Validate filePattern if provided
    if (parameters.filePattern !== undefined && typeof parameters.filePattern !== 'string') {
      errors.push({
        parameter: 'filePattern',
        message: 'filePattern must be a string',
        expected: 'string (glob pattern)',
        received: typeof parameters.filePattern,
      });
    }

    // Validate cwd if provided
    if (parameters.cwd !== undefined) {
      if (typeof parameters.cwd !== 'string') {
        errors.push({
          parameter: 'cwd',
          message: 'CWD must be a string',
          expected: 'string',
          received: typeof parameters.cwd,
        });
      } else {
        const validation = this.pathValidator.validate(parameters.cwd);
        if (!validation.isValid) {
          errors.push({
            parameter: 'cwd',
            message: `CWD path is invalid: ${validation.error}`,
            expected: 'path within project root',
            received: parameters.cwd,
          });
        }
      }
    }

    return errors;
  }

  /**
   * Execute grep search
   */
  async execute(
    parameters: Record<string, unknown>,
    _context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      // Validate parameters
      const validationErrors = this.validate(parameters);
      if (validationErrors.length > 0) {
        const errorMessages = validationErrors
          .map((e) => `${e.parameter}: ${e.message}`)
          .join(', ');
        return {
          success: false,
          error: `Parameter validation failed: ${errorMessages}`,
          duration: Date.now() - startTime,
        };
      }

      const params = parameters as unknown as GrepParams;
      const mode = params.mode || 'text';

      // Determine search directory
      let searchDir = this.projectRoot;
      if (params.cwd) {
        const validation = this.pathValidator.validate(params.cwd);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Invalid cwd: ${validation.error}`,
            duration: Date.now() - startTime,
          };
        }
        searchDir = validation.absolutePath!;
      }

      // Build search pattern (regex)
      let searchRegex: RegExp;
      if (mode === 'text') {
        // Escape special regex characters for literal search
        const escapedPattern = params.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchRegex = new RegExp(escapedPattern, params.caseInsensitive ? 'gi' : 'g');
      } else {
        searchRegex = new RegExp(params.pattern, params.caseInsensitive ? 'gi' : 'g');
      }

      // Get files to search
      const filePattern = params.filePattern || '**/*';
      const files = await fg(filePattern, {
        cwd: searchDir,
        ignore: GrepTool.DEFAULT_IGNORE,
        dot: false,
        onlyFiles: true,
        followSymbolicLinks: false,
        absolute: false,
      });

      // Filter out binary files by extension
      const textFiles = files.filter((file) => !this.isBinaryFile(file));

      // Search files
      const matches: GrepMatch[] = [];
      let filesSearched = 0;
      let truncated = false;

      for (const file of textFiles) {
        if (matches.length >= GrepTool.MAX_MATCHES) {
          truncated = true;
          break;
        }

        const filePath = path.join(searchDir, file);

        // Check file size
        try {
          const stats = await fs.stat(filePath);
          if (stats.size > GrepTool.MAX_FILE_SIZE) {
            continue; // Skip very large files
          }
        } catch {
          continue; // Skip if we can't stat the file
        }

        // Search file contents
        const fileMatches = await this.searchFile(filePath, file, searchRegex);
        matches.push(...fileMatches);
        filesSearched++;

        // Stop if we've hit the limit
        if (matches.length >= GrepTool.MAX_MATCHES) {
          truncated = true;
          break;
        }
      }

      // Limit matches
      const limitedMatches = matches.slice(0, GrepTool.MAX_MATCHES);

      const result: GrepResult = {
        matches: limitedMatches,
        totalMatches: matches.length,
        truncated,
        pattern: params.pattern,
        mode,
        filesSearched,
      };

      const duration = Date.now() - startTime;

      // SOC logging
      // eslint-disable-next-line no-console
      console.log(
        `[GrepTool] Pattern: "${params.pattern}", Mode: ${mode}, ` +
          `CWD: "${params.cwd || '(root)'}", Files: ${filesSearched}, ` +
          `Matches: ${matches.length}, Truncated: ${truncated}, Duration: ${duration}ms`
      );

      return {
        success: true,
        data: result,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // SOC logging for errors
      console.error(
        `[GrepTool] Error: ${errorMessage}, Pattern: "${String(parameters.pattern)}", Duration: ${duration}ms`
      );

      return {
        success: false,
        error: `Grep search failed: ${errorMessage}`,
        duration,
      };
    }
  }

  /**
   * Search a single file for matches
   */
  private async searchFile(
    filePath: string,
    relativePath: string,
    regex: RegExp
  ): Promise<GrepMatch[]> {
    const matches: GrepMatch[] = [];

    try {
      const fileStream = createReadStream(filePath, { encoding: 'utf-8' });
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let lineNumber = 0;

      for await (const line of rl) {
        lineNumber++;

        // Reset regex lastIndex for global regex
        regex.lastIndex = 0;

        let match;
        while ((match = regex.exec(line)) !== null) {
          // Trim and limit line content
          const content =
            line.length > GrepTool.MAX_LINE_LENGTH
              ? line.substring(0, GrepTool.MAX_LINE_LENGTH) + '...'
              : line.trim();

          matches.push({
            file: relativePath,
            line: lineNumber,
            content,
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
          });

          // Prevent infinite loop on zero-length matches
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }

          // Stop if we've hit the limit
          if (matches.length >= GrepTool.MAX_MATCHES) {
            return matches;
          }
        }
      }
    } catch {
      // Skip files that can't be read (permissions, encoding issues, etc.)
      // This is a graceful failure - we continue searching other files
    }

    return matches;
  }

  /**
   * Check if file is binary based on extension
   */
  private isBinaryFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return GrepTool.BINARY_EXTENSIONS.has(ext);
  }

  /**
   * Basic ReDoS vulnerability detection
   * Checks for dangerous nested quantifiers like (a+)+ or (a*)*
   */
  private isReDoSVulnerable(pattern: string): boolean {
    // Check for nested quantifiers: (x+)+ or (x*)* or (x+)* etc.
    const nestedQuantifiers = /\([^)]*[*+]\)[*+]/;
    if (nestedQuantifiers.test(pattern)) {
      return true;
    }

    // Check for alternation with quantifiers: (a|b)+
    // This can be dangerous with certain patterns
    const alternationWithQuantifier = /\([^)]*\|[^)]*\)[*+]/;
    if (alternationWithQuantifier.test(pattern)) {
      // Only flag if it contains other quantifiers inside
      const hasInternalQuantifiers = /\([^)]*[*+][^)]*\|[^)]*\)[*+]/.test(pattern);
      if (hasInternalQuantifiers) {
        return true;
      }
    }

    return false;
  }
}
