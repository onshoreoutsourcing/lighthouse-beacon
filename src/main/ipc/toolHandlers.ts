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
import { FileSystemService } from '../services/FileSystemService';
import { ReadTool, WriteTool, EditTool, DeleteTool } from '../tools';

// Singleton instances
let toolRegistry: ToolRegistry | null = null;
let permissionService: PermissionService | null = null;
let executionService: ToolExecutionService | null = null;

/**
 * Get or create ToolRegistry instance and register file operation tools
 */
function getToolRegistry(): ToolRegistry {
  if (!toolRegistry) {
    toolRegistry = new ToolRegistry();

    // Register core file operation tools (Feature 3.1)
    // Get project root from FileSystemService
    const fsService = new FileSystemService();
    const projectRoot = fsService.getProjectRoot();

    if (projectRoot) {
      // Register all four core file tools
      toolRegistry.register(new ReadTool(projectRoot));
      toolRegistry.register(new WriteTool(projectRoot));
      toolRegistry.register(new EditTool(projectRoot));
      toolRegistry.register(new DeleteTool(projectRoot));

      // eslint-disable-next-line no-console
      console.log('[ToolRegistry] Registered 4 core file operation tools');
    } else {
      console.warn(
        '[ToolRegistry] Project root not set - tools not registered. Select a project directory to enable tools.'
      );
    }
  }
  return toolRegistry;
}

/**
 * Get or create PermissionService instance
 */
function getPermissionService(): PermissionService {
  if (!permissionService) {
    permissionService = new PermissionService();

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
