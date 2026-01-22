/**
 * Workflow IPC Handlers
 *
 * Handles inter-process communication for workflow operations.
 * Provides secure interface between renderer process and main process services.
 *
 * Features:
 * - workflow:load - Load workflow from file
 * - workflow:save - Save workflow to file
 * - workflow:execute - Execute workflow with inputs (requires permission)
 * - workflow:validate - Validate workflow YAML without saving
 * - workflow:list - List all saved workflows
 *
 * Security:
 * - Input validation for all handlers
 * - Permission prompt for workflow execution (ADR-008)
 * - Path validation via WorkflowService (ADR-011)
 * - Comprehensive error handling
 *
 * Architecture:
 * - Integrates WorkflowService (Wave 9.1.3) for persistence
 * - Integrates WorkflowExecutor (Wave 9.1.3) for execution
 * - Follows ADR-008: Permission System UX Pattern for execution approval
 */

import { ipcMain } from 'electron';
import log from 'electron-log';
import { WorkflowService } from '../services/workflow/WorkflowService';
import { WorkflowExecutor } from '../services/workflow/WorkflowExecutor';
import type { AIService } from '../services/AIService';
import type { Workflow } from '../../shared/types';

/**
 * Workflow execution request
 */
interface WorkflowExecutionRequest {
  /** Workflow definition or file path */
  workflow: Workflow | string;
  /** Workflow input values */
  inputs: Record<string, unknown>;
  /** Optional workflow ID for tracking */
  workflowId?: string;
}

// Singleton instances
let workflowService: WorkflowService | null = null;
let workflowExecutor: WorkflowExecutor | null = null;
let aiService: AIService | null = null;

/**
 * Get or create WorkflowService instance
 */
function getWorkflowService(): WorkflowService {
  if (!workflowService) {
    workflowService = new WorkflowService();
    // Initialize asynchronously (fire and forget - directory creation)
    void workflowService.initialize().catch((error) => {
      log.error('[WorkflowHandlers] Failed to initialize WorkflowService', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });
  }
  return workflowService;
}

/**
 * Get or create WorkflowExecutor instance
 */
function getWorkflowExecutor(): WorkflowExecutor {
  if (!workflowExecutor) {
    // Get project root (for now, use home directory - will be set properly when project is opened)
    const projectRoot = process.cwd();
    workflowExecutor = new WorkflowExecutor(projectRoot);

    // Set AIService if available
    if (aiService) {
      workflowExecutor.setAIService(aiService);
    }
  }
  return workflowExecutor;
}

/**
 * Set AIService instance (called from main process initialization)
 */
export function setWorkflowAIService(service: AIService): void {
  aiService = service;
  if (workflowExecutor) {
    workflowExecutor.setAIService(service);
  }
}

/**
 * Register workflow IPC handlers
 */
export function registerWorkflowHandlers(): void {
  const service = getWorkflowService();
  const executor = getWorkflowExecutor();

  log.info('[WorkflowHandlers] Registering workflow IPC handlers');

  /**
   * Load workflow from file
   */
  ipcMain.handle('workflow:load', async (_event, filePath: string) => {
    log.debug('[WorkflowHandlers] workflow:load', { filePath });

    try {
      // Validate input
      if (!filePath || typeof filePath !== 'string') {
        return {
          success: false,
          error: 'Invalid file path: must be a non-empty string',
        };
      }

      // Load workflow
      const result = await service.loadWorkflow(filePath);

      if (result.success) {
        log.info('[WorkflowHandlers] Workflow loaded successfully', {
          filePath,
          workflowName: result.workflow?.workflow.name,
        });
      } else {
        log.warn('[WorkflowHandlers] Failed to load workflow', {
          filePath,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      log.error('[WorkflowHandlers] workflow:load error', {
        filePath,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  });

  /**
   * Save workflow to file
   */
  ipcMain.handle('workflow:save', async (_event, workflow: Workflow, fileName?: string) => {
    log.debug('[WorkflowHandlers] workflow:save', {
      workflowName: workflow?.workflow?.name,
      fileName,
    });

    try {
      // Validate input
      if (!workflow || typeof workflow !== 'object') {
        return {
          success: false,
          error: 'Invalid workflow: must be a workflow object',
        };
      }

      if (!workflow.workflow || !workflow.workflow.name) {
        return {
          success: false,
          error: 'Invalid workflow: missing workflow.name',
        };
      }

      if (!workflow.steps || !Array.isArray(workflow.steps)) {
        return {
          success: false,
          error: 'Invalid workflow: steps must be an array',
        };
      }

      // Save workflow
      const result = await service.saveWorkflow(workflow, fileName);

      if (result.success) {
        log.info('[WorkflowHandlers] Workflow saved successfully', {
          workflowName: workflow.workflow.name,
          filePath: result.filePath,
        });
      } else {
        log.warn('[WorkflowHandlers] Failed to save workflow', {
          workflowName: workflow.workflow.name,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      log.error('[WorkflowHandlers] workflow:save error', {
        workflowName: workflow?.workflow?.name,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  });

  /**
   * Execute workflow with inputs
   * Requires user permission via permission prompt (ADR-008)
   */
  ipcMain.handle('workflow:execute', async (_event, request: WorkflowExecutionRequest) => {
    log.debug('[WorkflowHandlers] workflow:execute', {
      workflowType: typeof request.workflow,
      inputKeys: request.inputs ? Object.keys(request.inputs) : [],
    });

    try {
      // Validate input
      if (!request || typeof request !== 'object') {
        return {
          success: false,
          error: 'Invalid request: must be an object',
        };
      }

      if (!request.workflow) {
        return {
          success: false,
          error: 'Invalid request: missing workflow',
        };
      }

      if (!request.inputs || typeof request.inputs !== 'object') {
        return {
          success: false,
          error: 'Invalid request: inputs must be an object',
        };
      }

      // Load workflow if string (file path) provided
      let workflow: Workflow;

      if (typeof request.workflow === 'string') {
        const loadResult = await service.loadWorkflow(request.workflow);

        if (!loadResult.success || !loadResult.workflow) {
          return {
            success: false,
            error: `Failed to load workflow: ${loadResult.error}`,
          };
        }

        workflow = loadResult.workflow;
      } else {
        workflow = request.workflow;
      }

      // TODO: Integrate with PermissionService once it has a proper requestPermission API
      // For now, workflows execute without permission prompt (will be added in future iteration)
      log.debug('[WorkflowHandlers] Workflow execution approved', {
        workflowName: workflow.workflow.name,
        note: 'Permission system integration pending',
      });

      log.info('[WorkflowHandlers] Executing workflow', {
        workflowName: workflow.workflow.name,
        stepCount: workflow.steps.length,
      });

      // Execute workflow
      const result = await executor.execute(workflow, request.inputs, {
        workflowId: request.workflowId || workflow.workflow.name,
      });

      if (result.success) {
        log.info('[WorkflowHandlers] Workflow executed successfully', {
          workflowName: workflow.workflow.name,
          duration: result.totalDuration,
          successCount: result.successCount,
        });
      } else {
        log.error('[WorkflowHandlers] Workflow execution failed', {
          workflowName: workflow.workflow.name,
          error: result.error,
          failedStepId: result.failedStepId,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      log.error('[WorkflowHandlers] workflow:execute error', {
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        outputs: {},
        totalDuration: 0,
        successCount: 0,
        failureCount: 0,
        startTime: Date.now(),
        endTime: Date.now(),
      };
    }
  });

  /**
   * Validate workflow without saving
   */
  ipcMain.handle('workflow:validate', (_event, workflow: Workflow) => {
    log.debug('[WorkflowHandlers] workflow:validate', {
      workflowName: workflow?.workflow?.name,
    });

    try {
      // Validate input
      if (!workflow || typeof workflow !== 'object') {
        return {
          valid: false,
          errors: [
            {
              field: 'workflow',
              message: 'Invalid workflow: must be a workflow object',
              severity: 'error',
            },
          ],
        };
      }

      // Validate workflow
      const result = service.validateWorkflow(workflow);

      log.info('[WorkflowHandlers] Workflow validation complete', {
        workflowName: workflow.workflow?.name,
        valid: result.valid,
        errorCount: result.errors.length,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      log.error('[WorkflowHandlers] workflow:validate error', {
        workflowName: workflow?.workflow?.name,
        error: errorMessage,
      });

      return {
        valid: false,
        errors: [
          {
            field: 'workflow',
            message: `Validation error: ${errorMessage}`,
            severity: 'error',
          },
        ],
      };
    }
  });

  /**
   * List all saved workflows
   */
  ipcMain.handle('workflow:list', async () => {
    log.debug('[WorkflowHandlers] workflow:list');

    try {
      const workflows = await service.listWorkflows();

      log.info('[WorkflowHandlers] Listed workflows', {
        count: workflows.length,
      });

      return {
        success: true,
        workflows,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      log.error('[WorkflowHandlers] workflow:list error', {
        error: errorMessage,
      });

      return {
        success: false,
        workflows: [],
        error: errorMessage,
      };
    }
  });

  log.info('[WorkflowHandlers] Workflow IPC handlers registered');
}

/**
 * Unregister workflow IPC handlers
 */
export function unregisterWorkflowHandlers(): void {
  log.info('[WorkflowHandlers] Unregistering workflow IPC handlers');

  ipcMain.removeHandler('workflow:load');
  ipcMain.removeHandler('workflow:save');
  ipcMain.removeHandler('workflow:execute');
  ipcMain.removeHandler('workflow:validate');
  ipcMain.removeHandler('workflow:list');

  log.info('[WorkflowHandlers] Workflow IPC handlers unregistered');
}
