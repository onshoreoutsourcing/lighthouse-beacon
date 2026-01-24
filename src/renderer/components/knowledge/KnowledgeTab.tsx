/**
 * KnowledgeTab Component
 * Wave 10.2.1 - Knowledge Tab & Document List
 * Wave 10.2.2 - Memory Usage Bar & Progress Indicators
 *
 * Main knowledge base view showing:
 * - Header with title and document count
 * - Memory usage bar (Wave 10.2.2)
 * - Indexing progress indicator (Wave 10.2.2)
 * - Refresh button
 * - Loading/error states
 * - Document list
 * - Remove confirmation dialog
 */

import React, { useEffect, useState } from 'react';
import { Database, RefreshCw, X, AlertCircle } from 'lucide-react';
import { useKnowledgeStore } from '@renderer/stores/knowledge.store';
import { DocumentList } from './DocumentList';
import { MemoryUsageBar } from './MemoryUsageBar';
import { IndexingProgress } from './IndexingProgress';

export const KnowledgeTab: React.FC = () => {
  const {
    documents,
    isLoading,
    error,
    memoryStatus,
    indexingProgress,
    fetchDocuments,
    removeDocument,
    refreshMemoryStatus,
    clearError,
  } = useKnowledgeStore();

  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch documents and memory status on mount
  useEffect(() => {
    void fetchDocuments();
    void refreshMemoryStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Auto-refresh memory status during indexing (polling with throttle)
  useEffect(() => {
    if (!indexingProgress) {
      return;
    }

    // Poll every 2 seconds during indexing
    const intervalId = window.setInterval(() => {
      void refreshMemoryStatus();
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexingProgress]); // Only depend on indexingProgress state

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchDocuments(), refreshMemoryStatus()]);
    setIsRefreshing(false);
  };

  const handleRemoveClick = (id: string) => {
    setConfirmRemoveId(id);
  };

  const handleConfirmRemove = async () => {
    if (confirmRemoveId) {
      await removeDocument(confirmRemoveId);
      setConfirmRemoveId(null);
      // Refresh memory status after document removal
      await refreshMemoryStatus();
    }
  };

  const handleCancelRemove = () => {
    setConfirmRemoveId(null);
  };

  const documentToRemove = documents.find((doc) => doc.id === confirmRemoveId);

  return (
    <div className="flex flex-col h-full bg-vscode-panel">
      {/* Header */}
      <header className="border-b border-vscode-border px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-vscode-text" />
            <h2 className="text-sm font-semibold text-vscode-text">Knowledge Base</h2>
            {documents.length > 0 && (
              <span className="text-xs text-vscode-text-muted">
                {documents.length} {documents.length === 1 ? 'document' : 'documents'}
              </span>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => void handleRefresh()}
            disabled={isLoading || isRefreshing}
            className="p-1.5 rounded hover:bg-vscode-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh documents"
            title="Refresh"
          >
            <RefreshCw
              className={`w-4 h-4 text-vscode-text-muted ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </header>

      {/* Memory Usage Bar */}
      {memoryStatus && <MemoryUsageBar memoryStatus={memoryStatus} />}

      {/* Indexing Progress */}
      {indexingProgress && <IndexingProgress progress={indexingProgress} />}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
          <button
            onClick={clearError}
            className="p-1 rounded hover:bg-red-500/20 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-vscode-text-muted">
          <RefreshCw className="w-8 h-8 mb-2 animate-spin" />
          <p className="text-sm">Loading documents...</p>
        </div>
      ) : (
        /* Document List */
        <div className="flex-1 overflow-hidden">
          <DocumentList documents={documents} onRemove={handleRemoveClick} />
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      {confirmRemoveId && documentToRemove && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={handleCancelRemove}
        >
          <div
            className="bg-vscode-panel border border-vscode-border rounded-lg shadow-2xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="remove-dialog-title"
            aria-describedby="remove-dialog-description"
          >
            <div className="p-4">
              <h3 id="remove-dialog-title" className="text-lg font-semibold text-vscode-text mb-2">
                Remove Document?
              </h3>
              <p id="remove-dialog-description" className="text-sm text-vscode-text-muted mb-4">
                Are you sure you want to remove <strong>{documentToRemove.relativePath}</strong>{' '}
                from the knowledge base? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelRemove}
                  className="px-4 py-2 rounded bg-vscode-hover hover:bg-vscode-border/30 text-vscode-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleConfirmRemove()}
                  className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
