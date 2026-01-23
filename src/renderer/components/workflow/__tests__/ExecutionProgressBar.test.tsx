/**
 * ExecutionProgressBar Component Tests
 *
 * Tests for workflow execution progress visualization:
 * - Progress display (X of Y steps)
 * - Time estimation display
 * - Progress percentage calculation
 * - Component rendering and styling
 *
 * Coverage Target: ≥90%
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExecutionProgressBar } from '../ExecutionProgressBar';

describe('ExecutionProgressBar', () => {
  describe('Progress Display', () => {
    it('should render progress text correctly', () => {
      render(<ExecutionProgressBar completed={2} total={5} estimatedTimeRemaining={null} />);

      expect(screen.getByText(/2 of 5 steps completed/i)).toBeInTheDocument();
    });

    it('should show 0 of 0 when no workflow is running', () => {
      render(<ExecutionProgressBar completed={0} total={0} estimatedTimeRemaining={null} />);

      expect(screen.getByText(/0 of 0 steps completed/i)).toBeInTheDocument();
    });

    it('should show completed when all steps are done', () => {
      render(<ExecutionProgressBar completed={5} total={5} estimatedTimeRemaining={null} />);

      expect(screen.getByText(/5 of 5 steps completed/i)).toBeInTheDocument();
    });
  });

  describe('Progress Bar Visualization', () => {
    it('should render progress bar with correct percentage', () => {
      const { container } = render(
        <ExecutionProgressBar completed={2} total={5} estimatedTimeRemaining={null} />
      );

      // Progress bar should be 40% (2/5)
      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '2');
      expect(progressBar).toHaveAttribute('aria-valuemax', '5');
    });

    it('should handle 0% progress', () => {
      const { container } = render(
        <ExecutionProgressBar completed={0} total={5} estimatedTimeRemaining={null} />
      );

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle 100% progress', () => {
      const { container } = render(
        <ExecutionProgressBar completed={5} total={5} estimatedTimeRemaining={null} />
      );

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow', '5');
    });

    it('should handle division by zero when total is 0', () => {
      const { container } = render(
        <ExecutionProgressBar completed={0} total={0} estimatedTimeRemaining={null} />
      );

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
      // Should render without crashing
    });
  });

  describe('Time Estimation', () => {
    it('should display estimated time remaining in seconds', () => {
      // 5000ms = 5 seconds
      render(<ExecutionProgressBar completed={2} total={5} estimatedTimeRemaining={5000} />);

      expect(screen.getByText(/~5s remaining/i)).toBeInTheDocument();
    });

    it('should display estimated time in minutes', () => {
      // 90000ms = 1.5 minutes = 90 seconds
      render(<ExecutionProgressBar completed={2} total={5} estimatedTimeRemaining={90000} />);

      expect(screen.getByText(/~1m 30s remaining/i)).toBeInTheDocument();
    });

    it('should display estimated time in hours', () => {
      // 3665000ms = 1h 1m 5s
      render(<ExecutionProgressBar completed={2} total={5} estimatedTimeRemaining={3665000} />);

      expect(screen.getByText(/~1h 1m remaining/i)).toBeInTheDocument();
    });

    it('should not display time when estimation is null', () => {
      render(<ExecutionProgressBar completed={2} total={5} estimatedTimeRemaining={null} />);

      expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();
    });

    it('should not display time when estimation is 0', () => {
      render(<ExecutionProgressBar completed={2} total={5} estimatedTimeRemaining={0} />);

      expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();
    });

    it('should round up seconds', () => {
      // 1500ms should show as 2s (rounded up)
      render(<ExecutionProgressBar completed={2} total={5} estimatedTimeRemaining={1500} />);

      expect(screen.getByText(/~2s remaining/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const { container } = render(
        <ExecutionProgressBar completed={3} total={7} estimatedTimeRemaining={5000} />
      );

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-label');
      expect(progressBar).toHaveAttribute('aria-valuenow', '3');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '7');
    });

    it('should update aria-label with time remaining', () => {
      const { container } = render(
        <ExecutionProgressBar completed={2} total={5} estimatedTimeRemaining={10000} />
      );

      const progressBar = container.querySelector('[role="progressbar"]');
      const ariaLabel = progressBar?.getAttribute('aria-label');
      expect(ariaLabel).toContain('2 of 5');
      expect(ariaLabel).toContain('remaining');
    });
  });

  describe('Visual States', () => {
    it('should render with default styling', () => {
      const { container } = render(
        <ExecutionProgressBar completed={2} total={5} estimatedTimeRemaining={null} />
      );

      expect(container.firstChild).toHaveClass('execution-progress-bar');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ExecutionProgressBar
          completed={2}
          total={5}
          estimatedTimeRemaining={null}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
