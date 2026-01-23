/**
 * ErrorLogger Utility
 *
 * Sanitizes and logs workflow errors with context.
 * Removes sensitive data (API keys, tokens, passwords, secrets) from error messages.
 *
 * Features:
 * - Sensitive data sanitization (api_key, token, password, secret patterns)
 * - Error logging with workflow context
 * - Development vs production logging behavior
 * - Stack trace sanitization
 * - Type-safe error handling
 *
 * Usage:
 * const sanitized = sanitizeErrorData(error);
 * const logged = logWorkflowError(error, { workflowId: 'workflow-123' });
 */

/**
 * Sanitized error information
 */
export interface SanitizedError {
  /** Error message with sensitive data redacted */
  message: string;
  /** Error name (e.g., 'TypeError', 'Error') */
  name: string;
  /** Sanitized stack trace (if available) */
  stack?: string;
}

/**
 * Error context for workflow errors
 */
export interface ErrorContext {
  /** Workflow ID */
  workflowId?: string;
  /** Step ID */
  stepId?: string;
  /** Operation name */
  operation?: string;
  /** Input parameters */
  inputs?: Record<string, unknown>;
  /** Output data */
  outputs?: Record<string, unknown>;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Complete error information with context
 */
export interface LoggedError extends SanitizedError {
  /** Error timestamp */
  timestamp: Date;
  /** Error context */
  context?: ErrorContext;
  /** Original error object */
  original: unknown;
}

/**
 * Patterns for detecting sensitive data
 */
const SENSITIVE_PATTERNS = [
  // API keys: api_key=value, apiKey=value, API_KEY=value
  /api[_-]?key\s*[=:]\s*([^\s,;]+)/gi,
  // Tokens: token:value, TOKEN=value, bearer token
  /token\s*[=:]\s*([^\s,;]+)/gi,
  // Passwords: password=value, PASSWORD:value
  /password\s*[=:]\s*([^\s,;]+)/gi,
  // Secrets: secret=value, SECRET:value
  /secret\s*[=:]\s*([^\s,;]+)/gi,
];

/**
 * Sanitize a string by removing sensitive data
 */
function sanitizeString(input: string): string {
  let sanitized = input;

  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, (match) => {
      // Extract the key part (before = or :)
      const keyMatch = match.match(/^([^=:]+)[=:]/);
      const key = keyMatch ? keyMatch[1] : match.split('=')[0].split(':')[0];
      return `${key}=[REDACTED]`;
    });
  }

  return sanitized;
}

/**
 * Check if a string contains sensitive data
 */
function containsSensitiveData(input: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0; // Reset regex state
    return pattern.test(input);
  });
}

/**
 * Sanitize an object by removing sensitive data
 * Handles nested objects and arrays
 */
function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle circular references
  const seen = new WeakSet();

  function sanitizeValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    // Handle primitives
    if (typeof value === 'string') {
      return sanitizeString(value);
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    // Handle objects and arrays
    if (typeof value === 'object') {
      // TypeScript knows value is object here (not null because of earlier check)
      // Prevent circular references
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);

      // Handle arrays
      if (Array.isArray(value)) {
        return value.map((item) => sanitizeValue(item));
      }

      // Handle plain objects
      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        // Check if key contains sensitive patterns (e.g., apiKey, password)
        const sensitiveKeyPatterns = /api[_-]?key|token|password|secret/gi;
        if (sensitiveKeyPatterns.test(key)) {
          // Redact the value if key is sensitive
          sanitized[key] = '[REDACTED]';
        } else {
          // Otherwise, recursively sanitize the value
          sanitized[key] = sanitizeValue(val);
        }
      }
      return sanitized;
    }

    return value;
  }

  return sanitizeValue(obj);
}

/**
 * Sanitize error data by removing sensitive information
 *
 * @param error - Error object, string, or unknown error
 * @returns Sanitized error information
 */
export function sanitizeErrorData(error: unknown): SanitizedError {
  // Handle null/undefined
  if (error === null || error === undefined) {
    return {
      message: 'Unknown error',
      name: 'Error',
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: sanitizeString(error),
      name: 'Error',
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    const sanitized: SanitizedError = {
      message: sanitizeString(error.message),
      name: error.name,
    };

    // Sanitize stack trace if available
    if (error.stack) {
      sanitized.stack = sanitizeString(error.stack);
    }

    return sanitized;
  }

  // Handle plain objects with message property
  if (typeof error === 'object' && 'message' in error) {
    const errorObj = error as { message: unknown; name?: string; stack?: string };
    return {
      message: sanitizeString(String(errorObj.message)),
      name: errorObj.name || 'Error',
      stack: errorObj.stack ? sanitizeString(errorObj.stack) : undefined,
    };
  }

  // Fallback: stringify the error
  try {
    let errorString: string;
    if (typeof error === 'object' && error !== null) {
      // For objects, try to extract useful info
      // We know error is an object here, safe to stringify
      errorString = JSON.stringify(error as Record<string, unknown>);
    } else {
      // For primitives (string, number, boolean, etc), use String()
      // We know error is NOT an object here
      errorString = String(error as string | number | boolean | symbol);
    }
    return {
      message: sanitizeString(errorString),
      name: 'Error',
    };
  } catch {
    return {
      message: 'Unknown error (could not stringify)',
      name: 'Error',
    };
  }
}

/**
 * Log a workflow error with context
 *
 * Sanitizes sensitive data and logs to console in development mode.
 * Returns sanitized error information for display to users.
 *
 * @param error - Error object or message
 * @param context - Optional workflow context
 * @returns Logged error information with sanitized data
 */
export function logWorkflowError(error: unknown, context?: ErrorContext): LoggedError {
  // Sanitize error
  const sanitizedError = sanitizeErrorData(error);

  // Sanitize context
  const sanitizedContext = context ? (sanitizeObject(context) as ErrorContext) : undefined;

  // Create logged error
  const loggedError: LoggedError = {
    ...sanitizedError,
    timestamp: new Date(),
    context: sanitizedContext,
    original: error,
  };

  // Log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.error('[WorkflowError]', {
      message: sanitizedError.message,
      name: sanitizedError.name,
      context: sanitizedContext,
      timestamp: loggedError.timestamp.toISOString(),
      stack: sanitizedError.stack,
    });

    // Warn if sensitive data was detected
    const originalMessage =
      error instanceof Error ? error.message : typeof error === 'string' ? error : '';
    if (typeof originalMessage === 'string' && containsSensitiveData(originalMessage)) {
      console.warn('[WorkflowError] Sensitive data detected and redacted from error message');
    }
  }

  return loggedError;
}
