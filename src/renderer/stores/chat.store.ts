/**
 * Chat Store
 *
 * Manages chat interface state including message history, loading states, and AI communication.
 * Integrates with AIService via IPC for sending messages and receiving responses.
 *
 * Features:
 * - Message history management
 * - Streaming and non-streaming message support
 * - Loading and error states
 * - Integration with Feature 2.1 AIService
 * - Unique message IDs with timestamps
 */

import { create } from 'zustand';

/**
 * Message roles
 */
export type MessageRole = 'user' | 'assistant';

/**
 * Message status
 */
export type MessageStatus = 'sending' | 'streaming' | 'complete' | 'error';

/**
 * Represents a single chat message
 */
export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  /** Message role (user or assistant) */
  role: MessageRole;
  /** Message content */
  content: string;
  /** Message timestamp */
  timestamp: Date;
  /** Message status */
  status: MessageStatus;
  /** Error message if status is 'error' */
  error?: string;
}

/**
 * Chat state interface
 */
interface ChatState {
  // State
  /** Array of chat messages */
  messages: ChatMessage[];
  /** Currently streaming message ID */
  streamingMessageId: string | null;
  /** Loading state during AI initialization */
  isInitializing: boolean;
  /** Is AI service initialized */
  isInitialized: boolean;
  /** Error message from failed operations */
  error: string | null;

  // Actions
  /** Initialize AI service */
  initializeAI: () => Promise<void>;
  /** Send a message to AI */
  sendMessage: (content: string) => Promise<void>;
  /** Cancel current streaming request */
  cancelStreaming: () => Promise<void>;
  /** Clear all messages */
  clearMessages: () => void;
  /** Clear error state */
  clearError: () => void;
  /** Reset store to initial state */
  reset: () => void;
}

/**
 * Generate unique message ID
 */
const generateMessageId = (): string => {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Chat store for managing message history and AI communication
 */
export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  streamingMessageId: null,
  isInitializing: false,
  isInitialized: false,
  error: null,

  /**
   * Initialize AI service
   * Must be called before sending messages
   */
  initializeAI: async () => {
    const { isInitialized } = get();

    // Already initialized, skip
    if (isInitialized) {
      return;
    }

    set({ isInitializing: true, error: null });

    try {
      const result = await window.electronAPI.ai.initialize();

      if (!result.success) {
        set({
          isInitializing: false,
          isInitialized: false,
          error: result.error.message || 'Failed to initialize AI service',
        });
        return;
      }

      set({
        isInitializing: false,
        isInitialized: true,
        error: null,
      });
    } catch (err) {
      set({
        isInitializing: false,
        isInitialized: false,
        error: err instanceof Error ? err.message : 'Failed to initialize AI service',
      });
    }
  },

  /**
   * Send a message to AI
   * Creates user message immediately and streams AI response
   *
   * @param content - Message content to send
   */
  sendMessage: async (content: string) => {
    const { messages, isInitialized } = get();

    // Validate AI is initialized
    if (!isInitialized) {
      set({ error: 'AI service not initialized. Please wait...' });
      return;
    }

    // Validate content
    if (!content.trim()) {
      set({ error: 'Message cannot be empty' });
      return;
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'complete',
    };

    // Create placeholder assistant message
    const assistantMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      status: 'streaming',
    };

    // Add both messages to state
    set({
      messages: [...messages, userMessage, assistantMessage],
      streamingMessageId: assistantMessage.id,
      error: null,
    });

    // Set up streaming event listeners
    let fullResponse = '';

    const cleanupListeners: Array<() => void> = [];

    const onToken = (token: string) => {
      fullResponse += token;
      const currentMessages = get().messages;
      const updatedMessages = currentMessages.map((msg) =>
        msg.id === assistantMessage.id
          ? {
              ...msg,
              content: fullResponse,
              status: 'streaming' as MessageStatus,
            }
          : msg
      );
      set({ messages: updatedMessages });
    };

    const onComplete = (response: string) => {
      fullResponse = response;
      const currentMessages = get().messages;
      const updatedMessages = currentMessages.map((msg) =>
        msg.id === assistantMessage.id
          ? {
              ...msg,
              content: fullResponse,
              status: 'complete' as MessageStatus,
            }
          : msg
      );
      set({
        messages: updatedMessages,
        streamingMessageId: null,
      });

      // Cleanup listeners
      cleanupListeners.forEach((cleanup) => cleanup());
    };

    const onError = (errorMessage: string) => {
      const currentMessages = get().messages;
      const updatedMessages = currentMessages.map((msg) =>
        msg.id === assistantMessage.id
          ? {
              ...msg,
              status: 'error' as MessageStatus,
              error: errorMessage,
            }
          : msg
      );
      set({
        messages: updatedMessages,
        streamingMessageId: null,
        error: errorMessage,
      });

      // Cleanup listeners
      cleanupListeners.forEach((cleanup) => cleanup());
    };

    // Register event listeners
    cleanupListeners.push(window.electronAPI.ai.onStreamToken(onToken));
    cleanupListeners.push(window.electronAPI.ai.onStreamComplete(onComplete));
    cleanupListeners.push(window.electronAPI.ai.onStreamError(onError));

    try {
      // Start streaming
      const result = await window.electronAPI.ai.streamMessage(content.trim());

      if (!result.success) {
        onError(result.error.message || 'Failed to send message');
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to send message');
    }
  },

  /**
   * Cancel current streaming request
   */
  cancelStreaming: async () => {
    const { streamingMessageId, messages } = get();

    if (!streamingMessageId) {
      return;
    }

    try {
      await window.electronAPI.ai.cancel();

      // Mark streaming message as complete (partial)
      const updatedMessages = messages.map((msg) =>
        msg.id === streamingMessageId
          ? {
              ...msg,
              status: 'complete' as MessageStatus,
              content: msg.content + ' [cancelled]',
            }
          : msg
      );

      set({
        messages: updatedMessages,
        streamingMessageId: null,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to cancel request',
      });
    }
  },

  /**
   * Clear all messages
   */
  clearMessages: () => {
    set({
      messages: [],
      streamingMessageId: null,
      error: null,
    });
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set({
      messages: [],
      streamingMessageId: null,
      isInitializing: false,
      isInitialized: false,
      error: null,
    });
  },
}));
