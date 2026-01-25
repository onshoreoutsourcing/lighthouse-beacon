/**
 * IndexingProgress Component
 * Wave 10.2.2 - Memory Usage Bar & Progress Indicators
 *
 * Displays progress during file indexing operations:
 * - Current file being indexed
 * - Progress count (X of Y files)
 * - Progress bar with percentage
 * - Estimated time remaining (after 3+ files)
 * - Auto-hide when not indexing
 *
 * Features:
 * - Real-time progress updates
 * - Time estimation based on average processing speed
 * - Accessible ARIA labels and live regions
 * - Smooth transitions
 */

import React from 'react';
import { FileText } from 'lucide-react';

export interface IndexingProgressData {
  current: number;
  total: number;
  currentFile: string;
  startTime: number; // timestamp
}

interface IndexingProgressProps {
  progress: IndexingProgressData | null;
}

/**
 * Format time in seconds to human-readable string
 */
const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

/**
 * Calculate estimated time remaining
 */
const calculateTimeRemaining = (
  current: number,
  total: number,
  startTime: number
): string | null => {
  // Only show estimate after 3+ files processed
  if (current < 3) {
    return null;
  }

  const elapsed = Date.now() - startTime;
  const averageTimePerFile = elapsed / current;
  const remainingFiles = total - current;
  const estimatedMs = averageTimePerFile * remainingFiles;
  const estimatedSeconds = estimatedMs / 1000;

  return formatTime(estimatedSeconds);
};

export const IndexingProgress: React.FC<IndexingProgressProps> = ({ progress }) => {
  // Auto-hide when not indexing
  if (!progress) {
    return null;
  }

  const { current, total, currentFile, startTime } = progress;

  // Calculate percentage (handle division by zero)
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  // Calculate time estimate
  const timeRemaining = calculateTimeRemaining(current, total, startTime);

  // Format progress text
  const fileWord = total === 1 ? 'file' : 'files';
  const progressText = `${current} of ${total} ${fileWord}`;
  const ariaValueText = `${current} of ${total} ${fileWord} (${Math.round(percentage)}%)`;

  return (
    <div className="px-4 py-3 border-b border-vscode-border bg-vscode-panel">
      <div className="space-y-2">
        {/* Header with icon and progress text */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-vscode-accent animate-pulse" />
            <span className="text-xs font-medium text-vscode-text">Indexing Files</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-vscode-text-muted">
            <span>{progressText}</span>
            {timeRemaining && <span className="text-vscode-accent">{timeRemaining} remaining</span>}
          </div>
        </div>

        {/* Current file */}
        <div className="text-xs text-vscode-text-muted truncate" title={currentFile}>
          {currentFile}
        </div>

        {/* Progress bar */}
        <div
          className="h-1.5 bg-vscode-border rounded-full overflow-hidden"
          role="progressbar"
          aria-label="Indexing progress"
          aria-valuenow={Math.round(percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={ariaValueText}
        >
          <div
            className="h-full bg-vscode-accent transition-all duration-300 ease-in-out"
            style={{ width: `${percentage}%` }}
            data-testid="indexing-progress-fill"
          />
        </div>

        {/* Live region for screen readers */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          Indexing {currentFile}: {progressText}
          {timeRemaining && `, ${timeRemaining} remaining`}
        </div>
      </div>
    </div>
  );
};
