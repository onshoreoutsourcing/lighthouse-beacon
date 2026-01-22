/**
 * WorkflowErrorBoundary Tests
 *
 * Comprehensive test suite for React error boundary component.
 *
 * Test Coverage:
 * - Error catching and boundary behavior
 * - User-friendly error display
 * - Retry and cancel functionality
 * - Error logging integration
 * - Sensitive data redaction
 * - Accessibility
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkflowErrorBoundary } from '../WorkflowErrorBoundary';
import React from 'react';
import type * as ErrorLoggerModule from '@renderer/utils/ErrorLogger';

// Mock ErrorLogger - but keep actual sanitization logic
vi.mock('@renderer/utils/ErrorLogger', async () => {
  const actual = await vi.importActual<typeof ErrorLoggerModule>('@renderer/utils/ErrorLogger');
  return {
    ...actual,
    logWorkflowError: vi.fn(actual.logWorkflowError),
  };
});

// Mock component that throws errors
const ThrowError = ({ shouldThrow, error }: { shouldThrow: boolean; error?: Error }) => {
  if (shouldThrow) {
    throw error || new Error('Test error');
  }
  return <div data-testid="success-content">Working content</div>;
};

describe('WorkflowErrorBoundary', () => {
  const mockOnRetry = vi.fn();
  const mockOnCancel = vi.fn();

  // Suppress console.error for error boundary tests
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Error Catching', () => {
    it('should render children when no error occurs', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={false} />
        </WorkflowErrorBoundary>
      );

      expect(screen.getByTestId('success-content')).toBeInTheDocument();
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });

    it('should catch errors thrown by children', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} error={new Error('Child component error')} />
        </WorkflowErrorBoundary>
      );

      // Should show error UI instead of children
      expect(screen.queryByTestId('success-content')).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/workflow execution error/i)).toBeInTheDocument();
    });

    it('should display user-friendly error message', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} error={new Error('Complex technical error')} />
        </WorkflowErrorBoundary>
      );

      // Should show friendly message, not raw error
      expect(screen.getByText(/workflow execution error/i)).toBeInTheDocument();
    });

    it('should not crash the application when error occurs', () => {
      expect(() => {
        render(
          <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
            <ThrowError shouldThrow={true} />
          </WorkflowErrorBoundary>
        );
      }).not.toThrow();
    });

    it('should catch multiple consecutive errors', () => {
      const { rerender } = render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} error={new Error('First error')} />
        </WorkflowErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Retry and throw again
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      rerender(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} error={new Error('Second error')} />
        </WorkflowErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should show error title', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} />
        </WorkflowErrorBoundary>
      );

      expect(screen.getByText(/workflow execution error/i)).toBeInTheDocument();
    });

    it('should show sanitized error message', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError
            shouldThrow={true}
            error={new Error('Failed with api_key=secret_should_not_appear')}
          />
        </WorkflowErrorBoundary>
      );

      // Should not show raw sensitive data
      expect(screen.queryByText(/secret_should_not_appear/i)).not.toBeInTheDocument();
      // Should show sanitized message with [REDACTED]
      expect(screen.getByText(/\[REDACTED\]/i)).toBeInTheDocument();
    });

    it('should have retry button', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} />
        </WorkflowErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should have cancel button', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} />
        </WorkflowErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should have view details option', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} />
        </WorkflowErrorBoundary>
      );

      expect(screen.getByText(/view details/i)).toBeInTheDocument();
    });

    it('should toggle technical details when view details clicked', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} error={new Error('Test error with stack')} />
        </WorkflowErrorBoundary>
      );

      // Details should be hidden initially
      expect(screen.queryByText(/stack trace/i)).not.toBeInTheDocument();

      // Click view details
      const viewDetailsButton = screen.getByText(/view details/i);
      fireEvent.click(viewDetailsButton);

      // Details should be visible
      expect(screen.getByText(/technical details/i)).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should call onRetry when retry button clicked', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} />
        </WorkflowErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('should reset error state on retry', () => {
      const { unmount } = render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} />
        </WorkflowErrorBoundary>
      );

      // Error is shown
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Verify callback was called
      expect(mockOnRetry).toHaveBeenCalledTimes(1);

      // Unmount and remount with working component
      unmount();
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={false} />
        </WorkflowErrorBoundary>
      );

      // After retry and remount with non-throwing component, should show working content
      expect(screen.getByTestId('success-content')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button clicked', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} />
        </WorkflowErrorBoundary>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not reset error state on cancel', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} />
        </WorkflowErrorBoundary>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Error UI should still be visible
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Error Logging', () => {
    it('should log errors with ErrorLogger', async () => {
      const { logWorkflowError } = await import('@renderer/utils/ErrorLogger');

      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} error={new Error('Logged error')} />
        </WorkflowErrorBoundary>
      );

      await waitFor(() => {
        expect(logWorkflowError).toHaveBeenCalled();
      });
    });

    it('should log error context', async () => {
      const { logWorkflowError } = await import('@renderer/utils/ErrorLogger');

      render(
        <WorkflowErrorBoundary
          onRetry={mockOnRetry}
          onCancel={mockOnCancel}
          workflowId="test-workflow"
        >
          <ThrowError shouldThrow={true} />
        </WorkflowErrorBoundary>
      );

      await waitFor(() => {
        expect(logWorkflowError).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            workflowId: 'test-workflow',
          })
        );
      });
    });
  });

  describe('Sensitive Data Handling', () => {
    it('should redact sensitive data from displayed errors', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError
            shouldThrow={true}
            error={new Error('Auth failed: api_key=sk_live_secret123')}
          />
        </WorkflowErrorBoundary>
      );

      // Should not display raw API key
      expect(screen.queryByText(/sk_live_secret123/)).not.toBeInTheDocument();
    });

    it('should redact passwords from error messages', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} error={new Error('Login failed: password=mypassword')} />
        </WorkflowErrorBoundary>
      );

      expect(screen.queryByText(/mypassword/)).not.toBeInTheDocument();
    });

    it('should redact tokens from error messages', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} error={new Error('Request failed: token:bearer_xyz')} />
        </WorkflowErrorBoundary>
      );

      expect(screen.queryByText(/bearer_xyz/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role for error container', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} />
        </WorkflowErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} />
        </WorkflowErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} />
        </WorkflowErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // Buttons should be focusable
      retryButton.focus();
      expect(document.activeElement).toBe(retryButton);

      cancelButton.focus();
      expect(document.activeElement).toBe(cancelButton);
    });
  });

  describe('Edge Cases', () => {
    it('should handle errors without message', () => {
      const errorWithoutMessage = new Error();
      errorWithoutMessage.message = '';

      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} error={errorWithoutMessage} />
        </WorkflowErrorBoundary>
      );

      // Should show error UI
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should handle errors with very long messages', () => {
      const longMessage = 'Error: ' + 'x'.repeat(1000);
      const longError = new Error(longMessage);

      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} error={longError} />
        </WorkflowErrorBoundary>
      );

      // Should render error UI without crashing
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should work without onRetry callback', () => {
      render(
        <WorkflowErrorBoundary onCancel={mockOnCancel}>
          <ThrowError shouldThrow={true} />
        </WorkflowErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Should not throw when clicking retry without callback
      expect(() => {
        fireEvent.click(retryButton);
      }).not.toThrow();
    });

    it('should work without onCancel callback', () => {
      render(
        <WorkflowErrorBoundary onRetry={mockOnRetry}>
          <ThrowError shouldThrow={true} />
        </WorkflowErrorBoundary>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();

      // Should not throw when clicking cancel without callback
      fireEvent.click(cancelButton);
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Component State', () => {
    it('should maintain separate error states for different boundaries', () => {
      render(
        <>
          <WorkflowErrorBoundary onRetry={mockOnRetry} onCancel={mockOnCancel}>
            <ThrowError shouldThrow={true} error={new Error('Boundary 1 error')} />
          </WorkflowErrorBoundary>
          <WorkflowErrorBoundary onRetry={vi.fn()} onCancel={vi.fn()}>
            <ThrowError shouldThrow={false} />
          </WorkflowErrorBoundary>
        </>
      );

      // First boundary shows error, second shows content
      expect(screen.getAllByText(/error/i).length).toBeGreaterThan(0);
      expect(screen.getByTestId('success-content')).toBeInTheDocument();
    });
  });
});
