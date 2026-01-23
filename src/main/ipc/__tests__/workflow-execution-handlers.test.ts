/**
 * Workflow Execution IPC Handlers Integration Tests
 *
 * Tests for workflow execution event subscription via IPC:
 * - Subscribe/unsubscribe handlers
 * - Event forwarding to renderer
 * - Memory leak prevention
 * - Window lifecycle integration
 *
 * Coverage Target: ≥90%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'node:events';

// Mock Electron modules BEFORE any imports
vi.mock('electron', () => {
  const ipcMain = new EventEmitter();
  (ipcMain as any).handle = vi.fn();
  (ipcMain as any).removeHandler = vi.fn();

  return {
    ipcMain: ipcMain,
    BrowserWindow: {
      getAllWindows: vi.fn(),
      fromWebContents: vi.fn(),
      fromId: vi.fn(),
    },
    app: {
      getPath: vi.fn(() => '/mock/path'),
      getName: vi.fn(() => 'MockApp'),
    },
  };
});

// Import AFTER mocks
import { ExecutionEvents } from '../../services/workflow/ExecutionEvents';
import {
  registerWorkflowExecutionHandlers,
  unregisterWorkflowExecutionHandlers,
  getActiveSubscriptionCount,
  WORKFLOW_EXECUTION_CHANNELS,
} from '../workflow-execution-handlers';
import { ipcMain, BrowserWindow } from 'electron';

// Test fixtures
const mockWebContents = {
  send: vi.fn(),
};

const mockWindow = {
  id: 1,
  webContents: mockWebContents,
  isDestroyed: vi.fn(() => false),
  once: vi.fn(),
};

const mockEvent = {
  sender: mockWebContents,
};

describe('Workflow Execution IPC Handlers', () => {
  let executionEvents: ExecutionEvents;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockWebContents.send.mockClear();
    mockWindow.once.mockClear();
    mockWindow.isDestroyed.mockReturnValue(false);

    // Setup BrowserWindow mocks
    (BrowserWindow.getAllWindows as any).mockReturnValue([mockWindow]);
    (BrowserWindow.fromWebContents as any).mockReturnValue(mockWindow);
    (BrowserWindow.fromId as any).mockReturnValue(mockWindow);

    // Setup ipcMain.handle mock
    (ipcMain.handle as any).mockImplementation((channel: string, handler: any) => {
      (ipcMain as any).on(channel, handler);
    });
    (ipcMain.removeHandler as any).mockImplementation((channel: string) => {
      (ipcMain as any).removeAllListeners(channel);
    });

    // Reset ExecutionEvents
    ExecutionEvents.resetInstance();
    executionEvents = ExecutionEvents.getInstance();

    // Register handlers
    registerWorkflowExecutionHandlers();
  });

  afterEach(() => {
    // Cleanup
    unregisterWorkflowExecutionHandlers();
    ExecutionEvents.resetInstance();
  });

  describe('Handler Registration', () => {
    it('should register subscribe and unsubscribe handlers', () => {
      expect(ipcMain.handle).toHaveBeenCalledWith(
        WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE,
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        WORKFLOW_EXECUTION_CHANNELS.UNSUBSCRIBE,
        expect.any(Function)
      );
    });

    it('should unregister handlers on cleanup', () => {
      unregisterWorkflowExecutionHandlers();

      expect(ipcMain.removeHandler).toHaveBeenCalledWith(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(WORKFLOW_EXECUTION_CHANNELS.UNSUBSCRIBE);
    });
  });

  describe('Subscribe Handler', () => {
    it('should subscribe to all workflow events', async () => {
      const handler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE)[0] as (
        event: unknown
      ) => Promise<unknown>;

      const result = await handler(mockEvent);

      expect(result).toEqual({
        success: true,
        data: { subscribed: true },
      });
      expect(getActiveSubscriptionCount()).toBe(1);
    });

    it('should subscribe to specific workflow', async () => {
      const handler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE)[0] as (
        event: unknown,
        workflowId?: string
      ) => Promise<unknown>;

      const result = await handler(mockEvent, 'workflow-123');

      expect(result).toEqual({
        success: true,
        data: { subscribed: true },
      });
      expect(getActiveSubscriptionCount()).toBe(1);
    });

    it('should replace existing subscription', async () => {
      const handler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE)[0] as (
        event: unknown,
        workflowId?: string
      ) => Promise<unknown>;

      await handler(mockEvent);
      await handler(mockEvent, 'workflow-456');

      expect(getActiveSubscriptionCount()).toBe(1);
    });

    it('should register window close cleanup', async () => {
      const handler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE)[0] as (
        event: unknown
      ) => Promise<unknown>;

      await handler(mockEvent);

      expect(mockWindow.once).toHaveBeenCalledWith('closed', expect.any(Function));
    });

    it('should handle subscription error when window not found', async () => {
      (BrowserWindow.fromWebContents as any).mockReturnValueOnce(null);

      const handler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE)[0] as (
        event: unknown
      ) => Promise<unknown>;

      const result = await handler(mockEvent);

      expect(result).toMatchObject({
        success: false,
        error: expect.any(Error),
      });
    });
  });

  describe('Unsubscribe Handler', () => {
    it('should unsubscribe from workflow events', async () => {
      const subscribeHandler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE)[0] as (
        event: unknown
      ) => Promise<unknown>;
      const unsubscribeHandler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.UNSUBSCRIBE)[0] as (
        event: unknown
      ) => Promise<unknown>;

      await subscribeHandler(mockEvent);
      expect(getActiveSubscriptionCount()).toBe(1);

      const result = await unsubscribeHandler(mockEvent);

      expect(result).toEqual({
        success: true,
        data: { unsubscribed: true },
      });
      expect(getActiveSubscriptionCount()).toBe(0);
    });

    it('should handle unsubscribe when not subscribed', async () => {
      const handler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.UNSUBSCRIBE)[0] as (
        event: unknown
      ) => Promise<unknown>;

      const result = await handler(mockEvent);

      expect(result).toEqual({
        success: true,
        data: { unsubscribed: false },
      });
    });

    it('should handle unsubscribe error when window not found', async () => {
      (BrowserWindow.fromWebContents as any).mockReturnValueOnce(null);

      const handler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.UNSUBSCRIBE)[0] as (
        event: unknown
      ) => Promise<unknown>;

      const result = await handler(mockEvent);

      expect(result).toMatchObject({
        success: false,
        error: expect.any(Error),
      });
    });
  });

  describe('Event Forwarding', () => {
    beforeEach(async () => {
      const handler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE)[0] as (
        event: unknown
      ) => Promise<unknown>;
      await handler(mockEvent);
      mockWebContents.send.mockClear();
    });

    it('should forward workflow_started event', () => {
      executionEvents.emitWorkflowStarted('workflow-1', 5);

      expect(mockWebContents.send).toHaveBeenCalledWith(
        WORKFLOW_EXECUTION_CHANNELS.WORKFLOW_STARTED,
        expect.objectContaining({
          workflowId: 'workflow-1',
          totalSteps: 5,
          startTime: expect.any(Number),
        })
      );
    });

    it('should forward step_started event', () => {
      executionEvents.emitStepStarted('workflow-1', 'step-1', 0);

      expect(mockWebContents.send).toHaveBeenCalledWith(
        WORKFLOW_EXECUTION_CHANNELS.STEP_STARTED,
        expect.objectContaining({
          workflowId: 'workflow-1',
          stepId: 'step-1',
          stepIndex: 0,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should forward step_completed event', () => {
      const outputs = { result: 'success' };
      executionEvents.emitStepCompleted('workflow-1', 'step-1', outputs, 1500);

      expect(mockWebContents.send).toHaveBeenCalledWith(
        WORKFLOW_EXECUTION_CHANNELS.STEP_COMPLETED,
        expect.objectContaining({
          workflowId: 'workflow-1',
          stepId: 'step-1',
          outputs,
          duration: 1500,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should forward step_failed event', () => {
      executionEvents.emitStepFailed('workflow-1', 'step-1', 'Timeout', 30000, -1);

      expect(mockWebContents.send).toHaveBeenCalledWith(
        WORKFLOW_EXECUTION_CHANNELS.STEP_FAILED,
        expect.objectContaining({
          workflowId: 'workflow-1',
          stepId: 'step-1',
          error: 'Timeout',
          duration: 30000,
          exitCode: -1,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should forward workflow_completed event', () => {
      const results = { final: 'done' };
      executionEvents.emitWorkflowCompleted('workflow-1', 5000, results, 3, 1);

      expect(mockWebContents.send).toHaveBeenCalledWith(
        WORKFLOW_EXECUTION_CHANNELS.WORKFLOW_COMPLETED,
        expect.objectContaining({
          workflowId: 'workflow-1',
          totalDuration: 5000,
          results,
          successCount: 3,
          failureCount: 1,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should not forward events if window is destroyed', () => {
      mockWindow.isDestroyed.mockReturnValue(true);

      executionEvents.emitWorkflowStarted('workflow-1');

      expect(mockWebContents.send).not.toHaveBeenCalled();
    });
  });

  describe('Workflow Filtering', () => {
    it('should filter events by workflow ID when subscribed to specific workflow', async () => {
      const handler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE)[0] as (
        event: unknown,
        workflowId?: string
      ) => Promise<unknown>;

      await handler(mockEvent, 'workflow-123');
      mockWebContents.send.mockClear();

      // Should forward matching workflow
      executionEvents.emitWorkflowStarted('workflow-123', 5);
      expect(mockWebContents.send).toHaveBeenCalledTimes(1);

      mockWebContents.send.mockClear();

      // Should NOT forward non-matching workflow
      executionEvents.emitWorkflowStarted('workflow-456', 3);
      expect(mockWebContents.send).not.toHaveBeenCalled();
    });

    it('should forward all workflows when no filter specified', async () => {
      const handler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE)[0] as (
        event: unknown
      ) => Promise<unknown>;

      await handler(mockEvent);
      mockWebContents.send.mockClear();

      executionEvents.emitWorkflowStarted('workflow-123');
      executionEvents.emitWorkflowStarted('workflow-456');

      expect(mockWebContents.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('Complete Workflow Lifecycle Integration', () => {
    it('should forward all events in complete workflow', async () => {
      const handler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE)[0] as (
        event: unknown
      ) => Promise<unknown>;

      await handler(mockEvent);
      mockWebContents.send.mockClear();

      // Complete workflow
      executionEvents.emitWorkflowStarted('workflow-1', 2);
      executionEvents.emitStepStarted('workflow-1', 'step-1', 0);
      executionEvents.emitStepCompleted('workflow-1', 'step-1', { result: 'ok' }, 100);
      executionEvents.emitStepStarted('workflow-1', 'step-2', 1);
      executionEvents.emitStepCompleted('workflow-1', 'step-2', { result: 'ok' }, 150);
      executionEvents.emitWorkflowCompleted('workflow-1', 250, { final: 'done' }, 2, 0);

      expect(mockWebContents.send).toHaveBeenCalledTimes(6);
      expect(mockWebContents.send).toHaveBeenNthCalledWith(
        1,
        WORKFLOW_EXECUTION_CHANNELS.WORKFLOW_STARTED,
        expect.any(Object)
      );
      expect(mockWebContents.send).toHaveBeenNthCalledWith(
        2,
        WORKFLOW_EXECUTION_CHANNELS.STEP_STARTED,
        expect.any(Object)
      );
      expect(mockWebContents.send).toHaveBeenNthCalledWith(
        3,
        WORKFLOW_EXECUTION_CHANNELS.STEP_COMPLETED,
        expect.any(Object)
      );
      expect(mockWebContents.send).toHaveBeenNthCalledWith(
        6,
        WORKFLOW_EXECUTION_CHANNELS.WORKFLOW_COMPLETED,
        expect.any(Object)
      );
    });
  });

  describe('Memory Leak Prevention', () => {
    it('should clean up subscription on window close', async () => {
      const handler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE)[0] as (
        event: unknown
      ) => Promise<unknown>;

      await handler(mockEvent);
      expect(getActiveSubscriptionCount()).toBe(1);

      // Simulate window close
      const closeHandler = mockWindow.once.mock.calls[0]![1] as () => void;
      closeHandler();

      expect(getActiveSubscriptionCount()).toBe(0);
    });

    it('should clean up all subscriptions on unregister', async () => {
      const handler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE)[0] as (
        event: unknown
      ) => Promise<unknown>;

      await handler(mockEvent);
      expect(getActiveSubscriptionCount()).toBe(1);

      unregisterWorkflowExecutionHandlers();

      expect(getActiveSubscriptionCount()).toBe(0);
    });

    it('should not leak listeners on multiple subscribe/unsubscribe cycles', async () => {
      const subscribeHandler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.SUBSCRIBE)[0] as (
        event: unknown
      ) => Promise<unknown>;
      const unsubscribeHandler = ipcMain.listeners(WORKFLOW_EXECUTION_CHANNELS.UNSUBSCRIBE)[0] as (
        event: unknown
      ) => Promise<unknown>;

      // Multiple subscribe/unsubscribe cycles
      for (let i = 0; i < 10; i++) {
        await subscribeHandler(mockEvent);
        await unsubscribeHandler(mockEvent);
      }

      expect(getActiveSubscriptionCount()).toBe(0);
      expect(executionEvents.listenerCount('workflow_started')).toBe(0);
    });
  });
});
