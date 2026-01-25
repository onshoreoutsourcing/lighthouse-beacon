/**
 * WorkflowValidator.test.ts
 * Unit tests for workflow semantic validation
 *
 * Tests cover:
 * - Step ID uniqueness validation
 * - Dependency reference validation
 * - Circular dependency detection
 * - Required field validation
 * - Type-specific validation
 * - UI metadata validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowValidator } from '../WorkflowValidator';
import type { Workflow, WorkflowStep } from '../../../../shared/types';
import { StepType } from '../../../../shared/types';

describe('WorkflowValidator', () => {
  let validator: WorkflowValidator;

  beforeEach(() => {
    validator = new WorkflowValidator();
  });

  const createMinimalWorkflow = (): Workflow => ({
    workflow: {
      name: 'Test Workflow',
      version: '1.0.0',
      description: 'A test workflow',
    },
    inputs: [],
    steps: [
      {
        id: 'step1',
        type: StepType.OUTPUT,
        message: 'Test',
      },
    ],
  });

  describe('validateMetadata()', () => {
    it('should validate workflow with valid metadata', () => {
      const workflow = createMinimalWorkflow();
      const result = validator.validate(workflow);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject workflow without metadata section', () => {
      const workflow = {
        inputs: [],
        steps: [],
      } as unknown as Workflow;

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'workflow')).toBe(true);
    });

    it('should reject workflow without name', () => {
      const workflow = createMinimalWorkflow();
      workflow.workflow.name = '';

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'workflow.name')).toBe(true);
    });

    it('should reject workflow with invalid version', () => {
      const workflow = createMinimalWorkflow();
      workflow.workflow.version = 'invalid';

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'workflow.version')).toBe(true);
    });

    it('should accept valid semantic versions', () => {
      const workflow = createMinimalWorkflow();

      const validVersions = ['1.0.0', '2.3.4', '10.20.30'];

      for (const version of validVersions) {
        workflow.workflow.version = version;
        const result = validator.validate(workflow);
        expect(result.errors.filter((e) => e.field === 'workflow.version')).toHaveLength(0);
      }
    });

    it('should reject workflow without description', () => {
      const workflow = createMinimalWorkflow();
      workflow.workflow.description = '';

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'workflow.description')).toBe(true);
    });
  });

  describe('validateInputs()', () => {
    it('should validate empty inputs array', () => {
      const workflow = createMinimalWorkflow();
      workflow.inputs = [];

      const result = validator.validate(workflow);

      expect(result.errors.filter((e) => e.field === 'inputs')).toHaveLength(0);
    });

    it('should validate inputs with all required fields', () => {
      const workflow = createMinimalWorkflow();
      workflow.inputs = [
        {
          id: 'test_input',
          type: 'string',
          label: 'Test Input',
          required: true,
        },
      ];

      const result = validator.validate(workflow);

      expect(result.errors.filter((e) => e.field.startsWith('inputs'))).toHaveLength(0);
    });

    it('should reject input without id', () => {
      const workflow = createMinimalWorkflow();
      workflow.inputs = [
        {
          id: '',
          type: 'string',
          label: 'Test',
          required: true,
        },
      ];

      const result = validator.validate(workflow);

      expect(result.errors.some((e) => e.field.includes('inputs[0]'))).toBe(true);
    });

    it('should reject duplicate input IDs', () => {
      const workflow = createMinimalWorkflow();
      workflow.inputs = [
        { id: 'input1', type: 'string', label: 'Input 1', required: true },
        { id: 'input1', type: 'string', label: 'Input 2', required: true },
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Duplicate input ID'))).toBe(true);
    });

    it('should reject select type without options', () => {
      const workflow = createMinimalWorkflow();
      workflow.inputs = [
        {
          id: 'select_input',
          type: 'select',
          label: 'Select Input',
          required: true,
        },
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field.includes('options'))).toBe(true);
    });
  });

  describe('validateSteps()', () => {
    it('should reject workflow without steps', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'steps')).toBe(true);
    });

    it('should reject step without id', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [
        {
          id: '',
          type: StepType.OUTPUT,
          message: 'Test',
        },
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('missing required "id"'))).toBe(true);
    });

    it('should reject duplicate step IDs', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Test 1' },
        { id: 'step1', type: StepType.OUTPUT, message: 'Test 2' },
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Duplicate step ID'))).toBe(true);
    });

    it('should reject step without type', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [
        {
          id: 'step1',
        } as WorkflowStep,
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('missing required "type"'))).toBe(true);
    });
  });

  describe('validatePythonStep()', () => {
    it('should validate Python step with script', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [
        {
          id: 'python_step',
          type: StepType.PYTHON,
          script: './test.py',
        },
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(true);
    });

    it('should reject Python step without script', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [
        {
          id: 'python_step',
          type: StepType.PYTHON,
        } as WorkflowStep,
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('missing required "script"'))).toBe(true);
    });
  });

  describe('validateClaudeStep()', () => {
    it('should validate Claude step with all required fields', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [
        {
          id: 'claude_step',
          type: StepType.CLAUDE,
          model: 'claude-sonnet-4',
          prompt_template: 'Generate docs',
        },
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(true);
    });

    it('should reject Claude step without model', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [
        {
          id: 'claude_step',
          type: StepType.CLAUDE,
          prompt_template: 'Test',
        } as WorkflowStep,
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('missing required "model"'))).toBe(true);
    });

    it('should reject Claude step without prompt_template', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [
        {
          id: 'claude_step',
          type: StepType.CLAUDE,
          model: 'claude-sonnet-4',
        } as WorkflowStep,
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.message.includes('missing required "prompt_template"'))
      ).toBe(true);
    });
  });

  describe('validateDependencies()', () => {
    it('should validate valid dependencies', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Test 1' },
        { id: 'step2', type: StepType.OUTPUT, message: 'Test 2', depends_on: ['step1'] },
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(true);
    });

    it('should reject dependency on unknown step', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Test', depends_on: ['unknown_step'] },
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('depends on unknown step'))).toBe(true);
    });

    it('should reject self-dependency', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Test', depends_on: ['step1'] },
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('cannot depend on itself'))).toBe(true);
    });

    it('should reject non-array depends_on', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [
        {
          id: 'step1',
          type: StepType.OUTPUT,
          message: 'Test',
          depends_on: 'step2' as unknown as string[],
        },
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('must be an array'))).toBe(true);
    });
  });

  describe('detectCircularDependencies()', () => {
    it('should detect simple circular dependency', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Test', depends_on: ['step2'] },
        { id: 'step2', type: StepType.OUTPUT, message: 'Test', depends_on: ['step1'] },
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Circular dependency'))).toBe(true);
    });

    it('should detect complex circular dependency', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Test', depends_on: ['step2'] },
        { id: 'step2', type: StepType.OUTPUT, message: 'Test', depends_on: ['step3'] },
        { id: 'step3', type: StepType.OUTPUT, message: 'Test', depends_on: ['step1'] },
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Circular dependency'))).toBe(true);
    });

    it('should not report false positive for valid DAG', () => {
      const workflow = createMinimalWorkflow();
      workflow.steps = [
        { id: 'step1', type: StepType.OUTPUT, message: 'Test' },
        { id: 'step2', type: StepType.OUTPUT, message: 'Test', depends_on: ['step1'] },
        { id: 'step3', type: StepType.OUTPUT, message: 'Test', depends_on: ['step1', 'step2'] },
      ];

      const result = validator.validate(workflow);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateUIMetadata()', () => {
    it('should validate UI metadata with valid node references', () => {
      const workflow = createMinimalWorkflow();
      workflow.ui_metadata = {
        nodes: [
          {
            id: 'step1',
            position: { x: 100, y: 200 },
          },
        ],
        viewport: {
          zoom: 1.0,
          x: 0,
          y: 0,
        },
      };

      const result = validator.validate(workflow);

      expect(result.valid).toBe(true);
    });

    it('should reject node referencing unknown step', () => {
      const workflow = createMinimalWorkflow();
      workflow.ui_metadata = {
        nodes: [
          {
            id: 'unknown_step',
            position: { x: 100, y: 200 },
          },
        ],
        viewport: {
          zoom: 1.0,
          x: 0,
          y: 0,
        },
      };

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('references unknown step'))).toBe(true);
    });

    it('should reject node without position', () => {
      const workflow = createMinimalWorkflow();
      workflow.ui_metadata = {
        nodes: [
          {
            id: 'step1',
            position: {} as { x: number; y: number },
          },
        ],
        viewport: {
          zoom: 1.0,
          x: 0,
          y: 0,
        },
      };

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('missing valid position'))).toBe(true);
    });

    it('should reject invalid viewport zoom', () => {
      const workflow = createMinimalWorkflow();
      workflow.ui_metadata = {
        nodes: [],
        viewport: {
          zoom: -1,
          x: 0,
          y: 0,
        },
      };

      const result = validator.validate(workflow);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('zoom must be positive'))).toBe(true);
    });
  });
});
