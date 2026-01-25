/**
 * VectorService Integration Tests with Real Embeddings
 * Wave 10.1.2 - Transformers.js Embedding Generation
 *
 * Tests end-to-end workflow with real embedding generation.
 * Verifies semantic similarity works correctly with real embeddings.
 *
 * Note: Requires internet on first run to download model (~22MB).
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { VectorService } from '../VectorService';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import os from 'os';

// Mock electron app to use temp directory
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => path.join(os.tmpdir(), 'test-vector-integration')),
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

describe('VectorService Integration with Real Embeddings', () => {
  let vectorService: VectorService;
  const testIndexName = `integration-test-${Date.now()}`;

  beforeAll(async () => {
    vectorService = new VectorService(testIndexName);
    await vectorService.initialize();
  }, 60000); // 60s for model download on first run

  afterAll(async () => {
    // Clean up
    try {
      await vectorService.clear();
      const userDataPath = app.getPath('userData');
      const indexPath = path.join(userDataPath, 'vector-indices', testIndexName);
      await fs.rm(indexPath, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should add documents and generate real embeddings', async () => {
    const documents = [
      {
        id: 'doc1',
        content: 'Machine learning algorithms for data analysis',
      },
      {
        id: 'doc2',
        content: 'Artificial intelligence in modern computing',
      },
      {
        id: 'doc3',
        content: 'Cooking pasta with tomato sauce recipe',
      },
    ];

    // Add documents - should auto-generate embeddings
    for (const doc of documents) {
      await vectorService.addDocument(doc);
    }

    // Verify documents were added
    const stats = await vectorService.getStats();
    expect(stats.documentCount).toBe(3);
    expect(stats.embeddingDimension).toBe(384);
  }, 30000); // 30s timeout

  it('should find semantically similar documents', async () => {
    // Search for ML-related content
    const results = await vectorService.search('deep learning and neural networks', {
      topK: 3,
    });

    expect(results.length).toBeGreaterThan(0);

    // First result should be ML-related (doc1 or doc2)
    const topResult = results[0];
    if (topResult) {
      expect(['doc1', 'doc2']).toContain(topResult.id);

      // Cooking doc (doc3) should have lower score
      const cookingResult = results.find((r) => r.id === 'doc3');
      if (cookingResult) {
        expect(cookingResult.score).toBeLessThan(topResult.score);
      }
    }
  }, 10000);

  it('should generate consistent embeddings for same content', async () => {
    const testContent = 'Consistent embedding test content';

    // Add same content twice
    await vectorService.addDocument({
      id: 'consistent1',
      content: testContent,
    });

    await vectorService.addDocument({
      id: 'consistent2',
      content: testContent,
    });

    // Search with same content - should get high similarity
    const results = await vectorService.search(testContent, { topK: 2 });

    expect(results.length).toBe(2);
    // Both should have very high scores (close to 1.0 for identical content)
    expect(results[0]?.score).toBeGreaterThan(0.95);
    expect(results[1]?.score).toBeGreaterThan(0.95);
  }, 10000);

  it('should handle batch embedding efficiently', async () => {
    const batchDocs = Array.from({ length: 10 }, (_, i) => ({
      id: `batch-doc-${i}`,
      content: `Document ${i} about various topics including technology and science`,
    }));

    const startTime = Date.now();
    const result = await vectorService.addDocuments(batchDocs);
    const duration = Date.now() - startTime;

    expect(result.successCount).toBe(10);
    expect(result.failureCount).toBe(0);

    // Average should be <2s per document (requirement)
    const avgPerDoc = duration / 10;
    expect(avgPerDoc).toBeLessThan(2000);
  }, 30000);

  it('should return results ordered by semantic similarity', async () => {
    // Add documents with varying relevance to query
    await vectorService.clear();
    await vectorService.initialize();

    const docs = [
      {
        id: 'very-relevant',
        content: 'Python programming language for software development',
      },
      {
        id: 'somewhat-relevant',
        content: 'Computer science and programming concepts',
      },
      {
        id: 'not-relevant',
        content: 'Gardening tips for growing vegetables',
      },
    ];

    for (const doc of docs) {
      await vectorService.addDocument(doc);
    }

    const results = await vectorService.search('Python programming', { topK: 3 });

    // Results should be in descending order by score
    for (let i = 1; i < results.length; i++) {
      const prevScore = results[i - 1]?.score;
      const currScore = results[i]?.score;
      if (prevScore !== undefined && currScore !== undefined) {
        expect(prevScore).toBeGreaterThanOrEqual(currScore);
      }
    }

    // Most relevant should be first
    expect(results[0]?.id).toBe('very-relevant');
  }, 15000);

  it('should verify embedding service is ready after first use', () => {
    // After adding documents, embedding service should be ready
    expect(vectorService.isEmbeddingReady()).toBe(true);
  });
});
