/**
 * useExecutionState Hook
 *
 * Manages workflow execution state for real-time visualization.
 *
 * Features:
 * - Subscribes to workflow execution events via IPC
 * - Tracks step statuses (pending/running/success/error)
 * - Calculates execution progress (completed/total)
 * - Estimates time remaining based on average step duration
 * - Auto-cleanup on unmount (prevents memory leaks)
 *
 * Usage:
 * const { workflowId, isExecuting, stepStatuses, progress } = useExecutionState();
 * const { workflowId, isExecuting, stepStatuses, progress } = useExecutionState('workflow-123');
 *
 * @param workflowId - Optional workflow ID to filter events
 * @returns Execution state object with current workflow status
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  WorkflowStartedEvent,
  StepStartedEvent,
  StepCompletedEvent,
  StepFailedEvent,
  WorkflowCompletedEvent,
  Result,
} from '@shared/types';

/**
 * Step execution status
 */
export type StepStatus = 'pending' | 'running' | 'success' | 'error';

/**
 * Execution progress information
 */
export interface ExecutionProgress {
  completed: number;
  total: number;
  estimatedTimeRemaining: number | null; // milliseconds
}

/**
 * Execution state return type
 */
export interface ExecutionState {
  workflowId: string | null;
  isExecuting: boolean;
  stepStatuses: Record<string, StepStatus>;
  progress: ExecutionProgress;
}

/**
 * Hook to manage workflow execution state
 */
export function useExecutionState(filterWorkflowId?: string): ExecutionState {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({});
  const [progress, setProgress] = useState<ExecutionProgress>({
    completed: 0,
    total: 0,
    estimatedTimeRemaining: null,
  });

  // Track step durations for time estimation
  const stepStartTimes = useRef<Record<string, number>>({});
  const completedStepDurations = useRef<number[]>([]);
  const workflowStartTime = useRef<number | null>(null);

  /**
   * Calculate average step duration
   */
  const getAverageStepDuration = useCallback((): number => {
    if (completedStepDurations.current.length === 0) {
      return 0;
    }
    const sum = completedStepDurations.current.reduce((acc, duration) => acc + duration, 0);
    return sum / completedStepDurations.current.length;
  }, []);

  /**
   * Calculate estimated time remaining
   */
  const calculateEstimatedTimeRemaining = useCallback(
    (completed: number, total: number): number | null => {
      if (total === 0 || completed >= total) {
        return null;
      }

      const averageDuration = getAverageStepDuration();
      if (averageDuration === 0) {
        return null;
      }

      const remainingSteps = total - completed;
      return remainingSteps * averageDuration;
    },
    [getAverageStepDuration]
  );

  /**
   * Handle workflow started event
   */
  const handleWorkflowStarted = useCallback((event: WorkflowStartedEvent) => {
    setWorkflowId(event.workflowId);
    setIsExecuting(true);
    setStepStatuses({});
    setProgress({
      completed: 0,
      total: event.totalSteps || 0,
      estimatedTimeRemaining: null,
    });

    // Reset tracking
    stepStartTimes.current = {};
    completedStepDurations.current = [];
    workflowStartTime.current = event.startTime;
  }, []);

  /**
   * Handle step started event
   */
  const handleStepStarted = useCallback((event: StepStartedEvent) => {
    setStepStatuses((prev) => ({
      ...prev,
      [event.stepId]: 'running',
    }));

    // Track start time for duration calculation
    stepStartTimes.current[event.stepId] = event.timestamp;
  }, []);

  /**
   * Handle step completed event
   */
  const handleStepCompleted = useCallback(
    (event: StepCompletedEvent) => {
      setStepStatuses((prev) => ({
        ...prev,
        [event.stepId]: 'success',
      }));

      // Record duration
      completedStepDurations.current.push(event.duration);

      // Update progress
      setProgress((prev) => {
        const newCompleted = prev.completed + 1;
        return {
          completed: newCompleted,
          total: prev.total,
          estimatedTimeRemaining: calculateEstimatedTimeRemaining(newCompleted, prev.total),
        };
      });

      // Clean up start time
      delete stepStartTimes.current[event.stepId];
    },
    [calculateEstimatedTimeRemaining]
  );

  /**
   * Handle step failed event
   */
  const handleStepFailed = useCallback(
    (event: StepFailedEvent) => {
      setStepStatuses((prev) => ({
        ...prev,
        [event.stepId]: 'error',
      }));

      // Record duration (even for failed steps)
      completedStepDurations.current.push(event.duration);

      // Update progress (failed steps count as completed)
      setProgress((prev) => {
        const newCompleted = prev.completed + 1;
        return {
          completed: newCompleted,
          total: prev.total,
          estimatedTimeRemaining: calculateEstimatedTimeRemaining(newCompleted, prev.total),
        };
      });

      // Clean up start time
      delete stepStartTimes.current[event.stepId];
    },
    [calculateEstimatedTimeRemaining]
  );

  /**
   * Handle workflow completed event
   */
  const handleWorkflowCompleted = useCallback((_event: WorkflowCompletedEvent) => {
    setIsExecuting(false);
    setProgress((prev) => ({
      ...prev,
      estimatedTimeRemaining: null,
    }));

    // Clean up tracking
    stepStartTimes.current = {};
    completedStepDurations.current = [];
    workflowStartTime.current = null;
  }, []);

  /**
   * Subscribe to execution events on mount
   */
  useEffect(() => {
    const electronAPI = window.electronAPI;
    if (!electronAPI?.workflow?.execution) {
      console.error('[useExecutionState] electronAPI.workflow.execution not available');
      return;
    }

    // Subscribe to execution events (async)
    electronAPI.workflow.execution
      .subscribe(filterWorkflowId)
      .then((result) => {
        if (!result.success) {
          console.error(
            '[useExecutionState] Failed to subscribe to execution events:',
            result.error
          );
        }
      })
      .catch((error) => {
        console.error('[useExecutionState] Subscription error:', error);
      });

    // Register event listeners (sync)
    const cleanupWorkflowStarted =
      electronAPI.workflow.execution.onWorkflowStarted(handleWorkflowStarted);
    const cleanupStepStarted = electronAPI.workflow.execution.onStepStarted(handleStepStarted);
    const cleanupStepCompleted =
      electronAPI.workflow.execution.onStepCompleted(handleStepCompleted);
    const cleanupStepFailed = electronAPI.workflow.execution.onStepFailed(handleStepFailed);
    const cleanupWorkflowCompleted =
      electronAPI.workflow.execution.onWorkflowCompleted(handleWorkflowCompleted);

    // Cleanup on unmount
    return () => {
      // Unsubscribe (async, fire and forget)
      electronAPI.workflow.execution
        .unsubscribe()
        .then((result: Result<{ unsubscribed: boolean }>) => {
          if (!result.success) {
            console.error('[useExecutionState] Failed to unsubscribe:', result.error);
          }
        })
        .catch((error: unknown) => {
          console.error('[useExecutionState] Unsubscribe error:', error);
        });

      // Remove event listeners (sync)
      cleanupWorkflowStarted?.();
      cleanupStepStarted?.();
      cleanupStepCompleted?.();
      cleanupStepFailed?.();
      cleanupWorkflowCompleted?.();
    };
  }, [
    filterWorkflowId,
    handleWorkflowStarted,
    handleStepStarted,
    handleStepCompleted,
    handleStepFailed,
    handleWorkflowCompleted,
  ]);

  return {
    workflowId,
    isExecuting,
    stepStatuses,
    progress,
  };
}
