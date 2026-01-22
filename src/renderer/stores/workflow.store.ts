/**
 * Workflow Store
 *
 * Manages visual workflow canvas state for React Flow integration.
 * Provides actions for node and edge management, workflow persistence.
 *
 * Features:
 * - Node management (add, remove, update)
 * - Edge management (add, remove)
 * - Workflow loading and saving
 * - Integration with React Flow canvas
 * - Type-safe node data structures
 */

import { create } from 'zustand';
import type { Node, Edge, Connection } from '@xyflow/react';

/**
 * Node types available in the workflow canvas
 */
export type WorkflowNodeType = 'input' | 'output' | 'python' | 'claude' | 'conditional';

/**
 * Node status for execution visualization
 */
export type NodeStatus = 'idle' | 'running' | 'success' | 'error';

/**
 * Base node data interface
 */
export interface BaseNodeData {
  /** Node label */
  label: string;
  /** Execution status */
  status: NodeStatus;
  /** Error message if status is 'error' */
  error?: string;
  /** Allow additional properties for extensibility */
  [key: string]: unknown;
}

/**
 * Python script node data
 */
export interface PythonNodeData extends BaseNodeData {
  /** Path to Python script */
  scriptPath: string;
  /** Script arguments */
  args?: string[];
}

/**
 * Claude API node data
 */
export interface ClaudeNodeData extends BaseNodeData {
  /** Claude model name */
  model: string;
  /** Prompt template */
  prompt: string;
  /** Temperature setting */
  temperature?: number;
  /** Max tokens */
  maxTokens?: number;
}

/**
 * Input node data
 */
export interface InputNodeData extends BaseNodeData {
  /** Input parameter name */
  paramName: string;
  /** Default value */
  defaultValue?: string;
}

/**
 * Output node data
 */
export interface OutputNodeData extends BaseNodeData {
  /** Output format */
  format: 'text' | 'json' | 'file';
}

/**
 * Conditional node data
 */
export interface ConditionalNodeData extends BaseNodeData {
  /** Condition expression to evaluate */
  condition: string;
  /** Conditional execution status */
  conditionalStatus?: 'idle' | 'evaluating' | 'true-taken' | 'false-taken' | 'error';
  /** Which branch was taken (true or false) */
  branchTaken?: boolean;
}

/**
 * Union type for all node data types
 */
export type WorkflowNodeData =
  | PythonNodeData
  | ClaudeNodeData
  | InputNodeData
  | OutputNodeData
  | ConditionalNodeData
  | BaseNodeData;

/**
 * Workflow node with typed data
 */
export type WorkflowNode = Node<WorkflowNodeData, WorkflowNodeType>;

/**
 * Workflow edge
 */
export type WorkflowEdge = Edge;

/**
 * Workflow metadata
 */
export interface WorkflowMetadata {
  /** Workflow ID */
  id: string;
  /** Workflow name */
  name: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last modified timestamp */
  lastModified: Date;
}

/**
 * Workflow state interface
 */
interface WorkflowState {
  // State
  /** Workflow metadata */
  metadata: WorkflowMetadata | null;
  /** Array of workflow nodes */
  nodes: WorkflowNode[];
  /** Array of workflow edges */
  edges: WorkflowEdge[];
  /** Currently selected node IDs */
  selectedNodes: string[];
  /** Is workflow executing */
  isExecuting: boolean;
  /** Error message from failed operations */
  error: string | null;

  // Node Actions
  /** Add a node to the workflow */
  addNode: (node: WorkflowNode) => void;
  /** Remove a node from the workflow */
  removeNode: (nodeId: string) => void;
  /** Update a node's data */
  updateNode: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  /** Update a node's position */
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  /** Update node status (for execution visualization) */
  updateNodeStatus: (nodeId: string, status: NodeStatus, error?: string) => void;

  // Edge Actions
  /** Add an edge to the workflow */
  addEdge: (connection: Connection) => void;
  /** Remove an edge from the workflow */
  removeEdge: (edgeId: string) => void;

  // Selection Actions
  /** Set selected nodes */
  setSelectedNodes: (nodeIds: string[]) => void;
  /** Clear node selection */
  clearSelection: () => void;

  // Workflow Actions
  /** Load a workflow */
  loadWorkflow: (metadata: WorkflowMetadata, nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  /** Save workflow (returns current state) */
  saveWorkflow: () => {
    metadata: WorkflowMetadata;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  } | null;
  /** Clear workflow (new workflow) */
  clearWorkflow: () => void;
  /** Set execution state */
  setExecuting: (isExecuting: boolean) => void;

  // Error Actions
  /** Set error message */
  setError: (error: string | null) => void;
  /** Clear error state */
  clearError: () => void;

  // Utility Actions
  /** Reset store to initial state */
  reset: () => void;
}

/**
 * Generate unique node ID
 */
const generateNodeId = (): string => {
  return `node-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Generate unique edge ID
 */
const generateEdgeId = (source: string, target: string): string => {
  return `edge-${source}-${target}-${Date.now()}`;
};

/**
 * Generate unique workflow ID
 */
const generateWorkflowId = (): string => {
  return `workflow-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Workflow store for managing visual workflow canvas state
 */
export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // Initial state
  metadata: null,
  nodes: [],
  edges: [],
  selectedNodes: [],
  isExecuting: false,
  error: null,

  /**
   * Add a node to the workflow
   * Assigns a unique ID if not provided
   */
  addNode: (node: WorkflowNode) => {
    const { nodes } = get();

    // Ensure node has an ID
    const nodeWithId: WorkflowNode = {
      ...node,
      id: node.id || generateNodeId(),
    };

    set({
      nodes: [...nodes, nodeWithId],
      error: null,
    });
  },

  /**
   * Remove a node from the workflow
   * Also removes connected edges
   */
  removeNode: (nodeId: string) => {
    const { nodes, edges, selectedNodes } = get();

    // Remove node
    const updatedNodes = nodes.filter((n) => n.id !== nodeId);

    // Remove connected edges
    const updatedEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);

    // Remove from selection
    const updatedSelectedNodes = selectedNodes.filter((id) => id !== nodeId);

    set({
      nodes: updatedNodes,
      edges: updatedEdges,
      selectedNodes: updatedSelectedNodes,
      error: null,
    });
  },

  /**
   * Update a node's data
   */
  updateNode: (nodeId: string, data: Partial<WorkflowNodeData>) => {
    const { nodes } = get();

    const updatedNodes = nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              ...data,
            },
          }
        : node
    );

    set({
      nodes: updatedNodes,
      error: null,
    });
  },

  /**
   * Update a node's position
   */
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => {
    const { nodes } = get();

    const updatedNodes = nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            position,
          }
        : node
    );

    set({
      nodes: updatedNodes,
    });
  },

  /**
   * Update node status (for execution visualization)
   */
  updateNodeStatus: (nodeId: string, status: NodeStatus, error?: string) => {
    const { nodes } = get();

    const updatedNodes = nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              status,
              error,
            },
          }
        : node
    );

    set({
      nodes: updatedNodes,
    });
  },

  /**
   * Add an edge to the workflow
   * Creates edge from connection object
   */
  addEdge: (connection: Connection) => {
    const { edges } = get();

    // Validate connection
    if (!connection.source || !connection.target) {
      set({ error: 'Invalid connection: source and target required' });
      return;
    }

    // Check for duplicate edge (normalize null/undefined for comparison)
    const normalizeHandle = (handle: string | null | undefined): string | null => {
      return handle === undefined ? null : handle;
    };

    const connSourceHandle = normalizeHandle(connection.sourceHandle);
    const connTargetHandle = normalizeHandle(connection.targetHandle);

    const isDuplicate = edges.some(
      (e) =>
        e.source === connection.source &&
        e.target === connection.target &&
        normalizeHandle(e.sourceHandle) === connSourceHandle &&
        normalizeHandle(e.targetHandle) === connTargetHandle
    );

    if (isDuplicate) {
      set({ error: 'Connection already exists' });
      return;
    }

    // Create new edge
    const newEdge: WorkflowEdge = {
      id: generateEdgeId(connection.source, connection.target),
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle || null,
      targetHandle: connection.targetHandle || null,
    };

    set({
      edges: [...edges, newEdge],
      error: null,
    });
  },

  /**
   * Remove an edge from the workflow
   */
  removeEdge: (edgeId: string) => {
    const { edges } = get();

    const updatedEdges = edges.filter((e) => e.id !== edgeId);

    set({
      edges: updatedEdges,
      error: null,
    });
  },

  /**
   * Set selected nodes
   */
  setSelectedNodes: (nodeIds: string[]) => {
    set({ selectedNodes: nodeIds });
  },

  /**
   * Clear node selection
   */
  clearSelection: () => {
    set({ selectedNodes: [] });
  },

  /**
   * Load a workflow
   */
  loadWorkflow: (metadata: WorkflowMetadata, nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
    set({
      metadata,
      nodes,
      edges,
      selectedNodes: [],
      isExecuting: false,
      error: null,
    });
  },

  /**
   * Save workflow (returns current state)
   * Returns null if no workflow loaded
   */
  saveWorkflow: () => {
    const { metadata, nodes, edges } = get();

    if (!metadata) {
      set({ error: 'No workflow loaded' });
      return null;
    }

    // Update last modified timestamp
    const updatedMetadata: WorkflowMetadata = {
      ...metadata,
      lastModified: new Date(),
    };

    set({ metadata: updatedMetadata });

    return {
      metadata: updatedMetadata,
      nodes,
      edges,
    };
  },

  /**
   * Clear workflow (new workflow)
   */
  clearWorkflow: () => {
    const newMetadata: WorkflowMetadata = {
      id: generateWorkflowId(),
      name: 'New Workflow',
      createdAt: new Date(),
      lastModified: new Date(),
    };

    set({
      metadata: newMetadata,
      nodes: [],
      edges: [],
      selectedNodes: [],
      isExecuting: false,
      error: null,
    });
  },

  /**
   * Set execution state
   */
  setExecuting: (isExecuting: boolean) => {
    set({ isExecuting });
  },

  /**
   * Set error message
   */
  setError: (error: string | null) => {
    set({ error });
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set({
      metadata: null,
      nodes: [],
      edges: [],
      selectedNodes: [],
      isExecuting: false,
      error: null,
    });
  },
}));
