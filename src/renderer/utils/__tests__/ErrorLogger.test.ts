/**
 * ErrorLogger Tests
 *
 * Comprehensive test suite for workflow error logging and sanitization.
 *
 * Test Coverage:
 * - Error sanitization (API keys, tokens, passwords, secrets)
 * - Error logging with context
 * - Development vs production behavior
 * - Edge cases and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logWorkflowError, sanitizeErrorData } from '../ErrorLogger';
import type { SanitizedError, ErrorContext } from '../ErrorLogger';

describe('ErrorLogger', () => {
  const originalEnv = process.env.NODE_ENV;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('sanitizeErrorData', () => {
    it('should sanitize API keys in error messages', () => {
      const error = new Error('Failed with api_key=sk_test_1234567890');
      const result = sanitizeErrorData(error);

      expect(result.message).toContain('[REDACTED]');
      expect(result.message).not.toContain('sk_test_1234567890');
    });

    it('should sanitize multiple sensitive patterns in single message', () => {
      const error = new Error('Auth failed: api_key=secret123, token:bearer_abc, password=mypass');
      const result = sanitizeErrorData(error);

      expect(result.message).not.toContain('secret123');
      expect(result.message).not.toContain('bearer_abc');
      expect(result.message).not.toContain('mypass');
      expect(result.message).toMatch(/\[REDACTED\]/g);
    });

    it('should sanitize tokens with colon separator', () => {
      const error = new Error('Request failed: token:eyJhbGciOiJIUzI1NiIs');
      const result = sanitizeErrorData(error);

      expect(result.message).toContain('[REDACTED]');
      expect(result.message).not.toContain('eyJhbGciOiJIUzI1NiIs');
    });

    it('should sanitize passwords', () => {
      const error = new Error('Login failed: password=super_secret_123');
      const result = sanitizeErrorData(error);

      expect(result.message).toContain('[REDACTED]');
      expect(result.message).not.toContain('super_secret_123');
    });

    it('should sanitize secrets', () => {
      const error = new Error('Config error: secret=my_secret_value_here');
      const result = sanitizeErrorData(error);

      expect(result.message).toContain('[REDACTED]');
      expect(result.message).not.toContain('my_secret_value_here');
    });

    it('should preserve stack trace while sanitizing', () => {
      const error = new Error('Failed with api_key=secret123');
      error.stack = `Error: Failed with api_key=secret123
    at Object.<anonymous> (/path/to/file.js:10:15)
    at Module._compile (internal/modules/cjs/loader.js:1063:30)`;

      const result = sanitizeErrorData(error);

      expect(result.stack).toBeDefined();
      expect(result.stack).not.toContain('secret123');
      expect(result.stack).toContain('[REDACTED]');
    });

    it('should handle errors without stack traces', () => {
      const error = new Error('Simple error');
      delete error.stack;

      const result = sanitizeErrorData(error);

      expect(result.message).toBe('Simple error');
      expect(result.stack).toBeUndefined();
    });

    it('should handle non-Error objects', () => {
      const errorObj = {
        message: 'Custom error with api_key=secret',
        code: 'ERR_AUTH',
      };

      const result = sanitizeErrorData(errorObj as Error);

      expect(result.message).toContain('[REDACTED]');
      expect(result.message).not.toContain('secret');
    });

    it('should handle string errors', () => {
      const errorString = 'Network error: token:abc123';

      const result = sanitizeErrorData(errorString);

      expect(result.message).toContain('[REDACTED]');
      expect(result.message).not.toContain('abc123');
    });

    it('should handle null/undefined errors', () => {
      const result1 = sanitizeErrorData(null);
      const result2 = sanitizeErrorData(undefined);

      expect(result1.message).toBe('Unknown error');
      expect(result2.message).toBe('Unknown error');
    });

    it('should preserve error name', () => {
      const error = new TypeError('Invalid type');
      const result = sanitizeErrorData(error);

      expect(result.name).toBe('TypeError');
    });

    it('should sanitize case-insensitive patterns', () => {
      const error = new Error('Failed: API_KEY=secret, Token:bearer, PASSWORD=pass');
      const result = sanitizeErrorData(error);

      expect(result.message).not.toContain('secret');
      expect(result.message).not.toContain('bearer');
      expect(result.message).not.toContain('pass');
    });
  });

  describe('logWorkflowError', () => {
    it('should log error with context in development mode', () => {
      process.env.NODE_ENV = 'development';

      const error = new Error('Workflow execution failed');
      const context: ErrorContext = {
        workflowId: 'workflow-123',
        stepId: 'step-1',
        operation: 'python-execution',
      };

      const result = logWorkflowError(error, context);

      expect(consoleSpy).toHaveBeenCalled();
      expect(result.message).toBe('Workflow execution failed');
      expect(result.context).toEqual(context);
    });

    it('should not log to console in production mode', () => {
      process.env.NODE_ENV = 'production';

      const error = new Error('Production error');
      const context: ErrorContext = {
        workflowId: 'workflow-456',
      };

      logWorkflowError(error, context);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should sanitize sensitive data in context', () => {
      process.env.NODE_ENV = 'development';

      const error = new Error('Auth failed');
      const context: ErrorContext = {
        workflowId: 'workflow-789',
        inputs: {
          apiKey: 'sk_test_secret_key',
          username: 'john_doe',
        },
      };

      const result = logWorkflowError(error, context);

      expect(result.context?.inputs).toBeDefined();
      // Context sanitization should be applied
      const inputsStr = JSON.stringify(result.context?.inputs);
      expect(inputsStr).not.toContain('sk_test_secret_key');
    });

    it('should include timestamp in logged error', () => {
      const error = new Error('Test error');
      const context: ErrorContext = { workflowId: 'test-workflow' };

      const result = logWorkflowError(error, context);

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should preserve original error object reference', () => {
      const originalError = new Error('Original');
      const result = logWorkflowError(originalError, {});

      expect(result.original).toBe(originalError);
    });

    it('should handle errors without context', () => {
      const error = new Error('No context error');

      const result = logWorkflowError(error);

      expect(result.message).toBe('No context error');
      expect(result.context).toBeUndefined();
    });

    it('should sanitize error in result', () => {
      const error = new Error('Failed with api_key=secret123');
      const result = logWorkflowError(error);

      expect(result.message).toContain('[REDACTED]');
      expect(result.message).not.toContain('secret123');
    });

    it('should warn about sanitization in development', () => {
      process.env.NODE_ENV = 'development';

      const error = new Error('Error with password=secret');
      const result = logWorkflowError(error);

      // Verify sanitization happened
      expect(result.message).toContain('[REDACTED]');
      expect(result.message).not.toContain('secret');

      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sensitive data detected')
      );
    });

    it('should handle complex context objects', () => {
      const error = new Error('Complex error');
      const context: ErrorContext = {
        workflowId: 'complex-workflow',
        inputs: {
          nested: {
            deep: {
              apiKey: 'secret',
            },
          },
          array: ['token:abc', 'normal_value'],
        },
        outputs: {
          result: 'success',
        },
      };

      const result = logWorkflowError(error, context);

      expect(result.context).toBeDefined();
      expect(result.context?.inputs).toBeDefined();
      expect(result.context?.outputs).toBeDefined();
    });

    it('should handle circular references in context', () => {
      const error = new Error('Circular error');
      const context: ErrorContext = {
        workflowId: 'circular',
        inputs: {} as Record<string, unknown>,
      };
      // Create circular reference
      (context.inputs as Record<string, unknown>).self = context.inputs;

      expect(() => logWorkflowError(error, context)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long error messages', () => {
      const longMessage = 'Error: ' + 'x'.repeat(10000) + ' api_key=secret';
      const error = new Error(longMessage);

      const result = sanitizeErrorData(error);

      expect(result.message.length).toBeGreaterThan(0);
      expect(result.message).not.toContain('secret');
    });

    it('should handle errors with special characters', () => {
      const error = new Error('Error: $pecial ch@rs! api_key=secret#123');
      const result = sanitizeErrorData(error);

      expect(result.message).toContain('$pecial ch@rs!');
      expect(result.message).not.toContain('secret#123');
    });

    it('should handle multiple spaces and newlines', () => {
      const error = new Error('Error:\n\n  api_key=secret  \n  token:bearer');
      const result = sanitizeErrorData(error);

      expect(result.message).not.toContain('secret');
      expect(result.message).not.toContain('bearer');
    });

    it('should handle empty error messages', () => {
      const error = new Error('');
      const result = sanitizeErrorData(error);

      expect(result.message).toBe('');
    });

    it('should handle errors with only whitespace', () => {
      const error = new Error('   \n  \t  ');
      const result = sanitizeErrorData(error);

      expect(result.message).toBe('   \n  \t  ');
    });
  });

  describe('Type Safety', () => {
    it('should return SanitizedError type from sanitizeErrorData', () => {
      const error = new Error('Test');
      const result: SanitizedError = sanitizeErrorData(error);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('name');
    });

    it('should return complete error info from logWorkflowError', () => {
      const error = new Error('Test');
      const context: ErrorContext = { workflowId: 'test' };
      const result = logWorkflowError(error, context);

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('context');
      expect(result).toHaveProperty('original');
    });
  });

  describe('Performance', () => {
    it('should sanitize errors quickly', () => {
      const error = new Error('Error with api_key=secret and token:bearer');

      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        sanitizeErrorData(error);
      }
      const endTime = Date.now();

      const duration = endTime - startTime;
      // Should process 1000 errors in less than 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should handle large context objects efficiently', () => {
      const largeContext: ErrorContext = {
        workflowId: 'large-workflow',
        inputs: {},
      };

      // Create large inputs object
      for (let i = 0; i < 100; i++) {
        (largeContext.inputs as Record<string, string>)[`key${i}`] = `value${i}`;
      }

      const error = new Error('Large context error');
      const startTime = Date.now();
      logWorkflowError(error, largeContext);
      const endTime = Date.now();

      const duration = endTime - startTime;
      // Should process in less than 50ms
      expect(duration).toBeLessThan(50);
    });
  });
});
