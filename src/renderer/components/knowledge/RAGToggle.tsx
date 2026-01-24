/**
 * RAGToggle Component
 * Wave 10.2.3 - File Operations & Zustand Store
 *
 * Toggle switch for enabling/disabling RAG (Retrieval-Augmented Generation) context.
 * Shows document count when enabled and displays tooltip when no documents are indexed.
 *
 * Features:
 * - Toggle switch for RAG on/off
 * - Document count display when enabled
 * - Disabled state when no documents
 * - Tooltip explaining feature
 * - Visual indicator (green when enabled)
 * - Accessibility support
 */

import React from 'react';
import { Database, Info } from 'lucide-react';

export interface RAGToggleProps {
  /** Whether RAG is currently enabled */
  enabled: boolean;
  /** Number of indexed documents */
  documentCount: number;
  /** Callback when toggle state changes */
  onToggle: () => void;
}

export const RAGToggle: React.FC<RAGToggleProps> = ({ enabled, documentCount, onToggle }) => {
  const hasDocuments = documentCount > 0;

  return (
    <div className="border-b border-vscode-border px-4 py-3 bg-vscode-panel">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Toggle and Label */}
        <label className="flex items-center gap-3 cursor-pointer group">
          {/* Custom Checkbox Styled as Toggle Switch */}
          <div className="relative">
            <input
              type="checkbox"
              checked={enabled}
              onChange={onToggle}
              disabled={!hasDocuments}
              className="sr-only peer"
              aria-label="Enable RAG Context"
            />
            <div
              className={`
                w-11 h-6 rounded-full transition-colors
                ${enabled ? 'bg-green-500' : 'bg-vscode-border'}
                ${!hasDocuments ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2 peer-focus:ring-offset-vscode-panel
              `}
            >
              <div
                className={`
                  absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform
                  ${enabled ? 'translate-x-5' : 'translate-x-0'}
                `}
              />
            </div>
          </div>

          {/* Label Text */}
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-vscode-text-muted" />
            <span
              className={`text-sm ${hasDocuments ? 'text-vscode-text' : 'text-vscode-text-muted'}`}
            >
              Enable RAG Context
            </span>

            {/* Document Count Badge */}
            {enabled && (
              <span className="rag-enabled-indicator text-xs text-green-400 font-medium">
                ({documentCount} docs)
              </span>
            )}
          </div>
        </label>

        {/* Right: Info/Tooltip */}
        {!hasDocuments ? (
          <div className="flex items-center gap-2 text-xs text-vscode-text-muted">
            <Info className="w-3.5 h-3.5" />
            <span>Add documents to enable RAG</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-vscode-text-muted">
            <Info className="w-3.5 h-3.5" />
            <span>Use indexed documents in AI responses</span>
          </div>
        )}
      </div>
    </div>
  );
};
