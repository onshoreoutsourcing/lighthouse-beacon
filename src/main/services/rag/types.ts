/**
 * RAG Service Type Definitions
 * Feature 10.3 - RAG Pipeline & Context Retrieval
 * Wave 10.3.2 - Context Retrieval & Budget Management
 *
 * Types for RAG context retrieval, source attribution, and budget management.
 */

/**
 * Retrieved context chunk with source attribution
 */
export interface RetrievedChunk {
  /** Unique chunk identifier */
  id: string;

  /** Chunk text content */
  content: string;

  /** Relevance score (0-1, higher is more relevant) */
  score: number;

  /** Source file path */
  filePath: string;

  /** Starting line number in source file */
  startLine: number;

  /** Ending line number in source file */
  endLine: number;

  /** Token count for this chunk */
  tokens: number;

  /** Original document ID (before chunking) */
  originalDocumentId?: string;

  /** Chunk index within original document */
  chunkIndex?: number;

  /** Total chunks in original document */
  totalChunks?: number;
}

/**
 * Source attribution for a retrieved chunk
 */
export interface SourceAttribution {
  /** Source file path */
  filePath: string;

  /** Starting line number */
  startLine: number;

  /** Ending line number */
  endLine: number;

  /** Relevance score */
  score: number;

  /** Chunk content snippet */
  snippet: string;
}

/**
 * Retrieved context result
 */
export interface RetrievedContext {
  /** Retrieved chunks ordered by relevance */
  chunks: RetrievedChunk[];

  /** Source attributions (deduplicated) */
  sources: SourceAttribution[];

  /** Formatted context text ready for prompt injection */
  contextText: string;

  /** Total tokens used in context */
  totalTokens: number;

  /** Token budget used */
  budgetUsed: number;

  /** Token budget available */
  budgetAvailable: number;
}

/**
 * Context retrieval options
 */
export interface RetrievalOptions {
  /** Number of top results to retrieve (default: 5) */
  topK?: number;

  /** Minimum relevance score threshold (default: 0.3) */
  minScore?: number;

  /** Maximum context tokens (default: 4000) */
  maxTokens?: number;

  /** Include source attributions in result (default: true) */
  includeSources?: boolean;
}

/**
 * Context building options
 */
export interface ContextBuildOptions {
  /** Maximum tokens allowed */
  maxTokens: number;

  /** Whether to include source citations in context text */
  includeCitations?: boolean;

  /** Format for context text ('plain' or 'markdown') */
  format?: 'plain' | 'markdown';
}
