/**
 * RAG IPC Handlers Unit Tests
 * Feature 10.3 - RAG Pipeline & Context Retrieval
 * Wave 10.3.2 - Context Retrieval & Budget Management
 *
 * Tests IPC bridge for RAG context retrieval operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ipcMain } from 'electron';
import { RAG_CHANNELS } from '@shared/types';
import type { RetrievedContext, RetrievalOptions } from '@shared/types';
import { registerRAGHandlers, unregisterRAGHandlers, resetRAGHandlers } from '../rag-handlers';

// Mock electron
const testPath = `/tmp/test-rag-handlers-${Date.now()}`;
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

// Create mock function instances that will be shared across all tests
const mockRetrieveContext = vi.fn().mockResolvedValue({
  chunks: [],
  sources: [],
  contextText: '',
  totalTokens: 0,
  budgetUsed: 0,
  budgetAvailable: 4000,
});

// Mock VectorService
vi.mock('../../services/vector/VectorService', () => ({
  VectorService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue([]),
  })),
}));

// Mock RAGService
vi.mock('../../services/rag/RAGService', () => ({
  RAGService: vi.fn().mockImplementation(() => ({
    retrieveContext: mockRetrieveContext,
  })),
}));

describe('RAG IPC Handlers', () => {
  let handlers: Map<string, (_event: unknown, ...args: unknown[]) => Promise<unknown>>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock IPC handler storage
    handlers = new Map();

    // Mock ipcMain.handle to store handlers
    vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler) => {
      handlers.set(channel, handler as (_event: unknown, ...args: unknown[]) => Promise<unknown>);
    });

    // Reset singleton instances
    resetRAGHandlers();

    // Register fresh handlers
    registerRAGHandlers();
  });

  describe('RAG_RETRIEVE_CONTEXT', () => {
    const invokeHandler = (query: string, options?: RetrievalOptions) => {
      const handler = handlers.get(RAG_CHANNELS.RAG_RETRIEVE_CONTEXT);
      if (!handler) {
        throw new Error('Handler not registered');
      }
      return handler(null, query, options);
    };

    it('should retrieve context successfully', async () => {
      const mockContext: RetrievedContext = {
        chunks: [
          {
            id: 'chunk1',
            content: 'Test content',
            score: 0.9,
            filePath: '/test/file.ts',
            startLine: 1,
            endLine: 10,
            tokens: 50,
          },
        ],
        sources: [
          {
            filePath: '/test/file.ts',
            startLine: 1,
            endLine: 10,
            score: 0.9,
            snippet: 'Test content',
          },
        ],
        contextText: 'Test content',
        totalTokens: 50,
        budgetUsed: 50,
        budgetAvailable: 3950,
      };

      mockRetrieveContext.mockResolvedValueOnce(mockContext);

      const result = await invokeHandler('test query');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.chunks).toHaveLength(1);
        expect(result.data.totalTokens).toBe(50);
      }
    });

    it('should handle empty query string', async () => {
      const result = await invokeHandler('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('empty');
      }
    });

    it('should handle whitespace-only query', async () => {
      const result = await invokeHandler('   ');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('empty');
      }
    });

    it('should handle non-string query', async () => {
      const result = await invokeHandler(null as unknown as string);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('must be a non-empty string');
      }
    });

    it('should pass options to RAGService', async () => {
      const options: RetrievalOptions = {
        topK: 3,
        minScore: 0.5,
        maxTokens: 2000,
        includeSources: true,
      };

      await invokeHandler('test query', options);

      expect(mockRetrieveContext).toHaveBeenCalledWith('test query', options);
    });

    it('should use default options when not provided', async () => {
      await invokeHandler('test query');

      expect(mockRetrieveContext).toHaveBeenCalledWith('test query', undefined);
    });

    it('should handle service errors gracefully', async () => {
      mockRetrieveContext.mockRejectedValueOnce(new Error('Service error'));

      const result = await invokeHandler('test query');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Service error');
      }
    });

    it('should return empty context when no results found', async () => {
      const emptyContext: RetrievedContext = {
        chunks: [],
        sources: [],
        contextText: '',
        totalTokens: 0,
        budgetUsed: 0,
        budgetAvailable: 4000,
      };

      mockRetrieveContext.mockResolvedValueOnce(emptyContext);

      const result = await invokeHandler('test query');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.chunks).toHaveLength(0);
        expect(result.data.totalTokens).toBe(0);
      }
    });

    it('should handle large context results', async () => {
      const largeContext: RetrievedContext = {
        chunks: Array.from({ length: 5 }, (_, i) => ({
          id: `chunk${i}`,
          content: 'a '.repeat(500),
          score: 0.9 - i * 0.1,
          filePath: `/test/file${i}.ts`,
          startLine: 1,
          endLine: 10,
          tokens: 250,
        })),
        sources: Array.from({ length: 5 }, (_, i) => ({
          filePath: `/test/file${i}.ts`,
          startLine: 1,
          endLine: 10,
          score: 0.9 - i * 0.1,
          snippet: 'Test content',
        })),
        contextText: 'a '.repeat(500).repeat(5),
        totalTokens: 1250,
        budgetUsed: 1250,
        budgetAvailable: 2750,
      };

      mockRetrieveContext.mockResolvedValueOnce(largeContext);

      const result = await invokeHandler('test query');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.chunks).toHaveLength(5);
        expect(result.data.totalTokens).toBe(1250);
      }
    });
  });

  describe('handler registration', () => {
    it('should register handler on registerRAGHandlers', () => {
      expect(handlers.has(RAG_CHANNELS.RAG_RETRIEVE_CONTEXT)).toBe(true);
    });

    it('should unregister handler on unregisterRAGHandlers', () => {
      expect(ipcMain.removeHandler).not.toHaveBeenCalled();
      unregisterRAGHandlers();
      expect(ipcMain.removeHandler).toHaveBeenCalledWith(RAG_CHANNELS.RAG_RETRIEVE_CONTEXT);
    });
  });
});
