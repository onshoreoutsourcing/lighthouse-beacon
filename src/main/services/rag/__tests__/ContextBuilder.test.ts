/**
 * ContextBuilder Unit Tests
 * Feature 10.3 - RAG Pipeline & Context Retrieval
 * Wave 10.3.2 - Context Retrieval & Budget Management
 *
 * Tests context assembly, budget enforcement, and source attribution.
 * Target coverage: >90%
 */

import { describe, it, expect } from 'vitest';
import { ContextBuilder } from '../ContextBuilder';
import type { RetrievedChunk } from '../types';

describe('ContextBuilder', () => {
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

  describe('buildContext', () => {
    it('should build context from chunks', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'First chunk content', 50, 0.9),
        createChunk('chunk2', 'Second chunk content', 50, 0.8),
      ];

      const result = ContextBuilder.buildContext(chunks);

      expect(result.chunks).toHaveLength(2);
      expect(result.totalTokens).toBe(100);
      expect(result.contextText).toContain('First chunk content');
      expect(result.contextText).toContain('Second chunk content');
    });

    it('should handle empty chunks', () => {
      const result = ContextBuilder.buildContext([]);

      expect(result.chunks).toHaveLength(0);
      expect(result.totalTokens).toBe(0);
      expect(result.contextText).toBe('');
      expect(result.sources).toHaveLength(0);
    });

    it('should enforce token budget', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'Chunk 1', 100, 0.9),
        createChunk('chunk2', 'Chunk 2', 100, 0.8),
        createChunk('chunk3', 'Chunk 3', 100, 0.7),
        createChunk('chunk4', 'Chunk 4', 100, 0.6),
      ];

      const result = ContextBuilder.buildContext(chunks, { maxTokens: 250 });

      // Should include only chunks 1 and 2 (200 tokens total)
      expect(result.chunks).toHaveLength(2);
      expect(result.totalTokens).toBe(200);
      expect(result.budgetUsed).toBe(200);
      expect(result.budgetAvailable).toBe(50);
    });

    it('should not include partial chunks', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'Chunk 1', 100, 0.9),
        createChunk('chunk2', 'Chunk 2', 150, 0.8), // This would exceed budget
      ];

      const result = ContextBuilder.buildContext(chunks, { maxTokens: 120 });

      // Should include only chunk 1, not a partial chunk 2
      expect(result.chunks).toHaveLength(1);
      expect(result.totalTokens).toBe(100);
    });

    it('should prioritize most relevant chunks', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'High relevance', 100, 0.9),
        createChunk('chunk2', 'Medium relevance', 100, 0.6),
        createChunk('chunk3', 'Low relevance', 100, 0.3),
      ];

      const result = ContextBuilder.buildContext(chunks, { maxTokens: 150 });

      // Should include high and medium, exclude low
      expect(result.chunks).toHaveLength(1);
      expect(result.chunks[0]?.id).toBe('chunk1');
    });

    it('should respect custom max tokens', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'Chunk 1', 500, 0.9),
        createChunk('chunk2', 'Chunk 2', 500, 0.8),
      ];

      const result = ContextBuilder.buildContext(chunks, { maxTokens: 600 });

      expect(result.chunks).toHaveLength(1);
      expect(result.budgetAvailable).toBe(100);
    });

    it('should use default 4000 token budget', () => {
      const chunks: RetrievedChunk[] = [createChunk('chunk1', 'Test', 100, 0.9)];

      const result = ContextBuilder.buildContext(chunks);

      expect(result.budgetAvailable).toBe(3900); // 4000 - 100
    });
  });

  describe('formatContext', () => {
    it('should format plain text without citations', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'First content', 50, 0.9),
        createChunk('chunk2', 'Second content', 50, 0.8),
      ];

      const result = ContextBuilder.buildContext(chunks, {
        includeCitations: false,
        format: 'plain',
      });

      expect(result.contextText).toBe('First content\n\nSecond content');
      expect(result.contextText).not.toContain('/test/file.ts');
    });

    it('should format plain text with citations', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'Content', 50, 0.9, '/path/to/file.ts', 10, 20),
      ];

      const result = ContextBuilder.buildContext(chunks, {
        includeCitations: true,
        format: 'plain',
      });

      expect(result.contextText).toContain('[/path/to/file.ts:10-20]');
      expect(result.contextText).toContain('Content');
    });

    it('should format markdown without citations', () => {
      const chunks: RetrievedChunk[] = [createChunk('chunk1', 'const x = 10;', 50, 0.9)];

      const result = ContextBuilder.buildContext(chunks, {
        includeCitations: false,
        format: 'markdown',
      });

      expect(result.contextText).toContain('```');
      expect(result.contextText).toContain('const x = 10;');
      expect(result.contextText).not.toContain('### Source');
    });

    it('should format markdown with citations', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'const x = 10;', 50, 0.9, '/src/file.ts', 5, 10),
      ];

      const result = ContextBuilder.buildContext(chunks, {
        includeCitations: true,
        format: 'markdown',
      });

      expect(result.contextText).toContain('### Source 1: /src/file.ts:5-10');
      expect(result.contextText).toContain('```');
      expect(result.contextText).toContain('const x = 10;');
    });
  });

  describe('extractSources', () => {
    it('should extract source attributions', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'Content 1', 50, 0.9, '/file1.ts', 1, 10),
        createChunk('chunk2', 'Content 2', 50, 0.8, '/file2.ts', 20, 30),
      ];

      const result = ContextBuilder.buildContext(chunks);

      expect(result.sources).toHaveLength(2);
      expect(result.sources[0]).toMatchObject({
        filePath: '/file1.ts',
        startLine: 1,
        endLine: 10,
        score: 0.9,
      });
      expect(result.sources[1]).toMatchObject({
        filePath: '/file2.ts',
        startLine: 20,
        endLine: 30,
        score: 0.8,
      });
    });

    it('should deduplicate identical source ranges', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'Content 1', 50, 0.9, '/file.ts', 1, 10),
        createChunk('chunk2', 'Content 2', 50, 0.8, '/file.ts', 1, 10), // Same range
      ];

      const result = ContextBuilder.buildContext(chunks);

      // Should have only 1 source despite 2 chunks
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0]?.filePath).toBe('/file.ts');
    });

    it('should order sources by relevance', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'High', 50, 0.9, '/file1.ts', 1, 10),
        createChunk('chunk2', 'Medium', 50, 0.6, '/file2.ts', 20, 30),
        createChunk('chunk3', 'Low', 50, 0.3, '/file3.ts', 40, 50),
      ];

      const result = ContextBuilder.buildContext(chunks);

      expect(result.sources[0]?.score).toBe(0.9);
      expect(result.sources[1]?.score).toBe(0.6);
      expect(result.sources[2]?.score).toBe(0.3);
    });

    it('should include content snippet in sources', () => {
      const longContent = 'A'.repeat(200);
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', longContent, 50, 0.9, '/file.ts', 1, 10),
      ];

      const result = ContextBuilder.buildContext(chunks);

      expect(result.sources[0]?.snippet).toBeDefined();
      expect(result.sources[0]?.snippet.length).toBeLessThanOrEqual(103); // 100 + '...'
      expect(result.sources[0]?.snippet).toContain('...');
    });

    it('should not truncate short snippets', () => {
      const chunks: RetrievedChunk[] = [createChunk('chunk1', 'Short content', 50, 0.9)];

      const result = ContextBuilder.buildContext(chunks);

      expect(result.sources[0]?.snippet).toBe('Short content');
      expect(result.sources[0]?.snippet).not.toContain('...');
    });
  });

  describe('estimateTokens', () => {
    it('should estimate total tokens', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'Content', 100, 0.9),
        createChunk('chunk2', 'Content', 200, 0.8),
        createChunk('chunk3', 'Content', 300, 0.7),
      ];

      const totalTokens = ContextBuilder.estimateTokens(chunks);

      expect(totalTokens).toBe(600);
    });

    it('should return 0 for empty chunks', () => {
      const totalTokens = ContextBuilder.estimateTokens([]);

      expect(totalTokens).toBe(0);
    });
  });

  describe('fitsWithinBudget', () => {
    it('should return true if chunks fit within budget', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'Content', 100, 0.9),
        createChunk('chunk2', 'Content', 150, 0.8),
      ];

      const fits = ContextBuilder.fitsWithinBudget(chunks, 300);

      expect(fits).toBe(true);
    });

    it('should return false if chunks exceed budget', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'Content', 100, 0.9),
        createChunk('chunk2', 'Content', 150, 0.8),
      ];

      const fits = ContextBuilder.fitsWithinBudget(chunks, 200);

      expect(fits).toBe(false);
    });

    it('should return true for exact budget match', () => {
      const chunks: RetrievedChunk[] = [createChunk('chunk1', 'Content', 100, 0.9)];

      const fits = ContextBuilder.fitsWithinBudget(chunks, 100);

      expect(fits).toBe(true);
    });
  });

  describe('getChunksWithinBudget', () => {
    it('should return chunks that fit within budget', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'Content', 100, 0.9),
        createChunk('chunk2', 'Content', 100, 0.8),
        createChunk('chunk3', 'Content', 100, 0.7),
        createChunk('chunk4', 'Content', 100, 0.6),
      ];

      const selected = ContextBuilder.getChunksWithinBudget(chunks, 250);

      expect(selected).toHaveLength(2);
      expect(selected[0]?.id).toBe('chunk1');
      expect(selected[1]?.id).toBe('chunk2');
    });

    it('should return all chunks if within budget', () => {
      const chunks: RetrievedChunk[] = [
        createChunk('chunk1', 'Content', 50, 0.9),
        createChunk('chunk2', 'Content', 50, 0.8),
      ];

      const selected = ContextBuilder.getChunksWithinBudget(chunks, 200);

      expect(selected).toHaveLength(2);
    });

    it('should return empty array if first chunk exceeds budget', () => {
      const chunks: RetrievedChunk[] = [createChunk('chunk1', 'Content', 200, 0.9)];

      const selected = ContextBuilder.getChunksWithinBudget(chunks, 100);

      expect(selected).toHaveLength(0);
    });
  });

  describe('budget enforcement edge cases', () => {
    it('should handle single chunk exceeding budget', () => {
      const chunks: RetrievedChunk[] = [createChunk('chunk1', 'Very large chunk', 5000, 0.9)];

      const result = ContextBuilder.buildContext(chunks, { maxTokens: 4000 });

      expect(result.chunks).toHaveLength(0);
      expect(result.totalTokens).toBe(0);
    });

    it('should handle budget of 0', () => {
      const chunks: RetrievedChunk[] = [createChunk('chunk1', 'Content', 100, 0.9)];

      const result = ContextBuilder.buildContext(chunks, { maxTokens: 0 });

      expect(result.chunks).toHaveLength(0);
    });

    it('should handle very large budget', () => {
      const chunks: RetrievedChunk[] = [createChunk('chunk1', 'Content', 100, 0.9)];

      const result = ContextBuilder.buildContext(chunks, { maxTokens: 1000000 });

      expect(result.chunks).toHaveLength(1);
      expect(result.budgetAvailable).toBe(999900);
    });
  });
});
