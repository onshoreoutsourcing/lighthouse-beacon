/**
 * TemplateDetailModal Component
 *
 * Modal dialog showing full template details with metadata and preview.
 *
 * Features:
 * - Template name and version
 * - Full description from README
 * - Required inputs list
 * - Steps overview
 * - Tags
 * - Complexity badge
 * - Preview image (larger)
 * - "Use This Template" and "Cancel" buttons
 * - ESC key and backdrop click to close
 * - Accessible with ARIA labels and focus trap
 *
 * Usage:
 * <TemplateDetailModal
 *   template={selectedTemplate}
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onUseTemplate={(template) => console.log('Use:', template)}
 * />
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X, Tag, Layers, CheckCircle } from 'lucide-react';
import type { WorkflowTemplate } from '@shared/types/workflow.types';

export interface TemplateDetailModalProps {
  /** Template to display (null if none selected) */
  template: WorkflowTemplate | null;
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when "Use This Template" is clicked */
  onUseTemplate: (template: WorkflowTemplate) => void;
}

/**
 * Get complexity badge color classes
 */
function getComplexityColorClasses(complexity: 'Beginner' | 'Intermediate' | 'Advanced'): string {
  switch (complexity) {
    case 'Beginner':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'Intermediate':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'Advanced':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/**
 * TemplateDetailModal Component
 */
export const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({
  template,
  isOpen,
  onClose,
  onUseTemplate,
}) => {
  const useButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  /**
   * Focus "Use This Template" button when dialog opens
   */
  useEffect(() => {
    if (isOpen && useButtonRef.current) {
      useButtonRef.current.focus();
    }
  }, [isOpen]);

  /**
   * Handle ESC key to close dialog
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }

      // Handle Tab key for focus trap
      if (event.key === 'Tab') {
        const focusableElements = [
          closeButtonRef.current,
          useButtonRef.current,
          cancelButtonRef.current,
        ].filter(Boolean) as HTMLElement[];

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
    [onClose]
  );

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      // Only close if clicking backdrop, not dialog content
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  /**
   * Handle use template button click
   */
  const handleUseTemplate = useCallback(() => {
    if (template) {
      onUseTemplate(template);
    }
  }, [template, onUseTemplate]);

  // Don't render if not open or no template
  if (!isOpen || !template) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-modal-title"
        aria-describedby="template-modal-description"
        className="bg-vscode-editor-bg border border-vscode-panel-border rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-start justify-between p-5 border-b border-vscode-panel-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h2
                id="template-modal-title"
                className="text-xl font-semibold text-vscode-foreground"
              >
                {template.name}
              </h2>
              <span
                className={`flex-shrink-0 px-2 py-1 text-xs font-medium border rounded ${getComplexityColorClasses(template.complexity)}`}
              >
                {template.complexity}
              </span>
            </div>
            <p className="text-sm text-vscode-descriptionForeground">Version {template.version}</p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex-shrink-0 p-1 text-vscode-descriptionForeground hover:text-vscode-foreground hover:bg-vscode-hover rounded transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-5">
            {/* Preview Image */}
            {template.previewImage && (
              <div className="aspect-video bg-vscode-sideBar-bg rounded-lg overflow-hidden border border-vscode-border">
                <img
                  src={template.previewImage}
                  alt={`${template.name} preview`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Full Description */}
            <div id="template-modal-description">
              <h3 className="text-sm font-semibold text-vscode-foreground mb-2">Description</h3>
              <div className="text-sm text-vscode-descriptionForeground whitespace-pre-wrap leading-relaxed">
                {template.fullDescription}
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Required Inputs */}
              <div>
                <h3 className="text-sm font-semibold text-vscode-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Required Inputs
                </h3>
                <ul className="space-y-1">
                  {template.requiredInputs.map((input) => (
                    <li
                      key={input}
                      className="text-sm text-vscode-descriptionForeground flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-vscode-descriptionForeground rounded-full"></span>
                      <code className="px-1.5 py-0.5 bg-vscode-input-bg rounded text-xs font-mono">
                        {input}
                      </code>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Steps Overview */}
              <div>
                <h3 className="text-sm font-semibold text-vscode-foreground mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Workflow Steps
                </h3>
                <p className="text-sm text-vscode-descriptionForeground">
                  This workflow contains <strong>{template.steps} steps</strong> that will be
                  executed sequentially.
                </p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-sm font-semibold text-vscode-foreground mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-vscode-badge-background text-vscode-badge-foreground rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 p-5 border-t border-vscode-panel-border">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-vscode-foreground bg-vscode-button-secondaryBackground hover:bg-vscode-button-secondaryHoverBackground border border-vscode-button-border rounded transition-colors"
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            ref={useButtonRef}
            type="button"
            onClick={handleUseTemplate}
            className="px-4 py-2 text-sm text-vscode-button-foreground bg-vscode-button-bg hover:bg-vscode-button-hoverBg rounded transition-colors font-medium"
            aria-label="Use this template"
          >
            Use This Template
          </button>
        </div>
      </div>
    </div>
  );
};

TemplateDetailModal.displayName = 'TemplateDetailModal';
