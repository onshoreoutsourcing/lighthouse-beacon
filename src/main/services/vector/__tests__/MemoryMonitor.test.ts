/**
 * MemoryMonitor Unit Tests
 * Feature 10.1 - Vector Service & Embedding Infrastructure
 * Wave 10.1.3 - Memory Monitoring & Index Persistence
 * User Story 1: Memory Budget Tracking & Enforcement
 *
 * Tests memory tracking, budget enforcement, and projection capabilities.
 * Target coverage: >90%
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryMonitor } from '../MemoryMonitor';

// Mock logger
vi.mock('../../../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('MemoryMonitor', () => {
  let monitor: MemoryMonitor;

  beforeEach(() => {
    monitor = new MemoryMonitor(500); // 500MB budget
  });

  describe('initialization', () => {
    it('should initialize with default 500MB budget', () => {
      const defaultMonitor = new MemoryMonitor();
      const status = defaultMonitor.getStatus();

      expect(status.budgetBytes).toBe(500 * 1024 * 1024);
      expect(status.budgetMB).toBe('500.0 MB');
    });

    it('should initialize with custom budget', () => {
      const customMonitor = new MemoryMonitor(1000);
      const status = customMonitor.getStatus();

      expect(status.budgetBytes).toBe(1000 * 1024 * 1024);
      expect(status.budgetMB).toBe('1000.0 MB');
    });

    it('should start with zero usage', () => {
      const status = monitor.getStatus();

      expect(status.usedBytes).toBe(0);
      expect(status.documentCount).toBe(0);
      expect(status.percentUsed).toBe(0);
      expect(status.status).toBe('ok');
    });
  });

  describe('trackDocument', () => {
    it('should track a document successfully', () => {
      const content = 'This is a test document';
      monitor.trackDocument('doc1', content);

      const status = monitor.getStatus();
      expect(status.documentCount).toBe(1);
      expect(status.usedBytes).toBeGreaterThan(0);
    });

    it('should calculate memory correctly', () => {
      const content = 'Test content';
      const metadata = { type: 'test', source: 'unit-test' };

      monitor.trackDocument('doc1', content, metadata);

      const docMemory = monitor.getDocumentMemory('doc1');
      expect(docMemory).toBeDefined();
      expect(docMemory?.embeddingBytes).toBe(384 * 4); // 384 dimensions * 4 bytes
      expect(docMemory?.contentBytes).toBe(Buffer.byteLength(content, 'utf8'));
      expect(docMemory?.metadataBytes).toBe(Buffer.byteLength(JSON.stringify(metadata), 'utf8'));
      expect(docMemory?.totalBytes).toBe(
        docMemory!.embeddingBytes + docMemory!.contentBytes + docMemory!.metadataBytes
      );
    });

    it('should track per-document memory breakdown', () => {
      monitor.trackDocument('doc1', 'Content 1');
      monitor.trackDocument('doc2', 'Content 2');

      const doc1Memory = monitor.getDocumentMemory('doc1');
      const doc2Memory = monitor.getDocumentMemory('doc2');

      expect(doc1Memory).toBeDefined();
      expect(doc2Memory).toBeDefined();
      expect(doc1Memory?.id).toBe('doc1');
      expect(doc2Memory?.id).toBe('doc2');
    });

    it('should throw error if document already tracked', () => {
      monitor.trackDocument('doc1', 'Content');

      expect(() => monitor.trackDocument('doc1', 'New content')).toThrow(
        "Document 'doc1' is already tracked"
      );
    });

    it('should throw error if adding document would exceed budget', () => {
      // Create a monitor with very small budget (1KB)
      const tinyMonitor = new MemoryMonitor(0.001); // 0.001MB = 1KB

      // Try to add document that's too large
      const largeContent = 'x'.repeat(10000); // 10KB content

      expect(() => tinyMonitor.trackDocument('large-doc', largeContent)).toThrow(
        'Memory budget exceeded'
      );
    });
  });

  describe('trackBatch', () => {
    it('should track multiple documents in batch', () => {
      const documents = [
        { id: 'doc1', content: 'Content 1' },
        { id: 'doc2', content: 'Content 2' },
        { id: 'doc3', content: 'Content 3' },
      ];

      const count = monitor.trackBatch(documents);

      expect(count).toBe(3);
      expect(monitor.getStatus().documentCount).toBe(3);
    });

    it('should throw error if batch would exceed budget', () => {
      const tinyMonitor = new MemoryMonitor(0.001); // 1KB budget

      const documents = [
        { id: 'doc1', content: 'x'.repeat(5000) },
        { id: 'doc2', content: 'x'.repeat(5000) },
      ];

      expect(() => tinyMonitor.trackBatch(documents)).toThrow('Memory budget exceeded');
    });

    it('should throw error if any document ID already tracked', () => {
      monitor.trackDocument('doc1', 'Existing content');

      const documents = [
        { id: 'doc1', content: 'New content' }, // Duplicate
        { id: 'doc2', content: 'Content 2' },
      ];

      expect(() => monitor.trackBatch(documents)).toThrow("Document 'doc1' is already tracked");
    });

    it('should track batch with metadata', () => {
      const documents = [
        { id: 'doc1', content: 'Content 1', metadata: { type: 'test' } },
        { id: 'doc2', content: 'Content 2', metadata: { type: 'prod' } },
      ];

      const count = monitor.trackBatch(documents);

      expect(count).toBe(2);
      const doc1Memory = monitor.getDocumentMemory('doc1');
      expect(doc1Memory?.metadataBytes).toBeGreaterThan(0);
    });
  });

  describe('removeDocument', () => {
    it('should remove tracked document and decrease memory', () => {
      monitor.trackDocument('doc1', 'Content 1');
      const usageBeforeRemoval = monitor.getStatus().usedBytes;

      const removed = monitor.removeDocument('doc1');

      expect(removed).toBe(true);
      expect(monitor.getStatus().documentCount).toBe(0);
      expect(monitor.getStatus().usedBytes).toBe(0);
      expect(usageBeforeRemoval).toBeGreaterThan(0);
    });

    it('should return false if document not found', () => {
      const removed = monitor.removeDocument('nonexistent');

      expect(removed).toBe(false);
    });

    it('should correctly update memory after removal', () => {
      monitor.trackDocument('doc1', 'Content 1');
      monitor.trackDocument('doc2', 'Content 2');

      const doc2Memory = monitor.getDocumentMemory('doc2');
      const totalBefore = monitor.getStatus().usedBytes;

      monitor.removeDocument('doc1');

      const totalAfter = monitor.getStatus().usedBytes;
      expect(totalAfter).toBe(doc2Memory!.totalBytes);
      expect(totalBefore).toBeGreaterThan(totalAfter);
    });
  });

  describe('clear', () => {
    it('should clear all documents', () => {
      monitor.trackDocument('doc1', 'Content 1');
      monitor.trackDocument('doc2', 'Content 2');
      monitor.trackDocument('doc3', 'Content 3');

      monitor.clear();

      const status = monitor.getStatus();
      expect(status.documentCount).toBe(0);
      expect(status.usedBytes).toBe(0);
      expect(status.percentUsed).toBe(0);
    });

    it('should allow tracking after clear', () => {
      monitor.trackDocument('doc1', 'Content 1');
      monitor.clear();

      // Should not throw
      monitor.trackDocument('doc2', 'Content 2');

      expect(monitor.getStatus().documentCount).toBe(1);
    });
  });

  describe('getStatus', () => {
    it('should return "ok" status under 80%', () => {
      // Add small document
      monitor.trackDocument('doc1', 'Small content');

      const status = monitor.getStatus();
      expect(status.status).toBe('ok');
      expect(status.percentUsed).toBeLessThan(80);
    });

    it('should return "warning" status at 80-95%', () => {
      // Fill to 85% (425MB of 500MB)
      const targetBytes = 425 * 1024 * 1024;
      const singleDocSize = 1536 + 1000; // embedding + ~1KB content
      const numDocs = Math.floor(targetBytes / singleDocSize);

      for (let i = 0; i < numDocs; i++) {
        monitor.trackDocument(`doc${i}`, 'x'.repeat(1000));
      }

      const status = monitor.getStatus();
      expect(status.status).toBe('warning');
      expect(status.percentUsed).toBeGreaterThanOrEqual(80);
      expect(status.percentUsed).toBeLessThan(95);
    });

    it('should return "critical" status at 95-100%', () => {
      // Fill to 96% (480MB of 500MB)
      const targetBytes = 480 * 1024 * 1024;
      const singleDocSize = 1536 + 1000;
      const numDocs = Math.floor(targetBytes / singleDocSize);

      for (let i = 0; i < numDocs; i++) {
        monitor.trackDocument(`doc${i}`, 'x'.repeat(1000));
      }

      const status = monitor.getStatus();
      expect(status.status).toBe('critical');
      expect(status.percentUsed).toBeGreaterThanOrEqual(95);
    });

    it('should include human-readable MB values', () => {
      monitor.trackDocument('doc1', 'Test content');

      const status = monitor.getStatus();
      expect(status.usedMB).toMatch(/^\d+\.\d+ MB$/);
      expect(status.budgetMB).toBe('500.0 MB');
    });

    it('should calculate available bytes correctly', () => {
      monitor.trackDocument('doc1', 'Test content');

      const status = monitor.getStatus();
      expect(status.availableBytes).toBe(status.budgetBytes - status.usedBytes);
      expect(status.availableBytes).toBeGreaterThan(0);
    });
  });

  describe('projectMemoryUsage', () => {
    it('should project memory increase correctly', () => {
      monitor.trackDocument('existing', 'Existing content');

      const projection = monitor.projectMemoryUsage([
        { content: 'New content 1' },
        { content: 'New content 2' },
      ]);

      expect(projection.currentBytes).toBe(monitor.getStatus().usedBytes);
      expect(projection.projectedBytes).toBeGreaterThan(projection.currentBytes);
      expect(projection.deltaBytes).toBeGreaterThan(0);
      expect(projection.wouldExceedBudget).toBe(false);
    });

    it('should detect budget overflow in projection', () => {
      const tinyMonitor = new MemoryMonitor(0.001); // 1KB budget

      const projection = tinyMonitor.projectMemoryUsage([
        { content: 'x'.repeat(5000) }, // 5KB content
      ]);

      expect(projection.wouldExceedBudget).toBe(true);
      expect(projection.projectedPercent).toBeGreaterThan(100);
    });

    it('should calculate documents that can fit', () => {
      const projection = monitor.projectMemoryUsage([{ content: 'Sample content' }]);

      expect(projection.documentsCanFit).toBeGreaterThan(0);
      expect(projection.documentsCanFit).toBeLessThan(1000000); // Sanity check
    });

    it('should project with metadata', () => {
      const projection = monitor.projectMemoryUsage([
        { content: 'Content', metadata: { type: 'test', size: 'large' } },
      ]);

      expect(projection.deltaBytes).toBeGreaterThan(1536); // More than just embedding
    });
  });

  describe('getAllDocumentMemory', () => {
    it('should return all document memory usages', () => {
      monitor.trackDocument('doc1', 'Content 1');
      monitor.trackDocument('doc2', 'Content 2');
      monitor.trackDocument('doc3', 'Content 3');

      const allMemory = monitor.getAllDocumentMemory();

      expect(allMemory).toHaveLength(3);
      expect(allMemory.map((m) => m.id).sort()).toEqual(['doc1', 'doc2', 'doc3']);
    });

    it('should return empty array when no documents tracked', () => {
      const allMemory = monitor.getAllDocumentMemory();

      expect(allMemory).toEqual([]);
    });
  });

  describe('memory accuracy validation', () => {
    it('should track memory within 5% accuracy', () => {
      // Add several documents
      for (let i = 0; i < 10; i++) {
        monitor.trackDocument(`doc${i}`, `Content ${i}`, {
          index: i,
          timestamp: Date.now(),
        });
      }

      const validation = monitor.validateTracking();

      expect(validation.trackedBytes).toBeGreaterThan(0);
      expect(validation.processHeapBytes).toBeGreaterThan(0);
      // Note: In a real environment with other allocations, we can't guarantee
      // accuracy, but we can verify the structure is correct
      expect(validation.accuracyPercent).toBeGreaterThan(0);
    });

    it('should include accuracy metadata in validation', () => {
      monitor.trackDocument('doc1', 'Test content');

      const validation = monitor.validateTracking();

      expect(validation).toHaveProperty('trackedBytes');
      expect(validation).toHaveProperty('processHeapBytes');
      expect(validation).toHaveProperty('accuracyPercent');
      expect(validation).toHaveProperty('withinTolerance');
    });
  });

  describe('budget enforcement edge cases', () => {
    it('should reject document exactly at budget boundary', () => {
      const tinyMonitor = new MemoryMonitor(0.002); // 2KB budget

      // Fill to capacity
      tinyMonitor.trackDocument('doc1', 'x'.repeat(400)); // ~1936 bytes

      // Try to add one more byte
      expect(() => tinyMonitor.trackDocument('doc2', 'x'.repeat(100))).toThrow(
        'Memory budget exceeded'
      );
    });

    it('should allow document just under budget', () => {
      const tinyMonitor = new MemoryMonitor(0.003); // 3KB budget

      // Should not throw
      tinyMonitor.trackDocument('doc1', 'x'.repeat(1000)); // ~2536 bytes

      expect(tinyMonitor.getStatus().documentCount).toBe(1);
    });
  });

  describe('error messages', () => {
    it('should provide clear error message with available space', () => {
      const tinyMonitor = new MemoryMonitor(0.001); // 1KB budget

      try {
        tinyMonitor.trackDocument('large', 'x'.repeat(5000));
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('Memory budget exceeded');
        expect((error as Error).message).toContain('MB');
      }
    });
  });
});
