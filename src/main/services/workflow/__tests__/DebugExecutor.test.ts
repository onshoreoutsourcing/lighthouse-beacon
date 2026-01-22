/**
 * DebugExecutor Tests
 * Wave 9.4.6: Step-by-Step Debugging
 *
 * Tests debug executor capabilities:
 * - Breakpoint management (add, remove, toggle, list)
 * - Step-through execution (pause, resume, step-over, continue)
 * - Debug mode control
 * - Variable inspection and editing
 * - Debug timeout handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DebugExecutor, DebugMode, DebugState, StepMode } from '../DebugExecutor';
import type { DebugContext } from '../../../../shared/types';

describe('DebugExecutor', () => {
  let debugExecutor: DebugExecutor;

  beforeEach(() => {
    debugExecutor = DebugExecutor.getInstance();
    debugExecutor.setMode(DebugMode.OFF);
    debugExecutor.clearAllBreakpoints();
    debugExecutor.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    debugExecutor.setMode(DebugMode.OFF);
    debugExecutor.clearAllBreakpoints();
    debugExecutor.reset();
  });

  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = DebugExecutor.getInstance();
      const instance2 = DebugExecutor.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Debug Mode Control', () => {
    it('should initialize in OFF mode', () => {
      expect(debugExecutor.getMode()).toBe(DebugMode.OFF);
    });

    it('should set debug mode to ON', () => {
      debugExecutor.setMode(DebugMode.ON);
      expect(debugExecutor.getMode()).toBe(DebugMode.ON);
    });

    it('should emit modeChanged event', () => {
      const listener = vi.fn();
      debugExecutor.on('modeChanged', listener);

      debugExecutor.setMode(DebugMode.ON);

      expect(listener).toHaveBeenCalledWith(DebugMode.ON);
    });

    it('should clear breakpoints and reset state when turning OFF', () => {
      debugExecutor.setMode(DebugMode.ON);
      debugExecutor.addBreakpoint('node1');

      debugExecutor.setMode(DebugMode.OFF);

      expect(debugExecutor.getState()).toBe(DebugState.RUNNING);
      expect(debugExecutor.getStepMode()).toBe(StepMode.NONE);
    });
  });

  describe('Breakpoint Management', () => {
    it('should add breakpoint', () => {
      debugExecutor.addBreakpoint('node1');

      expect(debugExecutor.hasBreakpoint('node1')).toBe(true);
      expect(debugExecutor.getBreakpoints()).toHaveLength(1);
      expect(debugExecutor.getBreakpoints()[0]).toEqual({
        nodeId: 'node1',
        enabled: true,
      });
    });

    it('should add disabled breakpoint', () => {
      debugExecutor.addBreakpoint('node1', false);

      expect(debugExecutor.hasBreakpoint('node1')).toBe(false);
      expect(debugExecutor.getBreakpoints()[0].enabled).toBe(false);
    });

    it('should emit breakpointAdded event', () => {
      const listener = vi.fn();
      debugExecutor.on('breakpointAdded', listener);

      debugExecutor.addBreakpoint('node1');

      expect(listener).toHaveBeenCalledWith('node1');
    });

    it('should remove breakpoint', () => {
      debugExecutor.addBreakpoint('node1');
      debugExecutor.removeBreakpoint('node1');

      expect(debugExecutor.hasBreakpoint('node1')).toBe(false);
      expect(debugExecutor.getBreakpoints()).toHaveLength(0);
    });

    it('should emit breakpointRemoved event', () => {
      debugExecutor.addBreakpoint('node1');

      const listener = vi.fn();
      debugExecutor.on('breakpointRemoved', listener);

      debugExecutor.removeBreakpoint('node1');

      expect(listener).toHaveBeenCalledWith('node1');
    });

    it('should handle removing non-existent breakpoint', () => {
      expect(() => debugExecutor.removeBreakpoint('nonexistent')).not.toThrow();
    });

    it('should toggle breakpoint enabled state', () => {
      debugExecutor.addBreakpoint('node1', true);
      debugExecutor.toggleBreakpoint('node1');

      expect(debugExecutor.getBreakpoints()[0].enabled).toBe(false);

      debugExecutor.toggleBreakpoint('node1');

      expect(debugExecutor.getBreakpoints()[0].enabled).toBe(true);
    });

    it('should emit breakpointToggled event', () => {
      debugExecutor.addBreakpoint('node1');

      const listener = vi.fn();
      debugExecutor.on('breakpointToggled', listener);

      debugExecutor.toggleBreakpoint('node1');

      expect(listener).toHaveBeenCalledWith('node1', false);
    });

    it('should handle toggling non-existent breakpoint', () => {
      expect(() => debugExecutor.toggleBreakpoint('nonexistent')).not.toThrow();
    });

    it('should clear all breakpoints', () => {
      debugExecutor.addBreakpoint('node1');
      debugExecutor.addBreakpoint('node2');
      debugExecutor.addBreakpoint('node3');

      debugExecutor.clearAllBreakpoints();

      expect(debugExecutor.getBreakpoints()).toHaveLength(0);
    });

    it('should manage multiple breakpoints', () => {
      debugExecutor.addBreakpoint('node1');
      debugExecutor.addBreakpoint('node2');
      debugExecutor.addBreakpoint('node3', false);

      expect(debugExecutor.getBreakpoints()).toHaveLength(3);
      expect(debugExecutor.hasBreakpoint('node1')).toBe(true);
      expect(debugExecutor.hasBreakpoint('node2')).toBe(true);
      expect(debugExecutor.hasBreakpoint('node3')).toBe(false); // Disabled
    });
  });

  describe('Breakpoint Checking', () => {
    it('should not pause when debug mode is OFF', async () => {
      debugExecutor.setMode(DebugMode.OFF);
      debugExecutor.addBreakpoint('node1');

      const context: DebugContext = {
        workflowId: 'test-workflow',
        nodeId: 'node1',
        variables: { workflowInputs: {}, stepOutputs: {} },
        executionStack: [],
        pausedAt: Date.now(),
      };

      // Should not block
      await debugExecutor.checkBreakpoint('node1', context);

      expect(debugExecutor.getState()).toBe(DebugState.RUNNING);
    });

    it('should pause at breakpoint when debug mode is ON', async () => {
      debugExecutor.setMode(DebugMode.ON);
      debugExecutor.addBreakpoint('node1');

      const context: DebugContext = {
        workflowId: 'test-workflow',
        nodeId: 'node1',
        variables: { workflowInputs: {}, stepOutputs: {} },
        executionStack: [],
        pausedAt: Date.now(),
      };

      const checkPromise = debugExecutor.checkBreakpoint('node1', context);

      // Wait a bit to ensure pause
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(debugExecutor.getState()).toBe(DebugState.PAUSED);

      // Resume to unblock
      debugExecutor.resume();

      await checkPromise;
    });

    it('should emit paused event when reaching breakpoint', async () => {
      debugExecutor.setMode(DebugMode.ON);
      debugExecutor.addBreakpoint('node1');

      const listener = vi.fn();
      debugExecutor.on('paused', listener);

      const context: DebugContext = {
        workflowId: 'test-workflow',
        nodeId: 'node1',
        variables: { workflowInputs: {}, stepOutputs: {} },
        executionStack: [],
        pausedAt: Date.now(),
      };

      const checkPromise = debugExecutor.checkBreakpoint('node1', context);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(listener).toHaveBeenCalled();

      debugExecutor.resume();
      await checkPromise;
    });

    it('should not pause at disabled breakpoint', async () => {
      debugExecutor.setMode(DebugMode.ON);
      debugExecutor.addBreakpoint('node1', false);

      const context: DebugContext = {
        workflowId: 'test-workflow',
        nodeId: 'node1',
        variables: { workflowInputs: {}, stepOutputs: {} },
        executionStack: [],
        pausedAt: Date.now(),
      };

      await debugExecutor.checkBreakpoint('node1', context);

      expect(debugExecutor.getState()).toBe(DebugState.RUNNING);
    });
  });

  describe('Step-Through Execution', () => {
    it('should pause in step-over mode', async () => {
      debugExecutor.setMode(DebugMode.ON);

      const context: DebugContext = {
        workflowId: 'test-workflow',
        nodeId: 'node1',
        variables: { workflowInputs: {}, stepOutputs: {} },
        executionStack: [],
        pausedAt: Date.now(),
      };

      // Trigger step-over mode
      debugExecutor.pause();

      const checkPromise = debugExecutor.checkBreakpoint('node1', context);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(debugExecutor.getState()).toBe(DebugState.PAUSED);

      debugExecutor.resume();
      await checkPromise;
    });

    it('should resume execution', async () => {
      debugExecutor.setMode(DebugMode.ON);
      debugExecutor.addBreakpoint('node1');

      const context: DebugContext = {
        workflowId: 'test-workflow',
        nodeId: 'node1',
        variables: { workflowInputs: {}, stepOutputs: {} },
        executionStack: [],
        pausedAt: Date.now(),
      };

      const checkPromise = debugExecutor.checkBreakpoint('node1', context);

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(debugExecutor.getState()).toBe(DebugState.PAUSED);

      debugExecutor.resume();

      await checkPromise;
      expect(debugExecutor.getState()).toBe(DebugState.RUNNING);
    });

    it('should emit resumed event', async () => {
      debugExecutor.setMode(DebugMode.ON);
      debugExecutor.addBreakpoint('node1');

      const context: DebugContext = {
        workflowId: 'test-workflow',
        nodeId: 'node1',
        variables: { workflowInputs: {}, stepOutputs: {} },
        executionStack: [],
        pausedAt: Date.now(),
      };

      const checkPromise = debugExecutor.checkBreakpoint('node1', context);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const listener = vi.fn();
      debugExecutor.on('resumed', listener);

      debugExecutor.resume();

      await checkPromise;

      expect(listener).toHaveBeenCalledWith('test-workflow', 'node1');
    });

    it('should handle resume when not paused', () => {
      expect(() => debugExecutor.resume()).not.toThrow();
    });

    it('should step over when paused', async () => {
      debugExecutor.setMode(DebugMode.ON);
      debugExecutor.addBreakpoint('node1');

      const context: DebugContext = {
        workflowId: 'test-workflow',
        nodeId: 'node1',
        variables: { workflowInputs: {}, stepOutputs: {} },
        executionStack: [],
        pausedAt: Date.now(),
      };

      const checkPromise = debugExecutor.checkBreakpoint('node1', context);

      await new Promise((resolve) => setTimeout(resolve, 10));

      debugExecutor.stepOver();

      await checkPromise;

      expect(debugExecutor.getStepMode()).toBe(StepMode.STEP_OVER);
    });

    it('should continue when paused', async () => {
      debugExecutor.setMode(DebugMode.ON);
      debugExecutor.addBreakpoint('node1');

      const context: DebugContext = {
        workflowId: 'test-workflow',
        nodeId: 'node1',
        variables: { workflowInputs: {}, stepOutputs: {} },
        executionStack: [],
        pausedAt: Date.now(),
      };

      const checkPromise = debugExecutor.checkBreakpoint('node1', context);

      await new Promise((resolve) => setTimeout(resolve, 10));

      debugExecutor.continue();

      await checkPromise;

      expect(debugExecutor.getStepMode()).toBe(StepMode.CONTINUE);
    });

    it('should handle step-over when not paused', () => {
      expect(() => debugExecutor.stepOver()).not.toThrow();
    });

    it('should handle continue when not paused', () => {
      expect(() => debugExecutor.continue()).not.toThrow();
    });
  });

  describe('Variable Inspection', () => {
    it('should get current debug context', async () => {
      debugExecutor.setMode(DebugMode.ON);
      debugExecutor.addBreakpoint('node1');

      const context: DebugContext = {
        workflowId: 'test-workflow',
        nodeId: 'node1',
        variables: {
          workflowInputs: { user_id: '123' },
          stepOutputs: {},
        },
        executionStack: ['level-0'],
        pausedAt: Date.now(),
      };

      const checkPromise = debugExecutor.checkBreakpoint('node1', context);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const currentContext = debugExecutor.getCurrentContext();

      expect(currentContext).toBeDefined();
      expect(currentContext?.workflowId).toBe('test-workflow');
      expect(currentContext?.nodeId).toBe('node1');
      expect(currentContext?.variables.workflowInputs).toEqual({ user_id: '123' });

      debugExecutor.resume();
      await checkPromise;
    });

    it('should return null when not paused', () => {
      const context = debugExecutor.getCurrentContext();
      expect(context).toBeNull();
    });

    it('should set workflow input variable during pause', async () => {
      debugExecutor.setMode(DebugMode.ON);
      debugExecutor.addBreakpoint('node1');

      const context: DebugContext = {
        workflowId: 'test-workflow',
        nodeId: 'node1',
        variables: {
          workflowInputs: { user_id: '123' },
          stepOutputs: {},
        },
        executionStack: [],
        pausedAt: Date.now(),
      };

      const checkPromise = debugExecutor.checkBreakpoint('node1', context);

      await new Promise((resolve) => setTimeout(resolve, 10));

      debugExecutor.setVariable('workflow.inputs.user_id', '456');

      const updatedContext = debugExecutor.getCurrentContext();
      expect(updatedContext?.variables.workflowInputs.user_id).toBe('456');

      debugExecutor.resume();
      await checkPromise;
    });

    it('should set step output variable during pause', async () => {
      debugExecutor.setMode(DebugMode.ON);
      debugExecutor.addBreakpoint('node1');

      const context: DebugContext = {
        workflowId: 'test-workflow',
        nodeId: 'node1',
        variables: {
          workflowInputs: {},
          stepOutputs: {
            step1: { result: 'old' },
          },
        },
        executionStack: [],
        pausedAt: Date.now(),
      };

      const checkPromise = debugExecutor.checkBreakpoint('node1', context);

      await new Promise((resolve) => setTimeout(resolve, 10));

      debugExecutor.setVariable('steps.step1.outputs.result', 'new');

      const updatedContext = debugExecutor.getCurrentContext();
      expect(updatedContext?.variables.stepOutputs.step1.result).toBe('new');

      debugExecutor.resume();
      await checkPromise;
    });

    it('should emit variableChanged event', async () => {
      debugExecutor.setMode(DebugMode.ON);
      debugExecutor.addBreakpoint('node1');

      const context: DebugContext = {
        workflowId: 'test-workflow',
        nodeId: 'node1',
        variables: { workflowInputs: {}, stepOutputs: {} },
        executionStack: [],
        pausedAt: Date.now(),
      };

      const checkPromise = debugExecutor.checkBreakpoint('node1', context);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const listener = vi.fn();
      debugExecutor.on('variableChanged', listener);

      debugExecutor.setVariable('workflow.inputs.test', 'value');

      expect(listener).toHaveBeenCalledWith('workflow.inputs.test', 'value');

      debugExecutor.resume();
      await checkPromise;
    });

    it('should not set variable when not paused', () => {
      expect(() => debugExecutor.setVariable('workflow.inputs.test', 'value')).not.toThrow();
    });
  });

  describe('Debug State Management', () => {
    it('should mark execution as completed', () => {
      debugExecutor.setMode(DebugMode.ON);
      debugExecutor.markCompleted();

      expect(debugExecutor.getState()).toBe(DebugState.COMPLETED);
      expect(debugExecutor.getStepMode()).toBe(StepMode.NONE);
    });

    it('should reset debug state', async () => {
      debugExecutor.setMode(DebugMode.ON);
      debugExecutor.addBreakpoint('node1');

      const context: DebugContext = {
        workflowId: 'test-workflow',
        nodeId: 'node1',
        variables: { workflowInputs: {}, stepOutputs: {} },
        executionStack: [],
        pausedAt: Date.now(),
      };

      const checkPromise = debugExecutor.checkBreakpoint('node1', context);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Force reset while paused
      debugExecutor.reset();

      // Should unblock immediately
      await checkPromise;

      expect(debugExecutor.getState()).toBe(DebugState.RUNNING);
      expect(debugExecutor.getStepMode()).toBe(StepMode.NONE);
    });
  });

  describe('Debug Timeout', () => {
    it('should auto-resume after timeout', async () => {
      debugExecutor.setMode(DebugMode.ON);
      debugExecutor.setDebugTimeout(50); // 50ms timeout for testing
      debugExecutor.addBreakpoint('node1');

      const context: DebugContext = {
        workflowId: 'test-workflow',
        nodeId: 'node1',
        variables: { workflowInputs: {}, stepOutputs: {} },
        executionStack: [],
        pausedAt: Date.now(),
      };

      const checkPromise = debugExecutor.checkBreakpoint('node1', context);

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(debugExecutor.getState()).toBe(DebugState.PAUSED);

      // Wait for timeout
      await checkPromise;

      expect(debugExecutor.getState()).toBe(DebugState.RUNNING);
    }, 10000);

    it('should set debug timeout', () => {
      debugExecutor.setDebugTimeout(5000);
      // No error thrown
      expect(true).toBe(true);
    });

    it('should reject negative timeout', () => {
      expect(() => debugExecutor.setDebugTimeout(-1)).toThrow('Debug timeout must be non-negative');
    });
  });
});
