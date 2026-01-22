/**
 * OutputNode Component
 *
 * Custom React Flow node for workflow output results.
 * Displays output format and status.
 *
 * Features:
 * - Target handle only (top) - workflow endpoint
 * - Status-based styling (idle, running, success, error)
 * - Output icon with format display
 * - Accessible keyboard navigation
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import type { OutputNodeData } from '@renderer/stores/workflow.store';

/**
 * Props for OutputNode
 */
interface OutputNodeProps {
  data: OutputNodeData;
  selected?: boolean;
}

/**
 * OutputNode Component
 */
export const OutputNode: React.FC<OutputNodeProps> = ({ data, selected = false }) => {
  const { label, status, format, error } = data;

  // Status icon rendering
  const renderStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Loader className="w-4 h-4 text-blue-400 animate-spin" aria-label="Running" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" aria-label="Success" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" aria-label="Error" />;
      default:
        return null;
    }
  };

  // Status border color
  const getBorderColor = () => {
    if (selected) return 'border-vscode-accent';
    switch (status) {
      case 'running':
        return 'border-blue-400';
      case 'success':
        return 'border-green-400';
      case 'error':
        return 'border-red-400';
      default:
        return 'border-vscode-border';
    }
  };

  // Format display text
  const getFormatDisplay = () => {
    switch (format) {
      case 'text':
        return 'Text';
      case 'json':
        return 'JSON';
      case 'file':
        return 'File';
      default:
        return format;
    }
  };

  return (
    <div
      className={`bg-vscode-panel border-2 ${getBorderColor()} rounded-lg shadow-lg min-w-[200px] max-w-[300px]`}
      role="article"
      aria-label={`Output node: ${label}`}
    >
      {/* Target handle (top) - no source handle for output nodes */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-vscode-accent !w-3 !h-3 !border-2 !border-vscode-bg"
        aria-label="Input connection"
      />

      {/* Node header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-vscode-border bg-vscode-bg">
        <Upload className="w-5 h-5 text-vscode-warning flex-shrink-0" aria-hidden="true" />
        <span className="text-sm font-semibold text-vscode-text truncate flex-1">{label}</span>
        {renderStatusIcon()}
      </div>

      {/* Node body */}
      <div className="px-4 py-3 space-y-2">
        {/* Output format */}
        <div>
          <div className="text-xs text-vscode-text-muted mb-1">Format</div>
          <div className="text-sm text-vscode-text font-mono bg-vscode-bg px-2 py-1 rounded">
            {getFormatDisplay()}
          </div>
        </div>

        {/* Error message (if any) */}
        {error && status === 'error' && (
          <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-400/30">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
