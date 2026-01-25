/**
 * WorkflowCanvas Component
 *
 * React Flow canvas for visual workflow design and execution.
 * Integrates with useWorkflowStore for state management.
 *
 * Features:
 * - Drag-and-drop workflow node creation
 * - Visual node connections
 * - Minimap for navigation
 * - Zoom and pan controls
 * - Background grid
 * - Performance optimized (<100ms render for 50 nodes)
 * - Keyboard navigation
 * - Auto-sync with Zustand store
 * - Step-by-step debugging (Wave 9.4.6)
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type NodeTypes,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '@renderer/stores/workflow.store';
import type {
  WorkflowNodeData,
  PythonNodeData,
  ClaudeNodeData,
} from '@renderer/stores/workflow.store';
import { PythonScriptNode, ClaudeAPINode, InputNode, OutputNode, ConditionalNode } from './nodes';
import { VariableInspector } from './debug';
import { useDebugState } from '@renderer/hooks/useDebugState';
import { NodeContextMenu, createNodeContextMenuOptions } from './NodeContextMenu';
import { TestNodeDialog } from './TestNodeDialog';
import { PromptEditorDialog } from './PromptEditorDialog';
import type { WorkflowStep, PythonStep, ClaudeStep, StepType } from '@shared/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * WorkflowCanvas Props
 */
interface WorkflowCanvasProps {
  /** Optional class name for custom styling */
  className?: string;
}

/**
 * Node type mapping for React Flow
 * React Flow expects components that match the NodeProps interface
 */
const nodeTypes: NodeTypes = {
  python: PythonScriptNode,
  claude: ClaudeAPINode,
  input: InputNode,
  output: OutputNode,
  conditional: ConditionalNode,
} as NodeTypes;

/**
 * WorkflowCanvas Component
 */
export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ className = '' }) => {
  // Get workflow state from Zustand store
  const { nodes, edges, addEdge, addNode, updateNodePosition, updateNode } = useWorkflowStore();

  // Debug state management (Wave 9.4.6)
  // Getting debug state for Variable Inspector visibility and state
  const { debugMode, debugState, currentContext, setVariable } = useDebugState();

  // Variable inspector panel visibility
  const [showVariableInspector, setShowVariableInspector] = useState(false);

  // Context menu state (Wave 9.5.3 User Story 3)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(
    null
  );

  // Node testing dialog state (Wave 9.5.3 User Story 3)
  const [testingNode, setTestingNode] = useState<WorkflowStep | null>(null);

  // Prompt editor dialog state (Wave 9.5.4)
  const [editingPromptNode, setEditingPromptNode] = useState<{
    nodeId: string;
    step: ClaudeStep;
  } | null>(null);

  /**
   * Handle node position changes
   * Updates Zustand store with new positions
   */
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Update positions in store for moved nodes
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && !change.dragging) {
          updateNodePosition(change.id, change.position);
        }
      });

      // Note: React Flow handles the visual updates automatically
      // We only need to persist position changes to the store
    },
    [updateNodePosition]
  );

  /**
   * Handle edge changes (selection, removal)
   */
  const onEdgesChange = useCallback((_changes: EdgeChange[]) => {
    // Note: React Flow handles edge updates automatically
    // Store updates happen through onConnect for new edges
    // and user actions (delete key) trigger removeEdge
  }, []);

  /**
   * Handle new connections
   * Adds edge to Zustand store
   */
  const onConnect = useCallback(
    (connection: Connection) => {
      addEdge(connection);
    },
    [addEdge]
  );

  /**
   * Convert workflow node to WorkflowStep for testing
   * Wave 9.5.3 User Story 3
   */
  const convertNodeToStep = useCallback((node: Node<WorkflowNodeData>): WorkflowStep => {
    const baseStep = {
      id: node.id,
      label: node.data.label,
      depends_on: [],
      inputs: {},
      outputs: [],
    };

    switch (node.type) {
      case 'python': {
        const pythonData = node.data as PythonNodeData;
        return {
          ...baseStep,
          type: 'python' as StepType,
          script: pythonData.scriptPath || '',
          args: pythonData.args,
        } as PythonStep;
      }

      case 'claude': {
        const claudeData = node.data as ClaudeNodeData;
        return {
          ...baseStep,
          type: 'claude' as StepType,
          model: claudeData.model || 'claude-sonnet-4',
          prompt_template: claudeData.prompt || '',
          temperature: claudeData.temperature,
          max_tokens: claudeData.maxTokens,
        } as ClaudeStep;
      }

      case 'input':
        return {
          ...baseStep,
          type: 'input' as StepType,
          prompt: 'Enter input',
          input_type: 'string',
        } as WorkflowStep;

      case 'output':
        return {
          ...baseStep,
          type: 'output' as StepType,
          message: 'Output result',
          format: 'text',
        } as WorkflowStep;

      case 'conditional':
        return {
          ...baseStep,
          type: 'conditional' as StepType,
          condition: '',
          then_steps: [],
          else_steps: [],
        } as WorkflowStep;

      default:
        return {
          ...baseStep,
          type: 'python' as StepType,
          script: '',
        } as WorkflowStep;
    }
  }, []);

  /**
   * Handle node context menu (right-click)
   * Wave 9.5.3 User Story 3
   */
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node<WorkflowNodeData>) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    });
  }, []);

  /**
   * Handle test node action from context menu
   * Wave 9.5.3 User Story 3
   */
  const handleTestNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        const step = convertNodeToStep(node);
        setTestingNode(step);
      }
      setContextMenu(null);
    },
    [nodes, convertNodeToStep]
  );

  /**
   * Handle edit prompt action from context menu
   * Wave 9.5.4
   */
  const handleEditPrompt = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node && node.type === 'claude') {
        const step = convertNodeToStep(node) as ClaudeStep;
        setEditingPromptNode({ nodeId, step });
      }
      setContextMenu(null);
    },
    [nodes, convertNodeToStep]
  );

  /**
   * Handle save prompt from editor
   * Wave 9.5.4
   */
  const handleSavePrompt = useCallback(
    (prompt: string) => {
      if (!editingPromptNode) return;

      const { nodeId } = editingPromptNode;
      const node = nodes.find((n) => n.id === nodeId);

      if (node && node.type === 'claude') {
        // Update node data with new prompt
        updateNode(nodeId, { prompt });
      }

      setEditingPromptNode(null);
    },
    [editingPromptNode, nodes, updateNode]
  );

  /**
   * Variable change handler for VariableInspector
   */
  const handleVariableChange = useCallback(
    (path: string, value: unknown) => {
      void setVariable(path, value);
    },
    [setVariable]
  );

  /**
   * Add test nodes for manual testing
   * Wave 9.5.4: Temporary helper for testing Prompt Editor
   */
  const handleAddTestNodes = useCallback(() => {
    // Add a Claude node for testing prompt editor
    addNode({
      id: 'claude-1',
      type: 'claude',
      position: { x: 250, y: 100 },
      data: {
        label: 'Code Review Claude',
        status: 'idle',
        model: 'claude-sonnet-4',
        prompt: 'Review the following code for best practices and security issues.',
      },
    });

    // Add a Python node
    addNode({
      id: 'python-1',
      type: 'python',
      position: { x: 250, y: 250 },
      data: {
        label: 'Analyze Code',
        status: 'idle',
        scriptPath: 'analyze.py',
        args: [],
      },
    });

    // Add an input node
    addNode({
      id: 'input-1',
      type: 'input',
      position: { x: 50, y: 150 },
      data: {
        label: 'Repo Path',
        status: 'idle',
        paramName: 'repo_path',
        defaultValue: '/path/to/repo',
      },
    });
  }, [addNode]);

  /**
   * Minimap node color based on node type
   */
  const minimapNodeColor = useCallback((node: { type?: string }) => {
    switch (node.type) {
      case 'input':
        return '#dcdcaa'; // vscode-warning
      case 'output':
        return '#dcdcaa'; // vscode-warning
      case 'python':
        return '#007acc'; // vscode-accent
      case 'claude':
        return '#4ec9b0'; // vscode-success
      default:
        return '#858585'; // vscode-text-muted
    }
  }, []);

  /**
   * Memoize React Flow props for performance
   */
  const reactFlowProps = useMemo(
    () => ({
      nodes,
      edges,
      nodeTypes,
      onNodesChange,
      onEdgesChange,
      onConnect,
      onNodeContextMenu,
      fitView: true,
      minZoom: 0.1,
      maxZoom: 2,
      defaultEdgeOptions: {
        type: 'smoothstep',
        animated: false,
      },
      snapToGrid: true,
      snapGrid: [15, 15] as [number, number],
    }),
    [nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeContextMenu]
  );

  return (
    <div
      className={`workflow-canvas ${className} flex flex-col bg-vscode-bg`}
      style={{ width: '100%', height: '100%', backgroundColor: '#1e1e1e' }}
      role="region"
      aria-label="Workflow canvas"
    >
      {/* Toolbar - Wave 9.4.6 */}
      <div
        className="p-4 border-b border-vscode-border bg-vscode-panel flex items-center gap-4"
        style={{
          backgroundColor: '#252526',
          borderBottom: '1px solid #454545',
          color: '#cccccc',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-vscode-text font-semibold" style={{ color: '#ffffff' }}>
            Workflow Canvas
          </span>
          <span className="text-vscode-text-muted text-sm" style={{ color: '#cccccc' }}>
            ({nodes.length} nodes)
          </span>
        </div>
        {/* Temporary: Add test nodes button for manual testing */}
        {nodes.length === 0 && (
          <button
            onClick={handleAddTestNodes}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors font-medium"
            title="Add test nodes to canvas"
          >
            Add Test Nodes
          </button>
        )}
      </div>

      {/* Canvas and Variable Inspector Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* React Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow {...reactFlowProps}>
            {/* Background grid */}
            <Background color="#3e3e42" gap={16} size={1} />

            {/* Zoom and pan controls */}
            <Controls
              showZoom
              showFitView
              showInteractive={false}
              position="bottom-right"
              className="react-flow-controls bg-vscode-panel border border-vscode-border rounded"
            />

            {/* Minimap for navigation */}
            <MiniMap
              nodeColor={minimapNodeColor}
              nodeBorderRadius={8}
              position="bottom-left"
              className="react-flow-minimap bg-vscode-panel border border-vscode-border rounded"
              style={{
                backgroundColor: '#252526',
                border: '1px solid #3e3e42',
              }}
            />
          </ReactFlow>

          {/* Variable Inspector Toggle Button */}
          {debugMode === 'ON' && (
            <button
              onClick={() => setShowVariableInspector(!showVariableInspector)}
              className="absolute top-4 right-4 p-2 bg-vscode-panel border border-vscode-border rounded hover:bg-vscode-bg transition-colors focus:outline-none focus:ring-2 focus:ring-vscode-accent"
              aria-label={
                showVariableInspector ? 'Hide variable inspector' : 'Show variable inspector'
              }
              title={showVariableInspector ? 'Hide Variables' : 'Show Variables'}
            >
              {showVariableInspector ? (
                <ChevronRight className="w-5 h-5 text-vscode-text" aria-hidden="true" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-vscode-text" aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        {/* Variable Inspector Panel - Wave 9.4.6 */}
        {debugMode === 'ON' && showVariableInspector && (
          <div
            className="w-96 border-l border-vscode-border bg-vscode-bg overflow-hidden"
            role="complementary"
            aria-label="Variable inspector panel"
          >
            <VariableInspector
              context={currentContext}
              isPaused={debugState === 'PAUSED'}
              onVariableChange={handleVariableChange}
            />
          </div>
        )}
      </div>

      {/* Node Context Menu - Wave 9.5.3 User Story 3 + Wave 9.5.4 */}
      {contextMenu &&
        (() => {
          const node = nodes.find((n) => n.id === contextMenu.nodeId);
          const isClaudeNode = node?.type === 'claude';

          return (
            <NodeContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              options={createNodeContextMenuOptions(
                contextMenu.nodeId,
                () => handleTestNode(contextMenu.nodeId),
                isClaudeNode ? () => handleEditPrompt(contextMenu.nodeId) : undefined
              )}
              onClose={() => setContextMenu(null)}
            />
          );
        })()}

      {/* Test Node Dialog - Wave 9.5.3 User Story 3 */}
      {testingNode && <TestNodeDialog step={testingNode} onClose={() => setTestingNode(null)} />}

      {/* Prompt Editor Dialog - Wave 9.5.4 */}
      {editingPromptNode && (
        <PromptEditorDialog
          step={editingPromptNode.step}
          onSave={handleSavePrompt}
          onClose={() => setEditingPromptNode(null)}
        />
      )}
    </div>
  );
};
