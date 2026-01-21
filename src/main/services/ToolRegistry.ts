/**
 * ToolRegistry
 *
 * Central registry for all AI tools. Manages tool registration, lookup, and schema retrieval.
 * Tools are registered at startup and can be queried by name or retrieved as a complete set
 * for AI consumption.
 *
 * Features:
 * - Type-safe tool registration
 * - Tool lookup by name
 * - Schema export for AI (AIChatSDK format)
 * - Validation of tool uniqueness
 *
 * Usage:
 * const registry = new ToolRegistry();
 * registry.register(readFileTool);
 * const schemas = registry.getAllSchemas(); // For AI
 * const executor = registry.getTool('read_file');
 */

import type { ToolDefinition, ToolExecutor } from '@shared/types';
import { logger } from '@main/logger';

/**
 * Tool registry for managing all available tools
 */
export class ToolRegistry {
  private tools: Map<string, ToolExecutor> = new Map();

  /**
   * Register a tool executor
   *
   * @param executor - Tool executor to register
   * @throws Error if tool with same name already registered
   */
  register(executor: ToolExecutor): void {
    const definition = executor.getDefinition();

    if (this.tools.has(definition.name)) {
      throw new Error(`Tool '${definition.name}' is already registered`);
    }

    this.tools.set(definition.name, executor);
    logger.debug('[ToolRegistry] Registered tool', {
      toolName: definition.name,
      riskLevel: definition.riskLevel,
    });
  }

  /**
   * Get tool executor by name
   *
   * @param toolName - Name of tool to retrieve
   * @returns Tool executor or undefined if not found
   */
  getTool(toolName: string): ToolExecutor | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Check if tool exists
   *
   * @param toolName - Name of tool to check
   * @returns True if tool is registered
   */
  hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Get all registered tool names
   *
   * @returns Array of tool names
   */
  getAllToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get all tool schemas for AI consumption
   * Returns definitions compatible with AIChatSDK tool format
   *
   * @returns Array of tool definitions
   */
  getAllSchemas(): ToolDefinition[] {
    const schemas: ToolDefinition[] = [];

    for (const executor of this.tools.values()) {
      schemas.push(executor.getDefinition());
    }

    return schemas;
  }

  /**
   * Get total number of registered tools
   *
   * @returns Tool count
   */
  getToolCount(): number {
    return this.tools.size;
  }

  /**
   * Clear all registered tools (for testing)
   */
  clear(): void {
    const toolCount = this.tools.size;
    this.tools.clear();
    logger.debug('[ToolRegistry] Cleared all tools', {
      toolCount,
    });
  }
}
