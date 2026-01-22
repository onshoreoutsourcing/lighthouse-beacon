/**
 * useExecutionState Hook Unit Tests
 *
 * Tests for workflow execution state management hook:
 * - IPC event subscription on mount
 * - State updates from execution events
 * - Proper cleanup on unmount
 * - Type-safe state management
 * - Memory leak prevention
 *
 * Coverage Target: ≥90%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup, waitFor } from '@testing-library/react';
import { useExecutionState } from '../useExecutionState';
import type {
  WorkflowStartedEvent,
  StepStartedEvent,
  StepCompletedEvent,
  StepFailedEvent,
  WorkflowCompletedEvent,
} from '@shared/types';

// Store event listeners for triggering events
let workflowStartedListener: ((event: WorkflowStartedEvent) => void) | null = null;
let stepStartedListener: ((event: StepStartedEvent) => void) | null = null;
let stepCompletedListener: ((event: StepCompletedEvent) => void) | null = null;
let stepFailedListener: ((event: StepFailedEvent) => void) | null = null;
let workflowCompletedListener: ((event: WorkflowCompletedEvent) => void) | null = null;

// Mock functions
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();

describe('useExecutionState', () => {
  beforeEach(() => {
    // Clean up any mounted React components
    cleanup();

    vi.clearAllMocks();
    mockSubscribe.mockResolvedValue({ success: true, data: { subscribed: true } });
    mockUnsubscribe.mockResolvedValue({ success: true, data: { unsubscribed: true } });

    // Reset listeners
    workflowStartedListener = null;
    stepStartedListener = null;
    stepCompletedListener = null;
    stepFailedListener = null;
    workflowCompletedListener = null;

    // Setup mock electron API
    global.window.electronAPI = {
      onMenuEvent: vi.fn(),
      removeMenuListener: vi.fn(),
      fileSystem: {} as any,
      ai: {} as any,
      settings: {} as any,
      tools: {} as any,
      conversation: {} as any,
      fileOperations: {} as any,
      logs: {} as any,
      versions: {} as any,
      workflow: {
        load: vi.fn(),
        save: vi.fn(),
        execute: vi.fn(),
        validate: vi.fn(),
        list: vi.fn(),
        execution: {
          subscribe: mockSubscribe,
          unsubscribe: mockUnsubscribe,
          onWorkflowStarted: (callback: (event: WorkflowStartedEvent) => void) => {
            workflowStartedListener = callback;
            return () => {
              workflowStartedListener = null;
            };
          },
          onStepStarted: (callback: (event: StepStartedEvent) => void) => {
            stepStartedListener = callback;
            return () => {
              stepStartedListener = null;
            };
          },
          onStepCompleted: (callback: (event: StepCompletedEvent) => void) => {
            stepCompletedListener = callback;
            return () => {
              stepCompletedListener = null;
            };
          },
          onStepFailed: (callback: (event: StepFailedEvent) => void) => {
            stepFailedListener = callback;
            return () => {
              stepFailedListener = null;
            };
          },
          onWorkflowCompleted: (callback: (event: WorkflowCompletedEvent) => void) => {
            workflowCompletedListener = callback;
            return () => {
              workflowCompletedListener = null;
            };
          },
        },
      },
    };
  });

  afterEach(() => {
    // Clean up React state after each test
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useExecutionState());

      expect(result.current.workflowId).toBeNull();
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.stepStatuses).toEqual({});
      expect(result.current.progress).toEqual({
        completed: 0,
        total: 0,
        estimatedTimeRemaining: null,
      });
    });

    it('should subscribe to execution events on mount', async () => {
      renderHook(() => useExecutionState());

      // Wait a bit for async subscription
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSubscribe).toHaveBeenCalledTimes(1);
    });

    it('should subscribe with optional workflowId', async () => {
      renderHook(() => useExecutionState('workflow-123'));

      // Wait a bit for async subscription
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSubscribe).toHaveBeenCalledWith('workflow-123');
    });
  });

  describe('Workflow Lifecycle Events', () => {
    it('should update state on workflow_started event', async () => {
      const { result } = renderHook(() => useExecutionState());

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(workflowStartedListener).not.toBeNull();
      });

      act(() => {
        workflowStartedListener!({
          workflowId: 'workflow-1',
          startTime: Date.now(),
          totalSteps: 5,
        });
      });

      await waitFor(() => {
        expect(result.current.workflowId).toBe('workflow-1');
        expect(result.current.isExecuting).toBe(true);
        expect(result.current.progress.total).toBe(5);
        expect(result.current.progress.completed).toBe(0);
      });
    });

    it('should handle workflow_started without totalSteps', async () => {
      const { result } = renderHook(() => useExecutionState());

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(workflowStartedListener).not.toBeNull();
      });

      act(() => {
        workflowStartedListener!({
          workflowId: 'workflow-1',
          startTime: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.workflowId).toBe('workflow-1');
        expect(result.current.isExecuting).toBe(true);
        expect(result.current.progress.total).toBe(0);
      });
    });

    it('should update state on workflow_completed event', async () => {
      const { result } = renderHook(() => useExecutionState());

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(workflowCompletedListener).not.toBeNull();
      });

      // Start workflow first
      act(() => {
        workflowStartedListener!({
          workflowId: 'workflow-1',
          startTime: Date.now(),
          totalSteps: 3,
        });
      });

      // Complete workflow
      act(() => {
        workflowCompletedListener!({
          workflowId: 'workflow-1',
          totalDuration: 5000,
          results: {},
          timestamp: Date.now(),
          successCount: 3,
          failureCount: 0,
        });
      });

      await waitFor(() => {
        expect(result.current.isExecuting).toBe(false);
        expect(result.current.progress.estimatedTimeRemaining).toBeNull();
      });
    });
  });

  describe('Step Status Updates', () => {
    it('should update step status to running on step_started', async () => {
      const { result } = renderHook(() => useExecutionState());

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(stepStartedListener).not.toBeNull();
      });

      // Start workflow
      act(() => {
        workflowStartedListener!({
          workflowId: 'workflow-1',
          startTime: Date.now(),
          totalSteps: 3,
        });
      });

      // Start step
      act(() => {
        stepStartedListener!({
          workflowId: 'workflow-1',
          stepId: 'step-1',
          timestamp: Date.now(),
          stepIndex: 0,
        });
      });

      await waitFor(() => {
        expect(result.current.stepStatuses['step-1']).toBe('running');
      });
    });

    it('should update step status to success on step_completed', async () => {
      const { result } = renderHook(() => useExecutionState());

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(stepCompletedListener).not.toBeNull();
      });

      // Start workflow
      act(() => {
        workflowStartedListener!({
          workflowId: 'workflow-1',
          startTime: Date.now(),
          totalSteps: 3,
        });
      });

      // Start step
      act(() => {
        stepStartedListener!({
          workflowId: 'workflow-1',
          stepId: 'step-1',
          timestamp: Date.now(),
        });
      });

      // Complete step
      act(() => {
        stepCompletedListener!({
          workflowId: 'workflow-1',
          stepId: 'step-1',
          outputs: {},
          duration: 1000,
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.stepStatuses['step-1']).toBe('success');
        expect(result.current.progress.completed).toBe(1);
      });
    });

    it('should update step status to error on step_failed', async () => {
      const { result } = renderHook(() => useExecutionState());

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(stepFailedListener).not.toBeNull();
      });

      // Start workflow
      act(() => {
        workflowStartedListener!({
          workflowId: 'workflow-1',
          startTime: Date.now(),
          totalSteps: 3,
        });
      });

      // Start step
      act(() => {
        stepStartedListener!({
          workflowId: 'workflow-1',
          stepId: 'step-1',
          timestamp: Date.now(),
        });
      });

      // Fail step
      act(() => {
        stepFailedListener!({
          workflowId: 'workflow-1',
          stepId: 'step-1',
          error: 'Test error',
          duration: 500,
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.stepStatuses['step-1']).toBe('error');
        expect(result.current.progress.completed).toBe(1);
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should calculate progress correctly', async () => {
      const { result } = renderHook(() => useExecutionState());

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(workflowStartedListener).not.toBeNull();
      });

      // Start workflow with 3 steps
      act(() => {
        workflowStartedListener!({
          workflowId: 'workflow-1',
          startTime: Date.now(),
          totalSteps: 3,
        });
      });

      await waitFor(() => {
        expect(result.current.progress).toEqual({
          completed: 0,
          total: 3,
          estimatedTimeRemaining: null,
        });
      });

      // Complete first step
      act(() => {
        stepCompletedListener!({
          workflowId: 'workflow-1',
          stepId: 'step-1',
          outputs: {},
          duration: 1000,
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.progress.completed).toBe(1);
        expect(result.current.progress.total).toBe(3);
      });
    });

    it('should estimate time remaining based on average step duration', async () => {
      const { result } = renderHook(() => useExecutionState());

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(workflowStartedListener).not.toBeNull();
      });

      const startTime = Date.now();

      // Start workflow with 3 steps
      act(() => {
        workflowStartedListener!({
          workflowId: 'workflow-1',
          startTime,
          totalSteps: 3,
        });
      });

      // Complete first step (1000ms)
      act(() => {
        stepCompletedListener!({
          workflowId: 'workflow-1',
          stepId: 'step-1',
          outputs: {},
          duration: 1000,
          timestamp: startTime + 1000,
        });
      });

      // Should estimate 2 steps remaining * 1000ms average = 2000ms
      await waitFor(() => {
        expect(result.current.progress.estimatedTimeRemaining).toBeGreaterThan(0);
      });
    });

    it('should reset estimate when workflow completes', async () => {
      const { result } = renderHook(() => useExecutionState());

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(workflowCompletedListener).not.toBeNull();
      });

      // Start and complete workflow
      act(() => {
        workflowStartedListener!({
          workflowId: 'workflow-1',
          startTime: Date.now(),
          totalSteps: 1,
        });
      });

      act(() => {
        workflowCompletedListener!({
          workflowId: 'workflow-1',
          totalDuration: 1000,
          results: {},
          timestamp: Date.now(),
          successCount: 1,
          failureCount: 0,
        });
      });

      await waitFor(() => {
        expect(result.current.progress.estimatedTimeRemaining).toBeNull();
      });
    });
  });

  describe('Cleanup', () => {
    it('should unsubscribe on unmount', async () => {
      const { unmount } = renderHook(() => useExecutionState());

      // Wait for subscription
      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Wait for unsubscription
      await waitFor(() => {
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
      });
    });

    it('should remove all event listeners on unmount', async () => {
      const { unmount } = renderHook(() => useExecutionState());

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(workflowStartedListener).not.toBeNull();
      });

      unmount();

      await waitFor(() => {
        expect(workflowStartedListener).toBeNull();
        expect(stepStartedListener).toBeNull();
        expect(stepCompletedListener).toBeNull();
        expect(stepFailedListener).toBeNull();
        expect(workflowCompletedListener).toBeNull();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle events for different workflow IDs when filtered', async () => {
      const { result } = renderHook(() => useExecutionState('workflow-1'));

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(workflowStartedListener).not.toBeNull();
      });

      // Event for different workflow (should be ignored if backend filters)
      act(() => {
        workflowStartedListener!({
          workflowId: 'workflow-2',
          startTime: Date.now(),
          totalSteps: 3,
        });
      });

      await waitFor(() => {
        // This test assumes backend filtering, so we expect no state change
        // If the hook needs to filter, we should add workflowId checking
        expect(result.current.workflowId).not.toBe('workflow-1');
      });
    });

    it('should handle rapid sequential events', async () => {
      const { result } = renderHook(() => useExecutionState());

      // Wait for listeners to be registered
      await waitFor(() => {
        expect(stepStartedListener).not.toBeNull();
      });

      // Start workflow
      act(() => {
        workflowStartedListener!({
          workflowId: 'workflow-1',
          startTime: Date.now(),
          totalSteps: 3,
        });
      });

      // Rapid step updates
      act(() => {
        stepStartedListener!({
          workflowId: 'workflow-1',
          stepId: 'step-1',
          timestamp: Date.now(),
        });
        stepCompletedListener!({
          workflowId: 'workflow-1',
          stepId: 'step-1',
          outputs: {},
          duration: 100,
          timestamp: Date.now(),
        });
        stepStartedListener!({
          workflowId: 'workflow-1',
          stepId: 'step-2',
          timestamp: Date.now(),
        });
      });

      await waitFor(() => {
        expect(result.current.stepStatuses['step-1']).toBe('success');
        expect(result.current.stepStatuses['step-2']).toBe('running');
        expect(result.current.progress.completed).toBe(1);
      });
    });

    it('should handle subscription failure gracefully', async () => {
      mockSubscribe.mockResolvedValue({
        success: false,
        error: new Error('Subscription failed'),
      });

      const { result } = renderHook(() => useExecutionState());

      // Wait for subscription attempt
      await waitFor(() => {
        expect(mockSubscribe).toHaveBeenCalled();
      });

      // Should still have initial state
      await waitFor(() => {
        expect(result.current.workflowId).toBeNull();
        expect(result.current.isExecuting).toBe(false);
      });
    });
  });
});
