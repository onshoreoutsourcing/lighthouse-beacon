/**
 * FileOperationEventService
 *
 * Centralized service for emitting file operation events to the renderer process.
 * Tools use this service to notify the UI of file system changes, triggering
 * automatic refreshes in the file explorer and editor.
 *
 * Features:
 * - Event emission to all renderer windows
 * - Type-safe event payload
 * - Automatic timestamping
 * - Non-blocking operation (fire-and-forget)
 *
 * Architecture (Feature 3.4 - Wave 3.4.1):
 * - Tools call emitFileOperation() after successful operations
 * - Events broadcast via IPC to renderer
 * - FileExplorerStore and EditorStore listen and update UI
 *
 * Usage:
 * const eventService = FileOperationEventService.getInstance();
 * eventService.emitFileOperation({
 *   operation: 'write',
 *   paths: ['src/app.ts'],
 *   success: true,
 *   timestamp: Date.now(),
 * });
 */

import { BrowserWindow } from 'electron';
import type { FileOperationEvent } from '@shared/types';
import { FILE_OPERATION_CHANNELS } from '@shared/types';
import { logger } from '../logger';

export class FileOperationEventService {
  private static instance: FileOperationEventService | null = null;

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): FileOperationEventService {
    if (!FileOperationEventService.instance) {
      FileOperationEventService.instance = new FileOperationEventService();
    }
    return FileOperationEventService.instance;
  }

  /**
   * Reset singleton (primarily for testing)
   */
  static resetInstance(): void {
    FileOperationEventService.instance = null;
  }

  /**
   * Emit a file operation event to all renderer windows
   *
   * @param event - File operation event data
   */
  emitFileOperation(event: FileOperationEvent): void {
    try {
      // Get all windows and emit event to each
      const windows = BrowserWindow.getAllWindows();

      if (windows.length === 0) {
        // No windows open, skip emission (normal during shutdown)
        return;
      }

      // Broadcast to all windows
      for (const window of windows) {
        if (!window.isDestroyed() && window.webContents) {
          window.webContents.send(FILE_OPERATION_CHANNELS.FILE_OPERATION_EVENT, event);
        }
      }

      // Debug logging
      logger.debug('[FileOperationEventService] Event emitted', {
        operation: event.operation,
        pathCount: event.paths.length,
        windowCount: windows.length,
      });
    } catch (error) {
      // Non-blocking: Log error but don't fail the operation
      logger.error('[FileOperationEventService] Failed to emit event', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Helper to create event payload with automatic timestamping
   *
   * @param operation - Operation type
   * @param paths - Affected paths
   * @param success - Operation success
   * @param error - Optional error message
   * @param metadata - Optional metadata
   * @returns Complete FileOperationEvent
   */
  createEvent(
    operation: FileOperationEvent['operation'],
    paths: string[],
    success: boolean,
    error?: string,
    metadata?: Record<string, unknown>
  ): FileOperationEvent {
    return {
      operation,
      paths,
      success,
      timestamp: Date.now(),
      ...(error && { error }),
      ...(metadata && { metadata }),
    };
  }
}
