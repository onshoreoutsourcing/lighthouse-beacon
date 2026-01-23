/**
 * ExecutionProgressBar Component
 *
 * Displays workflow execution progress with step count and time estimation.
 *
 * Features:
 * - Shows "X of Y steps completed"
 * - Displays estimated time remaining (formatted: Xh Ym Zs)
 * - Visual progress bar with percentage fill
 * - Accessible (ARIA labels, semantic HTML)
 * - Responsive design
 *
 * Usage:
 * <ExecutionProgressBar completed={2} total={5} estimatedTimeRemaining={5000} />
 */

import React from 'react';

export interface ExecutionProgressBarProps {
  /** Number of completed steps */
  completed: number;
  /** Total number of steps */
  total: number;
  /** Estimated time remaining in milliseconds (null if unknown) */
  estimatedTimeRemaining: number | null;
  /** Optional custom class name */
  className?: string;
}

/**
 * Format time in milliseconds to human-readable format
 * Examples:
 * - 5000ms -> "5s"
 * - 90000ms -> "1m 30s"
 * - 3665000ms -> "1h 1m"
 */
function formatTimeRemaining(ms: number): string {
  if (ms <= 0) {
    return '';
  }

  const seconds = Math.ceil(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  // Only show seconds if no hours
  if (hours === 0 && secs > 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(' ');
}

/**
 * ExecutionProgressBar component
 */
export const ExecutionProgressBar: React.FC<ExecutionProgressBarProps> = ({
  completed,
  total,
  estimatedTimeRemaining,
  className = '',
}) => {
  // Calculate progress percentage (avoid division by zero)
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  // Format time remaining
  const timeText =
    estimatedTimeRemaining && estimatedTimeRemaining > 0
      ? formatTimeRemaining(estimatedTimeRemaining)
      : null;

  // Build ARIA label
  const ariaLabel = timeText
    ? `Workflow progress: ${completed} of ${total} steps completed, approximately ${timeText} remaining`
    : `Workflow progress: ${completed} of ${total} steps completed`;

  return (
    <div className={`execution-progress-bar ${className}`.trim()}>
      {/* Progress text and time estimation */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-vscode-fg font-medium">
          {completed} of {total} steps completed
        </span>
        {timeText && <span className="text-xs text-vscode-secondary">~{timeText} remaining</span>}
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-2 bg-vscode-input-bg border border-vscode-border rounded-sm overflow-hidden">
        <div
          role="progressbar"
          aria-label={ariaLabel}
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={total}
          className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
