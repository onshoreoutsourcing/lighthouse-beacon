import type { AIStatus } from '@shared/types';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null; // Will be AIChatClient from AIChatSDK
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
  initialize(config: AIServiceConfig): void {
    try {
      // NOTE: AIChatSDK import will be configured in tsconfig/vite
      // For now, this is a placeholder that will be replaced with actual SDK
      // const { AIChatClient, ClaudeProvider } = await import('AIChatSDK');

      // Temporary implementation until AIChatSDK is integrated
      // eslint-disable-next-line no-console
      console.log('[AIService] Initialize called with config:', {
        model: config.model || 'claude-3-sonnet-20240229',
        socEndpoint: config.socEndpoint || 'not configured',
        hasApiKey: !!config.apiKey,
      });

      // TODO: Replace with actual AIChatSDK initialization
      // const provider = new ClaudeProvider({
      //   apiKey: config.apiKey,
      //   model: config.model || 'claude-3-sonnet-20240229',
      // });

      // const socConfig = {
      //   enabled: true,
      //   endpoint: config.socEndpoint || process.env.LIGHTHOUSE_SOC_ENDPOINT,
      // };

      // this.client = new AIChatClient({
      //   provider,
      //   soc: socConfig,
      // });

      // Validate connection with minimal request
      // await this.client.validateConnection();

      this.status = {
        initialized: true,
        provider: 'anthropic',
        model: config.model || 'claude-3-sonnet-20240229',
        error: null,
      };
    } catch (error) {
      this.status = {
        initialized: false,
        provider: null,
        model: null,
        error: this.formatError(error),
      };
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
  sendMessage(message: string, options?: SendMessageOptions): string {
    if (!this.client) {
      throw new Error('AI service not initialized. Please configure your API key.');
    }

    try {
      // TODO: Replace with actual AIChatSDK call
      // const response = await this.client.chat({
      //   message,
      //   conversationId: options?.conversationId,
      //   systemPrompt: options?.systemPrompt,
      // });
      // return response.content;

      // Temporary mock response
      // eslint-disable-next-line no-console
      console.log('[AIService] sendMessage called:', { message, options });
      return `Mock response to: ${message}`;
    } catch (error) {
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
  streamMessage(message: string, callbacks: StreamCallbacks, options?: SendMessageOptions): void {
    if (!this.client) {
      throw new Error('AI service not initialized. Please configure your API key.');
    }

    this.currentAbortController = new AbortController();

    try {
      // TODO: Replace with actual AIChatSDK streaming
      // const stream = this.client.streamChat({
      //   message,
      //   conversationId: options?.conversationId,
      //   systemPrompt: options?.systemPrompt,
      //   signal: this.currentAbortController.signal,
      // });

      // let fullResponse = '';
      // for await (const chunk of stream) {
      //   fullResponse += chunk;
      //   callbacks.onToken(chunk);
      // }
      // callbacks.onComplete(fullResponse);

      // Temporary mock streaming
      // eslint-disable-next-line no-console
      console.log('[AIService] streamMessage called:', { message, options });
      const mockResponse = `Mock streaming response to: ${message}`;
      const tokens = mockResponse.split(' ');

      for (const token of tokens) {
        if (this.currentAbortController.signal.aborted) {
          return;
        }
        callbacks.onToken(token + ' ');
        // Simulate streaming delay (disabled for testing)
        // await new Promise((resolve) => setTimeout(resolve, 50));
      }

      callbacks.onComplete(mockResponse);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, not an error
        return;
      }
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
  shutdown(): void {
    this.cancelCurrentRequest();
    if (this.client) {
      // TODO: Call actual disconnect when AIChatSDK is integrated
      // await this.client.disconnect();
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
