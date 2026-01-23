/**
 * Vector Search Type Definitions
 * Feature 10.1 - Vector Service & Embedding Infrastructure
 * Wave 10.1.1 - Vector-lite Integration & Basic Search
 *
 * Provides TypeScript interfaces for vector search operations including
 * document indexing, semantic search, and index management.
 */

/**
 * Input document to be added to the vector index
 *
 * @property id - Unique identifier for the document (used for updates/removal)
 * @property content - Text content to be indexed and searched
 * @property metadata - Optional key-value pairs for filtering and display
 * @property embedding - Optional pre-computed embedding vector (if not provided, will be generated)
 */
export interface DocumentInput {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  embedding?: number[];
}

/**
 * Search result from vector index
 *
 * @property id - Document identifier matching DocumentInput.id
 * @property content - Original document content
 * @property score - Relevance score (0-1, higher is more relevant)
 * @property metadata - Document metadata from DocumentInput
 */
export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * Options for vector search operations
 *
 * @property topK - Number of top results to return (default: 10)
 * @property threshold - Minimum relevance score threshold (0-1, default: 0)
 * @property filter - Optional metadata filter (exact match on key-value pairs)
 */
export interface SearchOptions {
  topK?: number;
  threshold?: number;
  filter?: Record<string, unknown>;
}

/**
 * Vector index statistics
 *
 * @property documentCount - Total number of documents in the index
 * @property embeddingDimension - Dimension of embedding vectors
 * @property indexSizeBytes - Approximate memory footprint of the index
 */
export interface VectorIndexStats {
  documentCount: number;
  embeddingDimension: number;
  indexSizeBytes: number;
}

/**
 * Batch add operation result
 *
 * @property successCount - Number of documents successfully added
 * @property failureCount - Number of documents that failed to add
 * @property errors - Array of error messages for failed documents
 */
export interface BatchAddResult {
  successCount: number;
  failureCount: number;
  errors: Array<{ id: string; error: string }>;
}

/**
 * IPC channel names for vector operations
 */
export const VECTOR_CHANNELS = {
  VECTOR_ADD: 'vector:add',
  VECTOR_ADD_BATCH: 'vector:add-batch',
  VECTOR_SEARCH: 'vector:search',
  VECTOR_REMOVE: 'vector:remove',
  VECTOR_CLEAR: 'vector:clear',
  VECTOR_STATS: 'vector:stats',
} as const;

/**
 * Type-safe vector channel names
 */
export type VectorChannel = (typeof VECTOR_CHANNELS)[keyof typeof VECTOR_CHANNELS];
