import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { DirectoryContents, FileContents, FileEntry, WriteFileOptions } from '@shared/types';

/**
 * FileSystemService
 *
 * Provides secure file system operations with path validation.
 * All operations are restricted to a project root directory to prevent
 * directory traversal attacks and unauthorized file access.
 *
 * Security Features:
 * - Path validation prevents access outside project root
 * - Normalized paths prevent symbolic link exploits
 * - Proper error handling without exposing internal paths
 */
export class FileSystemService {
  private projectRoot: string | null = null;

  /**
   * Set the project root directory for all file operations.
   * All subsequent operations will be restricted to this directory and its subdirectories.
   *
   * @param rootPath - Absolute path to project root directory
   * @throws Error if path is not absolute or doesn't exist
   */
  async setProjectRoot(rootPath: string): Promise<void> {
    if (!path.isAbsolute(rootPath)) {
      throw new Error('Project root must be an absolute path');
    }

    // Verify directory exists and is accessible
    try {
      const stats = await fs.stat(rootPath);
      if (!stats.isDirectory()) {
        throw new Error('Project root must be a directory');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Cannot access project root: ${error.message}`);
      }
      throw error;
    }

    // Store normalized absolute path
    this.projectRoot = path.normalize(rootPath);
  }

  /**
   * Get the current project root directory
   *
   * @returns Current project root path or null if not set
   */
  getProjectRoot(): string | null {
    return this.projectRoot;
  }

  /**
   * Validate and normalize a file path to ensure it's within project root.
   * Prevents directory traversal attacks by checking that the resolved path
   * is within the project root.
   *
   * @param filePath - Path to validate (relative or absolute)
   * @returns Normalized absolute path
   * @throws Error if path is outside project root or project root not set
   */
  private validatePath(filePath: string): string {
    if (!this.projectRoot) {
      throw new Error('Project root not set. Call setProjectRoot() first.');
    }

    // Resolve to absolute path and normalize
    const absolutePath = path.isAbsolute(filePath)
      ? path.normalize(filePath)
      : path.normalize(path.join(this.projectRoot, filePath));

    // Check if path is within project root
    const relativePath = path.relative(this.projectRoot, absolutePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new Error('Access denied: Path is outside project root');
    }

    return absolutePath;
  }

  /**
   * Read directory contents and return file/folder metadata.
   *
   * @param dirPath - Directory path (relative to project root or absolute within project)
   * @returns Directory contents with file entries
   * @throws Error if directory doesn't exist or is inaccessible
   */
  async readDirectory(dirPath: string): Promise<DirectoryContents> {
    const validatedPath = this.validatePath(dirPath);

    try {
      const entries = await fs.readdir(validatedPath, { withFileTypes: true });

      const fileEntries: FileEntry[] = await Promise.all(
        entries.map(async (entry) => {
          const entryPath = path.join(validatedPath, entry.name);
          const stats = await fs.stat(entryPath);

          return {
            name: entry.name,
            path: entryPath,
            type: entry.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            modified: stats.mtime,
          };
        })
      );

      return {
        path: validatedPath,
        entries: fileEntries,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read directory: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Read file contents as a string.
   *
   * @param filePath - File path (relative to project root or absolute within project)
   * @param encoding - Text encoding (default: 'utf-8')
   * @returns File contents
   * @throws Error if file doesn't exist or is inaccessible
   */
  async readFile(filePath: string, encoding = 'utf-8'): Promise<FileContents> {
    const validatedPath = this.validatePath(filePath);

    try {
      // Verify it's a file, not a directory
      const stats = await fs.stat(validatedPath);
      if (!stats.isFile()) {
        throw new Error('Path is not a file');
      }

      const content = await fs.readFile(validatedPath, 'utf-8');

      return {
        path: validatedPath,
        content,
        encoding,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to read file: ${error.message}`);
      }
      throw new Error('Failed to read file: Unknown error');
    }
  }

  /**
   * Write content to a file.
   * Creates the file if it doesn't exist, overwrites if it does.
   *
   * @param options - Write options including path, content, and encoding
   * @returns Path of written file
   * @throws Error if write operation fails
   */
  async writeFile(options: WriteFileOptions): Promise<string> {
    const { path: filePath, content } = options;
    const validatedPath = this.validatePath(filePath);

    try {
      // Ensure parent directory exists
      const dirPath = path.dirname(validatedPath);
      await fs.mkdir(dirPath, { recursive: true });

      // Write file as UTF-8
      await fs.writeFile(validatedPath, content, 'utf-8');

      return validatedPath;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to write file: ${error.message}`);
      }
      throw new Error('Failed to write file: Unknown error');
    }
  }

  /**
   * Check if a path exists and is accessible.
   *
   * @param filePath - Path to check
   * @returns True if path exists and is accessible
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      const validatedPath = this.validatePath(filePath);
      await fs.access(validatedPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a new directory.
   *
   * @param dirPath - Directory path to create
   * @returns Path of created directory
   * @throws Error if directory creation fails
   */
  async createDirectory(dirPath: string): Promise<string> {
    const validatedPath = this.validatePath(dirPath);

    try {
      await fs.mkdir(validatedPath, { recursive: true });
      return validatedPath;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create directory: ${error.message}`);
      }
      throw new Error('Failed to create directory: Unknown error');
    }
  }
}
