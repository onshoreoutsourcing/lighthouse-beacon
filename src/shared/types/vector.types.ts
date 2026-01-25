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
 * Memory status for vector index
 * Wave 10.1.3 - Memory Monitoring & Index Persistence
 *
 * @property usedBytes - Total memory used in bytes
 * @property budgetBytes - Memory budget in bytes (500MB default)
 * @property availableBytes - Available memory in bytes
 * @property percentUsed - Memory usage percentage (0-100)
 * @property documentCount - Number of documents tracked
 * @property status - Status level: 'ok', 'warning', 'critical', 'exceeded'
 * @property usedMB - Human-readable memory used (e.g., "245.3 MB")
 * @property budgetMB - Human-readable memory budget (e.g., "500.0 MB")
 */
export interface VectorMemoryStatus {
  usedBytes: number;
  budgetBytes: number;
  availableBytes: number;
  percentUsed: number;
  documentCount: number;
  status: 'ok' | 'warning' | 'critical' | 'exceeded';
  usedMB: string;
  budgetMB: string;
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
  VECTOR_MEMORY_STATUS: 'vector:get-memory-status',
  VECTOR_LIST: 'vector:list',
} as const;

/**
 * Type-safe vector channel names
 */
export type VectorChannel = (typeof VECTOR_CHANNELS)[keyof typeof VECTOR_CHANNELS];

/**
 * IPC channel names for RAG operations
 * Wave 10.3.2 - Context Retrieval & Budget Management
 */
export const RAG_CHANNELS = {
  RAG_RETRIEVE_CONTEXT: 'rag:retrieve-context',
} as const;

/**
 * Type-safe RAG channel names
 */
export type RAGChannel = (typeof RAG_CHANNELS)[keyof typeof RAG_CHANNELS];
