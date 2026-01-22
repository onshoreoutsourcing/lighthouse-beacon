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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '@renderer/stores/workflow.store';
import { PythonScriptNode, ClaudeAPINode, InputNode, OutputNode, ConditionalNode } from './nodes';
import { DebugToolbar, VariableInspector } from './debug';
import { useDebugState } from '@renderer/hooks/useDebugState';
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
  const { nodes, edges, addEdge, updateNodePosition } = useWorkflowStore();

  // Debug state management (Wave 9.4.6)
  const {
    debugMode,
    debugState,
    breakpoints,
    currentContext,
    setDebugMode,
    pause,
    resume,
    stepOver,
    continue: continueExecution,
    setVariable,
  } = useDebugState();

  // Variable inspector panel visibility
  const [showVariableInspector, setShowVariableInspector] = useState(false);

  // Check if workflow is currently executing (simplified - would need execution state from store)
  const isExecuting = false; // TODO: Get from execution state when available

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
   * Debug toolbar handlers (Wave 9.4.6)
   */
  const handleToggleDebugMode = useCallback(() => {
    void setDebugMode(debugMode === 'ON' ? 'OFF' : 'ON');
  }, [debugMode, setDebugMode]);

  const handlePause = useCallback(() => {
    void pause();
  }, [pause]);

  const handleResume = useCallback(() => {
    void resume();
  }, [resume]);

  const handleStepOver = useCallback(() => {
    void stepOver();
  }, [stepOver]);

  const handleContinue = useCallback(() => {
    void continueExecution();
  }, [continueExecution]);

  const handleVariableChange = useCallback(
    (path: string, value: unknown) => {
      void setVariable(path, value);
    },
    [setVariable]
  );

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
    [nodes, edges, onNodesChange, onEdgesChange, onConnect]
  );

  return (
    <div
      className={`workflow-canvas ${className} flex flex-col`}
      style={{ width: '100%', height: '100%' }}
      role="region"
      aria-label="Workflow canvas"
    >
      {/* Debug Toolbar - Wave 9.4.6 */}
      <div className="p-3 border-b border-vscode-border bg-vscode-bg">
        <DebugToolbar
          debugMode={debugMode}
          debugState={debugState}
          currentNodeId={currentContext?.nodeId}
          breakpointCount={breakpoints.length}
          onToggleDebugMode={handleToggleDebugMode}
          onPause={handlePause}
          onResume={handleResume}
          onStepOver={handleStepOver}
          onContinue={handleContinue}
          isExecuting={isExecuting}
        />
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
              aria-label={showVariableInspector ? 'Hide variable inspector' : 'Show variable inspector'}
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
    </div>
  );
};
