/**
 * DryRunExecutor Service
 * Wave 9.5.3: Workflow Testing UI
 *
 * Provides mock execution capabilities for testing workflows without
 * executing real Python scripts, API calls, or file operations.
 *
 * Features:
 * - Smart mock data generation based on type and name heuristics
 * - Realistic execution timing (faster than real execution)
 * - Safe testing without side effects
 * - Reproducible results for consistent testing
 *
 * Mock Strategies:
 * 1. Type-based: Generate mock data based on TypeScript types
 * 2. Name-based: Use smart heuristics (email, url, path, count)
 * 3. Example-based: Use workflow input examples when available
 *
 * Usage:
 * const dryRunExecutor = new DryRunExecutor();
 * const result = dryRunExecutor.mockPythonExecution(step, inputs);
 */

import { logger } from '@main/logger';
import type { PythonStep, ClaudeStep } from '../../../shared/types';

/**
 * Dry run execution result
 */
export interface DryRunResult {
  /** Always true for successful mock execution */
  success: boolean;
  /** Generated mock outputs */
  outputs: Record<string, unknown>;
  /** Mock execution time in milliseconds (faster than real) */
  duration: number;
  /** Indicates this was a dry run */
  isDryRun: true;
  /** Optional mock operation log */
  mockLog?: string;
}

/**
 * DryRunExecutor Service
 *
 * Handles all mock execution for dry run mode.
 * Never executes real operations - all results are mocked.
 */
export class DryRunExecutor {
  private readonly SERVICE_NAME = 'DryRunExecutor';

  constructor() {
    logger.info(`[${this.SERVICE_NAME}] Initialized`);
  }

  /**
   * Mock Python script execution
   *
   * Instead of running script, generates mock outputs based on:
   * - Script name/path (e.g., "analyze_code" -> file analysis mock data)
   * - Input parameter names (e.g., "file_path" -> file-related mock data)
   * - Step label (e.g., "Process CSV" -> CSV-related mock data)
   *
   * @param step - Python step to mock
   * @param inputs - Resolved inputs (used for heuristics)
   * @returns Mock execution result
   */
  mockPythonExecution(step: PythonStep, inputs: Record<string, unknown>): DryRunResult {
    logger.debug(`[${this.SERVICE_NAME}] Mocking Python execution`, {
      stepId: step.id,
      script: step.script,
      inputKeys: Object.keys(inputs),
    });

    // Generate mock outputs based on script name and inputs
    const outputs = this.generateSmartMockData(step.script, step.label, inputs);

    // Simulate realistic execution time (0.1-1.0 seconds)
    const mockDuration = Math.floor(Math.random() * 900) + 100;

    logger.info(`[${this.SERVICE_NAME}] Python execution mocked successfully`, {
      stepId: step.id,
      mockDuration,
      outputKeys: Object.keys(outputs),
    });

    return {
      success: true,
      outputs,
      duration: mockDuration,
      isDryRun: true,
      mockLog: `[DRY RUN] Would execute: python3 ${step.script}`,
    };
  }

  /**
   * Mock Claude API call
   *
   * Instead of calling Claude API, generates mock response based on:
   * - Prompt content (heuristics from keywords)
   * - Step label
   * - Input data
   *
   * @param step - Claude step to mock
   * @param inputs - Resolved inputs
   * @returns Mock execution result
   */
  mockClaudeExecution(step: ClaudeStep, _inputs: Record<string, unknown>): DryRunResult {
    logger.debug(`[${this.SERVICE_NAME}] Mocking Claude API call`, {
      stepId: step.id,
      model: step.model,
      hasPrompt: !!step.prompt_template,
    });

    // Generate mock Claude response based on step context
    const mockResponse = this.generateMockClaudeResponse(step);

    // Claude API typically takes 1-5 seconds, mock at 0.5-2 seconds
    const mockDuration = Math.floor(Math.random() * 1500) + 500;

    logger.info(`[${this.SERVICE_NAME}] Claude API call mocked successfully`, {
      stepId: step.id,
      mockDuration,
      responseLength: mockResponse.length,
    });

    return {
      success: true,
      outputs: {
        response: mockResponse,
        model: step.model || 'claude-sonnet-4-5-20250929',
        usage: {
          input_tokens: Math.floor(Math.random() * 500) + 100,
          output_tokens: Math.floor(Math.random() * 1000) + 200,
        },
      },
      duration: mockDuration,
      isDryRun: true,
      mockLog: '[DRY RUN] Would call Claude API with prompt',
    };
  }

  /**
   * Mock file operation
   *
   * Instead of reading/writing files, logs operation and returns mock data.
   *
   * @param operation - read or write
   * @param path - File path
   * @param content - Content (for write operations)
   * @returns Mock execution result
   */
  mockFileOperation(operation: 'read' | 'write', path: string, content?: string): DryRunResult {
    logger.debug(`[${this.SERVICE_NAME}] Mocking file operation`, {
      operation,
      path,
      hasContent: !!content,
    });

    const outputs: Record<string, unknown> = {};

    if (operation === 'read') {
      // Mock file read - generate sample content based on file extension
      const mockContent = this.generateMockFileContent(path);
      outputs.content = mockContent;
      outputs.bytes = mockContent.length;
      outputs.encoding = 'utf-8';
    } else {
      // Mock file write - just log what would be written
      outputs.success = true;
      outputs.path = path;
      outputs.bytes = content?.length || 0;
    }

    const mockDuration = Math.floor(Math.random() * 100) + 10;

    logger.info(`[${this.SERVICE_NAME}] File operation mocked successfully`, {
      operation,
      path,
      mockDuration,
    });

    return {
      success: true,
      outputs,
      duration: mockDuration,
      isDryRun: true,
      mockLog: `[DRY RUN] Would ${operation} file: ${path}`,
    };
  }

  /**
   * Generate smart mock data based on script name, label, and inputs
   *
   * Uses heuristics to create realistic mock data:
   * - analyze/scan -> file/structure data
   * - generate/create -> content/output data
   * - process/transform -> transformed data
   * - validate/check -> validation results
   *
   * @param scriptPath - Path to Python script
   * @param label - Step label
   * @param inputs - Input parameters (for context)
   * @returns Generated mock outputs
   */
  private generateSmartMockData(
    scriptPath: string,
    label: string | undefined,
    inputs: Record<string, unknown>
  ): Record<string, unknown> {
    const scriptName = scriptPath.split('/').pop()?.toLowerCase() || '';
    const labelLower = label?.toLowerCase() || '';
    const combinedContext = `${scriptName} ${labelLower}`;

    // Analyze context to determine mock data type
    if (
      combinedContext.includes('analyze') ||
      combinedContext.includes('scan') ||
      combinedContext.includes('inspect')
    ) {
      return {
        files: Math.floor(Math.random() * 100) + 10,
        directories: Math.floor(Math.random() * 20) + 3,
        totalLines: Math.floor(Math.random() * 10000) + 1000,
        languages: ['TypeScript', 'Python', 'JavaScript'],
        structure: {
          src: ['main', 'renderer', 'preload'],
          tests: ['unit', 'integration'],
          docs: ['planning', 'architecture'],
        },
      };
    }

    if (
      combinedContext.includes('generate') ||
      combinedContext.includes('create') ||
      combinedContext.includes('build')
    ) {
      return {
        content: `# Mock Generated Content\n\nThis is mock content generated during dry run mode.\n\n## Details\nGenerated from: ${scriptName}\nInputs: ${JSON.stringify(Object.keys(inputs))}`,
        format: 'markdown',
        wordCount: Math.floor(Math.random() * 1000) + 200,
      };
    }

    if (
      combinedContext.includes('process') ||
      combinedContext.includes('transform') ||
      combinedContext.includes('convert')
    ) {
      return {
        processed: true,
        itemsProcessed: Math.floor(Math.random() * 100) + 10,
        transformedData: {
          inputType: typeof inputs,
          outputType: 'processed',
        },
      };
    }

    if (
      combinedContext.includes('validate') ||
      combinedContext.includes('check') ||
      combinedContext.includes('verify')
    ) {
      return {
        valid: Math.random() > 0.3, // 70% success rate
        errors: [],
        warnings: ['Mock warning: Dry run mode active'],
        checkedItems: Math.floor(Math.random() * 50) + 5,
      };
    }

    if (combinedContext.includes('test') || combinedContext.includes('lint')) {
      return {
        passed: Math.floor(Math.random() * 20) + 15,
        failed: Math.floor(Math.random() * 3),
        skipped: Math.floor(Math.random() * 2),
        duration: Math.floor(Math.random() * 5000) + 1000,
      };
    }

    // Default generic mock data
    return {
      result: 'success',
      message: 'Mock execution completed successfully (dry run mode)',
      data: this.generateMockDataFromInputs(inputs),
    };
  }

  /**
   * Generate mock data based on input parameter types and names
   */
  private generateMockDataFromInputs(inputs: Record<string, unknown>): Record<string, unknown> {
    const mockData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(inputs)) {
      // Generate mock output based on input name
      const outputKey = `${key}_processed`;
      mockData[outputKey] = this.generateMockValueByName(key, value);
    }

    return mockData;
  }

  /**
   * Generate mock value based on parameter name heuristics
   */
  private generateMockValueByName(name: string, originalValue: unknown): unknown {
    const nameLower = name.toLowerCase();

    // Email-related
    if (nameLower.includes('email')) {
      return 'test@example.com';
    }

    // URL-related
    if (nameLower.includes('url') || nameLower.includes('link')) {
      return 'https://example.com/mock-resource';
    }

    // Path-related
    if (
      nameLower.includes('path') ||
      nameLower.includes('file') ||
      nameLower.includes('directory')
    ) {
      return '/mock/path/to/resource';
    }

    // Count/number-related
    if (nameLower.includes('count') || nameLower.includes('number') || nameLower.includes('size')) {
      return Math.floor(Math.random() * 100) + 1;
    }

    // Name-related
    if (nameLower.includes('name') || nameLower.includes('title')) {
      return 'Mock Name';
    }

    // Boolean-related
    if (nameLower.includes('is') || nameLower.includes('has') || nameLower.includes('enabled')) {
      return Math.random() > 0.5;
    }

    // Date-related
    if (nameLower.includes('date') || nameLower.includes('time')) {
      return new Date().toISOString();
    }

    // Array-related
    if (Array.isArray(originalValue)) {
      return ['mock_item_1', 'mock_item_2', 'mock_item_3'];
    }

    // Object-related
    if (typeof originalValue === 'object' && originalValue !== null) {
      return { mock: true, processed: true };
    }

    // Default based on type
    if (typeof originalValue === 'string') {
      return 'mock_string_value';
    } else if (typeof originalValue === 'number') {
      return 42;
    } else if (typeof originalValue === 'boolean') {
      return true;
    } else if (typeof originalValue === 'object' && originalValue !== null) {
      return { mock: true };
    }

    return null;
  }

  /**
   * Generate mock Claude response based on step context
   */
  private generateMockClaudeResponse(step: ClaudeStep): string {
    const prompt = step.prompt_template?.toLowerCase() || '';
    const label = step.label?.toLowerCase() || '';
    const context = `${prompt} ${label}`;

    // Documentation generation
    if (context.includes('document') || context.includes('readme')) {
      return `# Mock Documentation

This is a mock documentation generated during dry run mode.

## Overview
Project analyzed successfully with mock data.

## Architecture
- Component-based structure
- TypeScript with strict mode
- Electron + React frontend

## API Reference
Mock API reference content here.

## Usage Examples
\`\`\`typescript
// Mock code example
const result = mockFunction();
\`\`\`

*Generated in dry run mode - this is mock content*`;
    }

    // Code review/analysis
    if (context.includes('review') || context.includes('analyze') || context.includes('audit')) {
      return `# Code Review Summary (Mock)

## Overall Assessment
✅ Code quality: Good (mock assessment)
⚠️ Minor issues found (mock findings)

## Findings
1. **Type Safety**: All files use TypeScript strict mode
2. **Testing**: Coverage could be improved
3. **Documentation**: Well documented

## Recommendations
- Add more unit tests
- Consider edge case handling
- Update documentation for recent changes

*This is a mock review generated in dry run mode*`;
    }

    // Content generation
    if (context.includes('generate') || context.includes('create') || context.includes('write')) {
      return `Mock Content Generated by Claude

This is sample content generated during dry run mode. In a real execution,
Claude would analyze the provided inputs and generate detailed, contextual content.

Key points:
- Content generated successfully (mock)
- Based on provided context
- Ready for review and refinement

*Generated in dry run mode*`;
    }

    // Q&A / explanation
    if (context.includes('explain') || context.includes('question') || context.includes('answer')) {
      return `Mock Explanation

This is a mock explanation provided during dry run mode. In a real execution,
Claude would provide a detailed answer based on the specific question and context.

The explanation would include:
- Clear explanations of concepts
- Relevant examples
- Step-by-step breakdowns

*This is mock content for testing purposes*`;
    }

    // Default generic response
    return `Mock Claude Response

This is a mock response generated during dry run mode. The actual Claude API
call was not made. In real execution, Claude would process the prompt:

"${step.prompt_template?.substring(0, 100) || 'No prompt provided'}..."

And provide a detailed, contextual response based on the specific request.

*Dry run mode active - no real API call made*`;
  }

  /**
   * Generate mock file content based on file extension
   */
  private generateMockFileContent(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'md':
      case 'markdown':
        return '# Mock File Content\n\nThis is mock markdown content generated during dry run mode.\n';

      case 'json':
        return JSON.stringify({ mock: true, content: 'Mock JSON data' }, null, 2);

      case 'txt':
        return 'Mock text file content.\nGenerated during dry run mode.\n';

      case 'py':
        return '# Mock Python file\ndef mock_function():\n    return "mock"\n';

      case 'ts':
      case 'tsx':
        return '// Mock TypeScript file\nexport const mockValue = "mock";\n';

      case 'js':
      case 'jsx':
        return '// Mock JavaScript file\nexport const mockValue = "mock";\n';

      default:
        return 'Mock file content (binary/unknown type)';
    }
  }
}
