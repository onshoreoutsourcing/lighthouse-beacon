/**
 * PythonExecutor + ExecutionEvents Integration Tests
 *
 * Tests integration between PythonExecutor and ExecutionEvents:
 * - Event emission during script execution
 * - step_started event timing
 * - step_completed event with outputs
 * - step_failed event on errors
 * - Workflow tracking disabled when no workflowId provided
 *
 * Coverage Target: ≥90% for integration flow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PythonExecutor } from '../PythonExecutor';
import { ExecutionEvents } from '../ExecutionEvents';
import { mkdirSync, writeFileSync, rmSync, existsSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('PythonExecutor + ExecutionEvents Integration', () => {
  let testProjectRoot: string;
  let executor: PythonExecutor;
  let executionEvents: ExecutionEvents;

  beforeEach(() => {
    // Create temporary project directory
    const rawTestDir = join(tmpdir(), `lighthouse-test-${Date.now()}`);
    mkdirSync(rawTestDir, { recursive: true });
    testProjectRoot = realpathSync(rawTestDir);

    // Create scripts directory
    const scriptsDir = join(testProjectRoot, 'scripts');
    mkdirSync(scriptsDir, { recursive: true });

    // Reset ExecutionEvents
    ExecutionEvents.resetInstance();
    executionEvents = ExecutionEvents.getInstance();

    // Initialize executor
    executor = new PythonExecutor(testProjectRoot);
  });

  afterEach(() => {
    // Clean up
    if (existsSync(testProjectRoot)) {
      rmSync(testProjectRoot, { recursive: true, force: true });
    }
    executionEvents.removeAllListeners();
    executionEvents.clearActiveWorkflows();
    ExecutionEvents.resetInstance();
  });

  describe('Event Emission During Execution', () => {
    it('should emit step_started and step_completed for successful execution', async () => {
      // Create simple echo script
      const scriptPath = join(testProjectRoot, 'scripts', 'echo.py');
      writeFileSync(
        scriptPath,
        `
import sys
import json

inputs = json.loads(sys.stdin.read())
outputs = {"result": inputs.get("input", "default")}
print(json.dumps(outputs))
        `.trim()
      );

      // Setup event listeners
      const stepStartedListener = vi.fn();
      const stepCompletedListener = vi.fn();
      const stepFailedListener = vi.fn();

      executionEvents.on('step_started', stepStartedListener);
      executionEvents.on('step_completed', stepCompletedListener);
      executionEvents.on('step_failed', stepFailedListener);

      // Execute with workflow tracking
      const result = await executor.executeScript(
        'scripts/echo.py',
        { input: 'test' },
        { workflowId: 'workflow-1', stepId: 'step-1' }
      );

      // Verify execution succeeded
      expect(result.success).toBe(true);
      expect(result.output).toEqual({ result: 'test' });

      // Verify step_started was emitted
      expect(stepStartedListener).toHaveBeenCalledTimes(1);
      expect(stepStartedListener.mock.calls[0]![0]).toMatchObject({
        workflowId: 'workflow-1',
        stepId: 'step-1',
        timestamp: expect.any(Number),
      });

      // Verify step_completed was emitted
      expect(stepCompletedListener).toHaveBeenCalledTimes(1);
      expect(stepCompletedListener.mock.calls[0]![0]).toMatchObject({
        workflowId: 'workflow-1',
        stepId: 'step-1',
        outputs: { result: 'test' },
        duration: expect.any(Number),
        timestamp: expect.any(Number),
      });

      // Verify step_failed was NOT emitted
      expect(stepFailedListener).not.toHaveBeenCalled();
    });

    it('should emit step_started and step_failed for failed execution', async () => {
      // Create script that exits with error
      const scriptPath = join(testProjectRoot, 'scripts', 'fail.py');
      writeFileSync(
        scriptPath,
        `
import sys
sys.stderr.write("Intentional error\\n")
sys.exit(1)
        `.trim()
      );

      // Setup event listeners
      const stepStartedListener = vi.fn();
      const stepCompletedListener = vi.fn();
      const stepFailedListener = vi.fn();

      executionEvents.on('step_started', stepStartedListener);
      executionEvents.on('step_completed', stepCompletedListener);
      executionEvents.on('step_failed', stepFailedListener);

      // Execute with workflow tracking
      const result = await executor.executeScript(
        'scripts/fail.py',
        {},
        { workflowId: 'workflow-1', stepId: 'step-2' }
      );

      // Verify execution failed
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);

      // Verify step_started was emitted
      expect(stepStartedListener).toHaveBeenCalledTimes(1);
      expect(stepStartedListener.mock.calls[0]![0]).toMatchObject({
        workflowId: 'workflow-1',
        stepId: 'step-2',
      });

      // Verify step_failed was emitted
      expect(stepFailedListener).toHaveBeenCalledTimes(1);
      expect(stepFailedListener.mock.calls[0]![0]).toMatchObject({
        workflowId: 'workflow-1',
        stepId: 'step-2',
        error: expect.stringContaining('exited with code 1'),
        duration: expect.any(Number),
        exitCode: 1,
        timestamp: expect.any(Number),
      });

      // Verify step_completed was NOT emitted
      expect(stepCompletedListener).not.toHaveBeenCalled();
    });

    it('should emit step_failed on script validation error', async () => {
      // Setup event listener
      const stepFailedListener = vi.fn();
      executionEvents.on('step_failed', stepFailedListener);

      // Try to execute non-existent script
      const result = await executor.executeScript(
        'scripts/nonexistent.py',
        {},
        { workflowId: 'workflow-1', stepId: 'step-3' }
      );

      // Verify execution failed
      expect(result.success).toBe(false);

      // Verify step_failed was emitted
      expect(stepFailedListener).toHaveBeenCalledTimes(1);
      expect(stepFailedListener.mock.calls[0]![0]).toMatchObject({
        workflowId: 'workflow-1',
        stepId: 'step-3',
        error: expect.stringContaining('not found'),
        exitCode: -1,
      });
    });

    it('should NOT emit events when workflowId not provided', async () => {
      // Create simple echo script
      const scriptPath = join(testProjectRoot, 'scripts', 'echo.py');
      writeFileSync(
        scriptPath,
        `
import sys
import json

inputs = json.loads(sys.stdin.read())
outputs = {"result": "ok"}
print(json.dumps(outputs))
        `.trim()
      );

      // Setup event listeners
      const stepStartedListener = vi.fn();
      const stepCompletedListener = vi.fn();

      executionEvents.on('step_started', stepStartedListener);
      executionEvents.on('step_completed', stepCompletedListener);

      // Execute WITHOUT workflow tracking
      const result = await executor.executeScript('scripts/echo.py', {});

      // Verify execution succeeded
      expect(result.success).toBe(true);

      // Verify NO events were emitted
      expect(stepStartedListener).not.toHaveBeenCalled();
      expect(stepCompletedListener).not.toHaveBeenCalled();
    });

    it('should NOT emit events when stepId not provided', async () => {
      // Create simple echo script
      const scriptPath = join(testProjectRoot, 'scripts', 'echo.py');
      writeFileSync(
        scriptPath,
        `
import sys
import json
print(json.dumps({"result": "ok"}))
        `.trim()
      );

      // Setup event listeners
      const stepStartedListener = vi.fn();
      const stepCompletedListener = vi.fn();

      executionEvents.on('step_started', stepStartedListener);
      executionEvents.on('step_completed', stepCompletedListener);

      // Execute with workflowId but WITHOUT stepId
      const result = await executor.executeScript(
        'scripts/echo.py',
        {},
        { workflowId: 'workflow-1' }
      );

      // Verify execution succeeded
      expect(result.success).toBe(true);

      // Verify NO events were emitted (both workflowId and stepId required)
      expect(stepStartedListener).not.toHaveBeenCalled();
      expect(stepCompletedListener).not.toHaveBeenCalled();
    });
  });

  describe('Event Timing', () => {
    it('should emit step_started before execution begins', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'delay.py');
      writeFileSync(
        scriptPath,
        `
import sys
import json
import time

time.sleep(0.1)
print(json.dumps({"result": "done"}))
        `.trim()
      );

      let stepStartedTime = 0;
      let executionStartTime = 0;

      executionEvents.on('step_started', () => {
        stepStartedTime = Date.now();
      });

      executionStartTime = Date.now();
      await executor.executeScript(
        'scripts/delay.py',
        {},
        { workflowId: 'workflow-1', stepId: 'step-1' }
      );

      // step_started should be emitted immediately (before 100ms delay)
      expect(stepStartedTime).toBeGreaterThanOrEqual(executionStartTime);
      expect(stepStartedTime).toBeLessThan(executionStartTime + 50); // Should be almost immediate
    });

    it('should include accurate duration in step_completed', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'timed.py');
      writeFileSync(
        scriptPath,
        `
import sys
import json
import time

time.sleep(0.1)  # 100ms delay
print(json.dumps({"result": "done"}))
        `.trim()
      );

      const stepCompletedListener = vi.fn();
      executionEvents.on('step_completed', stepCompletedListener);

      await executor.executeScript(
        'scripts/timed.py',
        {},
        { workflowId: 'workflow-1', stepId: 'step-1' }
      );

      expect(stepCompletedListener).toHaveBeenCalledTimes(1);
      const eventData = stepCompletedListener.mock.calls[0]![0];

      // Duration should be at least 100ms (script sleep time)
      expect(eventData.duration).toBeGreaterThanOrEqual(100);
      expect(eventData.duration).toBeLessThan(500); // But not too long
    });
  });

  describe('Multiple Step Execution', () => {
    it('should emit events for multiple sequential steps', async () => {
      const scriptPath = join(testProjectRoot, 'scripts', 'echo.py');
      writeFileSync(
        scriptPath,
        `
import sys
import json

inputs = json.loads(sys.stdin.read())
outputs = {"step": inputs.get("step", "unknown")}
print(json.dumps(outputs))
        `.trim()
      );

      const stepStartedListener = vi.fn();
      const stepCompletedListener = vi.fn();

      executionEvents.on('step_started', stepStartedListener);
      executionEvents.on('step_completed', stepCompletedListener);

      // Execute multiple steps
      await executor.executeScript(
        'scripts/echo.py',
        { step: 'step1' },
        { workflowId: 'wf-1', stepId: 'step-1' }
      );
      await executor.executeScript(
        'scripts/echo.py',
        { step: 'step2' },
        { workflowId: 'wf-1', stepId: 'step-2' }
      );
      await executor.executeScript(
        'scripts/echo.py',
        { step: 'step3' },
        { workflowId: 'wf-1', stepId: 'step-3' }
      );

      // Verify all events emitted
      expect(stepStartedListener).toHaveBeenCalledTimes(3);
      expect(stepCompletedListener).toHaveBeenCalledTimes(3);

      // Verify correct step IDs
      expect(stepStartedListener.mock.calls[0]![0].stepId).toBe('step-1');
      expect(stepStartedListener.mock.calls[1]![0].stepId).toBe('step-2');
      expect(stepStartedListener.mock.calls[2]![0].stepId).toBe('step-3');
    });
  });
});
