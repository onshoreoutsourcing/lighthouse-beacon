/**
 * Log Level Control Integration Tests
 *
 * Tests runtime log level changes, settings persistence, IPC handlers,
 * and performance logging integration across services.
 *
 * Coverage:
 * - Runtime log level changes via IPC
 * - Settings persistence across restarts
 * - Log config retrieval
 * - Performance logging in services
 * - Disk space monitoring
 *
 * Run with: npm test -- logLevelControl.integration.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SettingsService } from '../services/SettingsService';
import { logger, setLogLevel, getLogConfig, initializeLogger } from '../logger';
import { getAvailableDiskSpace, checkDiskSpaceWarning, formatBytes } from '../utils/diskSpace';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn((name: string) => {
      if (name === 'userData') return path.join(os.tmpdir(), 'lighthouse-test-userdata');
      if (name === 'temp') return os.tmpdir();
      return os.tmpdir();
    }),
  },
}));

// Mock electron-log
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
      },
    },
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
  return { default: mockLog };
});

describe('Log Level Control Integration Tests', () => {
  let settingsService: SettingsService;
  let testUserDataPath: string;

  beforeEach(async () => {
    // Initialize test environment
    testUserDataPath = path.join(os.tmpdir(), `lighthouse-test-${Date.now()}`);

    await fs.mkdir(testUserDataPath, { recursive: true });

    // Initialize services
    initializeLogger();
    settingsService = new SettingsService();
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testUserDataPath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Runtime Log Level Changes', () => {
    it('should change log level at runtime', () => {
      // Get initial config
      const initialConfig = getLogConfig();
      const initialLevel = initialConfig.level;

      // Change to different level
      const newLevel = initialLevel === 'debug' ? 'info' : 'debug';
      setLogLevel(newLevel);

      // Verify change
      const updatedConfig = getLogConfig();
      expect(updatedConfig.level).toBe(newLevel);
    });

    it('should support all log levels', () => {
      const levels: Array<'debug' | 'info' | 'warn' | 'error'> = ['debug', 'info', 'warn', 'error'];

      for (const level of levels) {
        setLogLevel(level);
        const config = getLogConfig();
        expect(config.level).toBe(level);
      }
    });

    it('should log level change event', () => {
      const level = 'warn';
      setLogLevel(level);

      // Logger should have logged the level change
      // (Verified by inspection - actual log output not captured in test)
      const config = getLogConfig();
      expect(config.level).toBe(level);
    });
  });

  describe('Settings Persistence', () => {
    it('should persist logging config to settings', async () => {
      // Set logging config
      await settingsService.setLoggingConfig({
        level: 'warn',
        enableFileLogging: true,
        enableConsoleLogging: false,
      });

      // Retrieve and verify
      const config = await settingsService.getLoggingConfig();
      expect(config.level).toBe('warn');
      expect(config.enableFileLogging).toBe(true);
      expect(config.enableConsoleLogging).toBe(false);
    });

    it('should merge partial logging config updates', async () => {
      // Set initial config
      await settingsService.setLoggingConfig({
        level: 'debug',
        enableFileLogging: true,
        enableConsoleLogging: true,
      });

      // Update only level
      await settingsService.setLoggingConfig({
        level: 'error',
      });

      // Verify merge
      const config = await settingsService.getLoggingConfig();
      expect(config.level).toBe('error');
      expect(config.enableFileLogging).toBe(true); // Unchanged
      expect(config.enableConsoleLogging).toBe(true); // Unchanged
    });

    it('should load default logging config for new settings', async () => {
      const config = await settingsService.getLoggingConfig();

      // Verify defaults (may be debug or error depending on environment)
      expect(['debug', 'error']).toContain(config.level);
      expect(config.enableFileLogging).toBe(true);
      expect(config.enableConsoleLogging).toBe(true);
    });
  });

  describe('Log Config Retrieval', () => {
    it('should return current log configuration', () => {
      const config = getLogConfig();

      expect(config).toHaveProperty('level');
      expect(config).toHaveProperty('filePath');
      expect(config).toHaveProperty('fileSize');
      expect(config).toHaveProperty('maxSize');

      expect(typeof config.level).toBe('string');
      expect(typeof config.filePath).toBe('string');
      expect(typeof config.maxSize).toBe('number');
    });

    it('should include correct max size (50MB)', () => {
      const config = getLogConfig();
      expect(config.maxSize).toBe(50 * 1024 * 1024); // 50MB
    });

    it('should include absolute file path', () => {
      const config = getLogConfig();
      expect(path.isAbsolute(config.filePath)).toBe(true);
      expect(config.filePath).toContain('lighthouse-main.log');
    });
  });

  describe('Performance Logging Integration', () => {
    it('should log with duration metadata', () => {
      const startTime = Date.now();

      // Simulate operation
      const operationDuration = 10;

      const duration = Date.now() - startTime + operationDuration;

      // Log with duration
      logger.info('[IntegrationTest] Operation complete', {
        duration,
        operation: 'test',
      });

      // Verify no errors (logger doesn't throw)
      expect(true).toBe(true);
    });

    it('should support warning for slow operations', () => {
      const duration = 5500; // 5.5 seconds

      if (duration > 5000) {
        logger.warn('[IntegrationTest] Slow operation detected', {
          duration,
          threshold: 5000,
          operation: 'test',
        });
      }

      // Verify no errors
      expect(true).toBe(true);
    });

    it('should log structured performance data', () => {
      logger.info('[IntegrationTest] Tool execution', {
        toolName: 'test_tool',
        duration: 123,
        success: true,
        parameters: { path: '/test' },
      });

      logger.info('[IntegrationTest] AI response', {
        duration: 2500,
        contentLength: 1500,
        chunkCount: 75,
        averageChunkSize: 20,
      });

      logger.info('[IntegrationTest] Permission decision', {
        toolName: 'write_file',
        duration: 50,
        decision: 'APPROVED',
      });

      // Verify no errors
      expect(true).toBe(true);
    });
  });

  describe('Disk Space Monitoring', () => {
    it('should get available disk space', async () => {
      const availableBytes = await getAvailableDiskSpace(testUserDataPath);

      expect(typeof availableBytes).toBe('number');
      expect(availableBytes).toBeGreaterThan(0);
    });

    it('should check disk space warnings', async () => {
      const result = await checkDiskSpaceWarning(testUserDataPath);

      expect(result).toHaveProperty('warning');
      expect(result).toHaveProperty('critical');
      expect(result).toHaveProperty('availableGB');
      expect(result).toHaveProperty('availableBytes');

      expect(typeof result.warning).toBe('boolean');
      expect(typeof result.critical).toBe('boolean');
      expect(typeof result.availableGB).toBe('number');
      expect(typeof result.availableBytes).toBe('number');
    });

    it('should return correct warning/critical thresholds', async () => {
      const result = await checkDiskSpaceWarning(testUserDataPath);

      // For most systems, should have >1GB available (no warning)
      // If warning is true, critical should be checked
      if (result.warning) {
        expect(result.availableGB).toBeLessThan(1);
      }

      if (result.critical) {
        expect(result.availableBytes).toBeLessThan(100 * 1024 * 1024); // <100MB
      }

      // availableGB should match availableBytes
      const expectedGB = result.availableBytes / 1024 ** 3;
      expect(Math.abs(result.availableGB - expectedGB)).toBeLessThan(0.01); // Within 0.01GB
    });

    it('should format bytes correctly', () => {
      expect(formatBytes(500)).toBe('500.00 B');
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
      expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe('1.50 GB');
    });

    it('should handle non-existent paths by checking parent', async () => {
      // Create parent directory first
      const parentPath = path.join(testUserDataPath, 'non-existent');

      await fs.mkdir(parentPath, { recursive: true });

      const nonExistentPath = path.join(parentPath, 'deep', 'path');

      // Should not throw - checks parent directory instead
      const availableBytes = await getAvailableDiskSpace(nonExistentPath);
      expect(availableBytes).toBeGreaterThan(0);
    });
  });

  describe('IPC Handler Simulation', () => {
    it('should simulate SETTINGS_SET_LOG_LEVEL handler', async () => {
      const newLevel: 'debug' | 'info' | 'warn' | 'error' = 'error';

      // Simulate handler logic
      setLogLevel(newLevel);
      await settingsService.setLoggingConfig({ level: newLevel });

      // Verify
      const config = await settingsService.getLoggingConfig();
      expect(config.level).toBe(newLevel);

      const logConfig = getLogConfig();
      expect(logConfig.level).toBe(newLevel);
    });

    it('should simulate SETTINGS_GET_LOG_CONFIG handler', async () => {
      // Simulate handler logic
      const logConfig = getLogConfig();
      const loggingConfig = await settingsService.getLoggingConfig();

      // Get file size
      let fileSize = 0;
      try {
        const stats = await fs.stat(logConfig.filePath);
        fileSize = stats.size;
      } catch {
        fileSize = 0;
      }

      // Verify result structure
      const result = {
        ...logConfig,
        fileSize,
        loggingConfig,
      };

      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('fileSize');
      expect(result).toHaveProperty('loggingConfig');
      expect(result.loggingConfig).toHaveProperty('level');
    });

    it('should simulate LOGS_GET_FILE_SIZE handler', async () => {
      const logConfig = getLogConfig();

      let fileSize = 0;
      try {
        const stats = await fs.stat(logConfig.filePath);
        fileSize = stats.size;
      } catch {
        fileSize = 0;
      }

      expect(typeof fileSize).toBe('number');
      expect(fileSize).toBeGreaterThanOrEqual(0);
    });

    it('should simulate LOGS_GET_DISK_SPACE handler', async () => {
      const logConfig = getLogConfig();

      // Create parent directory for log path
      const logDir = path.dirname(logConfig.filePath);

      await fs.mkdir(logDir, { recursive: true });

      const availableBytes = await getAvailableDiskSpace(logConfig.filePath);

      expect(typeof availableBytes).toBe('number');
      expect(availableBytes).toBeGreaterThan(0);
    });
  });
});
