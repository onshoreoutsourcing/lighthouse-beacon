/**
 * WorkflowExecutor Service
 *
 * Executes workflows sequentially with dependency ordering, data passing, and
 * comprehensive error handling. Integrates Python execution, Claude AI, and
 * execution event tracking.
 *
 * Features:
 * - Dependency-ordered step execution (topological sort)
 * - Variable resolution (${workflow.inputs.x}, ${steps.y.outputs.z})
 * - Python script execution via PythonExecutor (full security)
 * - Claude AI node execution via AIService
 * - Real-time execution events (workflow start/stop, step start/complete/fail)
 * - Stop-on-first-failure behavior
 * - Comprehensive execution metrics (duration, success/failure counts)
 *
 * Architecture:
 * - Follows ADR-017: Workflow YAML Schema Design
 * - Integrates ADR-016: Python Script Execution Security (via PythonExecutor)
 * - Uses Wave 9.2.2 ExecutionEvents for real-time updates
 * - Uses Wave 9.1.2 VariableResolver for data passing
 *
 * Usage:
 * const executor = new WorkflowExecutor(projectRoot);
 * const result = await executor.execute(workflow, { input_key: 'value' });
 */

import log from 'electron-log';
import { PythonExecutor } from './PythonExecutor';
import { ExecutionEvents } from './ExecutionEvents';
import { VariableResolver } from './VariableResolver';
import { RetryPolicy } from './RetryPolicy';
import type { AIService } from '../AIService';
import type {
  Workflow,
  WorkflowStep,
  PythonStep,
  ClaudeStep,
  VariableResolutionContext,
} from '../../../shared/types';
import { StepType } from '../../../shared/types';

/**
 * Result of workflow execution
 */
export interface WorkflowExecutionResult {
  /** Whether workflow completed successfully */
  success: boolean;
  /** Final workflow outputs (aggregated step outputs) */
  outputs: Record<string, Record<string, unknown>>;
  /** Error message (if failed) */
  error?: string;
  /** Failed step ID (if failed) */
  failedStepId?: string;
  /** Total execution time in milliseconds */
  totalDuration: number;
  /** Number of steps that completed successfully */
  successCount: number;
  /** Number of steps that failed */
  failureCount: number;
  /** Execution start time */
  startTime: number;
  /** Execution end time */
  endTime: number;
}

/**
 * Options for workflow execution
 */
export interface WorkflowExecutionOptions {
  /** Workflow ID for execution event tracking */
  workflowId?: string;
  /** Timeout for entire workflow in milliseconds (default: 300000 = 5 minutes) */
  timeoutMs?: number;
}

/**
 * Step execution result (internal)
 */
interface StepExecutionResult {
  success: boolean;
  outputs: Record<string, unknown>;
  error?: string;
  duration: number;
}

/**
 * Sequential workflow executor
 */
export class WorkflowExecutor {
  private pythonExecutor: PythonExecutor;
  private executionEvents: ExecutionEvents;
  private variableResolver: VariableResolver;
  private aiService: AIService | null = null;
  private projectRoot: string;

  /**
   * Create a new WorkflowExecutor
   *
   * @param projectRoot - Absolute path to project root directory
   * @param aiService - Optional AIService instance for Claude nodes
   */
  constructor(projectRoot: string, aiService?: AIService) {
    this.projectRoot = projectRoot;
    this.pythonExecutor = new PythonExecutor(this.projectRoot);
    this.executionEvents = ExecutionEvents.getInstance();
    this.variableResolver = new VariableResolver();
    this.aiService = aiService || null;

    log.info('[WorkflowExecutor] Initialized', { projectRoot: this.projectRoot });
  }

  /**
   * Set AIService instance for Claude node execution
   *
   * @param aiService - AIService instance
   */
  setAIService(aiService: AIService): void {
    this.aiService = aiService;
    log.debug('[WorkflowExecutor] AIService configured');
  }

  /**
   * Execute workflow with inputs
   *
   * Steps are executed in dependency order (topological sort).
   * Execution stops on first step failure.
   * All steps receive resolved variables from workflow inputs and previous step outputs.
   *
   * @param workflow - Workflow definition to execute
   * @param workflowInputs - Input values for workflow execution
   * @param options - Execution options (workflow ID, timeout)
   * @returns Execution result with outputs, timing, and status
   */
  async execute(
    workflow: Workflow,
    workflowInputs: Record<string, unknown>,
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowExecutionResult> {
    const workflowId = options.workflowId || workflow.workflow.name;
    const startTime = Date.now();

    log.info('[WorkflowExecutor] Starting workflow execution', {
      workflowId,
      workflowName: workflow.workflow.name,
      stepCount: workflow.steps.length,
      inputKeys: Object.keys(workflowInputs),
    });

    // Emit workflow started event
    this.executionEvents.emitWorkflowStarted(workflowId, workflow.steps.length);

    // Initialize execution context
    const stepOutputs: Record<string, Record<string, unknown>> = {};
    let successCount = 0;
    let failureCount = 0;

    try {
      // 1. Sort steps by dependency order (topological sort)
      const executionOrder = this.topologicalSort(workflow.steps);

      log.debug('[WorkflowExecutor] Computed execution order', {
        order: executionOrder.map((s) => s.id),
      });

      // 2. Execute steps in order
      for (let i = 0; i < executionOrder.length; i++) {
        const step = executionOrder[i];

        if (!step) continue;

        // Build variable resolution context
        const context: VariableResolutionContext = {
          workflowInputs,
          stepOutputs,
        };

        // Execute step
        const stepResult = await this.executeStep(step, context, workflowId, i);

        // Check result
        if (stepResult.success) {
          successCount++;
          stepOutputs[step.id] = stepResult.outputs;

          log.info('[WorkflowExecutor] Step completed successfully', {
            workflowId,
            stepId: step.id,
            stepType: step.type,
            duration: stepResult.duration,
            outputKeys: Object.keys(stepResult.outputs),
          });
        } else {
          failureCount++;

          const endTime = Date.now();
          const totalDuration = endTime - startTime;

          log.error('[WorkflowExecutor] Step failed - stopping workflow', {
            workflowId,
            stepId: step.id,
            stepType: step.type,
            error: stepResult.error,
            duration: stepResult.duration,
          });

          // Emit workflow completed event (with failure)
          this.executionEvents.emitWorkflowCompleted(
            workflowId,
            totalDuration,
            stepOutputs,
            successCount,
            failureCount
          );

          return {
            success: false,
            outputs: stepOutputs,
            error: `Step "${step.id}" failed: ${stepResult.error}`,
            failedStepId: step.id,
            totalDuration,
            successCount,
            failureCount,
            startTime,
            endTime,
          };
        }
      }

      // All steps completed successfully
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      log.info('[WorkflowExecutor] Workflow completed successfully', {
        workflowId,
        totalDuration,
        successCount,
        failureCount,
      });

      // Emit workflow completed event (success)
      this.executionEvents.emitWorkflowCompleted(
        workflowId,
        totalDuration,
        stepOutputs,
        successCount,
        failureCount
      );

      return {
        success: true,
        outputs: stepOutputs,
        totalDuration,
        successCount,
        failureCount,
        startTime,
        endTime,
      };
    } catch (error) {
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during workflow execution';

      log.error('[WorkflowExecutor] Workflow execution failed', {
        workflowId,
        error: errorMessage,
        totalDuration,
      });

      // Emit workflow completed event (with error)
      this.executionEvents.emitWorkflowCompleted(
        workflowId,
        totalDuration,
        stepOutputs,
        successCount,
        failureCount
      );

      return {
        success: false,
        outputs: stepOutputs,
        error: errorMessage,
        totalDuration,
        successCount,
        failureCount,
        startTime,
        endTime,
      };
    }
  }

  /**
   * Execute a single workflow step
   *
   * @param step - Step to execute
   * @param context - Variable resolution context
   * @param workflowId - Workflow ID for event tracking
   * @param stepIndex - Step index in execution order
   * @returns Step execution result
   */
  private async executeStep(
    step: WorkflowStep,
    context: VariableResolutionContext,
    workflowId: string,
    stepIndex: number
  ): Promise<StepExecutionResult> {
    const startTime = Date.now();

    log.debug('[WorkflowExecutor] Executing step', {
      workflowId,
      stepId: step.id,
      stepType: step.type,
      stepIndex,
    });

    // Emit step started event
    this.executionEvents.emitStepStarted(workflowId, step.id, stepIndex);

    try {
      // Resolve step inputs using variable resolver
      let resolvedInputs: Record<string, unknown> = {};
      if (step.inputs) {
        const resolution = this.variableResolver.resolve(
          step.inputs,
          context,
          `steps[${stepIndex}].inputs`
        );

        if (!resolution.success) {
          const errorMessages =
            resolution.errors?.map((e) => e.message).join('; ') || 'Variable resolution failed';

          this.executionEvents.emitStepFailed(
            workflowId,
            step.id,
            errorMessages,
            Date.now() - startTime,
            -1
          );

          return {
            success: false,
            outputs: {},
            error: errorMessages,
            duration: Date.now() - startTime,
          };
        }

        resolvedInputs = resolution.value as Record<string, unknown>;
      }

      // Execute step based on type (with retry if configured)
      let stepResult: StepExecutionResult;

      // Check if retry policy is configured for this step
      if (step.retry_policy) {
        // Execute with retry logic
        const retryPolicy = new RetryPolicy(step.retry_policy);

        log.debug('[WorkflowExecutor] Executing step with retry policy', {
          workflowId,
          stepId: step.id,
          retryConfig: step.retry_policy,
        });

        const retryResult = await retryPolicy.executeWithRetry(
          async () => {
            // Execute the actual step
            const result = await this.executeStepByType(
              step,
              resolvedInputs,
              workflowId,
              startTime
            );

            // If step failed, throw error to trigger retry
            if (!result.success) {
              throw new Error(result.error || 'Step execution failed');
            }

            return result;
          },
          { workflowId, stepId: step.id }
        );

        // Convert retry result to step result
        if (retryResult.success && retryResult.value) {
          stepResult = retryResult.value;

          // Log retry attempts if more than 1
          if (retryResult.attempts > 1) {
            log.info('[WorkflowExecutor] Step succeeded after retries', {
              workflowId,
              stepId: step.id,
              attempts: retryResult.attempts,
              totalDuration: retryResult.totalDuration,
            });
          }
        } else {
          // All retries failed
          stepResult = {
            success: false,
            outputs: {},
            error: retryResult.error?.message || 'Step execution failed after all retry attempts',
            duration: retryResult.totalDuration,
          };

          log.error('[WorkflowExecutor] Step failed after all retry attempts', {
            workflowId,
            stepId: step.id,
            attempts: retryResult.attempts,
            error: stepResult.error,
          });
        }
      } else {
        // No retry policy - execute normally
        stepResult = await this.executeStepByType(step, resolvedInputs, workflowId, startTime);
      }

      // Emit step completed or failed event
      const duration = Date.now() - startTime;
      if (stepResult.success) {
        this.executionEvents.emitStepCompleted(workflowId, step.id, stepResult.outputs, duration);
      } else {
        this.executionEvents.emitStepFailed(
          workflowId,
          step.id,
          stepResult.error || 'Unknown error',
          duration,
          -1
        );
      }

      return stepResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during step execution';

      log.error('[WorkflowExecutor] Step execution error', {
        workflowId,
        stepId: step.id,
        error: errorMessage,
      });

      this.executionEvents.emitStepFailed(workflowId, step.id, errorMessage, duration, -1);

      return {
        success: false,
        outputs: {},
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Execute step by type (Python, Claude, Output, etc.)
   *
   * This method contains the actual step execution logic and can be
   * wrapped by RetryPolicy for automatic retry with exponential backoff.
   *
   * @param step - Step to execute
   * @param resolvedInputs - Resolved step inputs
   * @param workflowId - Workflow ID for event tracking
   * @param startTime - Execution start timestamp
   * @returns Step execution result
   */
  private async executeStepByType(
    step: WorkflowStep,
    resolvedInputs: Record<string, unknown>,
    workflowId: string,
    startTime: number
  ): Promise<StepExecutionResult> {
    switch (step.type) {
      case StepType.PYTHON:
        return await this.executePythonStep(step, resolvedInputs, workflowId);

      case StepType.CLAUDE:
        return await this.executeClaudeStep(step, resolvedInputs, workflowId);

      case StepType.OUTPUT:
        // Output step - just log/display message
        return this.executeOutputStep(step, resolvedInputs);

      default:
        return {
          success: false,
          outputs: {},
          error: `Unsupported step type: ${step.type}`,
          duration: Date.now() - startTime,
        };
    }
  }

  /**
   * Execute Python step
   *
   * @param step - Python step definition
   * @param inputs - Resolved step inputs
   * @param workflowId - Workflow ID for event tracking
   * @returns Step execution result
   */
  private async executePythonStep(
    step: PythonStep,
    inputs: Record<string, unknown>,
    workflowId: string
  ): Promise<StepExecutionResult> {
    log.debug('[WorkflowExecutor] Executing Python step', {
      workflowId,
      stepId: step.id,
      script: step.script,
    });

    const result = await this.pythonExecutor.executeScript(step.script, inputs, {
      timeoutMs: step.timeout,
      pythonPath: step.interpreter,
      // NOTE: Do not pass workflowId/stepId here - WorkflowExecutor handles all event emission
      // to avoid double-emission when retry logic is used
    });

    if (result.success && result.output) {
      return {
        success: true,
        outputs: result.output,
        duration: result.executionTimeMs,
      };
    } else {
      return {
        success: false,
        outputs: {},
        error: result.error || 'Python script execution failed',
        duration: result.executionTimeMs,
      };
    }
  }

  /**
   * Execute Claude AI step
   *
   * @param step - Claude step definition
   * @param _inputs - Resolved step inputs (currently unused, may be used for prompt interpolation in future)
   * @param workflowId - Workflow ID for event tracking
   * @returns Step execution result
   */
  private async executeClaudeStep(
    step: ClaudeStep,
    _inputs: Record<string, unknown>,
    workflowId: string
  ): Promise<StepExecutionResult> {
    log.debug('[WorkflowExecutor] Executing Claude step', {
      workflowId,
      stepId: step.id,
      model: step.model,
    });

    if (!this.aiService) {
      return {
        success: false,
        outputs: {},
        error: 'AIService not configured. Set AIService before executing Claude nodes.',
        duration: 0,
      };
    }

    const startTime = Date.now();

    try {
      // Resolve prompt template with inputs
      const prompt = step.prompt_template;

      // Send message to Claude
      const response = await this.aiService.sendMessage(prompt, {
        systemPrompt: step.system_prompt,
      });

      const duration = Date.now() - startTime;

      return {
        success: true,
        outputs: {
          response,
          model: step.model,
        },
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Claude API error';

      return {
        success: false,
        outputs: {},
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Execute output step
   *
   * @param step - Output step definition
   * @param _inputs - Resolved step inputs (unused for output steps)
   * @returns Step execution result
   */
  private executeOutputStep(
    step: WorkflowStep,
    _inputs: Record<string, unknown>
  ): StepExecutionResult {
    const message = (step as { message?: string }).message || '';
    log.info('[WorkflowExecutor] Output step', {
      stepId: step.id,
      message,
    });

    // Output steps don't fail - just log the message
    return {
      success: true,
      outputs: {
        displayed: true,
        message,
      },
      duration: 0,
    };
  }

  /**
   * Topological sort of workflow steps by dependencies
   *
   * Uses Kahn's algorithm to sort steps in execution order.
   * Steps with no dependencies execute first, followed by dependent steps.
   *
   * @param steps - Workflow steps to sort
   * @returns Steps in dependency-safe execution order
   * @throws Error if circular dependencies detected
   */
  private topologicalSort(steps: WorkflowStep[]): WorkflowStep[] {
    // Build adjacency list and in-degree map
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
          // Add edge: depId -> step.id
          const adjacency = graph.get(depId);
          if (adjacency) {
            adjacency.push(step.id);
          }

          // Increment in-degree
          inDegree.set(step.id, (inDegree.get(step.id) || 0) + 1);
        }
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    const sorted: WorkflowStep[] = [];

    // Start with nodes that have no dependencies
    for (const [stepId, degree] of inDegree.entries()) {
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
        const newDegree = (inDegree.get(neighborId) || 0) - 1;
        inDegree.set(neighborId, newDegree);

        if (newDegree === 0) {
          queue.push(neighborId);
        }
      }
    }

    // Check for circular dependencies
    if (sorted.length !== steps.length) {
      const unsortedIds = steps.filter((s) => !sorted.includes(s)).map((s) => s.id);

      throw new Error(
        `Circular dependency detected in workflow. Unable to sort steps: ${unsortedIds.join(', ')}`
      );
    }

    return sorted;
  }
}
