/**
 * PromptEditorDialog Component
 * Wave 9.5.4: Prompt Template Editor
 *
 * Modal dialog for editing Claude prompt templates with Monaco editor.
 * Integrates with PromptEditor component for rich editing experience.
 */

import React, { useState } from 'react';
import { X, Save, Bot } from 'lucide-react';
import { PromptEditor } from './PromptEditor';
import type { Workflow, ClaudeStep } from '@shared/types';

/**
 * Props for PromptEditorDialog
 */
interface PromptEditorDialogProps {
  /** Claude workflow step being edited */
  step: ClaudeStep;
  /** Workflow context for variable autocomplete */
  workflow?: Workflow;
  /** Available step outputs from previous execution */
  availableOutputs?: Record<string, Record<string, unknown>>;
  /** Callback when prompt is saved */
  onSave: (prompt: string) => void;
  /** Callback when dialog is closed */
  onClose: () => void;
}

/**
 * PromptEditorDialog Component
 *
 * Modal dialog that provides a rich editing experience for Claude prompts.
 */
export const PromptEditorDialog: React.FC<PromptEditorDialogProps> = ({
  step,
  workflow,
  availableOutputs,
  onSave,
  onClose,
}) => {
  const [prompt, setPrompt] = useState(step.prompt_template);

  /**
   * Handle save
   */
  const handleSave = () => {
    onSave(prompt);
    onClose();
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+S / Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    // Escape to close
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-vscode-panel border border-vscode-border rounded-lg shadow-2xl w-full max-w-5xl h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-vscode-border bg-vscode-bg">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-vscode-success" />
            <div>
              <h2 className="text-lg font-semibold text-vscode-text">
                Edit Prompt: {step.label || step.id}
              </h2>
              <p className="text-sm text-vscode-text-muted">
                Model: {step.model || 'claude-sonnet-4'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-vscode-hover rounded transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-vscode-text-muted" />
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <PromptEditor
            value={prompt}
            onChange={setPrompt}
            workflow={workflow}
            availableOutputs={availableOutputs}
            height="100%"
          />
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-vscode-border bg-vscode-bg flex items-center justify-between">
          <div className="text-xs text-vscode-text-muted">
            Tip: Use Ctrl+S (Cmd+S) to save, Esc to cancel
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-sm text-vscode-text hover:bg-vscode-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-vscode-accent text-white rounded text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Prompt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
