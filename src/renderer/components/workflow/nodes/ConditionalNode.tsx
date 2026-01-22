/**
 * ConditionalNode Component
 *
 * Custom React Flow node for conditional branching in workflows.
 * Displays condition expression and branches for true/false outcomes.
 *
 * Features:
 * - Diamond shape (distinct from rectangular nodes)
 * - Connection handles (top: target, bottom-left: false, bottom-right: true)
 * - Status-based styling (idle, evaluating, true-taken, false-taken, error)
 * - Condition expression display
 * - True edge (green) and False edge (red) visual indicators
 * - Accessible keyboard navigation
 *
 * Part of Wave 9.4.1: Conditional Branching
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch, AlertCircle, CheckCircle, Loader, XCircle } from 'lucide-react';
import type { BaseNodeData } from '@renderer/stores/workflow.store';

/**
 * Conditional node execution status
 */
export type ConditionalStatus = 'idle' | 'evaluating' | 'true-taken' | 'false-taken' | 'error';

/**
 * Conditional node data
 */
export interface ConditionalNodeData extends BaseNodeData {
  /** Condition expression to evaluate */
  condition: string;
  /** Conditional execution status */
  conditionalStatus?: ConditionalStatus;
  /** Which branch was taken (true or false) */
  branchTaken?: boolean;
}

/**
 * Props for ConditionalNode
 */
interface ConditionalNodeProps {
  data: ConditionalNodeData;
  selected?: boolean;
}

/**
 * ConditionalNode Component
 */
export const ConditionalNode: React.FC<ConditionalNodeProps> = ({ data, selected = false }) => {
  const { label, status, condition, conditionalStatus = 'idle', branchTaken, error } = data;

  // Status icon rendering
  const renderStatusIcon = () => {
    switch (conditionalStatus) {
      case 'evaluating':
        return <Loader className="w-4 h-4 text-blue-400 animate-spin" aria-label="Evaluating" />;
      case 'true-taken':
        return <CheckCircle className="w-4 h-4 text-green-400" aria-label="True branch taken" />;
      case 'false-taken':
        return <XCircle className="w-4 h-4 text-orange-400" aria-label="False branch taken" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" aria-label="Error" />;
      default:
        return null;
    }
  };

  // Border color based on status
  const getBorderColor = () => {
    if (selected) return 'border-vscode-accent';

    switch (conditionalStatus) {
      case 'evaluating':
        return 'border-blue-400';
      case 'true-taken':
        return 'border-green-400';
      case 'false-taken':
        return 'border-orange-400';
      case 'error':
        return 'border-red-400';
      default:
        return status === 'error' ? 'border-red-400' : 'border-vscode-border';
    }
  };

  // Background color for diamond
  const getBackgroundColor = () => {
    switch (conditionalStatus) {
      case 'evaluating':
        return 'bg-blue-900/20';
      case 'true-taken':
        return 'bg-green-900/20';
      case 'false-taken':
        return 'bg-orange-900/20';
      case 'error':
        return 'bg-red-900/20';
      default:
        return 'bg-vscode-panel';
    }
  };

  return (
    <div
      className="relative"
      role="article"
      aria-label={`Conditional node: ${label}`}
      style={{ width: '280px', height: '280px' }}
    >
      {/* Target handle (top center) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-vscode-accent !w-3 !h-3 !border-2 !border-vscode-bg"
        aria-label="Input connection"
        style={{ top: '20px', left: '50%', transform: 'translateX(-50%)' }}
      />

      {/* Diamond shape container */}
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: '200px',
          height: '200px',
          transform: 'translate(-50%, -50%) rotate(45deg)',
        }}
      >
        <div
          className={`w-full h-full border-2 ${getBorderColor()} ${getBackgroundColor()} shadow-lg`}
          style={{
            borderRadius: '8px',
          }}
        />
      </div>

      {/* Content (not rotated) */}
      <div
        className="absolute top-1/2 left-1/2 flex flex-col items-center justify-center text-center p-4"
        style={{
          width: '180px',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="w-5 h-5 text-vscode-accent flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold text-vscode-text truncate">{label}</span>
          {renderStatusIcon()}
        </div>

        {/* Condition expression */}
        <div className="mb-2">
          <div className="text-xs text-vscode-text-muted mb-1">Condition</div>
          <div
            className="text-xs text-vscode-text font-mono bg-vscode-bg px-2 py-1 rounded max-h-16 overflow-y-auto break-words"
            title={condition}
          >
            {condition || 'No condition set'}
          </div>
        </div>

        {/* Branch indicator */}
        {branchTaken !== undefined && conditionalStatus !== 'evaluating' && (
          <div className="text-xs">
            <span className={branchTaken ? 'text-green-400' : 'text-orange-400'}>
              → {branchTaken ? 'True' : 'False'} branch
            </span>
          </div>
        )}

        {/* Error message (if any) */}
        {error && (
          <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-400/30 mt-2 max-h-12 overflow-y-auto">
            {error}
          </div>
        )}
      </div>

      {/* False handle (bottom-left) - Red */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!bg-red-500 !w-3 !h-3 !border-2 !border-vscode-bg"
        aria-label="False branch connection"
        style={{
          bottom: '20px',
          left: '35%',
          transform: 'translateX(-50%)',
        }}
      />

      {/* False label */}
      <div
        className="absolute text-xs text-red-400 font-semibold pointer-events-none"
        style={{
          bottom: '0px',
          left: '35%',
          transform: 'translateX(-50%)',
        }}
      >
        False
      </div>

      {/* True handle (bottom-right) - Green */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="!bg-green-500 !w-3 !h-3 !border-2 !border-vscode-bg"
        aria-label="True branch connection"
        style={{
          bottom: '20px',
          right: '35%',
          transform: 'translateX(50%)',
        }}
      />

      {/* True label */}
      <div
        className="absolute text-xs text-green-400 font-semibold pointer-events-none"
        style={{
          bottom: '0px',
          right: '35%',
          transform: 'translateX(50%)',
        }}
      >
        True
      </div>
    </div>
  );
};
