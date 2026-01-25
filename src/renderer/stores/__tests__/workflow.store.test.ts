/**
 * Tests for Workflow Store
 *
 * Comprehensive test coverage for useWorkflowStore Zustand store.
 * Target: ≥90% coverage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  useWorkflowStore,
  type WorkflowNode,
  type WorkflowEdge,
  type WorkflowMetadata,
  type PythonNodeData,
  type ClaudeNodeData,
} from '../workflow.store';
import type { Connection } from '@xyflow/react';

describe('useWorkflowStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useWorkflowStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useWorkflowStore());

      expect(result.current.metadata).toBeNull();
      expect(result.current.nodes).toEqual([]);
      expect(result.current.edges).toEqual([]);
      expect(result.current.selectedNodes).toEqual([]);
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Node Management', () => {
    it('should add a node', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const node: WorkflowNode = {
        id: 'test-node-1',
        type: 'python',
        position: { x: 100, y: 100 },
        data: {
          label: 'Test Python Node',
          status: 'idle',
          scriptPath: '/path/to/script.py',
        },
      };

      act(() => {
        result.current.addNode(node);
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.nodes[0]).toEqual(node);
      expect(result.current.error).toBeNull();
    });

    it('should add a node without ID and generate one', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const nodeWithoutId: WorkflowNode = {
        id: '',
        type: 'input',
        position: { x: 0, y: 0 },
        data: {
          label: 'Input Node',
          status: 'idle',
          paramName: 'input1',
        },
      };

      act(() => {
        result.current.addNode(nodeWithoutId);
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.nodes[0]?.id).toBeTruthy();
      expect(result.current.nodes[0]?.id).toMatch(/^node-/);
    });

    it('should add multiple nodes', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const node1: WorkflowNode = {
        id: 'node-1',
        type: 'input',
        position: { x: 0, y: 0 },
        data: { label: 'Input', status: 'idle', paramName: 'input1' },
      };

      const node2: WorkflowNode = {
        id: 'node-2',
        type: 'output',
        position: { x: 200, y: 0 },
        data: { label: 'Output', status: 'idle', format: 'text' },
      };

      act(() => {
        result.current.addNode(node1);
        result.current.addNode(node2);
      });

      expect(result.current.nodes).toHaveLength(2);
    });

    it('should remove a node', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const node: WorkflowNode = {
        id: 'test-node-1',
        type: 'python',
        position: { x: 100, y: 100 },
        data: {
          label: 'Test Node',
          status: 'idle',
          scriptPath: '/path/to/script.py',
        },
      };

      act(() => {
        result.current.addNode(node);
        result.current.removeNode('test-node-1');
      });

      expect(result.current.nodes).toHaveLength(0);
      expect(result.current.error).toBeNull();
    });

    it('should remove connected edges when removing a node', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const node1: WorkflowNode = {
        id: 'node-1',
        type: 'input',
        position: { x: 0, y: 0 },
        data: { label: 'Input', status: 'idle', paramName: 'input1' },
      };

      const node2: WorkflowNode = {
        id: 'node-2',
        type: 'output',
        position: { x: 200, y: 0 },
        data: { label: 'Output', status: 'idle', format: 'text' },
      };

      const connection: Connection = {
        source: 'node-1',
        target: 'node-2',
        sourceHandle: null,
        targetHandle: null,
      };

      act(() => {
        result.current.addNode(node1);
        result.current.addNode(node2);
        result.current.addEdge(connection);
        result.current.removeNode('node-1');
      });

      expect(result.current.nodes).toHaveLength(1);
      expect(result.current.edges).toHaveLength(0);
    });

    it('should update node data', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const node: WorkflowNode = {
        id: 'test-node-1',
        type: 'python',
        position: { x: 100, y: 100 },
        data: {
          label: 'Test Node',
          status: 'idle',
          scriptPath: '/path/to/script.py',
        } as PythonNodeData,
      };

      act(() => {
        result.current.addNode(node);
        result.current.updateNode('test-node-1', {
          label: 'Updated Node',
          scriptPath: '/new/path.py',
        });
      });

      const updatedNode = result.current.nodes[0];
      expect(updatedNode?.data.label).toBe('Updated Node');
      expect((updatedNode?.data as PythonNodeData).scriptPath).toBe('/new/path.py');
    });

    it('should update node position', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const node: WorkflowNode = {
        id: 'test-node-1',
        type: 'python',
        position: { x: 100, y: 100 },
        data: {
          label: 'Test Node',
          status: 'idle',
          scriptPath: '/path/to/script.py',
        },
      };

      act(() => {
        result.current.addNode(node);
        result.current.updateNodePosition('test-node-1', { x: 200, y: 300 });
      });

      const updatedNode = result.current.nodes[0];
      expect(updatedNode?.position).toEqual({ x: 200, y: 300 });
    });

    it('should update node status', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const node: WorkflowNode = {
        id: 'test-node-1',
        type: 'python',
        position: { x: 100, y: 100 },
        data: {
          label: 'Test Node',
          status: 'idle',
          scriptPath: '/path/to/script.py',
        },
      };

      act(() => {
        result.current.addNode(node);
        result.current.updateNodeStatus('test-node-1', 'running');
      });

      let updatedNode = result.current.nodes[0];
      expect(updatedNode?.data.status).toBe('running');

      act(() => {
        result.current.updateNodeStatus('test-node-1', 'error', 'Script failed');
      });

      updatedNode = result.current.nodes[0];
      expect(updatedNode?.data.status).toBe('error');
      expect(updatedNode?.data.error).toBe('Script failed');
    });
  });

  describe('Edge Management', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useWorkflowStore());

      const node1: WorkflowNode = {
        id: 'node-1',
        type: 'input',
        position: { x: 0, y: 0 },
        data: { label: 'Input', status: 'idle', paramName: 'input1' },
      };

      const node2: WorkflowNode = {
        id: 'node-2',
        type: 'output',
        position: { x: 200, y: 0 },
        data: { label: 'Output', status: 'idle', format: 'text' },
      };

      act(() => {
        result.current.addNode(node1);
        result.current.addNode(node2);
      });
    });

    it('should add an edge', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const connection: Connection = {
        source: 'node-1',
        target: 'node-2',
        sourceHandle: null,
        targetHandle: null,
      };

      act(() => {
        result.current.addEdge(connection);
      });

      expect(result.current.edges).toHaveLength(1);
      expect(result.current.edges[0]?.source).toBe('node-1');
      expect(result.current.edges[0]?.target).toBe('node-2');
      expect(result.current.error).toBeNull();
    });

    it('should not add edge with missing source', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const invalidConnection = {
        source: null,
        target: 'node-2',
        sourceHandle: null,
        targetHandle: null,
      } as unknown as Connection;

      act(() => {
        result.current.addEdge(invalidConnection);
      });

      expect(result.current.edges).toHaveLength(0);
      expect(result.current.error).toBe('Invalid connection: source and target required');
    });

    it('should not add edge with missing target', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const invalidConnection = {
        source: 'node-1',
        target: null,
        sourceHandle: null,
        targetHandle: null,
      } as unknown as Connection;

      act(() => {
        result.current.addEdge(invalidConnection);
      });

      expect(result.current.edges).toHaveLength(0);
      expect(result.current.error).toBe('Invalid connection: source and target required');
    });

    it('should not add duplicate edge', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const connection: Connection = {
        source: 'node-1',
        target: 'node-2',
        sourceHandle: null,
        targetHandle: null,
      };

      act(() => {
        result.current.addEdge(connection);
        result.current.addEdge(connection);
      });

      expect(result.current.edges).toHaveLength(1);
      expect(result.current.error).toBe('Connection already exists');
    });

    it('should remove an edge', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const connection: Connection = {
        source: 'node-1',
        target: 'node-2',
        sourceHandle: null,
        targetHandle: null,
      };

      act(() => {
        result.current.addEdge(connection);
      });

      const edgeId = result.current.edges[0]?.id;
      expect(edgeId).toBeTruthy();

      act(() => {
        result.current.removeEdge(edgeId!);
      });

      expect(result.current.edges).toHaveLength(0);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Selection Management', () => {
    it('should set selected nodes', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.setSelectedNodes(['node-1', 'node-2']);
      });

      expect(result.current.selectedNodes).toEqual(['node-1', 'node-2']);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.setSelectedNodes(['node-1', 'node-2']);
        result.current.clearSelection();
      });

      expect(result.current.selectedNodes).toEqual([]);
    });

    it('should remove deleted node from selection', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const node: WorkflowNode = {
        id: 'test-node-1',
        type: 'input',
        position: { x: 0, y: 0 },
        data: { label: 'Test', status: 'idle', paramName: 'input1' },
      };

      act(() => {
        result.current.addNode(node);
        result.current.setSelectedNodes(['test-node-1']);
        result.current.removeNode('test-node-1');
      });

      expect(result.current.selectedNodes).toEqual([]);
    });
  });

  describe('Workflow Management', () => {
    it('should load a workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const metadata: WorkflowMetadata = {
        id: 'workflow-1',
        name: 'Test Workflow',
        createdAt: new Date('2026-01-21'),
        lastModified: new Date('2026-01-21'),
      };

      const nodes: WorkflowNode[] = [
        {
          id: 'node-1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input', status: 'idle', paramName: 'input1' },
        },
      ];

      const edges: WorkflowEdge[] = [];

      act(() => {
        result.current.loadWorkflow(metadata, nodes, edges);
      });

      expect(result.current.metadata).toEqual(metadata);
      expect(result.current.nodes).toEqual(nodes);
      expect(result.current.edges).toEqual(edges);
      expect(result.current.selectedNodes).toEqual([]);
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should save a workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const metadata: WorkflowMetadata = {
        id: 'workflow-1',
        name: 'Test Workflow',
        createdAt: new Date('2026-01-21T10:00:00'),
        lastModified: new Date('2026-01-21T10:00:00'),
      };

      const nodes: WorkflowNode[] = [
        {
          id: 'node-1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input', status: 'idle', paramName: 'input1' },
        },
      ];

      act(() => {
        result.current.loadWorkflow(metadata, nodes, []);
      });

      let savedWorkflow: {
        metadata: WorkflowMetadata;
        nodes: WorkflowNode[];
        edges: WorkflowEdge[];
      } | null = null;

      act(() => {
        savedWorkflow = result.current.saveWorkflow();
      });

      expect(savedWorkflow).not.toBeNull();
      expect(savedWorkflow!.metadata.id).toBe('workflow-1');
      expect(savedWorkflow!.metadata.name).toBe('Test Workflow');
      expect(savedWorkflow!.nodes).toEqual(nodes);
      expect(savedWorkflow!.metadata.lastModified.getTime()).toBeGreaterThan(
        metadata.lastModified.getTime()
      );
    });

    it('should return null when saving without loaded workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      let savedWorkflow: ReturnType<typeof result.current.saveWorkflow> = null;

      act(() => {
        savedWorkflow = result.current.saveWorkflow();
      });

      expect(savedWorkflow).toBeNull();
      expect(result.current.error).toBe('No workflow loaded');
    });

    it('should clear workflow', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const metadata: WorkflowMetadata = {
        id: 'workflow-1',
        name: 'Test Workflow',
        createdAt: new Date(),
        lastModified: new Date(),
      };

      const nodes: WorkflowNode[] = [
        {
          id: 'node-1',
          type: 'input',
          position: { x: 0, y: 0 },
          data: { label: 'Input', status: 'idle', paramName: 'input1' },
        },
      ];

      act(() => {
        result.current.loadWorkflow(metadata, nodes, []);
        result.current.clearWorkflow();
      });

      expect(result.current.metadata).not.toBeNull();
      expect(result.current.metadata?.name).toBe('New Workflow');
      expect(result.current.nodes).toEqual([]);
      expect(result.current.edges).toEqual([]);
      expect(result.current.selectedNodes).toEqual([]);
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set execution state', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.setExecuting(true);
      });

      expect(result.current.isExecuting).toBe(true);

      act(() => {
        result.current.setExecuting(false);
      });

      expect(result.current.isExecuting).toBe(false);
    });
  });

  describe('Error Management', () => {
    it('should set error message', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.setError('Test error message');
      });

      expect(result.current.error).toBe('Test error message');
    });

    it('should clear error message', () => {
      const { result } = renderHook(() => useWorkflowStore());

      act(() => {
        result.current.setError('Test error');
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Reset', () => {
    it('should reset store to initial state', () => {
      const { result } = renderHook(() => useWorkflowStore());

      // Set up some state
      const node: WorkflowNode = {
        id: 'test-node-1',
        type: 'input',
        position: { x: 0, y: 0 },
        data: { label: 'Test', status: 'idle', paramName: 'input1' },
      };

      act(() => {
        result.current.addNode(node);
        result.current.setSelectedNodes(['test-node-1']);
        result.current.setExecuting(true);
        result.current.setError('Test error');
        result.current.reset();
      });

      expect(result.current.metadata).toBeNull();
      expect(result.current.nodes).toEqual([]);
      expect(result.current.edges).toEqual([]);
      expect(result.current.selectedNodes).toEqual([]);
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Type Safety', () => {
    it('should handle Python node data correctly', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const pythonNode: WorkflowNode = {
        id: 'python-1',
        type: 'python',
        position: { x: 100, y: 100 },
        data: {
          label: 'Python Script',
          status: 'idle',
          scriptPath: '/path/to/script.py',
          args: ['--arg1', 'value1'],
        } as PythonNodeData,
      };

      act(() => {
        result.current.addNode(pythonNode);
      });

      const addedNode = result.current.nodes[0];
      expect(addedNode?.type).toBe('python');
      expect((addedNode?.data as PythonNodeData).scriptPath).toBe('/path/to/script.py');
      expect((addedNode?.data as PythonNodeData).args).toEqual(['--arg1', 'value1']);
    });

    it('should handle Claude node data correctly', () => {
      const { result } = renderHook(() => useWorkflowStore());

      const claudeNode: WorkflowNode = {
        id: 'claude-1',
        type: 'claude',
        position: { x: 100, y: 100 },
        data: {
          label: 'Claude AI',
          status: 'idle',
          model: 'claude-sonnet-4-5',
          prompt: 'Analyze this code',
          temperature: 0.7,
          maxTokens: 1000,
        } as ClaudeNodeData,
      };

      act(() => {
        result.current.addNode(claudeNode);
      });

      const addedNode = result.current.nodes[0];
      expect(addedNode?.type).toBe('claude');
      expect((addedNode?.data as ClaudeNodeData).model).toBe('claude-sonnet-4-5');
      expect((addedNode?.data as ClaudeNodeData).prompt).toBe('Analyze this code');
      expect((addedNode?.data as ClaudeNodeData).temperature).toBe(0.7);
      expect((addedNode?.data as ClaudeNodeData).maxTokens).toBe(1000);
    });
  });
});
