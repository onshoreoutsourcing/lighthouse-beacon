/**
 * TokenCounter - Utility for estimating token counts
 * Feature 10.3 - RAG Pipeline & Context Retrieval
 * Wave 10.3.1 - Document Chunking & Processing
 *
 * Provides accurate token counting for text content to enforce context budgets.
 * Uses character-based estimation with language-specific adjustments.
 *
 * Token Estimation Strategy:
 * - English text: ~4 characters per token
 * - Code: ~3.5 characters per token (more dense)
 * - Mixed content: Weighted average
 *
 * Performance target: <10ms for 10KB of text
 * Accuracy target: Within 10% of actual token count
 */

/**
 * Token count result
 */
export interface TokenCountResult {
  tokens: number;
  characters: number;
  method: 'character-based' | 'library-based';
}

/**
 * Content type for estimation
 */
export type ContentType = 'prose' | 'code' | 'mixed';

/**
 * TokenCounter utility class
 */
export class TokenCounter {
  // Character-to-token ratios for different content types
  private static readonly CHAR_PER_TOKEN_PROSE = 4.0;
  private static readonly CHAR_PER_TOKEN_CODE = 3.5;
  private static readonly CHAR_PER_TOKEN_MIXED = 3.75;

  /**
   * Count tokens in text content
   *
   * @param text - Text to count tokens for
   * @param contentType - Type of content for better estimation
   * @returns Token count result with method used
   */
  static count(text: string, contentType: ContentType = 'mixed'): TokenCountResult {
    const characters = text.length;

    // Empty text
    if (characters === 0) {
      return {
        tokens: 0,
        characters: 0,
        method: 'character-based',
      };
    }

    // Select ratio based on content type
    let ratio: number;
    switch (contentType) {
      case 'prose':
        ratio = this.CHAR_PER_TOKEN_PROSE;
        break;
      case 'code':
        ratio = this.CHAR_PER_TOKEN_CODE;
        break;
      case 'mixed':
      default:
        ratio = this.CHAR_PER_TOKEN_MIXED;
        break;
    }

    // Estimate tokens
    const tokens = Math.ceil(characters / ratio);

    return {
      tokens,
      characters,
      method: 'character-based',
    };
  }

  /**
   * Auto-detect content type from text
   *
   * @param text - Text to analyze
   * @returns Detected content type
   */
  static detectContentType(text: string): ContentType {
    // Code indicators: braces, semicolons, operators
    const codeIndicators = /[{};=><+\-*/&|]/g;
    const codeMatches = (text.match(codeIndicators) || []).length;
    const codeRatio = codeMatches / text.length;

    // Prose indicators: common words, sentence structure
    const proseIndicators = /\b(the|a|an|and|or|but|is|are|was|were|in|on|at|to|for)\b/gi;
    const proseMatches = (text.match(proseIndicators) || []).length;
    const wordCount = text.split(/\s+/).length;
    const proseRatio = proseMatches / wordCount;

    // Detect based on ratios
    if (codeRatio > 0.05) {
      return 'code';
    }
    if (proseRatio > 0.2 || proseMatches >= 3) {
      return 'prose';
    }

    return 'mixed';
  }

  /**
   * Count tokens with auto-detection
   *
   * @param text - Text to count tokens for
   * @returns Token count result
   */
  static countAuto(text: string): TokenCountResult {
    const contentType = this.detectContentType(text);
    return this.count(text, contentType);
  }

  /**
   * Estimate tokens needed for a chunk of specific size
   *
   * @param targetTokens - Target number of tokens
   * @param contentType - Type of content
   * @returns Estimated character count
   */
  static estimateChars(targetTokens: number, contentType: ContentType = 'mixed'): number {
    let ratio: number;
    switch (contentType) {
      case 'prose':
        ratio = this.CHAR_PER_TOKEN_PROSE;
        break;
      case 'code':
        ratio = this.CHAR_PER_TOKEN_CODE;
        break;
      case 'mixed':
      default:
        ratio = this.CHAR_PER_TOKEN_MIXED;
        break;
    }

    return Math.floor(targetTokens * ratio);
  }
}
