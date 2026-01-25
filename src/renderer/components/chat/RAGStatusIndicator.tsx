/**
 * RAGStatusIndicator Component
 * Wave 10.4.1 - User Story 3: RAG Status Indicator
 *
 * Shows "Searching knowledge base..." during context retrieval.
 * Positioned near message input area for visibility.
 *
 * Features:
 * - Appears during RAG context retrieval
 * - Animated spinner for visual feedback
 * - Accessible to screen readers (live region)
 * - Subtle VS Code theme styling
 * - Auto-hides when retrieval completes
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface RAGStatusIndicatorProps {
  /** Whether RAG context retrieval is in progress */
  isSearching: boolean;
}

export const RAGStatusIndicator: React.FC<RAGStatusIndicatorProps> = ({ isSearching }) => {
  if (!isSearching) {
    return null;
  }

  return (
    <div
      className="rag-status-indicator flex items-center gap-2 px-4 py-2 text-xs text-vscode-text-muted bg-vscode-bg-secondary border-t border-vscode-border"
      role="status"
      aria-live="polite"
      aria-label="RAG search status"
    >
      {/* Animated Spinner */}
      <Loader2
        className="w-3.5 h-3.5 animate-spin text-vscode-accent"
        data-testid="rag-spinner"
      />

      {/* Status Message */}
      <span>Searching knowledge base...</span>
    </div>
  );
};
