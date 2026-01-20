/**
 * PathValidator
 *
 * Utility for validating and normalizing file system paths to ensure they remain
 * within the project root directory. Provides directory sandboxing for security.
 *
 * Security Features:
 * - Prevents directory traversal attacks (../ patterns)
 * - Normalizes paths to absolute form
 * - Validates paths are within project boundaries
 * - Resolves symbolic links to prevent escape attacks
 *
 * Usage:
 * const validator = new PathValidator('/project/root');
 * const safePath = validator.validate('src/file.ts'); // OK
 * validator.validate('../etc/passwd'); // Throws error
 */

import * as path from 'node:path';
import { realpathSync } from 'node:fs';

export interface PathValidationResult {
  /** Whether path is valid (within project root) */
  isValid: boolean;
  /** Normalized absolute path (if valid) */
  absolutePath?: string;
  /** Relative path from project root (if valid) */
  relativePath?: string;
  /** Error message (if invalid) */
  error?: string;
}

/**
 * Path validator for directory sandboxing
 */
export class PathValidator {
  private projectRoot: string;

  /**
   * Create a new PathValidator
   *
   * @param projectRoot - Absolute path to project root directory
   * @throws Error if projectRoot is not absolute
   */
  constructor(projectRoot: string) {
    if (!path.isAbsolute(projectRoot)) {
      throw new Error('Project root must be an absolute path');
    }
    this.projectRoot = path.normalize(projectRoot);
  }

  /**
   * Get the project root path
   *
   * @returns Normalized project root
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }

  /**
   * Validate a path to ensure it's within project root
   *
   * @param filePath - Path to validate (relative or absolute)
   * @returns Validation result with normalized paths or error
   */
  validate(filePath: string): PathValidationResult {
    try {
      // Resolve to absolute path and normalize
      let absolutePath = path.isAbsolute(filePath)
        ? path.normalize(filePath)
        : path.normalize(path.join(this.projectRoot, filePath));

      // Resolve symbolic links if path exists
      // This prevents symlink attacks where a link points outside project root
      try {
        const realPath = realpathSync(absolutePath);
        absolutePath = realPath;
      } catch {
        // Path doesn't exist yet (e.g., creating new file) - use normalized path
        // This is OK because we'll validate it doesn't escape via relative path check
        //
        // FUTURE ENHANCEMENT: For non-existent paths, validate parent directory
        // symlinks by resolving parent paths incrementally until an existing
        // directory is found. This would prevent symlink creation that points
        // outside the project root.
      }

      // Check if path is within project root
      const relativePath = path.relative(this.projectRoot, absolutePath);

      // Path is invalid if it starts with '..' or is absolute (means outside root)
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        return {
          isValid: false,
          error: 'Path is outside project root',
        };
      }

      return {
        isValid: true,
        absolutePath,
        relativePath,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  }

  /**
   * Validate a path and throw if invalid (convenience method)
   *
   * @param filePath - Path to validate
   * @returns Normalized absolute path
   * @throws Error if path is invalid or outside project root
   */
  validateOrThrow(filePath: string): string {
    const result = this.validate(filePath);
    if (!result.isValid) {
      throw new Error(`Invalid path: ${result.error}`);
    }
    return result.absolutePath!;
  }

  /**
   * Validate multiple paths
   *
   * @param filePaths - Array of paths to validate
   * @returns Array of validation results
   */
  validateMany(filePaths: string[]): PathValidationResult[] {
    return filePaths.map((p) => this.validate(p));
  }

  /**
   * Check if a path is within project root (boolean shorthand)
   *
   * @param filePath - Path to check
   * @returns True if path is valid and within project root
   */
  isWithinRoot(filePath: string): boolean {
    return this.validate(filePath).isValid;
  }

  /**
   * Convert absolute path to relative (from project root)
   *
   * @param absolutePath - Absolute path to convert
   * @returns Relative path from project root, or null if outside root
   */
  toRelative(absolutePath: string): string | null {
    const result = this.validate(absolutePath);
    return result.isValid ? result.relativePath! : null;
  }

  /**
   * Convert relative path to absolute
   *
   * @param relativePath - Relative path from project root
   * @returns Absolute path, or null if outside root
   */
  toAbsolute(relativePath: string): string | null {
    const result = this.validate(relativePath);
    return result.isValid ? result.absolutePath! : null;
  }
}
