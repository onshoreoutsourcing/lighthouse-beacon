/**
 * RAGFailureWarning Component
 * Wave 10.4.2 - User Story 4: Retrieval Failure Messaging
 *
 * Displays a subtle warning when RAG context retrieval failed.
 * Informs users that AI response is not augmented with codebase knowledge.
 *
 * Features:
 * - Non-blocking warning indicator
 * - Dismissible (not persistent)
 * - Optional error details (collapsed by default)
 * - Accessible with screen reader support
 */

import React, { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface RAGFailureWarningProps {
  /** Whether RAG retrieval failed */
  ragFailed?: boolean;
  /** Optional error message for debugging */
  errorMessage?: string;
}

/**
 * RAGFailureWarning Component
 */
export const RAGFailureWarning: React.FC<RAGFailureWarningProps> = ({
  ragFailed,
  errorMessage,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Don't render if not failed or already dismissed
  if (!ragFailed || isDismissed) {
    return null;
  }

  /**
   * Handle dismiss
   */
  const handleDismiss = () => {
    setIsDismissed(true);
  };

  /**
   * Toggle error details
   */
  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <div
      role="alert"
      aria-label="RAG context retrieval failed"
      className="mt-2 flex items-start gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-600 dark:text-yellow-500"
    >
      {/* Warning Icon */}
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-label="Warning" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs">
          <strong>Could not retrieve knowledge base context.</strong>
          {' '}This response is not augmented with codebase knowledge.
        </p>

        {/* Error Details (if provided) */}
        {errorMessage && (
          <div className="mt-2">
            <button
              onClick={handleToggleDetails}
              className="text-xs text-yellow-600 dark:text-yellow-500 hover:underline flex items-center gap-1"
              aria-label={showDetails ? 'Hide details' : 'Show details'}
            >
              {showDetails ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show details
                </>
              )}
            </button>

            {showDetails && (
              <div className="mt-2 text-xs bg-yellow-500/5 border border-yellow-500/10 rounded p-2 font-mono overflow-x-auto">
                {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 hover:bg-yellow-500/20 rounded transition-colors"
        aria-label="Dismiss warning"
        title="Dismiss"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
