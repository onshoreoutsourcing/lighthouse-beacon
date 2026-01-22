/**
 * VariableInspector Component
 * Wave 9.4.6: Step-by-Step Debugging
 *
 * Tree view for inspecting and editing workflow variables during debugging.
 * Displays workflow inputs, step outputs, and environment variables.
 * Allows editing values when execution is paused.
 *
 * Features:
 * - Hierarchical tree view with expandable nodes
 * - Edit variable values inline
 * - Syntax highlighting for different value types
 * - Secret value redaction (e.g., API keys)
 * - Copy to clipboard functionality
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Edit2, Copy, Check } from 'lucide-react';
import type { DebugContext } from '@shared/types';

/**
 * Props for VariableInspector
 */
interface VariableInspectorProps {
  /** Current debug context (null if not paused) */
  context: DebugContext | null;
  /** Whether execution is paused (allows editing) */
  isPaused: boolean;
  /** Callback when variable value is changed */
  onVariableChange: (path: string, value: unknown) => void;
}

/**
 * Variable node in the tree
 */
interface VariableNode {
  key: string;
  path: string;
  value: unknown;
  type: 'primitive' | 'object' | 'array';
  children?: VariableNode[];
}

/**
 * VariableInspector Component
 */
export const VariableInspector: React.FC<VariableInspectorProps> = ({
  context,
  isPaused,
  onVariableChange,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Build variable tree from context
  const buildVariableTree = (): VariableNode[] => {
    if (!context) return [];

    const nodes: VariableNode[] = [];
    const vars = context.variables;

    // Workflow inputs
    const workflowInputs = vars.workflowInputs as Record<string, unknown> | undefined;
    if (workflowInputs && Object.keys(workflowInputs).length > 0) {
      nodes.push({
        key: 'workflow.inputs',
        path: 'workflow.inputs',
        value: workflowInputs,
        type: 'object',
        children: Object.entries(workflowInputs).map(([key, value]) => ({
          key: `workflow.inputs.${key}`,
          path: `workflow.inputs.${key}`,
          value,
          type: typeof value === 'object' && value !== null ? 'object' : 'primitive',
        })),
      });
    }

    // Step outputs
    const stepOutputs = vars.stepOutputs as Record<string, Record<string, unknown>> | undefined;
    if (stepOutputs && Object.keys(stepOutputs).length > 0) {
      const stepNodes: VariableNode[] = [];

      Object.entries(stepOutputs).forEach(([stepId, outputs]) => {
        if (outputs && typeof outputs === 'object') {
          const outputsRecord = outputs as Record<string, unknown>;
          stepNodes.push({
            key: `steps.${stepId}.outputs`,
            path: `steps.${stepId}.outputs`,
            value: outputsRecord,
            type: 'object',
            children: Object.entries(outputsRecord).map(([key, value]) => ({
              key: `steps.${stepId}.outputs.${key}`,
              path: `steps.${stepId}.outputs.${key}`,
              value,
              type: typeof value === 'object' && value !== null ? 'object' : 'primitive',
            })),
          });
        }
      });

      if (stepNodes.length > 0) {
        nodes.push({
          key: 'steps',
          path: 'steps',
          value: stepOutputs,
          type: 'object',
          children: stepNodes,
        });
      }
    }

    // Environment variables
    const env = vars.env as Record<string, unknown> | undefined;
    if (env && Object.keys(env).length > 0) {
      nodes.push({
        key: 'env',
        path: 'env',
        value: env,
        type: 'object',
        children: Object.entries(env).map(([key, value]) => ({
          key: `env.${key}`,
          path: `env.${key}`,
          value,
          type: 'primitive',
        })),
      });
    }

    return nodes;
  };

  // Toggle node expansion
  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  // Start editing a value
  const startEdit = (path: string, value: unknown) => {
    setEditingPath(path);
    setEditValue(String(value));
  };

  // Save edited value
  const saveEdit = () => {
    if (editingPath) {
      try {
        // Try to parse as JSON first for objects/arrays
        const parsedValue = JSON.parse(editValue);
        onVariableChange(editingPath, parsedValue);
      } catch {
        // If not JSON, treat as string
        onVariableChange(editingPath, editValue);
      }
      setEditingPath(null);
      setEditValue('');
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingPath(null);
    setEditValue('');
  };

  // Copy value to clipboard
  const copyValue = (path: string, value: unknown) => {
    try {
      const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      void window.navigator.clipboard.writeText(text);
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Format value for display
  const formatValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') {
      // Redact potential secrets
      if (value.includes('key') || value.includes('token') || value.includes('secret')) {
        return `"${value.substring(0, 4)}***"`;
      }
      return `"${value}"`;
    }
    if (typeof value === 'object') {
      return Array.isArray(value) ? `Array(${value.length})` : 'Object';
    }
    return String(value);
  };

  // Get value type color
  const getValueColor = (value: unknown): string => {
    if (value === null || value === undefined) return 'text-gray-400';
    if (typeof value === 'string') return 'text-green-400';
    if (typeof value === 'number') return 'text-blue-400';
    if (typeof value === 'boolean') return 'text-purple-400';
    return 'text-yellow-400';
  };

  // Render variable node
  const renderNode = (node: VariableNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.path);
    const hasChildren = node.children && node.children.length > 0;
    const isEditing = editingPath === node.path;
    const isCopied = copiedPath === node.path;

    return (
      <div key={node.key} style={{ marginLeft: `${depth * 16}px` }} className="py-1">
        <div className="flex items-center gap-2 group hover:bg-vscode-bg/50 px-2 py-1 rounded">
          {/* Expand/collapse button */}
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.path)}
              className="p-0.5 hover:bg-vscode-border rounded focus:outline-none focus:ring-1 focus:ring-vscode-accent"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-vscode-text-muted" aria-hidden="true" />
              ) : (
                <ChevronRight className="w-3 h-3 text-vscode-text-muted" aria-hidden="true" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* Key name */}
          <span className="text-xs font-mono text-vscode-text">
            {node.key.split('.').pop()}:
          </span>

          {/* Value */}
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              onBlur={saveEdit}
              autoFocus
              className="flex-1 text-xs font-mono bg-vscode-bg border border-vscode-accent rounded px-1 py-0.5 text-vscode-text focus:outline-none"
            />
          ) : (
            <span className={`text-xs font-mono ${getValueColor(node.value)}`}>
              {formatValue(node.value)}
            </span>
          )}

          {/* Actions */}
          {!hasChildren && !isEditing && (
            <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Edit button (only when paused) */}
              {isPaused && (
                <button
                  onClick={() => startEdit(node.path, node.value)}
                  className="p-1 hover:bg-vscode-border rounded focus:outline-none focus:ring-1 focus:ring-vscode-accent"
                  aria-label="Edit value"
                  title="Edit value"
                >
                  <Edit2 className="w-3 h-3 text-vscode-text-muted" aria-hidden="true" />
                </button>
              )}

              {/* Copy button */}
              <button
                onClick={() => {
                  copyValue(node.path, node.value);
                }}
                className="p-1 hover:bg-vscode-border rounded focus:outline-none focus:ring-1 focus:ring-vscode-accent"
                aria-label="Copy value"
                title="Copy value"
              >
                {isCopied ? (
                  <Check className="w-3 h-3 text-green-400" aria-hidden="true" />
                ) : (
                  <Copy className="w-3 h-3 text-vscode-text-muted" aria-hidden="true" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && node.children?.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  const variableTree = buildVariableTree();

  return (
    <div className="bg-vscode-panel border border-vscode-border rounded-lg shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-vscode-border">
        <h3 className="text-sm font-semibold text-vscode-text">Variables</h3>
        {!context && (
          <p className="text-xs text-vscode-text-muted mt-1">
            No debug context available. Execution must be paused to inspect variables.
          </p>
        )}
      </div>

      {/* Variable tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {variableTree.length > 0 ? (
          <div className="space-y-1">
            {variableTree.map((node) => renderNode(node))}
          </div>
        ) : (
          context && (
            <p className="text-xs text-vscode-text-muted p-2">No variables available</p>
          )
        )}
      </div>

      {/* Footer */}
      {context && (
        <div className="px-4 py-2 border-t border-vscode-border text-xs text-vscode-text-muted">
          {isPaused ? (
            <span className="text-yellow-400">Paused - Variables can be edited</span>
          ) : (
            <span>Read-only - Pause execution to edit variables</span>
          )}
        </div>
      )}
    </div>
  );
};
