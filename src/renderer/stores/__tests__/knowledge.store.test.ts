/**
 * Knowledge Store Tests
 * Wave 10.2.1 - Knowledge Tab & Document List
 *
 * Tests for knowledge base state management including:
 * - Document list fetching
 * - Document removal
 * - Loading and error states
 * - IPC integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useKnowledgeStore } from '../knowledge.store';
import type { VectorIndexStats, Result, DocumentInput } from '@shared/types';

// Mock electronAPI
const mockElectronAPI = {
  vector: {
    getStats: vi.fn<[], Promise<Result<VectorIndexStats>>>(),
    remove: vi.fn<[string], Promise<Result<void>>>(),
    list: vi.fn<[], Promise<Result<DocumentInput[]>>>(),
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

      const { documents, isLoading, error } = useKnowledgeStore.getState();
      expect(documents).toEqual([]);
      expect(isLoading).toBe(false);
      expect(error).toBe(null);
    });
  });
});
