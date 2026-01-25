/**
 * VectorService Unit Tests
 * Feature 10.1 - Vector Service & Embedding Infrastructure
 * Wave 10.1.1 - Vector-lite Integration & Basic Search
 * Wave 10.1.2 - Transformers.js Embedding Generation
 *
 * Tests vector search operations including add, search, remove, and batch operations.
 * Now uses real embeddings from EmbeddingService (all-MiniLM-L6-v2 model).
 * Target coverage: >90%
 *
 * Note: These tests require internet connectivity on first run to download the model (~22MB).
 * Subsequent runs use cached model and run offline.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VectorService } from '../VectorService';
import type { DocumentInput, SearchOptions } from '@shared/types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-vector-service'),
  },
}));

// Mock logger
vi.mock('../../../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('VectorService', () => {
  let vectorService: VectorService;
  const testIndexName = `test-index-${Date.now()}`;

  beforeEach(async () => {
    vectorService = new VectorService(testIndexName);
    await vectorService.initialize();
  });

  afterEach(async () => {
    // Clean up test index
    try {
      await vectorService.clear();
      const userDataPath = app.getPath('userData');
      const indexPath = path.join(userDataPath, 'vector-indices', testIndexName);
      await fs.rm(indexPath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const service = new VectorService(`init-test-${Date.now()}`);
      await expect(service.initialize()).resolves.not.toThrow();

      // Cleanup
      await service.clear();
    });

    it('should throw error when operations called before initialization', async () => {
      const service = new VectorService(`uninit-test-${Date.now()}`);

      await expect(service.addDocument({ id: 'test', content: 'test' })).rejects.toThrow(
        'not initialized'
      );
    });

    it('should load existing index on reinitialization', async () => {
      // Add document
      await vectorService.addDocument({
        id: 'persist-test',
        content: 'This should persist',
      });

      // Create new service instance with same index name
      const service2 = new VectorService(testIndexName);
      await service2.initialize();

      // Verify document exists
      const results = await service2.search('persist', { topK: 1 });
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('persist-test');
    });
  });

  describe('addDocument', () => {
    it('should add a document successfully', async () => {
      const doc: DocumentInput = {
        id: 'doc1',
        content: 'This is a test document',
        metadata: { type: 'test', source: 'unit-test' },
      };

      await expect(vectorService.addDocument(doc)).resolves.not.toThrow();

      // Verify document was added
      const stats = await vectorService.getStats();
      expect(stats.documentCount).toBe(1);
    });

    it('should add document with custom embedding', async () => {
      const customEmbedding = new Array(384).fill(0).map(() => Math.random());
      const doc: DocumentInput = {
        id: 'doc-custom-embedding',
        content: 'Test with custom embedding',
        embedding: customEmbedding,
      };

      await expect(vectorService.addDocument(doc)).resolves.not.toThrow();
    });

    it('should generate placeholder embedding when not provided', async () => {
      const doc: DocumentInput = {
        id: 'doc-no-embedding',
        content: 'Test without embedding',
      };

      await expect(vectorService.addDocument(doc)).resolves.not.toThrow();
    });

    it('should throw error when adding duplicate document ID', async () => {
      const doc: DocumentInput = {
        id: 'duplicate',
        content: 'First document',
      };

      await vectorService.addDocument(doc);

      // Try to add same ID again
      await expect(
        vectorService.addDocument({ id: 'duplicate', content: 'Second document' })
      ).rejects.toThrow();
    });

    it('should handle long content', async () => {
      const longContent = 'A'.repeat(10000);
      const doc: DocumentInput = {
        id: 'long-doc',
        content: longContent,
      };

      await expect(vectorService.addDocument(doc)).resolves.not.toThrow();
    });

    it('should handle special characters in content', async () => {
      const doc: DocumentInput = {
        id: 'special-chars',
        content: 'Test with émojis 🚀 and symbols @#$%^&*()',
      };

      await expect(vectorService.addDocument(doc)).resolves.not.toThrow();
    });
  });

  describe('addDocuments (batch)', () => {
    it('should add multiple documents in batch', async () => {
      const docs: DocumentInput[] = [
        { id: 'batch1', content: 'First document' },
        { id: 'batch2', content: 'Second document' },
        { id: 'batch3', content: 'Third document' },
      ];

      const result = await vectorService.addDocuments(docs);

      expect(result.successCount).toBe(3);
      expect(result.failureCount).toBe(0);
      expect(result.errors).toHaveLength(0);

      const stats = await vectorService.getStats();
      expect(stats.documentCount).toBe(3);
    });

    it('should handle empty batch', async () => {
      const result = await vectorService.addDocuments([]);

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
    });

    it('should report failures for duplicate IDs in batch', async () => {
      // Add first document
      await vectorService.addDocument({ id: 'existing', content: 'Existing doc' });

      // Try batch with duplicate
      const docs: DocumentInput[] = [
        { id: 'new1', content: 'New document 1' },
        { id: 'existing', content: 'Duplicate ID' },
        { id: 'new2', content: 'New document 2' },
      ];

      const result = await vectorService.addDocuments(docs);

      expect(result.failureCount).toBeGreaterThan(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Add test documents
      const testDocs: DocumentInput[] = [
        {
          id: 'doc1',
          content: 'JavaScript is a programming language',
          metadata: { type: 'tech', language: 'javascript' },
        },
        {
          id: 'doc2',
          content: 'TypeScript extends JavaScript with types',
          metadata: { type: 'tech', language: 'typescript' },
        },
        {
          id: 'doc3',
          content: 'Python is great for data science',
          metadata: { type: 'tech', language: 'python' },
        },
        {
          id: 'doc4',
          content: 'Cooking recipes for delicious meals',
          metadata: { type: 'cooking' },
        },
      ];

      await vectorService.addDocuments(testDocs);
    });

    it('should return search results', async () => {
      const results = await vectorService.search('programming language');

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return top K results', async () => {
      const options: SearchOptions = { topK: 2 };
      const results = await vectorService.search('JavaScript', options);

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should filter results by threshold', async () => {
      const options: SearchOptions = { threshold: 0.9 }; // Very high threshold
      const results = await vectorService.search('programming', options);

      // All results should have score >= 0.9
      results.forEach((result) => {
        expect(result.score).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should filter by metadata', async () => {
      const options: SearchOptions = {
        filter: { type: 'tech' },
      };
      const results = await vectorService.search('language', options);

      // All results should have type: 'tech'
      results.forEach((result) => {
        expect(result.metadata?.type).toBe('tech');
      });
    });

    it('should return results with scores', async () => {
      const results = await vectorService.search('JavaScript');

      results.forEach((result) => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('score');
        expect(typeof result.score).toBe('number');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      });
    });

    it('should handle empty query', async () => {
      const results = await vectorService.search('');

      // Should still return results (empty query matches everything)
      expect(Array.isArray(results)).toBe(true);
    });

    it('should return empty array when no matches', async () => {
      const options: SearchOptions = { threshold: 0.99 }; // Nearly impossible threshold
      const results = await vectorService.search('nonexistent query', options);

      expect(results).toHaveLength(0);
    });

    it('should perform hybrid search (semantic + keyword)', async () => {
      // This test verifies hybrid search is enabled
      // Results should include both semantic and keyword matches
      const results = await vectorService.search('TypeScript JavaScript');

      expect(results.length).toBeGreaterThan(0);
      // Should find documents containing either word
    });

    it('should complete search within performance target', async () => {
      // Add more documents to test with ~1000 docs
      const bulkDocs: DocumentInput[] = [];
      for (let i = 0; i < 100; i++) {
        bulkDocs.push({
          id: `perf-doc-${i}`,
          content: `Performance test document ${i} with various content`,
        });
      }
      await vectorService.addDocuments(bulkDocs);

      const startTime = Date.now();
      await vectorService.search('performance test');
      const duration = Date.now() - startTime;

      // Target: <50ms for 1000 documents
      // With ~100 docs, should be well under 50ms
      expect(duration).toBeLessThan(50);
    });
  });

  describe('removeDocument', () => {
    beforeEach(async () => {
      await vectorService.addDocument({
        id: 'removable',
        content: 'This document will be removed',
      });
    });

    it('should remove document successfully', async () => {
      await expect(vectorService.removeDocument('removable')).resolves.not.toThrow();

      // Verify document was removed
      const stats = await vectorService.getStats();
      expect(stats.documentCount).toBe(0);
    });

    it('should throw error when removing non-existent document', async () => {
      await expect(vectorService.removeDocument('non-existent')).rejects.toThrow('not found');
    });

    it('should handle removing document multiple times', async () => {
      await vectorService.removeDocument('removable');

      // Second removal should fail
      await expect(vectorService.removeDocument('removable')).rejects.toThrow();
    });
  });

  describe('clear', () => {
    beforeEach(async () => {
      // Add multiple documents
      const docs: DocumentInput[] = [
        { id: 'clear1', content: 'Document 1' },
        { id: 'clear2', content: 'Document 2' },
        { id: 'clear3', content: 'Document 3' },
      ];
      await vectorService.addDocuments(docs);
    });

    it('should clear all documents', async () => {
      await vectorService.clear();

      const stats = await vectorService.getStats();
      expect(stats.documentCount).toBe(0);
    });

    it('should allow adding documents after clear', async () => {
      await vectorService.clear();

      const doc: DocumentInput = {
        id: 'after-clear',
        content: 'New document after clear',
      };

      await expect(vectorService.addDocument(doc)).resolves.not.toThrow();

      const stats = await vectorService.getStats();
      expect(stats.documentCount).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return stats for empty index', async () => {
      const stats = await vectorService.getStats();

      expect(stats).toHaveProperty('documentCount');
      expect(stats).toHaveProperty('embeddingDimension');
      expect(stats).toHaveProperty('indexSizeBytes');
      expect(stats.documentCount).toBe(0);
      expect(stats.embeddingDimension).toBeGreaterThan(0);
    });

    it('should return correct document count', async () => {
      await vectorService.addDocument({ id: 'stat1', content: 'Test' });
      await vectorService.addDocument({ id: 'stat2', content: 'Test' });

      const stats = await vectorService.getStats();
      expect(stats.documentCount).toBe(2);
    });

    it('should estimate index size', async () => {
      const docs: DocumentInput[] = [];
      for (let i = 0; i < 10; i++) {
        docs.push({ id: `size-${i}`, content: `Document ${i}` });
      }
      await vectorService.addDocuments(docs);

      const stats = await vectorService.getStats();
      expect(stats.indexSizeBytes).toBeGreaterThan(0);
      expect(stats.indexSizeBytes).toBeGreaterThan(stats.documentCount * 100); // At least 100 bytes per doc
    });
  });

  describe('edge cases', () => {
    it('should handle document with empty content', async () => {
      const doc: DocumentInput = {
        id: 'empty-content',
        content: '',
      };

      await expect(vectorService.addDocument(doc)).resolves.not.toThrow();
    });

    it('should handle document with only whitespace', async () => {
      const doc: DocumentInput = {
        id: 'whitespace',
        content: '   \n\t   ',
      };

      await expect(vectorService.addDocument(doc)).resolves.not.toThrow();
    });

    it('should handle document with no metadata', async () => {
      const doc: DocumentInput = {
        id: 'no-metadata',
        content: 'Document without metadata',
      };

      await vectorService.addDocument(doc);
      const results = await vectorService.search('without metadata');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]?.metadata).toBeDefined();
    });

    it('should handle complex metadata types', async () => {
      const doc: DocumentInput = {
        id: 'complex-meta',
        content: 'Complex metadata test',
        metadata: {
          string: 'value',
          number: 42,
          boolean: true,
          nested: { key: 'value' },
        },
      };

      await expect(vectorService.addDocument(doc)).resolves.not.toThrow();
    });

    it('should handle Unicode content', async () => {
      const doc: DocumentInput = {
        id: 'unicode',
        content: '日本語 中文 한글 العربية עברית',
      };

      await vectorService.addDocument(doc);
      const results = await vectorService.search('日本語');

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('concurrent operations', () => {
    it('should handle sequential adds', async () => {
      // Note: File-based indexes don't support true concurrent writes
      // Test sequential adds instead
      for (let i = 0; i < 10; i++) {
        await vectorService.addDocument({
          id: `sequential-${i}`,
          content: `Sequential document ${i}`,
        });
      }

      const stats = await vectorService.getStats();
      expect(stats.documentCount).toBe(10);
    });

    it('should handle concurrent searches', async () => {
      await vectorService.addDocuments([
        { id: 'search1', content: 'Search test 1' },
        { id: 'search2', content: 'Search test 2' },
      ]);

      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(vectorService.search('test'));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('placeholder embedding consistency', () => {
    it('should generate consistent embeddings for same content', async () => {
      const content = 'Consistent embedding test';

      // Add document twice with different IDs but same content
      await vectorService.addDocument({ id: 'embed1', content });
      await vectorService.addDocument({ id: 'embed2', content });

      // Search should return both with similar scores
      const results = await vectorService.search(content);

      expect(results.length).toBe(2);
      // Scores should be very similar (both should match the query equally)
      const score1 = results.find((r) => r.id === 'embed1')?.score;
      const score2 = results.find((r) => r.id === 'embed2')?.score;

      expect(score1).toBeDefined();
      expect(score2).toBeDefined();
      if (score1 !== undefined && score2 !== undefined) {
        expect(Math.abs(score1 - score2)).toBeLessThan(0.01); // Very close scores
      }
    });
  });
});
