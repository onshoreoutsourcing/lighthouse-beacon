/**
 * WorkflowExecutor Parallel Execution Integration Tests
 *
 * Tests parallel execution of independent workflow steps (Wave 9.4.3)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorkflowExecutor } from '../WorkflowExecutor';
import type { Workflow } from '../../../../shared/types';
import { StepType } from '../../../../shared/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('WorkflowExecutor - Parallel Execution', () => {
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

  describe('Basic Parallel Execution', () => {
    it('should execute independent steps in parallel', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Parallel Test',
          version: '1.0.0',
          description: 'Test parallel execution',
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
            id: 'step3',
            type: StepType.OUTPUT,
            message: 'Step 3',
          },
        ],
      };

      const result = await executor.execute(workflow, {}, { enableParallelExecution: true });

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
      expect(result.outputs.step1).toBeDefined();
      expect(result.outputs.step2).toBeDefined();
      expect(result.outputs.step3).toBeDefined();
    });

    it('should execute workflow sequentially when parallel is disabled', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Sequential Test',
          version: '1.0.0',
          description: 'Test sequential execution',
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
        ],
      };

      const result = await executor.execute(workflow, {}, { enableParallelExecution: false });

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.outputs.step1).toBeDefined();
      expect(result.outputs.step2).toBeDefined();
    });

    it('should default to sequential execution when option not specified', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Default Sequential',
          version: '1.0.0',
          description: 'Test default execution mode',
        },
        inputs: [],
        steps: [
          {
            id: 'step1',
            type: StepType.OUTPUT,
            message: 'Step 1',
          },
        ],
      };

      const result = await executor.execute(workflow, {});

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1);
    });
  });

  describe('Dependency-Based Execution Levels', () => {
    it('should respect dependencies in parallel execution', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Diamond Pattern',
          version: '1.0.0',
          description: 'Test diamond dependency pattern',
        },
        inputs: [],
        steps: [
          {
            id: 'start',
            type: StepType.OUTPUT,
            message: 'Start',
          },
          {
            id: 'branch_a',
            type: StepType.OUTPUT,
            message: 'Branch A',
            depends_on: ['start'],
          },
          {
            id: 'branch_b',
            type: StepType.OUTPUT,
            message: 'Branch B',
            depends_on: ['start'],
          },
          {
            id: 'merge',
            type: StepType.OUTPUT,
            message: 'Merge',
            depends_on: ['branch_a', 'branch_b'],
          },
        ],
      };

      const result = await executor.execute(workflow, {}, { enableParallelExecution: true });

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(4);
      // All steps should have outputs
      expect(result.outputs.start).toBeDefined();
      expect(result.outputs.branch_a).toBeDefined();
      expect(result.outputs.branch_b).toBeDefined();
      expect(result.outputs.merge).toBeDefined();
    });

    it('should handle complex multi-level dependencies', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Multi-Level Dependencies',
          version: '1.0.0',
          description: 'Test complex dependency graph',
        },
        inputs: [],
        steps: [
          { id: 'step1', type: StepType.OUTPUT, message: 'Step 1' },
          { id: 'step2', type: StepType.OUTPUT, message: 'Step 2' },
          { id: 'step3', type: StepType.OUTPUT, message: 'Step 3', depends_on: ['step1'] },
          { id: 'step4', type: StepType.OUTPUT, message: 'Step 4', depends_on: ['step1'] },
          {
            id: 'step5',
            type: StepType.OUTPUT,
            message: 'Step 5',
            depends_on: ['step2', 'step3'],
          },
          {
            id: 'step6',
            type: StepType.OUTPUT,
            message: 'Step 6',
            depends_on: ['step3', 'step4'],
          },
        ],
      };

      const result = await executor.execute(workflow, {}, { enableParallelExecution: true });

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(6);
      expect(Object.keys(result.outputs)).toHaveLength(6);
    });

    it('should execute ETL pipeline pattern efficiently', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'ETL Pipeline',
          version: '1.0.0',
          description: 'Test ETL pattern with parallel extraction and transformation',
        },
        inputs: [],
        steps: [
          // Extract phase (parallel)
          { id: 'extract_users', type: StepType.OUTPUT, message: 'Extracting users' },
          { id: 'extract_orders', type: StepType.OUTPUT, message: 'Extracting orders' },
          { id: 'extract_products', type: StepType.OUTPUT, message: 'Extracting products' },
          // Transform phase (parallel)
          {
            id: 'transform_users',
            type: StepType.OUTPUT,
            message: 'Transforming users',
            depends_on: ['extract_users'],
          },
          {
            id: 'transform_orders',
            type: StepType.OUTPUT,
            message: 'Transforming orders',
            depends_on: ['extract_orders'],
          },
          {
            id: 'transform_products',
            type: StepType.OUTPUT,
            message: 'Transforming products',
            depends_on: ['extract_products'],
          },
          // Load phase (sequential)
          {
            id: 'load_warehouse',
            type: StepType.OUTPUT,
            message: 'Loading to warehouse',
            depends_on: ['transform_users', 'transform_orders', 'transform_products'],
          },
        ],
      };

      const result = await executor.execute(workflow, {}, { enableParallelExecution: true });

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(7);
      expect(result.outputs.load_warehouse).toBeDefined();
    });
  });

  describe('Concurrency Limiting', () => {
    it('should respect maxConcurrency setting', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Concurrency Limit Test',
          version: '1.0.0',
          description: 'Test concurrency limiting',
        },
        inputs: [],
        steps: [
          { id: 'step1', type: StepType.OUTPUT, message: 'Step 1' },
          { id: 'step2', type: StepType.OUTPUT, message: 'Step 2' },
          { id: 'step3', type: StepType.OUTPUT, message: 'Step 3' },
          { id: 'step4', type: StepType.OUTPUT, message: 'Step 4' },
          { id: 'step5', type: StepType.OUTPUT, message: 'Step 5' },
          { id: 'step6', type: StepType.OUTPUT, message: 'Step 6' },
        ],
      };

      // With maxConcurrency=2, steps should execute in chunks of 2
      const result = await executor.execute(
        workflow,
        {},
        {
          enableParallelExecution: true,
          maxConcurrency: 2,
        }
      );

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(6);
      expect(Object.keys(result.outputs)).toHaveLength(6);
    });

    it('should use default concurrency when not specified', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Default Concurrency',
          version: '1.0.0',
          description: 'Test default concurrency (4)',
        },
        inputs: [],
        steps: [
          { id: 'step1', type: StepType.OUTPUT, message: 'Step 1' },
          { id: 'step2', type: StepType.OUTPUT, message: 'Step 2' },
          { id: 'step3', type: StepType.OUTPUT, message: 'Step 3' },
          { id: 'step4', type: StepType.OUTPUT, message: 'Step 4' },
          { id: 'step5', type: StepType.OUTPUT, message: 'Step 5' },
        ],
      };

      const result = await executor.execute(workflow, {}, { enableParallelExecution: true });

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(5);
    });

    it('should handle single concurrent execution', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Single Concurrency',
          version: '1.0.0',
          description: 'Test maxConcurrency=1 (sequential)',
        },
        inputs: [],
        steps: [
          { id: 'step1', type: StepType.OUTPUT, message: 'Step 1' },
          { id: 'step2', type: StepType.OUTPUT, message: 'Step 2' },
          { id: 'step3', type: StepType.OUTPUT, message: 'Step 3' },
        ],
      };

      const result = await executor.execute(
        workflow,
        {},
        {
          enableParallelExecution: true,
          maxConcurrency: 1,
        }
      );

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(3);
    });
  });

  describe('Error Handling and Failure Isolation', () => {
    it('should handle circular dependency detection', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Circular Dependency',
          version: '1.0.0',
          description: 'Test cycle detection',
        },
        inputs: [],
        steps: [
          { id: 'step1', type: StepType.OUTPUT, message: 'Step 1', depends_on: ['step3'] },
          { id: 'step2', type: StepType.OUTPUT, message: 'Step 2', depends_on: ['step1'] },
          { id: 'step3', type: StepType.OUTPUT, message: 'Step 3', depends_on: ['step2'] },
        ],
      };

      const result = await executor.execute(workflow, {}, { enableParallelExecution: true });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Circular dependency');
    });

    it('should handle missing dependencies gracefully', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Missing Dependency',
          version: '1.0.0',
          description: 'Test missing dependency handling',
        },
        inputs: [],
        steps: [
          { id: 'step1', type: StepType.OUTPUT, message: 'Step 1' },
          {
            id: 'step2',
            type: StepType.OUTPUT,
            message: 'Step 2',
            depends_on: ['nonexistent_step'],
          },
        ],
      };

      const result = await executor.execute(workflow, {}, { enableParallelExecution: true });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Variable Resolution in Parallel Execution', () => {
    it('should resolve workflow inputs correctly', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Input Resolution',
          version: '1.0.0',
          description: 'Test workflow input resolution in parallel',
        },
        inputs: [{ id: 'test_input', type: 'string' }],
        steps: [
          {
            id: 'step1',
            type: StepType.OUTPUT,
            message: 'Input 1: ${workflow.inputs.test_input}',
          },
          {
            id: 'step2',
            type: StepType.OUTPUT,
            message: 'Input 2: ${workflow.inputs.test_input}',
          },
        ],
      };

      const result = await executor.execute(
        workflow,
        { test_input: 'test_value' },
        { enableParallelExecution: true }
      );

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
    });

    it('should resolve step outputs with dependencies', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Output Resolution',
          version: '1.0.0',
          description: 'Test step output resolution',
        },
        inputs: [],
        steps: [
          { id: 'producer', type: StepType.OUTPUT, message: 'Producing data' },
          {
            id: 'consumer',
            type: StepType.OUTPUT,
            message: 'Consuming from producer',
            depends_on: ['producer'],
          },
        ],
      };

      const result = await executor.execute(workflow, {}, { enableParallelExecution: true });

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.outputs.producer).toBeDefined();
      expect(result.outputs.consumer).toBeDefined();
    });
  });

  describe('Performance Characteristics', () => {
    it('should execute both parallel and sequential modes successfully', async () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Performance Test',
          version: '1.0.0',
          description: 'Test parallel vs sequential execution modes',
        },
        inputs: [],
        steps: [
          { id: 'step1', type: StepType.OUTPUT, message: 'Step 1' },
          { id: 'step2', type: StepType.OUTPUT, message: 'Step 2' },
          { id: 'step3', type: StepType.OUTPUT, message: 'Step 3' },
          { id: 'step4', type: StepType.OUTPUT, message: 'Step 4' },
        ],
      };

      // Sequential execution
      const sequentialResult = await executor.execute(
        workflow,
        {},
        {
          enableParallelExecution: false,
        }
      );

      // Parallel execution
      const parallelResult = await executor.execute(
        workflow,
        {},
        {
          enableParallelExecution: true,
        }
      );

      // Both modes should complete successfully with same results
      expect(sequentialResult.success).toBe(true);
      expect(sequentialResult.successCount).toBe(4);
      expect(parallelResult.success).toBe(true);
      expect(parallelResult.successCount).toBe(4);

      // Verify all steps completed in both modes
      expect(Object.keys(sequentialResult.outputs)).toHaveLength(4);
      expect(Object.keys(parallelResult.outputs)).toHaveLength(4);
    });

    it('should handle large workflows efficiently', async () => {
      const steps = Array.from({ length: 20 }, (_, i) => ({
        id: `step${i}`,
        type: StepType.OUTPUT,
        message: `Step ${i}`,
      }));

      const workflow: Workflow = {
        workflow: {
          name: 'Large Workflow',
          version: '1.0.0',
          description: 'Test large workflow execution',
        },
        inputs: [],
        steps,
      };

      const result = await executor.execute(workflow, {}, { enableParallelExecution: true });

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(20);
      expect(Object.keys(result.outputs)).toHaveLength(20);
    });
  });
});
