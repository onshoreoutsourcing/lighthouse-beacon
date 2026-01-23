/**
 * WorkflowExecutor Conditional Execution Integration Tests
 *
 * Tests conditional branching in workflow execution (Wave 9.4.1)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowExecutor } from '../WorkflowExecutor';
import type { Workflow } from '../../../../shared/types';
import { StepType } from '../../../../shared/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('WorkflowExecutor - Conditional Execution', () => {
  let testDir: string;
  let executor: WorkflowExecutor;

  beforeEach(() => {
    // Create temp directory for test files
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-test-'));
    executor = new WorkflowExecutor(testDir);
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('True Branch Execution', () => {
    it('should execute then_steps when condition is true', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'True Branch Test',
          version: '1.0.0',
          description: 'Test true branch execution',
        },
        inputs: [],
        steps: [
          {
            id: 'check_value',
            type: StepType.CONDITIONAL,
            label: 'Check if value > 50',
            condition: '${workflow.inputs.value} > 50',
            then_steps: ['action_true'],
            else_steps: ['action_false'],
          },
          {
            id: 'action_true',
            type: StepType.OUTPUT,
            label: 'True Action',
            depends_on: ['check_value'],
            message: 'Value is greater than 50',
          },
          {
            id: 'action_false',
            type: StepType.OUTPUT,
            label: 'False Action',
            depends_on: ['check_value'],
            message: 'Value is 50 or less',
          },
        ],
      };

      const result = await executor.execute(workflow, { value: 75 });

      expect(result.success).toBe(true);
      expect(result.outputs.check_value).toBeDefined();
      expect(result.outputs.check_value?.result).toBe(true);
      expect(result.outputs.check_value?.branch_taken).toBe('true');

      // Then step should execute
      expect(result.outputs.action_true).toBeDefined();
      expect(result.outputs.action_true?.displayed).toBe(true);

      // Else step should be skipped
      expect(result.outputs.action_false).toBeUndefined();

      expect(result.successCount).toBe(2); // conditional + action_true
    });

    it('should handle multiple steps in then branch', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Multiple Then Steps',
          version: '1.0.0',
          description: 'Test multiple then_steps',
        },
        inputs: [],
        steps: [
          {
            id: 'check',
            type: StepType.CONDITIONAL,
            condition: 'true',
            then_steps: ['step1', 'step2'],
          },
          {
            id: 'step1',
            type: StepType.OUTPUT,
            depends_on: ['check'],
            message: 'Step 1',
          },
          {
            id: 'step2',
            type: StepType.OUTPUT,
            depends_on: ['check'],
            message: 'Step 2',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs.check?.branch_taken).toBe('true');
      expect(result.outputs.step1).toBeDefined();
      expect(result.outputs.step2).toBeDefined();
      expect(result.successCount).toBe(3);
    });
  });

  describe('False Branch Execution', () => {
    it('should execute else_steps when condition is false', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'False Branch Test',
          version: '1.0.0',
          description: 'Test false branch execution',
        },
        inputs: [],
        steps: [
          {
            id: 'check_value',
            type: StepType.CONDITIONAL,
            condition: '${workflow.inputs.value} > 50',
            then_steps: ['action_true'],
            else_steps: ['action_false'],
          },
          {
            id: 'action_true',
            type: StepType.OUTPUT,
            depends_on: ['check_value'],
            message: 'Value is greater than 50',
          },
          {
            id: 'action_false',
            type: StepType.OUTPUT,
            depends_on: ['check_value'],
            message: 'Value is 50 or less',
          },
        ],
      };

      const result = await executor.execute(workflow, { value: 25 });

      expect(result.success).toBe(true);
      expect(result.outputs.check_value).toBeDefined();
      expect(result.outputs.check_value?.result).toBe(false);
      expect(result.outputs.check_value?.branch_taken).toBe('false');

      // Then step should be skipped
      expect(result.outputs.action_true).toBeUndefined();

      // Else step should execute
      expect(result.outputs.action_false).toBeDefined();
      expect(result.outputs.action_false?.displayed).toBe(true);

      expect(result.successCount).toBe(2); // conditional + action_false
    });

    it('should skip all steps when condition is false and no else_steps', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'No Else Steps',
          version: '1.0.0',
          description: 'Test conditional without else branch',
        },
        inputs: [],
        steps: [
          {
            id: 'check',
            type: StepType.CONDITIONAL,
            condition: 'false',
            then_steps: ['action'],
          },
          {
            id: 'action',
            type: StepType.OUTPUT,
            depends_on: ['check'],
            message: 'Action',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs.check?.branch_taken).toBe('false');
      expect(result.outputs.action).toBeUndefined();
      expect(result.successCount).toBe(1); // Only conditional step
    });
  });

  describe('Complex Conditions', () => {
    it('should evaluate complex logical expressions', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Complex Condition',
          version: '1.0.0',
          description: 'Test complex condition evaluation',
        },
        inputs: [],
        steps: [
          {
            id: 'check',
            type: StepType.CONDITIONAL,
            condition: '${workflow.inputs.age} >= 18 && ${workflow.inputs.status} === "active"',
            then_steps: ['action'],
          },
          {
            id: 'action',
            type: StepType.OUTPUT,
            depends_on: ['check'],
            message: 'Eligible',
          },
        ],
      };

      const result = await executor.execute(workflow, { age: 25, status: 'active' });

      expect(result.success).toBe(true);
      expect(result.outputs.check?.result).toBe(true);
      expect(result.outputs.action).toBeDefined();
    });

    it('should handle conditions with string equality', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'String Condition',
          version: '1.0.0',
          description: 'Test condition with string equality',
        },
        inputs: [],
        steps: [
          {
            id: 'check_status',
            type: StepType.CONDITIONAL,
            condition: '${workflow.inputs.status} === "active"',
            then_steps: ['approved'],
            else_steps: ['denied'],
          },
          {
            id: 'approved',
            type: StepType.OUTPUT,
            depends_on: ['check_status'],
            message: 'Approved',
          },
          {
            id: 'denied',
            type: StepType.OUTPUT,
            depends_on: ['check_status'],
            message: 'Denied',
          },
        ],
      };

      const result = await executor.execute(workflow, { status: 'active' });

      expect(result.success).toBe(true);
      expect(result.outputs.check_status?.result).toBe(true);
      expect(result.outputs.check_status?.branch_taken).toBe('true');
      expect(result.outputs.approved).toBeDefined();
      expect(result.outputs.denied).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should fail when condition evaluation fails', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Invalid Condition',
          version: '1.0.0',
          description: 'Test condition error handling',
        },
        inputs: [],
        steps: [
          {
            id: 'check',
            type: StepType.CONDITIONAL,
            condition: '${workflow.inputs.undefined_variable} > 50',
            then_steps: ['action'],
          },
          {
            id: 'action',
            type: StepType.OUTPUT,
            depends_on: ['check'],
            message: 'Action',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(false);
      expect(result.failedStepId).toBe('check');
      expect(result.error).toContain('Variable resolution failed');
    });

    it('should fail when condition has invalid syntax', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Invalid Syntax',
          version: '1.0.0',
          description: 'Test invalid condition syntax',
        },
        inputs: [],
        steps: [
          {
            id: 'check',
            type: StepType.CONDITIONAL,
            condition: 'not a valid condition',
            then_steps: ['action'],
          },
          {
            id: 'action',
            type: StepType.OUTPUT,
            depends_on: ['check'],
            message: 'Action',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(false);
      expect(result.failedStepId).toBe('check');
      expect(result.error).toContain('Invalid expression');
    });
  });

  describe('Multiple Conditionals', () => {
    it('should handle multiple conditional steps in sequence', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Sequential Conditionals',
          version: '1.0.0',
          description: 'Test multiple sequential conditionals',
        },
        inputs: [],
        steps: [
          {
            id: 'check1',
            type: StepType.CONDITIONAL,
            condition: '${workflow.inputs.value} > 50',
            then_steps: ['check2'],
          },
          {
            id: 'check2',
            type: StepType.CONDITIONAL,
            condition: '${workflow.inputs.value} < 100',
            then_steps: ['action'],
            depends_on: ['check1'],
          },
          {
            id: 'action',
            type: StepType.OUTPUT,
            depends_on: ['check2'],
            message: 'In range',
          },
        ],
      };

      const result = await executor.execute(workflow, { value: 75 });

      expect(result.success).toBe(true);
      expect(result.outputs.check1?.branch_taken).toBe('true');
      expect(result.outputs.check2?.branch_taken).toBe('true');
      expect(result.outputs.action).toBeDefined();
      expect(result.successCount).toBe(3);
    });

    it('should handle nested conditional logic', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Nested Conditionals',
          version: '1.0.0',
          description: 'Test nested conditional branching',
        },
        inputs: [],
        steps: [
          {
            id: 'check_age',
            type: StepType.CONDITIONAL,
            condition: '${workflow.inputs.age} >= 18',
            then_steps: ['check_status'],
            else_steps: ['reject'],
          },
          {
            id: 'check_status',
            type: StepType.CONDITIONAL,
            condition: '${workflow.inputs.status} === "active"',
            then_steps: ['approve'],
            else_steps: ['pending'],
            depends_on: ['check_age'],
          },
          {
            id: 'approve',
            type: StepType.OUTPUT,
            depends_on: ['check_status'],
            message: 'Approved',
          },
          {
            id: 'pending',
            type: StepType.OUTPUT,
            depends_on: ['check_status'],
            message: 'Pending',
          },
          {
            id: 'reject',
            type: StepType.OUTPUT,
            depends_on: ['check_age'],
            message: 'Rejected',
          },
        ],
      };

      // Test approved path (age >= 18 && status === "active")
      const result1 = await executor.execute(workflow, { age: 25, status: 'active' });
      expect(result1.success).toBe(true);
      expect(result1.outputs.check_age?.branch_taken).toBe('true');
      expect(result1.outputs.check_status?.branch_taken).toBe('true');
      expect(result1.outputs.approve).toBeDefined();
      expect(result1.outputs.pending).toBeUndefined();
      expect(result1.outputs.reject).toBeUndefined();

      // Test pending path (age >= 18 && status !== "active")
      const result2 = await executor.execute(workflow, { age: 25, status: 'inactive' });
      expect(result2.success).toBe(true);
      expect(result2.outputs.check_age?.branch_taken).toBe('true');
      expect(result2.outputs.check_status?.branch_taken).toBe('false');
      expect(result2.outputs.approve).toBeUndefined();
      expect(result2.outputs.pending).toBeDefined();
      expect(result2.outputs.reject).toBeUndefined();

      // Test rejected path (age < 18)
      const result3 = await executor.execute(workflow, { age: 16, status: 'active' });
      expect(result3.success).toBe(true);
      expect(result3.outputs.check_age?.branch_taken).toBe('false');
      expect(result3.outputs.check_status).toBeUndefined(); // Not executed
      expect(result3.outputs.approve).toBeUndefined();
      expect(result3.outputs.pending).toBeUndefined();
      expect(result3.outputs.reject).toBeDefined();
    });
  });

  describe('Execution Events', () => {
    it('should emit correct events for conditional step', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Event Test',
          version: '1.0.0',
          description: 'Test conditional step events',
        },
        inputs: [],
        steps: [
          {
            id: 'check',
            type: StepType.CONDITIONAL,
            condition: 'true',
            then_steps: ['action'],
          },
          {
            id: 'action',
            type: StepType.OUTPUT,
            depends_on: ['check'],
            message: 'Action',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs.check).toBeDefined();
      expect(result.outputs.check?.result).toBe(true);
      expect(result.outputs.check?.resolved_condition).toBe('true');
      expect(result.outputs.check?.then_steps).toEqual(['action']);
      expect(result.outputs.check?.active_branch_steps).toEqual(['action']);
    });
  });
});
