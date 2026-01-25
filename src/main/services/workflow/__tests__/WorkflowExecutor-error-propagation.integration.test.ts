/**
 * WorkflowExecutor - Error Propagation Strategies Integration Tests
 * Wave 9.4.5: Advanced Error Handling
 *
 * Tests error propagation strategies:
 * - fail-fast: Stop immediately on error (default)
 * - fail-silent: Log error and continue execution
 * - fallback: Execute fallback step if primary fails
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkflowExecutor } from '../WorkflowExecutor';
import type { Workflow } from '../../../../shared/types';
import { StepType } from '../../../../shared/types';
import path from 'path';

describe('WorkflowExecutor - Error Propagation Strategies', () => {
  let executor: WorkflowExecutor;
  const projectRoot = path.resolve(__dirname, '../../../../..');

  beforeEach(() => {
    executor = new WorkflowExecutor(projectRoot);
    vi.clearAllMocks();
  });

  describe('Fail-Fast Strategy (Default)', () => {
    it('should stop workflow immediately on step failure with default strategy', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'fail-fast-test',
          version: '1.0.0',
          description: 'Test fail-fast strategy',
        },
        inputs: [],
        steps: [
          {
            id: 'step1',
            type: StepType.OUTPUT,
            message: 'Step 1',
          },
          {
            id: 'failing_step',
            type: StepType.PYTHON,
            script: './nonexistent-script.py', // Will fail
          },
          {
            id: 'step3',
            type: StepType.OUTPUT,
            message: 'Step 3 - Should not execute',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(false);
      expect(result.failedStepId).toBe('failing_step');
      expect(result.successCount).toBe(1); // Only step1
      expect(result.failureCount).toBe(1);
      expect(result.error).toContain('failing_step');
      expect(result.outputs['step3']).toBeUndefined(); // step3 should not execute
    });

    it('should stop workflow when explicit fail-fast strategy is set', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'explicit-fail-fast',
          version: '1.0.0',
          description: 'Test explicit fail-fast',
        },
        inputs: [],
        steps: [
          {
            id: 'step1',
            type: StepType.OUTPUT,
            message: 'Step 1',
          },
          {
            id: 'failing_step',
            type: StepType.PYTHON,
            script: './nonexistent-script.py',
            error_propagation: 'fail-fast', // Explicit
          },
          {
            id: 'step3',
            type: StepType.OUTPUT,
            message: 'Step 3',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(false);
      expect(result.failedStepId).toBe('failing_step');
      expect(result.outputs['step3']).toBeUndefined();
    });
  });

  describe('Fail-Silent Strategy', () => {
    it('should continue execution after step failure with fail-silent strategy', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'fail-silent-test',
          version: '1.0.0',
          description: 'Test fail-silent strategy',
        },
        inputs: [],
        steps: [
          {
            id: 'step1',
            type: StepType.OUTPUT,
            message: 'Step 1',
          },
          {
            id: 'failing_step',
            type: StepType.PYTHON,
            script: './nonexistent-script.py',
            error_propagation: 'fail-silent', // Should continue despite failure
          },
          {
            id: 'step3',
            type: StepType.OUTPUT,
            message: 'Step 3 - Should execute',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      // Workflow should complete successfully despite step failure
      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2); // step1 and step3
      expect(result.failureCount).toBe(1); // failing_step
      expect(result.outputs['step1']).toBeDefined();
      expect(result.outputs['failing_step']).toBeDefined();
      expect(result.outputs['failing_step']._failed).toBe(true);
      expect(result.outputs['failing_step']._error).toBeDefined();
      expect(result.outputs['step3']).toBeDefined();
    });

    it('should apply workflow-level fail-silent default', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'workflow-level-fail-silent',
          version: '1.0.0',
          description: 'Test workflow-level fail-silent',
        },
        inputs: [],
        steps: [
          {
            id: 'step1',
            type: StepType.OUTPUT,
            message: 'Step 1',
          },
          {
            id: 'failing_step',
            type: StepType.PYTHON,
            script: './nonexistent-script.py',
            // No error_propagation specified - should use workflow default
          },
          {
            id: 'step3',
            type: StepType.OUTPUT,
            message: 'Step 3',
          },
        ],
      };

      const result = await executor.execute(
        workflow,
        {},
        {
          errorPropagationStrategy: 'fail-silent', // Workflow-level default
        }
      );

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(1);
      expect(result.outputs['step3']).toBeDefined();
    });

    it('should override workflow-level strategy with step-level strategy', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'strategy-override',
          version: '1.0.0',
          description: 'Test strategy override',
        },
        inputs: [],
        steps: [
          {
            id: 'step1',
            type: StepType.OUTPUT,
            message: 'Step 1',
          },
          {
            id: 'failing_step',
            type: StepType.PYTHON,
            script: './nonexistent-script.py',
            error_propagation: 'fail-fast', // Override workflow default
          },
          {
            id: 'step3',
            type: StepType.OUTPUT,
            message: 'Step 3',
          },
        ],
      };

      const result = await executor.execute(
        workflow,
        {},
        {
          errorPropagationStrategy: 'fail-silent', // Workflow default
        }
      );

      // Step-level fail-fast should override workflow-level fail-silent
      expect(result.success).toBe(false);
      expect(result.failedStepId).toBe('failing_step');
      expect(result.outputs['step3']).toBeUndefined();
    });

    it('should handle multiple fail-silent failures in sequence', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'multiple-fail-silent',
          version: '1.0.0',
          description: 'Test multiple failures',
        },
        inputs: [],
        steps: [
          {
            id: 'failing_step1',
            type: StepType.PYTHON,
            script: './nonexistent1.py',
            error_propagation: 'fail-silent',
          },
          {
            id: 'failing_step2',
            type: StepType.PYTHON,
            script: './nonexistent2.py',
            error_propagation: 'fail-silent',
          },
          {
            id: 'step3',
            type: StepType.OUTPUT,
            message: 'Step 3',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1); // Only step3
      expect(result.failureCount).toBe(2); // Both failing steps
      expect(result.outputs['failing_step1']._failed).toBe(true);
      expect(result.outputs['failing_step2']._failed).toBe(true);
      expect(result.outputs['step3']).toBeDefined();
    });
  });

  describe('Fallback Strategy', () => {
    it('should execute fallback step when primary fails', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'fallback-test',
          version: '1.0.0',
          description: 'Test fallback strategy',
        },
        inputs: [],
        steps: [
          {
            id: 'primary_step',
            type: StepType.PYTHON,
            script: './nonexistent-script.py',
            error_propagation: 'fallback',
            fallback_step: 'backup_step',
          },
          {
            id: 'backup_step',
            type: StepType.OUTPUT,
            message: 'Backup executed',
          },
          {
            id: 'step3',
            type: StepType.OUTPUT,
            message: 'Step 3',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2); // backup_step and step3 (primary recovered via fallback)
      expect(result.failureCount).toBe(0); // Fallback recovered the failure
      expect(result.outputs['primary_step']).toBeDefined();
      expect(result.outputs['primary_step']._fallback_used).toBe(true);
      expect(result.outputs['primary_step']._primary_error).toBeDefined();
      expect(result.outputs['step3']).toBeDefined();
    });

    it('should fail workflow if both primary and fallback fail', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'fallback-also-fails',
          version: '1.0.0',
          description: 'Test fallback failure',
        },
        inputs: [],
        steps: [
          {
            id: 'primary_step',
            type: StepType.PYTHON,
            script: './nonexistent-primary.py',
            error_propagation: 'fallback',
            fallback_step: 'backup_step',
          },
          {
            id: 'backup_step',
            type: StepType.PYTHON,
            script: './nonexistent-backup.py', // Fallback also fails
          },
          {
            id: 'step3',
            type: StepType.OUTPUT,
            message: 'Step 3',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('primary_step');
      expect(result.error).toContain('backup_step');
      expect(result.error).toContain('both failed');
      expect(result.outputs['step3']).toBeUndefined(); // Should not execute
    });

    it('should fail if fallback strategy is set but no fallback_step defined', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'missing-fallback-step',
          version: '1.0.0',
          description: 'Test missing fallback_step',
        },
        inputs: [],
        steps: [
          {
            id: 'primary_step',
            type: StepType.PYTHON,
            script: './nonexistent-script.py',
            error_propagation: 'fallback',
            // Missing fallback_step
          },
          {
            id: 'step2',
            type: StepType.OUTPUT,
            message: 'Step 2',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('no fallback_step defined');
      expect(result.outputs['step2']).toBeUndefined();
    });

    it('should fail if fallback_step does not exist in workflow', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'nonexistent-fallback',
          version: '1.0.0',
          description: 'Test nonexistent fallback',
        },
        inputs: [],
        steps: [
          {
            id: 'primary_step',
            type: StepType.PYTHON,
            script: './nonexistent-script.py',
            error_propagation: 'fallback',
            fallback_step: 'nonexistent_backup', // Doesn't exist
          },
          {
            id: 'step2',
            type: StepType.OUTPUT,
            message: 'Step 2',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('fallback step');
      expect(result.error).toContain('not found');
      expect(result.outputs['step2']).toBeUndefined();
    });

    it('should pass error context to fallback step via stepOutputs', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'fallback-error-context',
          version: '1.0.0',
          description: 'Test error context passing',
        },
        inputs: [],
        steps: [
          {
            id: 'primary_step',
            type: StepType.PYTHON,
            script: './nonexistent-script.py',
            error_propagation: 'fallback',
            fallback_step: 'backup_step',
          },
          {
            id: 'backup_step',
            type: StepType.OUTPUT,
            message: 'Backup with error: ${steps.primary_step.outputs._error}',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs['primary_step']._fallback_used).toBe(true);
      expect(result.outputs['primary_step']._primary_error).toBeDefined();
    });
  });

  describe('Parallel Execution with Error Propagation', () => {
    it('should apply fail-fast in parallel execution', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'parallel-fail-fast',
          version: '1.0.0',
          description: 'Test parallel fail-fast',
        },
        inputs: [],
        steps: [
          {
            id: 'step1',
            type: StepType.OUTPUT,
            message: 'Step 1',
          },
          {
            id: 'step2',
            type: StepType.OUTPUT,
            message: 'Step 2',
          },
          {
            id: 'failing_step',
            type: StepType.PYTHON,
            script: './nonexistent.py',
            depends_on: ['step1', 'step2'],
            // Default fail-fast
          },
          {
            id: 'step4',
            type: StepType.OUTPUT,
            message: 'Step 4',
            depends_on: ['failing_step'],
          },
        ],
      };

      const result = await executor.execute(
        workflow,
        {},
        {
          enableParallelExecution: true,
        }
      );

      expect(result.success).toBe(false);
      expect(result.failedStepId).toBe('failing_step');
      expect(result.outputs['step4']).toBeUndefined();
    });

    it('should apply fail-silent in parallel execution', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'parallel-fail-silent',
          version: '1.0.0',
          description: 'Test parallel fail-silent',
        },
        inputs: [],
        steps: [
          {
            id: 'step1',
            type: StepType.OUTPUT,
            message: 'Step 1',
          },
          {
            id: 'step2',
            type: StepType.OUTPUT,
            message: 'Step 2',
          },
          {
            id: 'failing_step',
            type: StepType.PYTHON,
            script: './nonexistent.py',
            depends_on: ['step1', 'step2'],
            error_propagation: 'fail-silent',
          },
          {
            id: 'step4',
            type: StepType.OUTPUT,
            message: 'Step 4',
            depends_on: ['failing_step'],
          },
        ],
      };

      const result = await executor.execute(
        workflow,
        {},
        {
          enableParallelExecution: true,
        }
      );

      expect(result.success).toBe(true);
      expect(result.outputs['failing_step']._failed).toBe(true);
      expect(result.outputs['step4']).toBeDefined();
    });
  });

  describe('Mixed Error Strategies', () => {
    it('should handle workflow with mixed error strategies', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'mixed-strategies',
          version: '1.0.0',
          description: 'Test mixed strategies',
        },
        inputs: [],
        steps: [
          {
            id: 'step1',
            type: StepType.PYTHON,
            script: './nonexistent1.py',
            error_propagation: 'fail-silent', // Continue
          },
          {
            id: 'step2',
            type: StepType.PYTHON,
            script: './nonexistent2.py',
            error_propagation: 'fallback',
            fallback_step: 'backup2',
          },
          {
            id: 'backup2',
            type: StepType.OUTPUT,
            message: 'Backup 2',
          },
          {
            id: 'step3',
            type: StepType.OUTPUT,
            message: 'Step 3',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs['step1']._failed).toBe(true); // fail-silent
      expect(result.outputs['step2']._fallback_used).toBe(true); // fallback succeeded
      expect(result.outputs['step3']).toBeDefined();
    });
  });
});
