/**
 * DocumentItem Component
 * Wave 10.2.1 - Knowledge Tab & Document List
 *
 * Displays a single indexed document with:
 * - Relative file path
 * - File size (human-readable)
 * - Timestamp (relative, e.g., "2 hours ago")
 * - Status badge (indexed/processing/error)
 * - Remove button on hover
 * - Keyboard accessible
 */

import React, { useState } from 'react';
import { CheckCircle2, Loader2, XCircle, Trash2 } from 'lucide-react';
import type { IndexedDocument } from '@renderer/stores/knowledge.store';
import { formatRelativeTime, formatFileSize } from '@renderer/utils/dateFormat';

interface DocumentItemProps {
  document: IndexedDocument;
  onRemove: (id: string) => void;
}

export const DocumentItem: React.FC<DocumentItemProps> = ({ document, onRemove }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showErrorTooltip, setShowErrorTooltip] = useState(false);

  const handleRemove = () => {
    onRemove(document.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      handleRemove();
    }
  };

  const getStatusIcon = () => {
    switch (document.status) {
      case 'indexed':
        return (
          <div role="status" aria-label="Status: indexed">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />
          </div>
        );
      case 'processing':
        return (
          <div role="status" aria-label="Status: processing">
            <Loader2
              className="w-4 h-4 text-yellow-500 animate-spin flex-shrink-0"
              aria-hidden="true"
            />
          </div>
        );
      case 'error':
        return (
          <div
            className="relative"
            role="status"
            aria-label="Status: error"
            onMouseEnter={() => setShowErrorTooltip(true)}
            onMouseLeave={() => setShowErrorTooltip(false)}
          >
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" aria-hidden="true" />
            {showErrorTooltip && document.errorMessage && (
              <div className="absolute left-6 top-0 z-10 bg-vscode-panel border border-vscode-border rounded px-2 py-1 text-xs text-vscode-text whitespace-nowrap shadow-lg">
                {document.errorMessage}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <li
      className="px-4 py-2 hover:bg-vscode-hover transition-colors duration-100 cursor-pointer focus:outline-none focus:bg-vscode-hover"
      role="listitem"
      tabIndex={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      aria-label={`Document: ${document.relativePath}`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Status Icon + File Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Status Icon */}
          {getStatusIcon()}

          {/* File Info */}
          <div className="min-w-0 flex-1">
            {/* Relative Path */}
            <div
              className="text-sm text-vscode-text truncate"
              title={document.filePath}
              aria-label={`File path: ${document.relativePath}`}
            >
              {document.relativePath}
            </div>

            {/* Size + Timestamp */}
            <div className="flex items-center gap-2 text-xs text-vscode-text-muted mt-0.5">
              <span aria-label={`File size: ${formatFileSize(document.size)}`}>
                {formatFileSize(document.size)}
              </span>
              <span className="text-vscode-border">•</span>
              <span aria-label={`Indexed: ${formatRelativeTime(document.timestamp)}`}>
                {formatRelativeTime(document.timestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Remove Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className={`
            p-1.5 rounded hover:bg-red-500/20 transition-opacity duration-150
            ${isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'}
          `}
          aria-label={`Remove document: ${document.relativePath}`}
          title="Remove document"
        >
          <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
        </button>
      </div>
    </li>
  );
};
