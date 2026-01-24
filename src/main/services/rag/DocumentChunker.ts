/**
 * DocumentChunker - Split documents into fixed-size chunks
 * Feature 10.3 - RAG Pipeline & Context Retrieval
 * Wave 10.3.1 - Document Chunking & Processing
 *
 * Provides document chunking with:
 * - Fixed-size chunks (500 tokens with 50-token overlap)
 * - Line-aware chunking (preserve line boundaries where possible)
 * - Chunk metadata tracking (startLine, endLine, filePath, index, timestamp)
 *
 * Performance target: <500ms per document
 */

import { TokenCounter, type ContentType } from './TokenCounter';

/**
 * Chunk metadata
 */
export interface ChunkMetadata {
  filePath: string;
  startLine: number;
  endLine: number;
  chunkIndex: number;
  timestamp: number;
  totalChunks?: number;
}

/**
 * Document chunk result
 */
export interface DocumentChunk {
  text: string;
  tokens: number;
  metadata: ChunkMetadata;
}

/**
 * Chunking options
 */
export interface ChunkOptions {
  /** Target tokens per chunk (default: 500) */
  chunkSize?: number;

  /** Token overlap between chunks (default: 50) */
  overlap?: number;

  /** File path for metadata */
  filePath: string;

  /** Content type hint for better token estimation */
  contentType?: ContentType;

  /** Whether to preserve line boundaries (default: true) */
  preserveLines?: boolean;
}

/**
 * Chunking result
 */
export interface ChunkingResult {
  chunks: DocumentChunk[];
  totalChunks: number;
  totalTokens: number;
  averageChunkSize: number;
}

/**
 * DocumentChunker service
 */
export class DocumentChunker {
  private static readonly DEFAULT_CHUNK_SIZE = 500;
  private static readonly DEFAULT_OVERLAP = 50;

  /**
   * Chunk a document into fixed-size pieces
   *
   * @param content - Document content to chunk
   * @param options - Chunking options
   * @returns Chunking result with all chunks
   */
  static chunk(content: string, options: ChunkOptions): ChunkingResult {
    const {
      chunkSize = this.DEFAULT_CHUNK_SIZE,
      overlap = this.DEFAULT_OVERLAP,
      filePath,
      contentType,
      preserveLines = true,
    } = options;

    const timestamp = Date.now();

    // Handle empty or whitespace-only content
    if (!content || content.trim().length === 0) {
      return {
        chunks: [],
        totalChunks: 0,
        totalTokens: 0,
        averageChunkSize: 0,
      };
    }

    // Detect content type if not provided
    const detectedType = contentType || TokenCounter.detectContentType(content);

    // Split into lines for line-aware chunking
    const lines = content.split('\n');

    // If document is small enough, return as single chunk
    const totalTokens = TokenCounter.count(content, detectedType).tokens;
    if (totalTokens <= chunkSize) {
      const chunk: DocumentChunk = {
        text: content,
        tokens: totalTokens,
        metadata: {
          filePath,
          startLine: 1,
          endLine: lines.length,
          chunkIndex: 0,
          timestamp,
          totalChunks: 1,
        },
      };

      return {
        chunks: [chunk],
        totalChunks: 1,
        totalTokens,
        averageChunkSize: totalTokens,
      };
    }

    // Check if we have a single very long line
    if (lines.length === 1 && totalTokens > chunkSize) {
      // Use character-based splitting for single long lines
      return this.chunkSingleLine(content, {
        chunkSize,
        overlap,
        filePath,
        contentType: detectedType,
        timestamp,
      });
    }

    // Chunk the document (multi-line)
    const chunks: DocumentChunk[] = [];
    let currentChunkLines: string[] = [];
    let currentTokens = 0;
    let currentStartLine = 1;
    let chunkIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] || '';
      const lineText = line + (i < lines.length - 1 ? '\n' : '');
      const lineTokens = TokenCounter.count(lineText, detectedType).tokens;

      // Check if adding this line would exceed chunk size
      if (currentTokens + lineTokens > chunkSize && currentChunkLines.length > 0) {
        // Save current chunk
        const chunkText = currentChunkLines.join('\n');
        chunks.push({
          text: chunkText,
          tokens: currentTokens,
          metadata: {
            filePath,
            startLine: currentStartLine,
            endLine: i,
            chunkIndex: chunkIndex++,
            timestamp,
          },
        });

        // Start new chunk with overlap
        if (overlap > 0 && preserveLines) {
          // Calculate how many lines to keep for overlap
          const overlapLines = this.calculateOverlapLines(currentChunkLines, overlap, detectedType);

          currentChunkLines = overlapLines;
          currentTokens = TokenCounter.count(currentChunkLines.join('\n'), detectedType).tokens;
          currentStartLine = i - overlapLines.length + 1;
        } else {
          currentChunkLines = [];
          currentTokens = 0;
          currentStartLine = i + 1;
        }
      }

      // Add line to current chunk
      currentChunkLines.push(line);
      currentTokens += lineTokens;
    }

    // Add final chunk if it has content
    if (currentChunkLines.length > 0) {
      const chunkText = currentChunkLines.join('\n');
      chunks.push({
        text: chunkText,
        tokens: currentTokens,
        metadata: {
          filePath,
          startLine: currentStartLine,
          endLine: lines.length,
          chunkIndex: chunkIndex,
          timestamp,
        },
      });
    }

    // Add totalChunks to all metadata
    chunks.forEach((chunk) => {
      chunk.metadata.totalChunks = chunks.length;
    });

    // Calculate average chunk size
    const avgChunkSize = chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0;

    return {
      chunks,
      totalChunks: chunks.length,
      totalTokens,
      averageChunkSize: avgChunkSize,
    };
  }

  /**
   * Chunk a single very long line using character-based splitting
   *
   * @param content - Single line content
   * @param options - Chunking options with timestamp
   * @returns Chunking result
   */
  private static chunkSingleLine(
    content: string,
    options: {
      chunkSize: number;
      overlap: number;
      filePath: string;
      contentType: ContentType;
      timestamp: number;
    }
  ): ChunkingResult {
    const { chunkSize, overlap, filePath, contentType, timestamp } = options;

    const chunks: DocumentChunk[] = [];
    const estimatedCharsPerChunk = TokenCounter.estimateChars(chunkSize, contentType);
    const estimatedOverlapChars = Math.min(
      TokenCounter.estimateChars(overlap, contentType),
      Math.floor(estimatedCharsPerChunk * 0.5) // Overlap can't be more than 50% of chunk
    );

    let startPos = 0;
    let chunkIndex = 0;

    while (startPos < content.length) {
      // Calculate chunk end position
      const endPos = Math.min(startPos + estimatedCharsPerChunk, content.length);

      // Extract chunk text
      const chunkText = content.substring(startPos, endPos);
      const chunkTokens = TokenCounter.count(chunkText, contentType).tokens;

      chunks.push({
        text: chunkText,
        tokens: chunkTokens,
        metadata: {
          filePath,
          startLine: 1,
          endLine: 1,
          chunkIndex: chunkIndex++,
          timestamp,
        },
      });

      // Move to next chunk position with overlap
      // Ensure we always make forward progress
      const nextPos = endPos - estimatedOverlapChars;
      if (nextPos <= startPos) {
        // If overlap would move us backwards, just move forward by at least 1 char
        startPos = endPos;
      } else {
        startPos = nextPos;
      }
    }

    // Add totalChunks to all metadata
    chunks.forEach((chunk) => {
      chunk.metadata.totalChunks = chunks.length;
    });

    const totalTokens = TokenCounter.count(content, contentType).tokens;
    const avgChunkSize = chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0;

    return {
      chunks,
      totalChunks: chunks.length,
      totalTokens,
      averageChunkSize: avgChunkSize,
    };
  }

  /**
   * Calculate overlap lines to include in next chunk
   *
   * @param lines - Lines from previous chunk
   * @param targetOverlapTokens - Target overlap in tokens
   * @param contentType - Content type for token counting
   * @returns Lines to include in overlap
   */
  private static calculateOverlapLines(
    lines: string[],
    targetOverlapTokens: number,
    contentType: ContentType
  ): string[] {
    const overlapLines: string[] = [];
    let overlapTokens = 0;

    // Start from the end and work backwards
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i] || '';
      const lineTokens = TokenCounter.count(line, contentType).tokens;

      if (overlapTokens + lineTokens > targetOverlapTokens && overlapLines.length > 0) {
        break;
      }

      overlapLines.unshift(line);
      overlapTokens += lineTokens;
    }

    return overlapLines;
  }

  /**
   * Chunk multiple documents in batch
   *
   * @param documents - Array of documents to chunk
   * @returns Array of chunking results
   */
  static chunkBatch(documents: Array<{ content: string; filePath: string }>): ChunkingResult[] {
    return documents.map((doc) => this.chunk(doc.content, { filePath: doc.filePath }));
  }
}
