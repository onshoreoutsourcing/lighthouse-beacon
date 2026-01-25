# Feature 10.1: Vector Service & Embedding Infrastructure

## Feature Overview
- **Feature ID:** Feature-10.1
- **Epic:** Epic 10 - RAG Knowledge Base
- **Status:** Planning
- **Duration:** 3 waves, 3-4 weeks
- **Priority:** High (Foundation for Epic 10)

## Implementation Scope

Feature 10.1 establishes the core vector search and embedding infrastructure for Lighthouse Chat IDE's RAG Knowledge Base. This Feature delivers local embedding generation via Transformers.js, hybrid vector search via vector-lite, and memory-budgeted index management.

**Objectives:**
- Integrate vector-lite for hybrid semantic + keyword search
- Enable local embedding generation via Transformers.js (all-MiniLM-L6-v2)
- Implement memory budget tracking and enforcement (500MB maximum)
- Persist vector index to disk for session continuity
- Provide foundation for Features 10.2-10.4

## Technical Requirements

### Functional Requirements
- **FR-10.1.1**: Local embedding generation using Transformers.js with all-MiniLM-L6-v2 model
- **FR-10.1.2**: Hybrid vector search combining semantic embeddings (70%) and keyword matching (30%)
- **FR-10.1.3**: Memory budget tracking with 500MB hard limit, 80% warning threshold, 95% blocking threshold
- **FR-10.1.4**: Vector index persistence to disk in JSON format at `.lighthouse/knowledge/index.json`
- **FR-10.1.5**: Automatic index loading on application restart with integrity validation
- **FR-10.1.6**: Document addition with memory projection - reject operations that would exceed budget
- **FR-10.1.7**: Document removal with memory tracking updates
- **FR-10.1.8**: Real-time memory status reporting (usedMB, budgetMB, percentUsed, documentCount)

### Non-Functional Requirements
- **Performance:**
  - Embedding generation: < 2 seconds per document
  - Hybrid search query: < 50ms for top 5 results
  - Memory tracking accuracy: within 5% of actual usage
  - Index save/load: < 1 second for typical index (1000 documents)

- **Security:**
  - Model downloaded over HTTPS with integrity check
  - Index files written atomically (temp file + rename)
  - No external API calls after initial model download
  - Memory limits prevent Out-Of-Memory conditions

- **Scalability:**
  - Support 5,000-10,000 document chunks within 500MB budget
  - Linear search performance up to 10,000 documents
  - Graceful degradation when approaching memory limits

- **Reliability:**
  - Index corruption detection and recovery
  - Graceful error handling for invalid documents
  - Automatic cleanup on memory threshold violations
  - No data loss on application restart

### Technical Constraints
- Must use Transformers.js (no native bindings, pure JS for Electron compatibility)
- Must use vector-lite library (established hybrid search pattern)
- Memory budget is hard requirement (500MB maximum per Product Owner decision)
- Embeddings must remain local (no cloud API calls for privacy)
- Must integrate with existing FileSystemService for file access

## Dependencies

**Prerequisites (must complete before this Feature):**
- ✅ Epic 1: Desktop Foundation (Electron, IPC, services architecture)
- ✅ Epic 3: File Operations (FileSystemService, PathValidator)
- ✅ Docs/architecture/_main/04-Architecture.md (service patterns established)

**Enables (this Feature enables):**
- Feature 10.2: Knowledge Base UI (depends on VectorService for memory status)
- Feature 10.3: RAG Pipeline (depends on VectorService for context retrieval)
- Feature 10.4: Chat Integration (indirectly through 10.3)

**External Dependencies:**
- **Transformers.js** (v3.x): Local ML inference library
- **@xenova/transformers**: All-MiniLM-L6-v2 model (~22MB download)
- **vector-lite** (v1.x): Hybrid vector search library
- **Node.js process.memoryUsage()**: For memory monitoring validation
- **FileSystemService**: For index persistence

## Logical Unit Tests

Unit tests will call VectorService API methods and verify data structures, memory tracking, and search functionality:

**Test Cases:**
1. **Test: Local Embedding Generation**
   - Call `embeddingService.embed(text)` with sample document
   - Verify returns 384-dimensional float array
   - Verify generation completes in < 2 seconds
   - Verify embedding values in valid range [-1, 1]

2. **Test: Hybrid Vector Search**
   - Add 10 documents with known content
   - Call `vectorService.search(query, options)` with test query
   - Verify returns top-K results ordered by relevance
   - Verify hybrid scoring combines semantic + keyword correctly
   - Verify results include document IDs and metadata

3. **Test: Memory Budget Enforcement**
   - Add documents until 95% of budget reached
   - Attempt to add document that would exceed 100%
   - Verify operation rejected with MEMORY_BUDGET_EXCEEDED error
   - Verify memory status reflects current usage accurately
   - Verify warning triggered at 80% threshold

4. **Test: Index Persistence**
   - Add 5 documents to index
   - Call `indexPersistence.save(index)`
   - Verify file written to `.lighthouse/knowledge/index.json`
   - Load index in new VectorService instance
   - Verify all 5 documents present with correct embeddings

5. **Test: Document Addition**
   - Call `vectorService.addDocument(doc)` with valid document
   - Verify document added to index
   - Verify memory tracking updated
   - Verify document searchable immediately

6. **Test: Document Removal**
   - Add document, then call `vectorService.removeDocument(docId)`
   - Verify document no longer in index
   - Verify memory tracking reflects removal
   - Verify search no longer returns removed document

7. **Test: Memory Projection**
   - Call `memoryMonitor.projectMemoryUsage(doc)`
   - Verify projection includes embedding size + metadata + content
   - Verify projection matches actual memory increase (within 10%)

8. **Test: Search Relevance**
   - Add documents with varying relevance to query
   - Call `vectorService.search(query, { minScore: 0.3 })`
   - Verify low-relevance documents excluded
   - Verify relevance scores correct

## Testing Strategy and Acceptance Criteria

### Testing Strategy
- **Unit Tests:**
  - `VectorService.test.ts`: All public API methods
  - `EmbeddingService.test.ts`: Embedding generation, model loading
  - `MemoryMonitor.test.ts`: Memory tracking, budget enforcement
  - `IndexPersistence.test.ts`: Save, load, integrity validation

- **Integration Tests:**
  - End-to-end: Add document → Generate embedding → Search → Retrieve
  - Memory stress test: Add documents until budget reached
  - Persistence test: Save index → Restart → Load index → Verify data

- **Performance Tests:**
  - Benchmark embedding generation time (target < 2s per doc)
  - Benchmark search time with varying document counts (target < 50ms)
  - Memory leak test: Add/remove documents repeatedly

- **Security Tests:**
  - Model download integrity check
  - Index file atomic write verification
  - Memory limit enforcement under stress

### Acceptance Criteria
- [ ] Transformers.js integration complete, all-MiniLM-L6-v2 model loads successfully
- [ ] Embedding generation works for text documents (< 2s per document)
- [ ] Hybrid vector search returns relevant results in < 50ms
- [ ] Memory budget tracked accurately (within 5% of actual usage)
- [ ] Memory warning triggered at 80% usage
- [ ] Memory blocking triggered at 95% usage - operations fail gracefully
- [ ] Index persists to disk at `.lighthouse/knowledge/index.json`
- [ ] Index loads on application restart with all documents intact
- [ ] Document addition updates memory tracking correctly
- [ ] Document removal updates memory tracking correctly
- [ ] All unit tests passing (coverage ≥ 90%)
- [ ] All integration tests passing
- [ ] Performance benchmarks meet targets
- [ ] Code reviewed and approved
- [ ] Documentation updated (JSDoc, architecture docs)

## Integration Points

### Integration with Other Features
- **Feature 10.2 (Knowledge Base UI):** VectorService provides memory status for UI display
- **Feature 10.3 (RAG Pipeline):** VectorService provides search capabilities for context retrieval
- **Feature 10.4 (Chat Integration):** Indirect - provides backend for RAG-augmented chat

### Integration with Other Epics
- **Epic 3 (File Operations):** Uses FileSystemService for index persistence
- **Epic 2 (AI Integration):** Coordinates with AIService for embedding model (Transformers.js)

### External Integrations
- **Transformers.js**: Local ML inference for embedding generation
- **vector-lite**: Hybrid vector search library
- **FileSystem**: For index persistence to `.lighthouse/knowledge/`

## Implementation Phases

### Wave 10.1.1: Vector-lite Integration & Basic Search
- Install and configure vector-lite library
- Implement VectorService wrapper class with basic add/search methods
- Create vector.types.ts with TypeScript interfaces
- Write unit tests for basic vector operations
- **Deliverables:** VectorService.ts, vector.types.ts, tests

### Wave 10.1.2: Transformers.js Embedding Generation
- Install @xenova/transformers library
- Implement EmbeddingService for all-MiniLM-L6-v2
- Add model downloading and caching logic
- Integrate EmbeddingService with VectorService
- Write unit tests for embedding generation
- **Deliverables:** EmbeddingService.ts, model loading, tests

### Wave 10.1.3: Memory Monitoring & Index Persistence
- Implement MemoryMonitor with budget tracking
- Add memory projection and enforcement logic
- Implement IndexPersistence for save/load to disk
- Add integrity validation on load
- Write unit tests for memory and persistence
- **Deliverables:** MemoryMonitor.ts, IndexPersistence.ts, tests

## Architecture and Design

### Component Architecture

```
src/main/services/vector/
├── VectorService.ts         # Main service class
├── EmbeddingService.ts      # Transformers.js wrapper
├── MemoryMonitor.ts         # Budget tracking
└── IndexPersistence.ts      # Save/load to disk

src/shared/types/
└── vector.types.ts          # TypeScript interfaces
```

**VectorService Class:**

```typescript
export class VectorService {
  private vectorIndex: VectorIndex;
  private memoryMonitor: MemoryMonitor;
  private embeddingService: EmbeddingService;
  private persistence: IndexPersistence;

  constructor(config: VectorServiceConfig) {
    this.memoryMonitor = new MemoryMonitor(500); // 500MB budget
    this.embeddingService = new EmbeddingService('all-MiniLM-L6-v2');
    this.persistence = new IndexPersistence(config.indexPath);
    this.vectorIndex = new VectorIndex();
  }

  async addDocument(doc: DocumentInput): Promise<AddResult>;
  async removeDocument(docId: string): Promise<RemoveResult>;
  async search(query: string, options: SearchOptions): Promise<SearchResult[]>;
  getMemoryStatus(): MemoryStatus;
  async saveIndex(): Promise<void>;
  async loadIndex(): Promise<void>;
}
```

**EmbeddingService Class:**

```typescript
export class EmbeddingService {
  private model: Pipeline;
  private modelName: string;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  async initialize(): Promise<void>;
  async embed(text: string): Promise<number[]>;
  isReady(): boolean;
}
```

**MemoryMonitor Class:**

```typescript
export class MemoryMonitor {
  private currentUsageBytes: number = 0;
  private budgetMB: number;
  private documentSizes: Map<string, number>;

  constructor(budgetMB: number) {
    this.budgetMB = budgetMB;
    this.documentSizes = new Map();
  }

  recordAddition(doc: DocumentInput, sizeBytes: number): void;
  recordRemoval(docId: string): void;
  projectMemoryUsage(doc: DocumentInput): number;
  canAddDocument(doc: DocumentInput): CanAddResult;
  getCurrentUsageMB(): number;
  getPercentUsed(): number;
  getStatus(): MemoryStatus;
}
```

### Data Model

**DocumentInput:**
```typescript
interface DocumentInput {
  id: string;
  content: string;
  metadata: {
    filePath: string;
    startLine?: number;
    endLine?: number;
    timestamp: number;
    [key: string]: unknown;
  };
}
```

**SearchResult:**
```typescript
interface SearchResult {
  id: string;
  score: number;
  metadata: Record<string, unknown>;
  semanticScore: number;
  keywordScore: number;
}
```

**MemoryStatus:**
```typescript
interface MemoryStatus {
  usedMB: number;
  budgetMB: number;
  percentUsed: number;
  status: 'healthy' | 'warning' | 'critical';
  documentsIndexed: number;
  chunksIndexed: number;
}
```

**IndexFile Format (JSON):**
```typescript
interface IndexFile {
  version: string;
  modelName: string;
  dimensions: number;
  documents: {
    id: string;
    embedding: number[];
    metadata: Record<string, unknown>;
  }[];
  metadata: {
    created: string;
    modified: string;
    documentCount: number;
    totalSize: number;
  };
}
```

### API Design

**VectorService IPC Handlers:**

```typescript
// src/main/ipc/vector-handlers.ts
ipcMain.handle('vector:add-document', async (event, doc: DocumentInput) => {
  return await vectorService.addDocument(doc);
});

ipcMain.handle('vector:remove-document', async (event, docId: string) => {
  return await vectorService.removeDocument(docId);
});

ipcMain.handle('vector:search', async (event, query: string, options: SearchOptions) => {
  return await vectorService.search(query, options);
});

ipcMain.handle('vector:get-memory-status', async () => {
  return vectorService.getMemoryStatus();
});

ipcMain.handle('vector:save-index', async () => {
  await vectorService.saveIndex();
  return { success: true };
});
```

## Security Considerations

- **Model Download Security:** Transformers.js model downloaded over HTTPS with integrity checks
- **Index File Security:** Atomic writes prevent corruption (write to temp, then rename)
- **Memory Safety:** Budget enforcement prevents Out-Of-Memory conditions
- **No External Calls:** After initial model download, all processing local (privacy preserved)
- **Path Validation:** Index files written only to validated `.lighthouse/` directory
- **Input Validation:** All documents validated before embedding generation

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Transformers.js performance inadequate on older hardware | High | Medium | Use Web Workers for non-blocking embedding; show progress indicators; allow cancellation |
| Memory estimates inaccurate | Medium | Medium | Calibrate with actual measurements; add 10% safety margin; monitor process.memoryUsage() |
| Vector-lite search quality insufficient | Medium | Low | Test with real codebases; tune semantic/keyword weights; provide fallback to keyword-only |
| Large model download fails | Medium | Low | Retry with exponential backoff; cache model; provide clear error messages |
| Index file corruption | Low | Low | Atomic writes; validate on load; keep backup of previous index |
| Embedding generation slow | Medium | Medium | Process in background; show progress; allow batch operations to be interrupted |

## Definition of Done

- [ ] VectorService implements all public API methods
- [ ] Transformers.js integration complete with all-MiniLM-L6-v2
- [ ] Embedding generation working (< 2s per document)
- [ ] Hybrid vector search functional (< 50ms per query)
- [ ] Memory monitoring accurate (within 5% actual usage)
- [ ] Memory budget enforced (500MB hard limit)
- [ ] Warning triggered at 80% memory usage
- [ ] Operations blocked at 95% memory usage
- [ ] Index persistence to `.lighthouse/knowledge/index.json` working
- [ ] Index loads correctly on application restart
- [ ] All unit tests written and passing (coverage ≥ 90%)
- [ ] All integration tests passing
- [ ] Performance benchmarks meet targets
- [ ] Code reviewed and approved
- [ ] Security review completed (no high/critical issues)
- [ ] JSDoc documentation complete
- [ ] Architecture documentation updated

## Related Documentation

- Epic Plan: Docs/implementation/_main/epic-10-rag-knowledge-base.md
- Product Requirements: Docs/architecture/_main/03-Business-Requirements.md
- Architecture: Docs/architecture/_main/04-Architecture.md
- ADR-018: RAG Knowledge Base Architecture

## Architecture Decision Records (ADRs)

- **ADR-018**: RAG Knowledge Base Architecture (memory-based limits, local embeddings, hybrid search)
- **ADR-001**: Electron Architecture (services in main process)
- **ADR-011**: Path Validation & Sandboxing (index files in validated directory)

---

**Feature Plan Version:** 1.0
**Last Updated:** January 23, 2026
**Status:** Ready for Wave Planning
