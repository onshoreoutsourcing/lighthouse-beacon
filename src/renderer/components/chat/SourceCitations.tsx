/**
 * SourceCitations Component
 * Wave 10.4.2 - User Story 1: Source Citations Display
 *
 * Displays collapsible list of source citations below AI responses.
 * Shows which files informed the AI's response with relevance scores.
 *
 * Features:
 * - Collapsible by default
 * - Source count in header
 * - Sources ordered by relevance (highest first)
 * - Keyboard accessible
 * - Click to expand/collapse
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { SourceCitationItem } from './SourceCitationItem';
import type { SourceAttribution } from '@shared/types';

export interface SourceCitationsProps {
  /** Array of source attributions */
  sources?: SourceAttribution[];
}

/**
 * SourceCitations Component
 */
export const SourceCitations: React.FC<SourceCitationsProps> = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no sources
  if (!sources || sources.length === 0) {
    return null;
  }

  // Sort sources by relevance (highest first)
  const sortedSources = [...sources].sort((a, b) => b.score - a.score);

  const sourceCount = sources.length;
  const sourceText = sourceCount === 1 ? 'source' : 'sources';

  /**
   * Toggle expanded state
   */
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <div data-testid="source-citations-container" className="mt-3 border border-vscode-border rounded bg-vscode-bg-secondary">
      {/* Header - Collapsible Toggle */}
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-vscode-bg-tertiary transition-colors"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${sourceCount} ${sourceText}`}
      >
        {/* Icon */}
        <BookOpen className="w-4 h-4 text-vscode-accent flex-shrink-0" />

        {/* Title */}
        <span className="text-xs text-vscode-text-muted flex-1 text-left">
          {sourceCount} {sourceText}
        </span>

        {/* Chevron */}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-vscode-text-muted flex-shrink-0" aria-label="Collapse sources" />
        ) : (
          <ChevronDown className="w-4 h-4 text-vscode-text-muted flex-shrink-0" aria-label="Expand sources" />
        )}
      </button>

      {/* Citation List */}
      {isExpanded && (
        <div role="list" className="border-t border-vscode-border">
          {sortedSources.map((source, index) => (
            <div
              key={`${source.filePath}-${source.startLine}-${index}`}
              role="listitem"
              className={index < sortedSources.length - 1 ? 'border-b border-vscode-border' : ''}
            >
              <SourceCitationItem source={source} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
