/**
 * VariableResolver.test.ts
 * Unit tests for workflow variable resolution
 *
 * Tests cover:
 * - Workflow input variable resolution
 * - Step output variable resolution
 * - Loop context variable resolution
 * - Nested variable references
 * - Error handling for undefined variables
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VariableResolver } from '../VariableResolver';
import type { VariableResolutionContext } from '../../../../shared/types';

describe('VariableResolver', () => {
  let resolver: VariableResolver;

  beforeEach(() => {
    resolver = new VariableResolver();
  });

  describe('extractReferences()', () => {
    it('should extract workflow input reference', () => {
      const refs = resolver.extractReferences('${workflow.inputs.repo_path}', 'test.field');

      expect(refs).toHaveLength(1);
      expect(refs[0]?.raw).toBe('${workflow.inputs.repo_path}');
      expect(refs[0]?.scope).toBe('workflow');
      expect(refs[0]?.path).toEqual(['inputs', 'repo_path']);
    });

    it('should extract step output reference', () => {
      const refs = resolver.extractReferences(
        '${steps.analyze_repo.outputs.structure}',
        'test.field'
      );

      expect(refs).toHaveLength(1);
      expect(refs[0]?.scope).toBe('steps');
      expect(refs[0]?.stepId).toBe('analyze_repo');
      expect(refs[0]?.path).toEqual(['analyze_repo', 'outputs', 'structure']);
    });

    it('should extract multiple references from same string', () => {
      const refs = resolver.extractReferences(
        'Path: ${workflow.inputs.path}, Output: ${steps.step1.outputs.result}',
        'test.field'
      );

      expect(refs).toHaveLength(2);
      expect(refs[0]?.scope).toBe('workflow');
      expect(refs[1]?.scope).toBe('steps');
    });

    it('should extract references from object values', () => {
      const obj = {
        path: '${workflow.inputs.repo_path}',
        nested: {
          output: '${steps.step1.outputs.data}',
        },
      };

      const refs = resolver.extractReferences(obj, 'test.field');

      expect(refs).toHaveLength(2);
    });

    it('should handle strings without variables', () => {
      const refs = resolver.extractReferences('plain string without variables', 'test.field');

      expect(refs).toHaveLength(0);
    });
  });

  describe('resolve() - workflow inputs', () => {
    it('should resolve workflow input variable', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {
          repo_path: '/path/to/repo',
        },
        stepOutputs: {},
      };

      const result = resolver.resolve('${workflow.inputs.repo_path}', context, 'test.field');

      expect(result.success).toBe(true);
      expect(result.value).toBe('/path/to/repo');
    });

    it('should resolve multiple workflow inputs in string', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {
          name: 'TestProject',
          version: '1.0.0',
        },
        stepOutputs: {},
      };

      const result = resolver.resolve(
        'Project: ${workflow.inputs.name} v${workflow.inputs.version}',
        context,
        'test.field'
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe('Project: TestProject v1.0.0');
    });

    it('should error on undefined workflow input', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {},
        stepOutputs: {},
      };

      const result = resolver.resolve('${workflow.inputs.undefined_input}', context, 'test.field');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('Undefined workflow input');
    });

    it('should error on invalid workflow variable format', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {},
        stepOutputs: {},
      };

      const result = resolver.resolve('${workflow.invalid}', context, 'test.field');

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.message).toContain('Invalid workflow variable');
    });
  });

  describe('resolve() - step outputs', () => {
    it('should resolve step output variable', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {},
        stepOutputs: {
          step1: {
            result: 'success',
            data: { count: 42 },
          },
        },
      };

      const result = resolver.resolve('${steps.step1.outputs.result}', context, 'test.field');

      expect(result.success).toBe(true);
      expect(result.value).toBe('success');
    });

    it('should error on undefined step', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {},
        stepOutputs: {},
      };

      const result = resolver.resolve('${steps.unknown_step.outputs.data}', context, 'test.field');

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.message).toContain('has not executed or does not exist');
    });

    it('should error on undefined step output', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {},
        stepOutputs: {
          step1: {
            result: 'success',
          },
        },
      };

      const result = resolver.resolve(
        '${steps.step1.outputs.undefined_output}',
        context,
        'test.field'
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.message).toContain('does not have output');
    });

    it('should handle complex step output values', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {},
        stepOutputs: {
          step1: {
            data: { nested: { value: 'test' } },
          },
        },
      };

      const result = resolver.resolve('${steps.step1.outputs.data}', context, 'test.field');

      expect(result.success).toBe(true);
      // When entire expression is a variable reference, preserve original type
      expect(result.value).toEqual({ nested: { value: 'test' } });
    });

    it('should stringify complex values when embedded in strings', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {},
        stepOutputs: {
          step1: {
            data: { nested: { value: 'test' } },
          },
        },
      };

      const result = resolver.resolve('Data: ${steps.step1.outputs.data}', context, 'test.field');

      expect(result.success).toBe(true);
      // When variable is embedded in string, it gets stringified
      expect(result.value).toBe('Data: {"nested":{"value":"test"}}');
    });
  });

  describe('resolve() - loop context', () => {
    it('should resolve loop.item variable', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {},
        stepOutputs: {},
        loopContext: {
          item: 'test-item',
          index: 0,
        },
      };

      const result = resolver.resolve('${loop.item}', context, 'test.field');

      expect(result.success).toBe(true);
      expect(result.value).toBe('test-item');
    });

    it('should resolve loop.index variable', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {},
        stepOutputs: {},
        loopContext: {
          item: 'test',
          index: 5,
        },
      };

      const result = resolver.resolve('Item ${loop.index}', context, 'test.field');

      expect(result.success).toBe(true);
      expect(result.value).toBe('Item 5');
    });

    it('should error on loop variable outside loop context', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {},
        stepOutputs: {},
      };

      const result = resolver.resolve('${loop.item}', context, 'test.field');

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.message).toContain('only be used within loop steps');
    });

    it('should error on unknown loop variable', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {},
        stepOutputs: {},
        loopContext: {
          item: 'test',
          index: 0,
        },
      };

      const result = resolver.resolve('${loop.unknown}', context, 'test.field');

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.message).toContain('Unknown loop variable');
    });
  });

  describe('resolve() - environment variables', () => {
    it('should resolve environment variable', () => {
      // Set test environment variable
      process.env.TEST_VAR = 'test_value';

      const context: VariableResolutionContext = {
        workflowInputs: {},
        stepOutputs: {},
      };

      const result = resolver.resolve('${env.TEST_VAR}', context, 'test.field');

      expect(result.success).toBe(true);
      expect(result.value).toBe('test_value');

      // Clean up
      delete process.env.TEST_VAR;
    });

    it('should resolve multiple environment variables in string', () => {
      process.env.API_KEY = 'sk_test_123';
      process.env.API_ENDPOINT = 'https://api.example.com';

      const context: VariableResolutionContext = {
        workflowInputs: {},
        stepOutputs: {},
      };

      const result = resolver.resolve(
        'URL: ${env.API_ENDPOINT}, Key: ${env.API_KEY}',
        context,
        'test.field'
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe('URL: https://api.example.com, Key: sk_test_123');

      delete process.env.API_KEY;
      delete process.env.API_ENDPOINT;
    });

    it('should error on undefined environment variable', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {},
        stepOutputs: {},
      };

      const result = resolver.resolve('${env.UNDEFINED_VAR}', context, 'test.field');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.message).toContain('Undefined environment variable');
    });

    it('should error on invalid environment variable format', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {},
        stepOutputs: {},
      };

      const result = resolver.resolve('${env.INVALID.PATH}', context, 'test.field');

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.message).toContain('Invalid environment variable reference');
    });

    it('should handle mixed workflow inputs and environment variables', () => {
      process.env.API_KEY = 'secret_key';

      const context: VariableResolutionContext = {
        workflowInputs: {
          url: 'https://api.example.com',
        },
        stepOutputs: {},
      };

      const result = resolver.resolve(
        'URL: ${workflow.inputs.url}, Key: ${env.API_KEY}',
        context,
        'test.field'
      );

      expect(result.success).toBe(true);
      expect(result.value).toBe('URL: https://api.example.com, Key: secret_key');

      delete process.env.API_KEY;
    });
  });

  describe('resolve() - complex scenarios', () => {
    it('should resolve object with nested variables', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {
          path: '/test',
        },
        stepOutputs: {
          step1: {
            output: 'result',
          },
        },
      };

      const obj = {
        path: '${workflow.inputs.path}',
        result: '${steps.step1.outputs.output}',
        nested: {
          value: '${workflow.inputs.path}/file.txt',
        },
      };

      const result = resolver.resolve(obj, context, 'test.field');

      expect(result.success).toBe(true);
      const resolved = result.value as Record<string, unknown>;
      expect(resolved.path).toBe('/test');
      expect(resolved.result).toBe('result');
      expect((resolved.nested as Record<string, unknown>).value).toBe('/test/file.txt');
    });

    it('should resolve array with variables', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {
          item1: 'first',
          item2: 'second',
        },
        stepOutputs: {},
      };

      const arr = ['${workflow.inputs.item1}', '${workflow.inputs.item2}'];

      const result = resolver.resolve(arr, context, 'test.field');

      expect(result.success).toBe(true);
      expect(result.value).toEqual(['first', 'second']);
    });

    it('should handle mixed resolved and unresolved variables', () => {
      const context: VariableResolutionContext = {
        workflowInputs: {
          valid: 'test',
        },
        stepOutputs: {},
      };

      const result = resolver.resolve(
        'Valid: ${workflow.inputs.valid}, Invalid: ${workflow.inputs.undefined}',
        context,
        'test.field'
      );

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('validateReferences()', () => {
    it('should validate workflow input references', () => {
      const steps = [
        {
          id: 'step1',
          inputs: {
            path: '${workflow.inputs.repo_path}',
          },
        },
      ];

      const inputIds = new Set(['repo_path']);

      const errors = resolver.validateReferences(steps, inputIds);

      expect(errors).toHaveLength(0);
    });

    it('should error on undefined workflow input reference', () => {
      const steps = [
        {
          id: 'step1',
          inputs: {
            path: '${workflow.inputs.undefined_input}',
          },
        },
      ];

      const inputIds = new Set(['repo_path']);

      const errors = resolver.validateReferences(steps, inputIds);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.message).toContain('Undefined workflow input');
    });

    it('should validate step output references', () => {
      const steps = [
        {
          id: 'step1',
          inputs: {},
        },
        {
          id: 'step2',
          inputs: {
            data: '${steps.step1.outputs.result}',
          },
        },
      ];

      const inputIds = new Set<string>();

      const errors = resolver.validateReferences(steps, inputIds);

      expect(errors).toHaveLength(0);
    });

    it('should error on reference to unknown step', () => {
      const steps = [
        {
          id: 'step1',
          inputs: {
            data: '${steps.unknown_step.outputs.result}',
          },
        },
      ];

      const inputIds = new Set<string>();

      const errors = resolver.validateReferences(steps, inputIds);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.message).toContain('unknown step');
    });

    it('should validate environment variable references', () => {
      process.env.TEST_API_KEY = 'test_value';

      const steps = [
        {
          id: 'step1',
          inputs: {
            api_key: '${env.TEST_API_KEY}',
          },
        },
      ];

      const inputIds = new Set<string>();

      const errors = resolver.validateReferences(steps, inputIds);

      expect(errors).toHaveLength(0);

      delete process.env.TEST_API_KEY;
    });

    it('should warn on undefined environment variable', () => {
      const steps = [
        {
          id: 'step1',
          inputs: {
            api_key: '${env.UNDEFINED_ENV_VAR}',
          },
        },
      ];

      const inputIds = new Set<string>();

      const errors = resolver.validateReferences(steps, inputIds);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.message).toContain('Undefined environment variable');
      expect(errors[0]?.severity).toBe('warning'); // Warning, not error
    });

    it('should error on invalid environment variable format', () => {
      const steps = [
        {
          id: 'step1',
          inputs: {
            api_key: '${env.INVALID.PATH}',
          },
        },
      ];

      const inputIds = new Set<string>();

      const errors = resolver.validateReferences(steps, inputIds);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.message).toContain('Invalid environment variable');
      expect(errors[0]?.severity).toBe('error');
    });
  });
});
