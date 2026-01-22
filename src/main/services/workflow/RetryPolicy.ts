/**
 * RetryPolicy Service
 *
 * Implements exponential backoff retry logic for workflow steps.
 * Configurable per-step via YAML with max attempts, initial delay,
 * backoff multiplier, and error-type filtering.
 *
 * Features:
 * - Exponential backoff (1s, 2s, 4s, 8s, ...)
 * - Maximum delay cap (30s default)
 * - Selective retry on specific error types
 * - Comprehensive retry attempt logging
 * - Non-blocking async execution
 *
 * Architecture:
 * - Used by WorkflowExecutor for step retry logic
 * - Integrates with ExecutionEvents for retry logging
 * - Supports Wave 9.2.3 error handling requirements
 *
 * Usage:
 * const policy = new RetryPolicy(config);
 * const result = await policy.executeWithRetry(async () => { ... });
 */

import log from 'electron-log';

/**
 * Retry policy configuration
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
}

/**
 * Default retry policy configuration
 */
export const DEFAULT_RETRY_CONFIG: Required<RetryPolicyConfig> = {
  max_attempts: 1, // No retry by default
  initial_delay_ms: 1000, // 1 second
  backoff_multiplier: 2, // Double each time
  max_delay_ms: 30000, // 30 seconds max
  retry_on_errors: [], // Retry all errors by default
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
 * Retry policy with exponential backoff
 */
export class RetryPolicy {
  private config: Required<RetryPolicyConfig>;

  /**
   * Create a new RetryPolicy
   *
   * @param config - Retry policy configuration
   */
  constructor(config: RetryPolicyConfig = {}) {
    this.config = {
      ...DEFAULT_RETRY_CONFIG,
      ...config,
    };

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

    // If no error filters specified, retry all errors
    if (this.config.retry_on_errors.length === 0) {
      log.debug('[RetryPolicy] No error filters - will retry', { attempt });
      return true;
    }

    // Check if error message matches any filter (case-insensitive)
    const errorMessage = error.message.toLowerCase();
    const shouldRetry = this.config.retry_on_errors.some((pattern) =>
      errorMessage.includes(pattern.toLowerCase())
    );

    log.debug('[RetryPolicy] Error filter check', {
      attempt,
      errorMessage: error.message,
      filters: this.config.retry_on_errors,
      shouldRetry,
    });

    return shouldRetry;
  }

  /**
   * Calculate delay for given attempt using exponential backoff
   *
   * @param attempt - Attempt number (1-indexed, where attempt=1 means first retry)
   * @returns Delay in milliseconds (capped at max_delay_ms)
   */
  getDelayMs(attempt: number): number {
    if (attempt < 1) {
      return 0;
    }

    // Calculate exponential delay: initial_delay * (backoff_multiplier ^ (attempt - 1))
    const exponentialDelay =
      this.config.initial_delay_ms * Math.pow(this.config.backoff_multiplier, attempt - 1);

    // Cap at max delay
    const delay = Math.min(exponentialDelay, this.config.max_delay_ms);

    log.debug('[RetryPolicy] Calculated delay', {
      attempt,
      exponentialDelay,
      cappedDelay: delay,
      max_delay_ms: this.config.max_delay_ms,
    });

    return delay;
  }

  /**
   * Execute function with retry logic and exponential backoff
   *
   * @param fn - Async function to execute
   * @param context - Optional context for logging (workflowId, stepId)
   * @returns Retry result with success/failure, value, attempts, and duration
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    context?: { workflowId?: string; stepId?: string }
  ): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    const logContext = {
      workflowId: context?.workflowId || 'unknown',
      stepId: context?.stepId || 'unknown',
    };

    log.debug('[RetryPolicy] Starting execution with retry', {
      ...logContext,
      max_attempts: this.config.max_attempts,
    });

    // Attempt execution (initial + retries)
    for (let attempt = 1; attempt <= this.config.max_attempts; attempt++) {
      attempts = attempt;

      try {
        log.debug('[RetryPolicy] Executing attempt', {
          ...logContext,
          attempt,
          max_attempts: this.config.max_attempts,
        });

        const result = await fn();

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
  getConfig(): Readonly<Required<RetryPolicyConfig>> {
    return { ...this.config };
  }
}
