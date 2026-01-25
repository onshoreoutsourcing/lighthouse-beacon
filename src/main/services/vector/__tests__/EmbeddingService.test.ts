/**
 * EmbeddingService Unit Tests
 * Wave 10.1.2 - Transformers.js Embedding Generation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EmbeddingService } from '../EmbeddingService';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

// Mock electron app module
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => path.join(os.tmpdir(), 'test-embedding-service')),
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

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let testModelPath: string;

  beforeEach(() => {
    // Use temporary directory for tests
    testModelPath = path.join(os.tmpdir(), 'test-embedding-service', 'models');
    service = new EmbeddingService(testModelPath);
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(path.join(os.tmpdir(), 'test-embedding-service'), {
        recursive: true,
        force: true,
      });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Constructor and Initialization', () => {
    it('should create instance with default configuration', () => {
      expect(service).toBeDefined();
      expect(service.getEmbeddingDimension()).toBe(384);
      expect(service.isReady()).toBe(false);
    });

    it('should use custom model path when provided', () => {
      const customPath = '/custom/model/path';
      const customService = new EmbeddingService(customPath);
      expect(customService.getModelPath()).toBe(customPath);
    });

    it('should initialize successfully', async () => {
      // This will download the model (~22MB) on first run
      // Subsequent runs will use cache
      await service.initialize();

      expect(service.isReady()).toBe(true);

      // Check model directory was created
      const stats = await fs.stat(testModelPath);
      expect(stats.isDirectory()).toBe(true);
    }, 60000); // 60s timeout for model download

    it('should be idempotent - multiple initializations should work', async () => {
      await service.initialize();
      await service.initialize(); // Second call should not error
      expect(service.isReady()).toBe(true);
    }, 60000);
  });

  describe('Embedding Generation', () => {
    beforeEach(async () => {
      await service.initialize();
    }, 60000);

    it('should generate 384-dimensional embeddings', async () => {
      const text = 'Hello world';
      const embedding = await service.generateEmbedding(text);

      expect(embedding).toBeDefined();
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBe(384);
    });

    it('should generate embeddings within performance target (<2s)', async () => {
      const text =
        'This is a test document for measuring embedding generation performance in Lighthouse Chat IDE.';
      const startTime = Date.now();

      await service.generateEmbedding(text);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // <2s requirement
    });

    it('should generate embeddings with values in range [-1, 1]', async () => {
      const text = 'Test document for value range validation';
      const embedding = await service.generateEmbedding(text);

      // Check all values are in valid range
      for (const value of embedding) {
        expect(value).toBeGreaterThanOrEqual(-1);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('should generate normalized embeddings by default', async () => {
      const text = 'Test normalization';
      const embedding = await service.generateEmbedding(text);

      // Calculate L2 norm (should be close to 1 for normalized vectors)
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      expect(norm).toBeCloseTo(1, 5); // 5 decimal places precision
    });

    it('should generate consistent embeddings for same input', async () => {
      const text = 'Consistent embedding test';

      const embedding1 = await service.generateEmbedding(text);
      const embedding2 = await service.generateEmbedding(text);

      // Embeddings should be identical for same input
      expect(embedding1.length).toBe(embedding2.length);
      for (let i = 0; i < embedding1.length; i++) {
        const val1 = embedding1[i];
        const val2 = embedding2[i];
        if (val1 !== undefined && val2 !== undefined) {
          expect(val1).toBeCloseTo(val2, 5);
        }
      }
    });

    it('should generate different embeddings for different inputs', async () => {
      const text1 = 'First document about machine learning';
      const text2 = 'Second document about cooking recipes';

      const embedding1 = await service.generateEmbedding(text1);
      const embedding2 = await service.generateEmbedding(text2);

      // Calculate cosine similarity
      let dotProduct = 0;
      for (let i = 0; i < embedding1.length; i++) {
        const val1 = embedding1[i];
        const val2 = embedding2[i];
        if (val1 !== undefined && val2 !== undefined) {
          dotProduct += val1 * val2;
        }
      }

      // Different topics should have lower similarity
      // (normalized vectors, so cosine similarity = dot product)
      expect(dotProduct).toBeLessThan(0.9); // Not too similar
    });

    it('should throw error for empty text', async () => {
      await expect(service.generateEmbedding('')).rejects.toThrow(
        'Cannot generate embedding for empty text'
      );
    });

    it('should throw error when not initialized', async () => {
      const uninitializedService = new EmbeddingService(path.join(os.tmpdir(), 'uninit-test'));
      // Don't call initialize()

      // Force the service to think it's not ready
      await expect(
        async () => await uninitializedService.generateEmbedding('test')
      ).rejects.toThrow();
    });

    it('should handle long text documents', async () => {
      const longText = 'word '.repeat(1000); // ~1000 words
      const embedding = await service.generateEmbedding(longText);

      expect(embedding.length).toBe(384);
    });
  });

  describe('Batch Embedding Generation', () => {
    beforeEach(async () => {
      await service.initialize();
    }, 60000);

    it('should generate batch embeddings for multiple texts', async () => {
      const texts = ['First document', 'Second document', 'Third document'];

      const embeddings = await service.generateBatchEmbeddings(texts);

      expect(embeddings.length).toBe(3);
      embeddings.forEach((embedding) => {
        expect(embedding.length).toBe(384);
      });
    });

    it('should return empty array for empty input', async () => {
      const embeddings = await service.generateBatchEmbeddings([]);
      expect(embeddings).toEqual([]);
    });

    it('should emit progress events during batch processing', async () => {
      const texts = ['Doc 1', 'Doc 2', 'Doc 3', 'Doc 4', 'Doc 5'];
      const progressEvents: Array<{ current: number; total: number }> = [];

      service.on('batchProgress', (current: number, total: number) => {
        progressEvents.push({ current, total });
      });

      await service.generateBatchEmbeddings(texts);

      // Should have progress events
      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[progressEvents.length - 1]).toEqual({
        current: 5,
        total: 5,
      });
    });

    it('should handle batch embedding within reasonable time', async () => {
      const texts = Array(10).fill('Test document for batch performance') as string[];
      const startTime = Date.now();

      await service.generateBatchEmbeddings(texts);

      const duration = Date.now() - startTime;
      const avgPerDoc = duration / texts.length;

      expect(avgPerDoc).toBeLessThan(2000); // <2s per document
    });
  });

  describe('Model Management', () => {
    it('should check if model is cached', async () => {
      const isCached = await service.isModelCached();
      // May be true or false depending on previous test runs
      expect(typeof isCached).toBe('boolean');
    });

    it('should return model path', () => {
      const modelPath = service.getModelPath();
      expect(modelPath).toBe(testModelPath);
    });

    it('should emit ready event when initialized', async () => {
      const readyPromise = new Promise<void>((resolve) => {
        service.on('ready', resolve);
      });

      await service.initialize();
      await readyPromise;

      expect(service.isReady()).toBe(true);
    }, 60000);
  });

  describe('Error Handling and Timeouts', () => {
    beforeEach(async () => {
      await service.initialize();
    }, 60000);

    it('should handle timeout for very slow operations', async () => {
      // Use very short timeout to trigger timeout
      await expect(service.generateEmbedding('Test timeout', { timeout: 1 })).rejects.toThrow(
        /timed out/i
      );
    });

    it('should support operation cancellation', async () => {
      const texts = Array(100).fill('Test document') as string[];

      // Start batch operation
      const batchPromise = service.generateBatchEmbeddings(texts);

      // Cancel after short delay
      setTimeout(() => service.cancelOperation(), 100);

      // Should throw cancellation error
      await expect(batchPromise).rejects.toThrow(/cancelled/i);
    });
  });

  describe('Embedding Options', () => {
    beforeEach(async () => {
      await service.initialize();
    }, 60000);

    it('should respect normalize option', async () => {
      const text = 'Test normalization option';

      // Default normalized
      const normalizedEmbedding = await service.generateEmbedding(text, {
        normalize: true,
      });
      const norm1 = Math.sqrt(normalizedEmbedding.reduce((sum, val) => sum + val * val, 0));
      expect(norm1).toBeCloseTo(1, 5);

      // Without normalization
      const unnormalizedEmbedding = await service.generateEmbedding(text, {
        normalize: false,
      });
      const norm2 = Math.sqrt(unnormalizedEmbedding.reduce((sum, val) => sum + val * val, 0));

      // Unnormalized may have different magnitude
      expect(norm2).toBeGreaterThan(0);
      // But both should still be 384 dimensions
      expect(unnormalizedEmbedding.length).toBe(384);
    });

    it('should support different pooling strategies', async () => {
      const text = 'Test pooling strategies';

      const meanPooling = await service.generateEmbedding(text, {
        pooling: 'mean',
      });
      const clsPooling = await service.generateEmbedding(text, { pooling: 'cls' });

      // Both should produce valid embeddings
      expect(meanPooling.length).toBe(384);
      expect(clsPooling.length).toBe(384);

      // Different pooling should produce different results
      let areDifferent = false;
      for (let i = 0; i < meanPooling.length; i++) {
        const val1 = meanPooling[i];
        const val2 = clsPooling[i];
        if (val1 !== undefined && val2 !== undefined && Math.abs(val1 - val2) > 0.001) {
          areDifferent = true;
          break;
        }
      }
      expect(areDifferent).toBe(true);
    });
  });

  describe('Service State', () => {
    it('should return correct state information', () => {
      const state = service.getState();
      expect(state.isReady).toBe(false);
      expect(state.isDownloading).toBe(false);
      expect(state.downloadAttempts).toBe(0);
    });

    it('should update state during initialization', async () => {
      const initialState = service.getState();
      expect(initialState.isReady).toBe(false);

      await service.initialize();

      const finalState = service.getState();
      expect(finalState.isReady).toBe(true);
      expect(finalState.downloadAttempts).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Semantic Similarity', () => {
    beforeEach(async () => {
      await service.initialize();
    }, 60000);

    it('should generate similar embeddings for semantically similar text', async () => {
      const text1 = 'The quick brown fox jumps over the lazy dog';
      const text2 = 'A fast brown fox leaps over a sleepy dog';

      const embedding1 = await service.generateEmbedding(text1);
      const embedding2 = await service.generateEmbedding(text2);

      // Calculate cosine similarity
      let dotProduct = 0;
      for (let i = 0; i < embedding1.length; i++) {
        const val1 = embedding1[i];
        const val2 = embedding2[i];
        if (val1 !== undefined && val2 !== undefined) {
          dotProduct += val1 * val2;
        }
      }

      // Similar sentences should have high cosine similarity (>0.7)
      expect(dotProduct).toBeGreaterThan(0.7);
    });

    it('should generate dissimilar embeddings for unrelated text', async () => {
      const text1 = 'Machine learning algorithms for data analysis';
      const text2 = 'Cooking pasta with tomato sauce';

      const embedding1 = await service.generateEmbedding(text1);
      const embedding2 = await service.generateEmbedding(text2);

      // Calculate cosine similarity
      let dotProduct = 0;
      for (let i = 0; i < embedding1.length; i++) {
        const val1 = embedding1[i];
        const val2 = embedding2[i];
        if (val1 !== undefined && val2 !== undefined) {
          dotProduct += val1 * val2;
        }
      }

      // Unrelated topics should have lower similarity (<0.6)
      expect(dotProduct).toBeLessThan(0.6);
    });
  });
});
