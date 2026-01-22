/**
 * ExecutionEvents Unit Tests
 *
 * Tests for workflow execution event emitter:
 * - Event emission (all 5 event types)
 * - Event listener registration/removal
 * - Singleton pattern
 * - Active workflow tracking
 * - Memory leak prevention
 *
 * Coverage Target: ≥90%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExecutionEvents } from '../ExecutionEvents';

describe('ExecutionEvents', () => {
  let events: ExecutionEvents;

  beforeEach(() => {
    // Reset singleton before each test
    ExecutionEvents.resetInstance();
    events = ExecutionEvents.getInstance();
  });

  afterEach(() => {
    // Clean up after each test
    events.removeAllListeners();
    events.clearActiveWorkflows();
    ExecutionEvents.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance on multiple calls', () => {
      const instance1 = ExecutionEvents.getInstance();
      const instance2 = ExecutionEvents.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create new instance after reset', () => {
      const instance1 = ExecutionEvents.getInstance();
      ExecutionEvents.resetInstance();
      const instance2 = ExecutionEvents.getInstance();

      expect(instance1).not.toBe(instance2);
    });

    it('should clear listeners on reset', () => {
      const listener = vi.fn();
      events.on('workflow_started', listener);

      ExecutionEvents.resetInstance();
      const newEvents = ExecutionEvents.getInstance();
      newEvents.emitWorkflowStarted('workflow-1');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Event Emission - workflow_started', () => {
    it('should emit workflow_started event with correct data', () => {
      const listener = vi.fn();
      events.on('workflow_started', listener);

      const beforeTime = Date.now();
      events.emitWorkflowStarted('workflow-1', 5);
      const afterTime = Date.now();

      expect(listener).toHaveBeenCalledTimes(1);
      const eventData = listener.mock.calls[0]![0];
      expect(eventData).toMatchObject({
        workflowId: 'workflow-1',
        totalSteps: 5,
      });
      expect(eventData.startTime).toBeGreaterThanOrEqual(beforeTime);
      expect(eventData.startTime).toBeLessThanOrEqual(afterTime);
    });

    it('should mark workflow as active', () => {
      events.emitWorkflowStarted('workflow-1');

      expect(events.isWorkflowActive('workflow-1')).toBe(true);
      expect(events.getActiveWorkflowCount()).toBe(1);
    });

    it('should handle workflow_started without totalSteps', () => {
      const listener = vi.fn();
      events.on('workflow_started', listener);

      events.emitWorkflowStarted('workflow-1');

      expect(listener).toHaveBeenCalledTimes(1);
      const eventData = listener.mock.calls[0]![0];
      expect(eventData.totalSteps).toBeUndefined();
    });
  });

  describe('Event Emission - step_started', () => {
    it('should emit step_started event with correct data', () => {
      const listener = vi.fn();
      events.on('step_started', listener);

      const beforeTime = Date.now();
      events.emitStepStarted('workflow-1', 'step-1', 0);
      const afterTime = Date.now();

      expect(listener).toHaveBeenCalledTimes(1);
      const eventData = listener.mock.calls[0]![0];
      expect(eventData).toMatchObject({
        workflowId: 'workflow-1',
        stepId: 'step-1',
        stepIndex: 0,
      });
      expect(eventData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(eventData.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should handle step_started without stepIndex', () => {
      const listener = vi.fn();
      events.on('step_started', listener);

      events.emitStepStarted('workflow-1', 'step-1');

      expect(listener).toHaveBeenCalledTimes(1);
      const eventData = listener.mock.calls[0]![0];
      expect(eventData.stepIndex).toBeUndefined();
    });
  });

  describe('Event Emission - step_completed', () => {
    it('should emit step_completed event with correct data', () => {
      const listener = vi.fn();
      events.on('step_completed', listener);

      const outputs = { result: 'success', count: 42 };
      const beforeTime = Date.now();
      events.emitStepCompleted('workflow-1', 'step-1', outputs, 1500);
      const afterTime = Date.now();

      expect(listener).toHaveBeenCalledTimes(1);
      const eventData = listener.mock.calls[0]![0];
      expect(eventData).toMatchObject({
        workflowId: 'workflow-1',
        stepId: 'step-1',
        outputs,
        duration: 1500,
      });
      expect(eventData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(eventData.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should handle empty outputs', () => {
      const listener = vi.fn();
      events.on('step_completed', listener);

      events.emitStepCompleted('workflow-1', 'step-1', {}, 100);

      expect(listener).toHaveBeenCalledTimes(1);
      const eventData = listener.mock.calls[0]![0];
      expect(eventData.outputs).toEqual({});
    });
  });

  describe('Event Emission - step_failed', () => {
    it('should emit step_failed event with correct data', () => {
      const listener = vi.fn();
      events.on('step_failed', listener);

      const beforeTime = Date.now();
      events.emitStepFailed('workflow-1', 'step-1', 'Script timed out', 30000, -1);
      const afterTime = Date.now();

      expect(listener).toHaveBeenCalledTimes(1);
      const eventData = listener.mock.calls[0]![0];
      expect(eventData).toMatchObject({
        workflowId: 'workflow-1',
        stepId: 'step-1',
        error: 'Script timed out',
        duration: 30000,
        exitCode: -1,
      });
      expect(eventData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(eventData.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should handle step_failed without exitCode', () => {
      const listener = vi.fn();
      events.on('step_failed', listener);

      events.emitStepFailed('workflow-1', 'step-1', 'Unknown error', 500);

      expect(listener).toHaveBeenCalledTimes(1);
      const eventData = listener.mock.calls[0]![0];
      expect(eventData.exitCode).toBeUndefined();
    });
  });

  describe('Event Emission - workflow_completed', () => {
    it('should emit workflow_completed event with correct data', () => {
      const listener = vi.fn();
      events.on('workflow_completed', listener);

      // Start workflow first
      events.emitWorkflowStarted('workflow-1');

      const results = { finalOutput: 'done', totalProcessed: 100 };
      const beforeTime = Date.now();
      events.emitWorkflowCompleted('workflow-1', 5000, results, 3, 1);
      const afterTime = Date.now();

      expect(listener).toHaveBeenCalledTimes(1);
      const eventData = listener.mock.calls[0]![0];
      expect(eventData).toMatchObject({
        workflowId: 'workflow-1',
        totalDuration: 5000,
        results,
        successCount: 3,
        failureCount: 1,
      });
      expect(eventData.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(eventData.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should mark workflow as inactive', () => {
      events.emitWorkflowStarted('workflow-1');
      expect(events.isWorkflowActive('workflow-1')).toBe(true);

      events.emitWorkflowCompleted('workflow-1', 1000, {}, 1, 0);

      expect(events.isWorkflowActive('workflow-1')).toBe(false);
      expect(events.getActiveWorkflowCount()).toBe(0);
    });
  });

  describe('Event Listener Management', () => {
    it('should register and call multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      events.on('step_started', listener1);
      events.on('step_started', listener2);

      events.emitStepStarted('workflow-1', 'step-1');

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should remove specific listener', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      events.on('step_started', listener1);
      events.on('step_started', listener2);

      events.off('step_started', listener1);
      events.emitStepStarted('workflow-1', 'step-1');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should handle once() for one-time listeners', () => {
      const listener = vi.fn();

      events.once('workflow_started', listener);

      events.emitWorkflowStarted('workflow-1');
      events.emitWorkflowStarted('workflow-2');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should remove all listeners for specific event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      events.on('step_started', listener1);
      events.on('step_started', listener2);
      events.on('step_completed', listener3);

      events.removeAllListeners('step_started');

      events.emitStepStarted('workflow-1', 'step-1');
      events.emitStepCompleted('workflow-1', 'step-1', {}, 100);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).toHaveBeenCalledTimes(1);
    });

    it('should remove all listeners for all events', () => {
      // Reset to get fresh instance without any residual listeners
      ExecutionEvents.resetInstance();
      const freshEvents = ExecutionEvents.getInstance();

      const listener1 = vi.fn();
      const listener2 = vi.fn();

      freshEvents.on('step_started', listener1);
      freshEvents.on('step_completed', listener2);

      const initialStepStartedCount = freshEvents.listenerCount('step_started');
      const initialStepCompletedCount = freshEvents.listenerCount('step_completed');

      // Clear listeners for specific events
      freshEvents.removeAllListeners('step_started');
      freshEvents.removeAllListeners('step_completed');

      // Verify listener counts decreased
      expect(freshEvents.listenerCount('step_started')).toBe(initialStepStartedCount - 1);
      expect(freshEvents.listenerCount('step_completed')).toBe(initialStepCompletedCount - 1);

      // Emit events and verify our listeners not called
      freshEvents.emitStepStarted('workflow-1', 'step-1');
      freshEvents.emitStepCompleted('workflow-1', 'step-1', {}, 100);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should return correct listener count', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      expect(events.listenerCount('step_started')).toBe(0);

      events.on('step_started', listener1);
      expect(events.listenerCount('step_started')).toBe(1);

      events.on('step_started', listener2);
      expect(events.listenerCount('step_started')).toBe(2);

      events.off('step_started', listener1);
      expect(events.listenerCount('step_started')).toBe(1);
    });
  });

  describe('Active Workflow Tracking', () => {
    it('should track multiple active workflows', () => {
      events.emitWorkflowStarted('workflow-1');
      events.emitWorkflowStarted('workflow-2');
      events.emitWorkflowStarted('workflow-3');

      expect(events.getActiveWorkflowCount()).toBe(3);
      expect(events.isWorkflowActive('workflow-1')).toBe(true);
      expect(events.isWorkflowActive('workflow-2')).toBe(true);
      expect(events.isWorkflowActive('workflow-3')).toBe(true);
    });

    it('should handle workflow completion', () => {
      events.emitWorkflowStarted('workflow-1');
      events.emitWorkflowStarted('workflow-2');

      events.emitWorkflowCompleted('workflow-1', 1000, {}, 1, 0);

      expect(events.getActiveWorkflowCount()).toBe(1);
      expect(events.isWorkflowActive('workflow-1')).toBe(false);
      expect(events.isWorkflowActive('workflow-2')).toBe(true);
    });

    it('should clear all active workflows', () => {
      events.emitWorkflowStarted('workflow-1');
      events.emitWorkflowStarted('workflow-2');

      events.clearActiveWorkflows();

      expect(events.getActiveWorkflowCount()).toBe(0);
      expect(events.isWorkflowActive('workflow-1')).toBe(false);
      expect(events.isWorkflowActive('workflow-2')).toBe(false);
    });
  });

  describe('Complete Workflow Lifecycle', () => {
    it('should emit all events in correct order', () => {
      const workflowStartedListener = vi.fn();
      const stepStartedListener = vi.fn();
      const stepCompletedListener = vi.fn();
      const workflowCompletedListener = vi.fn();

      events.on('workflow_started', workflowStartedListener);
      events.on('step_started', stepStartedListener);
      events.on('step_completed', stepCompletedListener);
      events.on('workflow_completed', workflowCompletedListener);

      // Workflow lifecycle
      events.emitWorkflowStarted('workflow-1', 2);
      events.emitStepStarted('workflow-1', 'step-1', 0);
      events.emitStepCompleted('workflow-1', 'step-1', { result: 'ok' }, 100);
      events.emitStepStarted('workflow-1', 'step-2', 1);
      events.emitStepCompleted('workflow-1', 'step-2', { result: 'ok' }, 150);
      events.emitWorkflowCompleted('workflow-1', 250, { final: 'done' }, 2, 0);

      expect(workflowStartedListener).toHaveBeenCalledTimes(1);
      expect(stepStartedListener).toHaveBeenCalledTimes(2);
      expect(stepCompletedListener).toHaveBeenCalledTimes(2);
      expect(workflowCompletedListener).toHaveBeenCalledTimes(1);
    });

    it('should handle workflow with failed steps', () => {
      const stepFailedListener = vi.fn();
      const workflowCompletedListener = vi.fn();

      events.on('step_failed', stepFailedListener);
      events.on('workflow_completed', workflowCompletedListener);

      events.emitWorkflowStarted('workflow-1', 2);
      events.emitStepStarted('workflow-1', 'step-1', 0);
      events.emitStepCompleted('workflow-1', 'step-1', {}, 100);
      events.emitStepStarted('workflow-1', 'step-2', 1);
      events.emitStepFailed('workflow-1', 'step-2', 'Timeout', 30000, -1);
      events.emitWorkflowCompleted('workflow-1', 30100, {}, 1, 1);

      expect(stepFailedListener).toHaveBeenCalledTimes(1);
      expect(workflowCompletedListener).toHaveBeenCalledTimes(1);

      const completedData = workflowCompletedListener.mock.calls[0]![0];
      expect(completedData.successCount).toBe(1);
      expect(completedData.failureCount).toBe(1);
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should not exceed max listeners threshold', () => {
      // Add many listeners (should not throw warning)
      for (let i = 0; i < 60; i++) {
        events.on('step_started', vi.fn());
      }

      expect(events.listenerCount('step_started')).toBe(60);
    });

    it('should properly clean up on reset', () => {
      const listener = vi.fn();
      events.on('workflow_started', listener);
      events.emitWorkflowStarted('workflow-1');

      ExecutionEvents.resetInstance();
      const newEvents = ExecutionEvents.getInstance();
      newEvents.emitWorkflowStarted('workflow-2');

      // Old listener should not be called
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0]![0].workflowId).toBe('workflow-1');
    });
  });
});
