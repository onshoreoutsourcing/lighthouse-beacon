/**
 * PromptBuilder - Construct AI-ready prompts with retrieved context
 * Feature 10.3 - RAG Pipeline & Context Retrieval
 * Wave 10.3.3 - Prompt Augmentation & SOC Integration
 *
 * Builds augmented system prompts that inject retrieved context into AI requests.
 * Formats context clearly with file paths, line ranges, and code blocks.
 */

import type { RetrievedContext, SourceAttribution } from './types';
import { logger } from '../../logger';

/**
 * Options for prompt building
 */
export interface PromptBuildOptions {
  /** Include source citations in context */
  includeCitations?: boolean;

  /** Maximum length of context snippet in prompt (chars) */
  maxContextLength?: number;

  /** Custom system prompt prefix (prepended before context) */
  systemPromptPrefix?: string;

  /** Custom system prompt suffix (appended after context) */
  systemPromptSuffix?: string;
}

/**
 * Result of prompt building
 */
export interface AugmentedPrompt {
  /** Complete system prompt with context */
  systemPrompt: string;

  /** Source attributions for citation display */
  sources: SourceAttribution[];

  /** Number of tokens in augmented prompt */
  totalTokens: number;

  /** Whether context was included */
  hasContext: boolean;
}

/**
 * PromptBuilder service for RAG prompt augmentation
 */
export class PromptBuilder {
  private static readonly DEFAULT_SYSTEM_PREFIX = `You are an AI assistant helping a developer understand their codebase. You have been provided with relevant code snippets from their project to answer their question accurately.`;

  private static readonly DEFAULT_SYSTEM_SUFFIX = `When answering, reference the provided code snippets when relevant. If the provided context doesn't contain enough information to answer the question, say so clearly.`;

  /**
   * Build augmented prompt with retrieved context
   *
   * @param context - Retrieved context from RAGService
   * @param options - Prompt building options
   * @returns Augmented prompt ready for AIService
   */
  static buildAugmentedPrompt(
    context: RetrievedContext,
    options?: PromptBuildOptions
  ): AugmentedPrompt {
    const startTime = Date.now();

    const {
      includeCitations = true,
      maxContextLength,
      systemPromptPrefix = this.DEFAULT_SYSTEM_PREFIX,
      systemPromptSuffix = this.DEFAULT_SYSTEM_SUFFIX,
    } = options || {};

    // Handle empty context
    if (context.chunks.length === 0) {
      logger.debug('[PromptBuilder] No context chunks, returning standard prompt');
      return {
        systemPrompt: systemPromptPrefix,
        sources: [],
        totalTokens: 0,
        hasContext: false,
      };
    }

    // Build context section
    const contextSection = this.formatContextSection(context, {
      includeCitations,
      maxContextLength,
    });

    // Assemble full system prompt
    const systemPrompt = [systemPromptPrefix, '', contextSection, '', systemPromptSuffix]
      .filter(Boolean)
      .join('\n');

    const duration = Date.now() - startTime;

    logger.info('[PromptBuilder] Built augmented prompt', {
      chunksIncluded: context.chunks.length,
      sourcesIncluded: context.sources.length,
      totalTokens: context.totalTokens,
      promptLength: systemPrompt.length,
      durationMs: duration,
    });

    // Warn if prompt construction is slow
    if (duration > 50) {
      logger.warn('[PromptBuilder] Slow prompt construction', {
        durationMs: duration,
        threshold: 50,
      });
    }

    return {
      systemPrompt,
      sources: context.sources,
      totalTokens: context.totalTokens,
      hasContext: true,
    };
  }

  /**
   * Format context section with code snippets
   *
   * @param context - Retrieved context
   * @param options - Formatting options
   * @returns Formatted context section
   */
  private static formatContextSection(
    context: RetrievedContext,
    options: { includeCitations?: boolean; maxContextLength?: number }
  ): string {
    const { includeCitations = true, maxContextLength } = options;

    const sections: string[] = ['## Relevant Code Context', ''];

    for (let i = 0; i < context.chunks.length; i++) {
      const chunk = context.chunks[i]!;

      // Add source header with file path and line range
      if (includeCitations) {
        sections.push(
          `### Source ${i + 1}: \`${chunk.filePath}\` (Lines ${chunk.startLine}-${chunk.endLine})`
        );
      } else {
        sections.push(`### Code Snippet ${i + 1}`);
      }

      // Add content in code block
      let content = chunk.content;

      // Truncate if max length specified
      if (maxContextLength && content.length > maxContextLength) {
        content = content.substring(0, maxContextLength) + '\n... (truncated)';
      }

      sections.push('```');
      sections.push(content);
      sections.push('```');
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Build prompt for non-RAG queries (standard system prompt)
   *
   * @param customSystemPrompt - Optional custom system prompt
   * @returns Standard prompt without context
   */
  static buildStandardPrompt(customSystemPrompt?: string): AugmentedPrompt {
    const systemPrompt = customSystemPrompt || this.DEFAULT_SYSTEM_PREFIX;

    return {
      systemPrompt,
      sources: [],
      totalTokens: 0,
      hasContext: false,
    };
  }

  /**
   * Estimate tokens in system prompt
   *
   * @param systemPrompt - System prompt text
   * @returns Estimated token count (rough approximation)
   */
  static estimateSystemPromptTokens(systemPrompt: string): number {
    // Rough estimate: ~4 chars per token
    return Math.ceil(systemPrompt.length / 4);
  }
}
