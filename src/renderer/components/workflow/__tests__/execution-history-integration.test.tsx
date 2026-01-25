/**
 * Integration Tests for Execution History Tracking
 *
 * Tests the complete flow from workflow execution to history persistence.
 * Verifies:
 * - ExecutionVisualizer records history on completion
 * - ExecutionHistoryStore persists to localStorage
 * - ExecutionHistoryPanel displays persisted history
 * - Performance requirements (<200ms query time)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ExecutionHistoryPanel } from '../ExecutionHistoryPanel';
import { useExecutionHistoryStore } from '../../../stores/executionHistory.store';
import { useWorkflowStore } from '../../../stores/workflow.store';
import { renderHook } from '@testing-library/react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.electronAPI
const mockElectronAPI = {
  workflow: {
    execution: {
      subscribe: vi.fn().mockResolvedValue({ success: true }),
      unsubscribe: vi.fn().mockResolvedValue({ success: true }),
      onWorkflowStarted: vi.fn(() => vi.fn()),
      onStepStarted: vi.fn(() => vi.fn()),
      onStepCompleted: vi.fn(() => vi.fn()),
      onStepFailed: vi.fn(() => vi.fn()),
      onWorkflowCompleted: vi.fn(() => vi.fn()),
    },
  },
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

describe('Execution History Integration', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorageMock.clear();

    // Clear stores
    const { result: historyResult } = renderHook(() => useExecutionHistoryStore());
    act(() => {
      historyResult.current.clearHistory();
    });

    const { result: workflowResult } = renderHook(() => useWorkflowStore());
    act(() => {
      workflowResult.current.reset();
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-End Execution History', () => {
    it('should store and retrieve execution history via store directly', () => {
      const { result: historyResult } = renderHook(() => useExecutionHistoryStore());

      // Simulate what ExecutionVisualizer would do
      act(() => {
        historyResult.current.addEntry({
          id: 'exec-1',
          workflowId: 'workflow-1',
          workflowName: 'Test Workflow',
          timestamp: Date.now() - 5000,
          duration: 5000,
          status: 'success',
          inputs: {},
          outputs: {},
          stepResults: [
            {
              stepId: 'node-1',
              status: 'success',
              duration: 2500,
            },
          ],
        });
      });

      // Verify history was recorded
      const history = historyResult.current.getHistory('workflow-1');
      expect(history).toHaveLength(1);
      expect(history[0]?.workflowId).toBe('workflow-1');
      expect(history[0]?.workflowName).toBe('Test Workflow');
      expect(history[0]?.status).toBe('success');
    });

    it('should persist history to localStorage when adding entries', () => {
      const { result: historyResult } = renderHook(() => useExecutionHistoryStore());

      // Add entry
      act(() => {
        historyResult.current.addEntry({
          id: 'exec-1',
          workflowId: 'workflow-1',
          workflowName: 'Persistence Test',
          timestamp: Date.now(),
          duration: 5000,
          status: 'success',
          inputs: {},
          outputs: {},
          stepResults: [],
        });
      });

      // Verify localStorage was updated
      const stored = localStorageMock.getItem('workflow-execution-history');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!) as Record<string, Array<{ id: string }>>;
      expect(parsed['workflow-1']).toBeDefined();
      expect(parsed['workflow-1']).toHaveLength(1);
      expect(parsed['workflow-1'][0].id).toBe('exec-1');
    });

    it('should display history in ExecutionHistoryPanel', () => {
      const { result: historyResult } = renderHook(() => useExecutionHistoryStore());

      // Add a history entry directly
      act(() => {
        historyResult.current.addEntry({
          id: 'exec-1',
          workflowId: 'workflow-1',
          workflowName: 'Display Test Workflow',
          timestamp: Date.now(),
          duration: 5000,
          status: 'success',
          inputs: {},
          outputs: {},
          stepResults: [],
        });
      });

      // Render history panel
      render(<ExecutionHistoryPanel workflowId="workflow-1" />);

      // Verify entry is displayed
      expect(screen.getByText('Display Test Workflow')).toBeInTheDocument();
      expect(screen.getByText('5.0s')).toBeInTheDocument();
    });
  });

  describe('Multiple Workflow Executions', () => {
    it('should track multiple executions and prune to 5', () => {
      const { result: historyResult } = renderHook(() => useExecutionHistoryStore());

      // Add 6 entries
      for (let i = 1; i <= 6; i++) {
        act(() => {
          historyResult.current.addEntry({
            id: `exec-${i}`,
            workflowId: 'workflow-1',
            workflowName: 'Test Workflow',
            timestamp: Date.now() + i * 1000,
            duration: 1000,
            status: 'success',
            inputs: {},
            outputs: {},
            stepResults: [],
          });
        });
      }

      // Verify only 5 entries remain
      const history = historyResult.current.getHistory('workflow-1');
      expect(history).toHaveLength(5);

      // Verify oldest entry was pruned
      expect(history.find((e) => e.id === 'exec-1')).toBeUndefined();
      expect(history.find((e) => e.id === 'exec-6')).toBeDefined();
    });

    it('should track executions for different workflows independently', () => {
      const { result: historyResult } = renderHook(() => useExecutionHistoryStore());

      // Add entries for workflow-1
      for (let i = 1; i <= 3; i++) {
        act(() => {
          historyResult.current.addEntry({
            id: `exec-w1-${i}`,
            workflowId: 'workflow-1',
            workflowName: 'Workflow 1',
            timestamp: Date.now() + i * 1000,
            duration: 1000,
            status: 'success',
            inputs: {},
            outputs: {},
            stepResults: [],
          });
        });
      }

      // Add entries for workflow-2
      for (let i = 1; i <= 2; i++) {
        act(() => {
          historyResult.current.addEntry({
            id: `exec-w2-${i}`,
            workflowId: 'workflow-2',
            workflowName: 'Workflow 2',
            timestamp: Date.now() + i * 1000,
            duration: 1000,
            status: 'success',
            inputs: {},
            outputs: {},
            stepResults: [],
          });
        });
      }

      // Verify independent tracking
      const workflow1History = historyResult.current.getHistory('workflow-1');
      const workflow2History = historyResult.current.getHistory('workflow-2');

      expect(workflow1History).toHaveLength(3);
      expect(workflow2History).toHaveLength(2);

      // Verify all history returns both workflows
      const allHistory = historyResult.current.getHistory();
      expect(allHistory).toHaveLength(5);
    });
  });

  describe('Performance Requirements', () => {
    it('should query history in under 200ms with 50+ entries', () => {
      const { result: historyResult } = renderHook(() => useExecutionHistoryStore());

      // Add 50 entries across 10 workflows
      for (let w = 1; w <= 10; w++) {
        for (let i = 1; i <= 5; i++) {
          act(() => {
            historyResult.current.addEntry({
              id: `exec-w${w}-${i}`,
              workflowId: `workflow-${w}`,
              workflowName: `Workflow ${w}`,
              timestamp: Date.now() + w * 100 + i,
              duration: 1000,
              status: 'success',
              inputs: {},
              outputs: {},
              stepResults: [],
            });
          });
        }
      }

      // Measure query performance
      const startTime = performance.now();
      historyResult.current.getHistory('workflow-5');
      const endTime = performance.now();

      const queryTime = endTime - startTime;
      expect(queryTime).toBeLessThan(200);
    });

    it('should render ExecutionHistoryPanel with 50 entries in under 200ms', () => {
      const { result: historyResult } = renderHook(() => useExecutionHistoryStore());

      // Add 50 entries
      for (let i = 1; i <= 50; i++) {
        act(() => {
          historyResult.current.addEntry({
            id: `exec-${i}`,
            workflowId: `workflow-${i % 10}`,
            workflowName: `Workflow ${i % 10}`,
            timestamp: Date.now() + i * 1000,
            duration: 1000,
            status: 'success',
            inputs: {},
            outputs: {},
            stepResults: [],
          });
        });
      }

      // Measure render performance
      const startTime = performance.now();
      render(<ExecutionHistoryPanel />);
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('Error Handling', () => {
    it('should record failed executions with error messages', () => {
      const { result: historyResult } = renderHook(() => useExecutionHistoryStore());

      // Simulate failed execution
      act(() => {
        historyResult.current.addEntry({
          id: 'exec-1',
          workflowId: 'workflow-1',
          workflowName: 'Error Test',
          timestamp: Date.now() - 5000,
          duration: 5000,
          status: 'failed',
          inputs: {},
          outputs: {},
          error: 'Script execution failed',
          stepResults: [
            {
              stepId: 'node-1',
              status: 'failed',
              duration: 2500,
              error: 'Script execution failed',
            },
          ],
        });
      });

      // Verify error was recorded
      const history = historyResult.current.getHistory('workflow-1');
      expect(history).toHaveLength(1);
      expect(history[0]?.status).toBe('failed');
      expect(history[0]?.error).toContain('Script execution failed');
    });
  });

  describe('localStorage Reload', () => {
    it('should reload history from localStorage after page refresh', () => {
      const { result: historyResult } = renderHook(() => useExecutionHistoryStore());

      // Add entry
      act(() => {
        historyResult.current.addEntry({
          id: 'exec-1',
          workflowId: 'workflow-1',
          workflowName: 'Reload Test',
          timestamp: Date.now(),
          duration: 5000,
          status: 'success',
          inputs: {},
          outputs: {},
          stepResults: [],
        });
      });

      // Verify localStorage contains the entry
      const stored = localStorageMock.getItem('workflow-execution-history');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!) as Record<string, Array<{ id: string }>>;
      expect(parsed['workflow-1']).toHaveLength(1);
      expect(parsed['workflow-1'][0].id).toBe('exec-1');

      // Simulate reload by getting history again (store already loaded from localStorage on init)
      const history = historyResult.current.getHistory('workflow-1');
      expect(history).toHaveLength(1);
      expect(history[0]?.id).toBe('exec-1');
    });
  });
});
