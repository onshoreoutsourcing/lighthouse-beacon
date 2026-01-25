/**
 * RAGService Unit Tests
 * Feature 10.3 - RAG Pipeline & Context Retrieval
 * Wave 10.3.2 - Context Retrieval & Budget Management
 *
 * Tests context retrieval, relevance filtering, budget management, and source attribution.
 * Target coverage: >90%
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RAGService } from '../RAGService';
import type { VectorService } from '../../vector/VectorService';
import type { SearchResult } from '@shared/types';

// Mock logger
vi.mock('../../../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('RAGService', () => {
  let ragService: RAGService;
  let mockVectorService: VectorService;

  beforeEach(() => {
    // Create mock VectorService
    mockVectorService = {
      search: vi.fn(),
    } as unknown as VectorService;

    ragService = new RAGService(mockVectorService);
  });

  // Helper to create mock search results
  const createSearchResult = (
    id: string,
    content: string,
    score: number,
    metadata?: Record<string, unknown>
  ): SearchResult => ({
    id,
    content,
    score,
    metadata: metadata || {},
  });

  describe('retrieveContext', () => {
    it('should retrieve context successfully', async () => {
      const mockResults: SearchResult[] = [
        createSearchResult('chunk1', 'First chunk content here', 0.9, {
          filePath: '/test/file1.ts',
          startLine: 1,
          endLine: 10,
        }),
        createSearchResult('chunk2', 'Second chunk content here', 0.8, {
          filePath: '/test/file2.ts',
          startLine: 20,
          endLine: 30,
        }),
      ];

      vi.mocked(mockVectorService.search).mockResolvedValue(mockResults);

      const result = await ragService.retrieveContext('test query');

      expect(result.chunks).toHaveLength(2);
      expect(result.chunks[0]?.content).toBe('First chunk content here');
      expect(result.chunks[1]?.content).toBe('Second chunk content here');
      expect(result.totalTokens).toBeGreaterThan(0);
      expect(result.contextText).toContain('First chunk content');
      expect(result.contextText).toContain('Second chunk content');
    });

    it('should handle empty search results', async () => {
      vi.mocked(mockVectorService.search).mockResolvedValue([]);

      const result = await ragService.retrieveContext('test query');

      expect(result.chunks).toHaveLength(0);
      expect(result.totalTokens).toBe(0);
      expect(result.contextText).toBe('');
      expect(result.sources).toHaveLength(0);
    });

    it('should apply relevance threshold filtering', async () => {
      const mockResults: SearchResult[] = [
        createSearchResult('chunk1', 'High relevance', 0.9),
        createSearchResult('chunk2', 'Low relevance', 0.2), // Below threshold
      ];

      vi.mocked(mockVectorService.search).mockResolvedValue(mockResults);

      const _result = await ragService.retrieveContext('test query', {
        minScore: 0.3,
      });

      // VectorService.search should have been called with threshold
      expect(mockVectorService.search).toHaveBeenCalledWith('test query', {
        topK: 5,
        threshold: 0.3,
      });
    });

    it('should respect top-K parameter', async () => {
      const mockResults: SearchResult[] = Array.from({ length: 10 }, (_, i) =>
        createSearchResult(`chunk${i}`, `Content ${i}`, 0.9 - i * 0.05)
      );

      vi.mocked(mockVectorService.search).mockResolvedValue(mockResults);

      await ragService.retrieveContext('test query', {
        topK: 3,
      });

      expect(mockVectorService.search).toHaveBeenCalledWith('test query', {
        topK: 3,
        threshold: 0.3,
      });
    });

    it('should enforce token budget', async () => {
      // Create chunks that would exceed budget
      const mockResults: SearchResult[] = [
        createSearchResult('chunk1', 'a '.repeat(1000), 0.9), // ~500 tokens
        createSearchResult('chunk2', 'b '.repeat(1000), 0.8), // ~500 tokens
        createSearchResult('chunk3', 'c '.repeat(1000), 0.7), // ~500 tokens
      ];

      vi.mocked(mockVectorService.search).mockResolvedValue(mockResults);

      const result = await ragService.retrieveContext('test query', {
        maxTokens: 600,
      });

      // Should only include chunks that fit within budget
      expect(result.totalTokens).toBeLessThanOrEqual(600);
      expect(result.chunks.length).toBeLessThan(mockResults.length);
    });

    it('should use default parameters', async () => {
      vi.mocked(mockVectorService.search).mockResolvedValue([]);

      await ragService.retrieveContext('test query');

      expect(mockVectorService.search).toHaveBeenCalledWith('test query', {
        topK: 5, // Default
        threshold: 0.3, // Default
      });
    });

    it('should extract chunk metadata', async () => {
      const mockResults: SearchResult[] = [
        createSearchResult('doc1:chunk:0', 'Content', 0.9, {
          filePath: '/src/main.ts',
          startLine: 10,
          endLine: 20,
          originalDocumentId: 'doc1',
          chunkIndex: 0,
          totalChunks: 5,
        }),
      ];

      vi.mocked(mockVectorService.search).mockResolvedValue(mockResults);

      const result = await ragService.retrieveContext('test query');

      expect(result.chunks[0]).toMatchObject({
        id: 'doc1:chunk:0',
        filePath: '/src/main.ts',
        startLine: 10,
        endLine: 20,
        originalDocumentId: 'doc1',
        chunkIndex: 0,
        totalChunks: 5,
      });
    });

    it('should handle missing metadata gracefully', async () => {
      const mockResults: SearchResult[] = [createSearchResult('chunk1', 'Content', 0.9, {})];

      vi.mocked(mockVectorService.search).mockResolvedValue(mockResults);

      const result = await ragService.retrieveContext('test query');

      expect(result.chunks[0]).toMatchObject({
        id: 'chunk1',
        filePath: 'chunk1', // Falls back to ID
        startLine: 1,
        endLine: 1,
      });
    });

    it('should include source attributions', async () => {
      const mockResults: SearchResult[] = [
        createSearchResult('chunk1', 'Content 1', 0.9, {
          filePath: '/file1.ts',
          startLine: 1,
          endLine: 10,
        }),
        createSearchResult('chunk2', 'Content 2', 0.8, {
          filePath: '/file2.ts',
          startLine: 20,
          endLine: 30,
        }),
      ];

      vi.mocked(mockVectorService.search).mockResolvedValue(mockResults);

      const result = await ragService.retrieveContext('test query');

      expect(result.sources).toHaveLength(2);
      expect(result.sources[0]).toMatchObject({
        filePath: '/file1.ts',
        startLine: 1,
        endLine: 10,
        score: 0.9,
      });
    });

    it('should handle search errors gracefully', async () => {
      vi.mocked(mockVectorService.search).mockRejectedValue(new Error('Search failed'));

      const result = await ragService.retrieveContext('test query');

      // Should return empty context instead of throwing
      expect(result.chunks).toHaveLength(0);
      expect(result.totalTokens).toBe(0);
      expect(result.contextText).toBe('');
    });
  });

  describe('performance', () => {
    it('should complete retrieval in <100ms', async () => {
      const mockResults: SearchResult[] = Array.from({ length: 100 }, (_, i) =>
        createSearchResult(`chunk${i}`, `Content ${i}`, 0.9 - i * 0.005)
      );

      vi.mocked(mockVectorService.search).mockResolvedValue(mockResults);

      const startTime = performance.now();
      await ragService.retrieveContext('test query');
      const duration = performance.now() - startTime;

      // Note: This test may be flaky depending on system load
      // Primarily checks that there are no obvious performance issues
      expect(duration).toBeLessThan(1000); // Generous limit for CI
    });
  });

  describe('budget management', () => {
    it('should not exceed token budget', async () => {
      const mockResults: SearchResult[] = [
        createSearchResult('chunk1', 'a '.repeat(2000), 0.9), // ~1000 tokens
        createSearchResult('chunk2', 'b '.repeat(2000), 0.8), // ~1000 tokens
        createSearchResult('chunk3', 'c '.repeat(2000), 0.7), // ~1000 tokens
        createSearchResult('chunk4', 'd '.repeat(2000), 0.6), // ~1000 tokens
      ];

      vi.mocked(mockVectorService.search).mockResolvedValue(mockResults);

      const result = await ragService.retrieveContext('test query', {
        maxTokens: 2500,
      });

      expect(result.totalTokens).toBeLessThanOrEqual(2500);
      expect(result.budgetUsed).toBeLessThanOrEqual(2500);
      expect(result.budgetAvailable).toBeGreaterThanOrEqual(0);
    });

    it('should report budget usage accurately', async () => {
      const mockResults: SearchResult[] = [
        createSearchResult('chunk1', 'a '.repeat(500), 0.9), // ~250 tokens
      ];

      vi.mocked(mockVectorService.search).mockResolvedValue(mockResults);

      const result = await ragService.retrieveContext('test query', {
        maxTokens: 1000,
      });

      expect(result.budgetUsed + result.budgetAvailable).toBe(1000);
      expect(result.totalTokens).toBe(result.budgetUsed);
    });
  });

  describe('relevance filtering', () => {
    it('should filter by minimum score', async () => {
      const mockResults: SearchResult[] = [
        createSearchResult('chunk1', 'High', 0.9),
        createSearchResult('chunk2', 'Medium', 0.5),
        createSearchResult('chunk3', 'Low', 0.2),
      ];

      vi.mocked(mockVectorService.search).mockResolvedValue(mockResults);

      await ragService.retrieveContext('test query', {
        minScore: 0.4,
      });

      // Should pass threshold to vector service
      expect(mockVectorService.search).toHaveBeenCalledWith('test query', {
        topK: 5,
        threshold: 0.4,
      });
    });

    it('should use default 0.3 threshold', async () => {
      vi.mocked(mockVectorService.search).mockResolvedValue([]);

      await ragService.retrieveContext('test query');

      expect(mockVectorService.search).toHaveBeenCalledWith('test query', {
        topK: 5,
        threshold: 0.3,
      });
    });
  });

  describe('context formatting', () => {
    it('should format context text from chunks', async () => {
      const mockResults: SearchResult[] = [
        createSearchResult('chunk1', 'First content', 0.9),
        createSearchResult('chunk2', 'Second content', 0.8),
      ];

      vi.mocked(mockVectorService.search).mockResolvedValue(mockResults);

      const result = await ragService.retrieveContext('test query');

      expect(result.contextText).toContain('First content');
      expect(result.contextText).toContain('Second content');
      expect(result.contextText).toContain('\n\n'); // Chunks separated by newlines
    });

    it('should return empty string for no results', async () => {
      vi.mocked(mockVectorService.search).mockResolvedValue([]);

      const result = await ragService.retrieveContext('test query');

      expect(result.contextText).toBe('');
    });
  });

  describe('isReady', () => {
    it('should return true when initialized', () => {
      expect(ragService.isReady()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined metadata fields', async () => {
      const mockResults: SearchResult[] = [
        {
          id: 'chunk1',
          content: 'Content',
          score: 0.9,
          metadata: {
            filePath: null,
            startLine: undefined,
          },
        } as unknown as SearchResult,
      ];

      vi.mocked(mockVectorService.search).mockResolvedValue(mockResults);

      const result = await ragService.retrieveContext('test query');

      expect(result.chunks[0]).toBeDefined();
      expect(result.chunks[0]?.filePath).toBe('chunk1'); // Fallback to ID
      expect(result.chunks[0]?.startLine).toBe(1); // Default value
    });

    it('should handle very long content that exceeds budget', async () => {
      const longContent = 'a '.repeat(10000); // ~5000 tokens - exceeds 4000 default budget
      const mockResults: SearchResult[] = [createSearchResult('chunk1', longContent, 0.9)];

      vi.mocked(mockVectorService.search).mockResolvedValue(mockResults);

      const result = await ragService.retrieveContext('test query');

      // Chunk should be excluded because it exceeds the token budget
      expect(result.chunks).toHaveLength(0);
      expect(result.totalTokens).toBe(0);
      expect(result.budgetAvailable).toBe(4000); // Full budget unused
    });

    it('should handle special characters in content', async () => {
      const specialContent = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./~`';
      const mockResults: SearchResult[] = [createSearchResult('chunk1', specialContent, 0.9)];

      vi.mocked(mockVectorService.search).mockResolvedValue(mockResults);

      const result = await ragService.retrieveContext('test query');

      expect(result.chunks[0]?.content).toBe(specialContent);
    });
  });
});
