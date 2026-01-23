/**
 * WorkflowService
 *
 * Manages workflow persistence (save/load) and lifecycle operations.
 * All workflows are stored in ~/Documents/Lighthouse/workflows/ directory.
 *
 * Features:
 * - Save workflows to YAML files with validation
 * - Load workflows from disk with parsing and validation
 * - List all saved workflows in directory
 * - Auto-save support (optional, can be triggered manually)
 * - Path validation (ADR-011) for workflow directory
 * - Comprehensive error handling and logging
 *
 * Architecture:
 * - Integrates YamlParser (Wave 9.1.2) for YAML serialization
 * - Integrates WorkflowValidator (Wave 9.1.2) for validation
 * - Uses FileSystemService for safe file operations
 * - Follows ADR-011: Directory Sandboxing Approach
 *
 * Usage:
 * const service = new WorkflowService();
 * await service.initialize();
 * await service.saveWorkflow(workflow);
 * const workflow = await service.loadWorkflow('my-workflow.yaml');
 */

import log from 'electron-log';
import { homedir } from 'node:os';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { YamlParser } from './YamlParser';
import { WorkflowValidator } from './WorkflowValidator';
import { PathValidator } from '../../tools/PathValidator';
import type { Workflow, ValidationResult } from '../../../shared/types';

/**
 * Workflow metadata for listing
 */
export interface WorkflowListItem {
  /** Workflow file name (e.g., "my-workflow.yaml") */
  fileName: string;
  /** Absolute path to workflow file */
  filePath: string;
  /** Workflow name from metadata */
  name: string;
  /** Workflow version */
  version: string;
  /** Workflow description */
  description: string;
  /** File size in bytes */
  fileSize: number;
  /** Last modified timestamp */
  lastModified: Date;
  /** Tags from workflow metadata */
  tags?: string[];
}

/**
 * Save workflow result
 */
export interface SaveWorkflowResult {
  /** Whether save was successful */
  success: boolean;
  /** Path where workflow was saved */
  filePath?: string;
  /** Error message (if failed) */
  error?: string;
  /** Validation errors (if validation failed before save) */
  validationErrors?: ValidationResult;
}

/**
 * Load workflow result
 */
export interface LoadWorkflowResult {
  /** Whether load was successful */
  success: boolean;
  /** Loaded workflow (if successful) */
  workflow?: Workflow;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Workflow persistence service
 */
export class WorkflowService {
  private workflowDirectory: string;
  private pathValidator: PathValidator;
  private yamlParser: YamlParser;
  private workflowValidator: WorkflowValidator;
  private autoSaveInterval: NodeJS.Timeout | null = null;

  /**
   * Create a new WorkflowService
   *
   * By default, workflows are stored in ~/Documents/Lighthouse/workflows/
   * This can be customized via the workflowDirectory parameter.
   *
   * @param workflowDirectory - Optional custom workflow directory (absolute path)
   */
  constructor(workflowDirectory?: string) {
    // Default workflow directory: ~/Documents/Lighthouse/workflows/
    this.workflowDirectory =
      workflowDirectory || path.join(homedir(), 'Documents', 'Lighthouse', 'workflows');

    // Path validator ensures all operations stay within workflow directory
    this.pathValidator = new PathValidator(this.workflowDirectory);

    // YAML parser and validator
    this.yamlParser = new YamlParser();
    this.workflowValidator = new WorkflowValidator();

    log.info('[WorkflowService] Initialized', {
      workflowDirectory: this.workflowDirectory,
    });
  }

  /**
   * Initialize workflow service
   *
   * Creates workflow directory if it doesn't exist.
   * Must be called before using other methods.
   */
  async initialize(): Promise<void> {
    try {
      // Create workflow directory if it doesn't exist
      await fs.mkdir(this.workflowDirectory, { recursive: true });

      log.info('[WorkflowService] Workflow directory initialized', {
        path: this.workflowDirectory,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      log.error('[WorkflowService] Failed to initialize workflow directory', {
        path: this.workflowDirectory,
        error: errorMessage,
      });

      throw new Error(`Failed to initialize workflow directory: ${errorMessage}`);
    }
  }

  /**
   * Get workflow directory path
   *
   * @returns Absolute path to workflow directory
   */
  getWorkflowDirectory(): string {
    return this.workflowDirectory;
  }

  /**
   * Save workflow to file
   *
   * Validates workflow before saving. If validation fails, workflow is not saved.
   * File name is derived from workflow name (sanitized).
   *
   * @param workflow - Workflow to save
   * @param fileName - Optional custom file name (default: derived from workflow.name)
   * @returns Save result with file path or error
   */
  async saveWorkflow(workflow: Workflow, fileName?: string): Promise<SaveWorkflowResult> {
    log.debug('[WorkflowService] Saving workflow', {
      workflowName: workflow.workflow.name,
      fileName,
    });

    try {
      // 1. Validate workflow before saving
      const validation = this.workflowValidator.validate(workflow);

      if (!validation.valid) {
        log.warn('[WorkflowService] Workflow validation failed', {
          workflowName: workflow.workflow.name,
          errorCount: validation.errors.length,
          errors: validation.errors.map((e) => e.message),
        });

        return {
          success: false,
          error: 'Workflow validation failed',
          validationErrors: validation,
        };
      }

      // 2. Determine file name
      const sanitizedFileName = fileName || this.sanitizeFileName(workflow.workflow.name);

      // Ensure .yaml extension
      const finalFileName = sanitizedFileName.endsWith('.yaml')
        ? sanitizedFileName
        : `${sanitizedFileName}.yaml`;

      // 3. Validate file path (must be within workflow directory)
      const filePathValidation = this.pathValidator.validate(finalFileName);

      if (!filePathValidation.isValid) {
        log.error('[WorkflowService] Invalid file path', {
          fileName: finalFileName,
          error: filePathValidation.error,
        });

        return {
          success: false,
          error: `Invalid file path: ${filePathValidation.error}`,
        };
      }

      const absolutePath = filePathValidation.absolutePath!;

      // 4. Serialize workflow to YAML
      const yamlContent = this.yamlParser.serialize(workflow, {
        indent: 2,
        lineWidth: 80,
      });

      // 5. Write to file
      await fs.writeFile(absolutePath, yamlContent, 'utf-8');

      log.info('[WorkflowService] Workflow saved successfully', {
        workflowName: workflow.workflow.name,
        filePath: absolutePath,
        fileSize: yamlContent.length,
      });

      return {
        success: true,
        filePath: absolutePath,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during save';

      log.error('[WorkflowService] Failed to save workflow', {
        workflowName: workflow.workflow.name,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Load workflow from file
   *
   * Parses YAML and validates workflow structure.
   * Supports both absolute paths and relative file names.
   *
   * @param filePathOrName - Absolute path or file name (e.g., "my-workflow.yaml")
   * @returns Load result with workflow or error
   */
  async loadWorkflow(filePathOrName: string): Promise<LoadWorkflowResult> {
    log.debug('[WorkflowService] Loading workflow', {
      filePathOrName,
    });

    try {
      // 1. Resolve file path
      let absolutePath: string;

      if (path.isAbsolute(filePathOrName)) {
        // Validate absolute path is within workflow directory
        const validation = this.pathValidator.validate(filePathOrName);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Invalid file path: ${validation.error}`,
          };
        }
        absolutePath = validation.absolutePath!;
      } else {
        // Relative file name - resolve to workflow directory
        const validation = this.pathValidator.validate(filePathOrName);
        if (!validation.isValid) {
          return {
            success: false,
            error: `Invalid file name: ${validation.error}`,
          };
        }
        absolutePath = validation.absolutePath!;
      }

      // 2. Check if file exists
      try {
        await fs.access(absolutePath);
      } catch {
        return {
          success: false,
          error: `Workflow file not found: ${filePathOrName}`,
        };
      }

      // 3. Read file contents
      const yamlContent = await fs.readFile(absolutePath, 'utf-8');

      // 4. Parse YAML
      const parseResult = this.yamlParser.parse(yamlContent);

      if (!parseResult.success || !parseResult.workflow) {
        log.error('[WorkflowService] Failed to parse workflow YAML', {
          filePath: absolutePath,
          parseError: parseResult.error,
        });

        return {
          success: false,
          error: `Failed to parse YAML: ${parseResult.error?.message || 'Unknown parse error'}`,
        };
      }

      // 5. Validate workflow
      const validation = this.workflowValidator.validate(parseResult.workflow);

      if (!validation.valid) {
        log.warn('[WorkflowService] Loaded workflow has validation errors', {
          filePath: absolutePath,
          errorCount: validation.errors.length,
          errors: validation.errors.map((e) => e.message),
        });

        // Return workflow even if invalid - caller can decide whether to use it
        // (validation errors are logged but don't prevent loading)
      }

      log.info('[WorkflowService] Workflow loaded successfully', {
        filePath: absolutePath,
        workflowName: parseResult.workflow.workflow.name,
        stepCount: parseResult.workflow.steps.length,
      });

      return {
        success: true,
        workflow: parseResult.workflow,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during load';

      log.error('[WorkflowService] Failed to load workflow', {
        filePathOrName,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * List all workflows in workflow directory
   *
   * @returns Array of workflow metadata items
   */
  async listWorkflows(): Promise<WorkflowListItem[]> {
    log.debug('[WorkflowService] Listing workflows', {
      directory: this.workflowDirectory,
    });

    try {
      // Read directory contents
      const entries = await fs.readdir(this.workflowDirectory, {
        withFileTypes: true,
      });

      // Filter for .yaml files
      const yamlFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.yaml'));

      // Load metadata for each workflow
      const workflows: WorkflowListItem[] = [];

      for (const file of yamlFiles) {
        try {
          const filePath = path.join(this.workflowDirectory, file.name);

          // Get file stats
          const stats = await fs.stat(filePath);

          // Load workflow to get metadata
          const loadResult = await this.loadWorkflow(file.name);

          if (loadResult.success && loadResult.workflow) {
            workflows.push({
              fileName: file.name,
              filePath,
              name: loadResult.workflow.workflow.name,
              version: loadResult.workflow.workflow.version,
              description: loadResult.workflow.workflow.description,
              fileSize: stats.size,
              lastModified: stats.mtime,
              tags: loadResult.workflow.workflow.tags,
            });
          }
        } catch (error) {
          // Skip files that can't be loaded
          log.warn('[WorkflowService] Failed to load workflow metadata', {
            fileName: file.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      log.info('[WorkflowService] Listed workflows', {
        count: workflows.length,
      });

      return workflows;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      log.error('[WorkflowService] Failed to list workflows', {
        directory: this.workflowDirectory,
        error: errorMessage,
      });

      return [];
    }
  }

  /**
   * Validate workflow without saving
   *
   * @param workflow - Workflow to validate
   * @returns Validation result
   */
  validateWorkflow(workflow: Workflow): ValidationResult {
    log.debug('[WorkflowService] Validating workflow', {
      workflowName: workflow.workflow.name,
    });

    return this.workflowValidator.validate(workflow);
  }

  /**
   * Enable auto-save for a workflow
   *
   * Auto-saves workflow every 30 seconds (configurable).
   * Only one auto-save can be active at a time.
   *
   * @param workflow - Workflow to auto-save
   * @param intervalMs - Auto-save interval in milliseconds (default: 30000)
   */
  enableAutoSave(workflow: Workflow, intervalMs = 30000): void {
    // Disable existing auto-save if any
    this.disableAutoSave();

    log.info('[WorkflowService] Auto-save enabled', {
      workflowName: workflow.workflow.name,
      intervalMs,
    });

    this.autoSaveInterval = setInterval(() => {
      void (async () => {
        log.debug('[WorkflowService] Auto-saving workflow', {
          workflowName: workflow.workflow.name,
        });

        const result = await this.saveWorkflow(workflow);

        if (!result.success) {
          log.warn('[WorkflowService] Auto-save failed', {
            workflowName: workflow.workflow.name,
            error: result.error,
          });
        }
      })();
    }, intervalMs);
  }

  /**
   * Disable auto-save
   */
  disableAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;

      log.debug('[WorkflowService] Auto-save disabled');
    }
  }

  /**
   * Delete workflow file
   *
   * @param filePathOrName - Absolute path or file name
   * @returns Whether deletion was successful
   */
  async deleteWorkflow(filePathOrName: string): Promise<boolean> {
    log.debug('[WorkflowService] Deleting workflow', {
      filePathOrName,
    });

    try {
      // Resolve file path
      let absolutePath: string;

      if (path.isAbsolute(filePathOrName)) {
        const validation = this.pathValidator.validate(filePathOrName);
        if (!validation.isValid) {
          log.error('[WorkflowService] Invalid file path for deletion', {
            filePathOrName,
            error: validation.error,
          });
          return false;
        }
        absolutePath = validation.absolutePath!;
      } else {
        const validation = this.pathValidator.validate(filePathOrName);
        if (!validation.isValid) {
          log.error('[WorkflowService] Invalid file name for deletion', {
            filePathOrName,
            error: validation.error,
          });
          return false;
        }
        absolutePath = validation.absolutePath!;
      }

      // Delete file
      await fs.unlink(absolutePath);

      log.info('[WorkflowService] Workflow deleted', {
        filePath: absolutePath,
      });

      return true;
    } catch (error) {
      log.error('[WorkflowService] Failed to delete workflow', {
        filePathOrName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return false;
    }
  }

  /**
   * Save workflow to arbitrary path (for export functionality)
   *
   * Unlike saveWorkflow(), this method allows saving to any path on the file system,
   * not just within the workflow directory. Used for workflow export feature.
   *
   * @param workflow - Workflow to save
   * @param absolutePath - Absolute path where to save the workflow
   * @returns Save result with file path or error
   */
  async saveWorkflowToPath(workflow: Workflow, absolutePath: string): Promise<SaveWorkflowResult> {
    log.debug('[WorkflowService] Saving workflow to path', {
      workflowName: workflow.workflow.name,
      absolutePath,
    });

    try {
      // 1. Validate path is absolute
      if (!path.isAbsolute(absolutePath)) {
        return {
          success: false,
          error: 'Path must be absolute',
        };
      }

      // 2. Validate workflow before saving
      const validation = this.workflowValidator.validate(workflow);

      if (!validation.valid) {
        log.warn('[WorkflowService] Workflow validation failed', {
          workflowName: workflow.workflow.name,
          errorCount: validation.errors.length,
          errors: validation.errors.map((e) => e.message),
        });

        return {
          success: false,
          error: 'Workflow validation failed',
          validationErrors: validation,
        };
      }

      // 3. Serialize workflow to YAML
      const yamlContent = this.yamlParser.serialize(workflow, {
        indent: 2,
        lineWidth: 80,
      });

      // 4. Ensure directory exists
      const directory = path.dirname(absolutePath);
      await fs.mkdir(directory, { recursive: true });

      // 5. Write to file
      await fs.writeFile(absolutePath, yamlContent, 'utf-8');

      log.info('[WorkflowService] Workflow saved to path successfully', {
        workflowName: workflow.workflow.name,
        filePath: absolutePath,
        fileSize: yamlContent.length,
      });

      return {
        success: true,
        filePath: absolutePath,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during save';

      log.error('[WorkflowService] Failed to save workflow to path', {
        workflowName: workflow.workflow.name,
        absolutePath,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Sanitize workflow name for use as file name
   *
   * Removes special characters and spaces, converts to lowercase.
   *
   * @param workflowName - Workflow name to sanitize
   * @returns Sanitized file name
   */
  private sanitizeFileName(workflowName: string): string {
    return workflowName
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
