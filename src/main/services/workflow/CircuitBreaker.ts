/**
 * CircuitBreaker Service
 *
 * Implements circuit breaker pattern to prevent cascading failures.
 * Wave 9.4.5: Advanced Error Handling - Enhanced Retry Policies
 *
 * Circuit States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures exceeded threshold, all requests fail immediately
 * - HALF_OPEN: Testing recovery, single request allowed
 *
 * State Transitions:
 * - CLOSED → OPEN: After N consecutive failures
 * - OPEN → HALF_OPEN: After cooldown period
 * - HALF_OPEN → CLOSED: If test request succeeds
 * - HALF_OPEN → OPEN: If test request fails
 *
 * Features:
 * - Per-resource circuit breakers (keyed by resourceId)
 * - Configurable failure threshold and cooldown
 * - Thread-safe state management
 * - Automatic recovery testing
 *
 * Usage:
 * const breaker = CircuitBreaker.getInstance();
 * await breaker.execute('resource-id', async () => { ... }, config);
 */

import log from 'electron-log';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  /** Normal operation - requests pass through */
  CLOSED = 'CLOSED',
  /** Too many failures - reject all requests immediately */
  OPEN = 'OPEN',
  /** Testing recovery - allow single request to test */
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Enable circuit breaker pattern. Default: false */
  enabled?: boolean;
  /** Number of consecutive failures before opening circuit. Default: 5 */
  failure_threshold?: number;
  /** Cooldown period in milliseconds before trying HALF_OPEN. Default: 60000ms (60s) */
  cooldown_ms?: number;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_CONFIG: Required<CircuitBreakerConfig> = {
  enabled: false,
  failure_threshold: 5,
  cooldown_ms: 60000, // 60 seconds
};

/**
 * Circuit state data for a resource
 */
interface CircuitStateData {
  state: CircuitState;
  consecutiveFailures: number;
  lastFailureTime: number;
  config: Required<CircuitBreakerConfig>;
}

/**
 * Circuit breaker result
 */
export interface CircuitBreakerResult<T> {
  /** Whether execution succeeded */
  success: boolean;
  /** Result value (if successful) */
  value?: T;
  /** Error (if failed) */
  error?: Error;
  /** Whether circuit is open (request rejected before execution) */
  circuitOpen?: boolean;
  /** Current circuit state */
  state: CircuitState;
}

/**
 * Circuit breaker with per-resource state tracking
 */
export class CircuitBreaker {
  private static instance: CircuitBreaker;
  private circuits: Map<string, CircuitStateData> = new Map();

  /**
   * Get singleton instance
   */
  static getInstance(): CircuitBreaker {
    if (!CircuitBreaker.instance) {
      CircuitBreaker.instance = new CircuitBreaker();
    }
    return CircuitBreaker.instance;
  }

  /**
   * Private constructor (singleton pattern)
   */
  private constructor() {
    log.debug('[CircuitBreaker] Singleton instance created');
  }

  /**
   * Get or create circuit state for resource
   *
   * @param resourceId - Unique identifier for the resource
   * @param config - Circuit breaker configuration
   * @returns Circuit state data
   */
  private getCircuitState(resourceId: string, config: CircuitBreakerConfig): CircuitStateData {
    const mergedConfig = {
      ...DEFAULT_CIRCUIT_CONFIG,
      ...config,
    };

    if (!this.circuits.has(resourceId)) {
      this.circuits.set(resourceId, {
        state: CircuitState.CLOSED,
        consecutiveFailures: 0,
        lastFailureTime: 0,
        config: mergedConfig,
      });

      log.debug('[CircuitBreaker] Initialized circuit', {
        resourceId,
        config: mergedConfig,
      });
    }

    return this.circuits.get(resourceId)!;
  }

  /**
   * Check if enough time has passed for circuit to transition to HALF_OPEN
   *
   * @param circuit - Circuit state data
   * @returns Whether cooldown period has elapsed
   */
  private shouldAttemptReset(circuit: CircuitStateData): boolean {
    if (circuit.state !== CircuitState.OPEN) {
      return false;
    }

    const timeSinceFailure = Date.now() - circuit.lastFailureTime;
    return timeSinceFailure >= circuit.config.cooldown_ms;
  }

  /**
   * Get current circuit state (with automatic HALF_OPEN transition)
   *
   * @param resourceId - Resource identifier
   * @param config - Circuit breaker configuration
   * @returns Current circuit state
   */
  getState(resourceId: string, config: CircuitBreakerConfig = {}): CircuitState {
    if (!config.enabled) {
      return CircuitState.CLOSED;
    }

    const circuit = this.getCircuitState(resourceId, config);

    // Check if circuit should transition to HALF_OPEN
    if (this.shouldAttemptReset(circuit)) {
      log.info('[CircuitBreaker] Transitioning to HALF_OPEN (cooldown elapsed)', {
        resourceId,
        cooldown_ms: circuit.config.cooldown_ms,
      });
      circuit.state = CircuitState.HALF_OPEN;
    }

    return circuit.state;
  }

  /**
   * Execute function with circuit breaker protection
   *
   * @param resourceId - Unique identifier for the resource
   * @param fn - Async function to execute
   * @param config - Circuit breaker configuration
   * @returns Circuit breaker result
   */
  async execute<T>(
    resourceId: string,
    fn: () => Promise<T>,
    config: CircuitBreakerConfig = {}
  ): Promise<CircuitBreakerResult<T>> {
    // If circuit breaker disabled, execute directly
    if (!config.enabled) {
      try {
        const value = await fn();
        return {
          success: true,
          value,
          state: CircuitState.CLOSED,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          state: CircuitState.CLOSED,
        };
      }
    }

    const circuit = this.getCircuitState(resourceId, config);
    const currentState = this.getState(resourceId, config);

    log.debug('[CircuitBreaker] Executing with circuit breaker', {
      resourceId,
      state: currentState,
      consecutiveFailures: circuit.consecutiveFailures,
      failureThreshold: circuit.config.failure_threshold,
    });

    // OPEN: Reject immediately
    if (currentState === CircuitState.OPEN) {
      log.warn('[CircuitBreaker] Circuit OPEN - rejecting request', {
        resourceId,
        consecutiveFailures: circuit.consecutiveFailures,
      });

      return {
        success: false,
        error: new Error('Circuit breaker is OPEN - too many consecutive failures'),
        circuitOpen: true,
        state: CircuitState.OPEN,
      };
    }

    // CLOSED or HALF_OPEN: Attempt execution
    try {
      const value = await fn();

      // Success - reset failure count and close circuit
      if (currentState === CircuitState.HALF_OPEN) {
        log.info('[CircuitBreaker] HALF_OPEN test succeeded - closing circuit', {
          resourceId,
        });
      }

      circuit.state = CircuitState.CLOSED;
      circuit.consecutiveFailures = 0;

      return {
        success: true,
        value,
        state: CircuitState.CLOSED,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Failure - increment count and potentially open circuit
      circuit.consecutiveFailures++;
      circuit.lastFailureTime = Date.now();

      log.warn('[CircuitBreaker] Execution failed', {
        resourceId,
        error: err.message,
        consecutiveFailures: circuit.consecutiveFailures,
        failureThreshold: circuit.config.failure_threshold,
      });

      // Check if we should open circuit
      if (circuit.consecutiveFailures >= circuit.config.failure_threshold) {
        log.error('[CircuitBreaker] Opening circuit (failure threshold exceeded)', {
          resourceId,
          consecutiveFailures: circuit.consecutiveFailures,
          failureThreshold: circuit.config.failure_threshold,
          cooldown_ms: circuit.config.cooldown_ms,
        });

        circuit.state = CircuitState.OPEN;

        return {
          success: false,
          error: err,
          circuitOpen: true,
          state: CircuitState.OPEN,
        };
      }

      // If in HALF_OPEN and failed, go back to OPEN
      if (currentState === CircuitState.HALF_OPEN) {
        log.warn('[CircuitBreaker] HALF_OPEN test failed - reopening circuit', {
          resourceId,
        });
        circuit.state = CircuitState.OPEN;
      }

      return {
        success: false,
        error: err,
        state: circuit.state,
      };
    }
  }

  /**
   * Manually reset circuit to CLOSED state
   *
   * @param resourceId - Resource identifier
   */
  reset(resourceId: string): void {
    const circuit = this.circuits.get(resourceId);
    if (circuit) {
      log.info('[CircuitBreaker] Manually resetting circuit', { resourceId });
      circuit.state = CircuitState.CLOSED;
      circuit.consecutiveFailures = 0;
      circuit.lastFailureTime = 0;
    }
  }

  /**
   * Get circuit statistics for monitoring
   *
   * @param resourceId - Resource identifier
   * @returns Circuit statistics or null if not found
   */
  getStats(resourceId: string): {
    state: CircuitState;
    consecutiveFailures: number;
    lastFailureTime: number;
    cooldownRemaining: number;
  } | null {
    const circuit = this.circuits.get(resourceId);
    if (!circuit) {
      return null;
    }

    const cooldownRemaining =
      circuit.state === CircuitState.OPEN
        ? Math.max(0, circuit.config.cooldown_ms - (Date.now() - circuit.lastFailureTime))
        : 0;

    return {
      state: circuit.state,
      consecutiveFailures: circuit.consecutiveFailures,
      lastFailureTime: circuit.lastFailureTime,
      cooldownRemaining,
    };
  }

  /**
   * Clear all circuit states (for testing)
   */
  clearAll(): void {
    log.debug('[CircuitBreaker] Clearing all circuits');
    this.circuits.clear();
  }
}
