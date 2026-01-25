/**
 * Error Handling Integration Tests
 *
 * Integration tests for comprehensive error handling in workflow execution.
 * Tests the interaction between:
 * - ErrorLogger utility
 * - WorkflowErrorBoundary component
 * - ExecutionVisualizer component
 * - WorkflowCanvas component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionVisualizer } from '../ExecutionVisualizer';
import type { ExecutionState } from '@renderer/hooks/useExecutionState';
import type * as ErrorLoggerModule from '@renderer/utils/ErrorLogger';
import React from 'react';

// Create a mock state that we can modify
let mockExecutionState: ExecutionState = {
  workflowId: 'test-workflow',
  isExecuting: false,
  stepStatuses: {},
  progress: {
    completed: 0,
    total: 0,
    estimatedTimeRemaining: null,
  },
};

// Create a mock canvas that we can control
let mockCanvasShouldThrow = false;
let mockCanvasError: Error | null = null;

// Mock useExecutionState
vi.mock('@renderer/hooks/useExecutionState', () => ({
  useExecutionState: vi.fn(() => mockExecutionState),
}));

// Mock ErrorLogger to spy on calls
vi.mock('@renderer/utils/ErrorLogger', async () => {
  const actual = await vi.importActual<typeof ErrorLoggerModule>('@renderer/utils/ErrorLogger');
  return {
    ...actual,
    logWorkflowError: vi.fn(actual.logWorkflowError),
  };
});

// Mock WorkflowCanvas to throw errors on demand
vi.mock('../WorkflowCanvas', () => ({
  WorkflowCanvas: () => {
    if (mockCanvasShouldThrow && mockCanvasError) {
      throw mockCanvasError;
    }
    return <div data-testid="workflow-canvas">Canvas Content</div>;
  },
}));

describe('Error Handling Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockCanvasShouldThrow = false;
    mockCanvasError = null;
    mockExecutionState = {
      workflowId: 'test-workflow',
      isExecuting: false,
      stepStatuses: {},
      progress: {
        completed: 0,
        total: 0,
        estimatedTimeRemaining: null,
      },
    };
  });

  describe('End-to-End Error Flow', () => {
    it('should catch errors, log them, sanitize sensitive data, and display recovery UI', async () => {
      const { logWorkflowError } = await import('@renderer/utils/ErrorLogger');

      // Configure mock to throw error
      mockCanvasShouldThrow = true;
      mockCanvasError = new Error('Execution failed: password=secret123');

      render(<ExecutionVisualizer workflowId="integration-test" />);

      // Wait for error boundary to catch error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Verify error was logged
      expect(logWorkflowError).toHaveBeenCalled();
      const logCall = vi.mocked(logWorkflowError).mock.calls[0];
      expect(logCall[0]).toBeInstanceOf(Error);
      expect(logCall[1]).toMatchObject({
        workflowId: 'integration-test',
      });

      // Verify sensitive data is not displayed
      expect(screen.queryByText(/secret123/)).not.toBeInTheDocument();
      expect(screen.getByText(/\[REDACTED\]/)).toBeInTheDocument();

      // Verify recovery UI is shown
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should handle retry flow after error', async () => {
      const { logWorkflowError } = await import('@renderer/utils/ErrorLogger');

      // First render throws error
      mockCanvasShouldThrow = true;
      mockCanvasError = new Error('Initial error');

      const { unmount } = render(<ExecutionVisualizer workflowId="retry-test" />);

      // Error is shown
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Verify retry was logged (check all calls for the retry one)
      const allCalls = vi.mocked(logWorkflowError).mock.calls;
      const retryCall = allCalls.find((call) => {
        const context = call[1];
        return context?.operation === 'retry-after-error';
      });

      expect(retryCall).toBeDefined();
      if (retryCall) {
        expect(String(retryCall[0])).toContain('retry');
        expect(retryCall[1]).toMatchObject({
          workflowId: 'retry-test',
          operation: 'retry-after-error',
        });
      }

      // Remount without error
      unmount();
      mockCanvasShouldThrow = false;
      mockCanvasError = null;
      render(<ExecutionVisualizer workflowId="retry-test" />);

      // Should show working canvas
      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });

    it('should handle cancel flow after error', async () => {
      const { logWorkflowError } = await import('@renderer/utils/ErrorLogger');

      // Render with error
      mockCanvasShouldThrow = true;
      mockCanvasError = new Error('Cancellable error');

      render(<ExecutionVisualizer workflowId="cancel-test" />);

      // Error is shown
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Verify cancel was logged (check all calls for the cancel one)
      const allCalls = vi.mocked(logWorkflowError).mock.calls;
      const cancelCall = allCalls.find((call) => {
        const context = call[1];
        return context?.operation === 'cancel-after-error';
      });

      expect(cancelCall).toBeDefined();
      if (cancelCall) {
        expect(String(cancelCall[0])).toContain('cancel');
        expect(cancelCall[1]).toMatchObject({
          workflowId: 'cancel-test',
          operation: 'cancel-after-error',
        });
      }
    });
  });

  describe('Sensitive Data Protection', () => {
    it('should redact API keys from errors', async () => {
      mockCanvasShouldThrow = true;
      mockCanvasError = new Error('Auth failed: api_key=sk_live_1234567890');

      render(<ExecutionVisualizer />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.queryByText(/sk_live_1234567890/)).not.toBeInTheDocument();
      expect(screen.getByText(/\[REDACTED\]/)).toBeInTheDocument();
    });

    it('should redact multiple sensitive patterns', async () => {
      mockCanvasShouldThrow = true;
      mockCanvasError = new Error(
        'Multiple secrets: api_key=key123, password=pass456, token:bearer789'
      );

      render(<ExecutionVisualizer />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // None of the secrets should appear
      expect(screen.queryByText(/key123/)).not.toBeInTheDocument();
      expect(screen.queryByText(/pass456/)).not.toBeInTheDocument();
      expect(screen.queryByText(/bearer789/)).not.toBeInTheDocument();

      // All should be redacted
      const text = screen.getByRole('alert').textContent || '';
      const redactedCount = (text.match(/\[REDACTED\]/g) || []).length;
      expect(redactedCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Application Stability', () => {
    it('should not crash application when error occurs', async () => {
      mockCanvasShouldThrow = true;
      mockCanvasError = new Error('Critical error');

      expect(() => {
        render(<ExecutionVisualizer />);
      }).not.toThrow();

      // Error UI should be shown instead of crash
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should isolate errors to affected component', async () => {
      mockCanvasShouldThrow = true;
      mockCanvasError = new Error('Canvas error');

      // Mock execution state to be active
      mockExecutionState = {
        workflowId: 'test',
        isExecuting: true,
        stepStatuses: {},
        progress: {
          completed: 2,
          total: 5,
          estimatedTimeRemaining: 3000,
        },
      };

      render(<ExecutionVisualizer />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // The error boundary catches the canvas error, but the container is still there
      expect(screen.getByRole('region', { name: /workflow execution/i })).toBeInTheDocument();
    });
  });

  describe('User Experience', () => {
    it('should provide clear error messages', async () => {
      mockCanvasShouldThrow = true;
      mockCanvasError = new Error('Something went wrong');

      render(<ExecutionVisualizer />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Should show user-friendly title
      expect(screen.getByText(/workflow execution error/i)).toBeInTheDocument();

      // Should show guidance text
      expect(screen.getByText(/encountered an error/i)).toBeInTheDocument();

      // Should have action buttons
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should allow viewing technical details', async () => {
      mockCanvasShouldThrow = true;
      mockCanvasError = new Error('Technical error');

      render(<ExecutionVisualizer />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Details should be hidden initially
      expect(screen.queryByText(/technical details/i)).not.toBeInTheDocument();

      // Click to show details
      const viewDetailsButton = screen.getByText(/view details/i);
      fireEvent.click(viewDetailsButton);

      // Details should now be visible
      expect(screen.getByText(/technical details/i)).toBeInTheDocument();
    });
  });
});
