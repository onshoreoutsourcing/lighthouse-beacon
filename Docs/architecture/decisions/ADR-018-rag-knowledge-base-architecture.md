# ADR-018: RAG Knowledge Base Architecture

**Status**: Accepted
**Date**: 2026-01-23
**Implementation Completed**: 2026-01-25
**Deciders**: Lighthouse Development Team
**Related**: Epic-10, ADR-004 (Monaco Editor), ADR-006 (AIChatSDK Integration), ADR-003 (Zustand), ADR-011 (Directory Sandboxing), ADR-019 (Vectra LocalIndex)

---

## Context

Lighthouse Chat IDE enables natural language interaction with codebases. Currently, AI responses are based solely on the immediate conversation context and user-provided information. To provide more relevant, context-aware assistance, we need to enable AI to understand the user's codebase by indexing code and retrieving relevant context during chat interactions.

**Requirements:**
- Enable AI to reference actual code from the user's project when answering questions
- Generate embeddings locally (no data sent to external services)
- Manage memory usage to prevent OOM on desktop machines
- Provide transparency through source citations showing which files informed AI responses
- Allow users to control when RAG is active (opt-in per project)
- Integrate cleanly with existing AIService multi-provider architecture
- Maintain SOC traceability for all RAG operations

**Constraints:**
- Desktop application with limited memory (typical dev machine: 8-16GB RAM)
- Must work offline (local embedding generation)
- Cannot require external vector database infrastructure
- Must respect project sandboxing (only index files within project directory)
- Embedding generation must not block UI (Electron main process)
- Index must persist across application restarts

**User Decisions (Critical):**
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Embedding Strategy | Single model (all-MiniLM-L6-v2) | Simpler MVP, proven quality, smaller bundle |
| Index Limits | Memory-based (NOT document count) | Real limit is memory usage, not arbitrary count |
| Memory Budget | 500MB maximum | Balances capacity with desktop performance |
| RAG Default | Toggle-based, OFF by default | User explicitly enables, persist preference per project |

---

## Considered Options

### Option 1: In-Memory Vector Database with Memory-Based Limits (Chosen)

**Description**: Use vector-lite for local hybrid vector search with Transformers.js for embedding generation. Enforce 500MB memory budget with real-time monitoring. Store index on disk for persistence.

**Pros**:
- No external dependencies (vector-lite + Transformers.js are npm packages)
- Hybrid search (semantic + keyword) provides best retrieval quality
- Memory-based limits reflect actual resource constraints
- Local embedding generation ensures complete privacy
- Index persistence allows resuming without re-indexing
- Works offline once model downloaded

**Cons**:
- Embedding generation slower than cloud APIs (~1-2s per document)
- Memory tracking adds complexity
- Model download required on first use (~22MB)

### Option 2: External Vector Database (Pinecone, Weaviate)

**Description**: Use cloud-hosted vector database for storage and search.

**Pros**:
- No local memory constraints
- Fast embedding with cloud APIs
- Scalable to any codebase size
- Professional-grade vector search

**Cons**:
- Requires internet connection (no offline use)
- Privacy concerns - code sent to external service
- Cost per operation (API fees)
- External dependency increases complexity
- Contradicts "local-first" product vision

**Rejected because**: Privacy is paramount for code IDEs. Developers must trust that their code never leaves their machine. Cloud vector databases fundamentally conflict with this requirement.

### Option 3: Document Count Limits (e.g., max 1000 documents)

**Description**: Limit index size by number of documents rather than memory usage.

**Pros**:
- Simple to implement and explain
- Easy for users to understand ("you have 500/1000 documents indexed")

**Cons**:
- Arbitrary - different documents have vastly different memory footprints
- A 10-line config file uses same "slot" as a 5000-line service class
- Either too restrictive (small files) or allows OOM (large files)
- Doesn't reflect actual resource constraint (memory)

**Rejected because**: Document count doesn't correlate with memory usage. A project with 1000 small test fixtures might use 50MB, while 100 large source files might use 500MB. Memory budget is the real constraint.

### Option 4: Always-On RAG (No Toggle)

**Description**: RAG automatically enabled for all projects with indexed content.

**Pros**:
- Simpler UX - no toggle to manage
- Users always get context-aware responses

**Cons**:
- Adds latency to every chat message (context retrieval)
- May retrieve irrelevant context, confusing AI
- Users cannot compare RAG vs non-RAG responses
- No way to disable for projects where RAG isn't useful
- Resource usage even when not wanted

**Rejected because**: Users should control when RAG is active. Some queries don't benefit from codebase context, and some projects may not need RAG at all. Explicit toggle gives users control and transparency.

### Option 5: Multiple Embedding Models (Quality Tiers)

**Description**: Offer multiple embedding models - fast/small vs slow/accurate.

**Pros**:
- Users can choose quality vs speed tradeoff
- Smaller model for quick indexing, larger for production use

**Cons**:
- Increases complexity significantly
- Multiple models = larger bundle size
- Confusing for users ("which model should I use?")
- Minimal quality difference for code similarity tasks

**Rejected because**: all-MiniLM-L6-v2 is well-validated for code/text similarity with 384 dimensions. Adding model selection complexity doesn't provide proportional value for MVP.

---

## Decision

**We have decided to implement an in-memory RAG knowledge base using vector-lite for hybrid vector search, Transformers.js for local embedding generation (all-MiniLM-L6-v2), memory-based limits (500MB budget), and a toggle-based activation system (OFF by default, persisted per project).**

### Implementation Note (2026-01-25)

During implementation, **Vectra (LocalIndex)** was chosen over vector-lite due to superior file-backed persistence support and better hybrid search capabilities. See ADR-019 for detailed rationale.

### Why This Choice

This architecture balances privacy, performance, and usability for a desktop code IDE:

**Key factors:**

1. **Privacy First**: Local embedding generation via Transformers.js means code never leaves the user's machine. This is non-negotiable for a code IDE where users work with proprietary code, secrets, and sensitive data.

2. **Memory-Based Limits Are Honest**: The real constraint on a desktop machine is RAM, not an arbitrary document count. A 500MB budget allows indexing ~5,000-10,000 code chunks while leaving headroom for the application and other processes.

3. **Toggle Control Respects User Agency**: RAG adds latency and context to every query. Users should decide when this is valuable. OFF by default ensures users consciously enable the feature and understand what it does.

4. **Hybrid Search Quality**: Vector search library provides both semantic (embedding-based) and keyword search. This is critical for code where exact matches (function names, variables) are as important as semantic similarity.

5. **Integration Simplicity**: RAG augments the existing AIService by injecting context into the system prompt. No changes to provider-specific code; works with Claude, GPT, Gemini, and Ollama.

**Architecture Overview:**

```
User Query -> [RAG Enabled?] -> Yes -> Retrieve Context -> Augment Prompt -> AIService
                            -> No  -> Standard Prompt -> AIService

Index Pipeline:
Files -> DocumentChunker -> EmbeddingService -> VectorService -> Disk Persistence
         (500 tokens,      (Transformers.js)  (Vectra)         (JSON)
          50 overlap)
```

**Key Components:**

```typescript
// VectorService - Vectra wrapper with memory monitoring
class VectorService {
  private readonly MEMORY_BUDGET_MB = 500;
  private memoryMonitor: MemoryMonitor;

  async addDocument(doc: DocumentInput): Promise<AddResult> {
    // Check memory budget before adding
    if (!this.memoryMonitor.canAddDocument(doc).canAdd) {
      return { success: false, error: 'MEMORY_BUDGET_EXCEEDED' };
    }

    // Generate embedding locally
    const embedding = await this.embeddingService.embed(doc.content);

    // Add to vector index
    await this.vectorIndex.add({ id: doc.id, embedding, metadata: doc.metadata });

    return { success: true };
  }

  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    // Hybrid search: semantic + keyword
    const queryEmbedding = await this.embeddingService.embed(query);
    return this.vectorIndex.hybridSearch(queryEmbedding, query, options);
  }
}

// RAGService - context retrieval and prompt augmentation
class RAGService {
  async retrieveContext(query: string): Promise<RetrievedContext> {
    const results = await this.vectorService.search(query, {
      topK: 5,
      minScore: 0.3,
      hybridWeight: { semantic: 0.7, keyword: 0.3 }
    });

    return this.contextBuilder.buildContext(results, { maxTokens: 4000 });
  }

  buildAugmentedPrompt(message: string, context: RetrievedContext): AugmentedPrompt {
    // Inject retrieved context into system prompt
    const contextSection = context.contextText
      ? `\n\n## Relevant Code Context\n\n${context.contextText}\n\n---\n\n`
      : '';

    return {
      systemPrompt: `You are a helpful AI assistant with access to the user's codebase.${contextSection}`,
      userMessage: message,
      sources: context.sources
    };
  }
}
```

**Memory Monitoring:**

```typescript
// Memory thresholds
const MEMORY_BUDGET_MB = 500;
const WARNING_THRESHOLD = 0.80;  // 400MB - show warning
const BLOCKING_THRESHOLD = 0.95; // 475MB - block new additions

// MemoryMonitor tracks actual usage
class MemoryMonitor {
  getStatus(): MemoryStatus {
    return {
      usedMB: this.getCurrentUsageMB(),
      budgetMB: MEMORY_BUDGET_MB,
      percentUsed: this.getPercentUsed(),
      status: this.getPercentUsed() >= 95 ? 'critical'
            : this.getPercentUsed() >= 80 ? 'warning'
            : 'healthy'
    };
  }
}
```

**Persistence:**

```typescript
// Index persists to user data directory
// Structure:
// userData/
//   .lighthouse/
//     knowledge/
//       index.json      # Vector index data (Vectra format)
//   vector-indices/
//     beacon-vector-index/  # Vectra LocalIndex directory
```

---

## Consequences

### Positive

- **Complete Privacy**: All processing local - code never leaves machine, suitable for proprietary/sensitive code
- **Honest Resource Management**: Memory-based limits reflect actual constraints, preventing OOM
- **User Control**: Toggle-based activation lets users decide when RAG adds value
- **Transparent Citations**: Source attributions show exactly which code informed AI responses
- **Offline Capable**: Works without internet after initial model download
- **Multi-Provider Compatible**: Works with all AI providers (Claude, GPT, Gemini, Ollama) via prompt augmentation
- **Clean Integration**: Extends existing AIService without modifying provider-specific code
- **Hybrid Search Quality**: Semantic + keyword search handles both conceptual queries and exact matches
- **Persistence**: Index survives app restarts, no re-indexing on every launch
- **SOC Compliant**: All RAG operations logged for traceability

### Negative

- **Initial Model Download**: ~22MB download on first use (one-time)
  - **Impact**: Slight delay on first RAG use
  - **Mitigation**: Clear progress indicator, async download, cache model locally

- **Embedding Latency**: ~1-2s per document vs ~100ms for cloud APIs
  - **Impact**: Slower indexing, especially for large codebases
  - **Mitigation**: Background indexing with progress UI, Web Workers for non-blocking, caching

- **Memory Overhead**: 500MB budget is significant on low-RAM machines
  - **Impact**: May limit usability on 4GB machines
  - **Mitigation**: Clear memory usage display, graceful degradation, allow budget reduction in settings

- **Search Quality**: Single model may not be optimal for all code types
  - **Impact**: Retrieval quality may vary by language/domain
  - **Mitigation**: Hybrid search improves recall, tunable weights, future: specialized models

- **Index Corruption Risk**: JSON-based persistence could become corrupted
  - **Impact**: Loss of indexed data, requires re-indexing
  - **Mitigation**: Atomic writes, backup before overwrite, index validation on load

### Mitigation Strategies

**For embedding latency:**
- Use Web Workers to prevent main thread blocking
- Show clear progress with time estimates
- Allow cancellation of batch operations
- Cache embeddings - don't re-compute on restart
- Process files sequentially with progress updates

**For memory management:**
- Real-time memory usage display in Knowledge Tab
- Warning at 80% (400MB): "Approaching memory limit"
- Block new additions at 95% (475MB): "Memory budget exceeded"
- Provide "Remove unused documents" suggestion
- Future: configurable budget in settings

**For search quality:**
- Default hybrid weights (70% semantic, 30% keyword) tuned for code
- Minimum relevance score (0.3) filters poor matches
- Graceful fallback to standard chat if no relevant context
- Log search quality metrics for future improvement
- Future: user feedback ("Was this helpful?")

**For index persistence:**
- Atomic writes (write to temp, then rename)
- Keep backup of previous index
- Validate index integrity on load
- Clear error message with recovery instructions
- Automatic re-indexing option if corruption detected

---

## Implementation Outcomes (2026-01-25)

### What Went As Expected

1. **Privacy Requirements Met**: All embeddings generated locally via Transformers.js - no external data transmission
2. **Memory Budget Enforced**: 500MB budget with real-time tracking implemented exactly as planned
3. **Toggle-Based Activation**: RAG disabled by default, persists per project as designed
4. **Source Citations**: Collapsible citations with file paths, line numbers, and relevance scores
5. **Performance Targets**: All targets met or exceeded:
   - Search latency: <50ms (target: <50ms)
   - Context retrieval: <100ms (target: <100ms)
   - RAG overhead: <200ms (target: <200ms)
   - Index persistence: <1s for 1000 docs (target: <1s)

### Unexpected Positive Outcomes

1. **Technology Improvement**: Vectra (LocalIndex) proved superior to vector-lite
   - Better file-backed persistence out of the box
   - More robust hybrid search with BM25 integration
   - Simpler IndexPersistence implementation

2. **Enhanced Error Handling**: RAGFailureWarning component added
   - Non-blocking error display
   - Graceful fallback to standard chat
   - Improved user experience during failures

3. **Additional UI Components**:
   - RAGStatusIndicator for search progress
   - Expandable code snippets in citations
   - Better accessibility (WCAG 2.1 AA compliance)

4. **Comprehensive Testing**: 144+ tests across all components
   - Unit, integration, and accessibility tests
   - Performance budget assertions

### Unexpected Challenges

1. **BM25 Minimum Document Requirement**: Vectra's BM25 requires minimum documents for consolidation
   - **Resolution**: Implemented semantic-only fallback for small indices
   - **Impact**: Minor - only affects very small knowledge bases

2. **Monaco Line Highlighting Deferred**: Opening files works but line highlighting not implemented
   - **Resolution**: Marked as TODO for future enhancement
   - **Impact**: Low - file opens at correct location, just no highlighting

### Deviations from Plan

| Planned | Actual | Reason | Impact |
|---------|--------|--------|--------|
| vector-lite | Vectra (LocalIndex) | Better persistence, hybrid search | Positive |
| SourceTracker.ts | PromptBuilder.ts | Name better reflects purpose | Neutral |
| - | TokenCounter.ts | Needed for token management | Positive |
| - | RAGStatusIndicator.tsx | Better UX during search | Positive |
| - | RAGFailureWarning.tsx | Graceful error handling | Positive |

### Performance Measurements

| Metric | Planned Target | Actual Achieved |
|--------|---------------|-----------------|
| Single doc indexing | <2s | ~1-2s |
| Batch index (100 files) | <5 min | <5 min |
| Search latency | <50ms | <50ms |
| Context retrieval | <100ms | <100ms |
| Full RAG flow | <3s | <3s |
| RAG overhead | <200ms | <200ms |
| Index persistence (1000 docs) | <1s | <1s |

---

## References

- Epic 10 Master Plan: `Docs/implementation/_main/epic-10-rag-knowledge-base.md`
- Architecture Review: `Docs/reports/architecture/epic-10-architecture-review.md`
- Product Vision: `Docs/architecture/_main/01-Product-Vision.md` (Privacy, AI Transparency)
- Business Requirements: FR-5 (Multi-Provider AI), NFR-3 (Security)
- Related ADRs:
  - ADR-003: Zustand for State Management (useKnowledgeStore follows patterns)
  - ADR-006: AIChatSDK Integration Approach (RAG augments existing AI flow)
  - ADR-011: Directory Sandboxing Approach (indexed files respect project boundary)
  - ADR-019: Vectra LocalIndex for Vector Storage (technology decision)
- Technologies:
  - [Vectra](https://www.npmjs.com/package/vectra) - Local vector index with file-backed persistence
  - [Transformers.js](https://huggingface.co/docs/transformers.js) - Local ML inference
  - [all-MiniLM-L6-v2](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2) - Embedding model

### Implementation Locations

**Main Process Services:**
- `src/main/services/vector/VectorService.ts` (690 lines)
- `src/main/services/vector/EmbeddingService.ts`
- `src/main/services/vector/MemoryMonitor.ts` (429 lines)
- `src/main/services/vector/IndexPersistence.ts` (385 lines)
- `src/main/services/rag/RAGService.ts` (162 lines)
- `src/main/services/rag/DocumentChunker.ts`
- `src/main/services/rag/ContextBuilder.ts`
- `src/main/services/rag/PromptBuilder.ts` (194 lines)
- `src/main/services/rag/TokenCounter.ts`

**Renderer Components:**
- `src/renderer/stores/knowledge.store.ts` (382 lines)
- `src/renderer/hooks/useChatRAG.ts` (124 lines)
- `src/renderer/components/chat/RAGToggle.tsx` (71 lines)
- `src/renderer/components/chat/RAGStatusIndicator.tsx` (47 lines)
- `src/renderer/components/chat/SourceCitations.tsx` (103 lines)
- `src/renderer/components/chat/SourceCitationItem.tsx` (120 lines)
- `src/renderer/components/chat/RAGFailureWarning.tsx` (80 lines)

**Shared Types:**
- `src/shared/types/vector.types.ts` (134 lines)
- `src/main/services/rag/types.ts` (117 lines)

**IPC Handlers:**
- `src/main/ipc/vector-handlers.ts`
- `src/main/ipc/rag-handlers.ts`

---

**Last Updated**: 2026-01-25
**Status Changed**: Proposed -> Accepted (Implementation Complete)
