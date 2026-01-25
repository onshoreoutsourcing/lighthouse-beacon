/**
 * DebugExecutor Service
 * Wave 9.4.6: Step-by-Step Debugging
 *
 * Provides interactive debugging capabilities for workflow execution:
 * - Breakpoint management (set, remove, toggle)
 * - Step-through execution (pause, resume, step-over, continue)
 * - Variable inspection at runtime
 * - Debug state persistence
 *
 * Architecture:
 * - Integrates with WorkflowExecutor for execution control
 * - Uses event emitters for real-time debug state updates
 * - Thread-safe pause/resume with Promise-based blocking
 * - Singleton pattern for global debug state management
 *
 * Usage:
 * const debugExecutor = DebugExecutor.getInstance();
 * debugExecutor.addBreakpoint('node-123');
 * await debugExecutor.checkBreakpoint('node-123', context);
 */

import log from 'electron-log';
import { EventEmitter } from 'events';
import type { VariableResolutionContext } from '../../../shared/types';

/**
 * Debug execution mode
 */
export enum DebugMode {
  /** Normal execution (no debugging) */
  OFF = 'OFF',
  /** Debug mode active (checking breakpoints) */
  ON = 'ON',
}

/**
 * Debug execution state
 */
export enum DebugState {
  /** Execution running normally */
  RUNNING = 'RUNNING',
  /** Execution paused at breakpoint or step */
  PAUSED = 'PAUSED',
  /** Execution completed */
  COMPLETED = 'COMPLETED',
}

/**
 * Step execution mode
 */
export enum StepMode {
  /** Not stepping */
  NONE = 'NONE',
  /** Step over: execute current node, pause at next */
  STEP_OVER = 'STEP_OVER',
  /** Continue: run until next breakpoint or completion */
  CONTINUE = 'CONTINUE',
}

/**
 * Breakpoint definition
 */
export interface Breakpoint {
  /** Node/step ID where breakpoint is set */
  nodeId: string;
  /** Whether breakpoint is enabled */
  enabled: boolean;
  /** Optional condition (not implemented in this wave) */
  condition?: string;
}

/**
 * Debug context at pause point
 */
export interface DebugContext {
  /** Current workflow ID */
  workflowId: string;
  /** Current node/step ID */
  nodeId: string;
  /** Variable resolution context (inputs, outputs, env) */
  variables: VariableResolutionContext;
  /** Execution stack (call hierarchy) */
  executionStack: string[];
  /** Timestamp when paused */
  pausedAt: number;
}

/**
 * Debug event types
 */
export interface DebugEvents {
  /** Execution paused at breakpoint or step */
  paused: (context: DebugContext) => void;
  /** Execution resumed */
  resumed: (workflowId: string, nodeId: string) => void;
  /** Breakpoint added */
  breakpointAdded: (nodeId: string) => void;
  /** Breakpoint removed */
  breakpointRemoved: (nodeId: string) => void;
  /** Breakpoint toggled */
  breakpointToggled: (nodeId: string, enabled: boolean) => void;
  /** Debug mode changed */
  modeChanged: (mode: DebugMode) => void;
  /** Variable value changed during pause */
  variableChanged: (path: string, value: unknown) => void;
}

/**
 * Debug executor for interactive workflow debugging
 * Singleton pattern ensures global debug state consistency
 */
export class DebugExecutor extends EventEmitter {
  private static instance: DebugExecutor;

  private mode: DebugMode = DebugMode.OFF;
  private state: DebugState = DebugState.RUNNING;
  private stepMode: StepMode = StepMode.NONE;

  private breakpoints: Map<string, Breakpoint> = new Map();
  private currentContext: DebugContext | null = null;

  // Promise-based pause/resume mechanism
  private resumeResolver: (() => void) | null = null;
  private resumePromise: Promise<void> | null = null;

  // Timeout for debug sessions (30 minutes default)
  private debugTimeoutMs = 30 * 60 * 1000;
  private debugTimeoutHandle: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    log.info('[DebugExecutor] Initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DebugExecutor {
    if (!DebugExecutor.instance) {
      DebugExecutor.instance = new DebugExecutor();
    }
    return DebugExecutor.instance;
  }

  /**
   * Set debug mode (ON/OFF)
   */
  public setMode(mode: DebugMode): void {
    if (this.mode === mode) return;

    this.mode = mode;
    log.info('[DebugExecutor] Mode changed', { mode });
    this.emit('modeChanged', mode);

    // Clear breakpoints and reset state when turning OFF
    if (mode === DebugMode.OFF) {
      this.state = DebugState.RUNNING;
      this.stepMode = StepMode.NONE;
      this.clearDebugTimeout();
    }
  }

  /**
   * Get current debug mode
   */
  public getMode(): DebugMode {
    return this.mode;
  }

  /**
   * Get current debug state
   */
  public getState(): DebugState {
    return this.state;
  }

  /**
   * Get current step mode
   */
  public getStepMode(): StepMode {
    return this.stepMode;
  }

  /**
   * Add breakpoint to node
   */
  public addBreakpoint(nodeId: string, enabled = true): void {
    this.breakpoints.set(nodeId, { nodeId, enabled });
    log.info('[DebugExecutor] Breakpoint added', { nodeId, enabled });
    this.emit('breakpointAdded', nodeId);
  }

  /**
   * Remove breakpoint from node
   */
  public removeBreakpoint(nodeId: string): void {
    if (!this.breakpoints.has(nodeId)) {
      log.warn('[DebugExecutor] Breakpoint not found', { nodeId });
      return;
    }

    this.breakpoints.delete(nodeId);
    log.info('[DebugExecutor] Breakpoint removed', { nodeId });
    this.emit('breakpointRemoved', nodeId);
  }

  /**
   * Toggle breakpoint enabled state
   */
  public toggleBreakpoint(nodeId: string): void {
    const breakpoint = this.breakpoints.get(nodeId);
    if (!breakpoint) {
      log.warn('[DebugExecutor] Breakpoint not found for toggle', { nodeId });
      return;
    }

    breakpoint.enabled = !breakpoint.enabled;
    log.info('[DebugExecutor] Breakpoint toggled', { nodeId, enabled: breakpoint.enabled });
    this.emit('breakpointToggled', nodeId, breakpoint.enabled);
  }

  /**
   * Get all breakpoints
   */
  public getBreakpoints(): Breakpoint[] {
    return Array.from(this.breakpoints.values());
  }

  /**
   * Check if node has enabled breakpoint
   */
  public hasBreakpoint(nodeId: string): boolean {
    const breakpoint = this.breakpoints.get(nodeId);
    return breakpoint !== undefined && breakpoint.enabled;
  }

  /**
   * Clear all breakpoints
   */
  public clearAllBreakpoints(): void {
    this.breakpoints.clear();
    log.info('[DebugExecutor] All breakpoints cleared');
  }

  /**
   * Check if execution should pause at this node
   * Called by WorkflowExecutor before executing each node
   *
   * @param nodeId - Node ID to check
   * @param context - Debug context (variables, stack)
   * @returns Promise that resolves when execution should continue
   */
  public async checkBreakpoint(nodeId: string, context: DebugContext): Promise<void> {
    // Skip if debug mode OFF
    if (this.mode === DebugMode.OFF) {
      return;
    }

    const shouldPause =
      this.hasBreakpoint(nodeId) || // Breakpoint set
      this.stepMode === StepMode.STEP_OVER; // Step mode active

    if (!shouldPause) {
      return;
    }

    // Pause execution
    await this.pauseExecution(nodeId, context);
  }

  /**
   * Pause execution at current node
   */
  private async pauseExecution(nodeId: string, context: DebugContext): Promise<void> {
    this.state = DebugState.PAUSED;
    this.currentContext = { ...context, nodeId, pausedAt: Date.now() };

    log.info('[DebugExecutor] Execution paused', {
      workflowId: context.workflowId,
      nodeId,
      stepMode: this.stepMode,
    });

    this.emit('paused', this.currentContext);

    // Start debug timeout
    this.startDebugTimeout(context.workflowId);

    // Create promise that resolves when resume() is called
    this.resumePromise = new Promise((resolve) => {
      this.resumeResolver = resolve;
    });

    // Block until resume
    await this.resumePromise;

    this.resumePromise = null;
    this.resumeResolver = null;
  }

  /**
   * Resume execution (from paused state)
   */
  public resume(): void {
    if (this.state !== DebugState.PAUSED) {
      log.warn('[DebugExecutor] Cannot resume - not paused');
      return;
    }

    this.state = DebugState.RUNNING;
    this.clearDebugTimeout();

    log.info('[DebugExecutor] Execution resumed', {
      workflowId: this.currentContext?.workflowId,
      nodeId: this.currentContext?.nodeId,
    });

    if (this.currentContext) {
      this.emit('resumed', this.currentContext.workflowId, this.currentContext.nodeId);
    }

    // Resolve the waiting promise
    if (this.resumeResolver) {
      this.resumeResolver();
    }

    this.currentContext = null;
  }

  /**
   * Pause execution (manual pause request)
   */
  public pause(): void {
    if (this.state === DebugState.PAUSED) {
      log.warn('[DebugExecutor] Already paused');
      return;
    }

    // Set step mode to pause at next node
    this.stepMode = StepMode.STEP_OVER;
    log.info('[DebugExecutor] Pause requested - will pause at next node');
  }

  /**
   * Step over: execute current node and pause at next
   */
  public stepOver(): void {
    if (this.state !== DebugState.PAUSED) {
      log.warn('[DebugExecutor] Cannot step over - not paused');
      return;
    }

    this.stepMode = StepMode.STEP_OVER;
    log.info('[DebugExecutor] Step over requested');
    this.resume();
  }

  /**
   * Continue: resume execution until next breakpoint or completion
   */
  public continue(): void {
    if (this.state !== DebugState.PAUSED) {
      log.warn('[DebugExecutor] Cannot continue - not paused');
      return;
    }

    this.stepMode = StepMode.CONTINUE;
    log.info('[DebugExecutor] Continue requested');
    this.resume();
  }

  /**
   * Get current debug context (variables, stack)
   */
  public getCurrentContext(): DebugContext | null {
    return this.currentContext ? { ...this.currentContext } : null;
  }

  /**
   * Update variable value during pause (for testing/debugging)
   * Security: Only allowed when execution is paused
   */
  public setVariable(path: string, value: unknown): void {
    if (this.state !== DebugState.PAUSED || !this.currentContext) {
      log.warn('[DebugExecutor] Cannot set variable - not paused');
      return;
    }

    // Parse path: "workflow.inputs.user_id" or "steps.fetch_user.outputs.user"
    const parts = path.split('.');

    if (parts[0] === 'workflow' && parts[1] === 'inputs') {
      const key = parts.slice(2).join('.');
      this.currentContext.variables.workflowInputs[key] = value;
    } else if (parts[0] === 'steps' && parts[2] === 'outputs') {
      const stepId = parts[1];
      const key = parts.slice(3).join('.');
      if (!this.currentContext.variables.stepOutputs[stepId]) {
        this.currentContext.variables.stepOutputs[stepId] = {};
      }
      // Type-safe assignment using Record<string, unknown>
      const stepOutput: Record<string, unknown> = this.currentContext.variables.stepOutputs[
        stepId
      ] as Record<string, unknown>;
      stepOutput[key] = value;
    }

    log.info('[DebugExecutor] Variable updated', { path, value });
    this.emit('variableChanged', path, value);
  }

  /**
   * Mark execution as completed
   */
  public markCompleted(): void {
    this.state = DebugState.COMPLETED;
    this.stepMode = StepMode.NONE;
    this.currentContext = null;
    this.clearDebugTimeout();
    log.info('[DebugExecutor] Execution completed');
  }

  /**
   * Reset debug state (for new workflow execution)
   */
  public reset(): void {
    this.state = DebugState.RUNNING;
    this.stepMode = StepMode.NONE;
    this.currentContext = null;
    this.clearDebugTimeout();

    // Force resume if waiting
    if (this.resumeResolver) {
      this.resumeResolver();
      this.resumeResolver = null;
      this.resumePromise = null;
    }

    log.info('[DebugExecutor] Debug state reset');
  }

  /**
   * Start debug timeout (prevent indefinite pause)
   */
  private startDebugTimeout(workflowId: string): void {
    this.clearDebugTimeout();

    this.debugTimeoutHandle = setTimeout(() => {
      log.warn('[DebugExecutor] Debug timeout reached - auto-resuming', {
        workflowId,
        timeoutMs: this.debugTimeoutMs,
      });
      this.resume();
    }, this.debugTimeoutMs);
  }

  /**
   * Clear debug timeout
   */
  private clearDebugTimeout(): void {
    if (this.debugTimeoutHandle) {
      clearTimeout(this.debugTimeoutHandle);
      this.debugTimeoutHandle = null;
    }
  }

  /**
   * Set debug timeout duration
   */
  public setDebugTimeout(ms: number): void {
    if (ms < 0) {
      throw new Error('Debug timeout must be non-negative');
    }
    this.debugTimeoutMs = ms;
    log.info('[DebugExecutor] Debug timeout updated', { timeoutMs: ms });
  }
}
