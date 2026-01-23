/**
 * WorkflowExecutor Loop Execution Integration Tests
 *
 * Tests loop iteration in workflow execution (Wave 9.4.2)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowExecutor } from '../WorkflowExecutor';
import type { Workflow } from '../../../../shared/types';
import { StepType } from '../../../../shared/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('WorkflowExecutor - Loop Execution', () => {
  let testDir: string;
  let executor: WorkflowExecutor;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-test-'));
    executor = new WorkflowExecutor(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Array Iteration', () => {
    it('should iterate over array and execute loop steps', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Array Loop Test',
          version: '1.0.0',
          description: 'Test array iteration',
        },
        inputs: [],
        steps: [
          {
            id: 'process_items',
            type: StepType.LOOP,
            items: ['item1', 'item2', 'item3'],
            loop_steps: ['display_item'],
            max_iterations: 10,
          },
          {
            id: 'display_item',
            type: StepType.OUTPUT,
            message: 'Processing ${loop.item}',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs.process_items).toBeDefined();
      expect(result.outputs.process_items?.iterations).toBe(3);
      expect(Array.isArray(result.outputs.process_items?.results)).toBe(true);
      expect((result.outputs.process_items?.results as unknown[]).length).toBe(3);
    });

    it('should provide loop.item and loop.index context', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Loop Context Test',
          version: '1.0.0',
          description: 'Test loop context variables',
        },
        inputs: [],
        steps: [
          {
            id: 'iterate',
            type: StepType.LOOP,
            items: [10, 20, 30],
            loop_steps: ['show'],
          },
          {
            id: 'show',
            type: StepType.OUTPUT,
            message: 'Index ${loop.index}: Value ${loop.item}',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs.iterate?.iterations).toBe(3);
    });

    it('should resolve workflow inputs in loop items', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Loop with Input',
          version: '1.0.0',
          description: 'Test loop with workflow input',
        },
        inputs: [],
        steps: [
          {
            id: 'process',
            type: StepType.LOOP,
            items: '${workflow.inputs.files}',
            loop_steps: ['display'],
          },
          {
            id: 'display',
            type: StepType.OUTPUT,
            message: 'File: ${loop.item}',
          },
        ],
      };

      const result = await executor.execute(workflow, {
        files: ['file1.txt', 'file2.txt'],
      });

      expect(result.success).toBe(true);
      expect(result.outputs.process?.iterations).toBe(2);
    });
  });

  describe('Object Iteration', () => {
    it('should iterate over object with key and value', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Object Loop Test',
          version: '1.0.0',
          description: 'Test object iteration',
        },
        inputs: [],
        steps: [
          {
            id: 'process_config',
            type: StepType.LOOP,
            items: '${workflow.inputs.config}',
            loop_steps: ['show_entry'],
          },
          {
            id: 'show_entry',
            type: StepType.OUTPUT,
            message: 'Key: ${loop.key}, Value: ${loop.value}',
          },
        ],
      };

      const result = await executor.execute(workflow, {
        config: {
          host: 'localhost',
          port: 8080,
        },
      });

      expect(result.success).toBe(true);
      expect(result.outputs.process_config?.iterations).toBe(2);
    });
  });

  describe('Range Iteration', () => {
    it('should iterate over numeric range', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Range Loop Test',
          version: '1.0.0',
          description: 'Test range iteration',
        },
        inputs: [],
        steps: [
          {
            id: 'count',
            type: StepType.LOOP,
            items: 'range(0, 5)',
            loop_steps: ['show_number'],
          },
          {
            id: 'show_number',
            type: StepType.OUTPUT,
            message: 'Number: ${loop.item}',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs.count?.iterations).toBe(5);
    });
  });

  describe('Max Iterations Safety', () => {
    it('should enforce max iterations limit', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Max Iterations Test',
          version: '1.0.0',
          description: 'Test max iterations enforcement',
        },
        inputs: [],
        steps: [
          {
            id: 'too_many',
            type: StepType.LOOP,
            items: Array.from({ length: 200 }, (_, i) => i),
            loop_steps: ['show'],
            max_iterations: 10,
          },
          {
            id: 'show',
            type: StepType.OUTPUT,
            message: 'Item ${loop.index}',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds max iterations');
      expect(result.error).toContain('200 > 10');
    });

    it('should use default max iterations of 100', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Default Max Test',
          version: '1.0.0',
          description: 'Test default max iterations',
        },
        inputs: [],
        steps: [
          {
            id: 'many_items',
            type: StepType.LOOP,
            items: Array.from({ length: 150 }, (_, i) => i),
            loop_steps: ['show'],
            // No max_iterations specified - should default to 100
          },
          {
            id: 'show',
            type: StepType.OUTPUT,
            message: 'Item',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds max iterations');
      expect(result.error).toContain('150 > 100');
    });
  });

  describe('Loop Error Handling', () => {
    it('should fail when loop items undefined', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Undefined Items Test',
          version: '1.0.0',
          description: 'Test undefined loop items',
        },
        inputs: [],
        steps: [
          {
            id: 'bad_loop',
            type: StepType.LOOP,
            items: '${workflow.inputs.missing_items}',
            loop_steps: ['show'],
          },
          {
            id: 'show',
            type: StepType.OUTPUT,
            message: 'Item',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Loop items resolution failed');
    });

    it('should fail when loop items is invalid type', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Invalid Type Test',
          version: '1.0.0',
          description: 'Test invalid loop items type',
        },
        inputs: [],
        steps: [
          {
            id: 'bad_loop',
            type: StepType.LOOP,
            items: 42, // Number is not iterable
            loop_steps: ['show'],
          },
          {
            id: 'show',
            type: StepType.OUTPUT,
            message: 'Item',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Loop items must be an array, object, or range expression');
    });
  });

  describe('Nested Loop Steps', () => {
    it('should execute multiple steps in loop body', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Multiple Loop Steps Test',
          version: '1.0.0',
          description: 'Test multiple steps in loop',
        },
        inputs: [],
        steps: [
          {
            id: 'process',
            type: StepType.LOOP,
            items: [1, 2],
            loop_steps: ['step1', 'step2'],
          },
          {
            id: 'step1',
            type: StepType.OUTPUT,
            message: 'Step 1: ${loop.item}',
          },
          {
            id: 'step2',
            type: StepType.OUTPUT,
            message: 'Step 2: ${loop.item}',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs.process?.iterations).toBe(2);
      const results = result.outputs.process?.results as Array<Record<string, unknown>>;
      expect(results.length).toBe(2);
      // Each iteration should have outputs from both steps
      expect(results[0]).toHaveProperty('step1');
      expect(results[0]).toHaveProperty('step2');
    });
  });

  describe('Empty Loop', () => {
    it('should handle empty array gracefully', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Empty Loop Test',
          version: '1.0.0',
          description: 'Test empty array iteration',
        },
        inputs: [],
        steps: [
          {
            id: 'empty_loop',
            type: StepType.LOOP,
            items: [],
            loop_steps: ['show'],
          },
          {
            id: 'show',
            type: StepType.OUTPUT,
            message: 'Item',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.outputs.empty_loop?.iterations).toBe(0);
      expect(result.outputs.empty_loop?.results).toEqual([]);
    });
  });
});
