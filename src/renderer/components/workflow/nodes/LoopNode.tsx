/**
 * LoopNode Component
 *
 * Custom React Flow node for loop iteration in workflows.
 * Displays iteration source (items) and loop progress.
 *
 * Features:
 * - Rounded rectangle shape with loop icon
 * - Connection handles (top: target, bottom: source for loop steps)
 * - Status-based styling (idle, running, completed, error)
 * - Iteration source display (array, object, range)
 * - Max iterations safety limit display
 * - Loop progress tracking (current iteration / total)
 * - Accessible keyboard navigation
 * - Breakpoint indicator (Wave 9.4.6)
 *
 * Part of Wave 9.4.2: Loop Nodes
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Repeat, AlertCircle, CheckCircle, Loader, PlayCircle } from 'lucide-react';
import type { BaseNodeData } from '@renderer/stores/workflow.store';
import { BreakpointIndicator } from '../debug';
import { useDebugState } from '@renderer/hooks/useDebugState';

/**
 * Loop node execution status
 */
export type LoopStatus = 'idle' | 'running' | 'completed' | 'error';

/**
 * Loop node data
 */
export interface LoopNodeData extends BaseNodeData {
  /** Items to iterate over (array, object, or range expression) */
  items: string | unknown[];
  /** Maximum iterations allowed (default: 100) */
  maxIterations?: number;
  /** Step IDs to execute for each iteration */
  loopSteps?: string[];
  /** Current iteration number (0-based, for progress tracking) */
  currentIteration?: number;
  /** Total number of iterations */
  totalIterations?: number;
  /** Loop execution status */
  loopStatus?: LoopStatus;
}

/**
 * Props for LoopNode
 */
interface LoopNodeProps {
  data: LoopNodeData;
  selected?: boolean;
  id: string;
}

/**
 * LoopNode Component
 */
export const LoopNode: React.FC<LoopNodeProps> = ({ data, selected = false, id }) => {
  const {
    label,
    status,
    items,
    maxIterations = 100,
    loopSteps = [],
    currentIteration,
    totalIterations,
    loopStatus = 'idle',
    error,
  } = data;

  // Debug state management (Wave 9.4.6)
  const { debugMode, hasBreakpoint, isBreakpointEnabled, toggleBreakpoint } = useDebugState();

  // Status icon rendering
  const renderStatusIcon = () => {
    switch (loopStatus) {
      case 'running':
        return <Loader className="w-4 h-4 text-blue-400 animate-spin" aria-label="Running" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" aria-label="Completed" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" aria-label="Error" />;
      default:
        return <PlayCircle className="w-4 h-4 text-gray-400" aria-label="Idle" />;
    }
  };

  // Status border color
  const getBorderColor = () => {
    if (selected) return 'border-vscode-accent';

    switch (loopStatus) {
      case 'running':
        return 'border-blue-400';
      case 'completed':
        return 'border-green-400';
      case 'error':
        return 'border-red-400';
      default:
        return status === 'error' ? 'border-red-400' : 'border-vscode-border';
    }
  };

  // Background color for running animation
  const getBackgroundColor = () => {
    switch (loopStatus) {
      case 'running':
        return 'bg-blue-900/10';
      case 'completed':
        return 'bg-green-900/10';
      case 'error':
        return 'bg-red-900/10';
      default:
        return 'bg-vscode-panel';
    }
  };

  // Format items display
  const getItemsDisplay = () => {
    if (typeof items === 'string') {
      // Variable reference or range expression
      return items;
    }
    if (Array.isArray(items)) {
      return `Array (${items.length} items)`;
    }
    if (typeof items === 'object' && items !== null) {
      return `Object (${Object.keys(items).length} keys)`;
    }
    return 'Unknown';
  };

  // Progress display
  const renderProgress = () => {
    if (
      loopStatus === 'running' &&
      currentIteration !== undefined &&
      totalIterations !== undefined
    ) {
      const progress = Math.round(((currentIteration + 1) / totalIterations) * 100);
      return (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-vscode-text-muted mb-1">
            <span>Progress</span>
            <span>
              {currentIteration + 1} / {totalIterations}
            </span>
          </div>
          <div className="w-full bg-vscode-bg rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Loop progress: ${progress}%`}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`${getBackgroundColor()} border-2 ${getBorderColor()} rounded-lg shadow-lg min-w-[240px] max-w-[320px] relative`}
      role="article"
      aria-label={`Loop node: ${label}`}
    >
      {/* Breakpoint Indicator - Wave 9.4.6 */}
      <BreakpointIndicator
        nodeId={id}
        hasBreakpoint={hasBreakpoint(id)}
        enabled={isBreakpointEnabled(id)}
        onToggle={(nodeId) => {
          void toggleBreakpoint(nodeId);
        }}
        debugMode={debugMode === 'ON'}
      />

      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-vscode-accent !w-3 !h-3 !border-2 !border-vscode-bg"
        aria-label="Input connection"
      />

      {/* Node header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-vscode-border bg-vscode-bg">
        <Repeat className="w-5 h-5 text-purple-400 flex-shrink-0" aria-hidden="true" />
        <span className="text-sm font-semibold text-vscode-text truncate flex-1">{label}</span>
        {renderStatusIcon()}
      </div>

      {/* Node body */}
      <div className="px-4 py-3 space-y-3">
        {/* Iteration source */}
        <div>
          <div className="text-xs text-vscode-text-muted mb-1">Items</div>
          <div
            className="text-xs text-vscode-text font-mono bg-vscode-bg px-2 py-1 rounded max-h-20 overflow-y-auto break-words"
            title={typeof items === 'string' ? items : JSON.stringify(items)}
          >
            {getItemsDisplay()}
          </div>
        </div>

        {/* Loop steps */}
        {loopSteps.length > 0 && (
          <div>
            <div className="text-xs text-vscode-text-muted mb-1">Loop Steps</div>
            <div className="text-xs text-vscode-text bg-vscode-bg px-2 py-1 rounded">
              {loopSteps.length === 1 ? '1 step' : `${loopSteps.length} steps`}
            </div>
          </div>
        )}

        {/* Max iterations */}
        <div>
          <div className="text-xs text-vscode-text-muted mb-1">Max Iterations</div>
          <div className="text-xs text-vscode-text bg-vscode-bg px-2 py-1 rounded font-mono">
            {maxIterations}
          </div>
        </div>

        {/* Progress indicator */}
        {renderProgress()}

        {/* Error message (if any) */}
        {error && loopStatus === 'error' && (
          <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-400/30 max-h-16 overflow-y-auto">
            {error}
          </div>
        )}
      </div>

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-vscode-accent !w-3 !h-3 !border-2 !border-vscode-bg"
        aria-label="Output connection"
      />
    </div>
  );
};
