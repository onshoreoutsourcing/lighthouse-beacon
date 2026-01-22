/**
 * ExecutionEvents Service
 *
 * Provides real-time workflow execution events for UI visualization.
 * Uses Node.js EventEmitter pattern for workflow and step lifecycle events.
 *
 * Event Types:
 * - workflow_started: Workflow begins execution
 * - step_started: Individual step begins
 * - step_completed: Step finishes successfully
 * - step_failed: Step fails with error
 * - workflow_completed: All steps finished
 *
 * Architecture:
 * - Singleton pattern for global event bus
 * - Type-safe event payloads
 * - Memory leak prevention via proper cleanup
 * - IPC-ready (events forwarded to renderer)
 *
 * Integration:
 * - PythonExecutor emits step events during execution
 * - IPC handlers forward events to renderer process
 * - Frontend subscribes for real-time canvas updates
 *
 * Usage:
 * const events = ExecutionEvents.getInstance();
 * events.on('step_started', (data) => { ... });
 * events.emitStepStarted(workflowId, stepId);
 */

import { EventEmitter } from 'node:events';
import log from 'electron-log';

/**
 * Workflow execution started event data
 */
export interface WorkflowStartedEvent {
  workflowId: string;
  startTime: number;
  totalSteps?: number;
}

/**
 * Step execution started event data
 */
export interface StepStartedEvent {
  workflowId: string;
  stepId: string;
  timestamp: number;
  stepIndex?: number;
}

/**
 * Step execution completed event data
 */
export interface StepCompletedEvent {
  workflowId: string;
  stepId: string;
  outputs: Record<string, unknown>;
  duration: number;
  timestamp: number;
}

/**
 * Step execution failed event data
 */
export interface StepFailedEvent {
  workflowId: string;
  stepId: string;
  error: string;
  duration: number;
  timestamp: number;
  exitCode?: number;
}

/**
 * Workflow execution completed event data
 */
export interface WorkflowCompletedEvent {
  workflowId: string;
  totalDuration: number;
  results: Record<string, unknown>;
  timestamp: number;
  successCount: number;
  failureCount: number;
}

/**
 * All execution event types
 */
export type ExecutionEventType =
  | 'workflow_started'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'workflow_completed';

/**
 * Type-safe event listener signatures
 */
export interface ExecutionEventMap {
  workflow_started: (data: WorkflowStartedEvent) => void;
  step_started: (data: StepStartedEvent) => void;
  step_completed: (data: StepCompletedEvent) => void;
  step_failed: (data: StepFailedEvent) => void;
  workflow_completed: (data: WorkflowCompletedEvent) => void;
}

/**
 * ExecutionEvents service - singleton event emitter for workflow execution
 */
export class ExecutionEvents extends EventEmitter {
  private static instance: ExecutionEvents | null = null;
  private activeWorkflows: Set<string> = new Set();

  private constructor() {
    super();
    // Set max listeners to prevent warnings (IPC + tests + multiple subscribers)
    this.setMaxListeners(50);
    log.debug('[ExecutionEvents] Service initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ExecutionEvents {
    if (!ExecutionEvents.instance) {
      ExecutionEvents.instance = new ExecutionEvents();
    }
    return ExecutionEvents.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  static resetInstance(): void {
    if (ExecutionEvents.instance) {
      ExecutionEvents.instance.removeAllListeners();
      ExecutionEvents.instance.activeWorkflows.clear();
      ExecutionEvents.instance = null;
    }
  }

  /**
   * Emit workflow started event
   */
  emitWorkflowStarted(workflowId: string, totalSteps?: number): void {
    const data: WorkflowStartedEvent = {
      workflowId,
      startTime: Date.now(),
      totalSteps,
    };

    this.activeWorkflows.add(workflowId);
    this.emit('workflow_started', data);

    log.info('[ExecutionEvents] Workflow started', {
      workflowId,
      totalSteps,
    });
  }

  /**
   * Emit step started event
   */
  emitStepStarted(workflowId: string, stepId: string, stepIndex?: number): void {
    const data: StepStartedEvent = {
      workflowId,
      stepId,
      timestamp: Date.now(),
      stepIndex,
    };

    this.emit('step_started', data);

    log.debug('[ExecutionEvents] Step started', {
      workflowId,
      stepId,
      stepIndex,
    });
  }

  /**
   * Emit step completed event
   */
  emitStepCompleted(
    workflowId: string,
    stepId: string,
    outputs: Record<string, unknown>,
    duration: number
  ): void {
    const data: StepCompletedEvent = {
      workflowId,
      stepId,
      outputs,
      duration,
      timestamp: Date.now(),
    };

    this.emit('step_completed', data);

    log.info('[ExecutionEvents] Step completed', {
      workflowId,
      stepId,
      duration,
      outputKeys: Object.keys(outputs),
    });
  }

  /**
   * Emit step failed event
   */
  emitStepFailed(
    workflowId: string,
    stepId: string,
    error: string,
    duration: number,
    exitCode?: number
  ): void {
    const data: StepFailedEvent = {
      workflowId,
      stepId,
      error,
      duration,
      timestamp: Date.now(),
      exitCode,
    };

    this.emit('step_failed', data);

    log.error('[ExecutionEvents] Step failed', {
      workflowId,
      stepId,
      error,
      duration,
      exitCode,
    });
  }

  /**
   * Emit workflow completed event
   */
  emitWorkflowCompleted(
    workflowId: string,
    totalDuration: number,
    results: Record<string, unknown>,
    successCount: number,
    failureCount: number
  ): void {
    const data: WorkflowCompletedEvent = {
      workflowId,
      totalDuration,
      results,
      timestamp: Date.now(),
      successCount,
      failureCount,
    };

    this.activeWorkflows.delete(workflowId);
    this.emit('workflow_completed', data);

    log.info('[ExecutionEvents] Workflow completed', {
      workflowId,
      totalDuration,
      successCount,
      failureCount,
    });
  }

  /**
   * Check if workflow is active
   */
  isWorkflowActive(workflowId: string): boolean {
    return this.activeWorkflows.has(workflowId);
  }

  /**
   * Get active workflow count
   */
  getActiveWorkflowCount(): number {
    return this.activeWorkflows.size;
  }

  /**
   * Clear all active workflows (for cleanup)
   */
  clearActiveWorkflows(): void {
    this.activeWorkflows.clear();
    log.debug('[ExecutionEvents] Cleared all active workflows');
  }

  /**
   * Type-safe event listener registration
   */
  on<K extends ExecutionEventType>(event: K, listener: ExecutionEventMap[K]): this {
    return super.on(event, listener);
  }

  /**
   * Type-safe one-time event listener
   */
  once<K extends ExecutionEventType>(event: K, listener: ExecutionEventMap[K]): this {
    return super.once(event, listener);
  }

  /**
   * Type-safe event listener removal
   */
  off<K extends ExecutionEventType>(event: K, listener: ExecutionEventMap[K]): this {
    return super.off(event, listener);
  }

  /**
   * Remove all listeners for specific event or all events
   */
  removeAllListeners(event?: ExecutionEventType): this {
    return super.removeAllListeners(event);
  }

  /**
   * Get listener count for event
   */
  listenerCount(event: ExecutionEventType): number {
    return super.listenerCount(event);
  }
}

/**
 * Export singleton instance getter
 */
export const getExecutionEvents = (): ExecutionEvents => ExecutionEvents.getInstance();
