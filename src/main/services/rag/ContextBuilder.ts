/**
 * ContextBuilder - Assemble context within token budget
 * Feature 10.3 - RAG Pipeline & Context Retrieval
 * Wave 10.3.2 - Context Retrieval & Budget Management
 *
 * Builds formatted context text from retrieved chunks while enforcing token budgets.
 * Prioritizes most relevant chunks and excludes partial chunks.
 */

import type {
  RetrievedChunk,
  RetrievedContext,
  ContextBuildOptions,
  SourceAttribution,
} from './types';

/**
 * ContextBuilder service
 */
export class ContextBuilder {
  private static readonly DEFAULT_MAX_TOKENS = 4000;
  private static readonly DEFAULT_FORMAT = 'plain';

  /**
   * Build context from retrieved chunks within token budget
   *
   * @param chunks - Retrieved chunks ordered by relevance
   * @param options - Context building options
   * @returns Assembled context with metadata
   */
  static buildContext(
    chunks: RetrievedChunk[],
    options?: Partial<ContextBuildOptions>
  ): RetrievedContext {
    const {
      maxTokens = this.DEFAULT_MAX_TOKENS,
      includeCitations = false,
      format = this.DEFAULT_FORMAT,
    } = options || {};

    // Handle empty chunks
    if (chunks.length === 0) {
      return {
        chunks: [],
        sources: [],
        contextText: '',
        totalTokens: 0,
        budgetUsed: 0,
        budgetAvailable: maxTokens,
      };
    }

    // Select chunks that fit within budget
    const selectedChunks: RetrievedChunk[] = [];
    let totalTokens = 0;

    for (const chunk of chunks) {
      // Check if adding this chunk would exceed budget
      if (totalTokens + chunk.tokens > maxTokens) {
        // Stop adding chunks - no partial chunks allowed
        break;
      }

      selectedChunks.push(chunk);
      totalTokens += chunk.tokens;
    }

    // Build context text
    const contextText = this.formatContext(selectedChunks, {
      includeCitations,
      format,
    });

    // Extract source attributions
    const sources = this.extractSources(selectedChunks);

    return {
      chunks: selectedChunks,
      sources,
      contextText,
      totalTokens,
      budgetUsed: totalTokens,
      budgetAvailable: maxTokens - totalTokens,
    };
  }

  /**
   * Format chunks into context text
   *
   * @param chunks - Selected chunks to format
   * @param options - Formatting options
   * @returns Formatted context text
   */
  private static formatContext(
    chunks: RetrievedChunk[],
    options: { includeCitations?: boolean; format?: 'plain' | 'markdown' }
  ): string {
    const { includeCitations = false, format = 'plain' } = options;

    if (chunks.length === 0) {
      return '';
    }

    const sections: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]!;
      let section = '';

      if (format === 'markdown') {
        // Markdown format with source attribution
        if (includeCitations) {
          section += `### Source ${i + 1}: ${chunk.filePath}:${chunk.startLine}-${chunk.endLine}\n\n`;
        }
        section += `\`\`\`\n${chunk.content}\n\`\`\``;
      } else {
        // Plain text format
        if (includeCitations) {
          section += `[${chunk.filePath}:${chunk.startLine}-${chunk.endLine}]\n`;
        }
        section += chunk.content;
      }

      sections.push(section);
    }

    return sections.join('\n\n');
  }

  /**
   * Extract and deduplicate source attributions from chunks
   *
   * @param chunks - Chunks to extract sources from
   * @returns Deduplicated source attributions ordered by relevance
   */
  private static extractSources(chunks: RetrievedChunk[]): SourceAttribution[] {
    const sources: SourceAttribution[] = [];
    const seen = new Set<string>();

    for (const chunk of chunks) {
      // Create unique key for deduplication
      // Use file path + line range for overlap detection
      const key = `${chunk.filePath}:${chunk.startLine}-${chunk.endLine}`;

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      sources.push({
        filePath: chunk.filePath,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        score: chunk.score,
        snippet: this.createSnippet(chunk.content),
      });
    }

    // Already ordered by relevance since chunks are pre-sorted
    return sources;
  }

  /**
   * Create a short snippet from chunk content
   *
   * @param content - Full chunk content
   * @returns Short snippet (first 100 chars)
   */
  private static createSnippet(content: string): string {
    const maxLength = 100;
    if (content.length <= maxLength) {
      return content;
    }

    return content.substring(0, maxLength) + '...';
  }

  /**
   * Estimate tokens needed for a set of chunks
   *
   * @param chunks - Chunks to estimate
   * @returns Estimated token count
   */
  static estimateTokens(chunks: RetrievedChunk[]): number {
    return chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
  }

  /**
   * Check if chunks fit within budget
   *
   * @param chunks - Chunks to check
   * @param maxTokens - Maximum tokens allowed
   * @returns True if chunks fit within budget
   */
  static fitsWithinBudget(chunks: RetrievedChunk[], maxTokens: number): boolean {
    const totalTokens = this.estimateTokens(chunks);
    return totalTokens <= maxTokens;
  }

  /**
   * Get maximum chunks that fit within budget
   *
   * @param chunks - All available chunks (ordered by relevance)
   * @param maxTokens - Maximum tokens allowed
   * @returns Subset of chunks that fit within budget
   */
  static getChunksWithinBudget(chunks: RetrievedChunk[], maxTokens: number): RetrievedChunk[] {
    const selected: RetrievedChunk[] = [];
    let totalTokens = 0;

    for (const chunk of chunks) {
      if (totalTokens + chunk.tokens > maxTokens) {
        break;
      }

      selected.push(chunk);
      totalTokens += chunk.tokens;
    }

    return selected;
  }
}
