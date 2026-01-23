/**
 * AIWorkflowGenerator.ts
 * AI-assisted workflow generation using Claude
 *
 * Part of Wave 9.5.2: AI-Assisted Workflow Generation
 * Converts natural language descriptions into valid YAML workflows.
 *
 * Features:
 * - Claude API integration via AIService
 * - Optimized prompt engineering for workflow generation
 * - YAML parsing and validation
 * - Error handling with actionable feedback
 * - Support for common use cases (documentation, testing, deployment)
 *
 * Success Rate Target: ≥80% for common use cases
 * Performance Target: <10 seconds per generation
 */

import type { AIService } from '../AIService';
import { YamlParser } from './YamlParser';
import { WorkflowValidator } from './WorkflowValidator';
import type { Workflow, ValidationError } from '@shared/types';
import { logger } from '@main/logger';

/**
 * Generation request context
 */
export interface GenerationContext {
  /** Natural language description of desired workflow */
  description: string;
  /** Optional project type (e.g., "web", "cli", "api") */
  projectType?: string;
  /** Optional programming language (e.g., "python", "typescript") */
  language?: string;
  /** Optional model override */
  model?: string;
}

/**
 * Generation result
 */
export interface GenerationResult {
  /** Whether generation succeeded */
  success: boolean;
  /** Generated workflow (if successful) */
  workflow?: Workflow;
  /** Generated YAML string (for preview/editing) */
  yaml?: string;
  /** Error details (if failed) */
  error?: {
    type: 'claude_api' | 'yaml_parse' | 'schema_validation' | 'unknown';
    message: string;
    details?: string;
    validationErrors?: ValidationError[];
  };
  /** Generation metadata */
  metadata?: {
    modelUsed: string;
    tokensUsed?: number;
    durationMs: number;
  };
}

/**
 * AIWorkflowGenerator Service
 *
 * Generates workflows from natural language descriptions using Claude AI.
 * Handles prompt construction, API communication, parsing, and validation.
 */
export class AIWorkflowGenerator {
  private readonly SERVICE_NAME = 'AIWorkflowGenerator';
  private yamlParser: YamlParser;
  private workflowValidator: WorkflowValidator;

  constructor(private aiService: AIService) {
    this.yamlParser = new YamlParser();
    this.workflowValidator = new WorkflowValidator();
  }

  /**
   * Generate workflow from natural language description
   *
   * @param context - Generation context with description and optional metadata
   * @returns Generation result with workflow or error
   */
  async generateWorkflow(context: GenerationContext): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      logger.info(`[${this.SERVICE_NAME}] Starting workflow generation`, {
        descriptionLength: context.description.length,
        projectType: context.projectType,
        language: context.language,
      });

      // Step 1: Construct prompt
      const prompt = this.constructPrompt(context);

      // Step 2: Call Claude API
      const claudeResponse = await this.callClaude(prompt, context.model);

      // Step 3: Parse YAML
      const parseResult = this.yamlParser.parse(claudeResponse);

      if (!parseResult.success || !parseResult.workflow) {
        logger.error(`[${this.SERVICE_NAME}] YAML parsing failed`, {
          error: parseResult.error,
        });

        return {
          success: false,
          error: {
            type: 'yaml_parse',
            message: 'Failed to parse generated YAML',
            details: parseResult.error?.message,
            validationErrors: parseResult.error ? [parseResult.error] : undefined,
          },
          metadata: {
            modelUsed: context.model || 'claude-sonnet-4-5-20250929',
            durationMs: Date.now() - startTime,
          },
        };
      }

      // Step 4: Validate workflow schema
      const validationResult = this.workflowValidator.validate(parseResult.workflow);

      if (!validationResult.valid) {
        logger.error(`[${this.SERVICE_NAME}] Workflow validation failed`, {
          errors: validationResult.errors,
        });

        return {
          success: false,
          yaml: claudeResponse,
          error: {
            type: 'schema_validation',
            message: 'Generated workflow has validation errors',
            details: `Found ${validationResult.errors.length} validation error(s)`,
            validationErrors: validationResult.errors,
          },
          metadata: {
            modelUsed: context.model || 'claude-sonnet-4-5-20250929',
            durationMs: Date.now() - startTime,
          },
        };
      }

      // Success!
      logger.info(`[${this.SERVICE_NAME}] Workflow generated successfully`, {
        workflowName: String(parseResult.workflow.name || 'Unknown'),
        stepCount: parseResult.workflow.steps?.length || 0,
        durationMs: Date.now() - startTime,
      });

      return {
        success: true,
        workflow: parseResult.workflow,
        yaml: claudeResponse,
        metadata: {
          modelUsed: context.model || 'claude-sonnet-4-5-20250929',
          durationMs: Date.now() - startTime,
        },
      };
    } catch (error) {
      logger.error(`[${this.SERVICE_NAME}] Workflow generation failed`, {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: {
          type:
            error instanceof Error && error.message.startsWith('Claude API error:')
              ? 'claude_api'
              : 'unknown',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error instanceof Error ? error.stack : undefined,
        },
        metadata: {
          modelUsed: context.model || 'claude-sonnet-4-5-20250929',
          durationMs: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Construct optimized prompt for workflow generation
   *
   * Based on Wave 9.5.2 prompt engineering guidelines.
   * Includes schema, examples, and clear requirements.
   */
  private constructPrompt(context: GenerationContext): string {
    const { description, projectType, language } = context;

    return `You are a workflow generation assistant for Lighthouse Chat IDE. Generate a YAML workflow definition based on the user's description.

USER DESCRIPTION:
${description}

CONTEXT:
- Project Type: ${projectType || 'General'}
- Programming Language: ${language || 'Python'}

WORKFLOW SCHEMA:
A valid workflow must include:
1. name: string (workflow name)
2. description: string (workflow purpose)
3. inputs: object (workflow input parameters with type and required fields)
4. steps: array (ordered list of workflow steps)
5. ui_metadata: object (node positions for canvas)

AVAILABLE NODE TYPES:
- python: Execute Python script (requires script field with path)
- claude: Call Claude API with prompt (requires prompt field)
- file_operation: Read/write files (requires operation: read or write)
- conditional: Branch based on condition (requires condition field)
- loop: Iterate over collection (requires items field)
- input: Workflow input parameter (requires paramName field)
- output: Workflow output result (requires format field)

STEP FORMAT:
- id: unique_step_id (use snake_case)
  type: [python|claude|file_operation|conditional|loop|input|output]
  label: Human-readable step name
  inputs: (optional) inputs for this step
  script: (for python) path to script (./scripts/descriptive_name.py)
  prompt: (for claude) prompt template with variable interpolation
  operation: (for file_operation) read or write
  condition: (for conditional) expression to evaluate
  items: (for loop) array or variable reference to iterate

VARIABLE SYNTAX:
- Workflow inputs: \${workflow.inputs.parameter_name}
- Step outputs: \${steps.step_id.outputs.field_name}
- Environment variables: \${env.VARIABLE_NAME}
- Loop iteration: \${loop.item} (inside loop steps)

REQUIREMENTS:
1. Generate valid YAML following schema above
2. Use realistic script paths (./scripts/descriptive_name.py)
3. Include descriptive labels for each node
4. Add UI metadata (position nodes in grid layout, x: 100*(index+1), y: 100)
5. Ensure all variable references are valid
6. Keep workflows simple and focused (3-7 steps ideal)

EXAMPLE OUTPUT:
\`\`\`yaml
name: Documentation Generator
description: Analyzes codebase and generates documentation
inputs:
  repository_path:
    type: string
    required: true
    description: Path to repository root
steps:
  - id: analyze_code
    type: python
    label: Analyze Codebase
    script: ./scripts/analyze_codebase.py
    inputs:
      repo_path: \${workflow.inputs.repository_path}
  - id: generate_docs
    type: claude
    label: Generate Documentation
    prompt: |
      Generate comprehensive documentation for this codebase:
      Structure: \${steps.analyze_code.outputs.structure}

      Include:
      - Overview
      - Architecture
      - API reference
      - Usage examples
  - id: save_docs
    type: file_operation
    label: Save Documentation
    operation: write
    inputs:
      path: ./docs/README.md
      content: \${steps.generate_docs.outputs.documentation}
ui_metadata:
  nodes:
    - id: analyze_code
      position: { x: 100, y: 100 }
    - id: generate_docs
      position: { x: 200, y: 100 }
    - id: save_docs
      position: { x: 300, y: 100 }
\`\`\`

Now generate a valid YAML workflow for the user's description. Output ONLY the YAML (no markdown code blocks, no explanation before or after). Start with "name:" on the first line.`;
  }

  /**
   * Call Claude API via AIService
   *
   * @param prompt - Constructed prompt
   * @param _model - Optional model override (reserved for future use)
   * @returns Claude's response (YAML string)
   */
  private async callClaude(prompt: string, _model?: string): Promise<string> {
    try {
      const response = await this.aiService.sendMessage(prompt, {
        systemPrompt:
          'You are a workflow generation expert. Output ONLY valid YAML workflow definitions. Never use markdown code blocks. Start directly with "name:" field.',
      });

      // Remove markdown code blocks if Claude added them despite instructions
      let yaml = response.trim();
      if (yaml.startsWith('```yaml') || yaml.startsWith('```')) {
        yaml = yaml
          .replace(/^```(?:yaml)?\n?/, '')
          .replace(/\n?```$/, '')
          .trim();
      }

      return yaml;
    } catch (error) {
      logger.error(`[${this.SERVICE_NAME}] Claude API call failed`, {
        error: error instanceof Error ? error.message : String(error),
      });

      // Only wrap actual API errors, pass through network errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isApiError =
        errorMessage.toLowerCase().includes('api') ||
        errorMessage.toLowerCase().includes('rate limit') ||
        errorMessage.toLowerCase().includes('authentication');

      throw new Error(isApiError ? `Claude API error: ${errorMessage}` : errorMessage);
    }
  }
}
