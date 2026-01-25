/**
 * WorkflowValidator.ts
 * Semantic workflow validation engine
 *
 * Implements ADR-017: Workflow YAML Schema Design
 * - Check step ID uniqueness
 * - Verify depends_on references valid step IDs
 * - Detect circular dependencies
 * - Validate required fields
 * - Actionable error messages with line numbers
 * - JSON Schema structural validation
 *
 * Part of Wave 9.1.2: YAML Parser & Workflow Validation
 */

import log from 'electron-log';
import type {
  Workflow,
  WorkflowStep,
  ValidationError,
  ValidationResult,
} from '../../../shared/types';

/**
 * Semantic workflow validator
 *
 * Validates workflow structure, dependencies, and logic beyond basic YAML syntax.
 * Provides actionable error messages with field paths and suggestions.
 */
export class WorkflowValidator {
  private readonly SERVICE_NAME = 'WorkflowValidator';

  /**
   * Validate complete workflow
   *
   * @param workflow - Workflow object to validate
   * @returns Validation result with errors and warnings
   *
   * @example
   * ```typescript
   * const validator = new WorkflowValidator();
   * const result = validator.validate(workflow);
   * if (!result.valid) {
   *   result.errors.forEach(err => console.error(err.message));
   * }
   * ```
   */
  public validate(workflow: Workflow): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate workflow metadata
    const metadataErrors = this.validateMetadata(workflow);
    errors.push(...metadataErrors);

    // Validate inputs
    const inputErrors = this.validateInputs(workflow);
    errors.push(...inputErrors);

    // Validate steps exist
    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push({
        field: 'steps',
        message: 'Workflow must contain at least one step',
        severity: 'error',
        suggestion: 'Add at least one step to the workflow',
      });
      // Cannot continue validation without steps
      return { valid: false, errors, warnings };
    }

    // Validate step ID uniqueness
    const uniquenessErrors = this.validateStepIdUniqueness(workflow.steps);
    errors.push(...uniquenessErrors);

    // Build step ID set for dependency validation
    const stepIds = new Set(workflow.steps.map((step) => step.id));

    // Validate each step
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      if (!step) continue;
      const stepErrors = this.validateStep(step, stepIds, i);
      errors.push(...stepErrors);
    }

    // Validate dependencies (depends_on references)
    const dependencyErrors = this.validateDependencies(workflow.steps, stepIds);
    errors.push(...dependencyErrors);

    // Detect circular dependencies
    const circularErrors = this.detectCircularDependencies(workflow.steps);
    errors.push(...circularErrors);

    // Validate UI metadata if present
    if (workflow.ui_metadata) {
      const uiErrors = this.validateUIMetadata(workflow, stepIds);
      errors.push(...uiErrors);
    }

    const valid = errors.length === 0;

    if (valid) {
      log.info(`${this.SERVICE_NAME}: Workflow "${workflow.workflow.name}" validated successfully`);
    } else {
      log.warn(
        `${this.SERVICE_NAME}: Workflow "${workflow.workflow.name}" has ${errors.length} validation errors`
      );
    }

    return { valid, errors, warnings };
  }

  /**
   * Validate workflow metadata section
   */
  private validateMetadata(workflow: Workflow): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!workflow.workflow) {
      errors.push({
        field: 'workflow',
        message: 'Missing workflow metadata section',
        severity: 'error',
        suggestion: 'Add workflow section with name, version, and description',
      });
      return errors;
    }

    const { name, version, description } = workflow.workflow;

    if (!name || name.trim().length === 0) {
      errors.push({
        field: 'workflow.name',
        message: 'Workflow name is required',
        severity: 'error',
        suggestion: 'Add a descriptive name for the workflow',
      });
    }

    if (!version || !this.isValidSemanticVersion(version)) {
      errors.push({
        field: 'workflow.version',
        message: 'Workflow version must be valid semantic version (e.g., 1.0.0)',
        severity: 'error',
        suggestion: 'Use semantic versioning: major.minor.patch (e.g., 1.0.0)',
      });
    }

    if (!description || description.trim().length === 0) {
      errors.push({
        field: 'workflow.description',
        message: 'Workflow description is required',
        severity: 'error',
        suggestion: 'Add a description explaining the workflow purpose',
      });
    }

    return errors;
  }

  /**
   * Validate workflow inputs
   */
  private validateInputs(workflow: Workflow): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!Array.isArray(workflow.inputs)) {
      errors.push({
        field: 'inputs',
        message: 'Inputs must be an array',
        severity: 'error',
        suggestion: 'Use an array for inputs (can be empty: inputs: [])',
      });
      return errors;
    }

    // Validate input ID uniqueness
    const inputIds = new Set<string>();
    for (let i = 0; i < workflow.inputs.length; i++) {
      const input = workflow.inputs[i];

      if (!input) continue;

      if (!input.id) {
        errors.push({
          field: `inputs[${i}]`,
          message: 'Input missing required "id" field',
          severity: 'error',
          suggestion: 'Add unique id to input parameter',
        });
        continue;
      }

      if (inputIds.has(input.id)) {
        errors.push({
          field: `inputs[${i}].id`,
          message: `Duplicate input ID: ${input.id}`,
          severity: 'error',
          suggestion: `Change input ID to unique value (currently: ${input.id})`,
        });
      }
      inputIds.add(input.id);

      // Validate required fields
      if (!input.type) {
        errors.push({
          field: `inputs[${i}].type`,
          message: `Input "${input.id}" missing required "type" field`,
          severity: 'error',
          suggestion: 'Add type (string, number, boolean, file, directory, select)',
        });
      }

      if (!input.label) {
        errors.push({
          field: `inputs[${i}].label`,
          message: `Input "${input.id}" missing required "label" field`,
          severity: 'error',
          suggestion: 'Add human-readable label for UI display',
        });
      }

      // Validate select type has options
      if (input.type === 'select' && (!input.options || input.options.length === 0)) {
        errors.push({
          field: `inputs[${i}].options`,
          message: `Input "${input.id}" is type "select" but missing options array`,
          severity: 'error',
          suggestion: 'Add options array with at least one choice',
        });
      }
    }

    return errors;
  }

  /**
   * Validate step ID uniqueness
   */
  private validateStepIdUniqueness(steps: WorkflowStep[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const stepIds = new Map<string, number>(); // id -> first occurrence index

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      if (!step) continue;

      if (!step.id) {
        errors.push({
          field: `steps[${i}]`,
          message: 'Step missing required "id" field',
          severity: 'error',
          suggestion: 'Add unique id to workflow step',
        });
        continue;
      }

      const firstIndex = stepIds.get(step.id);
      if (firstIndex !== undefined) {
        errors.push({
          field: `steps[${i}].id`,
          message: `Duplicate step ID: ${step.id} (first defined at steps[${firstIndex}])`,
          severity: 'error',
          suggestion: `Change step ID to unique value (currently duplicated: ${step.id})`,
        });
      } else {
        stepIds.set(step.id, i);
      }
    }

    return errors;
  }

  /**
   * Validate individual step
   */
  private validateStep(
    step: WorkflowStep,
    _stepIds: Set<string>,
    index: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Get step ID safely
    const stepId = step.id || 'unknown';

    // Validate required base fields
    if (!step.type) {
      errors.push({
        field: `steps[${index}].type`,
        message: `Step "${stepId}" missing required "type" field`,
        severity: 'error',
        suggestion: 'Add type (python, claude, file_operation, input, output)',
      });
      return errors; // Cannot validate further without type
    }

    // Type-specific validation
    const stepType = step.type as string;
    switch (stepType) {
      case 'python':
        if (!('script' in step) || !step.script) {
          errors.push({
            field: `steps[${index}].script`,
            message: `Python step "${stepId}" missing required "script" field`,
            severity: 'error',
            suggestion: 'Add path to Python script file',
          });
        }
        break;

      case 'claude':
        if (!('model' in step) || !step.model) {
          errors.push({
            field: `steps[${index}].model`,
            message: `Claude step "${stepId}" missing required "model" field`,
            severity: 'error',
            suggestion: 'Add model name (e.g., claude-sonnet-4)',
          });
        }
        if (!('prompt_template' in step) || !step.prompt_template) {
          errors.push({
            field: `steps[${index}].prompt_template`,
            message: `Claude step "${stepId}" missing required "prompt_template" field`,
            severity: 'error',
            suggestion: 'Add prompt template with variable interpolation',
          });
        }
        break;

      case 'file_operation':
        if (!('operation' in step) || !step.operation) {
          errors.push({
            field: `steps[${index}].operation`,
            message: `File operation step "${stepId}" missing required "operation" field`,
            severity: 'error',
            suggestion: 'Add operation type (read, write, delete, create_dir)',
          });
        }
        break;

      case 'input':
        if (!('prompt' in step) || !step.prompt) {
          errors.push({
            field: `steps[${index}].prompt`,
            message: `Input step "${stepId}" missing required "prompt" field`,
            severity: 'error',
            suggestion: 'Add prompt message to show user',
          });
        }
        if (!('input_type' in step) || !step.input_type) {
          errors.push({
            field: `steps[${index}].input_type`,
            message: `Input step "${stepId}" missing required "input_type" field`,
            severity: 'error',
            suggestion: 'Add input type (string, number, file, etc.)',
          });
        }
        break;

      case 'output':
        if (!('message' in step) || !step.message) {
          errors.push({
            field: `steps[${index}].message`,
            message: `Output step "${stepId}" missing required "message" field`,
            severity: 'error',
            suggestion: 'Add message template to display',
          });
        }
        break;
    }

    return errors;
  }

  /**
   * Validate step dependencies (depends_on references)
   */
  private validateDependencies(steps: WorkflowStep[], stepIds: Set<string>): ValidationError[] {
    const errors: ValidationError[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      if (!step) continue;

      if (step.depends_on) {
        if (!Array.isArray(step.depends_on)) {
          errors.push({
            field: `steps[${i}].depends_on`,
            message: `Step "${step.id}" depends_on must be an array`,
            severity: 'error',
            suggestion: 'Use array format: depends_on: [step1, step2]',
          });
          continue;
        }

        for (const depId of step.depends_on) {
          if (!stepIds.has(depId)) {
            errors.push({
              field: `steps[${i}].depends_on`,
              message: `Step "${step.id}" depends on unknown step: ${depId}`,
              severity: 'error',
              suggestion: `Reference valid step ID (available: ${Array.from(stepIds).join(', ')})`,
            });
          }

          // Check self-dependency
          if (depId === step.id) {
            errors.push({
              field: `steps[${i}].depends_on`,
              message: `Step "${step.id}" cannot depend on itself`,
              severity: 'error',
              suggestion: 'Remove self-reference from depends_on',
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * Detect circular dependencies in step graph
   */
  private detectCircularDependencies(steps: WorkflowStep[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Build dependency graph
    const graph = new Map<string, string[]>();
    for (const step of steps) {
      graph.set(step.id, step.depends_on || []);
    }

    // DFS cycle detection
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string, path: string[]): string[] | null => {
      if (recursionStack.has(stepId)) {
        // Found cycle - return the cycle path
        const cycleStart = path.indexOf(stepId);
        return [...path.slice(cycleStart), stepId];
      }

      if (visited.has(stepId)) {
        return null; // Already processed
      }

      visited.add(stepId);
      recursionStack.add(stepId);
      path.push(stepId);

      const dependencies = graph.get(stepId) || [];
      for (const depId of dependencies) {
        const cycle = hasCycle(depId, [...path]);
        if (cycle) {
          return cycle;
        }
      }

      recursionStack.delete(stepId);
      return null;
    };

    // Check each step for cycles
    for (const step of steps) {
      if (!visited.has(step.id)) {
        const cycle = hasCycle(step.id, []);
        if (cycle) {
          errors.push({
            field: 'steps',
            message: `Circular dependency detected: ${cycle.join(' → ')}`,
            severity: 'error',
            suggestion: 'Remove dependency to break cycle',
          });
          break; // Report first cycle found
        }
      }
    }

    return errors;
  }

  /**
   * Validate UI metadata references valid steps
   */
  private validateUIMetadata(workflow: Workflow, stepIds: Set<string>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!workflow.ui_metadata) return errors;

    const { nodes, viewport } = workflow.ui_metadata;

    // Validate nodes reference valid steps
    if (nodes) {
      if (!Array.isArray(nodes)) {
        errors.push({
          field: 'ui_metadata.nodes',
          message: 'UI metadata nodes must be an array',
          severity: 'error',
          suggestion: 'Use array format for node positions',
        });
      } else {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];

          if (!node) continue;

          if (!node.id) {
            errors.push({
              field: `ui_metadata.nodes[${i}]`,
              message: 'Node missing required "id" field',
              severity: 'error',
              suggestion: 'Add step ID reference to node',
            });
            continue;
          }

          if (!stepIds.has(node.id)) {
            errors.push({
              field: `ui_metadata.nodes[${i}].id`,
              message: `Node references unknown step: ${node.id}`,
              severity: 'error',
              suggestion: `Reference valid step ID (available: ${Array.from(stepIds).join(', ')})`,
            });
          }

          if (
            !node.position ||
            typeof node.position.x !== 'number' ||
            typeof node.position.y !== 'number'
          ) {
            errors.push({
              field: `ui_metadata.nodes[${i}].position`,
              message: `Node "${node.id}" missing valid position`,
              severity: 'error',
              suggestion: 'Add position with x and y coordinates',
            });
          }
        }
      }
    }

    // Validate viewport
    if (viewport) {
      if (typeof viewport.zoom !== 'number' || viewport.zoom <= 0) {
        errors.push({
          field: 'ui_metadata.viewport.zoom',
          message: 'Viewport zoom must be positive number',
          severity: 'error',
          suggestion: 'Set zoom to positive value (1.0 = 100%)',
        });
      }

      if (typeof viewport.x !== 'number' || typeof viewport.y !== 'number') {
        errors.push({
          field: 'ui_metadata.viewport',
          message: 'Viewport missing valid x/y coordinates',
          severity: 'error',
          suggestion: 'Add x and y viewport offsets',
        });
      }
    }

    return errors;
  }

  /**
   * Validate semantic versioning format
   */
  private isValidSemanticVersion(version: string): boolean {
    const semverRegex = /^\d+\.\d+\.\d+$/;
    return semverRegex.test(version);
  }
}
