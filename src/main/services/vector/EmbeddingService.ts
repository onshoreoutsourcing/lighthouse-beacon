/**
 * EmbeddingService - Local embedding generation using Transformers.js
 * Feature 10.1 - Vector Service & Embedding Infrastructure
 * Wave 10.1.2 - Transformers.js Embedding Generation
 *
 * Provides local text-to-embedding conversion using the all-MiniLM-L6-v2 model:
 * - 384-dimensional embeddings
 * - Fully offline operation after initial model download
 * - Model caching in Electron userData directory
 * - Non-blocking async operations
 */

import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../../logger';
import { EventEmitter } from 'events';

/**
 * Events emitted by EmbeddingService
 */
export interface EmbeddingServiceEvents {
  /**
   * Emitted during model download
   * @param progress - Download progress percentage (0-100)
   * @param loaded - Bytes downloaded
   * @param total - Total bytes to download
   */
  downloadProgress: (progress: number, loaded: number, total: number) => void;

  /**
   * Emitted when model is ready for use
   */
  ready: () => void;

  /**
   * Emitted on errors
   * @param error - Error message
   */
  error: (error: string) => void;

  /**
   * Emitted during batch embedding operations
   * @param current - Current item being processed
   * @param total - Total items to process
   */
  batchProgress: (current: number, total: number) => void;
}

/**
 * Options for embedding generation
 */
export interface EmbeddingOptions {
  /**
   * Whether to normalize embeddings to unit length (default: true)
   */
  normalize?: boolean;

  /**
   * Maximum length for tokenization (default: 512)
   */
  maxLength?: number;

  /**
   * Whether to use mean pooling (default: true)
   */
  pooling?: 'mean' | 'cls';

  /**
   * Timeout for embedding generation in milliseconds (default: 30000)
   */
  timeout?: number;
}

/**
 * Model download state
 */
interface ModelState {
  isDownloading: boolean;
  isReady: boolean;
  downloadAttempts: number;
  lastError?: string;
}

/**
 * EmbeddingService provides local embedding generation
 *
 * @remarks
 * Uses Transformers.js with the all-MiniLM-L6-v2 model for generating
 * 384-dimensional sentence embeddings. Model is downloaded automatically
 * on first use and cached locally for offline operation.
 *
 * @example
 * ```typescript
 * const service = new EmbeddingService();
 * await service.initialize();
 * const embedding = await service.generateEmbedding('Hello world');
 * ```
 */
export class EmbeddingService extends EventEmitter {
  private pipeline: FeatureExtractionPipeline | null = null;
  private modelName = 'Xenova/all-MiniLM-L6-v2';
  private modelPath: string;
  private state: ModelState = {
    isDownloading: false,
    isReady: false,
    downloadAttempts: 0,
  };
  private readonly MAX_RETRIES = 3;
  private readonly EMBEDDING_DIMENSION = 384;
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private initializationPromise: Promise<void> | null = null;
  private abortControllers: Map<string, AbortController> = new Map();

  /**
   * Creates a new EmbeddingService instance
   *
   * @param customModelPath - Optional custom path for model storage
   */
  constructor(customModelPath?: string) {
    super();

    // Set model cache directory to Electron userData/models
    const userDataPath = app.getPath('userData');
    this.modelPath = customModelPath || path.join(userDataPath, 'models');

    // Configure Transformers.js to use local cache
    process.env.TRANSFORMERS_CACHE = this.modelPath;

    logger.info('[EmbeddingService] Initialized', { modelPath: this.modelPath });
  }

  /**
   * Initialize the embedding service
   *
   * @remarks
   * Loads the embedding model from cache or downloads it if not present.
   * This method is idempotent and can be called multiple times safely.
   * Subsequent calls will return the same promise from the first initialization.
   *
   * @returns Promise that resolves when service is ready
   * @throws Error if initialization fails after all retries
   */
  async initialize(): Promise<void> {
    // Return existing initialization if in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Already initialized
    if (this.state.isReady && this.pipeline) {
      return Promise.resolve();
    }

    // Create new initialization promise
    this.initializationPromise = this.initializeInternal();
    return this.initializationPromise;
  }

  /**
   * Internal initialization with retry logic
   */
  private async initializeInternal(): Promise<void> {
    try {
      // Ensure model directory exists
      await fs.mkdir(this.modelPath, { recursive: true });
      logger.info('[EmbeddingService] Model directory ready', { path: this.modelPath });

      // Load model with retry logic
      await this.loadModelWithRetry();

      this.state.isReady = true;
      this.emit('ready');
      logger.info('[EmbeddingService] Service ready');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.state.lastError = errorMsg;
      logger.error('[EmbeddingService] Initialization failed', { error: errorMsg });
      this.emit('error', errorMsg);
      throw new Error(`Failed to initialize EmbeddingService: ${errorMsg}`);
    }
  }

  /**
   * Load model with exponential backoff retry
   */
  private async loadModelWithRetry(): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        this.state.downloadAttempts = attempt + 1;
        this.state.isDownloading = true;

        logger.info('[EmbeddingService] Loading model', {
          model: this.modelName,
          attempt: attempt + 1,
          maxRetries: this.MAX_RETRIES,
        });

        // Load pipeline with progress callback
        this.pipeline = await pipeline('feature-extraction', this.modelName, {
          progress_callback: (progress: { status: string; loaded?: number; total?: number }) => {
            if (progress.status === 'progress' && progress.total && progress.loaded) {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              this.emit('downloadProgress', percent, progress.loaded, progress.total);
              logger.debug('[EmbeddingService] Download progress', {
                percent,
                loaded: progress.loaded,
                total: progress.total,
              });
            }
          },
        });

        this.state.isDownloading = false;
        logger.info('[EmbeddingService] Model loaded successfully', {
          attempt: attempt + 1,
        });
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.state.isDownloading = false;

        logger.warn('[EmbeddingService] Model load attempt failed', {
          attempt: attempt + 1,
          error: lastError.message,
        });

        // Wait with exponential backoff before retry
        if (attempt < this.MAX_RETRIES - 1) {
          const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          logger.info('[EmbeddingService] Retrying after backoff', {
            backoffMs,
            nextAttempt: attempt + 2,
          });
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    // All retries failed
    throw new Error(
      `Failed to load model after ${this.MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Check if model is downloaded and cached locally
   *
   * @returns Promise that resolves to true if model is cached
   */
  async isModelCached(): Promise<boolean> {
    try {
      // Check if model directory exists and contains files
      const modelDir = path.join(this.modelPath, 'models--Xenova--all-MiniLM-L6-v2');
      const stat = await fs.stat(modelDir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Get model cache directory path
   *
   * @returns Path to model cache directory
   */
  getModelPath(): string {
    return this.modelPath;
  }

  /**
   * Generate embedding for a single text
   *
   * @param text - Input text to embed
   * @param options - Optional embedding configuration
   * @returns Promise that resolves to embedding vector (384 dimensions)
   * @throws Error if service not initialized or embedding fails
   */
  async generateEmbedding(text: string, options: EmbeddingOptions = {}): Promise<number[]> {
    // Ensure initialized
    await this.initialize();

    if (!this.pipeline || !this.state.isReady) {
      throw new Error('EmbeddingService not ready');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Cannot generate embedding for empty text');
    }

    const {
      normalize = true,
      maxLength = 512,
      pooling = 'mean',
      timeout = this.DEFAULT_TIMEOUT,
    } = options;

    const operationId = `embed-${Date.now()}`;
    const abortController = new AbortController();
    this.abortControllers.set(operationId, abortController);

    try {
      const startTime = Date.now();

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeoutId = setTimeout(() => {
          abortController.abort();
          reject(new Error(`Embedding generation timed out after ${timeout}ms`));
        }, timeout);

        // Clear timeout if aborted early
        abortController.signal.addEventListener('abort', () => clearTimeout(timeoutId));
      });

      // Generate embedding with timeout
      const embeddingPromise = this.generateEmbeddingInternal(text, normalize, maxLength, pooling);

      const embedding = await Promise.race([embeddingPromise, timeoutPromise]);

      const duration = Date.now() - startTime;
      logger.info('[EmbeddingService] Generated embedding', {
        textLength: text.length,
        embeddingDim: embedding.length,
        durationMs: duration,
      });

      // Verify embedding dimension
      if (embedding.length !== this.EMBEDDING_DIMENSION) {
        throw new Error(
          `Invalid embedding dimension: expected ${this.EMBEDDING_DIMENSION}, got ${embedding.length}`
        );
      }

      return embedding;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('[EmbeddingService] Embedding generation failed', {
        textLength: text.length,
        error: errorMsg,
      });
      throw new Error(`Failed to generate embedding: ${errorMsg}`);
    } finally {
      this.abortControllers.delete(operationId);
    }
  }

  /**
   * Internal embedding generation
   */
  private async generateEmbeddingInternal(
    text: string,
    normalize: boolean,
    _maxLength: number, // Not used - transformers.js handles tokenization internally
    pooling: 'mean' | 'cls'
  ): Promise<number[]> {
    if (!this.pipeline) {
      throw new Error('Pipeline not initialized');
    }

    // Generate embedding using the pipeline
    const output = await this.pipeline(text, {
      pooling: pooling,
      normalize: normalize,
    });

    // Extract embedding array from output
    const embedding = Array.from(output.data as Float32Array);

    return embedding;
  }

  /**
   * Generate embeddings for multiple texts in batch
   *
   * @param texts - Array of texts to embed
   * @param options - Optional embedding configuration
   * @returns Promise that resolves to array of embedding vectors
   * @throws Error if service not initialized or any embedding fails
   */
  async generateBatchEmbeddings(
    texts: string[],
    options: EmbeddingOptions = {}
  ): Promise<number[][]> {
    await this.initialize();

    if (!this.pipeline || !this.state.isReady) {
      throw new Error('EmbeddingService not ready');
    }

    if (texts.length === 0) {
      return [];
    }

    const operationId = `batch-${Date.now()}`;
    const abortController = new AbortController();
    this.abortControllers.set(operationId, abortController);

    try {
      const embeddings: number[][] = [];
      const startTime = Date.now();

      for (let i = 0; i < texts.length; i++) {
        // Check if operation was cancelled
        if (abortController.signal.aborted) {
          throw new Error('Batch embedding operation cancelled');
        }

        // Emit progress
        this.emit('batchProgress', i + 1, texts.length);

        // Generate embedding for current text (texts[i] is guaranteed to be string)
        const text = texts[i];
        if (text === undefined) {
          throw new Error(`Text at index ${i} is undefined`);
        }
        const embedding = await this.generateEmbedding(text, options);
        embeddings.push(embedding);
      }

      const duration = Date.now() - startTime;
      logger.info('[EmbeddingService] Generated batch embeddings', {
        count: texts.length,
        durationMs: duration,
        avgDurationPerDoc: Math.round(duration / texts.length),
      });

      return embeddings;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('[EmbeddingService] Batch embedding failed', {
        textsCount: texts.length,
        error: errorMsg,
      });
      throw new Error(`Failed to generate batch embeddings: ${errorMsg}`);
    } finally {
      this.abortControllers.delete(operationId);
    }
  }

  /**
   * Cancel an ongoing operation
   *
   * @param operationId - ID of operation to cancel (optional, cancels all if not provided)
   */
  cancelOperation(operationId?: string): void {
    if (operationId) {
      const controller = this.abortControllers.get(operationId);
      if (controller) {
        controller.abort();
        this.abortControllers.delete(operationId);
        logger.info('[EmbeddingService] Cancelled operation', { operationId });
      }
    } else {
      // Cancel all operations
      for (const [id, controller] of this.abortControllers) {
        controller.abort();
        logger.info('[EmbeddingService] Cancelled operation', { operationId: id });
      }
      this.abortControllers.clear();
    }
  }

  /**
   * Check if service is ready
   *
   * @returns True if service is initialized and ready
   */
  isReady(): boolean {
    return this.state.isReady && this.pipeline !== null;
  }

  /**
   * Get embedding dimension
   *
   * @returns Embedding vector dimension (384 for all-MiniLM-L6-v2)
   */
  getEmbeddingDimension(): number {
    return this.EMBEDDING_DIMENSION;
  }

  /**
   * Get service state
   *
   * @returns Current service state
   */
  getState(): Readonly<ModelState> {
    return { ...this.state };
  }

  /**
   * Clear model cache
   *
   * @remarks
   * Removes downloaded model files. Next initialization will re-download.
   *
   * @returns Promise that resolves when cache is cleared
   */
  async clearCache(): Promise<void> {
    try {
      await fs.rm(this.modelPath, { recursive: true, force: true });
      logger.info('[EmbeddingService] Model cache cleared', { path: this.modelPath });
    } catch (error) {
      logger.error('[EmbeddingService] Failed to clear cache', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to clear model cache: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
