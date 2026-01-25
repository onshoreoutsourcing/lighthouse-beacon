/**
 * PythonScriptNode Component
 *
 * Custom React Flow node for Python script execution in workflows.
 * Displays script path, arguments, and execution status.
 *
 * Features:
 * - Connection handles (top: target, bottom: source)
 * - Status-based styling (idle, running, success, error)
 * - Python icon with script path display
 * - Arguments display
 * - Accessible keyboard navigation
 * - Breakpoint indicator (Wave 9.4.6)
 */

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileCode, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import type { PythonNodeData } from '@renderer/stores/workflow.store';
import { BreakpointIndicator } from '../debug';
import { useDebugState } from '@renderer/hooks/useDebugState';

/**
 * Props for PythonScriptNode
 */
interface PythonScriptNodeProps {
  data: PythonNodeData;
  selected?: boolean;
  id: string;
}

/**
 * PythonScriptNode Component
 */
export const PythonScriptNode: React.FC<PythonScriptNodeProps> = ({
  data,
  selected = false,
  id,
}) => {
  const { label, status, scriptPath, args, error } = data;

  // Debug state management (Wave 9.4.6)
  const { debugMode, hasBreakpoint, isBreakpointEnabled, toggleBreakpoint } = useDebugState();

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

  return (
    <div
      className={`bg-vscode-panel border-2 ${getBorderColor()} rounded-lg shadow-lg min-w-[250px] max-w-[350px] relative`}
      role="article"
      aria-label={`Python script node: ${label}`}
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
        <FileCode className="w-5 h-5 text-vscode-accent flex-shrink-0" aria-hidden="true" />
        <span className="text-sm font-semibold text-vscode-text truncate flex-1">{label}</span>
        {renderStatusIcon()}
      </div>

      {/* Node body */}
      <div className="px-4 py-3 space-y-2">
        {/* Script path */}
        <div>
          <div className="text-xs text-vscode-text-muted mb-1">Script</div>
          <div
            className="text-sm text-vscode-text font-mono bg-vscode-bg px-2 py-1 rounded truncate"
            title={scriptPath}
          >
            {scriptPath}
          </div>
        </div>

        {/* Arguments (if any) */}
        {args && args.length > 0 && (
          <div>
            <div className="text-xs text-vscode-text-muted mb-1">Arguments</div>
            <div className="text-xs text-vscode-text font-mono bg-vscode-bg px-2 py-1 rounded">
              {args.join(' ')}
            </div>
          </div>
        )}

        {/* Error message (if any) */}
        {error && status === 'error' && (
          <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded border border-red-400/30">
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
