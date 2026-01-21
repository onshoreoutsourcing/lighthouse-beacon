import { ipcMain, dialog } from 'electron';
import type { Result, LogEntry } from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { logger, getLogConfig } from '@main/logger';
import fs from 'fs/promises';

/**
 * Log IPC Handlers
 *
 * Registers all IPC handlers for log management operations:
 * - Reading log files
 * - Exporting logs to user-selected location
 * - Clearing log files
 *
 * Security:
 * - Log file path validated against expected location
 * - Export requires user interaction (file dialog)
 * - Clear requires explicit confirmation from UI
 */

/**
 * Parse log entry from log file line
 * Expected format: [YYYY-MM-DD HH:mm:ss.SSS] [LEVEL] [Service] Message {json}
 */
function parseLogEntry(line: string): LogEntry | null {
  try {
    // Match timestamp, level, and rest of line
    const match = line.match(/^\[([\d-]+ [\d:.]+)\] \[(\w+)\] (.+)$/);
    if (!match) return null;

    const [, timestamp = '', level = 'info', rest = ''] = match;

    // Extract service name from [ServiceName] prefix
    const serviceMatch = rest.match(/^\[([^\]]+)\] (.+)$/);
    const service = serviceMatch?.[1] || 'System';
    const messageAndMeta = serviceMatch?.[2] || rest;

    // Try to extract JSON metadata from end of message
    let message = messageAndMeta;
    let metadata: Record<string, unknown> | undefined;

    const jsonMatch = messageAndMeta.match(/^(.+?) (\{.+\})$/);
    if (jsonMatch && jsonMatch[1] && jsonMatch[2]) {
      message = jsonMatch[1].trim();
      try {
        metadata = JSON.parse(jsonMatch[2]) as Record<string, unknown>;
      } catch {
        // If JSON parse fails, include it in message
        message = messageAndMeta;
      }
    }

    return {
      timestamp,
      level: level.toLowerCase() as LogEntry['level'],
      service,
      message,
      metadata,
    };
  } catch (error) {
    logger.error('[LogHandlers] Failed to parse log entry', { line, error });
    return null;
  }
}

/**
 * Register all log management IPC handlers
 * Call this function during app initialization
 */
export function registerLogHandlers(): void {
  /**
   * LOGS_READ: Read recent log entries from log file
   * Returns the most recent 100 entries by default
   */
  ipcMain.handle(IPC_CHANNELS.LOGS_READ, async (): Promise<Result<LogEntry[]>> => {
    try {
      const config = getLogConfig();
      const logFilePath = config.filePath;

      // Verify log file exists
      try {
        await fs.access(logFilePath);
      } catch {
        // Log file doesn't exist yet - return empty array
        logger.debug('[LogHandlers] Log file does not exist yet', { logFilePath });
        return { success: true, data: [] };
      }

      // Read log file
      const logContent = await fs.readFile(logFilePath, 'utf-8');

      // Split into lines and parse
      const lines = logContent.split('\n').filter((line) => line.trim());

      // Get last 100 entries
      const recentLines = lines.slice(-100);

      // Parse entries
      const entries: LogEntry[] = [];
      for (const line of recentLines) {
        const entry = parseLogEntry(line);
        if (entry) {
          entries.push(entry);
        }
      }

      logger.debug('[LogHandlers] Read log entries', {
        totalLines: lines.length,
        recentLines: recentLines.length,
        parsedEntries: entries.length,
      });

      return { success: true, data: entries };
    } catch (error) {
      logger.error('[LogHandlers] Failed to read logs', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to read logs'),
      };
    }
  });

  /**
   * LOGS_EXPORT: Export log file to user-selected location
   * Shows save dialog and copies log file to selected path with timestamped filename
   */
  ipcMain.handle(IPC_CHANNELS.LOGS_EXPORT, async (): Promise<Result<string>> => {
    try {
      const config = getLogConfig();
      const logFilePath = config.filePath;

      // Verify log file exists
      try {
        await fs.access(logFilePath);
      } catch {
        return {
          success: false,
          error: new Error('No log file exists to export'),
        };
      }

      // Generate timestamped filename
      const timestamp = new Date().toISOString().replace(/T/, '-').replace(/:/g, '').split('.')[0];
      const defaultFilename = `lighthouse-logs-${timestamp}.log`;

      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Export Logs',
        defaultPath: defaultFilename,
        filters: [
          { name: 'Log Files', extensions: ['log'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || !result.filePath) {
        return {
          success: false,
          error: new Error('Export cancelled by user'),
        };
      }

      // Copy log file to selected location
      await fs.copyFile(logFilePath, result.filePath);

      logger.info('[LogHandlers] Logs exported', {
        destination: result.filePath,
        filename: defaultFilename,
      });

      return { success: true, data: result.filePath };
    } catch (error) {
      logger.error('[LogHandlers] Failed to export logs', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to export logs'),
      };
    }
  });

  /**
   * LOGS_CLEAR: Clear log file
   * Deletes the log file (it will be recreated on next log entry)
   */
  ipcMain.handle(IPC_CHANNELS.LOGS_CLEAR, async (): Promise<Result<void>> => {
    try {
      const config = getLogConfig();
      const logFilePath = config.filePath;

      // Verify log file exists
      try {
        await fs.access(logFilePath);
      } catch {
        // Log file doesn't exist - nothing to clear
        logger.debug('[LogHandlers] No log file to clear', { logFilePath });
        return { success: true, data: undefined };
      }

      // Delete log file
      await fs.unlink(logFilePath);

      logger.info('[LogHandlers] Logs cleared', { logFilePath });

      return { success: true, data: undefined };
    } catch (error) {
      logger.error('[LogHandlers] Failed to clear logs', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to clear logs'),
      };
    }
  });

  logger.info('[LogHandlers] Log management IPC handlers registered');
}

/**
 * Unregister all log management IPC handlers
 * Call this during app cleanup
 */
export function unregisterLogHandlers(): void {
  ipcMain.removeHandler(IPC_CHANNELS.LOGS_READ);
  ipcMain.removeHandler(IPC_CHANNELS.LOGS_EXPORT);
  ipcMain.removeHandler(IPC_CHANNELS.LOGS_CLEAR);

  logger.info('[LogHandlers] Log management IPC handlers unregistered');
}
