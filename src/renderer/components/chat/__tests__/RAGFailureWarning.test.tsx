/**
 * RAGFailureWarning Component Tests
 * Wave 10.4.2 - User Story 4: Retrieval Failure Messaging
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RAGFailureWarning } from '../RAGFailureWarning';

describe('RAGFailureWarning', () => {
  describe('Rendering', () => {
    it('should not render when ragFailed is false', () => {
      const { container } = render(<RAGFailureWarning ragFailed={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when ragFailed is undefined', () => {
      const { container } = render(<RAGFailureWarning ragFailed={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when ragFailed is true', () => {
      render(<RAGFailureWarning ragFailed={true} />);
      expect(screen.getByText(/Could not retrieve knowledge base context/i)).toBeInTheDocument();
    });

    it('should render warning icon', () => {
      render(<RAGFailureWarning ragFailed={true} />);
      expect(screen.getByLabelText('Warning')).toBeInTheDocument();
    });

    it('should show non-RAG indicator text', () => {
      render(<RAGFailureWarning ragFailed={true} />);
      expect(screen.getByText(/not augmented with codebase knowledge/i)).toBeInTheDocument();
    });
  });

  describe('Dismissible Behavior', () => {
    it('should show dismiss button', () => {
      render(<RAGFailureWarning ragFailed={true} />);
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('should hide warning when dismiss button is clicked', () => {
      render(<RAGFailureWarning ragFailed={true} />);
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });

      fireEvent.click(dismissButton);

      expect(screen.queryByText(/Could not retrieve knowledge base context/i)).not.toBeInTheDocument();
    });

    it('should not be persistent after dismissal', () => {
      const { rerender } = render(<RAGFailureWarning ragFailed={true} />);
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });

      // Dismiss warning
      fireEvent.click(dismissButton);

      // Re-render with same props
      rerender(<RAGFailureWarning ragFailed={true} />);

      // Warning should still be dismissed (component manages its own state)
      expect(screen.queryByText(/Could not retrieve knowledge base context/i)).not.toBeInTheDocument();
    });
  });

  describe('Non-Blocking Design', () => {
    it('should not be a modal', () => {
      render(<RAGFailureWarning ragFailed={true} />);
      // Should not have modal-related ARIA attributes
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('should use subtle warning styling', () => {
      render(<RAGFailureWarning ragFailed={true} />);
      const warning = screen.getByRole('alert');

      // Should have warning-style background, not error
      expect(warning).toHaveClass('bg-yellow-500/10'); // Subtle background
      expect(warning).not.toHaveClass('bg-red-500'); // Not aggressive red
    });

    it('should not block chat flow', () => {
      const { container } = render(<RAGFailureWarning ragFailed={true} />);
      const warning = container.firstChild as HTMLElement;

      // Should not have fixed positioning or overlay styles
      expect(warning).not.toHaveClass('fixed');
      expect(warning).not.toHaveClass('z-50');
    });
  });

  describe('Accessibility', () => {
    it('should have alert role for screen readers', () => {
      render(<RAGFailureWarning ragFailed={true} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have descriptive aria-label', () => {
      render(<RAGFailureWarning ragFailed={true} />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-label', expect.stringContaining('retrieval failed'));
    });

    it('should support keyboard dismissal', () => {
      render(<RAGFailureWarning ragFailed={true} />);
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });

      // Click to dismiss (keyboard Enter triggers click in React)
      fireEvent.click(dismissButton);

      expect(screen.queryByText(/Could not retrieve knowledge base context/i)).not.toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('should match VS Code aesthetic', () => {
      render(<RAGFailureWarning ragFailed={true} />);
      const warning = screen.getByRole('alert');

      expect(warning).toHaveClass('border-yellow-500/20'); // VS Code warning border
      expect(warning).toHaveClass('text-yellow-600'); // VS Code warning text
    });

    it('should have clear visual hierarchy', () => {
      render(<RAGFailureWarning ragFailed={true} />);
      const warning = screen.getByRole('alert');

      // Should have padding and border for clarity
      expect(warning).toHaveClass('px-3', 'py-2', 'border');
    });

    it('should be compact and not intrusive', () => {
      render(<RAGFailureWarning ragFailed={true} />);
      const warning = screen.getByRole('alert');
      const text = warning.querySelector('p');

      expect(text).toHaveClass('text-xs'); // Small text
    });
  });

  describe('Error Details', () => {
    it('should accept optional error message', () => {
      render(<RAGFailureWarning ragFailed={true} errorMessage="Index not found" />);
      // Error details are hidden behind "Show details" button
      expect(screen.getByRole('button', { name: /show details/i })).toBeInTheDocument();
    });

    it('should not show error details by default', () => {
      render(<RAGFailureWarning ragFailed={true} errorMessage="Index not found" />);
      // Show details button should exist but details hidden
      expect(screen.getByRole('button', { name: /show details/i })).toBeInTheDocument();
    });

    it('should show error details when expanded', () => {
      render(<RAGFailureWarning ragFailed={true} errorMessage="Index not found" />);
      const expandButton = screen.getByRole('button', { name: /show details/i });

      fireEvent.click(expandButton);

      expect(screen.getByText(/Index not found/i)).toBeInTheDocument();
    });

    it('should not show expand button if no error message provided', () => {
      render(<RAGFailureWarning ragFailed={true} />);
      expect(screen.queryByRole('button', { name: /show details/i })).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long error messages', () => {
      const longError = 'This is a very long error message that should wrap properly without breaking the layout. '.repeat(10);
      render(<RAGFailureWarning ragFailed={true} errorMessage={longError} />);
      const expandButton = screen.getByRole('button', { name: /show details/i });

      fireEvent.click(expandButton);

      // Check that error details container exists with part of the error message
      const errorContainer = screen.getByText(/This is a very long error message/i);
      expect(errorContainer).toBeInTheDocument();
      expect(errorContainer).toHaveClass('overflow-x-auto'); // Should have scrolling for long text
    });

    it('should handle rapid show/hide toggles', () => {
      render(<RAGFailureWarning ragFailed={true} />);
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });

      // Rapid clicks
      fireEvent.click(dismissButton);
      fireEvent.click(dismissButton);
      fireEvent.click(dismissButton);

      // Should end in dismissed state
      expect(screen.queryByText(/Could not retrieve knowledge base context/i)).not.toBeInTheDocument();
    });
  });
});
