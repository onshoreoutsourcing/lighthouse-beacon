/**
 * RetryPolicy Enhanced Features Tests
 * Wave 9.4.5: Advanced Error Handling - User Story 2
 *
 * Tests enhanced retry policy features:
 * - dont_retry_on_errors filtering
 * - Delay strategies (fixed, exponential, jittered)
 * - Circuit breaker pattern integration
 */

/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetryPolicy } from '../RetryPolicy';
import { CircuitBreaker, CircuitState } from '../CircuitBreaker';

describe('RetryPolicy - Enhanced Features', () => {
  beforeEach(() => {
    // Clear circuit breaker state before each test
    CircuitBreaker.getInstance().clearAll();
    vi.clearAllMocks();
  });

  describe('dont_retry_on_errors', () => {
    it('should not retry errors matching dont_retry_on pattern', async () => {
      const policy = new RetryPolicy({
        max_attempts: 5,
        dont_retry_on_errors: ['ValidationError', 'InvalidInput'],
      });

      let attempts = 0;
      const fn = async () => {
        attempts++;
        throw new Error('ValidationError: Invalid data');
      };

      const result = await policy.executeWithRetry(fn);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1); // Should not retry
      expect(attempts).toBe(1);
    });

    it('should take precedence over retry_on_errors', async () => {
      const policy = new RetryPolicy({
        max_attempts: 5,
        retry_on_errors: ['Error'], // Would normally retry all errors
        dont_retry_on_errors: ['ValidationError'], // But exclude validation errors
      });

      let attempts = 0;
      const fn = async () => {
        attempts++;
        throw new Error('ValidationError: Bad input');
      };

      const result = await policy.executeWithRetry(fn);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1); // Should not retry despite retry_on match
    });

    it('should retry errors not matching dont_retry_on', async () => {
      const policy = new RetryPolicy({
        max_attempts: 3,
        initial_delay_ms: 1,
        dont_retry_on_errors: ['ValidationError'],
      });

      let attempts = 0;
      const fn = async () => {
        attempts++;
        throw new Error('NetworkError: Connection timeout');
      };

      const result = await policy.executeWithRetry(fn);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3); // Should retry all attempts
    });

    it('should handle multiple dont_retry_on patterns', async () => {
      const policy = new RetryPolicy({
        max_attempts: 5,
        dont_retry_on_errors: ['ValidationError', 'AuthenticationError', 'PermissionDenied'],
      });

      const testCases = [
        'ValidationError: Invalid input',
        'AuthenticationError: Invalid token',
        'PermissionDenied: Access forbidden',
      ];

      for (const errorMsg of testCases) {
        let attempts = 0;
        const fn = async () => {
          attempts++;
          throw new Error(errorMsg);
        };

        const result = await policy.executeWithRetry(fn);

        expect(result.success).toBe(false);
        expect(result.attempts).toBe(1);
        expect(attempts).toBe(1);
      }
    });
  });

  describe('Delay Strategies', () => {
    describe('Fixed Delay', () => {
      it('should use fixed delay between retries', async () => {
        const policy = new RetryPolicy({
          max_attempts: 4,
          initial_delay_ms: 100,
          delay_strategy: 'fixed',
        });

        // Test delay calculation
        expect(policy.getDelayMs(1)).toBe(100);
        expect(policy.getDelayMs(2)).toBe(100);
        expect(policy.getDelayMs(3)).toBe(100);
        expect(policy.getDelayMs(4)).toBe(100);
      });

      it('should execute with fixed delays', async () => {
        const policy = new RetryPolicy({
          max_attempts: 3,
          initial_delay_ms: 10,
          delay_strategy: 'fixed',
        });

        const startTime = Date.now();
        let attempts = 0;

        const fn = async () => {
          attempts++;
          throw new Error('Test error');
        };

        const result = await policy.executeWithRetry(fn);

        const totalTime = Date.now() - startTime;

        expect(result.success).toBe(false);
        expect(result.attempts).toBe(3);
        // Total delay: 10ms (after attempt 1) + 10ms (after attempt 2) = ~20ms
        expect(totalTime).toBeGreaterThanOrEqual(18);
      });
    });

    describe('Exponential Delay', () => {
      it('should use exponential backoff (default)', async () => {
        const policy = new RetryPolicy({
          max_attempts: 4,
          initial_delay_ms: 100,
          backoff_multiplier: 2,
          delay_strategy: 'exponential',
        });

        expect(policy.getDelayMs(1)).toBe(100); // 100 * 2^0
        expect(policy.getDelayMs(2)).toBe(200); // 100 * 2^1
        expect(policy.getDelayMs(3)).toBe(400); // 100 * 2^2
        expect(policy.getDelayMs(4)).toBe(800); // 100 * 2^3
      });

      it('should cap exponential delay at max_delay_ms', async () => {
        const policy = new RetryPolicy({
          max_attempts: 10,
          initial_delay_ms: 100,
          backoff_multiplier: 2,
          max_delay_ms: 500,
          delay_strategy: 'exponential',
        });

        expect(policy.getDelayMs(1)).toBe(100);
        expect(policy.getDelayMs(2)).toBe(200);
        expect(policy.getDelayMs(3)).toBe(400);
        expect(policy.getDelayMs(4)).toBe(500); // Capped
        expect(policy.getDelayMs(5)).toBe(500); // Capped
      });
    });

    describe('Jittered Delay', () => {
      it('should add randomness to exponential delay', async () => {
        const policy = new RetryPolicy({
          max_attempts: 4,
          initial_delay_ms: 1000,
          backoff_multiplier: 2,
          delay_strategy: 'jittered',
        });

        // Jitter adds ±20% randomness
        // For attempt 1: base=1000, jitter range=[800, 1200]
        const delay1 = policy.getDelayMs(1);
        expect(delay1).toBeGreaterThanOrEqual(800);
        expect(delay1).toBeLessThanOrEqual(1200);

        // For attempt 2: base=2000, jitter range=[1600, 2400]
        const delay2 = policy.getDelayMs(2);
        expect(delay2).toBeGreaterThanOrEqual(1600);
        expect(delay2).toBeLessThanOrEqual(2400);
      });

      it('should produce different delays on multiple calls', async () => {
        const policy = new RetryPolicy({
          max_attempts: 3,
          initial_delay_ms: 1000,
          delay_strategy: 'jittered',
        });

        const delays = new Set();
        for (let i = 0; i < 10; i++) {
          delays.add(policy.getDelayMs(1));
        }

        // Should have some variation (not all identical)
        expect(delays.size).toBeGreaterThan(1);
      });
    });
  });

  describe('Circuit Breaker Integration', () => {
    it('should execute normally when circuit breaker disabled', async () => {
      const policy = new RetryPolicy({
        max_attempts: 3,
        initial_delay_ms: 1,
        circuit_breaker: {
          enabled: false,
        },
      });

      let attempts = 0;
      const fn = async () => {
        attempts++;
        if (attempts < 2) throw new Error('Fail');
        return 'success';
      };

      const result = await policy.executeWithRetry(fn);

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(result.attempts).toBe(2);
    });

    it('should open circuit after consecutive failures', async () => {
      const policy = new RetryPolicy({
        max_attempts: 1, // No retries
        circuit_breaker: {
          enabled: true,
          failure_threshold: 3,
          cooldown_ms: 1000,
        },
      });

      const resourceId = 'test-resource-1';

      // Trigger 3 consecutive failures
      for (let i = 0; i < 3; i++) {
        const result = await policy.executeWithRetry(
          async () => {
            throw new Error(`Failure ${i + 1}`);
          },
          undefined,
          resourceId
        );
        expect(result.success).toBe(false);
      }

      // Circuit should now be OPEN
      const breaker = CircuitBreaker.getInstance();
      const state = breaker.getState(resourceId, policy.getConfig().circuit_breaker);
      expect(state).toBe(CircuitState.OPEN);

      // Next attempt should be rejected immediately
      const result = await policy.executeWithRetry(
        async () => 'should not execute',
        undefined,
        resourceId
      );

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(0); // No attempts made (circuit open)
      expect(result.error?.message).toContain('Circuit breaker is OPEN');
    });

    it('should transition to HALF_OPEN after cooldown', async () => {
      const policy = new RetryPolicy({
        max_attempts: 1,
        circuit_breaker: {
          enabled: true,
          failure_threshold: 2,
          cooldown_ms: 50, // Short cooldown for testing
        },
      });

      const resourceId = 'test-resource-2';

      // Trigger failures to open circuit
      for (let i = 0; i < 2; i++) {
        await policy.executeWithRetry(
          async () => {
            throw new Error('Fail');
          },
          undefined,
          resourceId
        );
      }

      const breaker = CircuitBreaker.getInstance();

      // Circuit should be OPEN
      expect(breaker.getState(resourceId, policy.getConfig().circuit_breaker)).toBe(
        CircuitState.OPEN
      );

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Circuit should transition to HALF_OPEN
      expect(breaker.getState(resourceId, policy.getConfig().circuit_breaker)).toBe(
        CircuitState.HALF_OPEN
      );
    });

    it('should close circuit on successful HALF_OPEN test', async () => {
      const policy = new RetryPolicy({
        max_attempts: 1,
        circuit_breaker: {
          enabled: true,
          failure_threshold: 2,
          cooldown_ms: 50,
        },
      });

      const resourceId = 'test-resource-3';

      // Open circuit
      for (let i = 0; i < 2; i++) {
        await policy.executeWithRetry(
          async () => {
            throw new Error('Fail');
          },
          undefined,
          resourceId
        );
      }

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Successful request should close circuit
      const result = await policy.executeWithRetry(async () => 'success', undefined, resourceId);

      expect(result.success).toBe(true);

      const breaker = CircuitBreaker.getInstance();
      expect(breaker.getState(resourceId, policy.getConfig().circuit_breaker)).toBe(
        CircuitState.CLOSED
      );
    });

    it('should reopen circuit on failed HALF_OPEN test', async () => {
      const policy = new RetryPolicy({
        max_attempts: 1,
        circuit_breaker: {
          enabled: true,
          failure_threshold: 2,
          cooldown_ms: 50,
        },
      });

      const resourceId = 'test-resource-4';

      // Open circuit
      for (let i = 0; i < 2; i++) {
        await policy.executeWithRetry(
          async () => {
            throw new Error('Fail');
          },
          undefined,
          resourceId
        );
      }

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Failed request should reopen circuit
      const result = await policy.executeWithRetry(
        async () => {
          throw new Error('Still failing');
        },
        undefined,
        resourceId
      );

      expect(result.success).toBe(false);

      const breaker = CircuitBreaker.getInstance();
      expect(breaker.getState(resourceId, policy.getConfig().circuit_breaker)).toBe(
        CircuitState.OPEN
      );
    });

    it('should isolate circuits by resource ID', async () => {
      const policy = new RetryPolicy({
        max_attempts: 1,
        circuit_breaker: {
          enabled: true,
          failure_threshold: 2,
        },
      });

      const resource1 = 'resource-1';
      const resource2 = 'resource-2';

      // Open circuit for resource1
      for (let i = 0; i < 2; i++) {
        await policy.executeWithRetry(
          async () => {
            throw new Error('Fail');
          },
          undefined,
          resource1
        );
      }

      const breaker = CircuitBreaker.getInstance();

      // resource1 should be OPEN
      expect(breaker.getState(resource1, policy.getConfig().circuit_breaker)).toBe(
        CircuitState.OPEN
      );

      // resource2 should still be CLOSED
      expect(breaker.getState(resource2, policy.getConfig().circuit_breaker)).toBe(
        CircuitState.CLOSED
      );

      // resource2 should still execute normally
      const result = await policy.executeWithRetry(async () => 'success', undefined, resource2);
      expect(result.success).toBe(true);
    });
  });

  describe('Combined Features', () => {
    it('should combine dont_retry_on with circuit breaker', async () => {
      const policy = new RetryPolicy({
        max_attempts: 5,
        dont_retry_on_errors: ['ValidationError'],
        circuit_breaker: {
          enabled: true,
          failure_threshold: 3,
        },
      });

      const resourceId = 'combined-test-1';

      // ValidationError should not retry or affect circuit
      const result1 = await policy.executeWithRetry(
        async () => {
          throw new Error('ValidationError: Bad input');
        },
        undefined,
        resourceId
      );

      expect(result1.success).toBe(false);
      expect(result1.attempts).toBe(1); // No retry

      // Circuit should still be CLOSED (don't_retry_on doesn't count toward circuit)
      const breaker = CircuitBreaker.getInstance();
      const stats = breaker.getStats(resourceId);
      expect(stats?.consecutiveFailures).toBe(1);
    });

    it('should combine jittered delay with retry_on filter', async () => {
      const policy = new RetryPolicy({
        max_attempts: 3,
        initial_delay_ms: 10,
        delay_strategy: 'jittered',
        retry_on_errors: ['NetworkError'],
      });

      let attempts = 0;
      const fn = async () => {
        attempts++;
        throw new Error('NetworkError: Timeout');
      };

      const result = await policy.executeWithRetry(fn);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3); // Should retry
      expect(attempts).toBe(3);
    });
  });
});
