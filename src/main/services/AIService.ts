import type { AIStatus } from '@shared/types';
import { AIChatSDK } from '@ai-chat-sdk/core/typescript';
import type { AIChatConfig, ChatMessage, ChatResponse } from '@ai-chat-sdk/core/typescript';
import { logger } from '@main/logger';

/**
 * AIService Configuration
 */
export interface AIServiceConfig {
  apiKey: string;
  model?: string;
  socEndpoint?: string;
}

/**
 * Message sending options
 */
export interface SendMessageOptions {
  conversationId?: string;
  systemPrompt?: string;
}

/**
 * Streaming callbacks
 */
export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

/**
 * AIService
 *
 * Wraps AIChatSDK with application-specific logic for AI communication.
 * Manages Claude provider, SOC logging, and request lifecycle.
 *
 * Features:
 * - Claude provider configuration
 * - Streaming and non-streaming messages
 * - Request cancellation with AbortController
 * - Connection state management
 * - Automatic SOC logging
 * - User-friendly error messages
 *
 * Security:
 * - API key never logged
 * - All requests go through AIChatSDK with SOC traceability
 * - Proper error sanitization
 *
 * @example
 * const service = new AIService();
 * await service.initialize({ apiKey: 'sk-ant-...', socEndpoint: 'https://soc.example.com' });
 * const response = await service.sendMessage('Hello, Claude!');
 */
export class AIService {
  private client: AIChatSDK | null = null;
  private currentAbortController: AbortController | null = null;
  private status: AIStatus = {
    initialized: false,
    provider: null,
    model: null,
    error: null,
  };

  /**
   * Initialize AI service with API key and configuration
   *
   * @param config - Service configuration including API key
   * @throws Error if initialization fails
   */
  async initialize(config: AIServiceConfig): Promise<void> {
    try {
      logger.info('[AIService] Initialize called with config', {
        model: config.model || 'claude-sonnet-4-5-20250929',
        socEndpoint: config.socEndpoint || 'not configured',
        hasApiKey: !!config.apiKey,
      });

      // Build SDK configuration
      const sdkConfig: AIChatConfig = {
        provider: 'anthropic',
        providerConfig: {
          apiKey: config.apiKey,
          model: config.model || 'claude-sonnet-4-5-20250929',
          maxTokens: 4096,
        },
      };

      // Add SOC configuration if endpoint provided
      if (config.socEndpoint) {
        sdkConfig.socConfig = {
          apiUrl: config.socEndpoint,
          apiKey: config.apiKey, // Using same API key for SOC (can be configured differently)
          projectId: 'lighthouse-beacon',
        };
      }

      // Create and initialize SDK client
      this.client = new AIChatSDK(sdkConfig);
      await this.client.initialize();

      this.status = {
        initialized: true,
        provider: 'anthropic',
        model: config.model || 'claude-sonnet-4-5-20250929',
        error: null,
      };

      logger.info('[AIService] Successfully initialized AIChatSDK', {
        provider: 'anthropic',
        model: this.status.model,
      });
    } catch (error) {
      this.status = {
        initialized: false,
        provider: null,
        model: null,
        error: this.formatError(error),
      };
      // Extract full error chain for debugging
      const errorChain: Array<{
        message: string;
        name: string;
        statusCode?: number;
        code?: string;
        context?: unknown;
        responseStatus?: number;
        responseData?: unknown;
      }> = [];

      let currentError = error;
      while (currentError && typeof currentError === 'object') {
        const err = currentError as Record<string, unknown>;
        const errorInfo: {
          message: string;
          name: string;
          statusCode?: number;
          code?: string;
          context?: unknown;
          responseStatus?: number;
          responseData?: unknown;
        } = {
          message: typeof err.message === 'string' ? err.message : 'Unknown error',
          name: typeof err.name === 'string' ? err.name : 'Error',
        };

        // Include HTTP-specific details if available
        if (typeof err.statusCode === 'number') {
          errorInfo.statusCode = err.statusCode;
        }
        if (typeof err.code === 'string') {
          errorInfo.code = err.code;
        }
        if (err.context !== undefined) {
          errorInfo.context = err.context;
        }
        if (err.response && typeof err.response === 'object') {
          const response = err.response as Record<string, unknown>;
          if (typeof response.status === 'number') {
            errorInfo.responseStatus = response.status;
          }
          if (response.data !== undefined) {
            errorInfo.responseData = response.data;
          }
        }

        errorChain.push(errorInfo);
        currentError = err.cause;
      }

      logger.error('[AIService] Initialization failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorChain,
      });
      throw error;
    }
  }

  /**
   * Send a non-streaming message to Claude
   *
   * @param message - Message to send
   * @param options - Optional conversation ID and system prompt
   * @returns AI response as string
   * @throws Error if service not initialized or request fails
   */
  async sendMessage(message: string, options?: SendMessageOptions): Promise<string> {
    if (!this.status.initialized || !this.client) {
      throw new Error('AI service not initialized. Please configure your API key.');
    }

    const startTime = Date.now();

    try {
      // Build message history
      const messages: ChatMessage[] = [];

      // Add system prompt if provided
      if (options?.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: message,
      });

      // Send to SDK
      const response: ChatResponse = await this.client.chat(messages);

      const duration = Date.now() - startTime;

      // Warn if response time is slow
      if (duration > 5000) {
        logger.warn('[AIService] Slow AI response detected', {
          duration,
          threshold: 5000,
          contentLength: response.content.length,
          usage: response.usage,
        });
      } else {
        logger.debug('[AIService] Received response from AIChatSDK', {
          duration,
          contentLength: response.content.length,
          usage: response.usage,
        });
      }

      return response.content;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('[AIService] sendMessage failed', {
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(this.formatError(error));
    }
  }

  /**
   * Stream a message to Claude with progressive token delivery
   *
   * @param message - Message to send
   * @param callbacks - Callbacks for token, complete, and error events
   * @param options - Optional conversation ID and system prompt
   */
  async streamMessage(
    message: string,
    callbacks: StreamCallbacks,
    options?: SendMessageOptions
  ): Promise<void> {
    if (!this.status.initialized || !this.client) {
      throw new Error('AI service not initialized. Please configure your API key.');
    }

    this.currentAbortController = new AbortController();
    const startTime = Date.now();
    let chunkCount = 0;
    let totalChunkSize = 0;

    try {
      // Build message history
      const messages: ChatMessage[] = [];

      // Add system prompt if provided
      if (options?.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      // Add user message
      messages.push({
        role: 'user',
        content: message,
      });

      // Stream from SDK
      let fullResponse = '';
      const stream = this.client.streamChat(messages);

      for await (const chunk of stream) {
        // Check for abort
        if (this.currentAbortController.signal.aborted) {
          logger.debug('[AIService] Stream aborted by user');
          return;
        }

        // Track streaming metrics
        chunkCount++;
        totalChunkSize += chunk.content.length;

        // Accumulate response
        fullResponse += chunk.content;

        // Send token to callback
        callbacks.onToken(chunk.content);

        // If this is the final chunk, we're done
        if (chunk.done || chunk.isComplete) {
          break;
        }
      }

      const duration = Date.now() - startTime;
      const averageChunkSize = chunkCount > 0 ? totalChunkSize / chunkCount : 0;

      // Warn if streaming took too long
      if (duration > 5000) {
        logger.warn('[AIService] Slow streaming response detected', {
          duration,
          threshold: 5000,
          totalLength: fullResponse.length,
          chunkCount,
          averageChunkSize: Math.round(averageChunkSize),
        });
      } else {
        logger.debug('[AIService] Stream complete', {
          duration,
          totalLength: fullResponse.length,
          chunkCount,
          averageChunkSize: Math.round(averageChunkSize),
        });
      }

      callbacks.onComplete(fullResponse);
    } catch (error) {
      const duration = Date.now() - startTime;
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, not an error
        logger.debug('[AIService] Stream cancelled', { duration });
        return;
      }
      logger.error('[AIService] Stream error', {
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      callbacks.onError(new Error(this.formatError(error)));
    } finally {
      this.currentAbortController = null;
    }
  }

  /**
   * Cancel the current AI request
   */
  cancelCurrentRequest(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
  }

  /**
   * Get current AI service status
   *
   * @returns Current status including initialization state
   */
  getStatus(): AIStatus {
    return { ...this.status };
  }

  /**
   * Shutdown AI service and cleanup resources
   */
  async shutdown(): Promise<void> {
    this.cancelCurrentRequest();
    if (this.client) {
      try {
        await this.client.destroy();
        logger.info('[AIService] Successfully shut down AIChatSDK');
      } catch (error) {
        logger.error('[AIService] Error during shutdown', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
      this.client = null;
    }
    this.status = {
      initialized: false,
      provider: null,
      model: null,
      error: null,
    };
  }

  /**
   * Format error messages for user consumption
   *
   * @param error - Error to format
   * @returns User-friendly error message
   * @private
   */
  private formatError(error: unknown): string {
    if (error instanceof Error) {
      // Authentication errors
      if (error.message.includes('401') || error.message.includes('authentication')) {
        return 'Invalid API key. Please check your Anthropic API key and try again.';
      }

      // Rate limiting
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return 'Rate limit exceeded. Please wait a moment before trying again.';
      }

      // Network errors
      if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
        return 'Network error. Please check your internet connection.';
      }

      // Timeout errors
      if (error.message.includes('timeout')) {
        return 'Request timed out. Please try again.';
      }

      return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
  }
}
