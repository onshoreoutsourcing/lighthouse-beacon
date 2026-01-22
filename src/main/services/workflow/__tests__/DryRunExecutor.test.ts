/**
 * DryRunExecutor Unit Tests
 * Wave 9.5.3: Workflow Testing UI
 *
 * Tests for mock execution capabilities:
 * - Python script execution mocking
 * - Claude API call mocking
 * - File operation mocking
 * - Smart mock data generation (type, name, context-based)
 * - Mock timing simulation
 *
 * Coverage Target: ≥90%
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DryRunExecutor } from '../DryRunExecutor';
import type { PythonStep, ClaudeStep } from '../../../../shared/types';

describe('DryRunExecutor', () => {
  let executor: DryRunExecutor;

  beforeEach(() => {
    executor = new DryRunExecutor();
  });

  describe('Constructor', () => {
    it('should create executor instance', () => {
      expect(executor).toBeDefined();
      expect(executor).toBeInstanceOf(DryRunExecutor);
    });
  });

  describe('mockPythonExecution', () => {
    it('should mock Python execution with success', () => {
      const step: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Test Python Step',
        script: './scripts/test.py',
      };

      const inputs = { input1: 'test_value' };

      const result = executor.mockPythonExecution(step, inputs);

      expect(result.success).toBe(true);
      expect(result.isDryRun).toBe(true);
      expect(result.outputs).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
      expect(result.duration).toBeLessThan(1000); // Mock should be < 1 second
      expect(result.mockLog).toContain('DRY RUN');
      expect(result.mockLog).toContain('test.py');
    });

    it('should generate mock data based on script name context (analyze)', () => {
      const step: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Analyze Code',
        script: './scripts/analyze_code.py',
      };

      const result = executor.mockPythonExecution(step, {});

      expect(result.outputs).toHaveProperty('files');
      expect(result.outputs).toHaveProperty('directories');
      expect(result.outputs).toHaveProperty('totalLines');
      expect(result.outputs).toHaveProperty('languages');
      expect(result.outputs).toHaveProperty('structure');
      expect(Array.isArray(result.outputs.languages)).toBe(true);
    });

    it('should generate mock data based on script name context (generate)', () => {
      const step: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Generate Report',
        script: './scripts/generate_report.py',
      };

      const result = executor.mockPythonExecution(step, {});

      expect(result.outputs).toHaveProperty('content');
      expect(result.outputs).toHaveProperty('format');
      expect(result.outputs).toHaveProperty('wordCount');
      expect(typeof result.outputs.content).toBe('string');
      expect(result.outputs.format).toBe('markdown');
    });

    it('should generate mock data based on script name context (process)', () => {
      const step: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Process Data',
        script: './scripts/process_data.py',
      };

      const result = executor.mockPythonExecution(step, {});

      expect(result.outputs).toHaveProperty('processed');
      expect(result.outputs).toHaveProperty('itemsProcessed');
      expect(result.outputs).toHaveProperty('transformedData');
      expect(result.outputs.processed).toBe(true);
    });

    it('should generate mock data based on script name context (validate)', () => {
      const step: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Validate Config',
        script: './scripts/validate_config.py',
      };

      const result = executor.mockPythonExecution(step, {});

      expect(result.outputs).toHaveProperty('valid');
      expect(result.outputs).toHaveProperty('errors');
      expect(result.outputs).toHaveProperty('warnings');
      expect(result.outputs).toHaveProperty('checkedItems');
      expect(Array.isArray(result.outputs.errors)).toBe(true);
      expect(Array.isArray(result.outputs.warnings)).toBe(true);
    });

    it('should generate mock data based on script name context (test)', () => {
      const step: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Run Tests',
        script: './scripts/test_runner.py',
      };

      const result = executor.mockPythonExecution(step, {});

      expect(result.outputs).toHaveProperty('passed');
      expect(result.outputs).toHaveProperty('failed');
      expect(result.outputs).toHaveProperty('skipped');
      expect(result.outputs).toHaveProperty('duration');
      expect(typeof result.outputs.passed).toBe('number');
      expect(typeof result.outputs.failed).toBe('number');
    });

    it('should generate default mock data for unknown contexts', () => {
      const step: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Unknown Operation',
        script: './scripts/unknown.py',
      };

      const result = executor.mockPythonExecution(step, {});

      expect(result.outputs).toHaveProperty('result');
      expect(result.outputs).toHaveProperty('message');
      expect(result.outputs).toHaveProperty('data');
      expect(result.outputs.result).toBe('success');
    });

    it('should generate mock data based on input names (email)', () => {
      const step: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Handle User',
        script: './scripts/handle_user.py',
      };

      const inputs = { user_email: 'test@example.com' };

      const result = executor.mockPythonExecution(step, inputs);

      expect(result.outputs.data).toHaveProperty('user_email_processed');
      expect(result.outputs.data.user_email_processed).toBe('test@example.com');
    });

    it('should generate mock data based on input names (url)', () => {
      const step: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Fetch Data',
        script: './scripts/fetch.py',
      };

      const inputs = { api_url: 'https://api.example.com' };

      const result = executor.mockPythonExecution(step, inputs);

      expect(result.outputs.data).toHaveProperty('api_url_processed');
      expect(result.outputs.data.api_url_processed).toContain('https://example.com');
    });

    it('should generate mock data based on input names (path)', () => {
      const step: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Read File',
        script: './scripts/read.py',
      };

      const inputs = { file_path: '/path/to/file.txt' };

      const result = executor.mockPythonExecution(step, inputs);

      expect(result.outputs.data).toHaveProperty('file_path_processed');
      expect(result.outputs.data.file_path_processed).toContain('/mock/path');
    });

    it('should generate mock data based on input names (count)', () => {
      const step: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Count Items',
        script: './scripts/count.py',
      };

      const inputs = { item_count: 10 };

      const result = executor.mockPythonExecution(step, inputs);

      expect(result.outputs.data).toHaveProperty('item_count_processed');
      expect(typeof result.outputs.data.item_count_processed).toBe('number');
      expect(result.outputs.data.item_count_processed).toBeGreaterThan(0);
    });

    it('should handle array inputs', () => {
      const step: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Handle List',
        script: './scripts/handle_list.py',
      };

      const inputs = { items: ['a', 'b', 'c'] };

      const result = executor.mockPythonExecution(step, inputs);

      expect(result.outputs.data).toHaveProperty('items_processed');
      expect(Array.isArray(result.outputs.data.items_processed)).toBe(true);
    });

    it('should handle object inputs', () => {
      const step: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Handle Config',
        script: './scripts/handle_config.py',
      };

      const inputs = { config: { key: 'value' } };

      const result = executor.mockPythonExecution(step, inputs);

      expect(result.outputs.data).toHaveProperty('config_processed');
      expect(typeof result.outputs.data.config_processed).toBe('object');
      expect(result.outputs.data.config_processed).toHaveProperty('mock');
      expect(result.outputs.data.config_processed).toHaveProperty('processed');
    });

    it('should generate realistic execution times', () => {
      const step: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Test Step',
        script: './scripts/test.py',
      };

      const result = executor.mockPythonExecution(step, {});

      // Mock Python execution should be between 0.1-1.0 seconds
      expect(result.duration).toBeGreaterThanOrEqual(100);
      expect(result.duration).toBeLessThanOrEqual(1000);
    });
  });

  describe('mockClaudeExecution', () => {
    it('should mock Claude API call with success', () => {
      const step: ClaudeStep = {
        id: 'step1',
        type: 'claude',
        label: 'Generate Documentation',
        prompt_template: 'Generate documentation for {{code}}',
      };

      const inputs = { code: 'function test() {}' };

      const result = executor.mockClaudeExecution(step, inputs);

      expect(result.success).toBe(true);
      expect(result.isDryRun).toBe(true);
      expect(result.outputs).toHaveProperty('response');
      expect(result.outputs).toHaveProperty('model');
      expect(result.outputs).toHaveProperty('usage');
      expect(typeof result.outputs.response).toBe('string');
      expect(result.mockLog).toContain('DRY RUN');
      expect(result.mockLog).toContain('Claude API');
    });

    it('should generate mock response based on prompt context (documentation)', () => {
      const step: ClaudeStep = {
        id: 'step1',
        type: 'claude',
        label: 'Generate README',
        prompt_template: 'Write documentation about {{project}}',
      };

      const result = executor.mockClaudeExecution(step, {});

      expect(result.outputs.response).toContain('Mock Documentation');
      expect(result.outputs.response).toContain('Overview');
      expect(result.outputs.response).toContain('Architecture');
    });

    it('should generate mock response based on prompt context (review)', () => {
      const step: ClaudeStep = {
        id: 'step1',
        type: 'claude',
        label: 'Review Code',
        prompt_template: 'Review this code: {{code}}',
      };

      const result = executor.mockClaudeExecution(step, {});

      expect(result.outputs.response).toContain('Code Review Summary');
      expect(result.outputs.response).toContain('Assessment');
      expect(result.outputs.response).toContain('Findings');
      expect(result.outputs.response).toContain('Recommendations');
    });

    it('should generate mock response based on prompt context (generate)', () => {
      const step: ClaudeStep = {
        id: 'step1',
        type: 'claude',
        label: 'Generate Content',
        prompt_template: 'Create content about {{topic}}',
      };

      const result = executor.mockClaudeExecution(step, {});

      expect(result.outputs.response).toContain('Mock Content Generated');
      expect(result.outputs.response).toContain('dry run mode');
    });

    it('should generate mock response based on prompt context (explain)', () => {
      const step: ClaudeStep = {
        id: 'step1',
        type: 'claude',
        label: 'Explain Concept',
        prompt_template: 'Explain {{concept}}',
      };

      const result = executor.mockClaudeExecution(step, {});

      expect(result.outputs.response).toContain('Mock Explanation');
      expect(result.outputs.response).toContain('explanation');
    });

    it('should generate default mock response for unknown contexts', () => {
      const step: ClaudeStep = {
        id: 'step1',
        type: 'claude',
        label: 'Unknown Task',
        prompt_template: 'Do something with {{input}}',
      };

      const result = executor.mockClaudeExecution(step, {});

      expect(result.outputs.response).toContain('Mock Claude Response');
      expect(result.outputs.response).toContain('dry run mode');
    });

    it('should include mock token usage', () => {
      const step: ClaudeStep = {
        id: 'step1',
        type: 'claude',
        label: 'Test Step',
        prompt_template: 'Test prompt',
      };

      const result = executor.mockClaudeExecution(step, {});

      expect(result.outputs.usage).toHaveProperty('input_tokens');
      expect(result.outputs.usage).toHaveProperty('output_tokens');
      expect(typeof result.outputs.usage.input_tokens).toBe('number');
      expect(typeof result.outputs.usage.output_tokens).toBe('number');
      expect(result.outputs.usage.input_tokens).toBeGreaterThan(0);
      expect(result.outputs.usage.output_tokens).toBeGreaterThan(0);
    });

    it('should include model information', () => {
      const step: ClaudeStep = {
        id: 'step1',
        type: 'claude',
        label: 'Test Step',
        prompt_template: 'Test prompt',
        model: 'claude-sonnet-4-5-20250929',
      };

      const result = executor.mockClaudeExecution(step, {});

      expect(result.outputs.model).toBe('claude-sonnet-4-5-20250929');
    });

    it('should use default model when not specified', () => {
      const step: ClaudeStep = {
        id: 'step1',
        type: 'claude',
        label: 'Test Step',
        prompt_template: 'Test prompt',
      };

      const result = executor.mockClaudeExecution(step, {});

      expect(result.outputs.model).toBe('claude-sonnet-4-5-20250929');
    });

    it('should generate realistic execution times', () => {
      const step: ClaudeStep = {
        id: 'step1',
        type: 'claude',
        label: 'Test Step',
        prompt_template: 'Test prompt',
      };

      const result = executor.mockClaudeExecution(step, {});

      // Mock Claude API should be between 0.5-2.0 seconds
      expect(result.duration).toBeGreaterThanOrEqual(500);
      expect(result.duration).toBeLessThanOrEqual(2000);
    });
  });

  describe('mockFileOperation', () => {
    it('should mock file read operation', () => {
      const result = executor.mockFileOperation('read', '/path/to/file.txt');

      expect(result.success).toBe(true);
      expect(result.isDryRun).toBe(true);
      expect(result.outputs).toHaveProperty('content');
      expect(result.outputs).toHaveProperty('bytes');
      expect(result.outputs).toHaveProperty('encoding');
      expect(typeof result.outputs.content).toBe('string');
      expect(result.outputs.encoding).toBe('utf-8');
      expect(result.mockLog).toContain('DRY RUN');
      expect(result.mockLog).toContain('read');
      expect(result.mockLog).toContain('/path/to/file.txt');
    });

    it('should mock file write operation', () => {
      const result = executor.mockFileOperation('write', '/path/to/file.txt', 'test content');

      expect(result.success).toBe(true);
      expect(result.isDryRun).toBe(true);
      expect(result.outputs).toHaveProperty('success');
      expect(result.outputs).toHaveProperty('path');
      expect(result.outputs).toHaveProperty('bytes');
      expect(result.outputs.success).toBe(true);
      expect(result.outputs.path).toBe('/path/to/file.txt');
      expect(result.outputs.bytes).toBe('test content'.length);
      expect(result.mockLog).toContain('write');
    });

    it('should generate markdown content for .md files', () => {
      const result = executor.mockFileOperation('read', '/path/to/file.md');

      expect(result.outputs.content).toContain('# Mock File Content');
      expect(result.outputs.content).toContain('mock markdown content');
    });

    it('should generate JSON content for .json files', () => {
      const result = executor.mockFileOperation('read', '/path/to/file.json');

      const parsedContent = JSON.parse(result.outputs.content as string);
      expect(parsedContent).toHaveProperty('mock');
      expect(parsedContent).toHaveProperty('content');
      expect(parsedContent.mock).toBe(true);
    });

    it('should generate Python content for .py files', () => {
      const result = executor.mockFileOperation('read', '/path/to/script.py');

      expect(result.outputs.content).toContain('# Mock Python file');
      expect(result.outputs.content).toContain('def mock_function()');
    });

    it('should generate TypeScript content for .ts files', () => {
      const result = executor.mockFileOperation('read', '/path/to/file.ts');

      expect(result.outputs.content).toContain('// Mock TypeScript file');
      expect(result.outputs.content).toContain('export const mockValue');
    });

    it('should generate JavaScript content for .js files', () => {
      const result = executor.mockFileOperation('read', '/path/to/file.js');

      expect(result.outputs.content).toContain('// Mock JavaScript file');
      expect(result.outputs.content).toContain('export const mockValue');
    });

    it('should generate generic content for unknown file types', () => {
      const result = executor.mockFileOperation('read', '/path/to/file.xyz');

      expect(result.outputs.content).toContain('Mock file content');
      expect(result.outputs.content).toContain('binary/unknown type');
    });

    it('should generate realistic execution times', () => {
      const result = executor.mockFileOperation('read', '/path/to/file.txt');

      // Mock file operations should be between 10-100ms
      expect(result.duration).toBeGreaterThanOrEqual(10);
      expect(result.duration).toBeLessThanOrEqual(110);
    });

    it('should calculate bytes correctly for write operations', () => {
      const content = 'This is a test file with some content';
      const result = executor.mockFileOperation('write', '/path/to/file.txt', content);

      expect(result.outputs.bytes).toBe(content.length);
    });

    it('should handle write operations without content', () => {
      const result = executor.mockFileOperation('write', '/path/to/file.txt');

      expect(result.outputs.bytes).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should execute Python mocking quickly (< 100ms)', () => {
      const step: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Test Step',
        script: './test.py',
      };

      const start = Date.now();
      executor.mockPythonExecution(step, {});
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it('should execute Claude mocking quickly (< 100ms)', () => {
      const step: ClaudeStep = {
        id: 'step1',
        type: 'claude',
        label: 'Test Step',
        prompt_template: 'Test',
      };

      const start = Date.now();
      executor.mockClaudeExecution(step, {});
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });

    it('should execute file operation mocking quickly (< 100ms)', () => {
      const start = Date.now();
      executor.mockFileOperation('read', '/test.txt');
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Consistency', () => {
    it('should always return isDryRun: true', () => {
      const pythonStep: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Test',
        script: './test.py',
      };

      const claudeStep: ClaudeStep = {
        id: 'step2',
        type: 'claude',
        label: 'Test',
        prompt_template: 'Test',
      };

      const pythonResult = executor.mockPythonExecution(pythonStep, {});
      const claudeResult = executor.mockClaudeExecution(claudeStep, {});
      const fileResult = executor.mockFileOperation('read', '/test.txt');

      expect(pythonResult.isDryRun).toBe(true);
      expect(claudeResult.isDryRun).toBe(true);
      expect(fileResult.isDryRun).toBe(true);
    });

    it('should always return success: true', () => {
      const pythonStep: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Test',
        script: './test.py',
      };

      const claudeStep: ClaudeStep = {
        id: 'step2',
        type: 'claude',
        label: 'Test',
        prompt_template: 'Test',
      };

      const pythonResult = executor.mockPythonExecution(pythonStep, {});
      const claudeResult = executor.mockClaudeExecution(claudeStep, {});
      const fileResult = executor.mockFileOperation('read', '/test.txt');

      expect(pythonResult.success).toBe(true);
      expect(claudeResult.success).toBe(true);
      expect(fileResult.success).toBe(true);
    });

    it('should always include mock log messages', () => {
      const pythonStep: PythonStep = {
        id: 'step1',
        type: 'python',
        label: 'Test',
        script: './test.py',
      };

      const claudeStep: ClaudeStep = {
        id: 'step2',
        type: 'claude',
        label: 'Test',
        prompt_template: 'Test',
      };

      const pythonResult = executor.mockPythonExecution(pythonStep, {});
      const claudeResult = executor.mockClaudeExecution(claudeStep, {});
      const fileResult = executor.mockFileOperation('read', '/test.txt');

      expect(pythonResult.mockLog).toBeDefined();
      expect(claudeResult.mockLog).toBeDefined();
      expect(fileResult.mockLog).toBeDefined();
      expect(pythonResult.mockLog).toContain('[DRY RUN]');
      expect(claudeResult.mockLog).toContain('[DRY RUN]');
      expect(fileResult.mockLog).toContain('[DRY RUN]');
    });
  });
});
