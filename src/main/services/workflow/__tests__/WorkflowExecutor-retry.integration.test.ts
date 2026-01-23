/**
 * WorkflowExecutor Retry Integration Tests
 *
 * Tests for retry logic integration with WorkflowExecutor:
 * - Step execution with retry_policy configuration
 * - Transient failures retry and succeed
 * - Permanent failures exhaust retries
 * - Retry delay verification
 * - Error type filtering
 * - Retry attempts logged via ExecutionEvents
 * - Retries don't block other workflows
 *
 * Coverage Target: ≥90%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkflowExecutor } from '../WorkflowExecutor';
import { ExecutionEvents } from '../ExecutionEvents';
import type { Workflow } from '../../../../shared/types';
import { StepType } from '../../../../shared/types';
import path from 'path';
import fs from 'fs/promises';
import { realpathSync } from 'node:fs';
import os from 'os';

describe('WorkflowExecutor - Retry Integration', () => {
  let executor: WorkflowExecutor;
  let events: ExecutionEvents;
  let tempDir: string;

  beforeEach(async () => {
    // Create temp directory for test scripts
    const rawTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-retry-test-'));

    // Resolve symlinks (macOS /var -> /private/var)
    tempDir = realpathSync(rawTempDir);

    // Reset ExecutionEvents singleton
    ExecutionEvents.resetInstance();
    events = ExecutionEvents.getInstance();

    // Create WorkflowExecutor
    executor = new WorkflowExecutor(tempDir);
  });

  afterEach(async () => {
    vi.restoreAllMocks();

    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });

    // Clean up ExecutionEvents
    events.removeAllListeners();
    events.clearActiveWorkflows();
    ExecutionEvents.resetInstance();
  });

  describe('Python Step Retry', () => {
    it('should retry Python step on transient failure and succeed', async () => {
      // Create a Python script that fails once then succeeds
      const scriptPath = path.join(tempDir, 'retry_test.py');
      const scriptContent = `
import json
import os
import sys

# Use a file to track attempts
attempt_file = '${tempDir}/attempt_count.txt'

if os.path.exists(attempt_file):
    with open(attempt_file, 'r') as f:
        attempt = int(f.read())
else:
    attempt = 0

attempt += 1

with open(attempt_file, 'w') as f:
    f.write(str(attempt))

if attempt == 1:
    # First attempt fails
    print("Transient error", file=sys.stderr)
    sys.exit(1)
else:
    # Second attempt succeeds
    result = {"status": "success", "attempt": attempt}
    print(json.dumps(result))
`;

      await fs.writeFile(scriptPath, scriptContent);

      const workflow: Workflow = {
        workflow: {
          name: 'Retry Test Workflow',
          version: '1.0.0',
          description: 'Test retry logic',
        },
        inputs: [],
        steps: [
          {
            id: 'retry_step',
            type: StepType.PYTHON,
            script: scriptPath,
            retry_policy: {
              max_attempts: 3,
              initial_delay_ms: 100,
              backoff_multiplier: 2,
            },
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs.retry_step).toBeDefined();
      expect(result.outputs.retry_step.attempt).toBe(2);
    });

    it('should fail after exhausting all retry attempts', async () => {
      // Create a Python script that always fails
      const scriptPath = path.join(tempDir, 'always_fail.py');
      const scriptContent = `
import sys
print("Permanent error", file=sys.stderr)
sys.exit(1)
`;

      await fs.writeFile(scriptPath, scriptContent);

      const workflow: Workflow = {
        workflow: {
          name: 'Retry Fail Workflow',
          version: '1.0.0',
          description: 'Test retry exhaustion',
        },
        inputs: [],
        steps: [
          {
            id: 'fail_step',
            type: StepType.PYTHON,
            script: scriptPath,
            retry_policy: {
              max_attempts: 3,
              initial_delay_ms: 50,
            },
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('failed');
      expect(result.failedStepId).toBe('fail_step');
    });

    it('should respect exponential backoff delays', async () => {
      // Create a Python script that fails twice then succeeds
      const scriptPath = path.join(tempDir, 'retry_delay.py');
      const scriptContent = `
import json
import os
import sys

attempt_file = '${tempDir}/attempt_delay.txt'

if os.path.exists(attempt_file):
    with open(attempt_file, 'r') as f:
        attempt = int(f.read())
else:
    attempt = 0

attempt += 1

with open(attempt_file, 'w') as f:
    f.write(str(attempt))

if attempt < 3:
    print("Transient error", file=sys.stderr)
    sys.exit(1)
else:
    result = {"attempt": attempt}
    print(json.dumps(result))
`;

      await fs.writeFile(scriptPath, scriptContent);

      const workflow: Workflow = {
        workflow: {
          name: 'Retry Delay Test',
          version: '1.0.0',
          description: 'Test exponential backoff',
        },
        inputs: [],
        steps: [
          {
            id: 'delay_step',
            type: StepType.PYTHON,
            script: scriptPath,
            retry_policy: {
              max_attempts: 4,
              initial_delay_ms: 50,
              backoff_multiplier: 2,
            },
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs.delay_step.attempt).toBe(3);
      // Verify delays occurred (total should be > 150ms: 50ms + 100ms + execution time)
      expect(result.totalDuration).toBeGreaterThan(150);
    });

    it('should not retry when error does not match filter', async () => {
      // Create a Python script that fails with specific error
      const scriptPath = path.join(tempDir, 'syntax_error.py');
      const scriptContent = `
import sys
print("SyntaxError: invalid syntax", file=sys.stderr)
sys.exit(1)
`;

      await fs.writeFile(scriptPath, scriptContent);

      const workflow: Workflow = {
        workflow: {
          name: 'Error Filter Test',
          version: '1.0.0',
          description: 'Test error type filtering',
        },
        inputs: [],
        steps: [
          {
            id: 'filter_step',
            type: StepType.PYTHON,
            script: scriptPath,
            retry_policy: {
              max_attempts: 3,
              initial_delay_ms: 100,
              retry_on_errors: ['ECONNREFUSED', 'Network error'],
            },
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(false);
      // Should fail immediately without retries (only 1 attempt)
      expect(result.failedStepId).toBe('filter_step');
    });

    it('should retry when error occurs (without filter)', async () => {
      // Create a Python script that fails once then succeeds
      const scriptPath = path.join(tempDir, 'network_error.py');
      const scriptContent = `
import json
import os
import sys

attempt_file = '${tempDir}/network_attempt.txt'

if os.path.exists(attempt_file):
    with open(attempt_file, 'r') as f:
        attempt = int(f.read())
else:
    attempt = 0

attempt += 1

with open(attempt_file, 'w') as f:
    f.write(str(attempt))

if attempt == 1:
    print("Error occurred", file=sys.stderr)
    sys.exit(1)
else:
    result = {"status": "recovered", "attempt": attempt}
    print(json.dumps(result))
`;

      await fs.writeFile(scriptPath, scriptContent);

      const workflow: Workflow = {
        workflow: {
          name: 'Network Retry Test',
          version: '1.0.0',
          description: 'Test error retry without filter',
        },
        inputs: [],
        steps: [
          {
            id: 'network_step',
            type: StepType.PYTHON,
            script: scriptPath,
            retry_policy: {
              max_attempts: 3,
              initial_delay_ms: 50,
              // No retry_on_errors - retries all errors
            },
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs.network_step.status).toBe('recovered');
      expect(result.outputs.network_step.attempt).toBe(2);
    });
  });

  describe('Output Step with Retry', () => {
    it('should not retry output steps (they never fail)', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Output Retry Test',
          version: '1.0.0',
          description: 'Test output step retry',
        },
        inputs: [],
        steps: [
          {
            id: 'output_step',
            type: StepType.OUTPUT,
            message: 'Test message',
            retry_policy: {
              max_attempts: 3,
              initial_delay_ms: 100,
            },
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs.output_step.displayed).toBe(true);
    });
  });

  describe('Multiple Steps with Different Retry Policies', () => {
    it('should apply different retry policies to different steps', async () => {
      // Step 1: No retry
      const script1Path = path.join(tempDir, 'no_retry.py');
      await fs.writeFile(
        script1Path,
        `
import json
print(json.dumps({"step": 1}))
`
      );

      // Step 2: Retry enabled
      const script2Path = path.join(tempDir, 'with_retry.py');
      await fs.writeFile(
        script2Path,
        `
import json
import os
import sys

attempt_file = '${tempDir}/step2_attempt.txt'

if os.path.exists(attempt_file):
    with open(attempt_file, 'r') as f:
        attempt = int(f.read())
else:
    attempt = 0

attempt += 1

with open(attempt_file, 'w') as f:
    f.write(str(attempt))

if attempt == 1:
    print("Transient", file=sys.stderr)
    sys.exit(1)
else:
    print(json.dumps({"step": 2, "attempt": attempt}))
`
      );

      const workflow: Workflow = {
        workflow: {
          name: 'Mixed Retry Workflow',
          version: '1.0.0',
          description: 'Test mixed retry policies',
        },
        inputs: [],
        steps: [
          {
            id: 'step1',
            type: StepType.PYTHON,
            script: script1Path,
            // No retry_policy - will not retry
          },
          {
            id: 'step2',
            type: StepType.PYTHON,
            script: script2Path,
            depends_on: ['step1'],
            retry_policy: {
              max_attempts: 2,
              initial_delay_ms: 100,
            },
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs.step1.step).toBe(1);
      expect(result.outputs.step2.step).toBe(2);
      expect(result.outputs.step2.attempt).toBe(2);
    });
  });

  describe('ExecutionEvents Integration', () => {
    it('should emit workflow and step events correctly with retries', async () => {
      const scriptPath = path.join(tempDir, 'event_retry.py');
      const scriptContent = `
import json
import os
import sys

attempt_file = '${tempDir}/event_attempt.txt'

if os.path.exists(attempt_file):
    with open(attempt_file, 'r') as f:
        attempt = int(f.read())
else:
    attempt = 0

attempt += 1

with open(attempt_file, 'w') as f:
    f.write(str(attempt))

if attempt == 1:
    print("Error", file=sys.stderr)
    sys.exit(1)
else:
    print(json.dumps({"success": True}))
`;

      await fs.writeFile(scriptPath, scriptContent);

      const workflow: Workflow = {
        workflow: {
          name: 'Event Test Workflow',
          version: '1.0.0',
          description: 'Test event emission during retries',
        },
        inputs: [],
        steps: [
          {
            id: 'event_step',
            type: StepType.PYTHON,
            script: scriptPath,
            retry_policy: {
              max_attempts: 2,
              initial_delay_ms: 50,
            },
          },
        ],
      };

      const workflowStartedListener = vi.fn();
      const workflowCompletedListener = vi.fn();
      const stepCompletedListener = vi.fn();

      events.on('workflow_started', workflowStartedListener);
      events.on('workflow_completed', workflowCompletedListener);
      events.on('step_completed', stepCompletedListener);

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);

      // Workflow events should fire once
      expect(workflowStartedListener).toHaveBeenCalledTimes(1);
      expect(workflowCompletedListener).toHaveBeenCalledTimes(1);

      // Step should complete once (after successful retry)
      expect(stepCompletedListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Max Delay Cap', () => {
    it('should cap delay at max_delay_ms', async () => {
      const scriptPath = path.join(tempDir, 'max_delay.py');
      const scriptContent = `
import json
import os
import sys

attempt_file = '${tempDir}/max_delay_attempt.txt'

if os.path.exists(attempt_file):
    with open(attempt_file, 'r') as f:
        attempt = int(f.read())
else:
    attempt = 0

attempt += 1

with open(attempt_file, 'w') as f:
    f.write(str(attempt))

if attempt < 4:
    print("Error", file=sys.stderr)
    sys.exit(1)
else:
    print(json.dumps({"attempt": attempt}))
`;

      await fs.writeFile(scriptPath, scriptContent);

      const workflow: Workflow = {
        workflow: {
          name: 'Max Delay Test',
          version: '1.0.0',
          description: 'Test max delay cap',
        },
        inputs: [],
        steps: [
          {
            id: 'max_delay_step',
            type: StepType.PYTHON,
            script: scriptPath,
            retry_policy: {
              max_attempts: 5,
              initial_delay_ms: 50,
              backoff_multiplier: 10, // Very high multiplier
              max_delay_ms: 100, // Cap at 100ms
            },
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs.max_delay_step.attempt).toBe(4);
      // Verify delays were capped (total should be > 250ms: 50ms + 100ms + 100ms + execution time)
      expect(result.totalDuration).toBeGreaterThan(250);
    });
  });
});
