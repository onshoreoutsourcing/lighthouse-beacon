/**
 * Tests for ExecutionHistory Store
 *
 * Comprehensive test coverage for useExecutionHistoryStore Zustand store.
 * Target: ≥90% coverage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useExecutionHistoryStore, type ExecutionHistoryEntry } from '../executionHistory.store';

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

describe('useExecutionHistoryStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();

    // Reset store before each test
    const { result } = renderHook(() => useExecutionHistoryStore());
    act(() => {
      result.current.clearHistory();
    });
  });

  describe('Initial State', () => {
    it('should have empty history on init', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      expect(result.current.getHistory()).toEqual([]);
    });

    it('should persist and retrieve from localStorage', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      // Add entry
      const testEntry: ExecutionHistoryEntry = {
        id: 'exec-1',
        workflowId: 'workflow-1',
        workflowName: 'Test Workflow',
        timestamp: 1234567890,
        duration: 5000,
        status: 'success',
        inputs: { param1: 'value1' },
        outputs: { result: 'success' },
        stepResults: [],
      };

      act(() => {
        result.current.addEntry(testEntry);
      });

      // Verify it was persisted to localStorage
      const stored = localStorageMock.getItem('workflow-execution-history');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed['workflow-1']).toHaveLength(1);
      expect(parsed['workflow-1'][0].id).toBe('exec-1');

      // Verify we can retrieve it from store
      const history = result.current.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]?.id).toBe('exec-1');
    });
  });

  describe('addEntry', () => {
    it('should add a new execution entry', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      const entry: ExecutionHistoryEntry = {
        id: 'exec-1',
        workflowId: 'workflow-1',
        workflowName: 'Test Workflow',
        timestamp: Date.now(),
        duration: 5000,
        status: 'success',
        inputs: { param1: 'value1' },
        outputs: { result: 'success' },
        stepResults: [
          {
            stepId: 'step-1',
            status: 'success',
            duration: 2500,
          },
        ],
      };

      act(() => {
        result.current.addEntry(entry);
      });

      const history = result.current.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(entry);
    });

    it('should add multiple entries for the same workflow', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      const entry1: ExecutionHistoryEntry = {
        id: 'exec-1',
        workflowId: 'workflow-1',
        workflowName: 'Test Workflow',
        timestamp: Date.now() - 10000,
        duration: 5000,
        status: 'success',
        inputs: {},
        outputs: {},
        stepResults: [],
      };

      const entry2: ExecutionHistoryEntry = {
        id: 'exec-2',
        workflowId: 'workflow-1',
        workflowName: 'Test Workflow',
        timestamp: Date.now(),
        duration: 3000,
        status: 'success',
        inputs: {},
        outputs: {},
        stepResults: [],
      };

      act(() => {
        result.current.addEntry(entry1);
        result.current.addEntry(entry2);
      });

      const history = result.current.getHistory('workflow-1');
      expect(history).toHaveLength(2);
    });

    it('should add entries for different workflows', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      const entry1: ExecutionHistoryEntry = {
        id: 'exec-1',
        workflowId: 'workflow-1',
        workflowName: 'Workflow 1',
        timestamp: Date.now(),
        duration: 5000,
        status: 'success',
        inputs: {},
        outputs: {},
        stepResults: [],
      };

      const entry2: ExecutionHistoryEntry = {
        id: 'exec-2',
        workflowId: 'workflow-2',
        workflowName: 'Workflow 2',
        timestamp: Date.now(),
        duration: 3000,
        status: 'failed',
        inputs: {},
        outputs: {},
        error: 'Execution failed',
        stepResults: [],
      };

      act(() => {
        result.current.addEntry(entry1);
        result.current.addEntry(entry2);
      });

      const allHistory = result.current.getHistory();
      expect(allHistory).toHaveLength(2);

      const workflow1History = result.current.getHistory('workflow-1');
      expect(workflow1History).toHaveLength(1);
      expect(workflow1History[0]?.workflowId).toBe('workflow-1');

      const workflow2History = result.current.getHistory('workflow-2');
      expect(workflow2History).toHaveLength(1);
      expect(workflow2History[0]?.workflowId).toBe('workflow-2');
    });

    it('should prune old entries when exceeding 5 per workflow', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      // Add 6 entries for the same workflow
      for (let i = 1; i <= 6; i++) {
        const entry: ExecutionHistoryEntry = {
          id: `exec-${i}`,
          workflowId: 'workflow-1',
          workflowName: 'Test Workflow',
          timestamp: Date.now() + i * 1000, // Increasing timestamps
          duration: 1000,
          status: 'success',
          inputs: {},
          outputs: {},
          stepResults: [],
        };

        act(() => {
          result.current.addEntry(entry);
        });
      }

      const history = result.current.getHistory('workflow-1');
      expect(history).toHaveLength(5);

      // Oldest entry (exec-1) should be removed
      expect(history.find((e) => e.id === 'exec-1')).toBeUndefined();

      // Most recent 5 entries should remain
      expect(history.find((e) => e.id === 'exec-2')).toBeDefined();
      expect(history.find((e) => e.id === 'exec-3')).toBeDefined();
      expect(history.find((e) => e.id === 'exec-4')).toBeDefined();
      expect(history.find((e) => e.id === 'exec-5')).toBeDefined();
      expect(history.find((e) => e.id === 'exec-6')).toBeDefined();
    });

    it('should keep 5 entries per workflow independently', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      // Add 6 entries for workflow-1
      for (let i = 1; i <= 6; i++) {
        act(() => {
          result.current.addEntry({
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

      // Add 3 entries for workflow-2
      for (let i = 1; i <= 3; i++) {
        act(() => {
          result.current.addEntry({
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

      // Workflow 1 should have 5 entries (oldest pruned)
      const workflow1History = result.current.getHistory('workflow-1');
      expect(workflow1History).toHaveLength(5);

      // Workflow 2 should have 3 entries
      const workflow2History = result.current.getHistory('workflow-2');
      expect(workflow2History).toHaveLength(3);
    });

    it('should persist to localStorage after adding entry', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      const entry: ExecutionHistoryEntry = {
        id: 'exec-1',
        workflowId: 'workflow-1',
        workflowName: 'Test Workflow',
        timestamp: Date.now(),
        duration: 5000,
        status: 'success',
        inputs: {},
        outputs: {},
        stepResults: [],
      };

      act(() => {
        result.current.addEntry(entry);
      });

      const stored = localStorageMock.getItem('workflow-execution-history');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed['workflow-1']).toHaveLength(1);
      expect(parsed['workflow-1'][0].id).toBe('exec-1');
    });
  });

  describe('getHistory', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      // Add test data
      act(() => {
        result.current.addEntry({
          id: 'exec-1',
          workflowId: 'workflow-1',
          workflowName: 'Workflow 1',
          timestamp: Date.now() - 5000,
          duration: 1000,
          status: 'success',
          inputs: {},
          outputs: {},
          stepResults: [],
        });

        result.current.addEntry({
          id: 'exec-2',
          workflowId: 'workflow-1',
          workflowName: 'Workflow 1',
          timestamp: Date.now(),
          duration: 2000,
          status: 'failed',
          inputs: {},
          outputs: {},
          error: 'Test error',
          stepResults: [],
        });

        result.current.addEntry({
          id: 'exec-3',
          workflowId: 'workflow-2',
          workflowName: 'Workflow 2',
          timestamp: Date.now(),
          duration: 3000,
          status: 'success',
          inputs: {},
          outputs: {},
          stepResults: [],
        });
      });
    });

    it('should return all history when no workflowId provided', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      const allHistory = result.current.getHistory();
      expect(allHistory).toHaveLength(3);
    });

    it('should filter by workflowId when provided', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      const workflow1History = result.current.getHistory('workflow-1');
      expect(workflow1History).toHaveLength(2);
      expect(workflow1History.every((e) => e.workflowId === 'workflow-1')).toBe(true);

      const workflow2History = result.current.getHistory('workflow-2');
      expect(workflow2History).toHaveLength(1);
      expect(workflow2History[0]?.workflowId).toBe('workflow-2');
    });

    it('should return empty array for unknown workflowId', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      const unknownHistory = result.current.getHistory('unknown-workflow');
      expect(unknownHistory).toEqual([]);
    });

    it('should return history sorted by timestamp (newest first)', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      const history = result.current.getHistory('workflow-1');
      expect(history).toHaveLength(2);

      // Most recent first
      expect(history[0]?.id).toBe('exec-2');
      expect(history[1]?.id).toBe('exec-1');

      // Verify timestamps are in descending order
      for (let i = 0; i < history.length - 1; i++) {
        expect(history[i]!.timestamp).toBeGreaterThanOrEqual(history[i + 1]!.timestamp);
      }
    });
  });

  describe('getEntry', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      act(() => {
        result.current.addEntry({
          id: 'exec-1',
          workflowId: 'workflow-1',
          workflowName: 'Test Workflow',
          timestamp: Date.now(),
          duration: 5000,
          status: 'success',
          inputs: { param1: 'value1' },
          outputs: { result: 'success' },
          stepResults: [],
        });
      });
    });

    it('should return entry by ID', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      const entry = result.current.getEntry('exec-1');
      expect(entry).toBeDefined();
      expect(entry?.id).toBe('exec-1');
      expect(entry?.workflowId).toBe('workflow-1');
    });

    it('should return undefined for unknown ID', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      const entry = result.current.getEntry('unknown-id');
      expect(entry).toBeUndefined();
    });
  });

  describe('clearHistory', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      // Add test data
      act(() => {
        result.current.addEntry({
          id: 'exec-1',
          workflowId: 'workflow-1',
          workflowName: 'Workflow 1',
          timestamp: Date.now(),
          duration: 1000,
          status: 'success',
          inputs: {},
          outputs: {},
          stepResults: [],
        });

        result.current.addEntry({
          id: 'exec-2',
          workflowId: 'workflow-2',
          workflowName: 'Workflow 2',
          timestamp: Date.now(),
          duration: 2000,
          status: 'success',
          inputs: {},
          outputs: {},
          stepResults: [],
        });
      });
    });

    it('should clear all history when no workflowId provided', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      act(() => {
        result.current.clearHistory();
      });

      const allHistory = result.current.getHistory();
      expect(allHistory).toEqual([]);

      // Verify localStorage is cleared
      const stored = localStorageMock.getItem('workflow-execution-history');
      expect(stored).toBe('{}');
    });

    it('should clear history for specific workflow when workflowId provided', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      act(() => {
        result.current.clearHistory('workflow-1');
      });

      const workflow1History = result.current.getHistory('workflow-1');
      expect(workflow1History).toEqual([]);

      const workflow2History = result.current.getHistory('workflow-2');
      expect(workflow2History).toHaveLength(1);

      // Verify localStorage is updated correctly
      const stored = localStorageMock.getItem('workflow-execution-history');
      const parsed = JSON.parse(stored!);
      expect(parsed['workflow-1']).toBeUndefined();
      expect(parsed['workflow-2']).toHaveLength(1);
    });

    it('should persist clear operation to localStorage', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      act(() => {
        result.current.clearHistory();
      });

      const stored = localStorageMock.getItem('workflow-execution-history');
      expect(stored).toBe('{}');
    });
  });

  describe('localStorage Persistence', () => {
    it('should handle corrupted localStorage data gracefully', () => {
      // Corrupt localStorage
      localStorageMock.setItem('workflow-execution-history', 'invalid json');

      const { result } = renderHook(() => useExecutionHistoryStore());

      // Should fallback to empty history
      const history = result.current.getHistory();
      expect(history).toEqual([]);
    });

    it('should handle missing localStorage gracefully', () => {
      // Remove localStorage item
      localStorageMock.removeItem('workflow-execution-history');

      const { result } = renderHook(() => useExecutionHistoryStore());

      const history = result.current.getHistory();
      expect(history).toEqual([]);
    });

    it('should load and persist large history sets', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      // Add 25 entries across 5 workflows (5 each)
      for (let w = 1; w <= 5; w++) {
        for (let i = 1; i <= 5; i++) {
          act(() => {
            result.current.addEntry({
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

      // Reload from localStorage
      const stored = localStorageMock.getItem('workflow-execution-history');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!) as Record<string, ExecutionHistoryEntry[]>;
      expect(Object.keys(parsed)).toHaveLength(5);

      // Each workflow should have exactly 5 entries
      Object.values(parsed).forEach((entries: ExecutionHistoryEntry[]) => {
        expect(entries.length).toBe(5);
      });
    });
  });

  describe('Performance', () => {
    it('should query history in under 200ms even with 50+ entries', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      // Add 50+ entries across 10 workflows
      for (let w = 1; w <= 10; w++) {
        for (let i = 1; i <= 5; i++) {
          act(() => {
            result.current.addEntry({
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
      result.current.getHistory('workflow-5');
      const endTime = performance.now();

      const queryTime = endTime - startTime;
      expect(queryTime).toBeLessThan(200);
    });
  });

  describe('Entry Status Types', () => {
    it('should handle success status', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      act(() => {
        result.current.addEntry({
          id: 'exec-1',
          workflowId: 'workflow-1',
          workflowName: 'Test',
          timestamp: Date.now(),
          duration: 1000,
          status: 'success',
          inputs: {},
          outputs: { result: 'ok' },
          stepResults: [],
        });
      });

      const entry = result.current.getEntry('exec-1');
      expect(entry?.status).toBe('success');
      expect(entry?.error).toBeUndefined();
    });

    it('should handle failed status with error message', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      act(() => {
        result.current.addEntry({
          id: 'exec-1',
          workflowId: 'workflow-1',
          workflowName: 'Test',
          timestamp: Date.now(),
          duration: 1000,
          status: 'failed',
          inputs: {},
          outputs: {},
          error: 'Python script execution failed',
          stepResults: [],
        });
      });

      const entry = result.current.getEntry('exec-1');
      expect(entry?.status).toBe('failed');
      expect(entry?.error).toBe('Python script execution failed');
    });

    it('should handle cancelled status', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      act(() => {
        result.current.addEntry({
          id: 'exec-1',
          workflowId: 'workflow-1',
          workflowName: 'Test',
          timestamp: Date.now(),
          duration: 500,
          status: 'cancelled',
          inputs: {},
          outputs: {},
          stepResults: [],
        });
      });

      const entry = result.current.getEntry('exec-1');
      expect(entry?.status).toBe('cancelled');
    });
  });

  describe('Step Results', () => {
    it('should store step results with execution details', () => {
      const { result } = renderHook(() => useExecutionHistoryStore());

      const stepResults = [
        {
          stepId: 'step-1',
          status: 'success' as const,
          duration: 1000,
        },
        {
          stepId: 'step-2',
          status: 'failed' as const,
          duration: 500,
          error: 'Step failed',
        },
        {
          stepId: 'step-3',
          status: 'skipped' as const,
          duration: 0,
        },
      ];

      act(() => {
        result.current.addEntry({
          id: 'exec-1',
          workflowId: 'workflow-1',
          workflowName: 'Test',
          timestamp: Date.now(),
          duration: 1500,
          status: 'failed',
          inputs: {},
          outputs: {},
          error: 'Step 2 failed',
          stepResults,
        });
      });

      const entry = result.current.getEntry('exec-1');
      expect(entry?.stepResults).toEqual(stepResults);
      expect(entry?.stepResults).toHaveLength(3);
    });
  });
});
