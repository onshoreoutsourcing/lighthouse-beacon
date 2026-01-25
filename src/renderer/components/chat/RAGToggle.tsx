/**
 * RAGToggle Component (Chat Toolbar)
 * Wave 10.4.1 - User Story 1: RAG Toggle in Chat Interface
 *
 * Compact toggle button for enabling/disabling RAG in chat.
 * Different from Knowledge Tab toggle - this is a compact toolbar button.
 *
 * Features:
 * - Compact button design for toolbar
 * - Document count badge when enabled
 * - Disabled state when no documents
 * - Tooltip explaining feature/status
 * - Visual indicator (green when enabled)
 * - Keyboard accessible
 */

import React from 'react';
import { Database } from 'lucide-react';

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

  const getTooltip = (): string => {
    if (!hasDocuments) {
      return 'Add documents to Knowledge Base to enable RAG context';
    }
    if (enabled) {
      return `RAG enabled - Using ${documentCount} indexed documents for context`;
    }
    return `Enable RAG to use knowledge base (${documentCount} documents available)`;
  };

  return (
    <button
      onClick={onToggle}
      disabled={!hasDocuments}
      title={getTooltip()}
      aria-label="Toggle RAG context"
      aria-pressed={enabled}
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all
        ${enabled ? 'bg-green-500 text-white' : 'bg-vscode-bg-secondary text-vscode-text-muted'}
        ${!hasDocuments ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-vscode-bg
      `}
    >
      {/* Database Icon */}
      <Database className="w-3.5 h-3.5" />

      {/* Label */}
      <span className="font-medium">RAG</span>

      {/* Document Count Badge (only when enabled) */}
      {enabled && (
        <span className="text-xs opacity-90">
          ({documentCount} docs)
        </span>
      )}
    </button>
  );
};
