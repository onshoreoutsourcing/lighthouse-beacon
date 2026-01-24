/**
 * Knowledge Store Tests
 * Wave 10.2.1 - Knowledge Tab & Document List
 * Wave 10.2.2 - Memory Usage Bar & Progress Indicators
 *
 * Tests for knowledge base state management including:
 * - Document list fetching
 * - Document removal
 * - Memory status tracking (Wave 10.2.2)
 * - Indexing progress tracking (Wave 10.2.2)
 * - Loading and error states
 * - IPC integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useKnowledgeStore } from '../knowledge.store';
import type { VectorIndexStats, Result, DocumentInput, VectorMemoryStatus } from '@shared/types';

// Mock electronAPI
const mockElectronAPI = {
  vector: {
    getStats: vi.fn<[], Promise<Result<VectorIndexStats>>>(),
    remove: vi.fn<[string], Promise<Result<void>>>(),
    list: vi.fn<[], Promise<Result<DocumentInput[]>>>(),
    getMemoryStatus: vi.fn<[], Promise<Result<VectorMemoryStatus>>>(),
  },
};

// Setup global mock
beforeEach(() => {
  window.electronAPI = mockElectronAPI as unknown as typeof window.electronAPI;
  vi.clearAllMocks();
  // Reset store state
  useKnowledgeStore.getState().reset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('KnowledgeStore', () => {
  describe('Initial State', () => {
    it('should have empty documents array initially', () => {
      const { documents } = useKnowledgeStore.getState();
      expect(documents).toEqual([]);
    });

    it('should not be loading initially', () => {
      const { isLoading } = useKnowledgeStore.getState();
      expect(isLoading).toBe(false);
    });

    it('should have no error initially', () => {
      const { error } = useKnowledgeStore.getState();
      expect(error).toBe(null);
    });

    it('should have no memory status initially', () => {
      const { memoryStatus } = useKnowledgeStore.getState();
      expect(memoryStatus).toBe(null);
    });

    it('should have no indexing progress initially', () => {
      const { indexingProgress } = useKnowledgeStore.getState();
      expect(indexingProgress).toBe(null);
    });
  });

  describe('fetchDocuments', () => {
    it('should set loading state while fetching', async () => {
      mockElectronAPI.vector.list.mockImplementation(() => {
        const { isLoading } = useKnowledgeStore.getState();
        expect(isLoading).toBe(true);
        return Promise.resolve({
          success: true,
          data: [],
        });
      });

      await useKnowledgeStore.getState().fetchDocuments();
    });

    it('should fetch documents successfully', async () => {
      mockElectronAPI.vector.list.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'doc-1',
            content: 'Test content 1',
            metadata: { filePath: '/path/to/file1.txt', timestamp: Date.now() },
          },
          {
            id: 'doc-2',
            content: 'Test content 2',
            metadata: { filePath: '/path/to/file2.txt', timestamp: Date.now() },
          },
        ],
      });

      await useKnowledgeStore.getState().fetchDocuments();

      const { documents, isLoading, error } = useKnowledgeStore.getState();
      expect(isLoading).toBe(false);
      expect(error).toBe(null);
      expect(documents).toHaveLength(2);
    });

    it('should handle fetch error', async () => {
      mockElectronAPI.vector.list.mockResolvedValue({
        success: false,
        error: new Error('Failed to fetch documents'),
      });

      await useKnowledgeStore.getState().fetchDocuments();

      const { documents, isLoading, error } = useKnowledgeStore.getState();
      expect(isLoading).toBe(false);
      expect(error).toBe('Failed to fetch documents');
      expect(documents).toEqual([]);
    });

    it('should handle unexpected error', async () => {
      mockElectronAPI.vector.list.mockRejectedValue(new Error('Network error'));

      await useKnowledgeStore.getState().fetchDocuments();

      const { error } = useKnowledgeStore.getState();
      expect(error).toBe('Network error');
    });
  });

  describe('removeDocument', () => {
    beforeEach(async () => {
      // Setup initial documents
      mockElectronAPI.vector.list.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'doc-1',
            content: 'Test content 1',
            metadata: { filePath: '/path/to/file1.txt', timestamp: Date.now() },
          },
          {
            id: 'doc-2',
            content: 'Test content 2',
            metadata: { filePath: '/path/to/file2.txt', timestamp: Date.now() },
          },
          {
            id: 'doc-3',
            content: 'Test content 3',
            metadata: { filePath: '/path/to/file3.txt', timestamp: Date.now() },
          },
        ],
      });
      await useKnowledgeStore.getState().fetchDocuments();
    });

    it('should remove document successfully', async () => {
      mockElectronAPI.vector.remove.mockResolvedValue({
        success: true,
        data: undefined,
      });

      // After successful remove, fetchDocuments is called
      // Mock it to return updated list
      mockElectronAPI.vector.list.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'doc-2',
            content: 'Test content 2',
            metadata: { filePath: '/path/to/file2.txt', timestamp: Date.now() },
          },
          {
            id: 'doc-3',
            content: 'Test content 3',
            metadata: { filePath: '/path/to/file3.txt', timestamp: Date.now() },
          },
        ],
      });

      const initialCount = useKnowledgeStore.getState().documents.length;
      await useKnowledgeStore.getState().removeDocument('doc-1');

      const { documents, error } = useKnowledgeStore.getState();
      expect(error).toBe(null);
      expect(documents.length).toBeLessThan(initialCount);
      expect(mockElectronAPI.vector.remove).toHaveBeenCalledWith('doc-1');
    });

    it('should handle remove error', async () => {
      mockElectronAPI.vector.remove.mockResolvedValue({
        success: false,
        error: new Error('Document not found'),
      });

      await useKnowledgeStore.getState().removeDocument('invalid-id');

      const { error } = useKnowledgeStore.getState();
      expect(error).toBe('Document not found');
    });

    it('should optimistically remove document from UI', async () => {
      const store = useKnowledgeStore.getState();
      const initialDocs = [...store.documents];

      // Slow IPC call
      mockElectronAPI.vector.remove.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: true, data: undefined });
          }, 100);
        });
      });

      const removePromise = store.removeDocument('doc-1');

      // Should be removed immediately (optimistic update)
      const { documents: docsAfterRemove } = useKnowledgeStore.getState();
      expect(docsAfterRemove.length).toBe(initialDocs.length - 1);

      await removePromise;
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      // Set error manually for testing
      useKnowledgeStore.setState({ error: 'Test error' });
      expect(useKnowledgeStore.getState().error).not.toBe(null);

      useKnowledgeStore.getState().clearError();
      expect(useKnowledgeStore.getState().error).toBe(null);
    });
  });

  describe('reset', () => {
    it('should reset store to initial state', async () => {
      // Populate store with data
      mockElectronAPI.vector.list.mockResolvedValue({
        success: true,
        data: [
          {
            id: 'doc-1',
            content: 'Test content',
            metadata: { filePath: '/path/to/file.txt', timestamp: Date.now() },
          },
        ],
      });
      await useKnowledgeStore.getState().fetchDocuments();

      // Reset
      useKnowledgeStore.getState().reset();

      const { documents, isLoading, error, memoryStatus, indexingProgress } =
        useKnowledgeStore.getState();
      expect(documents).toEqual([]);
      expect(isLoading).toBe(false);
      expect(error).toBe(null);
      expect(memoryStatus).toBe(null);
      expect(indexingProgress).toBe(null);
    });
  });

  describe('refreshMemoryStatus', () => {
    it('should fetch and update memory status', async () => {
      const mockStatus: VectorMemoryStatus = {
        usedBytes: 100 * 1024 * 1024,
        budgetBytes: 500 * 1024 * 1024,
        availableBytes: 400 * 1024 * 1024,
        percentUsed: 20,
        documentCount: 50,
        status: 'ok',
        usedMB: '100.0 MB',
        budgetMB: '500.0 MB',
      };

      mockElectronAPI.vector.getMemoryStatus.mockResolvedValue({
        success: true,
        data: mockStatus,
      });

      await useKnowledgeStore.getState().refreshMemoryStatus();

      const { memoryStatus } = useKnowledgeStore.getState();
      expect(memoryStatus).toEqual(mockStatus);
    });

    it('should handle memory status fetch error silently', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockElectronAPI.vector.getMemoryStatus.mockResolvedValue({
        success: false,
        error: new Error('Failed to fetch memory status'),
      });

      await useKnowledgeStore.getState().refreshMemoryStatus();

      const { memoryStatus } = useKnowledgeStore.getState();
      // Should remain null on error
      expect(memoryStatus).toBe(null);

      consoleErrorSpy.mockRestore();
    });

    it('should handle unexpected error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockElectronAPI.vector.getMemoryStatus.mockRejectedValue(new Error('Network error'));

      await useKnowledgeStore.getState().refreshMemoryStatus();

      const { memoryStatus } = useKnowledgeStore.getState();
      expect(memoryStatus).toBe(null);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('startIndexing', () => {
    it('should initialize indexing progress', () => {
      const files = ['file1.txt', 'file2.txt', 'file3.txt'];
      const beforeTime = Date.now();

      useKnowledgeStore.getState().startIndexing(files);

      const { indexingProgress } = useKnowledgeStore.getState();
      expect(indexingProgress).not.toBe(null);
      expect(indexingProgress?.current).toBe(0);
      expect(indexingProgress?.total).toBe(3);
      expect(indexingProgress?.currentFile).toBe('file1.txt');
      expect(indexingProgress?.startTime).toBeGreaterThanOrEqual(beforeTime);
    });

    it('should handle empty file list', () => {
      useKnowledgeStore.getState().startIndexing([]);

      const { indexingProgress } = useKnowledgeStore.getState();
      expect(indexingProgress).not.toBe(null);
      expect(indexingProgress?.total).toBe(0);
      expect(indexingProgress?.currentFile).toBe('');
    });
  });

  describe('updateIndexingProgress', () => {
    it('should update indexing progress', () => {
      const progress = {
        current: 3,
        total: 10,
        currentFile: 'file3.txt',
        startTime: Date.now(),
      };

      useKnowledgeStore.getState().updateIndexingProgress(progress);

      const { indexingProgress } = useKnowledgeStore.getState();
      expect(indexingProgress).toEqual(progress);
    });
  });

  describe('clearIndexingProgress', () => {
    it('should clear indexing progress', () => {
      // Set progress first
      useKnowledgeStore.getState().updateIndexingProgress({
        current: 5,
        total: 10,
        currentFile: 'file5.txt',
        startTime: Date.now(),
      });

      expect(useKnowledgeStore.getState().indexingProgress).not.toBe(null);

      // Clear it
      useKnowledgeStore.getState().clearIndexingProgress();

      expect(useKnowledgeStore.getState().indexingProgress).toBe(null);
    });
  });
});
