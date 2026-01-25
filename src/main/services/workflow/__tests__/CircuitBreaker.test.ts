/**
 * CircuitBreaker Tests
 * Wave 9.4.5: Advanced Error Handling - User Story 2
 *
 * Tests circuit breaker pattern implementation:
 * - State transitions (CLOSED → OPEN → HALF_OPEN → CLOSED)
 * - Failure threshold enforcement
 * - Cooldown period handling
 * - Per-resource isolation
 */

/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/only-throw-error */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircuitBreaker, CircuitState } from '../CircuitBreaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = CircuitBreaker.getInstance();
    breaker.clearAll();
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = CircuitBreaker.getInstance();
      const instance2 = CircuitBreaker.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Circuit States', () => {
    it('should initialize in CLOSED state', () => {
      const state = breaker.getState('resource1', { enabled: true });
      expect(state).toBe(CircuitState.CLOSED);
    });

    it('should always return CLOSED when disabled', () => {
      const config = { enabled: false, failure_threshold: 1, cooldown_ms: 1000 };

      // Even after failures
      breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      const state = breaker.getState('resource1', config);
      expect(state).toBe(CircuitState.CLOSED);
    });
  });

  describe('Execute - Success Cases', () => {
    it('should execute successfully with disabled circuit', async () => {
      const config = { enabled: false };
      const result = await breaker.execute('resource1', async () => 'success', config);

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(result.state).toBe(CircuitState.CLOSED);
    });

    it('should execute successfully with enabled circuit', async () => {
      const config = { enabled: true, failure_threshold: 5, cooldown_ms: 1000 };
      const result = await breaker.execute('resource1', async () => 'success', config);

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
      expect(result.state).toBe(CircuitState.CLOSED);
      expect(result.circuitOpen).toBeUndefined();
    });

    it('should reset failure count on success', async () => {
      const config = { enabled: true, failure_threshold: 3, cooldown_ms: 1000 };

      // Fail twice
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      // Success should reset count
      await breaker.execute('resource1', async () => 'success', config);

      // One more failure shouldn't open circuit
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      const state = breaker.getState('resource1', config);
      expect(state).toBe(CircuitState.CLOSED);
    });
  });

  describe('Execute - Failure Cases', () => {
    it('should handle single failure without opening circuit', async () => {
      const config = { enabled: true, failure_threshold: 3, cooldown_ms: 1000 };
      const result = await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('fail');
      expect(result.state).toBe(CircuitState.CLOSED);
      expect(result.circuitOpen).toBeUndefined();
    });

    it('should open circuit after threshold failures', async () => {
      const config = { enabled: true, failure_threshold: 3, cooldown_ms: 1000 };

      // Trigger 3 failures
      for (let i = 0; i < 3; i++) {
        await breaker.execute(
          'resource1',
          async () => {
            throw new Error('fail');
          },
          config
        );
      }

      const state = breaker.getState('resource1', config);
      expect(state).toBe(CircuitState.OPEN);
    });

    it('should reject requests when circuit is OPEN', async () => {
      const config = { enabled: true, failure_threshold: 2, cooldown_ms: 1000 };

      // Open circuit
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      // Next request should be rejected immediately
      const result = await breaker.execute('resource1', async () => 'success', config);

      expect(result.success).toBe(false);
      expect(result.circuitOpen).toBe(true);
      expect(result.state).toBe(CircuitState.OPEN);
      expect(result.error?.message).toContain('Circuit breaker is OPEN');
    });
  });

  describe('State Transitions', () => {
    it('should transition CLOSED → OPEN after threshold', async () => {
      const config = { enabled: true, failure_threshold: 3, cooldown_ms: 1000 };

      expect(breaker.getState('resource1', config)).toBe(CircuitState.CLOSED);

      // Trigger failures
      for (let i = 0; i < 3; i++) {
        await breaker.execute(
          'resource1',
          async () => {
            throw new Error('fail');
          },
          config
        );
      }

      expect(breaker.getState('resource1', config)).toBe(CircuitState.OPEN);
    });

    it('should transition OPEN → HALF_OPEN after cooldown', async () => {
      const config = { enabled: true, failure_threshold: 2, cooldown_ms: 50 };

      // Open circuit
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      expect(breaker.getState('resource1', config)).toBe(CircuitState.OPEN);

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(breaker.getState('resource1', config)).toBe(CircuitState.HALF_OPEN);
    });

    it('should transition HALF_OPEN → CLOSED on successful test', async () => {
      const config = { enabled: true, failure_threshold: 2, cooldown_ms: 50 };

      // Open circuit
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      // Wait for cooldown (HALF_OPEN)
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Successful test should close circuit
      const result = await breaker.execute('resource1', async () => 'success', config);

      expect(result.success).toBe(true);
      expect(breaker.getState('resource1', config)).toBe(CircuitState.CLOSED);
    });

    it('should transition HALF_OPEN → OPEN on failed test', async () => {
      const config = { enabled: true, failure_threshold: 2, cooldown_ms: 50 };

      // Open circuit
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      // Wait for cooldown (HALF_OPEN)
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Failed test should reopen circuit
      const result = await breaker.execute(
        'resource1',
        async () => {
          throw new Error('still failing');
        },
        config
      );

      expect(result.success).toBe(false);
      expect(result.state).toBe(CircuitState.OPEN);
      expect(breaker.getState('resource1', config)).toBe(CircuitState.OPEN);
    });
  });

  describe('Cooldown Period', () => {
    it('should respect cooldown period before transitioning to HALF_OPEN', async () => {
      const config = { enabled: true, failure_threshold: 2, cooldown_ms: 100 };

      // Open circuit
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      expect(breaker.getState('resource1', config)).toBe(CircuitState.OPEN);

      // Wait less than cooldown
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should still be OPEN
      expect(breaker.getState('resource1', config)).toBe(CircuitState.OPEN);

      // Wait for remaining cooldown
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should now be HALF_OPEN
      expect(breaker.getState('resource1', config)).toBe(CircuitState.HALF_OPEN);
    });

    it('should use default cooldown of 60s', async () => {
      const config = { enabled: true, failure_threshold: 2 }; // No cooldown_ms specified

      // Open circuit
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      const stats = breaker.getStats('resource1');
      expect(stats?.state).toBe(CircuitState.OPEN);

      // Check that cooldown remaining is around 60000ms
      expect(stats?.cooldownRemaining).toBeGreaterThan(59000);
      expect(stats?.cooldownRemaining).toBeLessThanOrEqual(60000);
    });
  });

  describe('Resource Isolation', () => {
    it('should maintain separate circuit states per resource', async () => {
      const config = { enabled: true, failure_threshold: 2, cooldown_ms: 1000 };

      // Open circuit for resource1
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      // resource2 should still be CLOSED
      expect(breaker.getState('resource1', config)).toBe(CircuitState.OPEN);
      expect(breaker.getState('resource2', config)).toBe(CircuitState.CLOSED);

      // resource2 should execute normally
      const result = await breaker.execute('resource2', async () => 'success', config);
      expect(result.success).toBe(true);
    });

    it('should track failure counts independently per resource', async () => {
      const config = { enabled: true, failure_threshold: 3, cooldown_ms: 1000 };

      // resource1: 2 failures
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      // resource2: 1 failure
      await breaker.execute(
        'resource2',
        async () => {
          throw new Error('fail');
        },
        config
      );

      const stats1 = breaker.getStats('resource1');
      const stats2 = breaker.getStats('resource2');

      expect(stats1?.consecutiveFailures).toBe(2);
      expect(stats2?.consecutiveFailures).toBe(1);

      expect(stats1?.state).toBe(CircuitState.CLOSED);
      expect(stats2?.state).toBe(CircuitState.CLOSED);
    });
  });

  describe('Manual Reset', () => {
    it('should manually reset circuit to CLOSED', async () => {
      const config = { enabled: true, failure_threshold: 2, cooldown_ms: 1000 };

      // Open circuit
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      expect(breaker.getState('resource1', config)).toBe(CircuitState.OPEN);

      // Manual reset
      breaker.reset('resource1');

      expect(breaker.getState('resource1', config)).toBe(CircuitState.CLOSED);

      // Failure count should be reset
      const stats = breaker.getStats('resource1');
      expect(stats?.consecutiveFailures).toBe(0);
    });

    it('should handle reset on non-existent resource gracefully', () => {
      expect(() => breaker.reset('nonexistent')).not.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should return circuit statistics', async () => {
      const config = { enabled: true, failure_threshold: 3, cooldown_ms: 1000 };

      // Trigger some failures
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      const stats = breaker.getStats('resource1');

      expect(stats).toBeDefined();
      expect(stats?.state).toBe(CircuitState.CLOSED);
      expect(stats?.consecutiveFailures).toBe(2);
      expect(stats?.lastFailureTime).toBeGreaterThan(0);
      expect(stats?.cooldownRemaining).toBe(0); // Not OPEN, so no cooldown
    });

    it('should return cooldownRemaining when circuit is OPEN', async () => {
      const config = { enabled: true, failure_threshold: 2, cooldown_ms: 5000 };

      // Open circuit
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      const stats = breaker.getStats('resource1');

      expect(stats?.state).toBe(CircuitState.OPEN);
      expect(stats?.cooldownRemaining).toBeGreaterThan(4000);
      expect(stats?.cooldownRemaining).toBeLessThanOrEqual(5000);
    });

    it('should return null for non-existent resource', () => {
      const stats = breaker.getStats('nonexistent');
      expect(stats).toBeNull();
    });
  });

  describe('Default Configuration', () => {
    it('should use default failure_threshold of 5', async () => {
      const config = { enabled: true }; // No failure_threshold specified

      // Trigger 4 failures - circuit should stay CLOSED
      for (let i = 0; i < 4; i++) {
        await breaker.execute(
          'resource1',
          async () => {
            throw new Error('fail');
          },
          config
        );
      }

      expect(breaker.getState('resource1', config)).toBe(CircuitState.CLOSED);

      // 5th failure should open circuit
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );

      expect(breaker.getState('resource1', config)).toBe(CircuitState.OPEN);
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors thrown as non-Error objects', async () => {
      const config = { enabled: true, failure_threshold: 2, cooldown_ms: 1000 };

      const result = await breaker.execute(
        'resource1',
        async () => {
          throw 'string error';
        },
        config
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('string error');
    });

    it('should handle rapid consecutive requests', async () => {
      const config = { enabled: true, failure_threshold: 3, cooldown_ms: 1000 };

      // Fire 10 requests rapidly
      const promises = Array.from({ length: 10 }, () =>
        breaker.execute(
          'resource1',
          async () => {
            throw new Error('fail');
          },
          config
        )
      );

      await Promise.all(promises);

      // Circuit should be OPEN
      expect(breaker.getState('resource1', config)).toBe(CircuitState.OPEN);
    });

    it('should clear all circuits', async () => {
      const config = { enabled: true, failure_threshold: 2, cooldown_ms: 1000 };

      // Create circuits for multiple resources
      await breaker.execute(
        'resource1',
        async () => {
          throw new Error('fail');
        },
        config
      );
      await breaker.execute(
        'resource2',
        async () => {
          throw new Error('fail');
        },
        config
      );

      expect(breaker.getStats('resource1')).toBeDefined();
      expect(breaker.getStats('resource2')).toBeDefined();

      // Clear all
      breaker.clearAll();

      expect(breaker.getStats('resource1')).toBeNull();
      expect(breaker.getStats('resource2')).toBeNull();
    });
  });
});
