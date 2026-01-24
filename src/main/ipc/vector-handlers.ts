/**
 * Vector Search IPC Handlers
 * Feature 10.1 - Vector Service & Embedding Infrastructure
 * Wave 10.1.1 - Vector-lite Integration & Basic Search
 * Wave 10.1.3 - Memory Monitoring & Index Persistence
 *
 * Provides IPC bridge between renderer process and VectorService.
 * Handles vector operations: add, search, remove, clear, stats, memory status.
 */

import { ipcMain } from 'electron';
import type {
  DocumentInput,
  SearchResult,
  SearchOptions,
  VectorIndexStats,
  BatchAddResult,
  VectorMemoryStatus,
  Result,
} from '@shared/types';
import { VECTOR_CHANNELS } from '@shared/types';
import { VectorService } from '../services/vector/VectorService';
import { logger } from '../logger';

/**
 * Singleton VectorService instance
 */
let vectorService: VectorService | null = null;
let initializationPromise: Promise<void> | null = null;

/**
 * Get or create VectorService instance and ensure it's initialized
 */
async function getVectorService(): Promise<VectorService> {
  if (!vectorService) {
    vectorService = new VectorService();
    initializationPromise = vectorService.initialize().catch((error) => {
      logger.error('[VectorHandlers] Failed to initialize VectorService', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    });
  }

  // Wait for initialization to complete
  if (initializationPromise) {
    await initializationPromise;
    initializationPromise = null; // Clear after first initialization
  }

  return vectorService;
}

/**
 * Register all vector search IPC handlers
 * Call this function during app initialization
 */
export function registerVectorHandlers(): void {
  /**
   * VECTOR_ADD: Add a single document to the vector index
   */
  ipcMain.handle(
    VECTOR_CHANNELS.VECTOR_ADD,
    async (_event, document: DocumentInput): Promise<Result<void>> => {
      try {
        const service = await getVectorService();
        await service.addDocument(document);

        return {
          success: true,
          data: undefined,
        };
      } catch (error) {
        logger.error('[VectorHandlers] Add document failed', {
          documentId: document.id,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to add document'),
        };
      }
    }
  );

  /**
   * VECTOR_ADD_BATCH: Add multiple documents in batch
   */
  ipcMain.handle(
    VECTOR_CHANNELS.VECTOR_ADD_BATCH,
    async (_event, documents: DocumentInput[]): Promise<Result<BatchAddResult>> => {
      try {
        const service = await getVectorService();
        const result = await service.addDocuments(documents);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        logger.error('[VectorHandlers] Batch add documents failed', {
          count: documents.length,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to add documents'),
        };
      }
    }
  );

  /**
   * VECTOR_SEARCH: Search for documents by semantic similarity
   */
  ipcMain.handle(
    VECTOR_CHANNELS.VECTOR_SEARCH,
    async (_event, query: string, options?: SearchOptions): Promise<Result<SearchResult[]>> => {
      try {
        const service = await getVectorService();
        const results = await service.search(query, options);

        return {
          success: true,
          data: results,
        };
      } catch (error) {
        logger.error('[VectorHandlers] Search failed', {
          query: query ? query.substring(0, 50) : '(empty)',
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          success: false,
          error: error instanceof Error ? error : new Error('Search failed'),
        };
      }
    }
  );

  /**
   * VECTOR_REMOVE: Remove a document from the vector index
   */
  ipcMain.handle(
    VECTOR_CHANNELS.VECTOR_REMOVE,
    async (_event, documentId: string): Promise<Result<void>> => {
      try {
        const service = await getVectorService();
        await service.removeDocument(documentId);

        return {
          success: true,
          data: undefined,
        };
      } catch (error) {
        logger.error('[VectorHandlers] Remove document failed', {
          documentId,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to remove document'),
        };
      }
    }
  );

  /**
   * VECTOR_CLEAR: Clear all documents from the index
   */
  ipcMain.handle(VECTOR_CHANNELS.VECTOR_CLEAR, async (): Promise<Result<void>> => {
    try {
      const service = await getVectorService();
      await service.clear();

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      logger.error('[VectorHandlers] Clear index failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to clear index'),
      };
    }
  });

  /**
   * VECTOR_STATS: Get vector index statistics
   */
  ipcMain.handle(VECTOR_CHANNELS.VECTOR_STATS, async (): Promise<Result<VectorIndexStats>> => {
    try {
      const service = await getVectorService();
      const stats = await service.getStats();

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      logger.error('[VectorHandlers] Get stats failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get stats'),
      };
    }
  });

  /**
   * VECTOR_MEMORY_STATUS: Get memory status
   * Wave 10.1.3 - User Story 2: Memory Threshold Alerts
   */
  ipcMain.handle(
    VECTOR_CHANNELS.VECTOR_MEMORY_STATUS,
    async (): Promise<Result<VectorMemoryStatus>> => {
      try {
        const service = await getVectorService();
        const status = service.getMemoryStatus();

        return {
          success: true,
          data: status,
        };
      } catch (error) {
        logger.error('[VectorHandlers] Get memory status failed', {
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to get memory status'),
        };
      }
    }
  );

  /**
   * VECTOR_LIST: List all documents in the index
   * Wave 10.2.1 - Knowledge Tab & Document List
   */
  ipcMain.handle(VECTOR_CHANNELS.VECTOR_LIST, async (): Promise<Result<DocumentInput[]>> => {
    try {
      const service = await getVectorService();
      const documents = await service.listDocuments();

      return {
        success: true,
        data: documents,
      };
    } catch (error) {
      logger.error('[VectorHandlers] List documents failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to list documents'),
      };
    }
  });

  logger.info('[VectorHandlers] IPC handlers registered');
}

/**
 * Unregister all vector search IPC handlers
 * Call this during app cleanup
 */
export function unregisterVectorHandlers(): void {
  ipcMain.removeHandler(VECTOR_CHANNELS.VECTOR_ADD);
  ipcMain.removeHandler(VECTOR_CHANNELS.VECTOR_ADD_BATCH);
  ipcMain.removeHandler(VECTOR_CHANNELS.VECTOR_SEARCH);
  ipcMain.removeHandler(VECTOR_CHANNELS.VECTOR_REMOVE);
  ipcMain.removeHandler(VECTOR_CHANNELS.VECTOR_CLEAR);
  ipcMain.removeHandler(VECTOR_CHANNELS.VECTOR_STATS);
  ipcMain.removeHandler(VECTOR_CHANNELS.VECTOR_MEMORY_STATUS);
  ipcMain.removeHandler(VECTOR_CHANNELS.VECTOR_LIST);

  vectorService = null;

  logger.info('[VectorHandlers] IPC handlers unregistered');
}
