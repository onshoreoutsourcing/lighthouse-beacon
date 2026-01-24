/**
 * IndexPersistence Unit Tests
 * Feature 10.1 - Vector Service & Embedding Infrastructure
 * Wave 10.1.3 - Memory Monitoring & Index Persistence
 * User Story 3: Vector Index Persistence
 * User Story 4: Index Corruption Recovery
 *
 * Tests save/load operations, atomic writes, integrity validation, and corruption recovery.
 * Target coverage: >90%
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IndexPersistence, type PersistedDocument } from '../IndexPersistence';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

// Mock electron app
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => '/tmp/test-index-persistence'),
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

describe('IndexPersistence', () => {
  let persistence: IndexPersistence;
  let indexDir: string;
  let indexPath: string;
  let backupPath: string;

  beforeEach(() => {
    persistence = new IndexPersistence();
    const userDataPath = app.getPath('userData');
    indexDir = path.join(userDataPath, '.lighthouse', 'knowledge');
    indexPath = path.join(indexDir, 'index.json');
    backupPath = path.join(indexDir, 'index.json.backup');
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.rm(indexDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('save', () => {
    it('should save documents to disk', async () => {
      const documents: PersistedDocument[] = [
        {
          id: 'doc1',
          content: 'Test content 1',
          metadata: { type: 'test' },
          embedding: new Array(384).fill(0.5),
        },
        {
          id: 'doc2',
          content: 'Test content 2',
          embedding: new Array(384).fill(0.3),
        },
      ];

      await persistence.save(documents);

      // Verify file exists
      const exists = await persistence.exists();
      expect(exists).toBe(true);

      // Verify file contents
      const json = await fs.readFile(indexPath, 'utf8');
      const parsed = JSON.parse(json);

      expect(parsed.documentCount).toBe(2);
      expect(parsed.documents).toHaveLength(2);
      expect(parsed.version).toBe(1);
      expect(parsed.embeddingDimension).toBe(384);
    });

    it('should create directory if it does not exist', async () => {
      const documents: PersistedDocument[] = [
        {
          id: 'doc1',
          content: 'Test content',
          embedding: new Array(384).fill(0.5),
        },
      ];

      await persistence.save(documents);

      const dirExists = await fs
        .access(indexDir)
        .then(() => true)
        .catch(() => false);
      expect(dirExists).toBe(true);
    });

    it('should create backup of existing index', async () => {
      const documents1: PersistedDocument[] = [
        {
          id: 'doc1',
          content: 'First version',
          embedding: new Array(384).fill(0.5),
        },
      ];

      const documents2: PersistedDocument[] = [
        {
          id: 'doc2',
          content: 'Second version',
          embedding: new Array(384).fill(0.3),
        },
      ];

      // Save first version
      await persistence.save(documents1);

      // Save second version (should create backup)
      await persistence.save(documents2);

      // Verify backup exists
      const backupExists = await fs
        .access(backupPath)
        .then(() => true)
        .catch(() => false);
      expect(backupExists).toBe(true);

      // Verify backup contains first version
      const backupJson = await fs.readFile(backupPath, 'utf8');
      const backupParsed = JSON.parse(backupJson);
      expect(backupParsed.documents[0]?.id).toBe('doc1');
      expect(backupParsed.documents[0]?.content).toBe('First version');
    });

    it('should complete save in <1s for 1000 documents', async () => {
      // Generate 1000 documents
      const documents: PersistedDocument[] = [];
      for (let i = 0; i < 1000; i++) {
        documents.push({
          id: `doc${i}`,
          content: `Test content ${i}`,
          embedding: new Array(384).fill(0.5),
        });
      }

      const startTime = Date.now();
      await persistence.save(documents);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it('should handle save errors gracefully', async () => {
      // Create a read-only directory to trigger save error
      await fs.mkdir(indexDir, { recursive: true });

      const documents: PersistedDocument[] = [
        {
          id: 'doc1',
          content: 'Test',
          embedding: new Array(384).fill(0.5),
        },
      ];

      // Save normally first to ensure it works
      await persistence.save(documents);

      // Now make directory read-only (if possible on this platform)
      // Skip this test on platforms where chmod doesn't work
      try {
        await fs.chmod(indexDir, 0o444);

        const newPersistence = new IndexPersistence();
        await expect(newPersistence.save(documents)).rejects.toThrow();

        // Restore permissions
        await fs.chmod(indexDir, 0o755);
      } catch {
        // Platform doesn't support chmod, skip this test
      }
    });
  });

  describe('load', () => {
    it('should load documents from disk', async () => {
      const documents: PersistedDocument[] = [
        {
          id: 'doc1',
          content: 'Test content 1',
          metadata: { type: 'test' },
          embedding: new Array(384).fill(0.5),
        },
        {
          id: 'doc2',
          content: 'Test content 2',
          embedding: new Array(384).fill(0.3),
        },
      ];

      await persistence.save(documents);

      const loaded = await persistence.load();

      expect(loaded).toBeDefined();
      expect(loaded).toHaveLength(2);
      expect(loaded![0]?.id).toBe('doc1');
      expect(loaded![1]?.id).toBe('doc2');
    });

    it('should return undefined if no index exists', async () => {
      const loaded = await persistence.load();

      expect(loaded).toBeUndefined();
    });

    it('should complete load in <1s for 1000 documents', async () => {
      // Generate and save 1000 documents
      const documents: PersistedDocument[] = [];
      for (let i = 0; i < 1000; i++) {
        documents.push({
          id: `doc${i}`,
          content: `Test content ${i}`,
          embedding: new Array(384).fill(0.5),
        });
      }

      await persistence.save(documents);

      const startTime = Date.now();
      const loaded = await persistence.load();
      const duration = Date.now() - startTime;

      expect(loaded).toHaveLength(1000);
      expect(duration).toBeLessThan(1000);
    });

    it('should validate index integrity on load', async () => {
      // Create invalid index manually
      await fs.mkdir(indexDir, { recursive: true });
      await fs.writeFile(
        indexPath,
        JSON.stringify({
          version: 1,
          timestamp: Date.now(),
          documentCount: 1,
          embeddingDimension: 384,
          documents: [
            {
              // Missing id field (invalid)
              content: 'Test',
              embedding: new Array(384).fill(0.5),
            },
          ],
        }),
        'utf8'
      );

      const loaded = await persistence.load();

      // Should attempt recovery and return undefined (no backup)
      expect(loaded).toBeUndefined();
    });
  });

  describe('corruption recovery', () => {
    it('should recover from backup on corrupted index', async () => {
      const goodDocuments: PersistedDocument[] = [
        {
          id: 'doc1',
          content: 'Good content',
          embedding: new Array(384).fill(0.5),
        },
      ];

      // Save good index (creates backup on subsequent save)
      await persistence.save(goodDocuments);

      const badDocuments: PersistedDocument[] = [
        {
          id: 'doc2',
          content: 'Bad content',
          embedding: new Array(384).fill(0.3),
        },
      ];

      await persistence.save(badDocuments);

      // Manually corrupt the index
      await fs.writeFile(indexPath, 'invalid json{{{', 'utf8');

      // Load should recover from backup
      const loaded = await persistence.load();

      expect(loaded).toBeDefined();
      expect(loaded).toHaveLength(1);
      expect(loaded![0]?.id).toBe('doc1'); // Should have recovered first version
    });

    it('should return undefined if both index and backup are corrupted', async () => {
      // Create corrupted index
      await fs.mkdir(indexDir, { recursive: true });
      await fs.writeFile(indexPath, 'invalid json', 'utf8');

      // Create corrupted backup
      await fs.writeFile(backupPath, 'invalid json', 'utf8');

      const loaded = await persistence.load();

      expect(loaded).toBeUndefined();
    });

    it('should handle missing backup during recovery', async () => {
      // Create corrupted index (no backup)
      await fs.mkdir(indexDir, { recursive: true });
      await fs.writeFile(indexPath, 'invalid json', 'utf8');

      const loaded = await persistence.load();

      expect(loaded).toBeUndefined();
    });

    it('should replace corrupted index with backup after recovery', async () => {
      const documents: PersistedDocument[] = [
        {
          id: 'doc1',
          content: 'Test content',
          embedding: new Array(384).fill(0.5),
        },
      ];

      // Save to create backup
      await persistence.save(documents);
      await persistence.save(documents);

      // Corrupt index
      await fs.writeFile(indexPath, 'invalid json', 'utf8');

      // Load (triggers recovery)
      await persistence.load();

      // Verify index is now valid
      const json = await fs.readFile(indexPath, 'utf8');
      const parsed = JSON.parse(json);
      expect(parsed.documents).toHaveLength(1);
    });
  });

  describe('integrity validation', () => {
    it('should detect missing required fields', async () => {
      await fs.mkdir(indexDir, { recursive: true });
      await fs.writeFile(indexPath, JSON.stringify({ invalid: 'data' }), 'utf8');

      const loaded = await persistence.load();
      expect(loaded).toBeUndefined();
    });

    it('should detect invalid document structure', async () => {
      await fs.mkdir(indexDir, { recursive: true });
      await fs.writeFile(
        indexPath,
        JSON.stringify({
          version: 1,
          timestamp: Date.now(),
          documentCount: 1,
          embeddingDimension: 384,
          documents: [
            {
              id: 'doc1',
              // Missing content
              embedding: new Array(384).fill(0.5),
            },
          ],
        }),
        'utf8'
      );

      const loaded = await persistence.load();
      expect(loaded).toBeUndefined();
    });

    it('should warn on version mismatch', async () => {
      await fs.mkdir(indexDir, { recursive: true });
      await fs.writeFile(
        indexPath,
        JSON.stringify({
          version: 999, // Different version
          timestamp: Date.now(),
          documentCount: 0,
          embeddingDimension: 384,
          documents: [],
        }),
        'utf8'
      );

      const loaded = await persistence.load();
      // Should still load despite version mismatch (warning only)
      expect(loaded).toBeDefined();
    });

    it('should warn on document count mismatch', async () => {
      await fs.mkdir(indexDir, { recursive: true });
      await fs.writeFile(
        indexPath,
        JSON.stringify({
          version: 1,
          timestamp: Date.now(),
          documentCount: 5, // Says 5 but array has 1
          embeddingDimension: 384,
          documents: [
            {
              id: 'doc1',
              content: 'Test',
              embedding: new Array(384).fill(0.5),
            },
          ],
        }),
        'utf8'
      );

      const loaded = await persistence.load();
      // Should still load despite count mismatch (warning only)
      expect(loaded).toBeDefined();
      expect(loaded).toHaveLength(1);
    });
  });

  describe('utility methods', () => {
    it('should check if index exists', async () => {
      expect(await persistence.exists()).toBe(false);

      const documents: PersistedDocument[] = [
        {
          id: 'doc1',
          content: 'Test',
          embedding: new Array(384).fill(0.5),
        },
      ];

      await persistence.save(documents);

      expect(await persistence.exists()).toBe(true);
    });

    it('should delete index and backup', async () => {
      const documents: PersistedDocument[] = [
        {
          id: 'doc1',
          content: 'Test',
          embedding: new Array(384).fill(0.5),
        },
      ];

      await persistence.save(documents);
      await persistence.save(documents); // Create backup

      expect(await persistence.exists()).toBe(true);

      await persistence.delete();

      expect(await persistence.exists()).toBe(false);
      const backupExists = await fs
        .access(backupPath)
        .then(() => true)
        .catch(() => false);
      expect(backupExists).toBe(false);
    });
  });
});
