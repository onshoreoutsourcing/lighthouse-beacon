/**
 * DeleteConfirmationDialog Component Tests
 *
 * Tests for workflow deletion confirmation dialog.
 * Following TDD approach - tests written before implementation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteConfirmationDialog } from '../DeleteConfirmationDialog';

describe('DeleteConfirmationDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when isOpen is true', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should not render dialog when isOpen is false', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={false}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display workflow name in dialog', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="My Important Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/My Important Workflow/i)).toBeInTheDocument();
    });

    it('should display warning message', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
    });

    it('should display confirm button', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /confirm deletion/i })).toBeInTheDocument();
    });

    it('should display cancel button', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /cancel deletion/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel deletion/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when ESC key is pressed', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when clicking outside dialog (backdrop)', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Find backdrop (container with dialog)
      const backdrop = screen.getByRole('dialog').parentElement;

      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
      }
    });

    it('should not trigger actions when dialog is closed', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={false}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // No dialog, no buttons to click
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
      expect(mockOnConfirm).not.toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Focus Management', () => {
    it('should focus cancel button by default when dialog opens', async () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: /cancel deletion/i });
        expect(document.activeElement).toBe(cancelButton);
      });
    });

    it('should have focus trap handler', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel deletion/i });
      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });

      // Both buttons should be focusable
      cancelButton.focus();
      expect(document.activeElement).toBe(cancelButton);

      confirmButton.focus();
      expect(document.activeElement).toBe(confirmButton);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');

      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('should have aria-modal attribute', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');

      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have proper button labels for screen readers', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
      const cancelButton = screen.getByRole('button', { name: /cancel deletion/i });

      expect(confirmButton).toHaveAccessibleName();
      expect(cancelButton).toHaveAccessibleName();
    });

    it('should announce dialog to screen readers when opened', () => {
      const { rerender } = render(
        <DeleteConfirmationDialog
          isOpen={false}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      rerender(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');

      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should apply danger styling to confirm button', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });

      // Should have destructive class
      expect(confirmButton).toHaveClass('destructive');
    });

    it('should apply default styling to cancel button', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel deletion/i });

      // Should NOT have destructive class
      expect(cancelButton).not.toHaveClass('destructive');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should NOT confirm on Enter key (requires explicit click)', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Enter', code: 'Enter' });

      // Should NOT call onConfirm (safety measure)
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should cancel on ESC key', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Test Workflow"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long workflow names', () => {
      const longName = 'A'.repeat(200);

      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName={longName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle special characters in workflow name', () => {
      const specialName = '<script>alert("xss")</script>';

      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName={specialName}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // Should escape HTML - not execute script
      expect(screen.getByText(/script/i)).toBeInTheDocument();
    });

    it('should handle empty workflow name', () => {
      render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName=""
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Multiple Instances', () => {
    it('should handle multiple dialog instances', () => {
      const { rerender } = render(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Workflow 1"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Workflow 1/i)).toBeInTheDocument();

      rerender(
        <DeleteConfirmationDialog
          isOpen={true}
          workflowName="Workflow 2"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Workflow 2/i)).toBeInTheDocument();
    });
  });
});
