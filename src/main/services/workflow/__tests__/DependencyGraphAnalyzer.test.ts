/**
 * DependencyGraphAnalyzer Tests
 *
 * Test suite for dependency graph analysis and parallel execution planning.
 * Wave 9.4.3: Parallel Execution - User Story 1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyGraphAnalyzer } from '../DependencyGraphAnalyzer';
import type { WorkflowStep } from '../../../../shared/types';
import { StepType } from '../../../../shared/types';

describe('DependencyGraphAnalyzer', () => {
  let analyzer: DependencyGraphAnalyzer;

  beforeEach(() => {
    analyzer = new DependencyGraphAnalyzer();
  });

  describe('analyze()', () => {
    it('should analyze workflow with no dependencies', () => {
      const steps: WorkflowStep[] = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Step 1' },
        { id: 'step2', type: StepType.OUTPUT, message: 'Step 2' },
        { id: 'step3', type: StepType.OUTPUT, message: 'Step 3' },
      ];

      const result = analyzer.analyze(steps);

      expect(result.valid).toBe(true);
      expect(result.levels.length).toBe(1);
      expect(result.levels[0]?.steps.length).toBe(3);
      expect(result.maxParallelism).toBe(3);
      expect(result.totalSteps).toBe(3);
    });

    it('should analyze sequential workflow', () => {
      const steps: WorkflowStep[] = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Step 1' },
        { id: 'step2', type: StepType.OUTPUT, message: 'Step 2', depends_on: ['step1'] },
        { id: 'step3', type: StepType.OUTPUT, message: 'Step 3', depends_on: ['step2'] },
      ];

      const result = analyzer.analyze(steps);

      expect(result.valid).toBe(true);
      expect(result.levels.length).toBe(3);
      expect(result.levels[0]?.stepIds).toEqual(['step1']);
      expect(result.levels[1]?.stepIds).toEqual(['step2']);
      expect(result.levels[2]?.stepIds).toEqual(['step3']);
      expect(result.maxParallelism).toBe(1);
    });

    it('should identify parallel execution opportunities', () => {
      const steps: WorkflowStep[] = [
        { id: 'fetch_user', type: StepType.OUTPUT, message: 'Fetch user' },
        { id: 'fetch_product', type: StepType.OUTPUT, message: 'Fetch product' },
        { id: 'fetch_inventory', type: StepType.OUTPUT, message: 'Fetch inventory' },
        {
          id: 'generate_report',
          type: StepType.OUTPUT,
          message: 'Generate report',
          depends_on: ['fetch_user', 'fetch_product', 'fetch_inventory'],
        },
      ];

      const result = analyzer.analyze(steps);

      expect(result.valid).toBe(true);
      expect(result.levels.length).toBe(2);
      expect(result.levels[0]?.steps.length).toBe(3);
      expect(result.levels[1]?.steps.length).toBe(1);
      expect(result.maxParallelism).toBe(3);
    });

    it('should detect circular dependencies', () => {
      const steps: WorkflowStep[] = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Step 1', depends_on: ['step3'] },
        { id: 'step2', type: StepType.OUTPUT, message: 'Step 2', depends_on: ['step1'] },
        { id: 'step3', type: StepType.OUTPUT, message: 'Step 3', depends_on: ['step2'] },
      ];

      const result = analyzer.analyze(steps);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Circular dependency detected in workflow');
      expect(result.levels.length).toBe(0);
    });

    it('should handle diamond dependency pattern', () => {
      const steps: WorkflowStep[] = [
        { id: 'start', type: StepType.OUTPUT, message: 'Start' },
        { id: 'branch_a', type: StepType.OUTPUT, message: 'Branch A', depends_on: ['start'] },
        { id: 'branch_b', type: StepType.OUTPUT, message: 'Branch B', depends_on: ['start'] },
        {
          id: 'merge',
          type: StepType.OUTPUT,
          message: 'Merge',
          depends_on: ['branch_a', 'branch_b'],
        },
      ];

      const result = analyzer.analyze(steps);

      expect(result.valid).toBe(true);
      expect(result.levels.length).toBe(3);
      expect(result.levels[0]?.stepIds).toEqual(['start']);
      expect(result.levels[1]?.stepIds).toContain('branch_a');
      expect(result.levels[1]?.stepIds).toContain('branch_b');
      expect(result.levels[2]?.stepIds).toEqual(['merge']);
      expect(result.maxParallelism).toBe(2);
    });

    it('should handle complex multi-level dependencies', () => {
      const steps: WorkflowStep[] = [
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
      ];

      const result = analyzer.analyze(steps);

      expect(result.valid).toBe(true);
      expect(result.levels.length).toBe(3);
      // Level 0: step1, step2 (no dependencies)
      expect(result.levels[0]?.stepIds.sort()).toEqual(['step1', 'step2']);
      // Level 1: step3, step4 (depend on step1)
      expect(result.levels[1]?.stepIds.sort()).toEqual(['step3', 'step4']);
      // Level 2: step5, step6 (step5 depends on step2+step3, step6 depends on step3+step4)
      expect(result.levels[2]?.stepIds.sort()).toEqual(['step5', 'step6']);
    });

    it('should handle empty workflow', () => {
      const result = analyzer.analyze([]);

      expect(result.valid).toBe(true);
      expect(result.levels.length).toBe(0);
      expect(result.totalSteps).toBe(0);
      expect(result.maxParallelism).toBe(0);
    });

    it('should handle single step workflow', () => {
      const steps: WorkflowStep[] = [
        { id: 'only_step', type: StepType.OUTPUT, message: 'Only step' },
      ];

      const result = analyzer.analyze(steps);

      expect(result.valid).toBe(true);
      expect(result.levels.length).toBe(1);
      expect(result.levels[0]?.steps.length).toBe(1);
      expect(result.maxParallelism).toBe(1);
    });

    it('should complete analysis in <100ms for 100-node workflow', () => {
      // Create a workflow with 100 independent steps
      const steps: WorkflowStep[] = Array.from({ length: 100 }, (_, i) => ({
        id: `step${i}`,
        type: StepType.OUTPUT,
        message: `Step ${i}`,
      }));

      const result = analyzer.analyze(steps);

      expect(result.valid).toBe(true);
      expect(result.totalSteps).toBe(100);
      expect(result.analysisDurationMs).toBeLessThan(100);
    });

    it('should handle missing dependencies gracefully', () => {
      const steps: WorkflowStep[] = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Step 1' },
        {
          id: 'step2',
          type: StepType.OUTPUT,
          message: 'Step 2',
          depends_on: ['nonexistent'],
        },
      ];

      const result = analyzer.analyze(steps);

      // Missing dependency causes topological sort to fail (step2 depends on nonexistent step)
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Circular dependency detected in workflow');
    });
  });

  describe('getIndependentSteps()', () => {
    it('should identify steps with no dependencies', () => {
      const steps: WorkflowStep[] = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Step 1' },
        { id: 'step2', type: StepType.OUTPUT, message: 'Step 2', depends_on: ['step1'] },
        { id: 'step3', type: StepType.OUTPUT, message: 'Step 3' },
      ];

      const independent = analyzer.getIndependentSteps(steps);

      expect(independent.length).toBe(2);
      expect(independent.map((s) => s.id).sort()).toEqual(['step1', 'step3']);
    });

    it('should return empty array when all steps have dependencies', () => {
      const steps: WorkflowStep[] = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Step 1', depends_on: ['step0'] },
        { id: 'step2', type: StepType.OUTPUT, message: 'Step 2', depends_on: ['step1'] },
      ];

      const independent = analyzer.getIndependentSteps(steps);

      expect(independent.length).toBe(0);
    });

    it('should return all steps when none have dependencies', () => {
      const steps: WorkflowStep[] = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Step 1' },
        { id: 'step2', type: StepType.OUTPUT, message: 'Step 2' },
        { id: 'step3', type: StepType.OUTPUT, message: 'Step 3' },
      ];

      const independent = analyzer.getIndependentSteps(steps);

      expect(independent.length).toBe(3);
    });
  });

  describe('canParallelize()', () => {
    it('should return true for parallelizable workflow', () => {
      const steps: WorkflowStep[] = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Step 1' },
        { id: 'step2', type: StepType.OUTPUT, message: 'Step 2' },
      ];

      const canParallel = analyzer.canParallelize(steps);

      expect(canParallel).toBe(true);
    });

    it('should return false for sequential workflow', () => {
      const steps: WorkflowStep[] = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Step 1' },
        { id: 'step2', type: StepType.OUTPUT, message: 'Step 2', depends_on: ['step1'] },
      ];

      const canParallel = analyzer.canParallelize(steps);

      expect(canParallel).toBe(false);
    });

    it('should return false for workflow with cycles', () => {
      const steps: WorkflowStep[] = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Step 1', depends_on: ['step2'] },
        { id: 'step2', type: StepType.OUTPUT, message: 'Step 2', depends_on: ['step1'] },
      ];

      const canParallel = analyzer.canParallelize(steps);

      expect(canParallel).toBe(false);
    });

    it('should return false for empty workflow', () => {
      const canParallel = analyzer.canParallelize([]);

      expect(canParallel).toBe(false);
    });

    it('should return false for single step workflow', () => {
      const steps: WorkflowStep[] = [
        { id: 'only_step', type: StepType.OUTPUT, message: 'Only step' },
      ];

      const canParallel = analyzer.canParallelize(steps);

      expect(canParallel).toBe(false);
    });
  });

  describe('ExecutionLevel ordering', () => {
    it('should create correct level numbers', () => {
      const steps: WorkflowStep[] = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Step 1' },
        { id: 'step2', type: StepType.OUTPUT, message: 'Step 2', depends_on: ['step1'] },
        { id: 'step3', type: StepType.OUTPUT, message: 'Step 3', depends_on: ['step2'] },
      ];

      const result = analyzer.analyze(steps);

      expect(result.levels[0]?.level).toBe(0);
      expect(result.levels[1]?.level).toBe(1);
      expect(result.levels[2]?.level).toBe(2);
    });

    it('should preserve step objects in levels', () => {
      const steps: WorkflowStep[] = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Step 1' },
        { id: 'step2', type: StepType.OUTPUT, message: 'Step 2' },
      ];

      const result = analyzer.analyze(steps);

      expect(result.levels[0]?.steps[0]).toBe(steps[0]);
      expect(result.levels[0]?.steps[1]).toBe(steps[1]);
    });
  });

  describe('Real-world workflow patterns', () => {
    it('should handle ETL pipeline pattern', () => {
      const steps: WorkflowStep[] = [
        // Extract phase (parallel)
        { id: 'extract_users', type: StepType.PYTHON, script: 'extract_users.py' },
        { id: 'extract_orders', type: StepType.PYTHON, script: 'extract_orders.py' },
        { id: 'extract_products', type: StepType.PYTHON, script: 'extract_products.py' },
        // Transform phase (parallel)
        {
          id: 'transform_users',
          type: StepType.PYTHON,
          script: 'transform_users.py',
          depends_on: ['extract_users'],
        },
        {
          id: 'transform_orders',
          type: StepType.PYTHON,
          script: 'transform_orders.py',
          depends_on: ['extract_orders'],
        },
        {
          id: 'transform_products',
          type: StepType.PYTHON,
          script: 'transform_products.py',
          depends_on: ['extract_products'],
        },
        // Load phase (sequential - must load in order)
        {
          id: 'load_warehouse',
          type: StepType.PYTHON,
          script: 'load.py',
          depends_on: ['transform_users', 'transform_orders', 'transform_products'],
        },
      ];

      const result = analyzer.analyze(steps);

      expect(result.valid).toBe(true);
      expect(result.levels.length).toBe(3);
      expect(result.levels[0]?.steps.length).toBe(3); // Extract phase
      expect(result.levels[1]?.steps.length).toBe(3); // Transform phase
      expect(result.levels[2]?.steps.length).toBe(1); // Load phase
      expect(result.maxParallelism).toBe(3);
    });

    it('should handle microservices deployment pattern', () => {
      const steps: WorkflowStep[] = [
        { id: 'build_api', type: StepType.PYTHON, script: 'build_api.py' },
        { id: 'build_web', type: StepType.PYTHON, script: 'build_web.py' },
        { id: 'build_worker', type: StepType.PYTHON, script: 'build_worker.py' },
        {
          id: 'deploy_api',
          type: StepType.PYTHON,
          script: 'deploy_api.py',
          depends_on: ['build_api'],
        },
        {
          id: 'deploy_web',
          type: StepType.PYTHON,
          script: 'deploy_web.py',
          depends_on: ['build_web'],
        },
        {
          id: 'deploy_worker',
          type: StepType.PYTHON,
          script: 'deploy_worker.py',
          depends_on: ['build_worker'],
        },
        {
          id: 'smoke_test',
          type: StepType.PYTHON,
          script: 'smoke_test.py',
          depends_on: ['deploy_api', 'deploy_web', 'deploy_worker'],
        },
      ];

      const result = analyzer.analyze(steps);

      expect(result.valid).toBe(true);
      expect(result.maxParallelism).toBe(3);
      expect(result.levels.length).toBe(3);
    });
  });
});
