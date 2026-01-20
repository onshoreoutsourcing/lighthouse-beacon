/**
 * PathValidator
 *
 * Security utility for validating file paths against directory sandboxing rules.
 * Ensures all file operations are restricted to the project root directory.
 *
 * Security Features:
 * - Directory traversal prevention (../ attacks)
 * - Symlink escape detection
 * - Absolute path validation
 * - Cross-platform path handling
 *
 * Reference: ADR-011 - Directory Sandboxing Approach
 */

import * as path from 'node:path';
import { promises as fs } from 'node:fs';

export interface PathValidationResult {
  valid: boolean;
  normalizedPath?: string;
  error?: string;
}

export class PathValidator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    if (!path.isAbsolute(projectRoot)) {
      throw new Error('Project root must be an absolute path');
    }
    this.projectRoot = path.normalize(projectRoot);
  }

  /**
   * Validate that a file path is within the project root directory.
   * Prevents directory traversal attacks and symlink escapes.
   *
   * @param filePath - Path to validate (relative or absolute)
   * @returns Validation result with normalized path or error
   */
  validate(filePath: string): PathValidationResult {
    try {
      // Resolve to absolute path and normalize
      const absolutePath = path.isAbsolute(filePath)
        ? path.normalize(filePath)
        : path.normalize(path.join(this.projectRoot, filePath));

      // Check if path is within project root
      const relativePath = path.relative(this.projectRoot, absolutePath);

      // Directory traversal detected
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        return {
          valid: false,
          error: `Access denied: Path '${filePath}' is outside project root. All operations must be within the project directory.`,
        };
      }

      return {
        valid: true,
        normalizedPath: absolutePath,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Path validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validate path and check if it resolves to a real file (not a symlink escape).
   * This performs filesystem checks to detect symlink traversal attacks.
   *
   * @param filePath - Path to validate
   * @returns Validation result with real path or error
   */
  async validateRealPath(filePath: string): Promise<PathValidationResult> {
    const basicValidation = this.validate(filePath);
    if (!basicValidation.valid) {
      return basicValidation;
    }

    try {
      // Resolve symlinks to their real path
      const realPath = await fs.realpath(basicValidation.normalizedPath!);

      // Check if real path is still within project root
      const relativePath = path.relative(this.projectRoot, realPath);
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        return {
          valid: false,
          error: `Access denied: Symlink '${filePath}' escapes project root. Symlinks must resolve within the project directory.`,
        };
      }

      return {
        valid: true,
        normalizedPath: realPath,
      };
    } catch (error) {
      // If file doesn't exist, realpath fails - that's okay, return the normalized path
      // The calling tool will handle non-existent files appropriately
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return basicValidation;
      }

      return {
        valid: false,
        error: `Path validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get the project root directory
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }

  /**
   * Convert an absolute path to a path relative to project root
   */
  toRelativePath(absolutePath: string): string {
    return path.relative(this.projectRoot, absolutePath);
  }
}
