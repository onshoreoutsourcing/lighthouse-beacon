/**
 * RAGService - Retrieval-Augmented Generation service
 * Feature 10.3 - RAG Pipeline & Context Retrieval
 * Wave 10.3.2 - Context Retrieval & Budget Management
 *
 * Provides context retrieval from vector index with relevance filtering,
 * budget management, and source attribution.
 */

import type { VectorService } from '../vector/VectorService';
import { ContextBuilder } from './ContextBuilder';
import { TokenCounter } from './TokenCounter';
import { logger } from '../../logger';
import type { RetrievedChunk, RetrievedContext, RetrievalOptions } from './types';
import type { SearchResult } from '@shared/types';

/**
 * RAGService provides context retrieval with relevance filtering and budget management
 *
 * @remarks
 * - Default top-K: 5 results
 * - Default relevance threshold: 0.3
 * - Default token budget: 4000 tokens
 * - Target retrieval time: <100ms
 */
export class RAGService {
  private static readonly DEFAULT_TOP_K = 5;
  private static readonly DEFAULT_MIN_SCORE = 0.3;
  private static readonly DEFAULT_MAX_TOKENS = 4000;

  /**
   * Creates a new RAGService instance
   *
   * @param vectorService - VectorService instance for search operations
   */
  constructor(private vectorService: VectorService) {
    logger.info('[RAGService] Initialized');
  }

  /**
   * Retrieve relevant context for a query
   *
   * @param query - Search query string
   * @param options - Retrieval options
   * @returns Retrieved context with chunks, sources, and formatted text
   */
  async retrieveContext(query: string, options?: RetrievalOptions): Promise<RetrievedContext> {
    const startTime = Date.now();

    const {
      topK = RAGService.DEFAULT_TOP_K,
      minScore = RAGService.DEFAULT_MIN_SCORE,
      maxTokens = RAGService.DEFAULT_MAX_TOKENS,
      includeSources = true,
    } = options || {};

    try {
      // Search vector index for relevant chunks
      const searchResults = await this.vectorService.search(query, {
        topK,
        threshold: minScore,
      });

      logger.debug('[RAGService] Search results', {
        query,
        resultCount: searchResults.length,
      });

      // Convert search results to retrieved chunks
      const chunks = this.convertToRetrievedChunks(searchResults);

      // Build context within token budget
      const context = ContextBuilder.buildContext(chunks, {
        maxTokens,
        includeCitations: includeSources,
        format: 'plain',
      });

      const duration = Date.now() - startTime;

      logger.info('[RAGService] Retrieved context', {
        query,
        chunksRetrieved: chunks.length,
        chunksUsed: context.chunks.length,
        totalTokens: context.totalTokens,
        durationMs: duration,
      });

      // Verify performance target (<100ms)
      if (duration > 100) {
        logger.warn('[RAGService] Retrieval exceeded 100ms target', {
          durationMs: duration,
          resultCount: searchResults.length,
        });
      }

      return context;
    } catch (error) {
      logger.error('[RAGService] Failed to retrieve context', {
        query,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return empty context on error
      return {
        chunks: [],
        sources: [],
        contextText: '',
        totalTokens: 0,
        budgetUsed: 0,
        budgetAvailable: maxTokens,
      };
    }
  }

  /**
   * Convert vector search results to retrieved chunks
   *
   * @param searchResults - Raw search results from vector service
   * @returns Retrieved chunks with metadata
   */
  private convertToRetrievedChunks(searchResults: SearchResult[]): RetrievedChunk[] {
    return searchResults.map((result) => {
      // Extract chunk metadata from result metadata
      const metadata = result.metadata || {};

      // Count tokens in content
      const tokens = TokenCounter.countAuto(result.content).tokens;

      // Extract chunk-specific metadata (Wave 10.3.1 integration)
      const originalDocumentId = metadata.originalDocumentId as string | undefined;
      const chunkIndex = metadata.chunkIndex as number | undefined;
      const totalChunks = metadata.totalChunks as number | undefined;
      const startLine = (metadata.startLine as number | undefined) || 1;
      const endLine = (metadata.endLine as number | undefined) || 1;
      const filePath = (metadata.filePath as string | undefined) || result.id;

      return {
        id: result.id,
        content: result.content,
        score: result.score,
        tokens,
        filePath,
        startLine,
        endLine,
        originalDocumentId,
        chunkIndex,
        totalChunks,
      };
    });
  }

  /**
   * Check if vector service is ready for queries
   *
   * @returns True if ready, false otherwise
   */
  isReady(): boolean {
    // VectorService doesn't expose isReady, so we assume it's ready if initialized
    return true;
  }
}
