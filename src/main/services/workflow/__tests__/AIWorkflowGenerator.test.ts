/**
 * AIWorkflowGenerator Tests
 * Wave 9.5.2: AI-Assisted Workflow Generation
 *
 * Tests AI workflow generation capabilities:
 * - Workflow generation from natural language
 * - Prompt construction
 * - YAML parsing and validation
 * - Error handling (Claude API, YAML parse, schema validation)
 * - Metadata tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIWorkflowGenerator } from '../AIWorkflowGenerator';
import type { AIService } from '../../AIService';

// Mock AIService
const createMockAIService = (): AIService => {
  return {
    sendMessage: vi.fn(),
    initialize: vi.fn(),
    streamMessage: vi.fn(),
    cancel: vi.fn(),
    getStatus: vi.fn(),
  } as unknown as AIService;
};

describe('AIWorkflowGenerator', () => {
  let generator: AIWorkflowGenerator;
  let mockAIService: AIService;

  beforeEach(() => {
    mockAIService = createMockAIService();
    generator = new AIWorkflowGenerator(mockAIService);
    vi.clearAllMocks();
  });

  describe('Successful Generation', () => {
    it('should generate valid workflow from description', async () => {
      const validYaml = `workflow:
  name: "Test Workflow"
  version: "1.0.0"
  description: "A test workflow"
inputs:
  - id: test_input
    type: string
    label: "Test Input"
    required: true
steps:
  - id: step1
    type: python
    label: "Test Step"
    script: "./scripts/test.py"
    inputs:
      test_param: "\${workflow.inputs.test_input}"`;

      vi.mocked(mockAIService.sendMessage).mockResolvedValue(validYaml);

      const result = await generator.generateWorkflow({
        description: 'Create a simple test workflow',
        projectType: 'General',
        language: 'Python',
      });

      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(result.workflow?.workflow?.name).toBe('Test Workflow');
      expect(result.yaml).toBe(validYaml);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.modelUsed).toBe('claude-sonnet-4-5-20250929');
      expect(result.metadata?.durationMs).toBeGreaterThan(0);
    });

    it('should handle Claude returning YAML with markdown code blocks', async () => {
      const yamlWithCodeBlocks = `\`\`\`yaml
workflow:
  name: "Test Workflow"
  version: "1.0.0"
  description: "A test workflow"
inputs:
  - id: test_input
    type: string
    label: "Test Input"
    required: true
steps:
  - id: step1
    type: python
    label: "Test Step"
    script: "./scripts/test.py"
ui_metadata:
  nodes:
    - id: step1
      position: { x: 100, y: 100 }
\`\`\``;

      vi.mocked(mockAIService.sendMessage).mockResolvedValue(yamlWithCodeBlocks);

      const result = await generator.generateWorkflow({
        description: 'Create a simple test workflow',
      });

      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(result.yaml).not.toContain('```');
    });

    it('should include generation metadata', async () => {
      const validYaml = `workflow:
  name: "Test Workflow"
  version: "1.0.0"
  description: "A test workflow"
inputs:
  - id: test_input
    type: string
    label: "Test Input"
    required: false
steps:
  - id: step1
    type: python
    label: "Test Step"
    script: "./scripts/test.py"
ui_metadata:
  nodes:
    - id: step1
      position: { x: 100, y: 100 }`;

      vi.mocked(mockAIService.sendMessage).mockResolvedValue(validYaml);

      const result = await generator.generateWorkflow({
        description: 'Create a workflow',
        projectType: 'Web',
        language: 'TypeScript',
      });

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.modelUsed).toBe('claude-sonnet-4-5-20250929');
      expect(result.metadata?.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('YAML Parsing Errors', () => {
    it('should handle invalid YAML syntax', async () => {
      const invalidYaml = `name: Test Workflow
description: Invalid
steps:
  - id: step1
    type: python
    invalid indentation here`;

      vi.mocked(mockAIService.sendMessage).mockResolvedValue(invalidYaml);

      const result = await generator.generateWorkflow({
        description: 'Create a workflow',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('yaml_parse');
      expect(result.error?.message).toContain('Failed to parse generated YAML');
    });

    it('should handle non-object YAML', async () => {
      const invalidYaml = `- just an array`;

      vi.mocked(mockAIService.sendMessage).mockResolvedValue(invalidYaml);

      const result = await generator.generateWorkflow({
        description: 'Create a workflow',
      });

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('yaml_parse');
    });
  });

  describe('Schema Validation Errors', () => {
    it('should handle missing required fields', async () => {
      const incompleteYaml = `workflow:
  name: "Test Workflow"
  version: "1.0.0"
  description: "Test"
inputs: []
steps:
  - id: step1
    type: python
ui_metadata:
  nodes:
    - id: step1
      position: { x: 100, y: 100 }`;

      vi.mocked(mockAIService.sendMessage).mockResolvedValue(incompleteYaml);

      const result = await generator.generateWorkflow({
        description: 'Create a workflow',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('schema_validation');
      expect(result.error?.validationErrors).toBeDefined();
      expect(result.error?.validationErrors!.length).toBeGreaterThan(0);
    });

    it('should handle invalid step types', async () => {
      const invalidStepYaml = `workflow:
  name: "Test Workflow"
  version: "1.0.0"
  description: "Test"
inputs:
  - id: test_input
    type: string
    label: "Test Input"
    required: false
steps:
  - id: step1
    type: python
    label: "Invalid Step"
ui_metadata:
  nodes:
    - id: step1
      position: { x: 100, y: 100 }`;

      vi.mocked(mockAIService.sendMessage).mockResolvedValue(invalidStepYaml);

      const result = await generator.generateWorkflow({
        description: 'Create a workflow',
      });

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('schema_validation');
    });
  });

  describe('Claude API Errors', () => {
    it('should handle Claude API failure', async () => {
      vi.mocked(mockAIService.sendMessage).mockRejectedValue(new Error('API rate limit exceeded'));

      const result = await generator.generateWorkflow({
        description: 'Create a workflow',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe('claude_api');
      expect(result.error?.message).toContain('Claude API error');
    });

    it('should handle network timeout', async () => {
      vi.mocked(mockAIService.sendMessage).mockRejectedValue(new Error('Network timeout'));

      const result = await generator.generateWorkflow({
        description: 'Create a workflow',
      });

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('unknown');
      expect(result.error?.message).toContain('Network timeout');
    });
  });

  describe('Prompt Construction', () => {
    it('should include description in prompt', async () => {
      const description = 'Create a workflow that processes CSV files';

      vi.mocked(mockAIService.sendMessage).mockResolvedValue(`workflow:
  name: "Test"
  version: "1.0.0"
  description: "Test"
inputs:
  - id: input1
    type: string
    label: "Input 1"
    required: false
steps:
  - id: step1
    type: python
    script: "./test.py"
ui_metadata:
  nodes:
    - id: step1
      position: { x: 100, y: 100 }`);

      await generator.generateWorkflow({ description });

      expect(mockAIService.sendMessage).toHaveBeenCalled();
      const promptCall = vi.mocked(mockAIService.sendMessage).mock.calls[0];
      expect(promptCall[0]).toContain(description);
    });

    it('should include project type in context', async () => {
      vi.mocked(mockAIService.sendMessage).mockResolvedValue(`workflow:
  name: "Test"
  version: "1.0.0"
  description: "Test"
inputs:
  - id: input1
    type: string
    label: "Input 1"
    required: false
steps:
  - id: step1
    type: python
    script: "./test.py"
ui_metadata:
  nodes:
    - id: step1
      position: { x: 100, y: 100 }`);

      await generator.generateWorkflow({
        description: 'Create a workflow',
        projectType: 'Web',
      });

      const promptCall = vi.mocked(mockAIService.sendMessage).mock.calls[0];
      expect(promptCall[0]).toContain('Project Type: Web');
    });

    it('should include language in context', async () => {
      vi.mocked(mockAIService.sendMessage).mockResolvedValue(`workflow:
  name: "Test"
  version: "1.0.0"
  description: "Test"
inputs:
  - id: input1
    type: string
    label: "Input 1"
    required: false
steps:
  - id: step1
    type: python
    script: "./test.py"
ui_metadata:
  nodes:
    - id: step1
      position: { x: 100, y: 100 }`);

      await generator.generateWorkflow({
        description: 'Create a workflow',
        language: 'TypeScript',
      });

      const promptCall = vi.mocked(mockAIService.sendMessage).mock.calls[0];
      expect(promptCall[0]).toContain('Programming Language: TypeScript');
    });

    it('should include workflow schema in prompt', async () => {
      vi.mocked(mockAIService.sendMessage).mockResolvedValue(`workflow:
  name: "Test"
  version: "1.0.0"
  description: "Test"
inputs:
  - id: input1
    type: string
    label: "Input 1"
    required: false
steps:
  - id: step1
    type: python
    script: "./test.py"
ui_metadata:
  nodes:
    - id: step1
      position: { x: 100, y: 100 }`);

      await generator.generateWorkflow({
        description: 'Create a workflow',
      });

      const promptCall = vi.mocked(mockAIService.sendMessage).mock.calls[0];
      expect(promptCall[0]).toContain('WORKFLOW SCHEMA');
      expect(promptCall[0]).toContain('AVAILABLE NODE TYPES');
      expect(promptCall[0]).toContain('VARIABLE SYNTAX');
    });

    it('should include examples in prompt', async () => {
      vi.mocked(mockAIService.sendMessage).mockResolvedValue(`workflow:
  name: "Test"
  version: "1.0.0"
  description: "Test"
inputs:
  - id: input1
    type: string
    label: "Input 1"
    required: false
steps:
  - id: step1
    type: python
    script: "./test.py"
ui_metadata:
  nodes:
    - id: step1
      position: { x: 100, y: 100 }`);

      await generator.generateWorkflow({
        description: 'Create a workflow',
      });

      const promptCall = vi.mocked(mockAIService.sendMessage).mock.calls[0];
      expect(promptCall[0]).toContain('EXAMPLE OUTPUT');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty workflow response', async () => {
      vi.mocked(mockAIService.sendMessage).mockResolvedValue('');

      const result = await generator.generateWorkflow({
        description: 'Create a workflow',
      });

      expect(result.success).toBe(false);
    });

    it('should handle very long descriptions', async () => {
      const longDescription = 'a'.repeat(10000);
      const validYaml = `workflow:
  name: "Test"
  version: "1.0.0"
  description: "Test"
inputs:
  - id: input1
    type: string
    label: "Input 1"
    required: false
steps:
  - id: s1
    type: python
    script: "./test.py"
ui_metadata:
  nodes:
    - id: s1
      position: { x: 100, y: 100 }`;

      vi.mocked(mockAIService.sendMessage).mockResolvedValue(validYaml);

      await generator.generateWorkflow({
        description: longDescription,
      });

      expect(mockAIService.sendMessage).toHaveBeenCalled();
      const promptCall = vi.mocked(mockAIService.sendMessage).mock.calls[0];
      expect(promptCall[0]).toContain(longDescription);
    });

    it('should return yaml even on validation failure', async () => {
      const incompleteYaml = `workflow:
  name: "Incomplete"
  version: "1.0.0"
  description: "Test"
inputs:
  - id: input1
    type: string
    label: "Input 1"
    required: false
steps:
  - id: step1
    type: python
    label: "Test Step"
ui_metadata:
  nodes:
    - id: step1
      position: { x: 100, y: 100 }`;

      vi.mocked(mockAIService.sendMessage).mockResolvedValue(incompleteYaml);

      const result = await generator.generateWorkflow({
        description: 'Create a workflow',
      });

      expect(result.success).toBe(false);
      expect(result.yaml).toBe(incompleteYaml);
      expect(result.error?.type).toBe('schema_validation');
    });
  });

  describe('Performance', () => {
    it('should complete generation within reasonable time', async () => {
      const validYaml = `workflow:
  name: "Test"
  version: "1.0.0"
  description: "Test workflow"
inputs:
  - id: input1
    type: string
    label: "Input 1"
    required: false
steps:
  - id: step1
    type: python
    label: "Test"
    script: "./test.py"
ui_metadata:
  nodes:
    - id: step1
      position: { x: 100, y: 100 }`;

      vi.mocked(mockAIService.sendMessage).mockResolvedValue(validYaml);

      const startTime = Date.now();
      const result = await generator.generateWorkflow({
        description: 'Create a workflow',
      });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // Mock should be very fast
      expect(result.metadata?.durationMs).toBeLessThan(100);
    });
  });
});
