/**
 * Knowledge Store
 * Wave 10.2.1 - Knowledge Tab & Document List
 *
 * Manages knowledge base state including indexed documents, loading states,
 * and document operations (view, remove).
 *
 * Features:
 * - Document list management
 * - Document removal with optimistic updates
 * - Loading and error states
 * - Integration with VectorService via IPC
 */

import { create } from 'zustand';
import type { DocumentInput, Result } from '@shared/types';

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

  // Actions
  /** Fetch all indexed documents */
  fetchDocuments: () => Promise<void>;
  /** Remove a document from the index */
  removeDocument: (id: string) => Promise<void>;
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
    });
  },
}));
