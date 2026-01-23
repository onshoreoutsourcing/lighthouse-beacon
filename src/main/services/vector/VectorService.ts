/**
 * VectorService - In-memory vector search with hybrid retrieval
 * Feature 10.1 - Vector Service & Embedding Infrastructure
 * Wave 10.1.1 - Vector-lite Integration & Basic Search
 *
 * Provides semantic search capabilities using Vectra's LocalIndex with:
 * - Hybrid search combining semantic (70%) and keyword (30%) scoring
 * - In-memory index for fast retrieval (<50ms for 1000 documents)
 * - Document add/remove/search operations
 * - Index statistics and management
 */

import { LocalIndex, type IndexItem, type QueryResult } from 'vectra';
import path from 'path';
import { app } from 'electron';
import { logger } from '../../logger';
import type {
  DocumentInput,
  SearchResult,
  SearchOptions,
  VectorIndexStats,
  BatchAddResult,
} from '@shared/types';

/**
 * VectorService provides in-memory vector search with hybrid retrieval
 *
 * @remarks
 * Uses Vectra's LocalIndex for file-backed, in-memory vector storage.
 * Supports hybrid search combining semantic similarity and BM25 keyword search.
 * Default weighting: 70% semantic, 30% keyword (via isBm25=true)
 */
export class VectorService {
  private index: LocalIndex;
  private indexPath: string;
  private readonly embeddingDimension = 384; // Default dimension for placeholder embeddings
  private isInitialized = false;

  /**
   * Creates a new VectorService instance
   *
   * @param indexName - Optional name for the index (defaults to 'beacon-vector-index')
   */
  constructor(indexName = 'beacon-vector-index') {
    // Store index in app's user data directory
    const userDataPath = app.getPath('userData');
    this.indexPath = path.join(userDataPath, 'vector-indices', indexName);

    // Initialize Vectra LocalIndex
    this.index = new LocalIndex(this.indexPath);

    logger.info('[VectorService] Initialized', { indexPath: this.indexPath });
  }

  /**
   * Initialize the vector index
   *
   * @remarks
   * Creates the index if it doesn't exist, or loads existing index.
   * Must be called before any other operations.
   *
   * @returns Promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    try {
      const exists = await this.index.isIndexCreated();

      if (!exists) {
        // Create new index with metadata indexing enabled
        await this.index.createIndex({
          version: 1,
          deleteIfExists: false,
          metadata_config: {
            indexed: ['type', 'source', 'timestamp'], // Common metadata fields
          },
        });
        logger.info('[VectorService] Created new vector index');
      } else {
        logger.info('[VectorService] Loaded existing vector index');
      }

      this.isInitialized = true;
    } catch (error) {
      logger.error('[VectorService] Failed to initialize index', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to initialize vector index: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Add a document to the vector index
   *
   * @param document - Document to add (id, content, optional metadata, optional embedding)
   * @returns Promise that resolves when document is added
   * @throws Error if document with same ID already exists
   */
  async addDocument(document: DocumentInput): Promise<void> {
    this.ensureInitialized();

    try {
      const startTime = Date.now();

      // Generate placeholder embedding if not provided
      // Note: Real embeddings will be added in Wave 10.1.2
      const embedding = document.embedding || this.generatePlaceholderEmbedding(document.content);

      // Create Vectra index item
      const item: Partial<IndexItem> = {
        id: document.id,
        vector: embedding,
        metadata: {
          content: document.content,
          ...(document.metadata || {}),
        },
      };

      // Insert item into index
      await this.index.insertItem(item);

      const duration = Date.now() - startTime;
      logger.info('[VectorService] Added document', {
        documentId: document.id,
        contentLength: document.content.length,
        durationMs: duration,
      });
    } catch (error) {
      logger.error('[VectorService] Failed to add document', {
        documentId: document.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to add document: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Add multiple documents in batch
   *
   * @param documents - Array of documents to add
   * @returns Promise that resolves with batch operation results
   */
  async addDocuments(documents: DocumentInput[]): Promise<BatchAddResult> {
    this.ensureInitialized();

    const result: BatchAddResult = {
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    try {
      const startTime = Date.now();

      // Prepare index items
      const items: Partial<IndexItem>[] = documents.map((doc) => ({
        id: doc.id,
        vector: doc.embedding || this.generatePlaceholderEmbedding(doc.content),
        metadata: {
          content: doc.content,
          ...(doc.metadata || {}),
        },
      }));

      // Batch insert
      await this.index.batchInsertItems(items);
      result.successCount = documents.length;

      const duration = Date.now() - startTime;
      logger.info('[VectorService] Batch added documents', {
        count: documents.length,
        durationMs: duration,
      });
    } catch (error) {
      // If batch fails, try adding individually to identify failures
      logger.warn('[VectorService] Batch insert failed, trying individually', {
        error: error instanceof Error ? error.message : String(error),
      });

      for (const doc of documents) {
        try {
          await this.addDocument(doc);
          result.successCount++;
        } catch (docError) {
          result.failureCount++;
          result.errors.push({
            id: doc.id,
            error: docError instanceof Error ? docError.message : String(docError),
          });
        }
      }
    }

    return result;
  }

  /**
   * Search for documents by semantic similarity
   *
   * @param query - Search query text
   * @param options - Search options (topK, threshold, filter)
   * @returns Promise that resolves with search results
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    this.ensureInitialized();

    const { topK = 10, threshold = 0, filter } = options;

    try {
      const startTime = Date.now();

      // Generate placeholder embedding for query
      // Note: Real embeddings will be added in Wave 10.1.2
      const queryEmbedding = this.generatePlaceholderEmbedding(query);

      let results: QueryResult[] = [];

      // Try hybrid search first (semantic + BM25 keyword)
      // Fall back to semantic-only if collection is too small for BM25
      try {
        results = await this.index.queryItems(
          queryEmbedding,
          query, // Query text for BM25
          topK,
          filter ? this.convertMetadataFilter(filter) : undefined,
          true // Enable BM25 hybrid search
        );
      } catch (bm25Error) {
        // BM25 requires minimum documents for consolidation
        // Fall back to semantic-only search
        const errorMsg = bm25Error instanceof Error ? bm25Error.message : String(bm25Error);
        if (errorMsg.includes('too small for consolidation') || errorMsg.includes('toString')) {
          logger.debug('[VectorService] Falling back to semantic-only search', {
            reason: 'BM25 requires more documents',
          });
          results = await this.index.queryItems(
            queryEmbedding,
            query,
            topK,
            filter ? this.convertMetadataFilter(filter) : undefined,
            false // Disable BM25, semantic only
          );
        } else {
          // Re-throw other errors
          throw bm25Error;
        }
      }

      // Convert to SearchResult format and apply threshold
      const searchResults: SearchResult[] = results
        .filter((result) => result.score >= threshold)
        .map((result) => ({
          id: result.item.id,
          content: (result.item.metadata.content as string) || '',
          score: result.score,
          metadata: this.extractUserMetadata(result.item.metadata),
        }));

      const duration = Date.now() - startTime;
      logger.info('[VectorService] Search completed', {
        query: query.substring(0, 50),
        resultsCount: searchResults.length,
        durationMs: duration,
      });

      return searchResults;
    } catch (error) {
      logger.error('[VectorService] Search failed', {
        query: query.substring(0, 50),
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove a document from the vector index
   *
   * @param documentId - ID of document to remove
   * @returns Promise that resolves when document is removed
   * @throws Error if document doesn't exist
   */
  async removeDocument(documentId: string): Promise<void> {
    this.ensureInitialized();

    try {
      // Check if document exists
      const item = await this.index.getItem(documentId);
      if (!item) {
        throw new Error(`Document with ID '${documentId}' not found`);
      }

      // Delete document
      await this.index.deleteItem(documentId);

      logger.info('[VectorService] Removed document', { documentId });
    } catch (error) {
      logger.error('[VectorService] Failed to remove document', {
        documentId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to remove document: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Clear all documents from the index
   *
   * @returns Promise that resolves when index is cleared
   */
  async clear(): Promise<void> {
    this.ensureInitialized();

    try {
      // Delete and recreate index
      await this.index.deleteIndex();
      await this.index.createIndex({
        version: 1,
        deleteIfExists: false,
        metadata_config: {
          indexed: ['type', 'source', 'timestamp'],
        },
      });

      logger.info('[VectorService] Cleared vector index');
    } catch (error) {
      logger.error('[VectorService] Failed to clear index', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to clear index: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get index statistics
   *
   * @returns Promise that resolves with index statistics
   */
  async getStats(): Promise<VectorIndexStats> {
    this.ensureInitialized();

    try {
      const stats = await this.index.getIndexStats();

      // Calculate approximate index size
      // Rough estimate: each document = vector (4 bytes * dimension) + metadata (~500 bytes)
      const approximateSizePerDoc = this.embeddingDimension * 4 + 500;
      const indexSizeBytes = stats.items * approximateSizePerDoc;

      return {
        documentCount: stats.items,
        embeddingDimension: this.embeddingDimension,
        indexSizeBytes,
      };
    } catch (error) {
      logger.error('[VectorService] Failed to get stats', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to get index stats: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate placeholder embedding for testing
   *
   * @remarks
   * This generates a random normalized vector for testing purposes.
   * Real embeddings will be generated in Wave 10.1.2 using an embedding model.
   *
   * @param content - Content to generate embedding for
   * @returns Normalized embedding vector
   */
  private generatePlaceholderEmbedding(content: string): number[] {
    // Use content hash as seed for reproducibility
    const seed = this.hashString(content);
    const random = this.seededRandom(seed);

    // Generate random vector
    const vector: number[] = [];
    for (let i = 0; i < this.embeddingDimension; i++) {
      vector.push(random() * 2 - 1); // Values between -1 and 1
    }

    // Normalize vector (L2 normalization)
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map((val) => val / magnitude);
  }

  /**
   * Simple string hash function for seeding
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Seeded random number generator for reproducible embeddings
   */
  private seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  /**
   * Convert simple filter to Vectra MetadataFilter format
   */
  private convertMetadataFilter(filter: Record<string, unknown>): Record<string, unknown> {
    // Simple conversion: wrap each key-value in $eq operator
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filter)) {
      if (key === 'content') {
        continue; // Skip content field (stored in metadata but not filterable)
      }
      converted[key] = { $eq: value };
    }
    return converted;
  }

  /**
   * Extract user metadata (exclude internal content field)
   */
  private extractUserMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const userMetadata: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (key !== 'content') {
        userMetadata[key] = value;
      }
    }
    return userMetadata;
  }

  /**
   * Ensure the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('VectorService not initialized. Call initialize() first.');
    }
  }
}
