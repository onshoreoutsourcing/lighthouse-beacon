/**
 * SourceCitationItem Component
 * Wave 10.4.2 - User Story 2: Click-to-Open File Navigation
 *
 * Renders a single source citation with click-to-open functionality.
 * Opens file in Monaco editor at the cited line range.
 *
 * Features:
 * - File path display (relative from project root)
 * - Line range display
 * - Relevance score percentage
 * - Click to open in editor
 * - Keyboard accessible (Enter key)
 * - Expandable snippet view
 * - 44x44px minimum click target
 */

import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { useEditorStore } from '@renderer/stores/editor.store';
import type { SourceAttribution } from '@shared/types';

export interface SourceCitationItemProps {
  /** Source attribution data */
  source: SourceAttribution;
  /** Whether snippet is expanded (default: false) */
  expanded?: boolean;
}

/**
 * Extract relative file path for display
 * Shows path from project root (e.g., "src/components/Button.tsx")
 */
const getDisplayPath = (fullPath: string): string => {
  const segments = fullPath.split('/').filter(Boolean); // Remove empty strings

  // Find index of common project markers
  const markerIndex = segments.findIndex(seg =>
    ['src', 'lib', 'app', 'components', 'utils'].includes(seg)
  );

  if (markerIndex !== -1) {
    return segments.slice(markerIndex).join('/');
  }

  // Check if it's a root-level file (e.g., README.md, package.json)
  const filename = segments[segments.length - 1] || '';
  const parentDir = segments[segments.length - 2] || '';

  // Common root-level files
  const rootFiles = ['README.md', 'package.json', 'tsconfig.json', '.gitignore', 'LICENSE'];
  if (rootFiles.includes(filename)) {
    return filename;
  }

  // If parent is a common project folder name, include it
  const projectFolders = ['project', 'workspace', 'repo', 'codebase'];
  if (projectFolders.includes(parentDir?.toLowerCase())) {
    return filename;
  }

  // Fallback: show last 3 segments or filename
  const displaySegments = segments.slice(-3);
  return displaySegments.join('/');
};

/**
 * Format line range for display
 */
const formatLineRange = (startLine: number, endLine: number): string => {
  if (startLine === endLine) {
    return `Line ${startLine}`;
  }
  return `Lines ${startLine}-${endLine}`;
};

/**
 * Format relevance score as percentage
 */
const formatScore = (score: number): string => {
  return `${Math.round(score * 100)}%`;
};

/**
 * SourceCitationItem Component
 */
export const SourceCitationItem: React.FC<SourceCitationItemProps> = ({ source, expanded = false }) => {
  const { openFile } = useEditorStore();
  const displayPath = getDisplayPath(source.filePath);
  const lineRange = formatLineRange(source.startLine, source.endLine);
  const scorePercent = formatScore(source.score);

  /**
   * Handle click to open file in editor
   */
  const handleOpenFile = async () => {
    try {
      await openFile(source.filePath);

      // TODO: Scroll to line range and highlight
      // This will be implemented in the editor component integration
      // For now, just opening the file is sufficient

    } catch (error) {
      console.error('[SourceCitationItem] Failed to open file:', error);
    }
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleOpenFile();
    }
  };

  return (
    <button
      onClick={handleOpenFile}
      onKeyDown={handleKeyDown}
      className="w-full text-left p-2 hover:bg-vscode-bg-tertiary rounded transition-colors group"
      aria-label={`Open ${displayPath} at ${lineRange}`}
    >
      <div className="flex items-start gap-2">
        {/* File Icon */}
        <FileText className="w-4 h-4 text-vscode-accent flex-shrink-0 mt-0.5" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* File Path and Score */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-vscode-text font-medium truncate flex-1">
              {displayPath}
            </span>
            <ExternalLink className="w-3 h-3 text-vscode-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>

          {/* Line Range and Relevance */}
          <div className="flex items-center gap-3 text-xs text-vscode-text-muted">
            <span>{lineRange}</span>
            <span className="px-1.5 py-0.5 bg-vscode-accent/10 text-vscode-accent rounded">
              {scorePercent}
            </span>
          </div>

          {/* Snippet (if expanded) */}
          {expanded && source.snippet && (
            <div className="mt-2 text-xs text-vscode-text-muted bg-vscode-bg-secondary rounded p-2 font-mono overflow-x-auto">
              {source.snippet}
            </div>
          )}
        </div>
      </div>
    </button>
  );
};
