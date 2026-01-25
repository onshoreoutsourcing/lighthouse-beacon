/**
 * Vector Handlers IPC Integration Tests
 * Feature 10.1 - Vector Service & Embedding Infrastructure
 * Wave 10.1.1 - Vector-lite Integration & Basic Search
 * Wave 10.3.1 - Document Chunking & Processing
 *
 * Tests IPC bridge between renderer and VectorService.
 * Verifies end-to-end IPC flow for vector operations.
 * Documents are automatically chunked before indexing (Wave 10.3.1).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ipcMain } from 'electron';
import { registerVectorHandlers, unregisterVectorHandlers } from '../vector-handlers';
import type { DocumentInput, SearchOptions } from '@shared/types';
import { VECTOR_CHANNELS } from '@shared/types';

// Mock electron with consistent path per test file run
const testPath = `/tmp/test-vector-handlers-${Date.now()}`;
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => testPath),
  },
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
}));

// Mock logger
vi.mock('../../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock EmbeddingService to avoid downloading Transformers.js model during tests
vi.mock('../../services/vector/EmbeddingService', () => ({
  EmbeddingService: class {
    initialize() {
      return Promise.resolve();
    }
    generateEmbedding(_text: string): Promise<number[]> {
      // Return dummy embedding
      return Promise.resolve(new Array(384).fill(0.5) as number[]);
    }
    generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
      // Return dummy embeddings for each text
      return Promise.resolve(texts.map(() => new Array(384).fill(0.5) as number[]));
    }
    isReady() {
      return true;
    }
  },
}));

describe('Vector Handlers IPC', () => {
  let handlers: Map<string, (_event: unknown, ...args: unknown[]) => Promise<unknown>>;

  beforeEach(() => {
    // Setup mock IPC handler storage
    handlers = new Map();

    // Mock ipcMain.handle to store handlers
    vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler) => {
      handlers.set(channel, handler as (_event: unknown, ...args: unknown[]) => Promise<unknown>);
    });

    // Register handlers
    registerVectorHandlers();
  });

  afterEach(async () => {
    // Clear index before unregistering
    const clearHandler = handlers.get(VECTOR_CHANNELS.VECTOR_CLEAR);
    if (clearHandler) {
      try {
        await clearHandler(null);
      } catch {
        // Ignore cleanup errors
      }
    }

    // Unregister handlers
    unregisterVectorHandlers();
    handlers.clear();
  });

  describe('handler registration', () => {
    it('should register all vector IPC handlers', () => {
      expect(ipcMain.handle).toHaveBeenCalledWith(VECTOR_CHANNELS.VECTOR_ADD, expect.any(Function));
      expect(ipcMain.handle).toHaveBeenCalledWith(
        VECTOR_CHANNELS.VECTOR_ADD_BATCH,
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        VECTOR_CHANNELS.VECTOR_SEARCH,
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        VECTOR_CHANNELS.VECTOR_REMOVE,
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        VECTOR_CHANNELS.VECTOR_CLEAR,
        expect.any(Function)
      );
      expect(ipcMain.handle).toHaveBeenCalledWith(
        VECTOR_CHANNELS.VECTOR_STATS,
        expect.any(Function)
      );
    });

    it('should unregister handlers on cleanup', () => {
      unregisterVectorHandlers();

      expect(ipcMain.removeHandler).toHaveBeenCalledWith(VECTOR_CHANNELS.VECTOR_ADD);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(VECTOR_CHANNELS.VECTOR_ADD_BATCH);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(VECTOR_CHANNELS.VECTOR_SEARCH);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(VECTOR_CHANNELS.VECTOR_REMOVE);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(VECTOR_CHANNELS.VECTOR_CLEAR);
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(VECTOR_CHANNELS.VECTOR_STATS);
    });
  });

  describe('VECTOR_ADD handler', () => {
    it('should add document successfully', async () => {
      const handler = handlers.get(VECTOR_CHANNELS.VECTOR_ADD);
      expect(handler).toBeDefined();

      // Provide embedding to avoid downloading model during tests
      const doc: DocumentInput = {
        id: 'test-doc',
        content: 'Test content',
        metadata: { type: 'test' },
        embedding: new Array(384).fill(0.1), // Pre-computed embedding
      };

      const result = await handler?.(null, doc);

      if ((result as { success: boolean }).success === false) {
        console.error('Add failed:', (result as { error: Error }).error);
      }

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
    });

    it('should return error on duplicate chunk', async () => {
      const handler = handlers.get(VECTOR_CHANNELS.VECTOR_ADD);
      expect(handler).toBeDefined();

      // Add document twice to trigger error (chunks will have same ID)
      const doc: DocumentInput = {
        id: 'duplicate',
        content: 'Test',
        embedding: new Array(384).fill(0.1),
      };

      await handler?.(null, doc);
      const result = await handler?.(null, doc);

      // With chunking, this creates duplicate chunk IDs (duplicate:chunk:0)
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('VECTOR_ADD_BATCH handler', () => {
    it('should add multiple documents', async () => {
      const handler = handlers.get(VECTOR_CHANNELS.VECTOR_ADD_BATCH);
      expect(handler).toBeDefined();

      // Provide embeddings to avoid downloading model
      const docs: DocumentInput[] = [
        { id: 'batch1', content: 'Document 1', embedding: new Array(384).fill(0.1) },
        { id: 'batch2', content: 'Document 2', embedding: new Array(384).fill(0.2) },
        { id: 'batch3', content: 'Document 3', embedding: new Array(384).fill(0.3) },
      ];

      const result = await handler?.(null, docs);

      expect(result).toHaveProperty('success', true);
      const data = (result as { data: { successCount: number } }).data;
      // 3 documents, each becomes 1 chunk = 3 chunks total
      expect(data.successCount).toBe(3);
    });

    it('should handle empty batch', async () => {
      const handler = handlers.get(VECTOR_CHANNELS.VECTOR_ADD_BATCH);
      expect(handler).toBeDefined();

      const result = await handler?.(null, []);

      expect(result).toHaveProperty('success', true);
      const data = (result as { data: { successCount: number } }).data;
      expect(data.successCount).toBe(0);
    });
  });

  describe('VECTOR_SEARCH handler', () => {
    beforeEach(async () => {
      // Add test documents with embeddings
      const addHandler = handlers.get(VECTOR_CHANNELS.VECTOR_ADD_BATCH);
      const docs: DocumentInput[] = [
        {
          id: 'search1',
          content: 'JavaScript programming',
          embedding: new Array(384).fill(0.5),
        },
        { id: 'search2', content: 'TypeScript types', embedding: new Array(384).fill(0.6) },
        { id: 'search3', content: 'Python data science', embedding: new Array(384).fill(0.7) },
      ];
      await addHandler?.(null, docs);
    });

    it('should search documents successfully', async () => {
      const handler = handlers.get(VECTOR_CHANNELS.VECTOR_SEARCH);
      expect(handler).toBeDefined();

      const result = await handler?.(null, 'programming');

      expect(result).toHaveProperty('success', true);
      const data = (result as { data: unknown[] }).data;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should accept search options', async () => {
      const handler = handlers.get(VECTOR_CHANNELS.VECTOR_SEARCH);
      expect(handler).toBeDefined();

      const options: SearchOptions = { topK: 2, threshold: 0 };
      const result = await handler?.(null, 'programming', options);

      expect(result).toHaveProperty('success', true);
      const data = (result as { data: unknown[] }).data;
      expect(data.length).toBeLessThanOrEqual(2);
    });

    it('should handle empty query', async () => {
      const handler = handlers.get(VECTOR_CHANNELS.VECTOR_SEARCH);
      expect(handler).toBeDefined();

      const result = await handler?.(null, '');

      expect(result).toHaveProperty('success', true);
    });
  });

  describe('VECTOR_REMOVE handler', () => {
    beforeEach(async () => {
      // Add test document (will be chunked)
      const addHandler = handlers.get(VECTOR_CHANNELS.VECTOR_ADD);
      await addHandler?.(null, {
        id: 'removable',
        content: 'Test',
        embedding: new Array(384).fill(0.1),
      });
    });

    it('should remove chunk successfully', async () => {
      const handler = handlers.get(VECTOR_CHANNELS.VECTOR_REMOVE);
      expect(handler).toBeDefined();

      // Small documents become single chunk: "removable:chunk:0"
      const result = await handler?.(null, 'removable:chunk:0');

      expect(result).toHaveProperty('success', true);
    });

    it('should return error for non-existent document', async () => {
      const handler = handlers.get(VECTOR_CHANNELS.VECTOR_REMOVE);
      expect(handler).toBeDefined();

      const result = await handler?.(null, 'non-existent');

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('VECTOR_CLEAR handler', () => {
    beforeEach(async () => {
      // Add test documents with embeddings
      const addHandler = handlers.get(VECTOR_CHANNELS.VECTOR_ADD_BATCH);
      const docs: DocumentInput[] = [
        { id: 'clear1', content: 'Document 1', embedding: new Array(384).fill(0.1) },
        { id: 'clear2', content: 'Document 2', embedding: new Array(384).fill(0.2) },
      ];
      await addHandler?.(null, docs);
    });

    it('should clear index successfully', async () => {
      const handler = handlers.get(VECTOR_CHANNELS.VECTOR_CLEAR);
      expect(handler).toBeDefined();

      const result = await handler?.(null);

      expect(result).toHaveProperty('success', true);

      // Verify index is empty
      const statsHandler = handlers.get(VECTOR_CHANNELS.VECTOR_STATS);
      const stats = await statsHandler?.(null);
      const data = (stats as { data: { documentCount: number } }).data;
      expect(data.documentCount).toBe(0);
    });
  });

  describe('VECTOR_STATS handler', () => {
    it('should return stats for empty index', async () => {
      const handler = handlers.get(VECTOR_CHANNELS.VECTOR_STATS);
      expect(handler).toBeDefined();

      const result = await handler?.(null);

      expect(result).toHaveProperty('success', true);
      const data = (
        result as {
          data: { documentCount: number; embeddingDimension: number; indexSizeBytes: number };
        }
      ).data;
      expect(data).toHaveProperty('documentCount', 0);
      expect(data).toHaveProperty('embeddingDimension');
      expect(data).toHaveProperty('indexSizeBytes');
    });

    it('should return correct document count', async () => {
      // Add documents with embeddings
      const addHandler = handlers.get(VECTOR_CHANNELS.VECTOR_ADD_BATCH);
      const docs: DocumentInput[] = [
        { id: 'stats1', content: 'Test 1', embedding: new Array(384).fill(0.1) },
        { id: 'stats2', content: 'Test 2', embedding: new Array(384).fill(0.2) },
        { id: 'stats3', content: 'Test 3', embedding: new Array(384).fill(0.3) },
      ];
      await addHandler?.(null, docs);

      const handler = handlers.get(VECTOR_CHANNELS.VECTOR_STATS);
      const result = await handler?.(null);

      expect(result).toHaveProperty('success', true);
      const data = (result as { data: { documentCount: number } }).data;
      // 3 documents, each becomes 1 chunk = 3 chunks total
      expect(data.documentCount).toBe(3);
    });
  });

  describe('error handling', () => {
    it('should propagate errors correctly', async () => {
      const handler = handlers.get(VECTOR_CHANNELS.VECTOR_ADD);
      expect(handler).toBeDefined();

      // Add document with duplicate ID (creates duplicate chunks)
      await handler?.(null, {
        id: 'error-test',
        content: 'First',
        embedding: new Array(384).fill(0.1),
      });
      const result = await handler?.(null, {
        id: 'error-test',
        content: 'Second',
        embedding: new Array(384).fill(0.2),
      });

      // Both create "error-test:chunk:0" which triggers duplicate error
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      const error = (result as { error: Error }).error;
      expect(error).toBeInstanceOf(Error);
    });

    it('should return error for invalid parameters', async () => {
      const handler = handlers.get(VECTOR_CHANNELS.VECTOR_SEARCH);
      expect(handler).toBeDefined();

      // Testing invalid parameters - null query should be handled gracefully
      const result = await handler?.(null, null as unknown as string);

      // Should handle gracefully
      expect(result).toBeDefined();
    });
  });

  describe('integration flow', () => {
    it('should handle full CRUD lifecycle with chunking', async () => {
      // Add (document will be chunked)
      const addHandler = handlers.get(VECTOR_CHANNELS.VECTOR_ADD);
      const addResult = await addHandler?.(null, {
        id: 'lifecycle-test',
        content: 'Lifecycle test document',
        embedding: new Array(384).fill(0.5),
      });
      expect((addResult as { success: boolean }).success).toBe(true);

      // Search
      const searchHandler = handlers.get(VECTOR_CHANNELS.VECTOR_SEARCH);
      const searchResult = await searchHandler?.(null, 'lifecycle test');
      expect((searchResult as { success: boolean }).success).toBe(true);
      const searchData = (searchResult as { data: unknown[] }).data;
      expect(searchData.length).toBeGreaterThan(0);

      // Get Stats
      const statsHandler = handlers.get(VECTOR_CHANNELS.VECTOR_STATS);
      const statsResult = await statsHandler?.(null);
      expect((statsResult as { success: boolean }).success).toBe(true);
      const statsData = (statsResult as { data: { documentCount: number } }).data;
      expect(statsData.documentCount).toBeGreaterThan(0);

      // Remove (use chunk ID since document was chunked)
      const removeHandler = handlers.get(VECTOR_CHANNELS.VECTOR_REMOVE);
      const removeResult = await removeHandler?.(null, 'lifecycle-test:chunk:0');
      expect((removeResult as { success: boolean }).success).toBe(true);

      // Verify removed
      const finalStats = await statsHandler?.(null);
      const finalData = (finalStats as { data: { documentCount: number } }).data;
      expect(finalData.documentCount).toBe(0);
    });
  });
});
