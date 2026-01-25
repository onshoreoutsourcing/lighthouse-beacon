/**
 * Workflow Execution IPC Handlers
 *
 * Provides IPC handlers for workflow execution event subscription.
 * Forwards ExecutionEvents to renderer process for real-time visualization.
 *
 * Handlers:
 * - workflow:execution:subscribe - Register renderer for execution events
 * - workflow:execution:unsubscribe - Clean up event subscriptions
 *
 * Architecture:
 * - Follows Epic 1 IPC patterns (ipcMain.handle)
 * - Prevents memory leaks (proper cleanup on unsubscribe)
 * - Type-safe event forwarding
 * - Supports multiple concurrent workflows
 *
 * Security:
 * - Only authorized renderer processes receive events
 * - Event subscriptions tied to window lifecycle
 * - Automatic cleanup on window close
 *
 * Usage:
 * // Register handlers during app initialization
 * registerWorkflowExecutionHandlers();
 *
 * // Cleanup during app shutdown
 * await unregisterWorkflowExecutionHandlers();
 */

import { ipcMain, BrowserWindow } from 'electron';
import type { Result } from '@shared/types';
import {
  ExecutionEvents,
  type WorkflowStartedEvent,
  type StepStartedEvent,
  type StepCompletedEvent,
  type StepFailedEvent,
  type WorkflowCompletedEvent,
} from '../services/workflow/ExecutionEvents';
import { logger } from '@main/logger';

/**
 * IPC channel names for workflow execution
 */
export const WORKFLOW_EXECUTION_CHANNELS = {
  SUBSCRIBE: 'workflow:execution:subscribe',
  UNSUBSCRIBE: 'workflow:execution:unsubscribe',
  // Event channels (sent from main to renderer)
  WORKFLOW_STARTED: 'workflow:execution:started',
  STEP_STARTED: 'workflow:execution:step-started',
  STEP_COMPLETED: 'workflow:execution:step-completed',
  STEP_FAILED: 'workflow:execution:step-failed',
  WORKFLOW_COMPLETED: 'workflow:execution:completed',
} as const;

/**
 * Subscription state tracker
 */
interface SubscriptionState {
  windowId: number;
  workflowId?: string; // Optional: subscribe to specific workflow only
  listeners: {
    workflowStarted: (data: WorkflowStartedEvent) => void;
    stepStarted: (data: StepStartedEvent) => void;
    stepCompleted: (data: StepCompletedEvent) => void;
    stepFailed: (data: StepFailedEvent) => void;
    workflowCompleted: (data: WorkflowCompletedEvent) => void;
  };
}

// Active subscriptions (windowId -> SubscriptionState)
const activeSubscriptions = new Map<number, SubscriptionState>();

// Singleton ExecutionEvents instance
let executionEvents: ExecutionEvents | null = null;

/**
 * Get or create ExecutionEvents instance
 */
function getExecutionEvents(): ExecutionEvents {
  if (!executionEvents) {
    executionEvents = ExecutionEvents.getInstance();
  }
  return executionEvents;
}

// Removed unused helper functions - kept for potential future use in comments
// function getMainWindow(): BrowserWindow | null {
//   const windows = BrowserWindow.getAllWindows();
//   return windows.length > 0 ? (windows[0] ?? null) : null;
// }
//
// function getWindowById(windowId: number): BrowserWindow | null {
//   return BrowserWindow.fromId(windowId);
// }

/**
 * Forward execution events to specific renderer window
 */
function createEventListeners(
  window: BrowserWindow,
  workflowId?: string
): SubscriptionState['listeners'] {
  const events = getExecutionEvents();

  // Workflow started listener
  const workflowStartedListener = (data: WorkflowStartedEvent) => {
    // Filter by workflow if specified
    if (workflowId && data.workflowId !== workflowId) {
      return;
    }

    if (!window.isDestroyed()) {
      window.webContents.send(WORKFLOW_EXECUTION_CHANNELS.WORKFLOW_STARTED, data);
      logger.debug('[WorkflowExecution IPC] Sent workflow_started event', {
        windowId: window.id,
        workflowId: data.workflowId,
      });
    }
  };

  // Step started listener
  const stepStartedListener = (data: StepStartedEvent) => {
    if (workflowId && data.workflowId !== workflowId) {
      return;
    }

    if (!window.isDestroyed()) {
      window.webContents.send(WORKFLOW_EXECUTION_CHANNELS.STEP_STARTED, data);
      logger.debug('[WorkflowExecution IPC] Sent step_started event', {
        windowId: window.id,
        workflowId: data.workflowId,
        stepId: data.stepId,
      });
    }
  };

  // Step completed listener
  const stepCompletedListener = (data: StepCompletedEvent) => {
    if (workflowId && data.workflowId !== workflowId) {
      return;
    }

    if (!window.isDestroyed()) {
      window.webContents.send(WORKFLOW_EXECUTION_CHANNELS.STEP_COMPLETED, data);
      logger.debug('[WorkflowExecution IPC] Sent step_completed event', {
        windowId: window.id,
        workflowId: data.workflowId,
        stepId: data.stepId,
      });
    }
  };

  // Step failed listener
  const stepFailedListener = (data: StepFailedEvent) => {
    if (workflowId && data.workflowId !== workflowId) {
      return;
    }

    if (!window.isDestroyed()) {
      window.webContents.send(WORKFLOW_EXECUTION_CHANNELS.STEP_FAILED, data);
      logger.debug('[WorkflowExecution IPC] Sent step_failed event', {
        windowId: window.id,
        workflowId: data.workflowId,
        stepId: data.stepId,
      });
    }
  };

  // Workflow completed listener
  const workflowCompletedListener = (data: WorkflowCompletedEvent) => {
    if (workflowId && data.workflowId !== workflowId) {
      return;
    }

    if (!window.isDestroyed()) {
      window.webContents.send(WORKFLOW_EXECUTION_CHANNELS.WORKFLOW_COMPLETED, data);
      logger.info('[WorkflowExecution IPC] Sent workflow_completed event', {
        windowId: window.id,
        workflowId: data.workflowId,
      });
    }
  };

  // Register all listeners
  events.on('workflow_started', workflowStartedListener);
  events.on('step_started', stepStartedListener);
  events.on('step_completed', stepCompletedListener);
  events.on('step_failed', stepFailedListener);
  events.on('workflow_completed', workflowCompletedListener);

  return {
    workflowStarted: workflowStartedListener,
    stepStarted: stepStartedListener,
    stepCompleted: stepCompletedListener,
    stepFailed: stepFailedListener,
    workflowCompleted: workflowCompletedListener,
  };
}

/**
 * Remove event listeners and cleanup subscription
 */
function removeEventListeners(subscription: SubscriptionState): void {
  const events = getExecutionEvents();

  events.off('workflow_started', subscription.listeners.workflowStarted);
  events.off('step_started', subscription.listeners.stepStarted);
  events.off('step_completed', subscription.listeners.stepCompleted);
  events.off('step_failed', subscription.listeners.stepFailed);
  events.off('workflow_completed', subscription.listeners.workflowCompleted);

  logger.debug('[WorkflowExecution IPC] Removed event listeners', {
    windowId: subscription.windowId,
  });
}

/**
 * Register workflow execution IPC handlers
 */
export function registerWorkflowExecutionHandlers(): void {
  /**
   * WORKFLOW:EXECUTION:SUBSCRIBE
   * Subscribe renderer process to workflow execution events
   */
  ipcMain.handle(
    WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE,
    (event, workflowId?: string): Result<{ subscribed: boolean }> => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (!window) {
          return {
            success: false,
            error: new Error('Window not found for subscription'),
          };
        }

        const windowId = window.id;

        // Unsubscribe existing subscription if any
        if (activeSubscriptions.has(windowId)) {
          const existingSubscription = activeSubscriptions.get(windowId)!;
          removeEventListeners(existingSubscription);
          activeSubscriptions.delete(windowId);
        }

        // Create new subscription
        const listeners = createEventListeners(window, workflowId);
        const subscription: SubscriptionState = {
          windowId,
          workflowId,
          listeners,
        };

        activeSubscriptions.set(windowId, subscription);

        // Cleanup on window close
        window.once('closed', () => {
          if (activeSubscriptions.has(windowId)) {
            const sub = activeSubscriptions.get(windowId)!;
            removeEventListeners(sub);
            activeSubscriptions.delete(windowId);
            logger.debug('[WorkflowExecution IPC] Auto-cleanup on window close', { windowId });
          }
        });

        logger.info('[WorkflowExecution IPC] Subscribed to execution events', {
          windowId,
          workflowId: workflowId || 'all',
        });

        return {
          success: true,
          data: { subscribed: true },
        };
      } catch (error) {
        logger.error('[WorkflowExecution IPC] Subscription failed', { error });
        return {
          success: false,
          error:
            error instanceof Error ? error : new Error('Failed to subscribe to execution events'),
        };
      }
    }
  );

  /**
   * WORKFLOW:EXECUTION:UNSUBSCRIBE
   * Unsubscribe renderer process from workflow execution events
   */
  ipcMain.handle(
    WORKFLOW_EXECUTION_CHANNELS.UNSUBSCRIBE,
    (event): Result<{ unsubscribed: boolean }> => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (!window) {
          return {
            success: false,
            error: new Error('Window not found for unsubscription'),
          };
        }

        const windowId = window.id;

        if (activeSubscriptions.has(windowId)) {
          const subscription = activeSubscriptions.get(windowId)!;
          removeEventListeners(subscription);
          activeSubscriptions.delete(windowId);

          logger.info('[WorkflowExecution IPC] Unsubscribed from execution events', { windowId });

          return {
            success: true,
            data: { unsubscribed: true },
          };
        }

        // Not subscribed (not an error)
        return {
          success: true,
          data: { unsubscribed: false },
        };
      } catch (error) {
        logger.error('[WorkflowExecution IPC] Unsubscription failed', { error });
        return {
          success: false,
          error:
            error instanceof Error
              ? error
              : new Error('Failed to unsubscribe from execution events'),
        };
      }
    }
  );

  logger.info('[WorkflowExecution IPC] Workflow execution handlers registered');
}

/**
 * Unregister workflow execution IPC handlers
 * Call this during app cleanup
 */
export function unregisterWorkflowExecutionHandlers(): void {
  // Remove all IPC handlers
  ipcMain.removeHandler(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE);
  ipcMain.removeHandler(WORKFLOW_EXECUTION_CHANNELS.UNSUBSCRIBE);

  // Clean up all active subscriptions
  for (const subscription of activeSubscriptions.values()) {
    removeEventListeners(subscription);
  }
  activeSubscriptions.clear();

  // Reset ExecutionEvents instance
  executionEvents = null;

  logger.info('[WorkflowExecution IPC] Workflow execution handlers unregistered');
}

/**
 * Get active subscription count (for testing/debugging)
 */
export function getActiveSubscriptionCount(): number {
  return activeSubscriptions.size;
}
