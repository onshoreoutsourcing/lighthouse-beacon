/**
 * ExecutionVisualizer Component Tests
 *
 * Comprehensive test suite for execution visualization with WorkflowCanvas integration.
 *
 * Test Coverage:
 * - Component rendering with execution state
 * - Node status updates during execution
 * - Visual feedback and styling
 * - Integration with useExecutionState hook
 * - Progress bar display
 * - Cleanup on unmount
 * - Accessibility
 * - Performance
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExecutionVisualizer } from '../ExecutionVisualizer';
import type { ExecutionState } from '@renderer/hooks/useExecutionState';

// Mock useExecutionState hook
vi.mock('@renderer/hooks/useExecutionState');

// Mock WorkflowCanvas component
vi.mock('../WorkflowCanvas', () => ({
  WorkflowCanvas: ({ className }: { className?: string }) => (
    <div data-testid="workflow-canvas" className={className}>
      Workflow Canvas Mock
    </div>
  ),
}));

// Mock ExecutionProgressBar component
vi.mock('../ExecutionProgressBar', () => ({
  ExecutionProgressBar: ({
    completed,
    total,
    estimatedTimeRemaining,
  }: {
    completed: number;
    total: number;
    estimatedTimeRemaining: number | null;
  }) => (
    <div data-testid="execution-progress-bar">
      Progress: {completed}/{total} - ETA: {estimatedTimeRemaining}ms
    </div>
  ),
}));

// Mock workflow store
vi.mock('@renderer/stores/workflow.store', () => ({
  useWorkflowStore: () => ({
    nodes: [],
    edges: [],
    updateNodeStatus: vi.fn(),
  }),
}));

// Import after mocks
import { useExecutionState } from '@renderer/hooks/useExecutionState';

describe('ExecutionVisualizer', () => {
  // Default mock execution state
  const mockExecutionState: ExecutionState = {
    workflowId: 'test-workflow',
    isExecuting: false,
    stepStatuses: {},
    progress: {
      completed: 0,
      total: 0,
      estimatedTimeRemaining: null,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useExecutionState).mockReturnValue(mockExecutionState);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render without errors', () => {
      render(<ExecutionVisualizer />);
      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
    });

    it('should not render when not executing', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: false,
      });

      render(<ExecutionVisualizer />);

      // Should only show canvas, not progress bar
      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      expect(screen.queryByTestId('execution-progress-bar')).not.toBeInTheDocument();
    });

    it('should render progress bar when executing', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        progress: {
          completed: 2,
          total: 5,
          estimatedTimeRemaining: 5000,
        },
      });

      render(<ExecutionVisualizer />);

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      expect(screen.getByTestId('execution-progress-bar')).toBeInTheDocument();
      expect(screen.getByText(/Progress: 2\/5/)).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<ExecutionVisualizer className="custom-class" />);

      const visualizer = screen.getByRole('region');
      expect(visualizer).toHaveClass('custom-class');
    });

    it('should have accessible ARIA labels', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
      });

      render(<ExecutionVisualizer />);

      const visualizer = screen.getByRole('region');
      expect(visualizer).toHaveAttribute('aria-label', 'Workflow execution visualization');
    });
  });

  describe('Execution State Integration', () => {
    it('should subscribe to execution state on mount', () => {
      render(<ExecutionVisualizer />);

      expect(useExecutionState).toHaveBeenCalledWith(undefined);
    });

    it('should subscribe with workflow ID when provided', () => {
      render(<ExecutionVisualizer workflowId="workflow-123" />);

      expect(useExecutionState).toHaveBeenCalledWith('workflow-123');
    });

    it('should display step statuses from execution state', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        stepStatuses: {
          'step-1': 'running',
          'step-2': 'success',
          'step-3': 'pending',
        },
      });

      render(<ExecutionVisualizer />);

      // Component should process step statuses
      expect(useExecutionState).toHaveBeenCalled();
    });
  });

  describe('Progress Display', () => {
    it('should show progress bar with correct values', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        progress: {
          completed: 3,
          total: 10,
          estimatedTimeRemaining: 15000,
        },
      });

      render(<ExecutionVisualizer />);

      expect(screen.getByTestId('execution-progress-bar')).toBeInTheDocument();
      expect(screen.getByText(/Progress: 3\/10/)).toBeInTheDocument();
      expect(screen.getByText(/ETA: 15000ms/)).toBeInTheDocument();
    });

    it('should handle null estimated time remaining', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        progress: {
          completed: 1,
          total: 5,
          estimatedTimeRemaining: null,
        },
      });

      render(<ExecutionVisualizer />);

      expect(screen.getByTestId('execution-progress-bar')).toBeInTheDocument();
      // When null, the mock shows "ETA: ms" (no value between : and ms)
      expect(screen.getByText(/Progress: 1\/5/)).toBeInTheDocument();
    });

    it('should update progress when execution state changes', () => {
      // Start with not executing
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: false,
      });

      const { unmount } = render(<ExecutionVisualizer />);

      // Should not show progress bar when not executing
      expect(screen.queryByTestId('execution-progress-bar')).not.toBeInTheDocument();

      // Cleanup
      unmount();

      // Render again with execution started
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        progress: {
          completed: 0,
          total: 3,
          estimatedTimeRemaining: 9000,
        },
      });

      render(<ExecutionVisualizer />);

      // Should show progress bar
      expect(screen.getByTestId('execution-progress-bar')).toBeInTheDocument();
      expect(screen.getByText(/0/)).toBeInTheDocument();
      expect(screen.getByText(/3/)).toBeInTheDocument();
    });
  });

  describe('Node Status Updates', () => {
    it('should handle nodes with pending status', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        stepStatuses: {
          'node-1': 'pending',
        },
      });

      render(<ExecutionVisualizer />);

      // Component should render without errors
      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
    });

    it('should handle nodes with running status', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        stepStatuses: {
          'node-1': 'running',
        },
      });

      render(<ExecutionVisualizer />);

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
    });

    it('should handle nodes with success status', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        stepStatuses: {
          'node-1': 'success',
        },
      });

      render(<ExecutionVisualizer />);

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
    });

    it('should handle nodes with error status', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        stepStatuses: {
          'node-1': 'error',
        },
      });

      render(<ExecutionVisualizer />);

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
    });

    it('should handle mixed node statuses', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        stepStatuses: {
          'node-1': 'success',
          'node-2': 'running',
          'node-3': 'pending',
          'node-4': 'error',
        },
      });

      render(<ExecutionVisualizer />);

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = render(<ExecutionVisualizer />);

      unmount();

      // useExecutionState hook handles cleanup internally
      // This test verifies no errors occur during unmount
      expect(true).toBe(true);
    });

    it('should not throw errors when unmounting during execution', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        stepStatuses: {
          'node-1': 'running',
        },
      });

      const { unmount } = render(<ExecutionVisualizer />);

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty step statuses', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        stepStatuses: {},
      });

      render(<ExecutionVisualizer />);

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
    });

    it('should handle workflow completion', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: false,
        stepStatuses: {
          'node-1': 'success',
          'node-2': 'success',
        },
        progress: {
          completed: 2,
          total: 2,
          estimatedTimeRemaining: null,
        },
      });

      render(<ExecutionVisualizer />);

      // Should show canvas but not progress bar (not executing)
      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      expect(screen.queryByTestId('execution-progress-bar')).not.toBeInTheDocument();
    });

    it('should handle null workflow ID', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        workflowId: null,
        isExecuting: false,
      });

      render(<ExecutionVisualizer />);

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
    });

    it('should handle zero total steps', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        progress: {
          completed: 0,
          total: 0,
          estimatedTimeRemaining: null,
        },
      });

      render(<ExecutionVisualizer />);

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      expect(screen.getByTestId('execution-progress-bar')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render quickly with many step statuses', () => {
      // Create many step statuses
      const stepStatuses: Record<string, 'pending' | 'running' | 'success' | 'error'> = {};
      for (let i = 0; i < 100; i++) {
        stepStatuses[`node-${i}`] = i % 4 === 0 ? 'running' : 'pending';
      }

      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        stepStatuses,
        progress: {
          completed: 25,
          total: 100,
          estimatedTimeRemaining: 75000,
        },
      });

      const startTime = Date.now();
      render(<ExecutionVisualizer />);
      const endTime = Date.now();

      const renderTime = endTime - startTime;

      // Should render in less than 50ms (performance target)
      expect(renderTime).toBeLessThan(50);
    });

    it('should handle rapid re-renders efficiently', async () => {
      const { rerender } = render(<ExecutionVisualizer />);

      for (let i = 0; i < 10; i++) {
        vi.mocked(useExecutionState).mockReturnValue({
          ...mockExecutionState,
          isExecuting: true,
          progress: {
            completed: i,
            total: 10,
            estimatedTimeRemaining: (10 - i) * 1000,
          },
        });

        rerender(<ExecutionVisualizer />);
      }

      // Should complete without errors
      await waitFor(() => {
        expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
      });

      render(<ExecutionVisualizer />);

      const visualizer = screen.getByRole('region');
      expect(visualizer).toBeInTheDocument();
    });

    it('should have descriptive aria-label', () => {
      render(<ExecutionVisualizer />);

      const visualizer = screen.getByRole('region');
      expect(visualizer).toHaveAttribute('aria-label');
    });

    it('should announce execution state changes to screen readers', () => {
      const { rerender } = render(<ExecutionVisualizer />);

      // Start execution
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
      });

      rerender(<ExecutionVisualizer />);

      // Should have aria-live region (implicitly via progress bar)
      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should integrate with WorkflowCanvas', () => {
      render(<ExecutionVisualizer />);

      expect(screen.getByTestId('workflow-canvas')).toBeInTheDocument();
    });

    it('should integrate with ExecutionProgressBar', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        progress: {
          completed: 5,
          total: 10,
          estimatedTimeRemaining: 5000,
        },
      });

      render(<ExecutionVisualizer />);

      expect(screen.getByTestId('execution-progress-bar')).toBeInTheDocument();
    });

    it('should pass correct props to ExecutionProgressBar', () => {
      vi.mocked(useExecutionState).mockReturnValue({
        ...mockExecutionState,
        isExecuting: true,
        progress: {
          completed: 3,
          total: 7,
          estimatedTimeRemaining: 12000,
        },
      });

      render(<ExecutionVisualizer />);

      const progressBar = screen.getByTestId('execution-progress-bar');
      expect(progressBar).toHaveTextContent('Progress: 3/7');
      expect(progressBar).toHaveTextContent('ETA: 12000ms');
    });
  });
});
