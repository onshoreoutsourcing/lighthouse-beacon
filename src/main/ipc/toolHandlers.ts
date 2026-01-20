/**
 * Tool IPC Handlers
 *
 * Registers all IPC handlers for tool framework operations including:
 * - Tool execution requests from AI
 * - Tool schema retrieval
 * - Permission request/response flow
 *
 * Security:
 * - All tool executions go through permission checks
 * - Parameters validated before execution
 * - Errors sanitized for UI consumption
 */

import { ipcMain, BrowserWindow } from 'electron';
import type {
  Result,
  ToolDefinition,
  ToolExecutionResult,
  PermissionRequest,
  PermissionResponse,
} from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { ToolRegistry } from '../services/ToolRegistry';
import { PermissionService } from '../services/PermissionService';
import { ToolExecutionService } from '../services/ToolExecutionService';
import { ReadTool, WriteTool, EditTool, DeleteTool, GlobTool, GrepTool, BashTool } from '../tools';

// Singleton instances
let toolRegistry: ToolRegistry | null = null;
let permissionService: PermissionService | null = null;
let executionService: ToolExecutionService | null = null;

/**
 * Get or create ToolRegistry instance
 */
function getToolRegistry(): ToolRegistry {
  if (!toolRegistry) {
    toolRegistry = new ToolRegistry();
    // Tools will be registered via initializeToolsWithProjectRoot()
    // when project directory is selected
  }
  return toolRegistry;
}

/**
 * Get or create PermissionService instance
 */
function getPermissionService(): PermissionService {
  if (!permissionService) {
    permissionService = new PermissionService();

    // Initialize (load persisted permissions) - fire and forget
    permissionService.initialize().catch((error) => {
      console.error('[ToolHandlers] Failed to initialize PermissionService:', error);
    });

    // Set up callback to send permission requests to renderer
    permissionService.setRequestCallback((request: PermissionRequest) => {
      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send(IPC_CHANNELS.TOOL_PERMISSION_REQUEST, request);
      }
    });
  }
  return permissionService;
}

/**
 * Get or create ToolExecutionService instance
 */
function getExecutionService(): ToolExecutionService {
  if (!executionService) {
    executionService = new ToolExecutionService(getToolRegistry(), getPermissionService());
  }
  return executionService;
}

/**
 * Get main window for sending events
 */
function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows();
  return windows.length > 0 ? (windows[0] ?? null) : null;
}

/**
 * Register all tool framework IPC handlers
 * Call this function during app initialization
 */
export function registerToolHandlers(): void {
  const execution = getExecutionService();
  const permission = getPermissionService();

  /**
   * TOOL_EXECUTE: Execute a tool by name with parameters
   */
  ipcMain.handle(
    IPC_CHANNELS.TOOL_EXECUTE,
    async (
      _event,
      toolName: string,
      parameters: Record<string, unknown>,
      conversationId?: string
    ): Promise<Result<ToolExecutionResult>> => {
      try {
        const result = await execution.executeTool(toolName, parameters, conversationId);
        return { success: true, data: result };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to execute tool'),
        };
      }
    }
  );

  /**
   * TOOL_GET_SCHEMAS: Get all tool schemas for AI
   */
  ipcMain.handle(IPC_CHANNELS.TOOL_GET_SCHEMAS, (): Result<ToolDefinition[]> => {
    try {
      const schemas = execution.getAllToolSchemas();
      return { success: true, data: schemas };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get tool schemas'),
      };
    }
  });

  /**
   * TOOL_PERMISSION_RESPONSE: Handle permission response from user
   */
  ipcMain.handle(
    IPC_CHANNELS.TOOL_PERMISSION_RESPONSE,
    (_event, response: PermissionResponse): Result<void> => {
      try {
        permission.handlePermissionResponse(response);
        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to handle permission response'),
        };
      }
    }
  );

  // eslint-disable-next-line no-console
  console.log('[Tool Handlers] Tool framework IPC handlers registered');
}

/**
 * Initialize tools with project root
 * Called when project directory is selected
 *
 * @param projectRoot - Absolute path to project root
 */
export function initializeToolsWithProjectRoot(projectRoot: string): void {
  // Clear existing registry and create new one
  toolRegistry = new ToolRegistry();

  try {
    // Register all file operation tools (Features 3.1, 3.2 & 3.3)
    toolRegistry.register(new ReadTool(projectRoot));
    toolRegistry.register(new WriteTool(projectRoot));
    toolRegistry.register(new EditTool(projectRoot));
    toolRegistry.register(new DeleteTool(projectRoot));
    toolRegistry.register(new GlobTool(projectRoot));
    toolRegistry.register(new GrepTool(projectRoot));
    toolRegistry.register(new BashTool(projectRoot));

    // Recreate execution service with new registry
    executionService = new ToolExecutionService(toolRegistry, getPermissionService());

    // eslint-disable-next-line no-console
    console.log('[ToolRegistry] Registered 7 file operation tools with project root:', projectRoot);
  } catch (error) {
    console.error('[ToolRegistry] Failed to initialize tools:', error);
  }
}

/**
 * Unregister all tool framework IPC handlers
 * Call this during app cleanup
 */
export function unregisterToolHandlers(): void {
  ipcMain.removeHandler(IPC_CHANNELS.TOOL_EXECUTE);
  ipcMain.removeHandler(IPC_CHANNELS.TOOL_GET_SCHEMAS);
  ipcMain.removeHandler(IPC_CHANNELS.TOOL_PERMISSION_RESPONSE);

  // Cleanup service instances
  if (permissionService) {
    permissionService.shutdown();
    permissionService = null;
  }

  toolRegistry = null;
  executionService = null;

  // eslint-disable-next-line no-console
  console.log('[Tool Handlers] Tool framework IPC handlers unregistered');
}
