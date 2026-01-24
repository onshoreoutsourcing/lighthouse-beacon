/**
 * IndexingProgress Component Tests
 * Wave 10.2.2 - Memory Usage Bar & Progress Indicators
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { IndexingProgress, type IndexingProgressData } from '../IndexingProgress';

describe('IndexingProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const createMockProgress = (
    current: number,
    total: number,
    currentFile: string,
    startTime: number
  ): IndexingProgressData => ({
    current,
    total,
    currentFile,
    startTime,
  });

  describe('Visibility', () => {
    it('should not render when progress is null', () => {
      const { container } = render(<IndexingProgress progress={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when progress is provided', () => {
      const progress = createMockProgress(1, 5, 'file1.txt', Date.now());
      render(<IndexingProgress progress={progress} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    it('should display current file being indexed', () => {
      const progress = createMockProgress(3, 10, 'src/components/App.tsx', Date.now());
      render(<IndexingProgress progress={progress} />);

      const matches = screen.getAllByText(/src\/components\/App\.tsx/);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should display progress count (X of Y)', () => {
      const progress = createMockProgress(3, 10, 'file.txt', Date.now());
      render(<IndexingProgress progress={progress} />);

      expect(screen.getByText('3 of 10 files')).toBeInTheDocument();
    });

    it('should display singular "file" when total is 1', () => {
      const progress = createMockProgress(1, 1, 'file.txt', Date.now());
      render(<IndexingProgress progress={progress} />);

      expect(screen.getByText('1 of 1 file')).toBeInTheDocument();
    });

    it('should display percentage completion', () => {
      const progress = createMockProgress(5, 10, 'file.txt', Date.now());
      render(<IndexingProgress progress={progress} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });
  });

  describe('Progress Bar', () => {
    it('should show correct width for progress', () => {
      const progress = createMockProgress(7, 10, 'file.txt', Date.now());
      render(<IndexingProgress progress={progress} />);

      const progressFill = screen.getByTestId('indexing-progress-fill');
      expect(progressFill).toHaveStyle({ width: '70%' });
    });

    it('should handle 0% progress', () => {
      const progress = createMockProgress(0, 10, 'file.txt', Date.now());
      render(<IndexingProgress progress={progress} />);

      const progressFill = screen.getByTestId('indexing-progress-fill');
      expect(progressFill).toHaveStyle({ width: '0%' });
    });

    it('should handle 100% progress', () => {
      const progress = createMockProgress(10, 10, 'file.txt', Date.now());
      render(<IndexingProgress progress={progress} />);

      const progressFill = screen.getByTestId('indexing-progress-fill');
      expect(progressFill).toHaveStyle({ width: '100%' });
    });
  });

  describe('Time Estimation', () => {
    it('should not show time estimate for first 3 files', () => {
      const progress = createMockProgress(1, 10, 'file.txt', Date.now());
      render(<IndexingProgress progress={progress} />);

      // The element with "remaining" text should not exist
      const progressText = screen.getByText('1 of 10 files');
      const parent = progressText.parentElement;
      expect(parent).not.toHaveTextContent(/remaining/);
    });

    it('should show time estimate after 3 files', () => {
      const startTime = Date.now() - 6000; // 6 seconds ago
      const progress = createMockProgress(3, 10, 'file.txt', startTime);

      render(<IndexingProgress progress={progress} />);

      // After 3 files in 6 seconds, avg = 2s/file
      // 7 files remaining = 14 seconds
      const matches = screen.getAllByText(/14s remaining/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should calculate time correctly', () => {
      const startTime = Date.now() - 10000; // 10 seconds ago
      const progress = createMockProgress(5, 20, 'file.txt', startTime);

      render(<IndexingProgress progress={progress} />);

      // After 5 files in 10 seconds, avg = 2s/file
      // 15 files remaining = 30 seconds
      const matches = screen.getAllByText(/30s remaining/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should format time in minutes when over 60 seconds', () => {
      const startTime = Date.now() - 60000; // 60 seconds ago
      const progress = createMockProgress(3, 10, 'file.txt', startTime);

      render(<IndexingProgress progress={progress} />);

      // After 3 files in 60 seconds, avg = 20s/file
      // 7 files remaining = 140 seconds = 2 minutes 20 seconds
      const matches = screen.getAllByText(/2m \d+s remaining/i);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should handle very fast processing', () => {
      const startTime = Date.now() - 100; // 0.1 seconds ago
      const progress = createMockProgress(5, 10, 'file.txt', startTime);

      render(<IndexingProgress progress={progress} />);

      // After 5 files in 0.1 seconds, avg = 0.02s/file
      // 5 files remaining = 0.1 seconds = rounds to 0s
      const matches = screen.getAllByText(/\ds remaining/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const progress = createMockProgress(5, 10, 'file.txt', Date.now());
      render(<IndexingProgress progress={progress} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label', 'Indexing progress');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have aria-valuetext with descriptive text', () => {
      const progress = createMockProgress(3, 10, 'file.txt', Date.now());
      render(<IndexingProgress progress={progress} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuetext', '3 of 10 files (30%)');
    });

    it('should announce progress with live region', () => {
      const progress = createMockProgress(5, 10, 'file.txt', Date.now());
      render(<IndexingProgress progress={progress} />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Edge Cases', () => {
    it('should handle division by zero when total is 0', () => {
      const progress = createMockProgress(0, 0, 'file.txt', Date.now());
      render(<IndexingProgress progress={progress} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle current > total', () => {
      const progress = createMockProgress(12, 10, 'file.txt', Date.now());
      render(<IndexingProgress progress={progress} />);

      const progressFill = screen.getByTestId('indexing-progress-fill');
      // Should clamp to 100%
      expect(progressFill).toHaveStyle({ width: '100%' });
    });

    it('should handle long file paths', () => {
      const longPath = 'src/components/very/deep/nested/folder/structure/with/many/levels/file.tsx';
      const progress = createMockProgress(1, 5, longPath, Date.now());
      render(<IndexingProgress progress={progress} />);

      expect(screen.getByText(longPath)).toBeInTheDocument();
    });

    it('should handle special characters in file names', () => {
      const specialName = 'file (copy) [2024-01-24] @test.txt';
      const progress = createMockProgress(1, 5, specialName, Date.now());
      render(<IndexingProgress progress={progress} />);

      expect(screen.getByText(specialName)).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should have smooth transition on progress bar', () => {
      const progress = createMockProgress(5, 10, 'file.txt', Date.now());
      render(<IndexingProgress progress={progress} />);

      const progressFill = screen.getByTestId('indexing-progress-fill');
      expect(progressFill).toHaveClass('transition-all');
      expect(progressFill).toHaveClass('duration-300');
    });

    it('should use primary color for progress bar', () => {
      const progress = createMockProgress(5, 10, 'file.txt', Date.now());
      render(<IndexingProgress progress={progress} />);

      const progressFill = screen.getByTestId('indexing-progress-fill');
      expect(progressFill).toHaveClass('bg-vscode-accent');
    });
  });
});
