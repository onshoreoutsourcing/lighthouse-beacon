/**
 * TemplateService
 *
 * Service for loading and managing workflow templates.
 * Reads templates from bundled /workflow-templates directory.
 *
 * Wave 9.3.2: Import/Export & Workflow Templates
 */

import type { WorkflowTemplate } from '@shared/types/workflow.types';

/**
 * Parse complexity level from README content
 * @internal Reserved for future dynamic template loading
 */
function _parseComplexity(readmeContent: string): 'Beginner' | 'Intermediate' | 'Advanced' {
  const complexityMatch = readmeContent.match(
    /##\s*Complexity:\s*(Beginner|Intermediate|Advanced)/i
  );
  if (complexityMatch) {
    return complexityMatch[1] as 'Beginner' | 'Intermediate' | 'Advanced';
  }
  return 'Beginner'; // Default
}

/**
 * Parse tags from README content
 * @internal Reserved for future dynamic template loading
 */
function _parseTags(readmeContent: string): string[] {
  // Look for Tags section with comma-separated or backtick-wrapped tags
  const tagsMatch = readmeContent.match(/##\s*Tags\s*\n\n`([^`]+)`/);
  if (tagsMatch) {
    return tagsMatch[1].split(',').map((tag) => tag.trim());
  }
  return [];
}

/**
 * Extract full description from README (first overview section)
 * @internal Reserved for future dynamic template loading
 */
function _parseFullDescription(readmeContent: string): string {
  // Extract content between "## Overview" and next "##" heading
  const overviewMatch = readmeContent.match(/##\s*Overview\s*\n\n([\s\S]*?)(?=\n##|$)/);
  if (overviewMatch) {
    return overviewMatch[1].trim();
  }
  return readmeContent.substring(0, 300); // Fallback to first 300 chars
}

/**
 * Count workflow steps from YAML content
 * @internal Reserved for future dynamic template loading
 */
function _countSteps(yamlContent: string): number {
  // Count "- id:" occurrences under "steps:" section
  const stepsSection = yamlContent.match(/steps:\s*\n([\s\S]*)/);
  if (!stepsSection) return 0;

  const stepMatches = stepsSection[1].match(/^\s*-\s+id:/gm);
  return stepMatches ? stepMatches.length : 0;
}

/**
 * Extract required inputs from YAML content
 * @internal Reserved for future dynamic template loading
 */
function _extractRequiredInputs(yamlContent: string): string[] {
  const inputs: string[] = [];
  const inputsSection = yamlContent.match(/inputs:\s*\n([\s\S]*?)(?=\nsteps:|$)/);

  if (!inputsSection) return inputs;

  const inputMatches = inputsSection[1].matchAll(/^\s*-\s+id:\s+([^\n]+)/gm);
  for (const match of inputMatches) {
    inputs.push(match[1].trim());
  }

  return inputs;
}

/**
 * Hardcoded templates for MVP
 * In production, these would be loaded dynamically from filesystem via IPC
 */
const BUNDLED_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'documentation-generator',
    name: 'Documentation Generator',
    version: '1.0.0',
    description: 'Generates comprehensive documentation from code repository using AI analysis',
    fullDescription:
      'This workflow analyzes your codebase structure, extracts key information about functions, classes, and architecture, then uses Claude AI to generate professional documentation in Markdown format.\n\nPerfect for maintaining up-to-date documentation automatically.',
    tags: ['documentation', 'ai', 'automation', 'python', 'claude'],
    complexity: 'Beginner',
    previewImage: '/workflow-templates/documentation-generator/preview.png',
    workflowPath: '/workflow-templates/documentation-generator/workflow.yaml',
    requiredInputs: ['repo_path'],
    steps: 4,
  },
  {
    id: 'code-review-automation',
    name: 'Code Review Automation',
    version: '1.0.0',
    description:
      'Automates code reviews with AI-powered analysis focusing on quality, security, performance, and best practices',
    fullDescription:
      'This workflow analyzes git diffs or patches using Claude AI to provide comprehensive code review feedback similar to what an experienced developer would provide. Perfect for pull request reviews, pre-commit checks, or learning best practices.\n\nAnalyzes code quality, security vulnerabilities, performance issues, and adherence to best practices.',
    tags: ['code-review', 'ai', 'quality', 'security', 'automation'],
    complexity: 'Intermediate',
    previewImage: '/workflow-templates/code-review-automation/preview.png',
    workflowPath: '/workflow-templates/code-review-automation/workflow.yaml',
    requiredInputs: ['pr_diff_file', 'review_focus'],
    steps: 3,
  },
  {
    id: 'batch-file-processing',
    name: 'Batch File Processing',
    version: '1.0.0',
    description:
      'Automate processing of multiple files with Python scripts - perfect for file transformations, format conversions, or bulk operations',
    fullDescription:
      'This workflow processes multiple files from an input directory, applies a selected operation, and saves results to an output directory. Flexible template for various batch processing needs like image resizing, file format conversion, text transformation, or data processing.\n\nHandles errors gracefully and provides detailed processing reports.',
    tags: ['batch', 'file-processing', 'automation', 'python'],
    complexity: 'Beginner',
    previewImage: '/workflow-templates/batch-file-processing/preview.png',
    workflowPath: '/workflow-templates/batch-file-processing/workflow.yaml',
    requiredInputs: ['input_directory', 'output_directory', 'file_pattern', 'operation'],
    steps: 4,
  },
];

/**
 * TemplateService class
 */
export class TemplateService {
  /**
   * Get all available templates
   * For MVP, returns hardcoded templates
   * In production, would read from filesystem via IPC
   */
  static async getTemplates(): Promise<WorkflowTemplate[]> {
    // Simulate async loading
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(BUNDLED_TEMPLATES);
      }, 100);
    });
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(id: string): Promise<WorkflowTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find((t) => t.id === id) || null;
  }

  /**
   * Search templates by query (name, description, tags)
   */
  static async searchTemplates(query: string): Promise<WorkflowTemplate[]> {
    const templates = await this.getTemplates();
    const lowerQuery = query.toLowerCase();

    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery) ||
        template.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Load workflow YAML from template
   * Returns the workflow YAML content as string
   */
  static async loadTemplateWorkflow(templateId: string): Promise<string | null> {
    // In production, this would read the actual YAML file via IPC
    // For MVP, return a placeholder
    const template = await this.getTemplateById(templateId);
    if (!template) return null;

    // This would be replaced with actual file reading
    return `# Workflow from template: ${template.name}\n# Path: ${template.workflowPath}`;
  }
}
