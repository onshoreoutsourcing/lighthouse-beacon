/**
 * IndexPersistence - Vector index persistence to disk
 * Feature 10.1 - Vector Service & Embedding Infrastructure
 * Wave 10.1.3 - Memory Monitoring & Index Persistence
 * User Story 3: Vector Index Persistence
 *
 * Provides atomic save/load operations for vector index with:
 * - Save to .lighthouse/knowledge/index.json
 * - Atomic write (temp file + rename)
 * - Auto-load on initialization
 * - Integrity validation
 * - Fast save/load (<1s for 1000 documents)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import { logger } from '../../logger';

/**
 * Persisted document structure
 */
export interface PersistedDocument {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
  embedding: number[];
}

/**
 * Persisted index structure
 */
export interface PersistedIndex {
  version: number;
  timestamp: number;
  documentCount: number;
  embeddingDimension: number;
  documents: PersistedDocument[];
}

/**
 * Index integrity validation result
 */
export interface IntegrityValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * IndexPersistence handles save/load operations for vector index
 *
 * @remarks
 * - Saves to userData/.lighthouse/knowledge/index.json
 * - Atomic writes prevent corruption
 * - Backup retained at index.json.backup
 * - Schema validation on load
 * - Target: <1s for 1000 documents
 */
export class IndexPersistence {
  private readonly indexDir: string;
  private readonly indexPath: string;
  private readonly backupPath: string;
  private readonly tempPath: string;
  private readonly version = 1;

  /**
   * Creates a new IndexPersistence instance
   */
  constructor() {
    const userDataPath = app.getPath('userData');
    this.indexDir = path.join(userDataPath, '.lighthouse', 'knowledge');
    this.indexPath = path.join(this.indexDir, 'index.json');
    this.backupPath = path.join(this.indexDir, 'index.json.backup');
    this.tempPath = path.join(this.indexDir, 'index.json.tmp');

    logger.info('[IndexPersistence] Initialized', {
      indexPath: this.indexPath,
    });
  }

  /**
   * Save index to disk
   *
   * @param documents - Documents to persist
   * @param embeddingDimension - Embedding dimension (default: 384)
   * @returns Promise that resolves when save is complete
   */
  async save(documents: PersistedDocument[], embeddingDimension = 384): Promise<void> {
    const startTime = Date.now();

    try {
      // Ensure directory exists
      await fs.mkdir(this.indexDir, { recursive: true });

      // Create persisted index structure
      const persistedIndex: PersistedIndex = {
        version: this.version,
        timestamp: Date.now(),
        documentCount: documents.length,
        embeddingDimension,
        documents,
      };

      // Serialize to JSON
      const json = JSON.stringify(persistedIndex, null, 2);

      // Atomic write: write to temp file first
      await fs.writeFile(this.tempPath, json, 'utf8');

      // Backup existing index if it exists
      try {
        await fs.access(this.indexPath);
        // Index exists, create backup
        await fs.copyFile(this.indexPath, this.backupPath);
      } catch {
        // Index doesn't exist yet, skip backup
      }

      // Atomic rename: move temp file to final location
      await fs.rename(this.tempPath, this.indexPath);

      const duration = Date.now() - startTime;
      const sizeKB = Buffer.byteLength(json, 'utf8') / 1024;

      logger.info('[IndexPersistence] Saved index', {
        documentCount: documents.length,
        sizeKB: sizeKB.toFixed(2),
        durationMs: duration,
      });

      // Verify performance target (<1s for 1000 docs)
      if (documents.length >= 1000 && duration > 1000) {
        logger.warn('[IndexPersistence] Save exceeded 1s target', {
          documentCount: documents.length,
          durationMs: duration,
        });
      }
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(this.tempPath);
      } catch {
        // Ignore cleanup errors
      }

      logger.error('[IndexPersistence] Failed to save index', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to save index: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load index from disk
   *
   * @returns Promise that resolves with loaded documents, or undefined if no index exists
   * @throws Error if index is corrupted and unrecoverable
   */
  async load(): Promise<PersistedDocument[] | undefined> {
    const startTime = Date.now();

    try {
      // Check if index exists
      try {
        await fs.access(this.indexPath);
      } catch {
        logger.info('[IndexPersistence] No existing index found');
        return undefined;
      }

      // Read index file
      const json = await fs.readFile(this.indexPath, 'utf8');

      // Parse JSON
      let persistedIndex: PersistedIndex;
      try {
        const parsed = JSON.parse(json) as unknown;
        persistedIndex = parsed as PersistedIndex;
      } catch (parseError) {
        // JSON parse failed - attempt recovery from backup
        logger.error('[IndexPersistence] Failed to parse index JSON', {
          error: parseError instanceof Error ? parseError.message : String(parseError),
        });
        return await this.attemptRecovery();
      }

      // Validate integrity
      const validation = this.validateIntegrity(persistedIndex);
      if (!validation.valid) {
        logger.error('[IndexPersistence] Index integrity validation failed', {
          errors: validation.errors,
        });
        return await this.attemptRecovery();
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        logger.warn('[IndexPersistence] Index validation warnings', {
          warnings: validation.warnings,
        });
      }

      const duration = Date.now() - startTime;
      logger.info('[IndexPersistence] Loaded index', {
        documentCount: persistedIndex.documentCount,
        durationMs: duration,
        indexAge: Date.now() - persistedIndex.timestamp,
      });

      // Verify performance target (<1s for 1000 docs)
      if (persistedIndex.documentCount >= 1000 && duration > 1000) {
        logger.warn('[IndexPersistence] Load exceeded 1s target', {
          documentCount: persistedIndex.documentCount,
          durationMs: duration,
        });
      }

      return persistedIndex.documents;
    } catch (error) {
      logger.error('[IndexPersistence] Failed to load index', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to load index: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Attempt to recover from backup
   *
   * @returns Promise that resolves with documents from backup, or undefined if recovery fails
   */
  private async attemptRecovery(): Promise<PersistedDocument[] | undefined> {
    logger.warn('[IndexPersistence] Attempting recovery from backup');

    try {
      // Check if backup exists
      await fs.access(this.backupPath);

      // Read backup file
      const json = await fs.readFile(this.backupPath, 'utf8');
      const persistedIndex = JSON.parse(json) as PersistedIndex;

      // Validate backup integrity
      const validation = this.validateIntegrity(persistedIndex);
      if (!validation.valid) {
        logger.error('[IndexPersistence] Backup is also corrupted', {
          errors: validation.errors,
        });
        return undefined;
      }

      logger.info('[IndexPersistence] Successfully recovered from backup', {
        documentCount: persistedIndex.documentCount,
      });

      // Replace corrupted index with backup
      await fs.copyFile(this.backupPath, this.indexPath);

      return persistedIndex.documents;
    } catch (error) {
      logger.error('[IndexPersistence] Recovery from backup failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  /**
   * Validate index integrity
   *
   * @param index - Persisted index to validate
   * @returns Validation result with errors and warnings
   */
  private validateIntegrity(index: PersistedIndex): IntegrityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (typeof index !== 'object' || index === null) {
      errors.push('Index is not an object');
      return { valid: false, errors, warnings };
    }

    if (typeof index.version !== 'number') {
      errors.push('Missing or invalid version field');
    }

    if (typeof index.timestamp !== 'number') {
      errors.push('Missing or invalid timestamp field');
    }

    if (typeof index.documentCount !== 'number') {
      errors.push('Missing or invalid documentCount field');
    }

    if (typeof index.embeddingDimension !== 'number') {
      errors.push('Missing or invalid embeddingDimension field');
    }

    if (!Array.isArray(index.documents)) {
      errors.push('Missing or invalid documents array');
      return { valid: false, errors, warnings };
    }

    // Validate version
    if (index.version !== this.version) {
      warnings.push(`Index version mismatch: expected ${this.version}, got ${index.version}`);
    }

    // Validate document count matches array length
    if (index.documentCount !== index.documents.length) {
      warnings.push(
        `Document count mismatch: expected ${index.documentCount}, got ${index.documents.length}`
      );
    }

    // Validate documents
    for (let i = 0; i < Math.min(index.documents.length, 10); i++) {
      const doc = index.documents[i];
      if (!doc) continue;

      if (typeof doc.id !== 'string') {
        errors.push(`Document ${i}: missing or invalid id`);
      }

      if (typeof doc.content !== 'string') {
        errors.push(`Document ${i}: missing or invalid content`);
      }

      if (!Array.isArray(doc.embedding)) {
        errors.push(`Document ${i}: missing or invalid embedding array`);
      } else if (doc.embedding.length !== index.embeddingDimension) {
        warnings.push(
          `Document ${i}: embedding dimension mismatch (expected ${index.embeddingDimension}, got ${doc.embedding.length})`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if index file exists
   *
   * @returns True if index file exists
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(this.indexPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete index and backup files
   *
   * @returns Promise that resolves when files are deleted
   */
  async delete(): Promise<void> {
    try {
      await fs.unlink(this.indexPath);
      logger.info('[IndexPersistence] Deleted index file');
    } catch {
      // Ignore if file doesn't exist
    }

    try {
      await fs.unlink(this.backupPath);
      logger.info('[IndexPersistence] Deleted backup file');
    } catch {
      // Ignore if file doesn't exist
    }
  }
}
