/**
 * MemoryUsageBar Component Tests
 * Wave 10.2.2 - Memory Usage Bar & Progress Indicators
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryUsageBar } from '../MemoryUsageBar';
import type { VectorMemoryStatus } from '@shared/types';

describe('MemoryUsageBar', () => {
  const createMockStatus = (
    percentUsed: number,
    status: VectorMemoryStatus['status']
  ): VectorMemoryStatus => ({
    usedBytes: (percentUsed / 100) * 500 * 1024 * 1024,
    budgetBytes: 500 * 1024 * 1024,
    availableBytes: ((100 - percentUsed) / 100) * 500 * 1024 * 1024,
    percentUsed,
    documentCount: 100,
    status,
    usedMB: `${(percentUsed * 5).toFixed(1)} MB`,
    budgetMB: '500.0 MB',
  });

  describe('Visual States', () => {
    it('should render healthy state with green color (<80%)', () => {
      const status = createMockStatus(50, 'ok');
      render(<MemoryUsageBar memoryStatus={status} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');

      // Check for green color class
      const progressFill = screen.getByTestId('progress-fill');
      expect(progressFill).toHaveClass('bg-green-500');
    });

    it('should render warning state with yellow color (80-95%)', () => {
      const status = createMockStatus(85, 'warning');
      render(<MemoryUsageBar memoryStatus={status} />);

      const progressFill = screen.getByTestId('progress-fill');
      expect(progressFill).toHaveClass('bg-yellow-500');
    });

    it('should render critical state with red color (>95%)', () => {
      const status = createMockStatus(97, 'critical');
      render(<MemoryUsageBar memoryStatus={status} />);

      const progressFill = screen.getByTestId('progress-fill');
      expect(progressFill).toHaveClass('bg-red-500');
    });

    it('should render exceeded state with red color', () => {
      const status = createMockStatus(100, 'exceeded');
      render(<MemoryUsageBar memoryStatus={status} />);

      const progressFill = screen.getByTestId('progress-fill');
      expect(progressFill).toHaveClass('bg-red-500');
    });
  });

  describe('Text Display', () => {
    it('should display memory usage in MB format', () => {
      const status = createMockStatus(60, 'ok');
      render(<MemoryUsageBar memoryStatus={status} />);

      expect(screen.getByText(/300\.0 MB \/ 500\.0 MB/)).toBeInTheDocument();
    });

    it('should display percentage used', () => {
      const status = createMockStatus(75, 'ok');
      render(<MemoryUsageBar memoryStatus={status} />);

      expect(screen.getByText(/75%/)).toBeInTheDocument();
    });
  });

  describe('Warning Icon', () => {
    it('should not show warning icon for healthy state', () => {
      const status = createMockStatus(50, 'ok');
      render(<MemoryUsageBar memoryStatus={status} />);

      expect(screen.queryByTestId('warning-icon')).not.toBeInTheDocument();
    });

    it('should show warning icon for warning state', () => {
      const status = createMockStatus(85, 'warning');
      render(<MemoryUsageBar memoryStatus={status} />);

      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    });

    it('should show warning icon for critical state', () => {
      const status = createMockStatus(97, 'critical');
      render(<MemoryUsageBar memoryStatus={status} />);

      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    });

    it('should show warning icon for exceeded state', () => {
      const status = createMockStatus(100, 'exceeded');
      render(<MemoryUsageBar memoryStatus={status} />);

      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
    });
  });

  describe('Tooltip', () => {
    it('should show detailed tooltip on hover', async () => {
      const status = createMockStatus(60, 'ok');
      render(<MemoryUsageBar memoryStatus={status} />);

      const user = userEvent.setup();
      const container = screen.getByRole('progressbar').closest('div');

      if (container) {
        await user.hover(container);

        // Check that tooltip role appears
        expect(await screen.findByRole('tooltip')).toBeInTheDocument();

        // Check individual elements within tooltip
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toHaveTextContent('Used:');
        expect(tooltip).toHaveTextContent('300.0 MB');
        expect(tooltip).toHaveTextContent('Available:');
        expect(tooltip).toHaveTextContent('100 documents');
        expect(tooltip).toHaveTextContent('Status:');
        expect(tooltip).toHaveTextContent('ok');
      }
    });

    it('should show warning status in tooltip', async () => {
      const status = createMockStatus(85, 'warning');
      render(<MemoryUsageBar memoryStatus={status} />);

      const user = userEvent.setup();
      const container = screen.getByRole('progressbar').closest('div');

      if (container) {
        await user.hover(container);

        const tooltip = await screen.findByRole('tooltip');
        expect(tooltip).toHaveTextContent('warning');
      }
    });
  });

  describe('Smooth Transitions', () => {
    it('should have transition classes on progress fill', () => {
      const status = createMockStatus(50, 'ok');
      render(<MemoryUsageBar memoryStatus={status} />);

      const progressFill = screen.getByTestId('progress-fill');
      expect(progressFill).toHaveClass('transition-all');
      expect(progressFill).toHaveClass('duration-300');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const status = createMockStatus(60, 'ok');
      render(<MemoryUsageBar memoryStatus={status} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Memory usage');
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
      expect(progressBar).toHaveAttribute('aria-valuetext', '300.0 MB / 500.0 MB (60%)');
    });

    it('should update aria-valuetext when status changes', () => {
      const status = createMockStatus(85, 'warning');
      render(<MemoryUsageBar memoryStatus={status} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuetext', '425.0 MB / 500.0 MB (85%)');
    });
  });

  describe('Edge Cases', () => {
    it('should handle 0% usage', () => {
      const status = createMockStatus(0, 'ok');
      render(<MemoryUsageBar memoryStatus={status} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle 100% usage', () => {
      const status = createMockStatus(100, 'exceeded');
      render(<MemoryUsageBar memoryStatus={status} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });

    it('should clamp values above 100%', () => {
      const status = createMockStatus(120, 'exceeded');
      render(<MemoryUsageBar memoryStatus={status} />);

      const progressFill = screen.getByTestId('progress-fill');
      // Width should be clamped to 100%
      expect(progressFill).toHaveStyle({ width: '100%' });
    });
  });
});
