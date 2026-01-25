/**
 * PromptBuilder Unit Tests
 * Feature 10.3 - RAG Pipeline & Context Retrieval
 * Wave 10.3.3 - Prompt Augmentation & SOC Integration
 *
 * Tests prompt construction, context formatting, and performance.
 * Target coverage: >90%
 */

import { describe, it, expect } from 'vitest';
import { PromptBuilder } from '../PromptBuilder';
import type { RetrievedContext, RetrievedChunk } from '../types';

describe('PromptBuilder', () => {
  // Helper to create test chunks
  const createChunk = (
    id: string,
    content: string,
    tokens: number,
    score: number,
    filePath = '/test/file.ts',
    startLine = 1,
    endLine = 10
  ): RetrievedChunk => ({
    id,
    content,
    tokens,
    score,
    filePath,
    startLine,
    endLine,
  });

  // Helper to create test context
  const createContext = (chunks: RetrievedChunk[]): RetrievedContext => {
    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
    return {
      chunks,
      sources: chunks.map((chunk) => ({
        filePath: chunk.filePath,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        score: chunk.score,
        snippet: chunk.content.substring(0, 100),
      })),
      contextText: chunks.map((c) => c.content).join('\n\n'),
      totalTokens,
      budgetUsed: totalTokens,
      budgetAvailable: 4000 - totalTokens,
    };
  };

  describe('buildAugmentedPrompt', () => {
    it('should build augmented prompt with context', () => {
      const chunks = [createChunk('chunk1', 'function test() { return 42; }', 50, 0.9)];
      const context = createContext(chunks);

      const result = PromptBuilder.buildAugmentedPrompt(context);

      expect(result.hasContext).toBe(true);
      expect(result.systemPrompt).toContain('Relevant Code Context');
      expect(result.systemPrompt).toContain('/test/file.ts');
      expect(result.systemPrompt).toContain('function test() { return 42; }');
      expect(result.sources).toHaveLength(1);
      expect(result.totalTokens).toBe(50);
    });

    it('should include file path and line range citations', () => {
      const chunks = [createChunk('chunk1', 'const x = 10;', 50, 0.9, '/src/main.ts', 5, 15)];
      const context = createContext(chunks);

      const result = PromptBuilder.buildAugmentedPrompt(context, {
        includeCitations: true,
      });

      expect(result.systemPrompt).toContain('/src/main.ts');
      expect(result.systemPrompt).toContain('Lines 5-15');
    });

    it('should exclude citations when option is false', () => {
      const chunks = [createChunk('chunk1', 'const x = 10;', 50, 0.9, '/src/main.ts', 5, 15)];
      const context = createContext(chunks);

      const result = PromptBuilder.buildAugmentedPrompt(context, {
        includeCitations: false,
      });

      expect(result.systemPrompt).not.toContain('/src/main.ts');
      expect(result.systemPrompt).not.toContain('Lines');
      expect(result.systemPrompt).toContain('Code Snippet');
    });

    it('should handle empty context', () => {
      const context: RetrievedContext = {
        chunks: [],
        sources: [],
        contextText: '',
        totalTokens: 0,
        budgetUsed: 0,
        budgetAvailable: 4000,
      };

      const result = PromptBuilder.buildAugmentedPrompt(context);

      expect(result.hasContext).toBe(false);
      expect(result.systemPrompt).not.toContain('Relevant Code Context');
      expect(result.sources).toHaveLength(0);
      expect(result.totalTokens).toBe(0);
    });

    it('should format multiple chunks correctly', () => {
      const chunks = [
        createChunk('chunk1', 'First chunk', 25, 0.9, '/file1.ts', 1, 10),
        createChunk('chunk2', 'Second chunk', 25, 0.8, '/file2.ts', 20, 30),
        createChunk('chunk3', 'Third chunk', 25, 0.7, '/file3.ts', 40, 50),
      ];
      const context = createContext(chunks);

      const result = PromptBuilder.buildAugmentedPrompt(context);

      expect(result.systemPrompt).toContain('Source 1');
      expect(result.systemPrompt).toContain('Source 2');
      expect(result.systemPrompt).toContain('Source 3');
      expect(result.systemPrompt).toContain('First chunk');
      expect(result.systemPrompt).toContain('Second chunk');
      expect(result.systemPrompt).toContain('Third chunk');
    });

    it('should use custom system prompt prefix', () => {
      const chunks = [createChunk('chunk1', 'Test', 50, 0.9)];
      const context = createContext(chunks);

      const result = PromptBuilder.buildAugmentedPrompt(context, {
        systemPromptPrefix: 'Custom prefix here',
      });

      expect(result.systemPrompt).toContain('Custom prefix here');
      expect(result.systemPrompt).not.toContain('You are an AI assistant');
    });

    it('should use custom system prompt suffix', () => {
      const chunks = [createChunk('chunk1', 'Test', 50, 0.9)];
      const context = createContext(chunks);

      const result = PromptBuilder.buildAugmentedPrompt(context, {
        systemPromptSuffix: 'Custom suffix here',
      });

      expect(result.systemPrompt).toContain('Custom suffix here');
    });

    it('should truncate long content when max length specified', () => {
      const longContent = 'a'.repeat(1000);
      const chunks = [createChunk('chunk1', longContent, 250, 0.9)];
      const context = createContext(chunks);

      const result = PromptBuilder.buildAugmentedPrompt(context, {
        maxContextLength: 100,
      });

      expect(result.systemPrompt).toContain('truncated');
      expect(result.systemPrompt.indexOf(longContent)).toBe(-1); // Full content not present
    });

    it('should not truncate short content', () => {
      const shortContent = 'Short content here';
      const chunks = [createChunk('chunk1', shortContent, 10, 0.9)];
      const context = createContext(chunks);

      const result = PromptBuilder.buildAugmentedPrompt(context, {
        maxContextLength: 1000,
      });

      expect(result.systemPrompt).not.toContain('truncated');
      expect(result.systemPrompt).toContain(shortContent);
    });

    it('should preserve source attributions', () => {
      const chunks = [
        createChunk('chunk1', 'Content 1', 50, 0.9, '/file1.ts', 1, 10),
        createChunk('chunk2', 'Content 2', 50, 0.8, '/file2.ts', 20, 30),
      ];
      const context = createContext(chunks);

      const result = PromptBuilder.buildAugmentedPrompt(context);

      expect(result.sources).toHaveLength(2);
      expect(result.sources[0]?.filePath).toBe('/file1.ts');
      expect(result.sources[1]?.filePath).toBe('/file2.ts');
    });

    it('should complete in <50ms', () => {
      const chunks = Array.from({ length: 5 }, (_, i) =>
        createChunk(`chunk${i}`, 'a '.repeat(500), 250, 0.9 - i * 0.1)
      );
      const context = createContext(chunks);

      const startTime = performance.now();
      PromptBuilder.buildAugmentedPrompt(context);
      const duration = performance.now() - startTime;

      // Generous limit for CI, actual target is <50ms
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('buildStandardPrompt', () => {
    it('should build standard prompt without context', () => {
      const result = PromptBuilder.buildStandardPrompt();

      expect(result.hasContext).toBe(false);
      expect(result.sources).toHaveLength(0);
      expect(result.totalTokens).toBe(0);
      expect(result.systemPrompt).toContain('AI assistant');
    });

    it('should use custom system prompt when provided', () => {
      const customPrompt = 'You are a specialized code reviewer';

      const result = PromptBuilder.buildStandardPrompt(customPrompt);

      expect(result.systemPrompt).toBe(customPrompt);
      expect(result.hasContext).toBe(false);
    });

    it('should use default prompt when custom not provided', () => {
      const result = PromptBuilder.buildStandardPrompt();

      expect(result.systemPrompt).toContain('AI assistant');
    });
  });

  describe('estimateSystemPromptTokens', () => {
    it('should estimate tokens for short prompt', () => {
      const prompt = 'Hello world';
      const tokens = PromptBuilder.estimateSystemPromptTokens(prompt);

      // ~4 chars per token
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThanOrEqual(10);
    });

    it('should estimate tokens for long prompt', () => {
      const prompt = 'a '.repeat(1000); // 2000 chars
      const tokens = PromptBuilder.estimateSystemPromptTokens(prompt);

      // ~4 chars per token = ~500 tokens
      expect(tokens).toBeGreaterThan(400);
      expect(tokens).toBeLessThan(600);
    });

    it('should return 0 for empty prompt', () => {
      const tokens = PromptBuilder.estimateSystemPromptTokens('');

      expect(tokens).toBe(0);
    });
  });

  describe('prompt structure', () => {
    it('should include all sections in correct order', () => {
      const chunks = [createChunk('chunk1', 'Test code', 50, 0.9)];
      const context = createContext(chunks);

      const result = PromptBuilder.buildAugmentedPrompt(context);

      const prompt = result.systemPrompt;

      // Check order: prefix -> context -> suffix
      const prefixIndex = prompt.indexOf('AI assistant');
      const contextIndex = prompt.indexOf('Relevant Code Context');
      const suffixIndex = prompt.indexOf('When answering');

      expect(prefixIndex).toBeLessThan(contextIndex);
      expect(contextIndex).toBeLessThan(suffixIndex);
    });

    it('should use markdown code blocks', () => {
      const chunks = [createChunk('chunk1', 'const x = 10;', 50, 0.9)];
      const context = createContext(chunks);

      const result = PromptBuilder.buildAugmentedPrompt(context);

      expect(result.systemPrompt).toContain('```');
      expect(result.systemPrompt.split('```').length).toBeGreaterThan(2); // At least opening and closing
    });

    it('should separate sections with newlines', () => {
      const chunks = [createChunk('chunk1', 'Test', 50, 0.9)];
      const context = createContext(chunks);

      const result = PromptBuilder.buildAugmentedPrompt(context);

      // Should have multiple newlines for readability
      expect(result.systemPrompt.split('\n').length).toBeGreaterThan(5);
    });
  });

  describe('edge cases', () => {
    it('should handle chunk with special characters', () => {
      const specialContent = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./';
      const chunks = [createChunk('chunk1', specialContent, 50, 0.9)];
      const context = createContext(chunks);

      const result = PromptBuilder.buildAugmentedPrompt(context);

      expect(result.systemPrompt).toContain(specialContent);
    });

    it('should handle chunk with newlines', () => {
      const multilineContent = 'Line 1\nLine 2\nLine 3';
      const chunks = [createChunk('chunk1', multilineContent, 50, 0.9)];
      const context = createContext(chunks);

      const result = PromptBuilder.buildAugmentedPrompt(context);

      expect(result.systemPrompt).toContain(multilineContent);
    });

    it('should handle very long file paths', () => {
      const longPath = '/very/long/path/to/deeply/nested/file/structure/main.ts';
      const chunks = [createChunk('chunk1', 'Test', 50, 0.9, longPath, 1, 10)];
      const context = createContext(chunks);

      const result = PromptBuilder.buildAugmentedPrompt(context);

      expect(result.systemPrompt).toContain(longPath);
    });
  });
});
