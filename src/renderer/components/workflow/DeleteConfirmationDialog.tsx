/**
 * DeleteConfirmationDialog Component
 *
 * Modal dialog for confirming workflow deletion with safety measures.
 *
 * Features:
 * - Shows workflow name being deleted
 * - Warning message: "This action cannot be undone"
 * - Cancel button (default focus, ESC key support)
 * - Confirm button (requires explicit click, danger styling)
 * - Keyboard accessible with ARIA labels
 * - Focus trap within dialog
 * - Backdrop click closes dialog
 *
 * Safety Measures:
 * - No Enter key confirmation (requires explicit click)
 * - Cancel button is default focus
 * - ESC key closes dialog
 * - Danger styling on confirm button
 *
 * Usage:
 * <DeleteConfirmationDialog
 *   isOpen={true}
 *   workflowName="My Workflow"
 *   onConfirm={() => console.log('Confirmed')}
 *   onCancel={() => console.log('Cancelled')}
 * />
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface DeleteConfirmationDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Workflow name being deleted */
  workflowName: string;
  /** Callback when deletion is confirmed */
  onConfirm: () => void;
  /** Callback when deletion is cancelled */
  onCancel: () => void;
}

/**
 * DeleteConfirmationDialog Component
 *
 * Modal dialog for confirming destructive workflow deletion action.
 */
export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  workflowName,
  onConfirm,
  onCancel,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  /**
   * Focus cancel button when dialog opens
   */
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  /**
   * Handle ESC key to close dialog
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }

      // Handle Tab key for focus trap
      if (event.key === 'Tab') {
        const focusableElements = [cancelButtonRef.current, confirmButtonRef.current].filter(
          Boolean
        ) as HTMLElement[];

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift+Tab: move backwards
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: move forwards
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    },
    [onCancel]
  );

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      // Only close if clicking backdrop, not dialog content
      if (event.target === event.currentTarget) {
        onCancel();
      }
    },
    [onCancel]
  );

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        className="bg-vscode-editor-bg border border-vscode-panel-border rounded-lg shadow-2xl max-w-md w-full mx-4"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-vscode-panel-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 id="delete-dialog-title" className="text-base font-semibold text-vscode-foreground">
              Delete Workflow
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-vscode-descriptionForeground hover:text-vscode-foreground hover:bg-vscode-hover rounded transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div id="delete-dialog-description" className="space-y-3">
            <p className="text-sm text-vscode-foreground">
              Are you sure you want to delete <strong>&quot;{workflowName}&quot;</strong>?
            </p>
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-vscode-foreground">
                <strong>This action cannot be undone.</strong> The workflow file will be permanently
                deleted from your system.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-vscode-panel-border">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-vscode-foreground bg-vscode-button-secondaryBackground hover:bg-vscode-button-secondaryHoverBackground border border-vscode-button-border rounded transition-colors"
            aria-label="Cancel deletion"
          >
            Cancel
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded transition-colors destructive"
            aria-label="Confirm deletion"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

DeleteConfirmationDialog.displayName = 'DeleteConfirmationDialog';
