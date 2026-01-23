/**
 * YamlParser.test.ts
 * Unit tests for YAML workflow parser
 *
 * Tests cover:
 * - Valid YAML parsing
 * - Round-trip fidelity
 * - Error handling (invalid YAML, dangerous tags, size limits)
 * - Performance benchmarks
 * - Security validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { YamlParser } from '../YamlParser';
import type { Workflow } from '../../../../shared/types';
import { StepType } from '../../../../shared/types';

describe('YamlParser', () => {
  let parser: YamlParser;

  beforeEach(() => {
    parser = new YamlParser();
  });

  describe('parse()', () => {
    it('should parse valid workflow YAML', () => {
      const yamlContent = `
workflow:
  name: "Test Workflow"
  version: "1.0.0"
  description: "A test workflow"

inputs:
  - id: repo_path
    type: file
    label: "Repository Path"
    required: true

steps:
  - id: analyze
    type: python
    script: ./analyze.py
    outputs:
      - structure
`;

      const result = parser.parse(yamlContent);

      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(result.workflow?.workflow.name).toBe('Test Workflow');
      expect(result.workflow?.workflow.version).toBe('1.0.0');
      expect(result.workflow?.inputs).toHaveLength(1);
      expect(result.workflow?.steps).toHaveLength(1);
    });

    it('should parse workflow with multiple steps', () => {
      const yamlContent = `
workflow:
  name: "Multi-step Workflow"
  version: "1.0.0"
  description: "Workflow with multiple steps"

inputs: []

steps:
  - id: step1
    type: python
    script: ./step1.py
  - id: step2
    type: claude
    model: "claude-sonnet-4"
    prompt_template: "Generate docs"
  - id: step3
    type: output
    message: "Done"
`;

      const result = parser.parse(yamlContent);

      expect(result.success).toBe(true);
      expect(result.workflow?.steps).toHaveLength(3);
      expect(result.workflow?.steps[0]?.id).toBe('step1');
      expect(result.workflow?.steps[1]?.id).toBe('step2');
      expect(result.workflow?.steps[2]?.id).toBe('step3');
    });

    it('should parse workflow with UI metadata', () => {
      const yamlContent = `
workflow:
  name: "Visual Workflow"
  version: "1.0.0"
  description: "Workflow with visual metadata"

inputs: []

steps:
  - id: node1
    type: output
    message: "Test"

ui_metadata:
  nodes:
    - id: node1
      position:
        x: 100
        y: 200
      width: 300
      height: 80
  viewport:
    zoom: 1.5
    x: 0
    y: 0
`;

      const result = parser.parse(yamlContent);

      expect(result.success).toBe(true);
      expect(result.workflow?.ui_metadata).toBeDefined();
      expect(result.workflow?.ui_metadata?.nodes).toHaveLength(1);
      expect(result.workflow?.ui_metadata?.nodes[0]?.position.x).toBe(100);
      expect(result.workflow?.ui_metadata?.viewport.zoom).toBe(1.5);
    });

    it('should reject YAML with dangerous tags', () => {
      const yamlContent = `
workflow:
  name: !!python/object "malicious"
  version: "1.0.0"
  description: "Test"

inputs: []
steps: []
`;

      const result = parser.parse(yamlContent);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('dangerous tags');
    });

    it('should reject YAML exceeding size limit', () => {
      const largeYaml = `workflow:\n  name: "Test"\n  version: "1.0.0"\n  description: "${'x'.repeat(2000000)}"`;

      const result = parser.parse(largeYaml, { maxFileSize: 1024 * 1024 }); // 1MB limit

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('exceeds maximum size');
    });

    it('should reject invalid YAML syntax', () => {
      const invalidYaml = `
workflow:
  name: "Test"
  version: "1.0.0"
  description: "Test"

inputs: [
steps: []
`;

      const result = parser.parse(invalidYaml);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('parse error');
    });

    it('should reject YAML without workflow section', () => {
      const yamlContent = `
inputs: []
steps: []
`;

      const result = parser.parse(yamlContent);

      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('workflow');
      expect(result.error?.message).toContain('Missing required "workflow" metadata');
    });

    it('should reject YAML without inputs array', () => {
      const yamlContent = `
workflow:
  name: "Test"
  version: "1.0.0"
  description: "Test"

steps: []
`;

      const result = parser.parse(yamlContent);

      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('inputs');
    });

    it('should reject YAML without steps array', () => {
      const yamlContent = `
workflow:
  name: "Test"
  version: "1.0.0"
  description: "Test"

inputs: []
`;

      const result = parser.parse(yamlContent);

      expect(result.success).toBe(false);
      expect(result.error?.field).toBe('steps');
    });

    it('should reject non-object YAML', () => {
      const yamlContent = `["array", "of", "strings"]`;

      const result = parser.parse(yamlContent);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('workflow');
    });

    it('should parse workflow within 200ms for typical size', () => {
      const yamlContent = `
workflow:
  name: "Performance Test"
  version: "1.0.0"
  description: "Test workflow with 15 steps"

inputs:
  - id: input1
    type: string
    label: "Input 1"
    required: true

steps:
${Array.from(
  { length: 15 },
  (_, i) => `  - id: step${i + 1}
    type: python
    script: ./step${i + 1}.py`
).join('\n')}
`;

      const start = Date.now();
      const result = parser.parse(yamlContent);
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(200); // ADR-017 performance requirement
    });
  });

  describe('serialize()', () => {
    it('should serialize workflow to YAML', () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Test Workflow',
          version: '1.0.0',
          description: 'A test workflow',
        },
        inputs: [
          {
            id: 'test_input',
            type: 'string',
            label: 'Test Input',
            required: true,
          },
        ],
        steps: [
          {
            id: 'test_step',
            type: StepType.OUTPUT,
            message: 'Hello World',
          },
        ],
      };

      const yamlString = parser.serialize(workflow);

      expect(yamlString).toContain('name: Test Workflow');
      expect(yamlString).toContain('version: 1.0.0');
      expect(yamlString).toContain('test_input');
      expect(yamlString).toContain('test_step');
    });

    it('should serialize workflow with custom indentation', () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Test',
          version: '1.0.0',
          description: 'Test',
        },
        inputs: [],
        steps: [],
      };

      const yamlString = parser.serialize(workflow, { indent: 4 });

      // Check for 4-space indentation
      const lines = yamlString.split('\n');
      const indentedLine = lines.find((line) => line.startsWith('    '));
      expect(indentedLine).toBeDefined();
    });

    it('should serialize and preserve field order', () => {
      const workflow: Workflow = {
        workflow: {
          name: 'Test',
          version: '1.0.0',
          description: 'Test',
        },
        inputs: [],
        steps: [],
      };

      const yamlString = parser.serialize(workflow);
      const lines = yamlString.split('\n').filter((l) => l.trim());

      // Workflow section should come before inputs and steps
      const workflowIndex = lines.findIndex((l) => l.includes('workflow:'));
      const inputsIndex = lines.findIndex((l) => l.includes('inputs:'));
      const stepsIndex = lines.findIndex((l) => l.includes('steps:'));

      expect(workflowIndex).toBeLessThan(inputsIndex);
      expect(inputsIndex).toBeLessThan(stepsIndex);
    });
  });

  describe('validateRoundTrip()', () => {
    it('should maintain semantic equivalence in round-trip', () => {
      const originalYaml = `
workflow:
  name: "Round Trip Test"
  version: "1.0.0"
  description: "Test round-trip fidelity"

inputs:
  - id: test_input
    type: string
    label: "Test"
    required: true

steps:
  - id: test_step
    type: output
    message: "Test message"
`;

      const isEquivalent = parser.validateRoundTrip(originalYaml);

      expect(isEquivalent).toBe(true);
    });

    it('should handle round-trip for complex workflow', () => {
      const originalYaml = `
workflow:
  name: "Complex Workflow"
  version: "2.1.3"
  description: "Complex workflow with multiple features"
  tags:
    - testing
    - automation

inputs:
  - id: input1
    type: string
    label: "Input 1"
    required: true
  - id: input2
    type: number
    label: "Input 2"
    required: false
    default: 42

steps:
  - id: step1
    type: python
    script: ./script.py
    depends_on: []
  - id: step2
    type: claude
    model: "claude-sonnet-4"
    prompt_template: "Test"
    depends_on:
      - step1

ui_metadata:
  nodes:
    - id: step1
      position:
        x: 100
        y: 100
    - id: step2
      position:
        x: 400
        y: 100
  viewport:
    zoom: 1.0
    x: 0
    y: 0
`;

      const isEquivalent = parser.validateRoundTrip(originalYaml);

      expect(isEquivalent).toBe(true);
    });

    it('should return false for invalid YAML', () => {
      const invalidYaml = `invalid: yaml: syntax:`;

      const isEquivalent = parser.validateRoundTrip(invalidYaml);

      expect(isEquivalent).toBe(false);
    });
  });

  describe('Security', () => {
    it('should reject !!python/object tags', () => {
      const maliciousYaml = `
workflow:
  name: !!python/object "malicious"
  version: "1.0.0"
  description: "Test"
inputs: []
steps: []
`;

      const result = parser.parse(maliciousYaml);

      expect(result.success).toBe(false);
    });

    it('should reject !!js/function tags', () => {
      const maliciousYaml = `
workflow:
  name: "Test"
  version: !!js/function "() => { alert('xss'); }"
  description: "Test"
inputs: []
steps: []
`;

      const result = parser.parse(maliciousYaml);

      expect(result.success).toBe(false);
    });

    it('should reject !!java/object tags', () => {
      const maliciousYaml = `
workflow:
  name: !!java/object "malicious"
  version: "1.0.0"
  description: "Test"
inputs: []
steps: []
`;

      const result = parser.parse(maliciousYaml);

      expect(result.success).toBe(false);
    });
  });
});
