/**
 * useChatRAG Hook
 * Wave 10.4.1 - User Story 2: RAG-Augmented Chat Flow
 * Wave 10.4.1 - User Story 4: Non-Blocking Streaming Integration
 *
 * Handles RAG-augmented message flow with automatic context retrieval.
 * Ensures retrieval doesn't block UI and completes within performance budget.
 *
 * Features:
 * - Automatic context retrieval before sending message
 * - Non-blocking retrieval (async)
 * - Performance: <200ms overhead
 * - Error handling with graceful fallback
 * - Search state management
 * - Returns context metadata for source citations
 */

import { useState } from 'react';
import type { RetrievedContext, RetrievalOptions } from '@shared/types';

export interface UseChatRAGOptions {
  /** Whether RAG is enabled */
  ragEnabled: boolean;
  /** Number of indexed documents */
  documentCount: number;
  /** Optional retrieval options */
  retrievalOptions?: RetrievalOptions;
}

export interface UseChatRAGResult {
  /** Whether context retrieval is in progress */
  isSearching: boolean;
  /** Error message if retrieval failed */
  error: string | null;
  /** Send message with RAG context retrieval */
  sendMessageWithRAG: (
    message: string,
    options: UseChatRAGOptions
  ) => Promise<RetrievedContext | null>;
}

/**
 * Hook for RAG-augmented chat message flow
 */
export function useChatRAG(): UseChatRAGResult {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send message with RAG context retrieval
   *
   * @param message - User message to send
   * @param options - RAG options (enabled, document count, retrieval options)
   * @returns Retrieved context metadata or null if RAG disabled/failed
   */
  const sendMessageWithRAG = async (
    message: string,
    options: UseChatRAGOptions
  ): Promise<RetrievedContext | null> => {
    // Clear previous error
    setError(null);

    // Skip retrieval if RAG disabled or no documents
    if (!options.ragEnabled || options.documentCount === 0) {
      // Send message without RAG
      await window.electronAPI.ai.streamMessage(message);
      return null;
    }

    try {
      // Start retrieval (set searching state)
      setIsSearching(true);

      const startTime = Date.now();

      // Retrieve context from RAG service
      const result: Result<RetrievedContext> = await window.electronAPI.rag.retrieveContext(
        message,
        options.retrievalOptions
      );

      const duration = Date.now() - startTime;

      // Log performance (should be <200ms)
      if (duration > 200) {
        console.warn(`[useChatRAG] Retrieval took ${duration}ms (exceeds 200ms budget)`);
      }

      if (!result.success) {
        const errorMessage = result.error.message || 'Failed to retrieve context';
        setError(errorMessage);
        setIsSearching(false);
        return null;
      }

      const context = result.data;

      // Send message with RAG context
      await window.electronAPI.ai.streamMessage(message, {
        useRAG: true,
        ragOptions: {
          topK: options.retrievalOptions?.topK,
          minScore: options.retrievalOptions?.minScore,
          maxTokens: options.retrievalOptions?.maxTokens,
          includeSources: options.retrievalOptions?.includeSources,
        },
      });

      setIsSearching(false);
      return context;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during retrieval';
      setError(errorMessage);
      setIsSearching(false);
      return null;
    }
  };

  return {
    isSearching,
    error,
    sendMessageWithRAG,
  };
}
