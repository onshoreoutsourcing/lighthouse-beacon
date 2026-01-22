/**
 * ExecutionHistoryPanel Component
 *
 * Displays workflow execution history in a sidebar panel.
 *
 * Features:
 * - List view of recent executions
 * - Expandable entry details (inputs, outputs, step results)
 * - Status indicators (success/failed/cancelled)
 * - Filter by workflow
 * - Clear history action
 * - Accessible with ARIA labels
 *
 * Visual Status Colors:
 * - Success: Green border
 * - Failed: Red border
 * - Cancelled: Yellow border
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useExecutionHistoryStore } from '../../stores/executionHistory.store';
import type { ExecutionHistoryEntry } from '../../stores/executionHistory.store';
import {
  CheckCircle2,
  XCircle,
  StopCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Trash2,
} from 'lucide-react';

export interface ExecutionHistoryPanelProps {
  /** Optional workflow ID to filter history */
  workflowId?: string;
  /** Callback when entry is selected */
  onSelectEntry?: (entry: ExecutionHistoryEntry) => void;
}

/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}

/**
 * Format duration in milliseconds to readable format (e.g., "5.0s")
 */
function formatDuration(durationMs: number): string {
  const seconds = durationMs / 1000;
  return `${seconds.toFixed(1)}s`;
}

/**
 * Format JSON data for display
 */
function formatJSON(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Status icon component
 */
interface StatusIconProps {
  status: 'success' | 'failed' | 'cancelled';
  className?: string;
}

const StatusIcon: React.FC<StatusIconProps> = ({ status, className = '' }) => {
  const iconClass = `w-5 h-5 ${className}`;

  switch (status) {
    case 'success':
      return <CheckCircle2 className={`${iconClass} text-green-500`} aria-label="Success" />;
    case 'failed':
      return <XCircle className={`${iconClass} text-red-500`} aria-label="Failed" />;
    case 'cancelled':
      return <StopCircle className={`${iconClass} text-yellow-500`} aria-label="Cancelled" />;
  }
};

/**
 * Execution history entry component
 */
interface HistoryEntryProps {
  entry: ExecutionHistoryEntry;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect?: (entry: ExecutionHistoryEntry) => void;
}

const HistoryEntry: React.FC<HistoryEntryProps> = React.memo(
  ({ entry, isExpanded, onToggle, onSelect }) => {
    const handleClick = useCallback(() => {
      onToggle();
      onSelect?.(entry);
    }, [onToggle, onSelect, entry]);

    // Status border color
    const borderColorClass =
      entry.status === 'success'
        ? 'border-green-500'
        : entry.status === 'failed'
          ? 'border-red-500'
          : 'border-yellow-500';

    return (
      <li className={`border-l-4 ${borderColorClass} bg-vscode-bg`} data-status={entry.status}>
        <button
          type="button"
          onClick={handleClick}
          className="w-full text-left p-3 hover:bg-vscode-hover transition-colors"
          aria-expanded={isExpanded}
          aria-label={`${entry.workflowName} execution - ${entry.status}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <StatusIcon status={entry.status} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-vscode-foreground truncate">
                  {entry.workflowName}
                </div>
                <div className="text-xs text-vscode-descriptionForeground flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(entry.timestamp)}
                  </span>
                  <span role="status" aria-label={`Duration: ${formatDuration(entry.duration)}`}>
                    {formatDuration(entry.duration)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-vscode-descriptionForeground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-vscode-descriptionForeground" />
              )}
            </div>
          </div>
        </button>

        {/* Expanded details */}
        {isExpanded && (
          <div className="px-3 pb-3 space-y-3 text-sm">
            {/* Error message */}
            {entry.error && (
              <div>
                <div className="font-medium text-red-500 mb-1">Error:</div>
                <div className="text-vscode-descriptionForeground bg-vscode-input-bg p-2 rounded font-mono text-xs">
                  {entry.error}
                </div>
              </div>
            )}

            {/* Inputs */}
            <div>
              <div className="font-medium text-vscode-foreground mb-1">Inputs:</div>
              <pre className="text-vscode-descriptionForeground bg-vscode-input-bg p-2 rounded text-xs overflow-x-auto">
                {formatJSON(entry.inputs)}
              </pre>
            </div>

            {/* Outputs */}
            <div>
              <div className="font-medium text-vscode-foreground mb-1">Outputs:</div>
              <pre className="text-vscode-descriptionForeground bg-vscode-input-bg p-2 rounded text-xs overflow-x-auto">
                {formatJSON(entry.outputs)}
              </pre>
            </div>

            {/* Step Results */}
            {entry.stepResults.length > 0 && (
              <div>
                <div className="font-medium text-vscode-foreground mb-1">Step Results:</div>
                <div className="space-y-1">
                  {entry.stepResults.map((step) => (
                    <div
                      key={step.stepId}
                      className="flex items-center justify-between text-xs bg-vscode-input-bg p-2 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <StatusIcon status={step.status} className="w-3 h-3" />
                        <span className="text-vscode-foreground font-mono">{step.stepId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-vscode-descriptionForeground">
                          {formatDuration(step.duration)}
                        </span>
                        {step.error && (
                          <span className="text-red-500 text-xs truncate max-w-[200px]">
                            {step.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </li>
    );
  }
);

HistoryEntry.displayName = 'HistoryEntry';

/**
 * ExecutionHistoryPanel Component
 *
 * Displays execution history with filtering and expandable details.
 */
export const ExecutionHistoryPanel: React.FC<ExecutionHistoryPanelProps> = React.memo(
  ({ workflowId, onSelectEntry }) => {
    const { getHistory, clearHistory } = useExecutionHistoryStore();
    const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

    // Get filtered history
    const history = useMemo(() => getHistory(workflowId), [getHistory, workflowId]);

    // Toggle entry expansion
    const handleToggle = useCallback((entryId: string) => {
      setExpandedEntryId((prev) => (prev === entryId ? null : entryId));
    }, []);

    // Clear history action
    const handleClear = useCallback(() => {
      clearHistory(workflowId);
      setExpandedEntryId(null);
    }, [clearHistory, workflowId]);

    // Empty state
    if (history.length === 0) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-6 text-center"
          role="region"
          aria-label="Execution history panel"
        >
          <div
            className="text-vscode-descriptionForeground"
            role="status"
            aria-label="No execution history available"
          >
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No execution history yet</p>
            <p className="text-xs mt-1">Run a workflow to see execution history here</p>
          </div>
        </div>
      );
    }

    return (
      <div
        className="flex flex-col h-full bg-vscode-sideBar-bg"
        role="region"
        aria-label="Execution history panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-vscode-border">
          <h3 className="text-sm font-medium text-vscode-foreground">Execution History</h3>
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 px-2 py-1 text-xs text-vscode-descriptionForeground hover:text-vscode-foreground hover:bg-vscode-hover rounded transition-colors"
            aria-label="Clear history"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>

        {/* History list */}
        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-vscode-border" aria-label="Execution history list">
            {history.map((entry) => (
              <HistoryEntry
                key={entry.id}
                entry={entry}
                isExpanded={expandedEntryId === entry.id}
                onToggle={() => handleToggle(entry.id)}
                onSelect={onSelectEntry}
              />
            ))}
          </ul>
        </div>
      </div>
    );
  }
);

ExecutionHistoryPanel.displayName = 'ExecutionHistoryPanel';
