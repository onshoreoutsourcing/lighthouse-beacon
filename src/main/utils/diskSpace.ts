/**
 * Disk Space Monitoring Utility
 *
 * Provides functions to check available disk space and return warnings/critical alerts
 * when space is low. Used for log file management and space monitoring.
 *
 * **Requirements:**
 * - Node.js 19.6.0 or higher (for fs.statfs support)
 *
 * Thresholds:
 * - Warning: <1GB available
 * - Critical: <100MB available
 *
 * Usage:
 * const result = await checkDiskSpaceWarning('/path/to/logs');
 * if (result.critical) {
 *   // Alert user - very low disk space
 * } else if (result.warning) {
 *   // Warn user - low disk space
 * }
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Disk space check result
 */
export interface DiskSpaceResult {
  /** Warning flag - disk space <1GB */
  warning: boolean;
  /** Critical flag - disk space <100MB */
  critical: boolean;
  /** Available disk space in gigabytes */
  availableGB: number;
  /** Available disk space in bytes */
  availableBytes: number;
}

/**
 * Get available disk space for a given path
 *
 * @param targetPath - Path to check disk space for
 * @returns Available disk space in bytes
 * @throws Error if path doesn't exist or statfs fails
 */
export async function getAvailableDiskSpace(targetPath: string): Promise<number> {
  // Resolve to absolute path
  const absolutePath = path.resolve(targetPath);

  // Find first existing directory in the path hierarchy
  let checkPath = absolutePath;
  let pathExists = false;

  while (!pathExists) {
    try {
      await fs.access(checkPath);
      pathExists = true;
    } catch {
      // Path doesn't exist, try parent directory
      const parentPath = path.dirname(checkPath);

      // If we've reached the root and it still doesn't exist, something is wrong
      if (parentPath === checkPath) {
        throw new Error(`Unable to find existing directory in path hierarchy: ${absolutePath}`);
      }

      checkPath = parentPath;
    }
  }

  // Get filesystem stats
  // Note: fs.statfs requires Node.js 19.6.0+ (added in Node.js 19.6.0)
  // This project requires Node.js 20+ for Electron compatibility
  const stats = await fs.statfs(checkPath);

  // Calculate available space
  // bavail = available blocks for unprivileged users
  // bsize = block size in bytes
  const availableBytes = stats.bavail * stats.bsize;

  return availableBytes;
}

/**
 * Check disk space and return warning/critical flags
 *
 * @param targetPath - Path to check disk space for (typically log directory)
 * @returns Disk space result with warning/critical flags
 */
export async function checkDiskSpaceWarning(targetPath: string): Promise<DiskSpaceResult> {
  const availableBytes = await getAvailableDiskSpace(targetPath);
  const availableGB = availableBytes / 1024 ** 3;

  // 1GB = 1,073,741,824 bytes
  // 100MB = 104,857,600 bytes
  const warningThresholdBytes = 1 * 1024 ** 3; // 1GB
  const criticalThresholdBytes = 100 * 1024 ** 2; // 100MB

  return {
    warning: availableBytes < warningThresholdBytes,
    critical: availableBytes < criticalThresholdBytes,
    availableGB,
    availableBytes,
  };
}

/**
 * Format bytes to human-readable string
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 GB", "250 MB")
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}
