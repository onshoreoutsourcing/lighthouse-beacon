/**
 * Knowledge Store
 * Wave 10.2.1 - Knowledge Tab & Document List
 * Wave 10.2.2 - Memory Usage Bar & Progress Indicators
 *
 * Manages knowledge base state including indexed documents, loading states,
 * memory status, and document operations.
 *
 * Features:
 * - Document list management
 * - Document removal with optimistic updates
 * - Memory status tracking (Wave 10.2.2)
 * - Indexing progress tracking (Wave 10.2.2)
 * - Loading and error states
 * - Integration with VectorService via IPC
 */

import { create } from 'zustand';
import type { DocumentInput, Result, VectorMemoryStatus } from '@shared/types';

/**
 * Indexed document display format
 */
export interface IndexedDocument {
  id: string;
  filePath: string;
  relativePath: string;
  size: number; // bytes
  timestamp: number; // indexed timestamp
  status: 'indexed' | 'processing' | 'error';
  errorMessage?: string;
}

/**
 * Indexing progress data
 * Wave 10.2.2 - Memory Usage Bar & Progress Indicators
 */
export interface IndexingProgress {
  current: number;
  total: number;
  currentFile: string;
  startTime: number; // timestamp
}

/**
 * Knowledge state interface
 */
interface KnowledgeState {
  // State
  /** Array of indexed documents */
  documents: IndexedDocument[];
  /** Loading state during fetch operations */
  isLoading: boolean;
  /** Error message from failed operations */
  error: string | null;
  /** Memory status from VectorService (Wave 10.2.2) */
  memoryStatus: VectorMemoryStatus | null;
  /** Indexing progress tracking (Wave 10.2.2) */
  indexingProgress: IndexingProgress | null;

  // Actions
  /** Fetch all indexed documents */
  fetchDocuments: () => Promise<void>;
  /** Remove a document from the index */
  removeDocument: (id: string) => Promise<void>;
  /** Fetch memory status from VectorService (Wave 10.2.2) */
  refreshMemoryStatus: () => Promise<void>;
  /** Start indexing files with progress tracking (Wave 10.2.2) */
  startIndexing: (files: string[]) => void;
  /** Update indexing progress (Wave 10.2.2) */
  updateIndexingProgress: (progress: IndexingProgress) => void;
  /** Clear indexing progress (Wave 10.2.2) */
  clearIndexingProgress: () => void;
  /** Clear error state */
  clearError: () => void;
  /** Reset store to initial state */
  reset: () => void;
}

/**
 * Convert DocumentInput to IndexedDocument display format
 */
const convertToIndexedDocument = (doc: DocumentInput): IndexedDocument => {
  const filePath = (doc.metadata?.filePath as string) || doc.id;
  const timestamp = (doc.metadata?.timestamp as number) || Date.now();
  const status = (doc.metadata?.status as IndexedDocument['status']) || 'indexed';
  const errorMessage = doc.metadata?.errorMessage as string | undefined;

  // Calculate size from content length (approximate)
  const size = doc.content.length;

  // Extract relative path from full path
  const pathParts = filePath.split('/');
  const relativePath = pathParts.slice(-3).join('/'); // Show last 3 segments

  return {
    id: doc.id,
    filePath,
    relativePath,
    size,
    timestamp,
    status,
    errorMessage,
  };
};

/**
 * Knowledge store for managing indexed documents
 */
export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  // Initial state
  documents: [],
  isLoading: false,
  error: null,
  memoryStatus: null,
  indexingProgress: null,

  /**
   * Fetch all indexed documents from VectorService
   */
  fetchDocuments: async () => {
    set({ isLoading: true, error: null });

    try {
      const result: Result<DocumentInput[]> = await window.electronAPI.vector.list();

      if (!result.success) {
        set({
          isLoading: false,
          error: result.error.message || 'Failed to fetch documents',
          documents: [],
        });
        return;
      }

      // Convert to IndexedDocument format
      const indexedDocuments: IndexedDocument[] = result.data.map(convertToIndexedDocument);

      set({
        documents: indexedDocuments,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch documents',
        documents: [],
      });
    }
  },

  /**
   * Remove a document from the vector index
   * Uses optimistic update - removes from UI immediately, reverts on error
   *
   * @param id - Document ID to remove
   */
  removeDocument: async (id: string) => {
    const { documents } = get();

    // Optimistic update - remove from UI immediately
    const updatedDocuments = documents.filter((doc) => doc.id !== id);
    set({ documents: updatedDocuments, error: null });

    try {
      const result: Result<void> = await window.electronAPI.vector.remove(id);

      if (!result.success) {
        // Revert optimistic update on error
        set({
          documents,
          error: result.error.message || 'Failed to remove document',
        });
        return;
      }

      // Success - keep optimistic update, refresh to get accurate count
      await get().fetchDocuments();
    } catch (err) {
      // Revert optimistic update on error
      set({
        documents,
        error: err instanceof Error ? err.message : 'Failed to remove document',
      });
    }
  },

  /**
   * Fetch memory status from VectorService
   * Wave 10.2.2 - Memory Usage Bar & Progress Indicators
   */
  refreshMemoryStatus: async () => {
    try {
      const result: Result<VectorMemoryStatus> = await window.electronAPI.vector.getMemoryStatus();

      if (result.success) {
        set({ memoryStatus: result.data });
      }
    } catch (err) {
      // Silent fail - memory status is not critical
      console.error('Failed to refresh memory status:', err);
    }
  },

  /**
   * Start indexing files with progress tracking
   * Wave 10.2.2 - Memory Usage Bar & Progress Indicators
   *
   * Note: This is a placeholder for future implementation.
   * Actual file indexing will be implemented in a later wave.
   * For now, this just sets up the progress tracking structure.
   */
  startIndexing: (files: string[]) => {
    const startTime = Date.now();

    // Initialize progress
    set({
      indexingProgress: {
        current: 0,
        total: files.length,
        currentFile: files[0] || '',
        startTime,
      },
    });

    // TODO: Implement actual file indexing in future wave
    // For now, this just demonstrates the progress tracking structure
  },

  /**
   * Update indexing progress
   * Wave 10.2.2 - Memory Usage Bar & Progress Indicators
   */
  updateIndexingProgress: (progress: IndexingProgress) => {
    set({ indexingProgress: progress });
  },

  /**
   * Clear indexing progress
   * Wave 10.2.2 - Memory Usage Bar & Progress Indicators
   */
  clearIndexingProgress: () => {
    set({ indexingProgress: null });
  },

  /**
   * Clear error state
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set({
      documents: [],
      isLoading: false,
      error: null,
      memoryStatus: null,
      indexingProgress: null,
    });
  },
}));
