/**
 * MemoryUsageBar Component
 * Wave 10.2.2 - Memory Usage Bar & Progress Indicators
 *
 * Displays memory usage as a progress bar with visual states:
 * - Green (<80%): Healthy
 * - Yellow (80-95%): Warning
 * - Red (>95%): Critical
 *
 * Features:
 * - Visual progress bar with percentage-based coloring
 * - Text label showing used/budget in MB
 * - Warning icon for warning/critical states
 * - Tooltip with detailed breakdown
 * - Smooth color transitions
 * - Full accessibility support
 */

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { VectorMemoryStatus } from '@shared/types';

interface MemoryUsageBarProps {
  memoryStatus: VectorMemoryStatus;
}

export const MemoryUsageBar: React.FC<MemoryUsageBarProps> = ({ memoryStatus }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const { usedMB, budgetMB, percentUsed, documentCount, status, availableBytes } = memoryStatus;

  // Clamp percentage to 0-100
  const clampedPercent = Math.min(Math.max(percentUsed, 0), 100);

  // Determine color based on percentage
  const getColorClass = (): string => {
    if (percentUsed < 80) {
      return 'bg-green-500';
    } else if (percentUsed < 95) {
      return 'bg-yellow-500';
    } else {
      return 'bg-red-500';
    }
  };

  // Show warning icon for warning/critical/exceeded states
  const showWarning = status !== 'ok';

  // Convert available bytes to MB for tooltip
  const availableMB = (availableBytes / (1024 * 1024)).toFixed(1);

  const colorClass = getColorClass();
  const ariaValueText = `${usedMB} / ${budgetMB} (${percentUsed.toFixed(0)}%)`;

  return (
    <div className="px-4 py-3 border-b border-vscode-border bg-vscode-panel">
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Label */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-vscode-text">Memory Usage</span>
            {showWarning && (
              <AlertTriangle
                className="w-3.5 h-3.5 text-yellow-400"
                data-testid="warning-icon"
                aria-label="Memory warning"
              />
            )}
          </div>
          <span className="text-xs text-vscode-text-muted">
            {usedMB} / {budgetMB} ({percentUsed.toFixed(0)}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div
            className="h-2 bg-vscode-border rounded-full overflow-hidden"
            role="progressbar"
            aria-label="Memory usage"
            aria-valuenow={clampedPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={ariaValueText}
          >
            <div
              className={`h-full ${colorClass} transition-all duration-300 ease-in-out`}
              style={{ width: `${clampedPercent}%` }}
              data-testid="progress-fill"
            />
          </div>

          {/* Tooltip */}
          {showTooltip && (
            <div
              className="absolute left-0 top-full mt-2 z-50 bg-vscode-bg-secondary border border-vscode-border rounded shadow-lg p-3 text-xs text-vscode-text min-w-[200px]"
              role="tooltip"
            >
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-vscode-text-muted">Used:</span>
                  <span className="font-medium">{usedMB}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vscode-text-muted">Available:</span>
                  <span className="font-medium">{availableMB} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vscode-text-muted">Budget:</span>
                  <span className="font-medium">{budgetMB}</span>
                </div>
                <div className="border-t border-vscode-border pt-1 mt-1">
                  <div className="flex justify-between">
                    <span className="text-vscode-text-muted">Documents:</span>
                    <span className="font-medium">{documentCount} documents</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-vscode-text-muted">Status:</span>
                    <span
                      className={`font-medium capitalize ${
                        status === 'ok'
                          ? 'text-green-400'
                          : status === 'warning'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
