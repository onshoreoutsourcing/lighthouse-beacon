/**
 * DependencyGraphAnalyzer.ts
 * Analyzes workflow dependencies to identify independent steps for parallel execution
 *
 * Implements Wave 9.4.3: Parallel Execution - User Story 1
 * - Builds directed acyclic graph (DAG) from workflow steps
 * - Identifies independent nodes (no data dependencies)
 * - Detects cycles and rejects workflows with circular dependencies
 * - Groups steps into execution levels (batches of parallel steps)
 * - Performance: <100ms for 100-node workflows
 *
 * Part of Feature 9.4: Advanced Control Flow
 */

import log from 'electron-log';
import type { WorkflowStep } from '../../../shared/types';

/**
 * Execution level containing independent steps that can run in parallel
 */
export interface ExecutionLevel {
  /** Level number (0-based, level 0 executes first) */
  level: number;
  /** Steps in this level (can execute in parallel) */
  steps: WorkflowStep[];
  /** Step IDs in this level */
  stepIds: string[];
}

/**
 * Dependency analysis result
 */
export interface DependencyAnalysisResult {
  /** Whether the workflow is valid (no cycles) */
  valid: boolean;
  /** Execution levels (sequential levels, parallel within each level) */
  levels: ExecutionLevel[];
  /** Error message if invalid */
  error?: string;
  /** Total number of steps */
  totalSteps: number;
  /** Maximum parallelism available (max steps in any level) */
  maxParallelism: number;
  /** Analysis duration in milliseconds */
  analysisDurationMs: number;
}

/**
 * Dependency graph analyzer for workflow execution
 *
 * Analyzes workflow step dependencies to determine execution order
 * and identify opportunities for parallel execution.
 */
export class DependencyGraphAnalyzer {
  private readonly SERVICE_NAME = 'DependencyGraphAnalyzer';

  /**
   * Analyze workflow dependencies and compute execution levels
   *
   * Uses topological sort to compute dependency-safe execution order,
   * then groups steps into levels where each level contains independent steps
   * that can execute in parallel.
   *
   * @param steps - Workflow steps to analyze
   * @returns Analysis result with execution levels or error
   *
   * @example
   * ```typescript
   * const analyzer = new DependencyGraphAnalyzer();
   * const result = analyzer.analyze(workflow.steps);
   * if (result.valid) {
   *   for (const level of result.levels) {
   *     // Execute level.steps in parallel
   *     await Promise.all(level.steps.map(step => executeStep(step)));
   *   }
   * }
   * ```
   */
  public analyze(steps: WorkflowStep[]): DependencyAnalysisResult {
    const startTime = Date.now();

    log.debug(`${this.SERVICE_NAME}: Starting dependency analysis`, {
      totalSteps: steps.length,
    });

    try {
      // Step 1: Build dependency graph
      const { graph, inDegree, stepMap } = this.buildGraph(steps);

      // Step 2: Detect cycles using topological sort
      const sortedSteps = this.topologicalSort(steps, graph, inDegree, stepMap);

      if (!sortedSteps) {
        // Cycle detected
        const analysisDurationMs = Date.now() - startTime;
        return {
          valid: false,
          levels: [],
          error: 'Circular dependency detected in workflow',
          totalSteps: steps.length,
          maxParallelism: 0,
          analysisDurationMs,
        };
      }

      // Step 3: Compute execution levels (parallel batches)
      const levels = this.computeExecutionLevels(steps, graph, inDegree, stepMap);

      const analysisDurationMs = Date.now() - startTime;
      const maxParallelism = Math.max(...levels.map((l) => l.steps.length), 0);

      log.info(`${this.SERVICE_NAME}: Analysis complete`, {
        totalSteps: steps.length,
        levelCount: levels.length,
        maxParallelism,
        analysisDurationMs,
      });

      // Performance check
      if (analysisDurationMs > 100) {
        log.warn(
          `${this.SERVICE_NAME}: Analysis took ${analysisDurationMs}ms (exceeds 100ms target)`
        );
      }

      return {
        valid: true,
        levels,
        totalSteps: steps.length,
        maxParallelism,
        analysisDurationMs,
      };
    } catch (error) {
      const analysisDurationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      log.error(`${this.SERVICE_NAME}: Analysis failed`, {
        error: errorMessage,
        analysisDurationMs,
      });

      return {
        valid: false,
        levels: [],
        error: errorMessage,
        totalSteps: steps.length,
        maxParallelism: 0,
        analysisDurationMs,
      };
    }
  }

  /**
   * Build dependency graph from workflow steps
   *
   * Creates adjacency list representation of step dependencies.
   *
   * @param steps - Workflow steps
   * @returns Graph components (adjacency list, in-degrees, step map)
   */
  private buildGraph(steps: WorkflowStep[]): {
    graph: Map<string, string[]>;
    inDegree: Map<string, number>;
    stepMap: Map<string, WorkflowStep>;
  } {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const stepMap = new Map<string, WorkflowStep>();

    // Initialize
    for (const step of steps) {
      graph.set(step.id, []);
      inDegree.set(step.id, 0);
      stepMap.set(step.id, step);
    }

    // Build graph from depends_on relationships
    for (const step of steps) {
      if (step.depends_on) {
        for (const depId of step.depends_on) {
          // Add edge: depId -> step.id (depId must complete before step)
          const adjacency = graph.get(depId);
          if (adjacency) {
            adjacency.push(step.id);
          }

          // Increment in-degree (number of dependencies)
          inDegree.set(step.id, (inDegree.get(step.id) || 0) + 1);
        }
      }
    }

    return { graph, inDegree, stepMap };
  }

  /**
   * Topological sort with cycle detection (Kahn's algorithm)
   *
   * @param steps - Workflow steps
   * @param graph - Adjacency list
   * @param inDegree - In-degree map (number of dependencies per step)
   * @param stepMap - Step ID to step mapping
   * @returns Sorted steps, or null if cycle detected
   */
  private topologicalSort(
    steps: WorkflowStep[],
    graph: Map<string, string[]>,
    inDegree: Map<string, number>,
    stepMap: Map<string, WorkflowStep>
  ): WorkflowStep[] | null {
    // Clone in-degree map (don't mutate original)
    const inDegreeCopy = new Map(inDegree);

    const queue: string[] = [];
    const sorted: WorkflowStep[] = [];

    // Start with nodes that have no dependencies
    for (const [stepId, degree] of inDegreeCopy.entries()) {
      if (degree === 0) {
        queue.push(stepId);
      }
    }

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;

      const currentStep = stepMap.get(currentId);
      if (!currentStep) continue;

      sorted.push(currentStep);

      // Reduce in-degree of neighbors
      const neighbors = graph.get(currentId) || [];
      for (const neighborId of neighbors) {
        const newDegree = (inDegreeCopy.get(neighborId) || 0) - 1;
        inDegreeCopy.set(neighborId, newDegree);

        if (newDegree === 0) {
          queue.push(neighborId);
        }
      }
    }

    // Check for circular dependencies
    if (sorted.length !== steps.length) {
      log.error(`${this.SERVICE_NAME}: Circular dependency detected`, {
        expectedSteps: steps.length,
        sortedSteps: sorted.length,
      });
      return null;
    }

    return sorted;
  }

  /**
   * Compute execution levels (parallel batches)
   *
   * Groups steps into levels where:
   * - Level 0: Steps with no dependencies
   * - Level N: Steps that depend only on steps in levels < N
   *
   * All steps within a level can execute in parallel.
   *
   * @param steps - Workflow steps
   * @param graph - Adjacency list
   * @param inDegree - In-degree map
   * @param stepMap - Step ID to step mapping
   * @returns Execution levels
   */
  private computeExecutionLevels(
    steps: WorkflowStep[],
    graph: Map<string, string[]>,
    inDegree: Map<string, number>,
    stepMap: Map<string, WorkflowStep>
  ): ExecutionLevel[] {
    // Clone in-degree map
    const inDegreeCopy = new Map(inDegree);

    // Track which level each step belongs to
    const stepLevels = new Map<string, number>();

    // Current level queue (steps ready to execute)
    let currentQueue: string[] = [];

    // Find steps with no dependencies (level 0)
    for (const [stepId, degree] of inDegreeCopy.entries()) {
      if (degree === 0) {
        currentQueue.push(stepId);
        stepLevels.set(stepId, 0);
      }
    }

    const levels: ExecutionLevel[] = [];
    let currentLevel = 0;

    while (currentQueue.length > 0) {
      // Create level from current queue
      const levelSteps = currentQueue
        .map((stepId) => stepMap.get(stepId))
        .filter((step): step is WorkflowStep => step !== undefined);

      levels.push({
        level: currentLevel,
        steps: levelSteps,
        stepIds: currentQueue,
      });

      // Process current level and prepare next level
      const nextQueue: string[] = [];

      for (const stepId of currentQueue) {
        const neighbors = graph.get(stepId) || [];

        for (const neighborId of neighbors) {
          // Reduce in-degree
          const newDegree = (inDegreeCopy.get(neighborId) || 0) - 1;
          inDegreeCopy.set(neighborId, newDegree);

          // If all dependencies satisfied, add to next level
          if (newDegree === 0 && !nextQueue.includes(neighborId)) {
            nextQueue.push(neighborId);
            stepLevels.set(neighborId, currentLevel + 1);
          }
        }
      }

      currentQueue = nextQueue;
      currentLevel++;
    }

    log.debug(`${this.SERVICE_NAME}: Computed ${levels.length} execution levels`, {
      levels: levels.map((l) => ({
        level: l.level,
        stepCount: l.steps.length,
        stepIds: l.stepIds,
      })),
    });

    return levels;
  }

  /**
   * Get independent steps (steps with no dependencies)
   *
   * @param steps - Workflow steps
   * @returns Steps that can execute immediately
   */
  public getIndependentSteps(steps: WorkflowStep[]): WorkflowStep[] {
    return steps.filter((step) => !step.depends_on || step.depends_on.length === 0);
  }

  /**
   * Check if workflow has any parallel execution opportunities
   *
   * @param steps - Workflow steps
   * @returns True if workflow can benefit from parallel execution
   */
  public canParallelize(steps: WorkflowStep[]): boolean {
    const result = this.analyze(steps);
    return result.valid && result.maxParallelism > 1;
  }
}
