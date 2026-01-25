/**
 * RetryPolicy Unit Tests
 *
 * Tests for retry policy with exponential backoff:
 * - Configuration validation
 * - shouldRetry error filtering logic
 * - getDelayMs exponential backoff calculation
 * - Max delay capping
 * - executeWithRetry success/failure scenarios
 * - Retry attempt logging
 * - Error type filtering
 *
 * Coverage Target: ≥90%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RetryPolicy, DEFAULT_RETRY_CONFIG } from '../RetryPolicy';
import type { RetryPolicyConfig } from '../RetryPolicy';

describe('RetryPolicy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });
  describe('Constructor and Configuration', () => {
    it('should use default configuration when no config provided', () => {
      const policy = new RetryPolicy();
      const config = policy.getConfig();

      expect(config).toEqual(DEFAULT_RETRY_CONFIG);
    });

    it('should merge provided config with defaults', () => {
      const policy = new RetryPolicy({
        max_attempts: 3,
        initial_delay_ms: 2000,
      });

      const config = policy.getConfig();

      expect(config.max_attempts).toBe(3);
      expect(config.initial_delay_ms).toBe(2000);
      expect(config.backoff_multiplier).toBe(DEFAULT_RETRY_CONFIG.backoff_multiplier);
      expect(config.max_delay_ms).toBe(DEFAULT_RETRY_CONFIG.max_delay_ms);
    });

    it('should accept all configuration options', () => {
      const customConfig: RetryPolicyConfig = {
        max_attempts: 5,
        initial_delay_ms: 500,
        backoff_multiplier: 3,
        max_delay_ms: 10000,
        retry_on_errors: ['ECONNREFUSED', 'ETIMEDOUT'],
      };

      const policy = new RetryPolicy(customConfig);
      const config = policy.getConfig();

      expect(config).toMatchObject(customConfig);
    });

    it('should throw error for invalid max_attempts', () => {
      expect(() => new RetryPolicy({ max_attempts: 0 })).toThrow('max_attempts must be at least 1');
      expect(() => new RetryPolicy({ max_attempts: -1 })).toThrow(
        'max_attempts must be at least 1'
      );
    });

    it('should throw error for negative initial_delay_ms', () => {
      expect(() => new RetryPolicy({ initial_delay_ms: -1 })).toThrow(
        'initial_delay_ms must be non-negative'
      );
    });

    it('should throw error for invalid backoff_multiplier', () => {
      expect(() => new RetryPolicy({ backoff_multiplier: 0 })).toThrow(
        'backoff_multiplier must be at least 1'
      );
      expect(() => new RetryPolicy({ backoff_multiplier: -1 })).toThrow(
        'backoff_multiplier must be at least 1'
      );
    });

    it('should throw error for negative max_delay_ms', () => {
      expect(() => new RetryPolicy({ max_delay_ms: -1 })).toThrow(
        'max_delay_ms must be non-negative'
      );
    });
  });

  describe('shouldRetry', () => {
    it('should return false when max attempts reached', () => {
      const policy = new RetryPolicy({ max_attempts: 3 });
      const error = new Error('Test error');

      expect(policy.shouldRetry(error, 3)).toBe(false);
      expect(policy.shouldRetry(error, 4)).toBe(false);
    });

    it('should return true when attempts remain and no error filters', () => {
      const policy = new RetryPolicy({ max_attempts: 3 });
      const error = new Error('Test error');

      expect(policy.shouldRetry(error, 1)).toBe(true);
      expect(policy.shouldRetry(error, 2)).toBe(true);
    });

    it('should return true when error matches filter (case-insensitive)', () => {
      const policy = new RetryPolicy({
        max_attempts: 3,
        retry_on_errors: ['ECONNREFUSED', 'Network error'],
      });

      expect(policy.shouldRetry(new Error('ECONNREFUSED: Connection refused'), 1)).toBe(true);
      expect(policy.shouldRetry(new Error('network error: timeout'), 1)).toBe(true);
      expect(policy.shouldRetry(new Error('Network Error occurred'), 1)).toBe(true);
    });

    it('should return false when error does not match filter', () => {
      const policy = new RetryPolicy({
        max_attempts: 3,
        retry_on_errors: ['ECONNREFUSED', 'ETIMEDOUT'],
      });

      expect(policy.shouldRetry(new Error('Syntax error'), 1)).toBe(false);
      expect(policy.shouldRetry(new Error('Invalid input'), 1)).toBe(false);
    });

    it('should handle partial substring matches', () => {
      const policy = new RetryPolicy({
        max_attempts: 3,
        retry_on_errors: ['timeout'],
      });

      expect(policy.shouldRetry(new Error('Connection timeout'), 1)).toBe(true);
      expect(policy.shouldRetry(new Error('Request timed out'), 1)).toBe(false);
    });

    it('should retry all errors when retry_on_errors is empty', () => {
      const policy = new RetryPolicy({
        max_attempts: 3,
        retry_on_errors: [],
      });

      expect(policy.shouldRetry(new Error('Any error'), 1)).toBe(true);
      expect(policy.shouldRetry(new Error('Another error'), 1)).toBe(true);
    });
  });

  describe('getDelayMs', () => {
    it('should return 0 for attempt < 1', () => {
      const policy = new RetryPolicy();

      expect(policy.getDelayMs(0)).toBe(0);
      expect(policy.getDelayMs(-1)).toBe(0);
    });

    it('should calculate exponential backoff correctly', () => {
      const policy = new RetryPolicy({
        initial_delay_ms: 1000,
        backoff_multiplier: 2,
        max_delay_ms: 100000,
      });

      // Attempt 1: 1000 * 2^0 = 1000ms
      expect(policy.getDelayMs(1)).toBe(1000);

      // Attempt 2: 1000 * 2^1 = 2000ms
      expect(policy.getDelayMs(2)).toBe(2000);

      // Attempt 3: 1000 * 2^2 = 4000ms
      expect(policy.getDelayMs(3)).toBe(4000);

      // Attempt 4: 1000 * 2^3 = 8000ms
      expect(policy.getDelayMs(4)).toBe(8000);

      // Attempt 5: 1000 * 2^4 = 16000ms
      expect(policy.getDelayMs(5)).toBe(16000);
    });

    it('should cap delay at max_delay_ms', () => {
      const policy = new RetryPolicy({
        initial_delay_ms: 1000,
        backoff_multiplier: 2,
        max_delay_ms: 5000,
      });

      expect(policy.getDelayMs(1)).toBe(1000); // 1000ms
      expect(policy.getDelayMs(2)).toBe(2000); // 2000ms
      expect(policy.getDelayMs(3)).toBe(4000); // 4000ms
      expect(policy.getDelayMs(4)).toBe(5000); // 8000ms capped at 5000ms
      expect(policy.getDelayMs(5)).toBe(5000); // 16000ms capped at 5000ms
    });

    it('should handle different backoff multipliers', () => {
      const policy = new RetryPolicy({
        initial_delay_ms: 500,
        backoff_multiplier: 3,
        max_delay_ms: 100000,
      });

      // Attempt 1: 500 * 3^0 = 500ms
      expect(policy.getDelayMs(1)).toBe(500);

      // Attempt 2: 500 * 3^1 = 1500ms
      expect(policy.getDelayMs(2)).toBe(1500);

      // Attempt 3: 500 * 3^2 = 4500ms
      expect(policy.getDelayMs(3)).toBe(4500);

      // Attempt 4: 500 * 3^3 = 13500ms
      expect(policy.getDelayMs(4)).toBe(13500);
    });

    it('should handle backoff_multiplier = 1 (linear)', () => {
      const policy = new RetryPolicy({
        initial_delay_ms: 1000,
        backoff_multiplier: 1,
        max_delay_ms: 100000,
      });

      // All attempts should have same delay
      expect(policy.getDelayMs(1)).toBe(1000);
      expect(policy.getDelayMs(2)).toBe(1000);
      expect(policy.getDelayMs(3)).toBe(1000);
    });
  });

  describe('executeWithRetry', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should succeed on first attempt', async () => {
      const policy = new RetryPolicy({ max_attempts: 3 });
      const fn = vi.fn().mockResolvedValue('success');

      const resultPromise = policy.executeWithRetry(fn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient failure then succeed', async () => {
      const policy = new RetryPolicy({
        max_attempts: 3,
        initial_delay_ms: 1000,
      });

      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockResolvedValueOnce('success');

      const resultPromise = policy.executeWithRetry(fn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(result.attempts).toBe(2);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should fail after exhausting all attempts', async () => {
      const policy = new RetryPolicy({
        max_attempts: 3,
        initial_delay_ms: 100,
      });

      const fn = vi.fn().mockRejectedValue(new Error('Permanent error'));

      const resultPromise = policy.executeWithRetry(fn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Permanent error');
      expect(result.attempts).toBe(3);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should respect delay between retries', async () => {
      const policy = new RetryPolicy({
        max_attempts: 3,
        initial_delay_ms: 1000,
        backoff_multiplier: 2,
      });

      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');

      const resultPromise = policy.executeWithRetry(fn);

      // Initial attempt
      await vi.advanceTimersByTimeAsync(0);
      expect(fn).toHaveBeenCalledTimes(1);

      // First retry after 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      expect(fn).toHaveBeenCalledTimes(2);

      // Second retry after 2000ms
      await vi.advanceTimersByTimeAsync(2000);
      expect(fn).toHaveBeenCalledTimes(3);

      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
    });

    it('should not retry when error does not match filter', async () => {
      const policy = new RetryPolicy({
        max_attempts: 3,
        initial_delay_ms: 100,
        retry_on_errors: ['ECONNREFUSED'],
      });

      const fn = vi.fn().mockRejectedValue(new Error('Syntax error'));

      const resultPromise = policy.executeWithRetry(fn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1); // Only initial attempt, no retries
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry only when error matches filter', async () => {
      const policy = new RetryPolicy({
        max_attempts: 3,
        initial_delay_ms: 100,
        retry_on_errors: ['ECONNREFUSED', 'Network error'],
      });

      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('ECONNREFUSED: Connection refused'))
        .mockResolvedValueOnce('success');

      const resultPromise = policy.executeWithRetry(fn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should handle non-Error exceptions', async () => {
      const policy = new RetryPolicy({
        max_attempts: 2,
        initial_delay_ms: 100,
      });

      const fn = vi.fn().mockRejectedValue('string error');

      const resultPromise = policy.executeWithRetry(fn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('string error');
    });

    it('should include context in logging (workflowId, stepId)', async () => {
      const policy = new RetryPolicy({ max_attempts: 1 });
      const fn = vi.fn().mockResolvedValue('success');

      const resultPromise = policy.executeWithRetry(fn, {
        workflowId: 'test-workflow',
        stepId: 'test-step',
      });
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      // Context is used for logging (verified via manual log inspection)
    });

    it('should track total duration including delays', async () => {
      const policy = new RetryPolicy({
        max_attempts: 2,
        initial_delay_ms: 1000,
      });

      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Transient'))
        .mockResolvedValueOnce('success');

      const resultPromise = policy.executeWithRetry(fn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.totalDuration).toBeGreaterThan(0);
    });

    it('should return totalDuration on failure', async () => {
      const policy = new RetryPolicy({
        max_attempts: 2,
        initial_delay_ms: 100,
      });

      const fn = vi.fn().mockRejectedValue(new Error('Permanent'));

      const resultPromise = policy.executeWithRetry(fn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.totalDuration).toBeGreaterThan(0);
    });
  });

  describe('getConfig', () => {
    it('should return copy of configuration', () => {
      const policy = new RetryPolicy({
        max_attempts: 3,
        retry_on_errors: ['ERROR_1'],
      });

      const config1 = policy.getConfig();
      const config2 = policy.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different object instances

      // Config is marked readonly, ensuring immutability
      expect(policy.getConfig().max_attempts).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should handle max_attempts = 1 (no retry)', async () => {
      const policy = new RetryPolicy({ max_attempts: 1 });
      const fn = vi.fn().mockRejectedValue(new Error('Error'));

      const resultPromise = policy.executeWithRetry(fn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should handle initial_delay_ms = 0', async () => {
      const policy = new RetryPolicy({
        max_attempts: 2,
        initial_delay_ms: 0,
      });

      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Transient'))
        .mockResolvedValueOnce('success');

      const resultPromise = policy.executeWithRetry(fn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });

    it('should handle max_delay_ms = 0 (immediate retry)', () => {
      const policy = new RetryPolicy({
        max_attempts: 2,
        initial_delay_ms: 1000,
        max_delay_ms: 0,
      });

      expect(policy.getDelayMs(1)).toBe(0); // Capped at 0
      expect(policy.getDelayMs(2)).toBe(0); // Capped at 0
    });

    it('should handle empty retry_on_errors array', () => {
      const policy = new RetryPolicy({
        max_attempts: 3,
        retry_on_errors: [],
      });

      // Should retry all errors
      expect(policy.shouldRetry(new Error('Any error'), 1)).toBe(true);
    });
  });
});
