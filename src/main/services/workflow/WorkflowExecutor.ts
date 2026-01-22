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
import { ConditionEvaluator } from './ConditionEvaluator';
import { DependencyGraphAnalyzer } from './DependencyGraphAnalyzer';
import type { AIService } from '../AIService';
import type {
  Workflow,
  WorkflowStep,
  PythonStep,
  ClaudeStep,
  ConditionalStep,
  LoopStep,
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
  /** Enable parallel execution of independent steps (default: false) */
  enableParallelExecution?: boolean;
  /** Maximum number of steps to run concurrently (default: 4, range: 1-8) */
  maxConcurrency?: number;
  /** Default error propagation strategy for all steps (default: 'fail-fast'). Wave 9.4.5 */
  errorPropagationStrategy?: 'fail-fast' | 'fail-silent' | 'fallback';
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
  private conditionEvaluator: ConditionEvaluator;
  private dependencyAnalyzer: DependencyGraphAnalyzer;
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
    this.conditionEvaluator = new ConditionEvaluator();
    this.dependencyAnalyzer = new DependencyGraphAnalyzer();
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
      parallelExecutionEnabled: options.enableParallelExecution,
      maxConcurrency: options.maxConcurrency,
    });

    // Initialize execution context
    const stepOutputs: Record<string, Record<string, unknown>> = {};
    let successCount = 0;
    let failureCount = 0;

    try {
      // Check if parallel execution is enabled
      if (options.enableParallelExecution) {
        // Use parallel execution
        return await this.executeParallel(workflow, workflowInputs, workflowId, startTime, options);
      }

      // Emit workflow started event for sequential execution
      this.executionEvents.emitWorkflowStarted(workflowId, workflow.steps.length);

      // 1. Sort steps by dependency order (topological sort)
      const executionOrder = this.topologicalSort(workflow.steps);

      log.debug('[WorkflowExecutor] Computed execution order', {
        order: executionOrder.map((s) => s.id),
      });

      // 2. Build conditional branch mapping (which steps are in which branches)
      const conditionalBranches = this.buildConditionalBranchMap(workflow.steps);

      // Track skipped steps (for dependency checking)
      const skippedSteps = new Set<string>();
      // Track steps executed as fallbacks (to prevent double execution)
      const fallbackExecutedSteps = new Set<string>();

      // 3. Execute steps in order
      for (let i = 0; i < executionOrder.length; i++) {
        const step = executionOrder[i];

        if (!step) continue;

        // Check if step was already executed as a fallback
        if (fallbackExecutedSteps.has(step.id)) {
          log.debug('[WorkflowExecutor] Skipping step (already executed as fallback)', {
            workflowId,
            stepId: step.id,
          });
          continue;
        }

        // Check if step should be skipped due to conditional branching
        const shouldSkip = this.shouldSkipStep(step.id, conditionalBranches, stepOutputs);
        if (shouldSkip) {
          log.debug('[WorkflowExecutor] Skipping step (conditional branch not taken)', {
            workflowId,
            stepId: step.id,
            reason: shouldSkip,
          });
          skippedSteps.add(step.id);
          continue;
        }

        // Check if step depends on skipped steps
        if (step.depends_on && step.depends_on.some((depId) => skippedSteps.has(depId))) {
          const skippedDeps = step.depends_on.filter((depId) => skippedSteps.has(depId));
          log.debug('[WorkflowExecutor] Skipping step (depends on skipped steps)', {
            workflowId,
            stepId: step.id,
            skippedDependencies: skippedDeps,
          });
          skippedSteps.add(step.id);
          continue;
        }

        // Build variable resolution context
        const context: VariableResolutionContext = {
          workflowInputs,
          stepOutputs,
        };

        // Execute step
        const stepResult = await this.executeStep(step, context, workflowId, i, workflow);

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

          // Determine error propagation strategy (step-level overrides workflow-level default)
          const errorStrategy =
            step.error_propagation || options.errorPropagationStrategy || 'fail-fast';

          log.error('[WorkflowExecutor] Step failed', {
            workflowId,
            stepId: step.id,
            stepType: step.type,
            error: stepResult.error,
            duration: stepResult.duration,
            errorStrategy,
          });

          // Apply error propagation strategy
          if (errorStrategy === 'fail-fast') {
            // Stop workflow immediately (default behavior)
            const endTime = Date.now();
            const totalDuration = endTime - startTime;

            log.error('[WorkflowExecutor] Fail-fast: Stopping workflow', {
              workflowId,
              stepId: step.id,
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
          } else if (errorStrategy === 'fail-silent') {
            // Log error and continue (ignore failure)
            log.warn('[WorkflowExecutor] Fail-silent: Continuing execution despite error', {
              workflowId,
              stepId: step.id,
              error: stepResult.error,
            });

            // Store empty outputs for failed step (so dependent steps don't break)
            stepOutputs[step.id] = {
              _failed: true,
              _error: stepResult.error,
            };

            // Continue to next step
          } else if (errorStrategy === 'fallback') {
            // Execute fallback step if defined
            if (step.fallback_step) {
              log.info('[WorkflowExecutor] Fallback: Executing fallback step', {
                workflowId,
                failedStepId: step.id,
                fallbackStepId: step.fallback_step,
                originalError: stepResult.error,
              });

              // Find fallback step in workflow
              const fallbackStep = workflow.steps.find((s) => s.id === step.fallback_step);
              if (fallbackStep) {
                // Build context with error information from failed step
                const fallbackContext: VariableResolutionContext = {
                  workflowInputs,
                  stepOutputs: {
                    ...stepOutputs,
                    [step.id]: {
                      _failed: true,
                      _error: stepResult.error,
                    },
                  },
                };

                // Execute fallback step
                const fallbackResult = await this.executeStep(
                  fallbackStep,
                  fallbackContext,
                  workflowId,
                  i,
                  workflow
                );

                if (fallbackResult.success) {
                  log.info('[WorkflowExecutor] Fallback step succeeded', {
                    workflowId,
                    failedStepId: step.id,
                    fallbackStepId: step.fallback_step,
                  });

                  // Use fallback outputs for the original step
                  stepOutputs[step.id] = {
                    _fallback_used: true,
                    _primary_error: stepResult.error,
                    ...fallbackResult.outputs,
                  };

                  // Mark fallback step as executed (prevent double execution)
                  fallbackExecutedSteps.add(step.fallback_step);

                  // Don't increment failureCount - fallback recovered
                  failureCount--;
                  successCount++;

                  // Continue execution
                } else {
                  log.error('[WorkflowExecutor] Fallback step also failed', {
                    workflowId,
                    failedStepId: step.id,
                    fallbackStepId: step.fallback_step,
                    fallbackError: fallbackResult.error,
                  });

                  // Fallback failed - stop workflow
                  const endTime = Date.now();
                  const totalDuration = endTime - startTime;

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
                    error: `Step "${step.id}" and fallback "${step.fallback_step}" both failed. Primary: ${stepResult.error}, Fallback: ${fallbackResult.error}`,
                    failedStepId: step.id,
                    totalDuration,
                    successCount,
                    failureCount,
                    startTime,
                    endTime,
                  };
                }
              } else {
                log.warn('[WorkflowExecutor] Fallback step not found', {
                  workflowId,
                  failedStepId: step.id,
                  fallbackStepId: step.fallback_step,
                });

                // Fallback step not found - treat as fail-fast
                const endTime = Date.now();
                const totalDuration = endTime - startTime;

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
                  error: `Step "${step.id}" failed and fallback step "${step.fallback_step}" not found: ${stepResult.error}`,
                  failedStepId: step.id,
                  totalDuration,
                  successCount,
                  failureCount,
                  startTime,
                  endTime,
                };
              }
            } else {
              log.warn(
                '[WorkflowExecutor] Fallback strategy configured but no fallback_step defined',
                {
                  workflowId,
                  stepId: step.id,
                }
              );

              // No fallback step defined - treat as fail-fast
              const endTime = Date.now();
              const totalDuration = endTime - startTime;

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
                error: `Step "${step.id}" failed and no fallback_step defined: ${stepResult.error}`,
                failedStepId: step.id,
                totalDuration,
                successCount,
                failureCount,
                startTime,
                endTime,
              };
            }
          }
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
   * @param workflow - Full workflow definition
   * @param executionLevel - Optional execution level (for parallel execution visualization)
   * @returns Step execution result
   */
  private async executeStep(
    step: WorkflowStep,
    context: VariableResolutionContext,
    workflowId: string,
    stepIndex: number,
    workflow: Workflow,
    executionLevel?: number
  ): Promise<StepExecutionResult> {
    const startTime = Date.now();

    log.debug('[WorkflowExecutor] Executing step', {
      workflowId,
      stepId: step.id,
      stepType: step.type,
      stepIndex,
      executionLevel,
    });

    // Emit step started event
    this.executionEvents.emitStepStarted(workflowId, step.id, stepIndex, executionLevel);

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
              startTime,
              context,
              workflow
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
        stepResult = await this.executeStepByType(
          step,
          resolvedInputs,
          workflowId,
          startTime,
          context,
          workflow
        );
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
   * @param context - Full variable resolution context (needed for conditional/loop evaluation)
   * @param workflow - Full workflow definition (needed for loop step execution)
   * @returns Step execution result
   */
  private async executeStepByType(
    step: WorkflowStep,
    resolvedInputs: Record<string, unknown>,
    workflowId: string,
    startTime: number,
    context?: VariableResolutionContext,
    workflow?: Workflow
  ): Promise<StepExecutionResult> {
    switch (step.type) {
      case StepType.PYTHON:
        return await this.executePythonStep(step, resolvedInputs, workflowId);

      case StepType.CLAUDE:
        return await this.executeClaudeStep(step, resolvedInputs, workflowId);

      case StepType.OUTPUT:
        // Output step - just log/display message
        return this.executeOutputStep(step, resolvedInputs);

      case StepType.CONDITIONAL:
        if (!context) {
          return {
            success: false,
            outputs: {},
            error: 'Context required for conditional step execution',
            duration: Date.now() - startTime,
          };
        }
        return this.executeConditionalStep(step, workflowId, context);

      case StepType.LOOP:
        if (!context || !workflow) {
          return {
            success: false,
            outputs: {},
            error: 'Context and workflow required for loop step execution',
            duration: Date.now() - startTime,
          };
        }
        return await this.executeLoopStep(step, workflowId, context, workflow);

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
   * Execute conditional step
   *
   * Evaluates condition expression and determines which branch to take.
   * Returns branch information in outputs for downstream step filtering.
   *
   * @param step - Conditional step definition
   * @param workflowId - Workflow ID for event tracking
   * @param context - Variable resolution context
   * @returns Step execution result with branch information
   */
  private executeConditionalStep(
    step: ConditionalStep,
    workflowId: string,
    context: VariableResolutionContext
  ): StepExecutionResult {
    const startTime = Date.now();

    log.debug('[WorkflowExecutor] Executing conditional step', {
      workflowId,
      stepId: step.id,
      condition: step.condition,
    });

    try {
      // Evaluate condition using ConditionEvaluator
      const evaluationResult = this.conditionEvaluator.evaluate(step.condition, context);

      const duration = Date.now() - startTime;

      if (evaluationResult.error) {
        // Condition evaluation failed
        log.error('[WorkflowExecutor] Conditional evaluation failed', {
          workflowId,
          stepId: step.id,
          condition: step.condition,
          error: evaluationResult.error,
        });

        return {
          success: false,
          outputs: {},
          error: `Condition evaluation failed: ${evaluationResult.error}`,
          duration,
        };
      }

      // Condition evaluated successfully
      const branchTaken = evaluationResult.result;
      const branchSteps = branchTaken ? step.then_steps : step.else_steps || [];

      log.info('[WorkflowExecutor] Conditional step completed', {
        workflowId,
        stepId: step.id,
        result: branchTaken,
        branchTaken: branchTaken ? 'true' : 'false',
        branchSteps,
        resolvedCondition: evaluationResult.resolvedExpression,
        duration,
      });

      // Return outputs with branch information
      // This allows downstream logic to filter steps based on branch taken
      return {
        success: true,
        outputs: {
          result: branchTaken,
          branch_taken: branchTaken ? 'true' : 'false',
          resolved_condition: evaluationResult.resolvedExpression,
          then_steps: step.then_steps,
          else_steps: step.else_steps || [],
          active_branch_steps: branchSteps,
        },
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during condition evaluation';

      log.error('[WorkflowExecutor] Conditional step failed', {
        workflowId,
        stepId: step.id,
        error: errorMessage,
      });

      return {
        success: false,
        outputs: {},
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Execute loop step
   *
   * Iterates over a collection (array or object) and executes loop_steps for each item.
   * Enforces max iterations for safety and provides loop context variables.
   *
   * @param step - Loop step definition
   * @param workflowId - Workflow ID for event tracking
   * @param context - Variable resolution context
   * @param workflow - Full workflow definition
   * @returns Step execution result with iteration results
   */
  private async executeLoopStep(
    step: LoopStep,
    workflowId: string,
    context: VariableResolutionContext,
    workflow: Workflow
  ): Promise<StepExecutionResult> {
    const startTime = Date.now();
    const maxIterations = step.max_iterations || 100;

    log.debug('[WorkflowExecutor] Executing loop step', {
      workflowId,
      stepId: step.id,
      maxIterations,
    });

    try {
      // Step 1: Resolve items to iterate over
      const itemsResolution = this.variableResolver.resolve(step.items, context, 'loop.items');

      if (!itemsResolution.success) {
        const errorMessages =
          itemsResolution.errors?.map((e) => e.message).join('; ') || 'Items resolution failed';
        return {
          success: false,
          outputs: {},
          error: `Loop items resolution failed: ${errorMessages}`,
          duration: Date.now() - startTime,
        };
      }

      const items = itemsResolution.value;

      // Step 2: Convert items to iterable array
      let iterableItems: Array<{ item: unknown; key?: string; value?: unknown }> = [];

      if (Array.isArray(items)) {
        // Array iteration
        iterableItems = items.map((item: unknown) => ({ item }));
      } else if (typeof items === 'object' && items !== null) {
        // Object iteration - iterate over key-value pairs
        iterableItems = Object.entries(items as Record<string, unknown>).map(([key, value]) => ({
          item: value,
          key,
          value: value,
        }));
      } else if (typeof items === 'string') {
        // Check if it's a range expression like "range(0, 10)"
        const rangeMatch = items.match(/^range\((\d+),\s*(\d+)\)$/);
        if (rangeMatch && rangeMatch[1] !== undefined && rangeMatch[2] !== undefined) {
          const start = parseInt(rangeMatch[1], 10);
          const end = parseInt(rangeMatch[2], 10);
          if (!isNaN(start) && !isNaN(end) && end > start) {
            iterableItems = Array.from({ length: end - start }, (_, i) => ({ item: start + i }));
          } else {
            return {
              success: false,
              outputs: {},
              error: `Invalid range expression: ${items}`,
              duration: Date.now() - startTime,
            };
          }
        } else {
          return {
            success: false,
            outputs: {},
            error: `Loop items must be an array, object, or range expression, got: ${typeof items}`,
            duration: Date.now() - startTime,
          };
        }
      } else {
        return {
          success: false,
          outputs: {},
          error: `Loop items must be an array, object, or range expression, got: ${typeof items}`,
          duration: Date.now() - startTime,
        };
      }

      // Step 3: Enforce max iterations
      if (iterableItems.length > maxIterations) {
        return {
          success: false,
          outputs: {},
          error: `Loop exceeds max iterations: ${iterableItems.length} > ${maxIterations}`,
          duration: Date.now() - startTime,
        };
      }

      // Step 4: Find the steps to execute in loop
      const loopStepsMap = new Map(workflow.steps.map((s) => [s.id, s]));
      const stepsToExecute = step.loop_steps
        .map((stepId) => loopStepsMap.get(stepId))
        .filter((s): s is WorkflowStep => s !== undefined);

      if (stepsToExecute.length === 0) {
        log.warn('[WorkflowExecutor] No valid loop steps found', {
          workflowId,
          stepId: step.id,
          loop_steps: step.loop_steps,
        });
      }

      // Step 5: Iterate and execute
      const iterationOutputs: Array<Record<string, unknown>> = [];
      let iterationCount = 0;

      for (const { item, key, value } of iterableItems) {
        // Create loop context
        const loopContext = {
          item,
          index: iterationCount,
          key,
          value,
        };

        // Create iteration-specific context
        const iterationContext: VariableResolutionContext = {
          ...context,
          loopContext,
        };

        // Execute each loop step with loop context
        const iterationStepOutputs: Record<string, unknown> = {};

        for (const loopStepToExecute of stepsToExecute) {
          log.debug('[WorkflowExecutor] Executing loop iteration step', {
            workflowId,
            loopStepId: step.id,
            iteration: iterationCount,
            stepId: loopStepToExecute.id,
          });

          // Resolve step inputs with loop context
          let resolvedInputs: Record<string, unknown> = {};
          if (loopStepToExecute.inputs) {
            const resolution = this.variableResolver.resolve(
              loopStepToExecute.inputs,
              iterationContext,
              `loop[${iterationCount}].${loopStepToExecute.id}.inputs`
            );

            if (!resolution.success) {
              const errorMessages =
                resolution.errors?.map((e) => e.message).join('; ') || 'Variable resolution failed';
              return {
                success: false,
                outputs: {},
                error: `Loop iteration ${iterationCount} failed: ${errorMessages}`,
                duration: Date.now() - startTime,
              };
            }

            resolvedInputs = resolution.value as Record<string, unknown>;
          }

          // Execute the step
          const stepResult = await this.executeStepByType(
            loopStepToExecute,
            resolvedInputs,
            workflowId,
            startTime,
            iterationContext,
            workflow
          );

          if (!stepResult.success) {
            return {
              success: false,
              outputs: {},
              error: `Loop iteration ${iterationCount} failed at step "${loopStepToExecute.id}": ${stepResult.error}`,
              duration: Date.now() - startTime,
            };
          }

          iterationStepOutputs[loopStepToExecute.id] = stepResult.outputs;
        }

        iterationOutputs.push(iterationStepOutputs);
        iterationCount++;
      }

      const duration = Date.now() - startTime;

      log.info('[WorkflowExecutor] Loop step completed', {
        workflowId,
        stepId: step.id,
        iterations: iterationCount,
        duration,
      });

      return {
        success: true,
        outputs: {
          iterations: iterationCount,
          results: iterationOutputs,
        },
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error during loop execution';

      log.error('[WorkflowExecutor] Loop step failed', {
        workflowId,
        stepId: step.id,
        error: errorMessage,
      });

      return {
        success: false,
        outputs: {},
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Build mapping of which steps are in which conditional branches
   *
   * Maps step IDs to their controlling conditional step and branch type.
   * Used to determine which steps should be skipped based on runtime evaluation.
   *
   * @param steps - All workflow steps
   * @returns Map of stepId -> { conditionalStepId, branch }
   */
  private buildConditionalBranchMap(
    steps: WorkflowStep[]
  ): Map<string, { conditionalStepId: string; branch: 'then' | 'else' }> {
    const branchMap = new Map<string, { conditionalStepId: string; branch: 'then' | 'else' }>();

    for (const step of steps) {
      if (step.type === StepType.CONDITIONAL) {
        const conditionalStep = step;

        // Map then_steps
        for (const stepId of conditionalStep.then_steps) {
          branchMap.set(stepId, {
            conditionalStepId: conditionalStep.id,
            branch: 'then',
          });
        }

        // Map else_steps
        if (conditionalStep.else_steps) {
          for (const stepId of conditionalStep.else_steps) {
            branchMap.set(stepId, {
              conditionalStepId: conditionalStep.id,
              branch: 'else',
            });
          }
        }
      }
    }

    return branchMap;
  }

  /**
   * Check if a step should be skipped due to conditional branching
   *
   * A step should be skipped if:
   * 1. It's in a conditional branch (then or else)
   * 2. The controlling conditional step has executed
   * 3. The step is NOT in the branch that was taken
   *
   * @param stepId - Step ID to check
   * @param conditionalBranches - Map of steps to their controlling conditionals
   * @param stepOutputs - Executed step outputs (including conditional results)
   * @returns Skip reason if should skip, null if should execute
   */
  private shouldSkipStep(
    stepId: string,
    conditionalBranches: Map<string, { conditionalStepId: string; branch: 'then' | 'else' }>,
    stepOutputs: Record<string, Record<string, unknown>>
  ): string | null {
    // Check if step is in a conditional branch
    const branchInfo = conditionalBranches.get(stepId);
    if (!branchInfo) {
      // Not in any conditional branch - should execute
      return null;
    }

    // Check if controlling conditional has executed
    const conditionalOutputs = stepOutputs[branchInfo.conditionalStepId];
    if (!conditionalOutputs) {
      // Conditional hasn't executed yet - should execute (will be caught by dependencies)
      return null;
    }

    // Check if step is in the taken branch
    const branchTaken = conditionalOutputs.branch_taken as string;
    const isInTakenBranch =
      (branchInfo.branch === 'then' && branchTaken === 'true') ||
      (branchInfo.branch === 'else' && branchTaken === 'false');

    if (isInTakenBranch) {
      // Step is in the taken branch - should execute
      return null;
    }

    // Step is in the non-taken branch - should skip
    return `Step in ${branchInfo.branch} branch, but ${branchTaken} branch was taken`;
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

  /**
   * Execute workflow with parallel execution of independent steps
   *
   * Uses DependencyGraphAnalyzer to identify execution levels.
   * Steps within the same level can execute in parallel (no dependencies between them).
   * Levels execute sequentially (level 1 waits for level 0 to complete).
   *
   * @param workflow - Workflow definition
   * @param workflowInputs - Input values for workflow
   * @param workflowId - Workflow ID for event tracking
   * @param startTime - Execution start time
   * @param options - Execution options (concurrency, timeout)
   * @returns Execution result
   */
  private async executeParallel(
    workflow: Workflow,
    workflowInputs: Record<string, unknown>,
    workflowId: string,
    startTime: number,
    options: WorkflowExecutionOptions
  ): Promise<WorkflowExecutionResult> {
    // Step 1: Analyze workflow dependencies
    const analysis = this.dependencyAnalyzer.analyze(workflow.steps);

    if (!analysis.valid) {
      log.error('[WorkflowExecutor] Workflow analysis failed', {
        workflowId,
        error: analysis.error,
      });

      // Emit workflow completed event (with error)
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      this.executionEvents.emitWorkflowCompleted(workflowId, totalDuration, {}, 0, 0);

      return {
        success: false,
        outputs: {},
        error: analysis.error || 'Workflow analysis failed',
        totalDuration,
        successCount: 0,
        failureCount: 0,
        startTime,
        endTime,
      };
    }

    log.info('[WorkflowExecutor] Executing workflow with parallel execution', {
      workflowId,
      levels: analysis.levels.length,
      maxParallelism: analysis.maxParallelism,
      totalSteps: analysis.totalSteps,
    });

    // Emit workflow started event with parallel execution metadata
    const maxConcurrency = options.maxConcurrency || 4;
    this.executionEvents.emitWorkflowStarted(
      workflowId,
      workflow.steps.length,
      true,
      maxConcurrency,
      analysis.maxParallelism
    );

    // Initialize execution context
    const stepOutputs: Record<string, Record<string, unknown>> = {};
    let successCount = 0;
    let failureCount = 0;

    // Step 2: Build conditional branch mapping (for skipped steps)
    const conditionalBranches = this.buildConditionalBranchMap(workflow.steps);
    const skippedSteps = new Set<string>();

    try {
      // Step 3: Execute each level sequentially
      for (const level of analysis.levels) {
        log.debug('[WorkflowExecutor] Executing level', {
          workflowId,
          level: level.level,
          stepCount: level.steps.length,
          stepIds: level.stepIds,
        });

        // Filter out skipped steps
        const stepsToExecute = level.steps.filter((step) => {
          // Check if step should be skipped due to conditional branching
          const shouldSkip = this.shouldSkipStep(step.id, conditionalBranches, stepOutputs);
          if (shouldSkip) {
            log.debug('[WorkflowExecutor] Skipping step in parallel execution', {
              workflowId,
              stepId: step.id,
              reason: shouldSkip,
            });
            skippedSteps.add(step.id);
            return false;
          }

          // Check if step depends on skipped steps
          if (step.depends_on && step.depends_on.some((depId) => skippedSteps.has(depId))) {
            const skippedDeps = step.depends_on.filter((depId) => skippedSteps.has(depId));
            log.debug('[WorkflowExecutor] Skipping step (depends on skipped steps)', {
              workflowId,
              stepId: step.id,
              skippedDependencies: skippedDeps,
            });
            skippedSteps.add(step.id);
            return false;
          }

          return true;
        });

        if (stepsToExecute.length === 0) {
          log.debug('[WorkflowExecutor] No steps to execute in level', {
            workflowId,
            level: level.level,
          });
          continue;
        }

        // Emit execution level started event for visualization
        this.executionEvents.emitExecutionLevelStarted(
          workflowId,
          level.level,
          stepsToExecute.length,
          stepsToExecute.map((s) => s.id)
        );

        // Step 4: Execute steps in level with concurrency limiting
        const levelResult = await this.executeLevelWithConcurrency(
          stepsToExecute,
          workflowInputs,
          stepOutputs,
          workflowId,
          workflow,
          maxConcurrency,
          level.level
        );

        // Step 5: Process level results
        for (const result of levelResult.results) {
          if (result.success) {
            successCount++;
            stepOutputs[result.stepId] = result.outputs;

            log.info('[WorkflowExecutor] Step completed successfully (parallel)', {
              workflowId,
              stepId: result.stepId,
              duration: result.duration,
            });
          } else {
            failureCount++;

            // Find the step to get error propagation strategy
            const failedStep = workflow.steps.find((s) => s.id === result.stepId);
            const errorStrategy =
              failedStep?.error_propagation || options.errorPropagationStrategy || 'fail-fast';

            log.error('[WorkflowExecutor] Step failed (parallel)', {
              workflowId,
              stepId: result.stepId,
              error: result.error,
              duration: result.duration,
              errorStrategy,
            });

            // Apply error propagation strategy
            if (errorStrategy === 'fail-fast') {
              // Stop on first failure (default)
              log.error('[WorkflowExecutor] Fail-fast: Stopping parallel workflow', {
                workflowId,
                stepId: result.stepId,
              });

              const endTime = Date.now();
              const totalDuration = endTime - startTime;

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
                error: `Step "${result.stepId}" failed: ${result.error}`,
                failedStepId: result.stepId,
                totalDuration,
                successCount,
                failureCount,
                startTime,
                endTime,
              };
            } else if (errorStrategy === 'fail-silent') {
              // Log and continue
              log.warn(
                '[WorkflowExecutor] Fail-silent: Continuing parallel execution despite error',
                {
                  workflowId,
                  stepId: result.stepId,
                  error: result.error,
                }
              );

              // Store error information
              stepOutputs[result.stepId] = {
                _failed: true,
                _error: result.error,
              };

              // Continue processing remaining results
            } else if (errorStrategy === 'fallback') {
              // Execute fallback step if defined
              if (failedStep?.fallback_step) {
                log.info('[WorkflowExecutor] Fallback: Will execute fallback step (parallel)', {
                  workflowId,
                  failedStepId: result.stepId,
                  fallbackStepId: failedStep.fallback_step,
                });

                // Store failed step outputs for fallback context
                stepOutputs[result.stepId] = {
                  _failed: true,
                  _error: result.error,
                };

                // Note: Fallback execution in parallel mode is deferred to next level
                // The fallback step should be defined with depends_on: [failed_step]
                // This ensures it runs in a subsequent level with proper context
              } else {
                log.warn(
                  '[WorkflowExecutor] Fallback strategy but no fallback_step defined (parallel)',
                  {
                    workflowId,
                    stepId: result.stepId,
                  }
                );

                // No fallback - treat as fail-fast
                const endTime = Date.now();
                const totalDuration = endTime - startTime;

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
                  error: `Step "${result.stepId}" failed and no fallback_step defined: ${result.error}`,
                  failedStepId: result.stepId,
                  totalDuration,
                  successCount,
                  failureCount,
                  startTime,
                  endTime,
                };
              }
            }
          }
        }
      }

      // All levels completed successfully
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      log.info('[WorkflowExecutor] Parallel workflow completed successfully', {
        workflowId,
        totalDuration,
        successCount,
        failureCount,
        levels: analysis.levels.length,
      });

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
        error instanceof Error ? error.message : 'Unknown error during parallel execution';

      log.error('[WorkflowExecutor] Parallel workflow execution failed', {
        workflowId,
        error: errorMessage,
        totalDuration,
      });

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
   * Execute a level of steps with concurrency limiting
   *
   * Uses a pool-based approach to limit concurrent executions.
   * Promise.allSettled provides failure isolation.
   *
   * @param steps - Steps to execute in parallel
   * @param workflowInputs - Workflow inputs
   * @param stepOutputs - Accumulated step outputs
   * @param workflowId - Workflow ID
   * @param workflow - Full workflow definition
   * @param maxConcurrency - Maximum concurrent steps
   * @param executionLevel - Execution level number (for visualization)
   * @returns Level execution results
   */
  private async executeLevelWithConcurrency(
    steps: WorkflowStep[],
    workflowInputs: Record<string, unknown>,
    stepOutputs: Record<string, Record<string, unknown>>,
    workflowId: string,
    workflow: Workflow,
    maxConcurrency: number,
    executionLevel: number
  ): Promise<{
    results: Array<{
      stepId: string;
      success: boolean;
      outputs: Record<string, unknown>;
      error?: string;
      duration: number;
    }>;
  }> {
    const results: Array<{
      stepId: string;
      success: boolean;
      outputs: Record<string, unknown>;
      error?: string;
      duration: number;
    }> = [];

    // Execute steps with concurrency limiting using chunks
    // Split steps into chunks of maxConcurrency size
    const chunks: WorkflowStep[][] = [];
    for (let i = 0; i < steps.length; i += maxConcurrency) {
      chunks.push(steps.slice(i, i + maxConcurrency));
    }

    let stepIndex = 0;

    // Execute each chunk sequentially, steps within chunk execute in parallel
    for (const chunk of chunks) {
      // Create promises for all steps in chunk
      const chunkPromises = chunk.map(async (step) => {
        const context: VariableResolutionContext = {
          workflowInputs,
          stepOutputs,
        };

        const currentIndex = stepIndex++;
        const stepResult = await this.executeStep(
          step,
          context,
          workflowId,
          currentIndex,
          workflow,
          executionLevel
        );

        return {
          stepId: step.id,
          success: stepResult.success,
          outputs: stepResult.outputs,
          error: stepResult.error,
          duration: stepResult.duration,
        };
      });

      // Wait for all steps in chunk to complete (using allSettled for failure isolation)
      const chunkResults = await Promise.allSettled(chunkPromises);

      // Extract results from settled promises
      for (const settled of chunkResults) {
        if (settled.status === 'fulfilled') {
          results.push(settled.value);
        } else {
          // Promise rejection (shouldn't happen since executeStep catches errors internally)
          log.error('[WorkflowExecutor] Unexpected promise rejection in parallel execution', {
            workflowId,
            error: settled.reason as unknown,
          });
        }
      }
    }

    return { results };
  }
}
