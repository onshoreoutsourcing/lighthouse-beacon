/**
 * MemoryMonitor - Memory budget tracking and enforcement for vector index
 * Feature 10.1 - Vector Service & Embedding Infrastructure
 * Wave 10.1.3 - Memory Monitoring & Index Persistence
 * User Story 1: Memory Budget Tracking & Enforcement
 *
 * Tracks memory usage with per-document breakdown, enforces 500MB budget,
 * and provides memory projection to estimate impact before adding documents.
 */

import { logger } from '../../logger';

/**
 * Memory usage breakdown for a single document
 */
export interface DocumentMemoryUsage {
  /** Document ID */
  id: string;
  /** Embedding memory (384 dimensions * 4 bytes per float32) */
  embeddingBytes: number;
  /** Content memory (UTF-8 encoded string) */
  contentBytes: number;
  /** Metadata memory (JSON.stringify) */
  metadataBytes: number;
  /** Total memory for this document */
  totalBytes: number;
}

/**
 * Memory status information
 */
export interface MemoryStatus {
  /** Total memory used in bytes */
  usedBytes: number;
  /** Memory budget in bytes (500MB) */
  budgetBytes: number;
  /** Available memory in bytes */
  availableBytes: number;
  /** Memory usage percentage (0-100) */
  percentUsed: number;
  /** Number of documents tracked */
  documentCount: number;
  /** Status level: 'ok', 'warning', 'critical', 'exceeded' */
  status: 'ok' | 'warning' | 'critical' | 'exceeded';
  /** Human-readable memory used (e.g., "245.3 MB") */
  usedMB: string;
  /** Human-readable memory budget (e.g., "500.0 MB") */
  budgetMB: string;
}

/**
 * Memory projection result for "what-if" analysis
 */
export interface MemoryProjection {
  /** Current memory usage in bytes */
  currentBytes: number;
  /** Estimated memory after adding documents */
  projectedBytes: number;
  /** Estimated memory increase in bytes */
  deltaBytes: number;
  /** Whether the projection would exceed budget */
  wouldExceedBudget: boolean;
  /** Projected memory percentage after addition */
  projectedPercent: number;
  /** Number of documents that can fit */
  documentsCanFit: number;
}

/**
 * MemoryMonitor tracks vector index memory usage and enforces budget limits
 *
 * @remarks
 * - Default budget: 500MB (524,288,000 bytes)
 * - Warning threshold: 80% (400MB)
 * - Critical threshold: 95% (475MB)
 * - Memory calculation includes: embedding + content + metadata
 * - Embedding: 384 dimensions * 4 bytes per float32 = 1,536 bytes
 * - Content: UTF-8 byte length of text
 * - Metadata: JSON.stringify byte length
 */
export class MemoryMonitor {
  private readonly budgetBytes: number;
  private readonly warningThreshold: number = 0.8; // 80%
  private readonly criticalThreshold: number = 0.95; // 95%
  private readonly embeddingDimension: number = 384;
  private readonly bytesPerFloat: number = 4;

  /** Per-document memory tracking */
  private documentMemory: Map<string, DocumentMemoryUsage> = new Map();

  /** Total memory usage in bytes */
  private totalUsedBytes: number = 0;

  /**
   * Creates a new MemoryMonitor
   *
   * @param budgetMB - Memory budget in megabytes (default: 500MB)
   */
  constructor(budgetMB: number = 500) {
    this.budgetBytes = budgetMB * 1024 * 1024; // Convert MB to bytes
    logger.info('[MemoryMonitor] Initialized', {
      budgetMB,
      budgetBytes: this.budgetBytes,
      warningThreshold: `${this.warningThreshold * 100}%`,
      criticalThreshold: `${this.criticalThreshold * 100}%`,
    });
  }

  /**
   * Track memory for a new document
   *
   * @param id - Document ID
   * @param content - Document content
   * @param metadata - Optional document metadata
   * @throws Error if adding document would exceed memory budget
   */
  trackDocument(id: string, content: string, metadata?: Record<string, unknown>): void {
    // Check if document already exists
    if (this.documentMemory.has(id)) {
      throw new Error(`Document '${id}' is already tracked. Remove it first to update.`);
    }

    // Calculate memory usage
    const usage = this.calculateDocumentMemory(content, metadata);
    const projectedTotal = this.totalUsedBytes + usage.totalBytes;

    // Enforce budget
    if (projectedTotal > this.budgetBytes) {
      const availableMB = this.bytesToMB(this.budgetBytes - this.totalUsedBytes);
      const requiredMB = this.bytesToMB(usage.totalBytes);
      throw new Error(
        `Memory budget exceeded: Adding document would use ${requiredMB} MB, but only ${availableMB} MB available (${this.bytesToMB(this.budgetBytes)} MB budget)`
      );
    }

    // Track document
    const docUsage: DocumentMemoryUsage = {
      id,
      ...usage,
    };

    this.documentMemory.set(id, docUsage);
    this.totalUsedBytes += usage.totalBytes;

    logger.debug('[MemoryMonitor] Document tracked', {
      documentId: id,
      memoryBytes: usage.totalBytes,
      memoryMB: this.bytesToMB(usage.totalBytes),
      totalUsedBytes: this.totalUsedBytes,
      totalUsedMB: this.bytesToMB(this.totalUsedBytes),
      percentUsed: this.getPercentUsed(),
    });
  }

  /**
   * Track multiple documents in batch
   *
   * @param documents - Array of documents to track
   * @throws Error if batch would exceed memory budget
   * @returns Number of documents successfully tracked
   */
  trackBatch(
    documents: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>
  ): number {
    // Calculate total memory needed for batch
    let batchMemoryNeeded = 0;
    const calculations: Array<{
      id: string;
      usage: Omit<DocumentMemoryUsage, 'id'>;
    }> = [];

    for (const doc of documents) {
      if (this.documentMemory.has(doc.id)) {
        throw new Error(`Document '${doc.id}' is already tracked. Remove it first to update.`);
      }

      const usage = this.calculateDocumentMemory(doc.content, doc.metadata);
      calculations.push({ id: doc.id, usage });
      batchMemoryNeeded += usage.totalBytes;
    }

    // Check if batch would exceed budget
    const projectedTotal = this.totalUsedBytes + batchMemoryNeeded;
    if (projectedTotal > this.budgetBytes) {
      const availableMB = this.bytesToMB(this.budgetBytes - this.totalUsedBytes);
      const requiredMB = this.bytesToMB(batchMemoryNeeded);
      throw new Error(
        `Memory budget exceeded: Batch would use ${requiredMB} MB, but only ${availableMB} MB available (${this.bytesToMB(this.budgetBytes)} MB budget)`
      );
    }

    // Track all documents
    for (const calc of calculations) {
      const docUsage: DocumentMemoryUsage = {
        id: calc.id,
        ...calc.usage,
      };
      this.documentMemory.set(calc.id, docUsage);
    }

    this.totalUsedBytes += batchMemoryNeeded;

    logger.info('[MemoryMonitor] Batch tracked', {
      documentCount: documents.length,
      batchMemoryMB: this.bytesToMB(batchMemoryNeeded),
      totalUsedMB: this.bytesToMB(this.totalUsedBytes),
      percentUsed: this.getPercentUsed(),
    });

    return documents.length;
  }

  /**
   * Remove document from tracking
   *
   * @param id - Document ID to remove
   * @returns True if document was removed, false if not found
   */
  removeDocument(id: string): boolean {
    const usage = this.documentMemory.get(id);
    if (!usage) {
      logger.warn('[MemoryMonitor] Document not found for removal', { documentId: id });
      return false;
    }

    this.documentMemory.delete(id);
    this.totalUsedBytes -= usage.totalBytes;

    logger.debug('[MemoryMonitor] Document removed', {
      documentId: id,
      freedMemoryMB: this.bytesToMB(usage.totalBytes),
      totalUsedMB: this.bytesToMB(this.totalUsedBytes),
      percentUsed: this.getPercentUsed(),
    });

    return true;
  }

  /**
   * Clear all tracked documents
   */
  clear(): void {
    const previousCount = this.documentMemory.size;
    const previousMemoryMB = this.bytesToMB(this.totalUsedBytes);

    this.documentMemory.clear();
    this.totalUsedBytes = 0;

    logger.info('[MemoryMonitor] Cleared all documents', {
      previousCount,
      previousMemoryMB,
    });
  }

  /**
   * Get current memory status
   *
   * @returns Memory status with usage, budget, and status level
   */
  getStatus(): MemoryStatus {
    const percentUsed = this.getPercentUsed();
    const availableBytes = this.budgetBytes - this.totalUsedBytes;

    let status: MemoryStatus['status'] = 'ok';
    if (percentUsed >= 100) {
      status = 'exceeded';
    } else if (percentUsed >= this.criticalThreshold * 100) {
      status = 'critical';
    } else if (percentUsed >= this.warningThreshold * 100) {
      status = 'warning';
    }

    return {
      usedBytes: this.totalUsedBytes,
      budgetBytes: this.budgetBytes,
      availableBytes,
      percentUsed,
      documentCount: this.documentMemory.size,
      status,
      usedMB: `${this.bytesToMB(this.totalUsedBytes).toFixed(1)} MB`,
      budgetMB: `${this.bytesToMB(this.budgetBytes).toFixed(1)} MB`,
    };
  }

  /**
   * Project memory usage after adding documents
   *
   * @param documents - Documents to project
   * @returns Memory projection with estimated usage
   */
  projectMemoryUsage(
    documents: Array<{ content: string; metadata?: Record<string, unknown> }>
  ): MemoryProjection {
    let projectedDelta = 0;

    for (const doc of documents) {
      const usage = this.calculateDocumentMemory(doc.content, doc.metadata);
      projectedDelta += usage.totalBytes;
    }

    const projectedBytes = this.totalUsedBytes + projectedDelta;
    const wouldExceedBudget = projectedBytes > this.budgetBytes;
    const projectedPercent = (projectedBytes / this.budgetBytes) * 100;

    // Calculate how many of these documents can fit
    const availableBytes = this.budgetBytes - this.totalUsedBytes;
    const avgBytesPerDoc =
      documents.length > 0 ? projectedDelta / documents.length : this.getAverageDocumentSize();
    const documentsCanFit = Math.floor(availableBytes / avgBytesPerDoc);

    return {
      currentBytes: this.totalUsedBytes,
      projectedBytes,
      deltaBytes: projectedDelta,
      wouldExceedBudget,
      projectedPercent,
      documentsCanFit,
    };
  }

  /**
   * Get memory usage for a specific document
   *
   * @param id - Document ID
   * @returns Document memory usage, or undefined if not found
   */
  getDocumentMemory(id: string): DocumentMemoryUsage | undefined {
    return this.documentMemory.get(id);
  }

  /**
   * Get all document memory breakdowns
   *
   * @returns Array of all document memory usages
   */
  getAllDocumentMemory(): DocumentMemoryUsage[] {
    return Array.from(this.documentMemory.values());
  }

  /**
   * Validate memory tracking against actual process memory
   *
   * @returns Validation result with accuracy percentage
   */
  validateTracking(): {
    trackedBytes: number;
    processHeapBytes: number;
    accuracyPercent: number;
    withinTolerance: boolean;
  } {
    const trackedBytes = this.totalUsedBytes;
    const processHeapBytes = process.memoryUsage().heapUsed;

    // Calculate accuracy (allowing for some overhead in actual memory)
    const accuracyPercent = (trackedBytes / processHeapBytes) * 100;
    const tolerance = 5; // 5% tolerance
    const withinTolerance = Math.abs(accuracyPercent - 100) <= tolerance;

    logger.debug('[MemoryMonitor] Memory validation', {
      trackedMB: this.bytesToMB(trackedBytes),
      processHeapMB: this.bytesToMB(processHeapBytes),
      accuracyPercent: accuracyPercent.toFixed(2),
      withinTolerance,
    });

    return {
      trackedBytes,
      processHeapBytes,
      accuracyPercent,
      withinTolerance,
    };
  }

  /**
   * Calculate memory usage for a document
   *
   * @param content - Document content
   * @param metadata - Optional document metadata
   * @returns Memory usage breakdown
   */
  private calculateDocumentMemory(
    content: string,
    metadata?: Record<string, unknown>
  ): Omit<DocumentMemoryUsage, 'id'> {
    // Embedding memory: 384 dimensions * 4 bytes per float32
    const embeddingBytes = this.embeddingDimension * this.bytesPerFloat;

    // Content memory: UTF-8 byte length
    const contentBytes = Buffer.byteLength(content, 'utf8');

    // Metadata memory: JSON.stringify byte length
    const metadataBytes = metadata ? Buffer.byteLength(JSON.stringify(metadata), 'utf8') : 0;

    const totalBytes = embeddingBytes + contentBytes + metadataBytes;

    return {
      embeddingBytes,
      contentBytes,
      metadataBytes,
      totalBytes,
    };
  }

  /**
   * Get current memory usage percentage
   */
  private getPercentUsed(): number {
    return (this.totalUsedBytes / this.budgetBytes) * 100;
  }

  /**
   * Get average document size (for projection calculations)
   */
  private getAverageDocumentSize(): number {
    if (this.documentMemory.size === 0) {
      // Default estimate: 384*4 (embedding) + 500 (content) + 100 (metadata)
      return this.embeddingDimension * this.bytesPerFloat + 600;
    }

    return this.totalUsedBytes / this.documentMemory.size;
  }

  /**
   * Convert bytes to megabytes
   */
  private bytesToMB(bytes: number): number {
    return bytes / (1024 * 1024);
  }
}
