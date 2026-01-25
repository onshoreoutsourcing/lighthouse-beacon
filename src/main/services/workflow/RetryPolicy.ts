/**
 * RetryPolicy Service
 *
 * Implements advanced retry logic with multiple delay strategies and circuit breaker protection.
 * Configurable per-step via YAML with max attempts, delay strategies,
 * error-type filtering, and circuit breaker.
 *
 * Features (Wave 9.2.3 + Wave 9.4.5):
 * - Delay strategies: fixed, exponential, jittered
 * - Maximum delay cap (30s default)
 * - Selective retry on specific error types (retry_on / dont_retry_on)
 * - Circuit breaker pattern (prevent cascading failures)
 * - Comprehensive retry attempt logging
 * - Non-blocking async execution
 *
 * Architecture:
 * - Used by WorkflowExecutor for step retry logic
 * - Integrates with CircuitBreaker for failure protection
 * - Integrates with ExecutionEvents for retry logging
 * - Supports Wave 9.2.3 + Wave 9.4.5 error handling requirements
 *
 * Usage:
 * const policy = new RetryPolicy(config);
 * const result = await policy.executeWithRetry(async () => { ... }, 'resource-id');
 */

import log from 'electron-log';
import { CircuitBreaker, CircuitState } from './CircuitBreaker';
import type { RetryDelayStrategy, CircuitBreakerConfig } from '../../../shared/types';

/**
 * Retry policy configuration (local type for compatibility)
 */
export interface RetryPolicyConfig {
  /** Maximum number of attempts (including initial attempt). Default: 1 (no retry) */
  max_attempts?: number;
  /** Initial delay in milliseconds before first retry. Default: 1000ms */
  initial_delay_ms?: number;
  /** Backoff multiplier for exponential delay. Default: 2 */
  backoff_multiplier?: number;
  /** Maximum delay cap in milliseconds. Default: 30000ms (30s) */
  max_delay_ms?: number;
  /** Error types/patterns to retry on (case-insensitive substring match). If empty, retries all errors. */
  retry_on_errors?: string[];
  /** Error types/patterns to NOT retry on (takes precedence over retry_on_errors). Wave 9.4.5 */
  dont_retry_on_errors?: string[];
  /** Delay strategy: fixed, exponential, or jittered. Default: 'exponential'. Wave 9.4.5 */
  delay_strategy?: RetryDelayStrategy;
  /** Circuit breaker configuration. Wave 9.4.5 */
  circuit_breaker?: CircuitBreakerConfig;
}

/**
 * Default retry policy configuration
 */
export const DEFAULT_RETRY_CONFIG: Required<Omit<RetryPolicyConfig, 'circuit_breaker'>> & {
  circuit_breaker: Required<CircuitBreakerConfig>;
} = {
  max_attempts: 1, // No retry by default
  initial_delay_ms: 1000, // 1 second
  backoff_multiplier: 2, // Double each time
  max_delay_ms: 30000, // 30 seconds max
  retry_on_errors: [], // Retry all errors by default
  dont_retry_on_errors: [], // Don't exclude any errors by default
  delay_strategy: 'exponential' as RetryDelayStrategy, // Exponential backoff
  circuit_breaker: {
    enabled: false,
    failure_threshold: 5,
    cooldown_ms: 60000,
  },
};

/**
 * Result of retry operation
 */
export interface RetryResult<T> {
  /** Whether operation succeeded */
  success: boolean;
  /** Result value (if successful) */
  value?: T;
  /** Final error (if failed after all retries) */
  error?: Error;
  /** Total number of attempts made */
  attempts: number;
  /** Total time spent (including delays) in milliseconds */
  totalDuration: number;
}

/**
 * Retry policy with multiple delay strategies and circuit breaker
 */
export class RetryPolicy {
  private config: Required<Omit<RetryPolicyConfig, 'circuit_breaker'>> & {
    circuit_breaker: Required<CircuitBreakerConfig>;
  };
  private circuitBreaker: CircuitBreaker;

  /**
   * Create a new RetryPolicy
   *
   * @param config - Retry policy configuration
   */
  constructor(config: RetryPolicyConfig = {}) {
    this.config = {
      ...DEFAULT_RETRY_CONFIG,
      ...config,
      circuit_breaker: {
        ...DEFAULT_RETRY_CONFIG.circuit_breaker,
        ...config.circuit_breaker,
      },
    };

    this.circuitBreaker = CircuitBreaker.getInstance();

    // Validate configuration
    if (this.config.max_attempts < 1) {
      throw new Error('max_attempts must be at least 1');
    }
    if (this.config.initial_delay_ms < 0) {
      throw new Error('initial_delay_ms must be non-negative');
    }
    if (this.config.backoff_multiplier < 1) {
      throw new Error('backoff_multiplier must be at least 1');
    }
    if (this.config.max_delay_ms < 0) {
      throw new Error('max_delay_ms must be non-negative');
    }

    log.debug('[RetryPolicy] Initialized', {
      max_attempts: this.config.max_attempts,
      initial_delay_ms: this.config.initial_delay_ms,
      backoff_multiplier: this.config.backoff_multiplier,
      max_delay_ms: this.config.max_delay_ms,
      retry_on_errors: this.config.retry_on_errors,
      dont_retry_on_errors: this.config.dont_retry_on_errors,
      delay_strategy: this.config.delay_strategy,
      circuit_breaker: this.config.circuit_breaker,
    });
  }

  /**
   * Determine if error should trigger retry
   *
   * @param error - Error to check
   * @param attempt - Current attempt number (1-indexed)
   * @returns Whether to retry this error
   */
  shouldRetry(error: Error, attempt: number): boolean {
    // Check if we've exhausted attempts
    if (attempt >= this.config.max_attempts) {
      log.debug('[RetryPolicy] Max attempts reached', {
        attempt,
        max_attempts: this.config.max_attempts,
      });
      return false;
    }

    const errorMessage = error.message.toLowerCase();

    // Check dont_retry_on_errors first (takes precedence)
    if (this.config.dont_retry_on_errors.length > 0) {
      const shouldNotRetry = this.config.dont_retry_on_errors.some((pattern) =>
        errorMessage.includes(pattern.toLowerCase())
      );

      if (shouldNotRetry) {
        log.debug('[RetryPolicy] Error matches dont_retry_on pattern - will not retry', {
          attempt,
          errorMessage: error.message,
          dont_retry_on_filters: this.config.dont_retry_on_errors,
        });
        return false;
      }
    }

    // If no retry_on_errors specified, retry all errors (that aren't excluded)
    if (this.config.retry_on_errors.length === 0) {
      log.debug('[RetryPolicy] No retry_on filters - will retry', { attempt });
      return true;
    }

    // Check if error message matches any retry_on filter (case-insensitive)
    const shouldRetry = this.config.retry_on_errors.some((pattern) =>
      errorMessage.includes(pattern.toLowerCase())
    );

    log.debug('[RetryPolicy] Error filter check', {
      attempt,
      errorMessage: error.message,
      retry_on_filters: this.config.retry_on_errors,
      shouldRetry,
    });

    return shouldRetry;
  }

  /**
   * Calculate delay for given attempt using configured strategy
   *
   * @param attempt - Attempt number (1-indexed, where attempt=1 means first retry)
   * @returns Delay in milliseconds (capped at max_delay_ms)
   */
  getDelayMs(attempt: number): number {
    if (attempt < 1) {
      return 0;
    }

    let delay: number;

    switch (this.config.delay_strategy) {
      case 'fixed': {
        // Fixed delay: Always use initial_delay_ms
        delay = this.config.initial_delay_ms;
        break;
      }

      case 'exponential': {
        // Exponential backoff: initial_delay * (backoff_multiplier ^ (attempt - 1))
        delay =
          this.config.initial_delay_ms * Math.pow(this.config.backoff_multiplier, attempt - 1);
        break;
      }

      case 'jittered': {
        // Exponential with jitter: Add random factor to prevent thundering herd
        const exponentialDelay =
          this.config.initial_delay_ms * Math.pow(this.config.backoff_multiplier, attempt - 1);
        // Add ±20% jitter
        const jitter = exponentialDelay * (0.8 + Math.random() * 0.4);
        delay = jitter;
        break;
      }

      default: {
        // Default to exponential
        delay =
          this.config.initial_delay_ms * Math.pow(this.config.backoff_multiplier, attempt - 1);
      }
    }

    // Cap at max delay
    const cappedDelay = Math.min(delay, this.config.max_delay_ms);

    log.debug('[RetryPolicy] Calculated delay', {
      attempt,
      strategy: this.config.delay_strategy,
      rawDelay: delay,
      cappedDelay,
      max_delay_ms: this.config.max_delay_ms,
    });

    return cappedDelay;
  }

  /**
   * Execute function with retry logic, multiple delay strategies, and circuit breaker
   *
   * @param fn - Async function to execute
   * @param context - Optional context for logging (workflowId, stepId)
   * @param resourceId - Optional resource ID for circuit breaker (defaults to stepId or 'default')
   * @returns Retry result with success/failure, value, attempts, and duration
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    context?: { workflowId?: string; stepId?: string },
    resourceId?: string
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    const logContext = {
      workflowId: context?.workflowId || 'unknown',
      stepId: context?.stepId || 'unknown',
    };

    const circuitResourceId = resourceId || context?.stepId || 'default';

    log.debug('[RetryPolicy] Starting execution with retry', {
      ...logContext,
      max_attempts: this.config.max_attempts,
      delay_strategy: this.config.delay_strategy,
      circuit_breaker_enabled: this.config.circuit_breaker.enabled,
      resourceId: circuitResourceId,
    });

    // Attempt execution (initial + retries)
    for (let attempt = 1; attempt <= this.config.max_attempts; attempt++) {
      attempts = attempt;

      // Check circuit breaker state before attempting
      if (this.config.circuit_breaker.enabled) {
        const circuitState = this.circuitBreaker.getState(
          circuitResourceId,
          this.config.circuit_breaker
        );

        if (circuitState === CircuitState.OPEN) {
          log.error('[RetryPolicy] Circuit breaker OPEN - aborting execution', {
            ...logContext,
            resourceId: circuitResourceId,
          });

          return {
            success: false,
            error: new Error('Circuit breaker is OPEN - too many consecutive failures'),
            attempts: 0,
            totalDuration: Date.now() - startTime,
          };
        }
      }

      try {
        log.debug('[RetryPolicy] Executing attempt', {
          ...logContext,
          attempt,
          max_attempts: this.config.max_attempts,
        });

        // Execute with circuit breaker wrapper (per attempt)
        let result: T;
        if (this.config.circuit_breaker.enabled) {
          const circuitResult = await this.circuitBreaker.execute(
            circuitResourceId,
            fn,
            this.config.circuit_breaker
          );

          if (!circuitResult.success) {
            throw circuitResult.error || new Error('Circuit breaker execution failed');
          }

          result = circuitResult.value!;
        } else {
          result = await fn();
        }

        const totalDuration = Date.now() - startTime;

        log.info('[RetryPolicy] Execution succeeded', {
          ...logContext,
          attempt,
          totalDuration,
        });

        return {
          success: true,
          value: result,
          attempts,
          totalDuration,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        log.warn('[RetryPolicy] Attempt failed', {
          ...logContext,
          attempt,
          max_attempts: this.config.max_attempts,
          error: lastError.message,
        });

        // Check if we should retry
        if (this.shouldRetry(lastError, attempt)) {
          const delay = this.getDelayMs(attempt);

          log.info('[RetryPolicy] Retrying after delay', {
            ...logContext,
            attempt,
            nextAttempt: attempt + 1,
            delayMs: delay,
            delayStrategy: this.config.delay_strategy,
            error: lastError.message,
          });

          // Wait before next attempt (non-blocking)
          await this.sleep(delay);
        } else {
          log.error('[RetryPolicy] Not retrying - exhausted attempts or error not retryable', {
            ...logContext,
            attempt,
            error: lastError.message,
          });

          break;
        }
      }
    }

    // All attempts failed
    const totalDuration = Date.now() - startTime;

    log.error('[RetryPolicy] All attempts failed', {
      ...logContext,
      attempts,
      totalDuration,
      error: lastError?.message,
    });

    return {
      success: false,
      error: lastError,
      attempts,
      totalDuration,
    };
  }

  /**
   * Sleep for specified duration (non-blocking)
   *
   * @param ms - Milliseconds to sleep
   * @returns Promise that resolves after delay
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current retry configuration
   *
   * @returns Copy of current configuration
   */
  getConfig(): Readonly<
    Required<Omit<RetryPolicyConfig, 'circuit_breaker'>> & {
      circuit_breaker: Required<CircuitBreakerConfig>;
    }
  > {
    return { ...this.config };
  }
}
