/**
 * VariableResolver.ts
 * Variable interpolation engine for workflow execution
 *
 * Implements ADR-017: Workflow YAML Schema Design
 * - Resolve ${workflow.inputs.name} syntax
 * - Resolve ${steps.stepId.outputs.name} syntax
 * - Validate variable references exist
 * - Handle nested references
 * - Error messages with exact YAML location
 *
 * Part of Wave 9.1.2: YAML Parser & Workflow Validation
 */

import log from 'electron-log';
import type {
  VariableReference,
  VariableResolutionContext,
  VariableResolutionResult,
  ValidationError,
} from '../../../shared/types';

/**
 * Variable interpolation engine
 *
 * Resolves variable references in workflow step inputs and prompts.
 * Supports GitHub Actions-style ${...} syntax for accessing workflow inputs
 * and step outputs.
 */
export class VariableResolver {
  private readonly SERVICE_NAME = 'VariableResolver';
  private readonly VARIABLE_REGEX = /\$\{([^}]+)\}/g;

  /**
   * Extract all variable references from a value
   *
   * @param value - Value to scan for variable references
   * @param field - Field path for error reporting
   * @param line - Line number for error reporting
   * @returns Array of extracted variable references
   *
   * @example
   * ```typescript
   * const resolver = new VariableResolver();
   * const refs = resolver.extractReferences("${workflow.inputs.path}", "step.inputs");
   * // refs = [{ raw: "${workflow.inputs.path}", scope: "workflow", path: ["inputs", "path"], ... }]
   * ```
   */
  public extractReferences(value: unknown, field: string, line?: number): VariableReference[] {
    const references: VariableReference[] = [];

    if (typeof value === 'string') {
      const matches = Array.from(value.matchAll(this.VARIABLE_REGEX));

      for (const match of matches) {
        const raw = match[0];
        const inner = match[1];

        if (!raw || !inner) continue;

        const parts = inner.split('.');
        if (parts.length < 2) {
          log.warn(
            `${this.SERVICE_NAME}: Invalid variable reference "${raw}" - must have scope and path`
          );
          continue;
        }

        const scope = parts[0] as 'workflow' | 'steps' | 'loop';
        const pathParts = parts.slice(1);

        // Extract step ID for steps scope
        let stepId: string | undefined;
        if (scope === 'steps' && pathParts.length >= 2) {
          stepId = pathParts[0];
        }

        references.push({
          raw,
          scope,
          path: pathParts,
          stepId,
          field,
          line,
        });
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively extract from object values
      for (const [key, val] of Object.entries(value)) {
        const nestedField = `${field}.${key}`;
        const nestedRefs = this.extractReferences(val, nestedField, line);
        references.push(...nestedRefs);
      }
    }

    return references;
  }

  /**
   * Resolve all variable references in a value
   *
   * @param value - Value containing variable references
   * @param context - Variable resolution context
   * @param field - Field path for error reporting
   * @param line - Line number for error reporting
   * @returns Resolution result with resolved value or errors
   *
   * @example
   * ```typescript
   * const resolver = new VariableResolver();
   * const context = {
   *   workflowInputs: { repo_path: "/path/to/repo" },
   *   stepOutputs: {}
   * };
   * const result = resolver.resolve("${workflow.inputs.repo_path}", context, "step.inputs");
   * // result.value = "/path/to/repo"
   * ```
   */
  public resolve(
    value: unknown,
    context: VariableResolutionContext,
    field: string,
    line?: number
  ): VariableResolutionResult {
    const errors: ValidationError[] = [];

    // Handle string values with variable references
    if (typeof value === 'string') {
      let resolvedValue = value;
      const references = this.extractReferences(value, field, line);

      for (const ref of references) {
        const result = this.resolveReference(ref, context);

        if (!result.success) {
          errors.push(
            ...result.errors!.map((err) => ({
              ...err,
              field,
              line,
            }))
          );
          continue;
        }

        // Replace variable reference with resolved value
        const replacement = this.formatResolvedValue(result.value);
        resolvedValue = resolvedValue.replace(ref.raw, replacement);
      }

      return {
        success: errors.length === 0,
        value: errors.length === 0 ? resolvedValue : value,
        errors: errors.length > 0 ? errors : undefined,
      };
    }

    // Handle object values (recursively resolve each field)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const resolvedObject: Record<string, unknown> = {};

      for (const [key, val] of Object.entries(value)) {
        const nestedField = `${field}.${key}`;
        const result = this.resolve(val, context, nestedField, line);

        if (!result.success) {
          errors.push(...(result.errors || []));
        }

        resolvedObject[key] = result.value;
      }

      return {
        success: errors.length === 0,
        value: resolvedObject,
        errors: errors.length > 0 ? errors : undefined,
      };
    }

    // Handle array values (resolve each element)
    if (Array.isArray(value)) {
      const resolvedArray: unknown[] = [];

      for (let i = 0; i < value.length; i++) {
        const nestedField = `${field}[${i}]`;
        const result = this.resolve(value[i], context, nestedField, line);

        if (!result.success) {
          errors.push(...(result.errors || []));
        }

        resolvedArray.push(result.value);
      }

      return {
        success: errors.length === 0,
        value: resolvedArray,
        errors: errors.length > 0 ? errors : undefined,
      };
    }

    // Primitive values (no resolution needed)
    return { success: true, value };
  }

  /**
   * Resolve a single variable reference
   *
   * @param ref - Variable reference to resolve
   * @param context - Variable resolution context
   * @returns Resolution result
   */
  private resolveReference(
    ref: VariableReference,
    context: VariableResolutionContext
  ): VariableResolutionResult {
    switch (ref.scope) {
      case 'workflow':
        return this.resolveWorkflowVariable(ref, context);
      case 'steps':
        return this.resolveStepVariable(ref, context);
      case 'loop':
        return this.resolveLoopVariable(ref, context);
      default:
        return {
          success: false,
          value: ref.raw,
          errors: [
            {
              field: ref.field,
              line: ref.line,
              message: `Invalid variable scope: ${String(ref.scope)}`,
              severity: 'error',
              suggestion: 'Use workflow, steps, or loop scope',
            },
          ],
        };
    }
  }

  /**
   * Resolve workflow input variable (${workflow.inputs.name})
   */
  private resolveWorkflowVariable(
    ref: VariableReference,
    context: VariableResolutionContext
  ): VariableResolutionResult {
    // Expected format: workflow.inputs.inputId
    if (ref.path.length < 2 || ref.path[0] !== 'inputs') {
      return {
        success: false,
        value: ref.raw,
        errors: [
          {
            field: ref.field,
            line: ref.line,
            message: `Invalid workflow variable reference: ${ref.raw}`,
            severity: 'error',
            suggestion: 'Use format: ${workflow.inputs.inputId}',
          },
        ],
      };
    }

    const inputId = ref.path[1];
    if (!inputId) {
      return {
        success: false,
        value: ref.raw,
        errors: [
          {
            field: ref.field,
            line: ref.line,
            message: `Invalid workflow variable reference: ${ref.raw}`,
            severity: 'error',
            suggestion: 'Use format: ${workflow.inputs.inputId}',
          },
        ],
      };
    }

    const value = context.workflowInputs[inputId];

    if (value === undefined) {
      return {
        success: false,
        value: ref.raw,
        errors: [
          {
            field: ref.field,
            line: ref.line,
            message: `Undefined workflow input: ${inputId}`,
            severity: 'error',
            suggestion: `Check workflow.inputs contains "${inputId}"`,
          },
        ],
      };
    }

    return { success: true, value };
  }

  /**
   * Resolve step output variable (${steps.stepId.outputs.name})
   */
  private resolveStepVariable(
    ref: VariableReference,
    context: VariableResolutionContext
  ): VariableResolutionResult {
    // Expected format: steps.stepId.outputs.outputName
    if (ref.path.length < 3 || ref.path[1] !== 'outputs') {
      return {
        success: false,
        value: ref.raw,
        errors: [
          {
            field: ref.field,
            line: ref.line,
            message: `Invalid step variable reference: ${ref.raw}`,
            severity: 'error',
            suggestion: 'Use format: ${steps.stepId.outputs.outputName}',
          },
        ],
      };
    }

    const stepId = ref.path[0];
    const outputName = ref.path[2];

    if (!stepId || !outputName) {
      return {
        success: false,
        value: ref.raw,
        errors: [
          {
            field: ref.field,
            line: ref.line,
            message: `Invalid step variable reference: ${ref.raw}`,
            severity: 'error',
            suggestion: 'Use format: ${steps.stepId.outputs.outputName}',
          },
        ],
      };
    }

    const stepOutputs = context.stepOutputs[stepId];
    if (!stepOutputs) {
      return {
        success: false,
        value: ref.raw,
        errors: [
          {
            field: ref.field,
            line: ref.line,
            message: `Step "${stepId}" has not executed or does not exist`,
            severity: 'error',
            suggestion: `Ensure step "${stepId}" runs before this step (use depends_on)`,
          },
        ],
      };
    }

    const value = stepOutputs[outputName];
    if (value === undefined) {
      return {
        success: false,
        value: ref.raw,
        errors: [
          {
            field: ref.field,
            line: ref.line,
            message: `Step "${stepId}" does not have output "${outputName}"`,
            severity: 'error',
            suggestion: `Check step "${stepId}" outputs array includes "${outputName}"`,
          },
        ],
      };
    }

    return { success: true, value };
  }

  /**
   * Resolve loop context variable (${loop.item}, ${loop.index})
   */
  private resolveLoopVariable(
    ref: VariableReference,
    context: VariableResolutionContext
  ): VariableResolutionResult {
    if (!context.loopContext) {
      return {
        success: false,
        value: ref.raw,
        errors: [
          {
            field: ref.field,
            line: ref.line,
            message: 'Loop variables can only be used within loop steps',
            severity: 'error',
            suggestion: 'Move this step inside a loop step',
          },
        ],
      };
    }

    // Expected format: loop.item or loop.index
    if (ref.path.length !== 1) {
      return {
        success: false,
        value: ref.raw,
        errors: [
          {
            field: ref.field,
            line: ref.line,
            message: `Invalid loop variable reference: ${ref.raw}`,
            severity: 'error',
            suggestion: 'Use ${loop.item} or ${loop.index}',
          },
        ],
      };
    }

    const loopVar = ref.path[0];
    if (loopVar === 'item') {
      return { success: true, value: context.loopContext.item };
    } else if (loopVar === 'index') {
      return { success: true, value: context.loopContext.index };
    } else {
      return {
        success: false,
        value: ref.raw,
        errors: [
          {
            field: ref.field,
            line: ref.line,
            message: `Unknown loop variable: ${loopVar}`,
            severity: 'error',
            suggestion: 'Use ${loop.item} or ${loop.index}',
          },
        ],
      };
    }
  }

  /**
   * Format resolved value for string interpolation
   */
  private formatResolvedValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (value === null || value === undefined) {
      return '';
    }
    // Complex values (objects, arrays) convert to JSON
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[object]';
      }
    }
    // All other types (symbol, function, bigint) - safe to stringify
    // Handle remaining primitive types explicitly
    if (typeof value === 'symbol') {
      return String(value);
    }
    if (typeof value === 'function') {
      return '[function]';
    }
    if (typeof value === 'bigint') {
      return String(value);
    }
    // Final fallback - should never reach here, but safe
    return '';
  }

  /**
   * Validate all variable references in workflow steps
   *
   * @param steps - Workflow steps to validate
   * @param workflowInputIds - Set of valid workflow input IDs
   * @returns Array of validation errors
   */
  public validateReferences(
    steps: Array<{ id: string; inputs?: Record<string, unknown> }>,
    workflowInputIds: Set<string>
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const stepIds = new Set(steps.map((s) => s.id));

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      if (!step || !step.inputs) continue;

      const references = this.extractReferences(step.inputs, `steps[${i}].inputs`);

      for (const ref of references) {
        // Validate workflow input references
        if (ref.scope === 'workflow') {
          if (ref.path.length < 2 || ref.path[0] !== 'inputs') {
            errors.push({
              field: ref.field,
              line: ref.line,
              message: `Invalid workflow variable: ${ref.raw}`,
              severity: 'error',
              suggestion: 'Use format: ${workflow.inputs.inputId}',
            });
            continue;
          }

          const inputId = ref.path[1];
          if (inputId && !workflowInputIds.has(inputId)) {
            errors.push({
              field: ref.field,
              line: ref.line,
              message: `Undefined workflow input: ${inputId}`,
              severity: 'error',
              suggestion: `Add "${inputId}" to workflow.inputs`,
            });
          }
        }

        // Validate step output references
        if (ref.scope === 'steps') {
          if (!ref.stepId || !stepIds.has(ref.stepId)) {
            errors.push({
              field: ref.field,
              line: ref.line,
              message: `Reference to unknown step: ${ref.stepId}`,
              severity: 'error',
              suggestion: `Ensure step "${ref.stepId}" exists`,
            });
          }
        }
      }
    }

    return errors;
  }
}
