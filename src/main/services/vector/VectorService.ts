/**
 * VectorService - In-memory vector search with hybrid retrieval
 * Feature 10.1 - Vector Service & Embedding Infrastructure
 * Wave 10.1.1 - Vector-lite Integration & Basic Search
 * Wave 10.1.2 - Transformers.js Embedding Generation
 * Wave 10.1.3 - Memory Monitoring & Index Persistence
 *
 * Provides semantic search capabilities using Vectra's LocalIndex with:
 * - Hybrid search combining semantic (70%) and keyword (30%) scoring
 * - In-memory index for fast retrieval (<50ms for 1000 documents)
 * - Local embedding generation using Transformers.js
 * - Memory budget tracking and enforcement (500MB default)
 * - Document add/remove/search operations
 * - Index statistics and management
 */

import { LocalIndex, type IndexItem, type QueryResult } from 'vectra';
import path from 'path';
import { app } from 'electron';
import { logger } from '../../logger';
import { EmbeddingService } from './EmbeddingService';
import { MemoryMonitor } from './MemoryMonitor';
import { IndexPersistence, type PersistedDocument } from './IndexPersistence';
import type {
  DocumentInput,
  SearchResult,
  SearchOptions,
  VectorIndexStats,
  BatchAddResult,
  VectorMemoryStatus,
} from '@shared/types';

/**
 * VectorService provides in-memory vector search with hybrid retrieval
 *
 * @remarks
 * Uses Vectra's LocalIndex for file-backed, in-memory vector storage.
 * Supports hybrid search combining semantic similarity and BM25 keyword search.
 * Default weighting: 70% semantic, 30% keyword (via isBm25=true)
 * Memory tracking enforces 500MB budget with warnings at 80% and critical at 95%.
 */
export class VectorService {
  private index: LocalIndex;
  private indexPath: string;
  private readonly embeddingDimension = 384; // all-MiniLM-L6-v2 produces 384-dim embeddings
  private isInitialized = false;
  private embeddingService: EmbeddingService | null = null;
  private isEmbeddingServiceReady = false;
  private memoryMonitor: MemoryMonitor;
  private indexPersistence: IndexPersistence;

  /**
   * Creates a new VectorService instance
   *
   * @param indexName - Optional name for the index (defaults to 'beacon-vector-index')
   * @param memoryBudgetMB - Memory budget in MB (default: 500MB)
   */
  constructor(indexName = 'beacon-vector-index', memoryBudgetMB = 500) {
    // Store index in app's user data directory
    const userDataPath = app.getPath('userData');
    this.indexPath = path.join(userDataPath, 'vector-indices', indexName);

    // Initialize Vectra LocalIndex
    this.index = new LocalIndex(this.indexPath);

    // Initialize MemoryMonitor (Wave 10.1.3)
    this.memoryMonitor = new MemoryMonitor(memoryBudgetMB);

    // Initialize IndexPersistence (Wave 10.1.3)
    this.indexPersistence = new IndexPersistence();

    logger.info('[VectorService] Initialized', {
      indexPath: this.indexPath,
      memoryBudgetMB,
    });
  }

  /**
   * Initialize the vector index
   *
   * @remarks
   * Creates the index if it doesn't exist, or loads existing index.
   * Auto-loads persisted documents from disk (Wave 10.1.3).
   * EmbeddingService is initialized lazily on first use for faster startup.
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

      // Auto-load persisted documents (Wave 10.1.3)
      await this.loadPersistedDocuments();

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
   * Ensure embedding service is initialized
   *
   * @remarks
   * Lazy initialization - only loads model on first embedding request.
   * Subsequent calls return immediately if already initialized.
   *
   * @returns Promise that resolves when embedding service is ready
   */
  private async ensureEmbeddingService(): Promise<void> {
    if (this.isEmbeddingServiceReady && this.embeddingService) {
      return;
    }

    if (!this.embeddingService) {
      logger.info('[VectorService] Initializing EmbeddingService...');
      this.embeddingService = new EmbeddingService();
    }

    if (!this.isEmbeddingServiceReady) {
      await this.embeddingService.initialize();
      this.isEmbeddingServiceReady = true;
      logger.info('[VectorService] EmbeddingService ready');
    }
  }

  /**
   * Add a document to the vector index
   *
   * @param document - Document to add (id, content, optional metadata, optional embedding)
   * @returns Promise that resolves when document is added
   * @throws Error if document with same ID already exists or memory budget exceeded
   */
  async addDocument(document: DocumentInput): Promise<void> {
    this.ensureInitialized();

    try {
      const startTime = Date.now();

      // Track memory BEFORE adding to index (Wave 10.1.3)
      // This will throw if budget would be exceeded
      this.memoryMonitor.trackDocument(document.id, document.content, document.metadata);

      // Generate real embedding if not provided (Wave 10.1.2)
      let embedding: number[];
      if (document.embedding) {
        embedding = document.embedding;
      } else {
        await this.ensureEmbeddingService();
        embedding = await this.embeddingService!.generateEmbedding(document.content);
      }

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

      // Persist to disk (Wave 10.1.3)
      await this.saveDocumentsToDisk();

      const duration = Date.now() - startTime;
      const memoryStatus = this.memoryMonitor.getStatus();
      logger.info('[VectorService] Added document', {
        documentId: document.id,
        contentLength: document.content.length,
        durationMs: duration,
        memoryUsedMB: memoryStatus.usedMB,
        memoryStatus: memoryStatus.status,
      });
    } catch (error) {
      // If memory tracking failed, remove from tracking
      this.memoryMonitor.removeDocument(document.id);

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

      // Track memory for batch BEFORE adding (Wave 10.1.3)
      // This will throw if budget would be exceeded
      this.memoryMonitor.trackBatch(
        documents.map((doc) => ({
          id: doc.id,
          content: doc.content,
          metadata: doc.metadata,
        }))
      );

      // Ensure embedding service is ready
      await this.ensureEmbeddingService();

      // Generate embeddings for documents that don't have them (Wave 10.1.2)
      const textsToEmbed: string[] = [];
      const textIndices: number[] = [];

      documents.forEach((doc, index) => {
        if (!doc.embedding) {
          textsToEmbed.push(doc.content);
          textIndices.push(index);
        }
      });

      // Batch generate embeddings
      let generatedEmbeddings: number[][] = [];
      if (textsToEmbed.length > 0) {
        generatedEmbeddings = await this.embeddingService!.generateBatchEmbeddings(textsToEmbed);
      }

      // Prepare index items with embeddings
      const items: Partial<IndexItem>[] = documents.map((doc, index) => {
        let embedding: number[];

        if (doc.embedding) {
          embedding = doc.embedding;
        } else {
          // Find the generated embedding for this document
          const embeddingIndex = textIndices.indexOf(index);
          const foundEmbedding = generatedEmbeddings[embeddingIndex];
          if (!foundEmbedding) {
            throw new Error(`Failed to generate embedding for document at index ${index}`);
          }
          embedding = foundEmbedding;
        }

        return {
          id: doc.id,
          vector: embedding,
          metadata: {
            content: doc.content,
            ...(doc.metadata || {}),
          },
        };
      });

      // Batch insert
      await this.index.batchInsertItems(items);
      result.successCount = documents.length;

      // Persist to disk (Wave 10.1.3)
      await this.saveDocumentsToDisk();

      const duration = Date.now() - startTime;
      const memoryStatus = this.memoryMonitor.getStatus();
      logger.info('[VectorService] Batch added documents', {
        count: documents.length,
        durationMs: duration,
        memoryUsedMB: memoryStatus.usedMB,
        memoryStatus: memoryStatus.status,
      });
    } catch (error) {
      // If batch fails, remove all from memory tracking
      for (const doc of documents) {
        this.memoryMonitor.removeDocument(doc.id);
      }

      // Try adding individually to identify failures
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

      // Generate real embedding for query (Wave 10.1.2)
      await this.ensureEmbeddingService();
      const queryEmbedding = await this.embeddingService!.generateEmbedding(query);

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

      // Delete document from index
      await this.index.deleteItem(documentId);

      // Remove from memory tracking (Wave 10.1.3)
      this.memoryMonitor.removeDocument(documentId);

      // Persist to disk (Wave 10.1.3)
      await this.saveDocumentsToDisk();

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

      // Clear memory tracking (Wave 10.1.3)
      this.memoryMonitor.clear();

      // Delete persisted index (Wave 10.1.3)
      await this.indexPersistence.delete();

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
   * Check if embedding service is ready
   *
   * @returns True if embedding service is initialized and ready
   */
  isEmbeddingReady(): boolean {
    return this.isEmbeddingServiceReady && this.embeddingService !== null;
  }

  /**
   * Get current memory status
   * Wave 10.1.3 - Memory Monitoring & Index Persistence
   * User Story 2: Memory Threshold Alerts
   *
   * @returns Memory status with usage, budget, and threshold information
   */
  getMemoryStatus(): VectorMemoryStatus {
    return this.memoryMonitor.getStatus();
  }

  /**
   * List all documents in the index
   * Wave 10.2.1 - Knowledge Tab & Document List
   *
   * @returns Promise that resolves with array of document metadata
   */
  async listDocuments(): Promise<DocumentInput[]> {
    this.ensureInitialized();

    try {
      // Fetch all items from index (listItems returns all items at once)
      const items = await this.index.listItems();
      const documents: DocumentInput[] = [];

      for (const item of items) {
        documents.push({
          id: item.id,
          content: (item.metadata.content as string) || '',
          metadata: this.extractUserMetadata(item.metadata),
          embedding: item.vector,
        });
      }

      logger.debug('[VectorService] Listed documents', { count: documents.length });
      return documents;
    } catch (error) {
      logger.error('[VectorService] Failed to list documents', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to list documents: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load persisted documents from disk (Wave 10.1.3)
   * Called during initialization to restore index
   *
   * @returns Promise that resolves when documents are loaded
   */
  private async loadPersistedDocuments(): Promise<void> {
    try {
      const documents = await this.indexPersistence.load();

      if (!documents || documents.length === 0) {
        logger.info('[VectorService] No persisted documents to load');
        return;
      }

      logger.info('[VectorService] Loading persisted documents', {
        count: documents.length,
      });

      // Track memory for loaded documents
      this.memoryMonitor.trackBatch(
        documents.map((doc) => ({
          id: doc.id,
          content: doc.content,
          metadata: doc.metadata,
        }))
      );

      // Add documents to Vectra index
      const items: Partial<IndexItem>[] = documents.map((doc) => ({
        id: doc.id,
        vector: doc.embedding,
        metadata: {
          content: doc.content,
          ...(doc.metadata || {}),
        },
      }));

      await this.index.batchInsertItems(items);

      logger.info('[VectorService] Successfully loaded persisted documents', {
        count: documents.length,
      });
    } catch (error) {
      logger.error('[VectorService] Failed to load persisted documents', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - allow service to initialize even if persistence fails
    }
  }

  /**
   * Save current documents to disk (Wave 10.1.3)
   *
   * @returns Promise that resolves when documents are saved
   */
  private async saveDocumentsToDisk(): Promise<void> {
    try {
      // Get all items from index (listItems returns all items at once)
      const items = await this.index.listItems();
      const documents: PersistedDocument[] = [];

      // Convert items to persisted document format
      for (const item of items) {
        documents.push({
          id: item.id,
          content: (item.metadata.content as string) || '',
          metadata: this.extractUserMetadata(item.metadata),
          embedding: item.vector,
        });
      }

      // Save to disk
      await this.indexPersistence.save(documents, this.embeddingDimension);

      logger.debug('[VectorService] Saved documents to disk', {
        count: documents.length,
      });
    } catch (error) {
      logger.error('[VectorService] Failed to save documents to disk', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - persistence is best-effort
    }
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
