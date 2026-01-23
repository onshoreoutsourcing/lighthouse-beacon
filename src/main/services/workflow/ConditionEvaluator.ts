/**
 * ConditionEvaluator.ts
 * Safe JavaScript expression evaluator for workflow conditional branching
 *
 * Implements Wave 9.4.1: Conditional Branching
 * - Safe expression evaluation (no eval())
 * - Support for comparison operators: >, <, >=, <=, ==, !=, ===, !==
 * - Support for logical operators: &&, ||, !
 * - Variable resolution integration (${...} syntax)
 * - Performance: <10ms per evaluation
 * - Security: Whitelisted operators only
 *
 * Part of Feature 9.4: Advanced Control Flow
 */

import log from 'electron-log';
import { VariableResolver } from './VariableResolver';
import type { VariableResolutionContext } from '../../../shared/types';

/**
 * Condition evaluation result
 */
export interface ConditionEvaluationResult {
  /** Whether condition evaluated to true */
  result: boolean;
  /** Error message if evaluation failed */
  error?: string;
  /** Resolved condition expression (with variables replaced) */
  resolvedExpression?: string;
  /** Evaluation duration in milliseconds */
  duration?: number;
}

/**
 * Allowed operator types for condition evaluation
 */
type ComparisonOperator = '>' | '<' | '>=' | '<=' | '==' | '!=' | '===' | '!==';
type LogicalOperator = '&&' | '||';

/**
 * Safe expression evaluator for workflow conditions
 *
 * Evaluates boolean expressions using a safe, non-eval approach.
 * Supports comparison and logical operators with variable resolution.
 */
export class ConditionEvaluator {
  private readonly SERVICE_NAME = 'ConditionEvaluator';
  private readonly variableResolver: VariableResolver;

  /**
   * Whitelist of allowed comparison operators
   */
  private readonly COMPARISON_OPERATORS: ComparisonOperator[] = [
    '===',
    '!==',
    '==',
    '!=',
    '>=',
    '<=',
    '>',
    '<',
  ];

  /**
   * Whitelist of allowed logical operators
   */
  private readonly LOGICAL_OPERATORS: LogicalOperator[] = ['&&', '||'];

  constructor() {
    this.variableResolver = new VariableResolver();
  }

  /**
   * Evaluate a conditional expression
   *
   * @param condition - Condition expression (may contain ${...} variables)
   * @param context - Variable resolution context (workflow inputs, step outputs)
   * @returns Evaluation result with boolean result or error
   *
   * @example
   * ```typescript
   * const evaluator = new ConditionEvaluator();
   * const result = evaluator.evaluate(
   *   "${steps.check.outputs.score} > 80",
   *   { workflowInputs: {}, stepOutputs: { check: { score: 85 } } }
   * );
   * // result.result === true
   * ```
   */
  public evaluate(
    condition: string,
    context: VariableResolutionContext
  ): ConditionEvaluationResult {
    const startTime = Date.now();

    try {
      // Step 1: Resolve variables in condition
      const resolutionResult = this.variableResolver.resolve(
        condition,
        context,
        'condition_expression'
      );

      if (!resolutionResult.success) {
        const errorMessages =
          resolutionResult.errors?.map((e) => e.message).join('; ') || 'Variable resolution failed';
        const errorMessage = `Variable resolution failed: ${errorMessages}`;

        log.error(`${this.SERVICE_NAME}: ${errorMessage}`);
        return {
          result: false,
          error: errorMessage,
          duration: Date.now() - startTime,
        };
      }

      const resolvedExpression = String(resolutionResult.value);

      log.debug(
        `${this.SERVICE_NAME}: Evaluating condition "${condition}" → "${resolvedExpression}"`
      );

      // Step 2: Parse and evaluate the resolved expression
      const result = this.evaluateExpression(resolvedExpression);

      const duration = Date.now() - startTime;

      // Check performance requirement (<10ms)
      if (duration > 10) {
        log.warn(
          `${this.SERVICE_NAME}: Evaluation took ${duration}ms (exceeds 10ms target) for condition: ${condition}`
        );
      }

      log.info(
        `${this.SERVICE_NAME}: Condition "${condition}" evaluated to ${result} in ${duration}ms`
      );

      return {
        result,
        resolvedExpression,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      log.error(`${this.SERVICE_NAME}: Evaluation error - ${errorMessage}`);

      return {
        result: false,
        error: `Evaluation error: ${errorMessage}`,
        duration,
      };
    }
  }

  /**
   * Evaluate a resolved expression (no variables)
   *
   * Uses safe parsing and evaluation (no eval()).
   * Supports comparison and logical operators.
   *
   * @param expression - Resolved expression (all variables replaced with values)
   * @returns Boolean result
   */
  private evaluateExpression(expression: string): boolean {
    // Trim whitespace
    expression = expression.trim();

    // Handle boolean literals
    if (expression === 'true') return true;
    if (expression === 'false') return false;

    // Handle logical NOT operator
    if (expression.startsWith('!')) {
      const inner = expression.slice(1).trim();
      return !this.evaluateExpression(inner);
    }

    // Handle logical operators (&&, ||) - split on lowest precedence operator
    const orParts = this.splitOnOperator(expression, '||');
    if (orParts.length > 1) {
      // OR: true if any part is true
      return orParts.some((part) => this.evaluateExpression(part));
    }

    const andParts = this.splitOnOperator(expression, '&&');
    if (andParts.length > 1) {
      // AND: true if all parts are true
      return andParts.every((part) => this.evaluateExpression(part));
    }

    // Handle comparison operators
    for (const op of this.COMPARISON_OPERATORS) {
      const parts = this.splitOnOperator(expression, op);
      if (parts.length === 2 && parts[0] !== undefined && parts[1] !== undefined) {
        return this.evaluateComparison(parts[0], op, parts[1]);
      }
    }

    // If no operators found, try to parse as boolean
    throw new Error(
      `Invalid expression: ${expression}. Expected comparison or logical expression.`
    );
  }

  /**
   * Split expression on operator (respecting string literals and parentheses)
   *
   * @param expression - Expression to split
   * @param operator - Operator to split on
   * @returns Array of expression parts (empty if operator not found at top level)
   */
  private splitOnOperator(expression: string, operator: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      const nextChars = expression.slice(i, i + operator.length);

      // Track string literals
      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
        current += char;
        continue;
      }

      if (inString && char === stringChar) {
        inString = false;
        current += char;
        continue;
      }

      // Track parentheses depth
      if (!inString) {
        if (char === '(') depth++;
        if (char === ')') depth--;

        // Found operator at top level
        if (depth === 0 && nextChars === operator) {
          parts.push(current.trim());
          current = '';
          i += operator.length - 1; // Skip operator characters
          continue;
        }
      }

      current += char;
    }

    // Add final part
    if (current.trim()) {
      parts.push(current.trim());
    }

    // Return empty array if no operator found at top level
    return parts.length > 1 ? parts : [];
  }

  /**
   * Evaluate a comparison operation
   *
   * @param left - Left operand (string representation)
   * @param operator - Comparison operator
   * @param right - Right operand (string representation)
   * @returns Boolean comparison result
   */
  private evaluateComparison(left: string, operator: ComparisonOperator, right: string): boolean {
    // Parse operands (handle numbers, strings, booleans)
    const leftValue = this.parseValue(left.trim());
    const rightValue = this.parseValue(right.trim());

    log.debug(
      `${this.SERVICE_NAME}: Comparing ${JSON.stringify(leftValue)} ${operator} ${JSON.stringify(rightValue)}`
    );

    switch (operator) {
      case '>':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (leftValue as any) > (rightValue as any);
      case '<':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (leftValue as any) < (rightValue as any);
      case '>=':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (leftValue as any) >= (rightValue as any);
      case '<=':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (leftValue as any) <= (rightValue as any);
      case '==':
        return leftValue == rightValue;
      case '!=':
        return leftValue != rightValue;
      case '===':
        return leftValue === rightValue;
      case '!==':
        return leftValue !== rightValue;
      default:
        throw new Error(`Unsupported operator: ${operator as string}`);
    }
  }

  /**
   * Parse a value from string representation
   *
   * Handles:
   * - Numbers: "42" → 42, "3.14" → 3.14
   * - Booleans: "true" → true, "false" → false
   * - Strings: "'hello'" → "hello", '"world"' → "world"
   * - Empty strings: "" → ""
   * - Null: "null" → null
   *
   * @param value - String representation of value
   * @returns Parsed value (number, boolean, string, or null)
   */
  private parseValue(value: string): unknown {
    // Handle string literals (including empty strings)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1);
    }

    // Handle null
    if (value === 'null') {
      return null;
    }

    // Handle booleans
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Handle numbers (but not empty string)
    if (value !== '') {
      const num = Number(value);
      if (!isNaN(num)) {
        return num;
      }
    }

    // Default: treat as unquoted string (including empty string)
    return value;
  }

  /**
   * Validate condition syntax before execution
   *
   * @param condition - Condition expression to validate
   * @returns true if valid, error message if invalid
   */
  public validate(condition: string): { valid: boolean; error?: string } {
    try {
      // Extract variable references
      const refs = this.variableResolver.extractReferences(condition, 'condition');

      // Check if condition has at least one operator or is a boolean literal
      const hasOperator =
        this.COMPARISON_OPERATORS.some((op) => condition.includes(op)) ||
        this.LOGICAL_OPERATORS.some((op) => condition.includes(op)) ||
        condition.includes('!');

      const isBooleanLiteral = condition.trim() === 'true' || condition.trim() === 'false';
      const isVariableOnly = refs.length === 1 && refs[0] && condition.trim() === refs[0].raw;

      if (!hasOperator && !isBooleanLiteral && !isVariableOnly) {
        return {
          valid: false,
          error: 'Condition must contain a comparison or logical operator (>, <, ==, &&, ||, etc.)',
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
