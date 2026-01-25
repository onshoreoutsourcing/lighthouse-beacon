/**
 * YamlParser.ts
 * YAML workflow parser and serializer
 *
 * Implements ADR-017: Workflow YAML Schema Design
 * - Parse YAML to Workflow AST using js-yaml safe mode
 * - Serialize Workflow AST back to YAML
 * - Round-trip fidelity (YAML → AST → YAML maintains equivalence)
 * - Security: No dangerous YAML tags (!!python/object, etc.)
 * - Performance: <200ms for 10-20 node workflows
 *
 * Part of Wave 9.1.2: YAML Parser & Workflow Validation
 */

import * as yaml from 'js-yaml';
import log from 'electron-log';
import type {
  Workflow,
  YAMLParseOptions,
  YAMLParseResult,
  YAMLSerializeOptions,
  ValidationError,
} from '../../../shared/types';

/**
 * YAML workflow parser and serializer
 *
 * Provides safe parsing and serialization of workflow YAML files using js-yaml.
 * All parsing uses safe mode to prevent arbitrary code execution.
 */
export class YamlParser {
  private readonly SERVICE_NAME = 'YamlParser';
  private readonly DEFAULT_MAX_FILE_SIZE = 1024 * 1024; // 1MB
  private readonly DEFAULT_INDENT = 2;
  private readonly DEFAULT_LINE_WIDTH = 80;

  /**
   * Parse YAML string to Workflow object
   *
   * @param yamlContent - YAML string to parse
   * @param options - Parsing options
   * @returns Parse result with workflow or error
   *
   * @example
   * ```typescript
   * const parser = new YamlParser();
   * const result = parser.parse(yamlString);
   * if (result.success) {
   *   console.log(result.workflow);
   * } else {
   *   console.error(result.error);
   * }
   * ```
   */
  public parse(yamlContent: string, options: YAMLParseOptions = {}): YAMLParseResult {
    const startTime = Date.now();

    try {
      // Validate input size
      const maxSize = options.maxFileSize ?? this.DEFAULT_MAX_FILE_SIZE;
      if (yamlContent.length > maxSize) {
        return this.createErrorResult({
          field: 'yaml',
          message: `YAML content exceeds maximum size of ${maxSize} bytes`,
          severity: 'error',
          suggestion: 'Reduce workflow complexity or increase maxFileSize option',
        });
      }

      // Check for dangerous YAML tags (security)
      if (this.containsDangerousTags(yamlContent)) {
        log.error(`${this.SERVICE_NAME}: Dangerous YAML tags detected`);
        return this.createErrorResult({
          field: 'yaml',
          message: 'YAML contains dangerous tags (!!python/object, !!js/function, etc.)',
          severity: 'error',
          suggestion: 'Remove dangerous tags and use standard YAML types only',
        });
      }

      // Parse YAML using safe mode (prevents code execution)
      const parsed = yaml.load(yamlContent, {
        schema: yaml.DEFAULT_SCHEMA, // Use default safe schema
        json: false, // Allow YAML-specific features
        onWarning: (warning) => {
          log.warn(`${this.SERVICE_NAME}: YAML warning - ${warning.message}`);
        },
      });

      // Validate parsed structure is an object
      if (!parsed || typeof parsed !== 'object') {
        return this.createErrorResult({
          field: 'yaml',
          message: 'YAML must contain a valid workflow object',
          severity: 'error',
          suggestion: 'Ensure YAML root is an object with workflow, inputs, and steps fields',
        });
      }

      // Cast to Workflow (validation will happen in WorkflowValidator)
      const workflow = parsed as Workflow;

      // Basic structural validation (required top-level fields)
      if (!workflow.workflow) {
        return this.createErrorResult({
          field: 'workflow',
          message: 'Missing required "workflow" metadata section',
          severity: 'error',
          suggestion: 'Add workflow section with name, version, and description',
        });
      }

      if (!workflow.inputs || !Array.isArray(workflow.inputs)) {
        return this.createErrorResult({
          field: 'inputs',
          message: 'Missing or invalid "inputs" array',
          severity: 'error',
          suggestion: 'Add inputs array (can be empty: inputs: [])',
        });
      }

      if (!workflow.steps || !Array.isArray(workflow.steps)) {
        return this.createErrorResult({
          field: 'steps',
          message: 'Missing or invalid "steps" array',
          severity: 'error',
          suggestion: 'Add steps array with at least one workflow step',
        });
      }

      const duration = Date.now() - startTime;
      log.info(
        `${this.SERVICE_NAME}: Parsed workflow "${workflow.workflow.name}" in ${duration}ms`
      );

      // Check performance threshold (200ms target)
      if (duration > 200) {
        log.warn(
          `${this.SERVICE_NAME}: Parse time ${duration}ms exceeds 200ms target for workflow "${workflow.workflow.name}"`
        );
      }

      return {
        success: true,
        workflow,
      };
    } catch (error) {
      log.error(
        `${this.SERVICE_NAME}: Parse error - ${error instanceof Error ? error.message : String(error)}`
      );

      // Extract line number from js-yaml error if available
      let line: number | undefined;
      let column: number | undefined;
      let message = 'Unknown parse error';

      if (error instanceof yaml.YAMLException) {
        line = error.mark?.line ? error.mark.line + 1 : undefined; // js-yaml uses 0-based lines
        column = error.mark?.column ? error.mark.column + 1 : undefined;
        message = error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      return this.createErrorResult({
        line,
        column,
        field: 'yaml',
        message: `YAML parse error: ${message}`,
        severity: 'error',
        suggestion: 'Check YAML syntax (indentation, colons, quotes)',
      });
    }
  }

  /**
   * Serialize Workflow object to YAML string
   *
   * @param workflow - Workflow object to serialize
   * @param options - Serialization options
   * @returns YAML string representation
   *
   * @example
   * ```typescript
   * const parser = new YamlParser();
   * const yamlString = parser.serialize(workflow, { indent: 2 });
   * ```
   */
  public serialize(workflow: Workflow, options: YAMLSerializeOptions = {}): string {
    const startTime = Date.now();

    try {
      const yamlString = yaml.dump(workflow, {
        indent: options.indent ?? this.DEFAULT_INDENT,
        lineWidth: options.lineWidth ?? this.DEFAULT_LINE_WIDTH,
        noRefs: true, // Disable references for cleaner output
        sortKeys: false, // Preserve field order
        schema: yaml.DEFAULT_SCHEMA, // Use safe schema
      });

      const duration = Date.now() - startTime;
      log.info(
        `${this.SERVICE_NAME}: Serialized workflow "${workflow.workflow.name}" in ${duration}ms`
      );

      return yamlString;
    } catch (error) {
      log.error(
        `${this.SERVICE_NAME}: Serialize error - ${error instanceof Error ? error.message : String(error)}`
      );
      throw new Error(
        `Failed to serialize workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate round-trip fidelity (YAML → AST → YAML)
   *
   * Ensures that parsing and serializing maintains semantic equivalence.
   * Note: Formatting may differ (comments, whitespace), but structure should match.
   *
   * @param originalYaml - Original YAML string
   * @returns Whether round-trip is semantically equivalent
   */
  public validateRoundTrip(originalYaml: string): boolean {
    try {
      // Parse original YAML
      const parseResult = this.parse(originalYaml);
      if (!parseResult.success || !parseResult.workflow) {
        log.warn(`${this.SERVICE_NAME}: Round-trip validation failed - parse error`);
        return false;
      }

      // Serialize back to YAML
      const serialized = this.serialize(parseResult.workflow);

      // Parse serialized YAML
      const reParseResult = this.parse(serialized);
      if (!reParseResult.success || !reParseResult.workflow) {
        log.warn(`${this.SERVICE_NAME}: Round-trip validation failed - re-parse error`);
        return false;
      }

      // Compare semantic equivalence (deep equality)
      const isEquivalent = this.deepEqual(parseResult.workflow, reParseResult.workflow);

      if (!isEquivalent) {
        log.warn(`${this.SERVICE_NAME}: Round-trip validation failed - semantic mismatch`);
      } else {
        log.info(`${this.SERVICE_NAME}: Round-trip validation passed`);
      }

      return isEquivalent;
    } catch (error) {
      log.error(
        `${this.SERVICE_NAME}: Round-trip validation error - ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  /**
   * Check for dangerous YAML tags that could execute code
   *
   * @param yamlContent - YAML string to check
   * @returns Whether dangerous tags are present
   */
  private containsDangerousTags(yamlContent: string): boolean {
    const dangerousTags = [
      '!!python/object',
      '!!python/name',
      '!!python/module',
      '!!js/function',
      '!!js/undefined',
      '!!java/object',
    ];

    return dangerousTags.some((tag) => yamlContent.includes(tag));
  }

  /**
   * Create error result from ValidationError
   *
   * @param error - Validation error details
   * @returns Parse result with error
   */
  private createErrorResult(error: ValidationError): YAMLParseResult {
    return {
      success: false,
      error,
    };
  }

  /**
   * Deep equality comparison for objects
   *
   * @param obj1 - First object
   * @param obj2 - Second object
   * @returns Whether objects are deeply equal
   */
  private deepEqual(obj1: unknown, obj2: unknown): boolean {
    if (obj1 === obj2) return true;

    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (
        !this.deepEqual(
          (obj1 as Record<string, unknown>)[key],
          (obj2 as Record<string, unknown>)[key]
        )
      ) {
        return false;
      }
    }

    return true;
  }
}
