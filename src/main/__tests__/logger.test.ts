/**
 * Logger Module Tests
 *
 * Comprehensive test suite for the logger module covering:
 * - Logger initialization
 * - Runtime log level changes
 * - Configuration retrieval
 * - Structured logging format
 * - File and console transports
 */

/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import log from 'electron-log';
import { app } from 'electron';
import path from 'path';
import { initializeLogger, setLogLevel, getLogConfig, logger } from '../logger';

// Mock electron modules
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(),
  },
}));

vi.mock('electron-log', () => {
  const mockLog = {
    transports: {
      file: {
        level: 'debug',
        fileName: 'lighthouse-main.log',
        maxSize: 50 * 1024 * 1024,
        resolvePathFn: vi.fn(),
      },
      console: {
        level: 'debug',
        format: '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}',
      },
    },
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  return { default: mockLog };
});

describe('Logger Module', () => {
  const mockUserDataPath = '/mock/user/data';
  const mockLogPath = path.join(mockUserDataPath, 'logs');

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup default mock return values
    (app.getPath as any).mockReturnValue(mockUserDataPath);

    // Reset log levels to defaults
    log.transports.file.level = 'debug';
    log.transports.console.level = 'debug';

    // Clear environment variables
    delete process.env.LOG_LEVEL;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeLogger', () => {
    it('should initialize file transport with default debug level', () => {
      initializeLogger();

      expect(log.transports.file.level).toBe('debug');
      expect(log.transports.file.fileName).toBe('lighthouse-main.log');
      expect(log.transports.file.maxSize).toBe(50 * 1024 * 1024);
    });

    it('should initialize file transport with LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'error';

      initializeLogger();

      expect(log.transports.file.level).toBe('error');
    });

    it('should set correct log file path', () => {
      initializeLogger();

      expect(app.getPath).toHaveBeenCalledWith('userData');
      expect(log.transports.file.resolvePathFn).toBeDefined();
    });

    it('should initialize console transport with default debug level', () => {
      initializeLogger();

      expect(log.transports.console.level).toBe('debug');
      expect(log.transports.console.format).toBe('[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}');
    });

    it('should initialize console transport with LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'warn';

      initializeLogger();

      expect(log.transports.console.level).toBe('warn');
    });

    it('should log initialization message with structured data', () => {
      initializeLogger();

      expect(log.info).toHaveBeenCalledWith(
        '[Logger] Initialized',
        expect.objectContaining({
          logPath: expect.stringContaining('lighthouse-main.log'),
          fileLevel: expect.any(String),
          consoleLevel: expect.any(String),
          maxSize: expect.any(Number),
        })
      );
    });

    it('should configure 50MB max file size', () => {
      initializeLogger();

      expect(log.transports.file.maxSize).toBe(50 * 1024 * 1024);
    });

    it('should use correct log file name', () => {
      initializeLogger();

      expect(log.transports.file.fileName).toBe('lighthouse-main.log');
    });
  });

  describe('setLogLevel', () => {
    beforeEach(() => {
      initializeLogger();
      vi.clearAllMocks();
    });

    it('should set log level to debug for both transports', () => {
      setLogLevel('debug');

      expect(log.transports.file.level).toBe('debug');
      expect(log.transports.console.level).toBe('debug');
    });

    it('should set log level to info for both transports', () => {
      setLogLevel('info');

      expect(log.transports.file.level).toBe('info');
      expect(log.transports.console.level).toBe('info');
    });

    it('should set log level to warn for both transports', () => {
      setLogLevel('warn');

      expect(log.transports.file.level).toBe('warn');
      expect(log.transports.console.level).toBe('warn');
    });

    it('should set log level to error for both transports', () => {
      setLogLevel('error');

      expect(log.transports.file.level).toBe('error');
      expect(log.transports.console.level).toBe('error');
    });

    it('should log level change with structured data', () => {
      setLogLevel('warn');

      expect(log.info).toHaveBeenCalledWith('[Logger] Log level changed', { level: 'warn' });
    });

    it('should apply changes immediately', () => {
      const originalLevel = log.transports.file.level;

      setLogLevel('error');

      expect(log.transports.file.level).not.toBe(originalLevel);
      expect(log.transports.file.level).toBe('error');
    });
  });

  describe('getLogConfig', () => {
    beforeEach(() => {
      initializeLogger();
    });

    it('should return current log level', () => {
      log.transports.file.level = 'info';

      const config = getLogConfig();

      expect(config.level).toBe('info');
    });

    it('should return correct file path', () => {
      const config = getLogConfig();

      expect(config.filePath).toBe(path.join(mockLogPath, 'lighthouse-main.log'));
      expect(config.filePath).toContain('logs');
      expect(config.filePath).toContain('lighthouse-main.log');
    });

    it('should return fileSize as 0 (calculated by IPC handler)', () => {
      const config = getLogConfig();

      expect(config.fileSize).toBe(0);
    });

    it('should return correct maxSize', () => {
      const config = getLogConfig();

      expect(config.maxSize).toBe(50 * 1024 * 1024);
    });

    it('should construct filePath using app.getPath', () => {
      getLogConfig();

      expect(app.getPath).toHaveBeenCalledWith('userData');
    });

    it('should return consistent config across multiple calls', () => {
      const config1 = getLogConfig();
      const config2 = getLogConfig();

      expect(config1).toEqual(config2);
    });

    it('should reflect runtime level changes', () => {
      setLogLevel('error');

      const config = getLogConfig();

      expect(config.level).toBe('error');
    });
  });

  describe('Structured Logging Format', () => {
    beforeEach(() => {
      initializeLogger();
      vi.clearAllMocks();
    });

    it('should support structured logging with logger.debug', () => {
      logger.debug('[Test] Debug message', { key: 'value', count: 42 });

      expect(log.debug).toHaveBeenCalledWith('[Test] Debug message', { key: 'value', count: 42 });
    });

    it('should support structured logging with logger.info', () => {
      logger.info('[Test] Info message', { status: 'success' });

      expect(log.info).toHaveBeenCalledWith('[Test] Info message', { status: 'success' });
    });

    it('should support structured logging with logger.warn', () => {
      logger.warn('[Test] Warning message', { code: 'WARN001' });

      expect(log.warn).toHaveBeenCalledWith('[Test] Warning message', { code: 'WARN001' });
    });

    it('should support structured logging with logger.error', () => {
      const error = new Error('Test error');
      logger.error('[Test] Error message', { error: error.message, stack: error.stack });

      expect(log.error).toHaveBeenCalledWith('[Test] Error message', {
        error: error.message,
        stack: error.stack,
      });
    });

    it('should handle complex nested objects in structured logs', () => {
      const complexData = {
        level1: {
          level2: {
            level3: 'deep value',
          },
          array: [1, 2, 3],
        },
        timestamp: Date.now(),
      };

      logger.info('[Test] Complex data', complexData);

      expect(log.info).toHaveBeenCalledWith('[Test] Complex data', complexData);
    });

    it('should handle undefined/null values in structured logs', () => {
      logger.info('[Test] Null values', { defined: 'value', undefined: undefined, null: null });

      expect(log.info).toHaveBeenCalledWith('[Test] Null values', {
        defined: 'value',
        undefined: undefined,
        null: null,
      });
    });

    it('should format log messages with context prefix', () => {
      logger.debug('[ServiceName] Operation completed', { duration: 123 });

      expect(log.debug).toHaveBeenCalledWith('[ServiceName] Operation completed', {
        duration: 123,
      });
    });
  });

  describe('Logger Export', () => {
    it('should export logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger).toBe(log);
    });

    it('should expose debug method', () => {
      expect(logger.debug).toBeDefined();
      expect(typeof logger.debug).toBe('function');
    });

    it('should expose info method', () => {
      expect(logger.info).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    it('should expose warn method', () => {
      expect(logger.warn).toBeDefined();
      expect(typeof logger.warn).toBe('function');
    });

    it('should expose error method', () => {
      expect(logger.error).toBeDefined();
      expect(typeof logger.error).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full initialization workflow', () => {
      // Initialize
      initializeLogger();
      expect(log.transports.file.level).toBe('debug');

      // Change level
      setLogLevel('warn');
      expect(log.transports.file.level).toBe('warn');

      // Get config
      const config = getLogConfig();
      expect(config.level).toBe('warn');

      // Log message
      logger.warn('[Test] Integration test', { test: true });
      expect(log.warn).toHaveBeenCalled();
    });

    it('should handle multiple level changes', () => {
      initializeLogger();

      setLogLevel('debug');
      expect(getLogConfig().level).toBe('debug');

      setLogLevel('info');
      expect(getLogConfig().level).toBe('info');

      setLogLevel('error');
      expect(getLogConfig().level).toBe('error');

      setLogLevel('warn');
      expect(getLogConfig().level).toBe('warn');
    });

    it('should maintain configuration consistency', () => {
      initializeLogger();
      setLogLevel('info');

      const config1 = getLogConfig();
      const config2 = getLogConfig();

      expect(config1).toEqual(config2);
      expect(config1.level).toBe('info');
      expect(config2.level).toBe('info');
    });
  });

  describe('Environment Variable Handling', () => {
    it('should respect LOG_LEVEL=debug', () => {
      process.env.LOG_LEVEL = 'debug';

      initializeLogger();

      expect(log.transports.file.level).toBe('debug');
      expect(log.transports.console.level).toBe('debug');
    });

    it('should respect LOG_LEVEL=info', () => {
      process.env.LOG_LEVEL = 'info';

      initializeLogger();

      expect(log.transports.file.level).toBe('info');
      expect(log.transports.console.level).toBe('info');
    });

    it('should respect LOG_LEVEL=warn', () => {
      process.env.LOG_LEVEL = 'warn';

      initializeLogger();

      expect(log.transports.file.level).toBe('warn');
      expect(log.transports.console.level).toBe('warn');
    });

    it('should respect LOG_LEVEL=error', () => {
      process.env.LOG_LEVEL = 'error';

      initializeLogger();

      expect(log.transports.file.level).toBe('error');
      expect(log.transports.console.level).toBe('error');
    });

    it('should default to debug when LOG_LEVEL is not set', () => {
      delete process.env.LOG_LEVEL;

      initializeLogger();

      expect(log.transports.file.level).toBe('debug');
      expect(log.transports.console.level).toBe('debug');
    });
  });

  describe('File Path Resolution', () => {
    it('should resolve log path using userData directory', () => {
      const customPath = '/custom/user/data';
      (app.getPath as any).mockReturnValue(customPath);

      const config = getLogConfig();

      expect(config.filePath).toBe(path.join(customPath, 'logs', 'lighthouse-main.log'));
    });

    it('should use logs subdirectory', () => {
      const config = getLogConfig();

      expect(config.filePath).toContain('logs');
      expect(config.filePath).toContain(path.sep + 'logs' + path.sep);
    });

    it('should include correct filename', () => {
      const config = getLogConfig();

      expect(config.filePath).toContain('lighthouse-main.log');
      expect(path.basename(config.filePath)).toBe('lighthouse-main.log');
    });
  });
});
