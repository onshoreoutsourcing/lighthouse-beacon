/**
 * useDebugState Hook Tests
 * Wave 9.4.6: Step-by-Step Debugging
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebugState } from '../useDebugState';
import type { DebugMode, DebugState, Breakpoint, DebugContext } from '@shared/types';

// Mock window.electron API
const mockWorkflowDebug = {
  setMode: vi.fn(),
  getMode: vi.fn(),
  getState: vi.fn(),
  addBreakpoint: vi.fn(),
  removeBreakpoint: vi.fn(),
  toggleBreakpoint: vi.fn(),
  getBreakpoints: vi.fn(),
  clearBreakpoints: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  stepOver: vi.fn(),
  continue: vi.fn(),
  getContext: vi.fn(),
  setVariable: vi.fn(),
  events: {
    onModeChanged: vi.fn(),
    onPaused: vi.fn(),
    onResumed: vi.fn(),
    onBreakpointAdded: vi.fn(),
    onBreakpointRemoved: vi.fn(),
    onBreakpointToggled: vi.fn(),
    onVariableChanged: vi.fn(),
  },
};

beforeEach(() => {
  // Clear all mocks
  Object.values(mockWorkflowDebug).forEach((fn) => {
    if (typeof fn === 'function') {
      fn.mockClear();
    }
  });
  Object.values(mockWorkflowDebug.events).forEach((fn) => fn.mockClear());

  // Setup window.electron mock
  (globalThis as never as { window: never }).window = {
    electron: {
      workflowDebug: mockWorkflowDebug,
    },
  } as never;

  // Default mock implementations
  mockWorkflowDebug.getMode.mockResolvedValue({ success: true, data: 'OFF' as DebugMode });
  mockWorkflowDebug.getState.mockResolvedValue({
    success: true,
    data: { state: 'RUNNING' as DebugState, stepMode: 'NONE' },
  });
  mockWorkflowDebug.getBreakpoints.mockResolvedValue({ success: true, data: [] });
  mockWorkflowDebug.getContext.mockResolvedValue({ success: true, data: null });

  // Mock event subscriptions to return unsubscribe functions
  Object.values(mockWorkflowDebug.events).forEach((fn) => {
    fn.mockReturnValue(() => {});
  });
});

describe('useDebugState', () => {
  describe('Initialization', () => {
    it('should initialize with default state', async () => {
      const { result } = renderHook(() => useDebugState());

      await waitFor(() => {
        expect(result.current.debugMode).toBe('OFF');
        expect(result.current.debugState).toBe('RUNNING');
        expect(result.current.stepMode).toBe('NONE');
        expect(result.current.breakpoints).toEqual([]);
        expect(result.current.currentContext).toBeNull();
      });
    });

    it('should fetch initial state from backend on mount', async () => {
      renderHook(() => useDebugState());

      await waitFor(() => {
        expect(mockWorkflowDebug.getMode).toHaveBeenCalled();
        expect(mockWorkflowDebug.getState).toHaveBeenCalled();
        expect(mockWorkflowDebug.getBreakpoints).toHaveBeenCalled();
        expect(mockWorkflowDebug.getContext).toHaveBeenCalled();
      });
    });

    it('should subscribe to debug events on mount', () => {
      renderHook(() => useDebugState());

      expect(mockWorkflowDebug.events.onModeChanged).toHaveBeenCalled();
      expect(mockWorkflowDebug.events.onPaused).toHaveBeenCalled();
      expect(mockWorkflowDebug.events.onResumed).toHaveBeenCalled();
      expect(mockWorkflowDebug.events.onBreakpointAdded).toHaveBeenCalled();
      expect(mockWorkflowDebug.events.onBreakpointRemoved).toHaveBeenCalled();
      expect(mockWorkflowDebug.events.onBreakpointToggled).toHaveBeenCalled();
      expect(mockWorkflowDebug.events.onVariableChanged).toHaveBeenCalled();
    });
  });

  describe('Debug Mode Control', () => {
    it('should set debug mode via setDebugMode', async () => {
      mockWorkflowDebug.setMode.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDebugState());

      await act(async () => {
        await result.current.setDebugMode('ON');
      });

      expect(mockWorkflowDebug.setMode).toHaveBeenCalledWith('ON');
    });

    it('should update state when mode changed event is received', async () => {
      let modeChangedCallback: ((data: { mode: DebugMode }) => void) | null = null;
      mockWorkflowDebug.events.onModeChanged.mockImplementation((callback) => {
        modeChangedCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useDebugState());

      // Simulate mode changed event
      act(() => {
        modeChangedCallback?.({ mode: 'ON' });
      });

      await waitFor(() => {
        expect(result.current.debugMode).toBe('ON');
      });
    });
  });

  describe('Breakpoint Management', () => {
    it('should add breakpoint via addBreakpoint', async () => {
      mockWorkflowDebug.addBreakpoint.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDebugState());

      await act(async () => {
        await result.current.addBreakpoint('test-node-1', true);
      });

      expect(mockWorkflowDebug.addBreakpoint).toHaveBeenCalledWith('test-node-1', true);
    });

    it('should remove breakpoint via removeBreakpoint', async () => {
      mockWorkflowDebug.removeBreakpoint.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDebugState());

      await act(async () => {
        await result.current.removeBreakpoint('test-node-1');
      });

      expect(mockWorkflowDebug.removeBreakpoint).toHaveBeenCalledWith('test-node-1');
    });

    it('should toggle breakpoint when it exists and is enabled', async () => {
      mockWorkflowDebug.toggleBreakpoint.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDebugState());

      // Set up existing breakpoint
      act(() => {
        result.current.breakpoints.push({ nodeId: 'test-node-1', enabled: true });
      });

      await act(async () => {
        await result.current.toggleBreakpoint('test-node-1');
      });

      expect(mockWorkflowDebug.toggleBreakpoint).toHaveBeenCalledWith('test-node-1');
    });

    it('should add breakpoint when it does not exist', async () => {
      mockWorkflowDebug.addBreakpoint.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDebugState());

      await act(async () => {
        await result.current.toggleBreakpoint('test-node-1');
      });

      expect(mockWorkflowDebug.addBreakpoint).toHaveBeenCalledWith('test-node-1');
    });

    it('should clear all breakpoints via clearAllBreakpoints', async () => {
      mockWorkflowDebug.clearBreakpoints.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDebugState());

      await act(async () => {
        await result.current.clearAllBreakpoints();
      });

      expect(mockWorkflowDebug.clearBreakpoints).toHaveBeenCalled();
    });

    it('should update breakpoints when breakpoint added event is received', async () => {
      let breakpointAddedCallback: ((data: { nodeId: string }) => void) | null = null;
      mockWorkflowDebug.events.onBreakpointAdded.mockImplementation((callback) => {
        breakpointAddedCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useDebugState());

      // Simulate breakpoint added event
      act(() => {
        breakpointAddedCallback?.({ nodeId: 'test-node-1' });
      });

      await waitFor(() => {
        expect(result.current.breakpoints).toContainEqual({
          nodeId: 'test-node-1',
          enabled: true,
        });
      });
    });

    it('should update breakpoints when breakpoint removed event is received', async () => {
      let breakpointRemovedCallback: ((data: { nodeId: string }) => void) | null = null;
      mockWorkflowDebug.events.onBreakpointRemoved.mockImplementation((callback) => {
        breakpointRemovedCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useDebugState());

      // Add a breakpoint first
      act(() => {
        result.current.breakpoints.push({ nodeId: 'test-node-1', enabled: true });
      });

      // Simulate breakpoint removed event
      act(() => {
        breakpointRemovedCallback?.({ nodeId: 'test-node-1' });
      });

      await waitFor(() => {
        expect(result.current.breakpoints).not.toContainEqual({
          nodeId: 'test-node-1',
          enabled: true,
        });
      });
    });
  });

  describe('Execution Control', () => {
    it('should pause via pause', async () => {
      mockWorkflowDebug.pause.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDebugState());

      await act(async () => {
        await result.current.pause();
      });

      expect(mockWorkflowDebug.pause).toHaveBeenCalled();
    });

    it('should resume via resume', async () => {
      mockWorkflowDebug.resume.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDebugState());

      await act(async () => {
        await result.current.resume();
      });

      expect(mockWorkflowDebug.resume).toHaveBeenCalled();
    });

    it('should step over via stepOver', async () => {
      mockWorkflowDebug.stepOver.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDebugState());

      await act(async () => {
        await result.current.stepOver();
      });

      expect(mockWorkflowDebug.stepOver).toHaveBeenCalled();
    });

    it('should continue via continue', async () => {
      mockWorkflowDebug.continue.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDebugState());

      await act(async () => {
        await result.current.continue();
      });

      expect(mockWorkflowDebug.continue).toHaveBeenCalled();
    });

    it('should update state when paused event is received', async () => {
      let pausedCallback: ((context: DebugContext) => void) | null = null;
      mockWorkflowDebug.events.onPaused.mockImplementation((callback) => {
        pausedCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useDebugState());

      const mockContext: DebugContext = {
        workflowId: 'test',
        nodeId: 'test-node',
        variables: { workflowInputs: {}, stepOutputs: {}, env: {} },
        executionStack: [],
        pausedAt: Date.now(),
      };

      // Simulate paused event
      act(() => {
        pausedCallback?.(mockContext);
      });

      await waitFor(() => {
        expect(result.current.debugState).toBe('PAUSED');
        expect(result.current.currentContext).toEqual(mockContext);
      });
    });

    it('should update state when resumed event is received', async () => {
      let resumedCallback: (() => void) | null = null;
      mockWorkflowDebug.events.onResumed.mockImplementation((callback) => {
        resumedCallback = callback;
        return () => {};
      });

      const { result } = renderHook(() => useDebugState());

      // Set paused state first
      act(() => {
        result.current.currentContext = {
          workflowId: 'test',
          nodeId: 'test',
          variables: { workflowInputs: {}, stepOutputs: {}, env: {} },
          executionStack: [],
          pausedAt: Date.now(),
        };
      });

      // Simulate resumed event
      act(() => {
        resumedCallback?.();
      });

      await waitFor(() => {
        expect(result.current.debugState).toBe('RUNNING');
        expect(result.current.currentContext).toBeNull();
      });
    });
  });

  describe('Variable Management', () => {
    it('should set variable via setVariable', async () => {
      mockWorkflowDebug.setVariable.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useDebugState());

      await act(async () => {
        await result.current.setVariable('workflow.inputs.user_id', '456');
      });

      expect(mockWorkflowDebug.setVariable).toHaveBeenCalledWith('workflow.inputs.user_id', '456');
    });
  });

  describe('Utility Functions', () => {
    it('should check if node has breakpoint via hasBreakpoint', () => {
      const { result } = renderHook(() => useDebugState());

      act(() => {
        result.current.breakpoints.push({ nodeId: 'test-node-1', enabled: true });
      });

      expect(result.current.hasBreakpoint('test-node-1')).toBe(true);
      expect(result.current.hasBreakpoint('test-node-2')).toBe(false);
    });

    it('should check if breakpoint is enabled via isBreakpointEnabled', () => {
      const { result } = renderHook(() => useDebugState());

      act(() => {
        result.current.breakpoints.push(
          { nodeId: 'test-node-1', enabled: true },
          { nodeId: 'test-node-2', enabled: false }
        );
      });

      expect(result.current.isBreakpointEnabled('test-node-1')).toBe(true);
      expect(result.current.isBreakpointEnabled('test-node-2')).toBe(false);
      expect(result.current.isBreakpointEnabled('test-node-3')).toBe(false);
    });

    it('should refresh state via refreshState', async () => {
      const { result } = renderHook(() => useDebugState());

      await act(async () => {
        await result.current.refreshState();
      });

      expect(mockWorkflowDebug.getMode).toHaveBeenCalled();
      expect(mockWorkflowDebug.getState).toHaveBeenCalled();
      expect(mockWorkflowDebug.getBreakpoints).toHaveBeenCalled();
      expect(mockWorkflowDebug.getContext).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors from backend gracefully', async () => {
      mockWorkflowDebug.setMode.mockResolvedValue({ success: false, error: 'Test error' });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useDebugState());

      await act(async () => {
        await result.current.setDebugMode('ON');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to set debug mode'),
        'Test error'
      );

      consoleSpy.mockRestore();
    });
  });
});
