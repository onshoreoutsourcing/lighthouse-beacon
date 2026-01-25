import { ipcMain, BrowserWindow } from 'electron';
import type { Result, AIStatus, AppSettings, StreamOptions, LoggingConfig } from '@shared/types';
import { IPC_CHANNELS } from '@shared/types';
import { AIService } from '../services/AIService';
import { SettingsService } from '../services/SettingsService';
import { logger, setLogLevel, getLogConfig, type LogConfig } from '@main/logger';
import { promises as fs } from 'node:fs';
import { getAvailableDiskSpace } from '../utils/diskSpace';
// Wave 10.3.3 - RAG Integration
import { VectorService } from '../services/vector/VectorService';
import { RAGService } from '../services/rag/RAGService';
import { PromptBuilder } from '../services/rag/PromptBuilder';
import type { AugmentedPrompt } from '../services/rag/PromptBuilder';

/**
 * AI IPC Handlers
 *
 * Registers all IPC handlers for AI service and settings operations.
 * Uses ipcMain.handle() for proper async/await and error handling.
 *
 * Security:
 * - API key never sent to renderer process
 * - All operations validated before execution
 * - Errors sanitized for UI consumption
 * - Stream events only sent to authorized window
 */

// Singleton instances
let aiService: AIService | null = null;
let settingsService: SettingsService | null = null;
// Wave 10.3.3 - RAG service instances
let vectorService: VectorService | null = null;
let ragService: RAGService | null = null;
let ragInitPromise: Promise<void> | null = null;

/**
 * Get or create AIService instance
 */
function getAIService(): AIService {
  if (!aiService) {
    aiService = new AIService();
  }
  return aiService;
}

/**
 * Get or create SettingsService instance
 */
function getSettingsService(): SettingsService {
  if (!settingsService) {
    settingsService = new SettingsService();
  }
  return settingsService;
}

/**
 * Get or create RAGService instance
 * Wave 10.3.3 - RAG Integration
 */
async function getRAGService(): Promise<RAGService | null> {
  if (!vectorService || !ragService) {
    // Initialize services if not already done
    if (!ragInitPromise) {
      ragInitPromise = (async () => {
        try {
          vectorService = new VectorService();
          await vectorService.initialize();
          ragService = new RAGService(vectorService);
          logger.info('[AIHandlers] RAG services initialized');
        } catch (error) {
          logger.error('[AIHandlers] Failed to initialize RAG services', {
            error: error instanceof Error ? error.message : String(error),
          });
          // Reset so next attempt will try again
          vectorService = null;
          ragService = null;
          ragInitPromise = null;
        }
      })();
    }

    await ragInitPromise;
  }

  return ragService;
}

/**
 * Get main window for sending stream events
 */
function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows();
  return windows.length > 0 ? (windows[0] ?? null) : null;
}

/**
 * Retrieve context and build augmented prompt with RAG
 * Wave 10.3.3 - RAG Integration with graceful fallback
 *
 * @param message - User message/query
 * @param options - Stream options including RAG configuration
 * @returns Augmented prompt or null if RAG disabled/failed
 */
async function buildRAGPrompt(
  message: string,
  options?: StreamOptions
): Promise<AugmentedPrompt | null> {
  // Skip if RAG not requested
  if (!options?.useRAG) {
    return null;
  }

  const startTime = Date.now();

  try {
    // Get RAG service with timeout
    const timeoutMs = 5000; // 5 second timeout per wave requirements
    const rag = await Promise.race([
      getRAGService(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('RAG initialization timeout')), timeoutMs)
      ),
    ]);

    if (!rag) {
      logger.warn('[AIHandlers] RAG service not available, falling back to standard chat');
      // SOC logging for fallback
      logger.info('[SOC] RAG retrieval skipped', {
        reason: 'service_unavailable',
        query: message.substring(0, 100), // First 100 chars only
        timestamp: new Date().toISOString(),
      });
      return null;
    }

    // Retrieve context with timeout
    const context = await Promise.race([
      rag.retrieveContext(message, options.ragOptions),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('RAG retrieval timeout')), timeoutMs)
      ),
    ]);

    const duration = Date.now() - startTime;

    // SOC logging for successful retrieval
    logger.info('[SOC] RAG context retrieved', {
      query: message.substring(0, 100), // First 100 chars only (don't log full query)
      chunksRetrieved: context.chunks.length,
      sourcesCount: context.sources.length,
      tokensUsed: context.totalTokens,
      durationMs: duration,
      timestamp: new Date().toISOString(),
      success: true,
    });

    // Build augmented prompt
    const augmentedPrompt = PromptBuilder.buildAugmentedPrompt(context, {
      includeCitations: options.ragOptions?.includeSources ?? true,
      systemPromptPrefix: options.systemPrompt, // Preserve any custom system prompt
    });

    return augmentedPrompt;
  } catch (error) {
    const duration = Date.now() - startTime;

    // SOC logging for errors
    logger.error('[SOC] RAG retrieval failed', {
      query: message.substring(0, 100),
      error: error instanceof Error ? error.message : String(error),
      durationMs: duration,
      timestamp: new Date().toISOString(),
      success: false,
    });

    // Graceful fallback - log but don't crash
    logger.warn('[AIHandlers] RAG retrieval failed, falling back to standard chat', {
      error: error instanceof Error ? error.message : String(error),
    });

    return null;
  }
}

/**
 * Register all AI and settings IPC handlers
 * Call this function during app initialization
 */
export function registerAIHandlers(): void {
  const ai = getAIService();
  const settings = getSettingsService();

  /**
   * AI_INITIALIZE: Initialize AI service with stored API key
   */
  ipcMain.handle(IPC_CHANNELS.AI_INITIALIZE, async (): Promise<Result<{ status: AIStatus }>> => {
    try {
      const apiKey = await settings.getApiKey();

      // Log API key status (redacted for security)
      const maskedKey = apiKey ? `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}` : 'null';
      logger.info('[AI Initialize] Retrieved API key', {
        hasKey: !!apiKey,
        keyLength: apiKey?.length || 0,
        keyPrefix: apiKey?.slice(0, 7) || 'none',
        maskedKey,
      });

      if (!apiKey) {
        return {
          success: false,
          error: new Error('No API key configured. Please add your Anthropic API key in settings.'),
        };
      }

      const appSettings = await settings.getSettings();

      logger.info('[AI Initialize] Initializing with config', {
        model: appSettings.ai.model,
        socEndpoint: appSettings.soc.endpoint,
        maskedKey,
      });

      await ai.initialize({
        apiKey,
        model: appSettings.ai.model,
        socEndpoint: appSettings.soc.endpoint,
      });

      return {
        success: true,
        data: {
          status: ai.getStatus(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to initialize AI service'),
      };
    }
  });

  /**
   * AI_SEND_MESSAGE: Send non-streaming message to AI
   * Wave 10.3.3 - Added RAG integration
   */
  ipcMain.handle(
    IPC_CHANNELS.AI_SEND_MESSAGE,
    async (_event, message: string, options?: StreamOptions): Promise<Result<string>> => {
      try {
        // Build RAG-augmented prompt if requested
        const augmentedPrompt = await buildRAGPrompt(message, options);

        // Merge RAG system prompt with options
        const finalOptions = {
          ...options,
          systemPrompt: augmentedPrompt?.systemPrompt ?? options?.systemPrompt,
        };

        const response = await ai.sendMessage(message, finalOptions);
        return { success: true, data: response };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to send message'),
        };
      }
    }
  );

  /**
   * AI_STREAM_MESSAGE: Send streaming message to AI
   * Streams tokens back to renderer via events
   * Wave 10.3.3 - Added RAG integration
   */
  ipcMain.handle(
    IPC_CHANNELS.AI_STREAM_MESSAGE,
    async (_event, message: string, options?: StreamOptions): Promise<Result<void>> => {
      const mainWindow = getMainWindow();
      if (!mainWindow) {
        return { success: false, error: new Error('No window available') };
      }

      try {
        // Build RAG-augmented prompt if requested
        const augmentedPrompt = await buildRAGPrompt(message, options);

        // Merge RAG system prompt with options
        const finalOptions = {
          ...options,
          systemPrompt: augmentedPrompt?.systemPrompt ?? options?.systemPrompt,
        };

        await ai.streamMessage(
          message,
          {
            onToken: (token) => {
              mainWindow.webContents.send(IPC_CHANNELS.AI_STREAM_TOKEN, token);
            },
            onComplete: (fullResponse) => {
              mainWindow.webContents.send(IPC_CHANNELS.AI_STREAM_COMPLETE, fullResponse);
            },
            onError: (error) => {
              mainWindow.webContents.send(IPC_CHANNELS.AI_STREAM_ERROR, error.message);
            },
          },
          finalOptions
        );

        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to stream message'),
        };
      }
    }
  );

  /**
   * AI_CANCEL: Cancel current AI request
   */
  ipcMain.handle(IPC_CHANNELS.AI_CANCEL, (): Result<void> => {
    ai.cancelCurrentRequest();
    return { success: true, data: undefined };
  });

  /**
   * AI_STATUS: Get AI service status
   */
  ipcMain.handle(IPC_CHANNELS.AI_STATUS, (): Result<AIStatus> => {
    return { success: true, data: ai.getStatus() };
  });

  /**
   * SETTINGS_GET_API_KEY_STATUS: Check if API key exists (never return actual key)
   */
  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_GET_API_KEY_STATUS,
    async (): Promise<Result<{ hasApiKey: boolean }>> => {
      const hasKey = await settings.hasApiKey();
      return { success: true, data: { hasApiKey: hasKey } };
    }
  );

  /**
   * SETTINGS_SET_API_KEY: Store API key in encrypted storage
   */
  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_SET_API_KEY,
    async (_event, apiKey: string): Promise<Result<void>> => {
      try {
        await settings.setApiKey(apiKey);
        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to save API key'),
        };
      }
    }
  );

  /**
   * SETTINGS_REMOVE_API_KEY: Remove API key and shutdown AI service
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_REMOVE_API_KEY, async (): Promise<Result<void>> => {
    try {
      await settings.removeApiKey();
      await ai.shutdown();
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to remove API key'),
      };
    }
  });

  /**
   * SETTINGS_GET: Get all application settings
   */
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async (): Promise<Result<AppSettings>> => {
    try {
      const appSettings = await settings.getSettings();
      return { success: true, data: appSettings };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get settings'),
      };
    }
  });

  /**
   * SETTINGS_UPDATE: Update application settings
   */
  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_UPDATE,
    async (_event, updates: Partial<AppSettings>): Promise<Result<void>> => {
      try {
        await settings.updateSettings(updates);
        return { success: true, data: undefined };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to update settings'),
        };
      }
    }
  );

  /**
   * SETTINGS_SET_LOG_LEVEL: Change log level at runtime
   * Updates both the logger and persists to settings
   */
  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_SET_LOG_LEVEL,
    async (_event, level: 'debug' | 'info' | 'warn' | 'error'): Promise<Result<void>> => {
      try {
        // Update logger immediately
        setLogLevel(level);

        // Persist to settings
        await settings.setLoggingConfig({ level });

        logger.info('[Settings] Log level changed', { level });
        return { success: true, data: undefined };
      } catch (error) {
        logger.error('[Settings] Failed to set log level', { error });
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to set log level'),
        };
      }
    }
  );

  /**
   * SETTINGS_GET_LOG_CONFIG: Get current log configuration
   * Returns level, file path, file size, max size
   */
  ipcMain.handle(
    IPC_CHANNELS.SETTINGS_GET_LOG_CONFIG,
    async (): Promise<Result<LogConfig & { loggingConfig: LoggingConfig }>> => {
      try {
        const logConfig = getLogConfig();
        const loggingConfig = await settings.getLoggingConfig();

        // Get actual file size
        try {
          const stats = await fs.stat(logConfig.filePath);
          logConfig.fileSize = stats.size;
        } catch {
          // File doesn't exist yet
          logConfig.fileSize = 0;
        }

        return {
          success: true,
          data: {
            ...logConfig,
            loggingConfig,
          },
        };
      } catch (error) {
        logger.error('[Settings] Failed to get log config', { error });
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to get log config'),
        };
      }
    }
  );

  /**
   * LOGS_GET_FILE_SIZE: Get current log file size
   * Returns size in bytes
   */
  ipcMain.handle(IPC_CHANNELS.LOGS_GET_FILE_SIZE, async (): Promise<Result<number>> => {
    try {
      const logConfig = getLogConfig();
      const stats = await fs.stat(logConfig.filePath);
      return { success: true, data: stats.size };
    } catch {
      // File doesn't exist yet
      return { success: true, data: 0 };
    }
  });

  /**
   * LOGS_GET_DISK_SPACE: Get available disk space
   * Returns available space in bytes
   */
  ipcMain.handle(IPC_CHANNELS.LOGS_GET_DISK_SPACE, async (): Promise<Result<number>> => {
    try {
      const logConfig = getLogConfig();
      const availableBytes = await getAvailableDiskSpace(logConfig.filePath);
      return { success: true, data: availableBytes };
    } catch (error) {
      logger.error('[Logs] Failed to get disk space', { error });
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get disk space'),
      };
    }
  });

  logger.info('[AI Handlers] AI and settings IPC handlers registered');
}

/**
 * Unregister all AI and settings IPC handlers
 * Call this during app cleanup
 */
export async function unregisterAIHandlers(): Promise<void> {
  ipcMain.removeHandler(IPC_CHANNELS.AI_INITIALIZE);
  ipcMain.removeHandler(IPC_CHANNELS.AI_SEND_MESSAGE);
  ipcMain.removeHandler(IPC_CHANNELS.AI_STREAM_MESSAGE);
  ipcMain.removeHandler(IPC_CHANNELS.AI_CANCEL);
  ipcMain.removeHandler(IPC_CHANNELS.AI_STATUS);
  ipcMain.removeHandler(IPC_CHANNELS.SETTINGS_GET_API_KEY_STATUS);
  ipcMain.removeHandler(IPC_CHANNELS.SETTINGS_SET_API_KEY);
  ipcMain.removeHandler(IPC_CHANNELS.SETTINGS_REMOVE_API_KEY);
  ipcMain.removeHandler(IPC_CHANNELS.SETTINGS_GET);
  ipcMain.removeHandler(IPC_CHANNELS.SETTINGS_UPDATE);
  ipcMain.removeHandler(IPC_CHANNELS.SETTINGS_SET_LOG_LEVEL);
  ipcMain.removeHandler(IPC_CHANNELS.SETTINGS_GET_LOG_CONFIG);
  ipcMain.removeHandler(IPC_CHANNELS.LOGS_GET_FILE_SIZE);
  ipcMain.removeHandler(IPC_CHANNELS.LOGS_GET_DISK_SPACE);

  // Cleanup service instances
  if (aiService) {
    await aiService.shutdown();
    aiService = null;
  }
  settingsService = null;

  // Wave 10.3.3 - Cleanup RAG services
  vectorService = null;
  ragService = null;
  ragInitPromise = null;

  logger.info('[AI Handlers] AI and settings IPC handlers unregistered');
}
