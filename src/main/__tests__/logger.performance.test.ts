/**
 * Logger Performance Tests
 *
 * Verifies that logging operations have minimal performance impact (<1ms per call).
 * Tests logging overhead across different scenarios:
 * - Direct logger calls
 * - Logger calls with structured data
 * - Logger calls in hot paths (tool execution, AI operations)
 *
 * Performance Requirements:
 * - Average logging time: <1ms per call
 * - 99th percentile: <5ms per call
 * - No memory leaks over 10,000 calls
 *
 * Run with: npm test -- logger.performance.test.ts
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { logger, initializeLogger } from '../logger';
import * as path from 'node:path';
import * as os from 'node:os';
import { performance } from 'node:perf_hooks';

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

/**
 * Measure execution time of a function
 */
function measureTime(
  fn: () => void,
  iterations: number
): {
  totalMs: number;
  averageMs: number;
  minMs: number;
  maxMs: number;
  p99Ms: number;
} {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }

  // Sort for percentile calculation
  times.sort((a, b) => a - b);

  const totalMs = times.reduce((sum, t) => sum + t, 0);
  const averageMs = totalMs / iterations;
  const minMs = times[0] || 0;
  const maxMs = times[times.length - 1] || 0;
  const p99Index = Math.floor(iterations * 0.99);
  const p99Ms = times[p99Index] || 0;

  return { totalMs, averageMs, minMs, maxMs, p99Ms };
}

describe('Logger Performance Tests', () => {
  beforeAll(() => {
    // Initialize logger in test mode
    initializeLogger();
  });

  it('should log simple messages with <1ms average overhead', () => {
    const iterations = 10000;

    const stats = measureTime(() => {
      logger.info('[PerformanceTest] Simple log message');
    }, iterations);

    // Performance requirement: average <1ms
    expect(stats.averageMs).toBeLessThan(1);

    // 99th percentile should be reasonable (allow some outliers)
    expect(stats.p99Ms).toBeLessThan(5);
  });

  it('should log structured data with <1ms average overhead', () => {
    const iterations = 10000;

    const stats = measureTime(() => {
      logger.info('[PerformanceTest] Structured log', {
        toolName: 'test_tool',
        duration: 123,
        parameters: { path: '/test/path.txt' },
        timestamp: Date.now(),
      });
    }, iterations);

    // Performance requirement: average <1ms
    expect(stats.averageMs).toBeLessThan(1);

    // 99th percentile should be reasonable
    expect(stats.p99Ms).toBeLessThan(5);
  });

  it('should handle mixed log levels efficiently', () => {
    const iterations = 10000;

    const stats = measureTime(() => {
      const rand = Math.random();
      if (rand < 0.1) {
        logger.error('[PerformanceTest] Error message', { error: 'test error' });
      } else if (rand < 0.3) {
        logger.warn('[PerformanceTest] Warning message', { warning: 'test warning' });
      } else if (rand < 0.6) {
        logger.info('[PerformanceTest] Info message', { info: 'test info' });
      } else {
        logger.debug('[PerformanceTest] Debug message', { debug: 'test debug' });
      }
    }, iterations);

    // Performance requirement: average <1ms
    expect(stats.averageMs).toBeLessThan(1);
  });

  it('should simulate tool execution logging overhead', () => {
    const iterations = 1000;

    const stats = measureTime(() => {
      // Simulate tool execution with logging
      const toolName = 'test_tool';
      const startTime = Date.now();

      // Start log
      logger.info('[ToolExecutionService] Executing tool', {
        toolName,
        parameters: { path: '/test/path.txt' },
      });

      // Simulate work (0ms - just measuring logging overhead)

      // End log
      const duration = Date.now() - startTime;
      if (duration > 1000) {
        logger.warn('[ToolExecutionService] Slow tool execution', {
          toolName,
          duration,
          threshold: 1000,
        });
      } else {
        logger.info('[ToolExecutionService] Tool execution complete', {
          toolName,
          duration,
          success: true,
        });
      }
    }, iterations);

    // Tool execution logging involves 2 log calls
    // Should still be <2ms average (1ms per call)
    expect(stats.averageMs).toBeLessThan(2);
  });

  it('should simulate AI streaming logging overhead', () => {
    const iterations = 1000;

    const stats = measureTime(() => {
      // Simulate AI streaming with logging
      const startTime = Date.now();
      let chunkCount = 0;
      let totalChunkSize = 0;

      // Simulate receiving 50 chunks
      for (let i = 0; i < 50; i++) {
        chunkCount++;
        totalChunkSize += 20; // Simulate 20 chars per chunk
      }

      // End log
      const duration = Date.now() - startTime;
      const averageChunkSize = chunkCount > 0 ? totalChunkSize / chunkCount : 0;

      if (duration > 5000) {
        logger.warn('[AIService] Slow streaming response', {
          duration,
          threshold: 5000,
          totalLength: totalChunkSize,
          chunkCount,
          averageChunkSize,
        });
      } else {
        logger.debug('[AIService] Stream complete', {
          duration,
          totalLength: totalChunkSize,
          chunkCount,
          averageChunkSize,
        });
      }
    }, iterations);

    // Single log call at end
    expect(stats.averageMs).toBeLessThan(1);
  });

  it('should simulate permission decision logging overhead', () => {
    const iterations = 1000;

    const stats = measureTime(() => {
      // Simulate auto-approval (fastest path)
      const startTime = Date.now();
      const toolName = 'read_file';
      const duration = Date.now() - startTime;

      logger.info('[PermissionService] Auto-approved', {
        toolName,
        reason: 'ALWAYS_ALLOW permission level',
        duration,
      });
    }, iterations);

    // Single log call
    expect(stats.averageMs).toBeLessThan(1);
  });

  it('should not leak memory over 10,000 calls', () => {
    const iterations = 10000;
    const memBefore = process.memoryUsage().heapUsed;

    // Perform 10,000 log calls
    for (let i = 0; i < iterations; i++) {
      logger.info('[PerformanceTest] Memory test', {
        iteration: i,
        data: { value: 'test', count: i },
      });
    }

    // Note: Garbage collection would normally be forced here with --expose-gc flag
    // but it's not critical for this test
    // if (global.gc) global.gc();

    const memAfter = process.memoryUsage().heapUsed;
    const memDiffMB = (memAfter - memBefore) / (1024 * 1024);

    // Should not leak more than 10MB for 10,000 calls
    expect(memDiffMB).toBeLessThan(10);
  });
});
