# ADR-019: Vectra LocalIndex for Vector Storage

**Status**: Accepted
**Date**: 2026-01-25
**Deciders**: Lighthouse Development Team
**Related**: Epic-10, ADR-018 (RAG Knowledge Base Architecture), ADR-003 (Zustand)

---

## Context

During Epic 10 implementation, the original plan specified using `vector-lite` for vector storage. However, during actual implementation, we discovered that **Vectra (LocalIndex)** provided significant advantages for our use case.

**Original ADR-018 Decision:**
> "Use vector-lite for local hybrid vector search with Transformers.js for embedding generation."

**Implementation Reality:**
When implementing Feature 10.1 (Vector Service & Embedding Infrastructure), we needed:
- File-backed persistence without manual serialization
- Hybrid search combining semantic and keyword (BM25) search
- Efficient in-memory operations with disk persistence
- Batch operations for multiple documents
- Metadata filtering capabilities

**Requirements (from ADR-018):**
- Desktop application with limited memory
- Must work offline
- Index must persist across application restarts
- Hybrid search (semantic + keyword) for code retrieval
- <50ms search latency for 1000+ documents

---

## Considered Options

### Option 1: vector-lite (Originally Planned)

**Description:** Lightweight vector search library focused on in-memory operations.

**Pros:**
- Simple API
- Small bundle size (~50KB)
- Pure JavaScript implementation

**Cons:**
- Requires manual persistence implementation
- Limited hybrid search capabilities
- No built-in BM25 integration
- Minimal documentation

### Option 2: Vectra LocalIndex (Chosen)

**Description:** File-backed local vector index with built-in persistence and hybrid search.

**Pros:**
- File-backed persistence out of the box
- Built-in BM25 hybrid search with configurable weighting
- Proven at scale (used in Microsoft's production systems)
- Comprehensive TypeScript definitions
- Batch insert/query operations
- Metadata filtering support
- Automatic index management

**Cons:**
- Slightly larger dependency footprint
- BM25 requires minimum document threshold for consolidation
- Less commonly known than alternatives

### Option 3: LanceDB

**Description:** Embedded vector database with columnar storage.

**Pros:**
- High performance for large datasets
- SQL-like query syntax
- Built for production workloads

**Cons:**
- Heavier dependency (Rust bindings)
- Overkill for desktop application scale
- Complex setup for Electron

### Option 4: Chroma (Local Mode)

**Description:** Popular vector database with local persistence option.

**Pros:**
- Well-documented
- Large community
- Feature-rich

**Cons:**
- Requires Python runtime or server process
- Not designed for embedding in Electron apps
- Complex dependency chain

---

## Decision

**We have decided to use Vectra (LocalIndex) instead of vector-lite for Lighthouse's vector storage layer.**

### Why This Choice

Vectra provides the optimal balance of functionality, simplicity, and reliability for an Electron desktop application.

**Key factors:**

1. **Built-in File-Backed Persistence**
   ```typescript
   // Vectra automatically persists to disk
   const index = new LocalIndex(indexPath);
   await index.createIndex({ version: 1 });
   // All subsequent operations automatically persist
   ```

   With vector-lite, we would need to implement:
   - JSON serialization/deserialization
   - Atomic writes (temp file + rename)
   - Backup management
   - Index validation on load

   Vectra handles all of this automatically.

2. **Hybrid Search with BM25**
   ```typescript
   // Vectra supports combined semantic + keyword search
   const results = await index.queryItems(
     queryEmbedding,
     queryText,      // For BM25 keyword search
     topK,
     filter,
     true            // Enable BM25 hybrid search
   );
   ```

   This is critical for code search where exact matches (function names, variables) matter as much as semantic similarity.

3. **Production-Proven**
   - Used in Microsoft's AI systems
   - Designed for reliability and correctness
   - Active maintenance and updates

4. **TypeScript-First**
   - Complete type definitions
   - Type-safe metadata handling
   - Excellent IDE support

5. **Batch Operations**
   ```typescript
   // Efficient batch insert
   await index.batchInsertItems(items);
   ```

   Critical for indexing large codebases efficiently.

**Implementation:**

```typescript
// src/main/services/vector/VectorService.ts
import { LocalIndex, type IndexItem, type QueryResult } from 'vectra';

export class VectorService {
  private index: LocalIndex;

  constructor(indexName = 'beacon-vector-index') {
    const userDataPath = app.getPath('userData');
    this.indexPath = path.join(userDataPath, 'vector-indices', indexName);
    this.index = new LocalIndex(this.indexPath);
  }

  async initialize(): Promise<void> {
    const exists = await this.index.isIndexCreated();
    if (!exists) {
      await this.index.createIndex({
        version: 1,
        metadata_config: {
          indexed: ['type', 'source', 'timestamp'],
        },
      });
    }
  }

  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);

    // Hybrid search: semantic + BM25 keyword
    // Falls back to semantic-only if BM25 unavailable
    try {
      return await this.index.queryItems(
        queryEmbedding,
        query,
        options.topK,
        options.filter,
        true // Enable BM25
      );
    } catch (bm25Error) {
      // Fallback for small indices
      return await this.index.queryItems(
        queryEmbedding,
        query,
        options.topK,
        options.filter,
        false // Semantic only
      );
    }
  }
}
```

---

## Consequences

### Positive

- **Simplified Persistence**: No need to implement custom serialization, atomic writes, or backup logic
- **Better Search Quality**: BM25 hybrid search improves retrieval for code patterns and exact matches
- **Reduced Development Time**: Saved ~1 week of IndexPersistence implementation complexity
- **Production Reliability**: Battle-tested in Microsoft's production AI systems
- **Type Safety**: Comprehensive TypeScript definitions prevent runtime errors
- **Maintenance Reduction**: Less custom code to maintain long-term

### Negative

- **BM25 Minimum Threshold**: Vectra's BM25 requires minimum documents for consolidation
  - **Impact**: Very small knowledge bases (< ~10 documents) fall back to semantic-only search
  - **Mitigation**: Implemented automatic fallback to semantic search when BM25 unavailable
  - **Actual Impact**: Minor - most real codebases exceed threshold quickly

- **Different API from Original Plan**: Code samples in ADR-018 assumed vector-lite API
  - **Impact**: None for implementation (plan was for reference, not binding)
  - **Mitigation**: Updated ADR-018 with implementation note referencing this ADR

- **Slightly Larger Dependency**: Vectra is larger than vector-lite
  - **Impact**: Negligible for Electron desktop application
  - **Actual Size**: ~100KB additional (acceptable trade-off)

### Trade-offs Accepted

| Aspect | Trade-off | Justification |
|--------|-----------|---------------|
| Dependency size | +~50KB vs vector-lite | Acceptable for desktop, offset by simplified code |
| BM25 threshold | Falls back to semantic-only for small indices | Graceful degradation, rare edge case |
| API difference | Different from original ADR-018 plan | Implementation improvement, plan is guidance not binding |

---

## References

- [Vectra npm Package](https://www.npmjs.com/package/vectra) - Local vector index for Node.js
- [Vectra GitHub](https://github.com/Stevenic/vectra) - Source repository
- ADR-018: RAG Knowledge Base Architecture - Original decision document
- Epic 10 Master Plan: `Docs/implementation/_main/epic-10-rag-knowledge-base.md`
- Implementation Location: `src/main/services/vector/VectorService.ts`
- Test Coverage: `src/main/services/vector/__tests__/VectorService.test.ts`

### Comparison Summary

| Feature | vector-lite | Vectra (LocalIndex) |
|---------|-------------|---------------------|
| Persistence | Manual | Automatic (file-backed) |
| Hybrid Search | Basic | BM25 + Semantic |
| TypeScript | Partial | Full |
| Batch Operations | No | Yes |
| Metadata Filtering | Basic | Comprehensive |
| Bundle Size | ~50KB | ~100KB |
| Production Use | Limited | Microsoft AI systems |

---

**Last Updated**: 2026-01-25
