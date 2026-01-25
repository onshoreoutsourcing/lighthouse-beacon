/**
 * RAG (Retrieval-Augmented Generation) IPC Handlers
 * Feature 10.3 - RAG Pipeline & Context Retrieval
 * Wave 10.3.2 - Context Retrieval & Budget Management
 *
 * Provides IPC bridge between renderer process and RAGService.
 * Handles context retrieval operations with relevance filtering and budget management.
 */

import { ipcMain } from 'electron';
import type { Result } from '@shared/types';
import { RAG_CHANNELS } from '@shared/types';
import type { RetrievedContext, RetrievalOptions } from '../services/rag/types';
import { RAGService } from '../services/rag/RAGService';
import { VectorService } from '../services/vector/VectorService';
import { logger } from '../logger';

/**
 * Singleton service instances
 */
let vectorService: VectorService | null = null;
let ragService: RAGService | null = null;
let initializationPromise: Promise<void> | null = null;

/**
 * Get or create service instances and ensure they're initialized
 */
async function getServices(): Promise<{ ragService: RAGService; vectorService: VectorService }> {
  if (!vectorService || !ragService) {
    // Create VectorService first
    vectorService = new VectorService();

    // Initialize VectorService
    initializationPromise = vectorService.initialize().catch((error: unknown) => {
      logger.error('[RAGHandlers] Failed to initialize VectorService', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    });

    await initializationPromise;

    // Create RAGService with initialized VectorService
    ragService = new RAGService(vectorService);

    logger.info('[RAGHandlers] Services initialized');
  }

  // Wait for any ongoing initialization
  if (initializationPromise) {
    await initializationPromise;
  }

  // Both services are guaranteed to be non-null after initialization
  if (!ragService || !vectorService) {
    throw new Error('Services failed to initialize');
  }

  return { ragService, vectorService };
}

/**
 * Register RAG IPC handlers
 */
export function registerRAGHandlers(): void {
  /**
   * RAG_RETRIEVE_CONTEXT: Retrieve relevant context for a query
   * Wave 10.3.2 - Context Retrieval & Budget Management
   */
  ipcMain.handle(
    RAG_CHANNELS.RAG_RETRIEVE_CONTEXT,
    async (_event, ...args: unknown[]): Promise<Result<RetrievedContext>> => {
      // Extract and validate arguments
      const query = args[0] as string;
      const options = args[1] as RetrievalOptions | undefined;

      try {
        logger.debug('[RAGHandlers] Retrieve context request', { query, options });

        // Validate input
        if (!query || typeof query !== 'string') {
          const error = new Error('Query must be a non-empty string');
          logger.error('[RAGHandlers] Invalid query', { query });
          return { success: false, error };
        }

        if (query.trim().length === 0) {
          const error = new Error('Query cannot be empty');
          logger.error('[RAGHandlers] Empty query');
          return { success: false, error };
        }

        // Get services (will initialize if needed)
        const { ragService: rag } = await getServices();

        // Retrieve context
        const context = await rag.retrieveContext(query, options);

        logger.info('[RAGHandlers] Context retrieved successfully', {
          query,
          chunksRetrieved: context.chunks.length,
          totalTokens: context.totalTokens,
          sourcesFound: context.sources.length,
        });

        return { success: true, data: context };
      } catch (error: unknown) {
        logger.error('[RAGHandlers] Failed to retrieve context', {
          query,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
        };
      }
    }
  );

  logger.info('[RAGHandlers] RAG IPC handlers registered');
}

/**
 * Unregister RAG IPC handlers
 */
export function unregisterRAGHandlers(): void {
  ipcMain.removeHandler(RAG_CHANNELS.RAG_RETRIEVE_CONTEXT);
  logger.info('[RAGHandlers] RAG IPC handlers unregistered');
}

/**
 * Export cleanup function for testing
 */
export function resetRAGHandlers(): void {
  vectorService = null;
  ragService = null;
  initializationPromise = null;
}
