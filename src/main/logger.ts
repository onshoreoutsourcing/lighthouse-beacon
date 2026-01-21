import log from 'electron-log';
import { app } from 'electron';
import path from 'path';

/**
 * Logger configuration interface
 */
export interface LogConfig {
  level: string;
  filePath: string;
  fileSize: number;
  maxSize: number;
}

/**
 * Initialize the electron-log logger with file and console transports
 *
 * Configuration:
 * - File logging: DEBUG level, 50MB rotation, 7-day retention
 * - Console logging: Enabled with colored output
 * - Log path: <userData>/logs/lighthouse-main.log
 */
export function initializeLogger(): void {
  // Configure file transport
  const logLevel = (process.env.LOG_LEVEL || 'debug') as 'debug' | 'info' | 'warn' | 'error';
  log.transports.file.level = logLevel;
  log.transports.file.fileName = 'lighthouse-main.log';
  log.transports.file.maxSize = 50 * 1024 * 1024; // 50MB

  // Set log file path
  const userDataPath = app.getPath('userData');
  const logPath = path.join(userDataPath, 'logs');
  log.transports.file.resolvePathFn = () => path.join(logPath, log.transports.file.fileName);

  // Configure console transport
  log.transports.console.level = logLevel;
  log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

  // Log initialization
  logger.info('[Logger] Initialized', {
    logPath: path.join(logPath, log.transports.file.fileName),
    fileLevel: log.transports.file.level,
    consoleLevel: log.transports.console.level,
    maxSize: log.transports.file.maxSize,
  });
}

/**
 * Set log level at runtime for both file and console transports
 *
 * @param level - Log level: 'debug' | 'info' | 'warn' | 'error'
 */
export function setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
  log.transports.file.level = level;
  log.transports.console.level = level;

  logger.info('[Logger] Log level changed', { level });
}

/**
 * Get current log configuration
 *
 * @returns LogConfig object with current settings
 */
export function getLogConfig(): LogConfig {
  const userDataPath = app.getPath('userData');
  const logPath = path.join(userDataPath, 'logs');
  const filePath = path.join(logPath, log.transports.file.fileName);

  return {
    level: log.transports.file.level as string,
    filePath,
    fileSize: 0, // Will be calculated by IPC handler when needed
    maxSize: log.transports.file.maxSize || 50 * 1024 * 1024,
  };
}

/**
 * Export the logger instance for use across the application
 */
export const logger = log;
