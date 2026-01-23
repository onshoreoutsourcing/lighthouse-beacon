# Feature 10.3: RAG Pipeline & Context Retrieval

## Feature Overview
- **Feature ID:** Feature-10.3
- **Epic:** Epic 10 - RAG Knowledge Base
- **Status:** Planning
- **Duration:** 3 waves, 2-3 weeks
- **Priority:** High (Core RAG functionality)

## Implementation Scope

Feature 10.3 implements the core RAG (Retrieval-Augmented Generation) pipeline for Lighthouse Chat IDE. This includes document chunking, context retrieval from the vector database, prompt augmentation with retrieved context, source attribution tracking, and context budget management.

**Objectives:**
- Integrate rag-lite for document chunking (500 tokens, 50 token overlap)
- Implement context retrieval from VectorService with relevance filtering
- Build prompt construction with injected context (system prompt augmentation)
- Track source attributions for transparency and citations
- Manage context budget (4000 token limit for retrieved context)
- Provide graceful fallback when no relevant context found

## Technical Requirements

### Functional Requirements
- **FR-10.3.1**: Document chunking with fixed-size chunks (500 tokens, 50 token overlap)
- **FR-10.3.2**: Context retrieval using hybrid search (top-5 results, min relevance 0.3)
- **FR-10.3.3**: Prompt augmentation with retrieved context in system prompt
- **FR-10.3.4**: Source attribution tracking (file path, line numbers, relevance score)
- **FR-10.3.5**: Context budget enforcement (4000 tokens maximum)
- **FR-10.3.6**: Token counting for accurate budget management
- **FR-10.3.7**: Graceful handling when no relevant context found (fallback to standard chat)
- **FR-10.3.8**: SOC logging for all RAG operations (compliance tracking)

### Non-Functional Requirements
- **Performance:**
  - Document chunking: < 500ms per document
  - Context retrieval: < 100ms per query
  - Prompt construction: < 50ms
  - Full RAG pipeline (retrieve + augment): < 200ms
  - No blocking of AI streaming

- **Quality:**
  - Context relevance: Retrieved chunks must be relevant to query
  - Token counting accuracy: Within 10% of actual token usage
  - Source attribution accuracy: 100% correct file paths and line numbers
  - Chunking quality: No mid-sentence splits where avoidable

- **Reliability:**
  - Graceful degradation when retrieval fails
  - No crashes on malformed documents
  - Consistent behavior across document types
  - Idempotent operations (same query = same results)

- **Scalability:**
  - Support documents up to 10,000 lines
  - Handle chunk counts up to 50,000 total
  - Efficient retrieval with large indexes

### Technical Constraints
- Must use rag-lite library for chunking (established pattern)
- Must integrate with Feature 10.1 VectorService (dependency)
- Must respect 4000 token context budget (user decision)
- Must track sources for all retrieved context (transparency requirement)
- Must integrate with existing AIService without breaking multi-provider support

## Dependencies

**Prerequisites (must complete before this Feature):**
- ✅ Feature 10.1: Vector Service & Embedding Infrastructure (VectorService.search required)
- ✅ Epic 2: AI Integration (AIService for prompt augmentation)
- ✅ Epic 3: File Operations (FileSystemService for document reading)

**Enables (this Feature enables):**
- Feature 10.4: Chat Integration & Source Citations (provides RAG backend)
- Context-aware AI responses for all AI providers

**External Dependencies:**
- **rag-lite** (v1.x): Document chunking utilities
- **Feature 10.1 VectorService**: Hybrid search for context retrieval
- **AIService**: Prompt augmentation and message sending
- **FileSystemService**: Reading documents for chunking
- **Token counting library**: gpt-3-encoder or similar

## Logical Unit Tests

Unit tests will call RAGService API methods and verify chunking, retrieval, and prompt construction:

**Test Cases:**
1. **Test: Document Chunking**
   - Provide document with 1500 tokens
   - Call `documentChunker.chunk(content, { chunkSize: 500, overlap: 50 })`
   - Verify returns 3 chunks
   - Verify each chunk ≈ 500 tokens
   - Verify 50 token overlap between chunks
   - Verify line number ranges correct

2. **Test: Context Retrieval**
   - Index 10 documents with known content
   - Call `ragService.retrieveContext('how to handle errors?')`
   - Verify returns relevant chunks (contains error handling code)
   - Verify irrelevant chunks excluded (based on relevance threshold)
   - Verify results include source attribution

3. **Test: Context Budget Enforcement**
   - Retrieve context that exceeds 4000 tokens
   - Call `contextBuilder.buildContext(searchResults, { maxTokens: 4000 })`
   - Verify total tokens ≤ 4000
   - Verify most relevant chunks prioritized
   - Verify less relevant chunks truncated

4. **Test: Prompt Augmentation**
   - Retrieve context with 3 sources
   - Call `ragService.buildAugmentedPrompt(userMessage, context)`
   - Verify system prompt includes context section
   - Verify context formatted correctly
   - Verify sources tracked in metadata

5. **Test: Source Attribution**
   - Retrieve context from 5 chunks across 3 files
   - Verify each chunk has correct file path
   - Verify each chunk has correct start/end line numbers
   - Verify relevance scores included

6. **Test: Graceful Fallback**
   - Query with no relevant results (threshold not met)
   - Call `ragService.retrieveContext('irrelevant query')`
   - Verify returns empty context
   - Verify no error thrown
   - Verify AI call proceeds without augmentation

7. **Test: SOC Logging**
   - Perform RAG retrieval operation
   - Verify SOC log entry created
   - Verify log includes: query, sources count, tokens used, timestamp

8. **Test: Token Counting**
   - Provide text samples of known token counts
   - Verify `tokenCounter.count(text)` returns accurate counts (within 10%)

9. **Test: Chunk Overlap**
   - Create chunks with 50 token overlap
   - Verify last 50 tokens of chunk N match first 50 tokens of chunk N+1
   - Verify overlap maintains context continuity

10. **Test: Multi-Document Processing**
    - Process 3 documents in sequence
    - Verify chunks created for all documents
    - Verify chunk IDs unique across documents
    - Verify metadata correct for each document

## Testing Strategy and Acceptance Criteria

### Testing Strategy
- **Unit Tests:**
  - `RAGService.test.ts`: All public API methods
  - `DocumentChunker.test.ts`: Chunking algorithm, overlap logic
  - `ContextBuilder.test.ts`: Context assembly, budget enforcement
  - `SourceTracker.test.ts`: Attribution tracking, metadata

- **Integration Tests:**
  - End-to-end RAG flow: Index document → Chunk → Retrieve → Augment prompt
  - Cross-provider test: RAG works with Claude, GPT, Gemini, Ollama
  - Large document test: 10,000 line document chunks correctly
  - Budget stress test: Retrieval with many results respects token limit

- **Quality Tests:**
  - Relevance test: Retrieved chunks contain query terms
  - Attribution test: All sources traceable to actual files
  - Token accuracy test: Budget enforcement within 10% margin

- **Performance Tests:**
  - Benchmark chunking time (target < 500ms per doc)
  - Benchmark retrieval time (target < 100ms per query)
  - Benchmark full pipeline (target < 200ms)

### Acceptance Criteria
- [ ] Document chunking works with 500 token chunks, 50 token overlap
- [ ] Chunks include accurate line number ranges
- [ ] Context retrieval returns top-5 relevant chunks
- [ ] Relevance threshold (0.3) filters out irrelevant results
- [ ] Context budget enforced at 4000 tokens maximum
- [ ] Token counting accurate within 10%
- [ ] Prompt augmentation includes context in system prompt
- [ ] Source attribution includes file paths and line numbers
- [ ] Graceful fallback when no relevant context (no crash, proceeds with standard chat)
- [ ] SOC logging captures all RAG operations
- [ ] All unit tests passing (coverage ≥ 90%)
- [ ] All integration tests passing
- [ ] Performance benchmarks meet targets
- [ ] Quality tests demonstrate relevance
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Integration Points

### Integration with Other Features
- **Feature 10.1 (Vector Service):** Uses VectorService.search for context retrieval
- **Feature 10.2 (Knowledge Base UI):** Provides backend for RAG operations triggered by UI
- **Feature 10.4 (Chat Integration):** Provides RAG pipeline for chat messages

### Integration with Other Epics
- **Epic 2 (AI Integration):** Augments AIService with RAG context
- **Epic 3 (File Operations):** Uses FileSystemService to read documents for chunking
- **Epic 7 (SOC Logging):** Logs all RAG operations for compliance

### External Integrations
- **rag-lite**: Document chunking library
- **gpt-3-encoder** (or similar): Token counting
- **VectorService**: Hybrid search backend
- **AIService**: Prompt delivery to AI providers

## Implementation Phases

### Wave 10.3.1: Document Chunking & Processing
- Install and configure rag-lite library
- Implement DocumentChunker with fixed-size chunking
- Add token counting utility
- Integrate with VectorService for chunk indexing
- Write unit tests for chunking
- **Deliverables:** DocumentChunker.ts, token counter, tests

### Wave 10.3.2: Context Retrieval & Budget Management
- Implement RAGService.retrieveContext method
- Create ContextBuilder with budget enforcement
- Add relevance filtering logic
- Implement source attribution tracking
- Write unit tests for retrieval and budget
- **Deliverables:** RAGService.ts (partial), ContextBuilder.ts, SourceTracker.ts, tests

### Wave 10.3.3: Prompt Augmentation & SOC Integration
- Implement RAGService.buildAugmentedPrompt method
- Integrate with AIService for prompt delivery
- Add SOC logging for RAG operations
- Implement graceful fallback logic
- Write integration tests for full pipeline
- **Deliverables:** RAGService.ts (complete), SOC integration, tests

## Architecture and Design

### Component Architecture

```
src/main/services/rag/
├── RAGService.ts              # Main RAG pipeline orchestrator
├── DocumentChunker.ts         # Fixed-size chunking with overlap
├── ContextBuilder.ts          # Context assembly with budget
├── SourceTracker.ts           # Attribution tracking
└── TokenCounter.ts            # Token counting utility

src/main/ipc/
└── rag-handlers.ts            # IPC handlers for RAG operations

src/shared/types/
└── rag.types.ts               # RAG-specific TypeScript interfaces
```

**RAGService Class:**

```typescript
export class RAGService {
  private readonly MAX_CONTEXT_TOKENS = 4000;
  private readonly TOP_K_RESULTS = 5;
  private readonly MIN_RELEVANCE_SCORE = 0.3;

  constructor(
    private vectorService: VectorService,
    private documentChunker: DocumentChunker,
    private contextBuilder: ContextBuilder,
    private sourceTracker: SourceTracker
  ) {}

  async processDocument(filePath: string): Promise<ProcessResult>;
  async retrieveContext(query: string): Promise<RetrievedContext>;
  buildAugmentedPrompt(
    userMessage: string,
    context: RetrievedContext,
    systemPrompt?: string
  ): AugmentedPrompt;
}
```

**DocumentChunker Class:**

```typescript
export class DocumentChunker {
  private readonly AVG_CHARS_PER_TOKEN = 4;

  chunk(content: string, options: ChunkOptions): Chunk[];
  private estimateTokens(text: string): number;
  private splitAtSentenceBoundary(text: string, targetTokens: number): string;
}
```

**ContextBuilder Class:**

```typescript
export class ContextBuilder {
  constructor(private tokenCounter: TokenCounter) {}

  buildContext(
    searchResults: SearchResult[],
    options: ContextOptions
  ): BuiltContext;
  private prioritizeChunks(results: SearchResult[]): SearchResult[];
  private formatContext(chunks: Chunk[]): string;
}
```

### Data Model

**Chunk:**
```typescript
interface Chunk {
  text: string;
  startLine: number;
  endLine: number;
  index: number;
  tokenCount: number;
  metadata: {
    filePath: string;
    timestamp: number;
    [key: string]: unknown;
  };
}
```

**RetrievedContext:**
```typescript
interface RetrievedContext {
  chunks: Chunk[];
  sources: SourceAttribution[];
  contextText: string;
  tokensUsed: number;
}
```

**SourceAttribution:**
```typescript
interface SourceAttribution {
  filePath: string;
  relativePath: string;
  startLine: number;
  endLine: number;
  relevanceScore: number;
  chunkText: string;
}
```

**AugmentedPrompt:**
```typescript
interface AugmentedPrompt {
  systemPrompt: string;
  userMessage: string;
  sources: SourceAttribution[];
  metadata: {
    ragEnabled: true;
    chunksRetrieved: number;
    tokensUsed: number;
  };
}
```

**ChunkOptions:**
```typescript
interface ChunkOptions {
  chunkSize: number;        // 500 tokens
  overlap: number;          // 50 tokens
  metadata: Record<string, unknown>;
}
```

**ContextOptions:**
```typescript
interface ContextOptions {
  maxTokens: number;        // 4000 tokens
  prioritizationStrategy?: 'relevance' | 'recency' | 'diversity';
}
```

### API Design

**RAG IPC Handlers:**

```typescript
// src/main/ipc/rag-handlers.ts
ipcMain.handle('rag:process-document', async (event, filePath: string) => {
  return await ragService.processDocument(filePath);
});

ipcMain.handle('rag:retrieve-context', async (event, query: string) => {
  return await ragService.retrieveContext(query);
});

ipcMain.handle('rag:build-augmented-prompt', async (event, params) => {
  return ragService.buildAugmentedPrompt(
    params.userMessage,
    params.context,
    params.systemPrompt
  );
});
```

**Integration with AIService:**

```typescript
// src/main/services/ai/AIService.ts (extended)
export class AIService {
  async sendMessageWithRAG(
    message: string,
    ragContext: RetrievedContext,
    options?: AIOptions
  ): Promise<AIResponse> {
    // Build augmented prompt
    const augmented = this.ragService.buildAugmentedPrompt(
      message,
      ragContext,
      options?.systemPrompt
    );

    // Send to AI provider with augmented system prompt
    const response = await this.sendMessage(
      augmented.userMessage,
      {
        ...options,
        systemPrompt: augmented.systemPrompt
      }
    );

    // Log to SOC
    await this.socLogger.logRAGOperation({
      query: message,
      sourcesUsed: augmented.sources.length,
      tokensUsed: augmented.metadata.tokensUsed,
      provider: options?.provider
    });

    // Return response with source metadata
    return {
      ...response,
      sources: augmented.sources,
      ragMetadata: augmented.metadata
    };
  }
}
```

### Chunking Algorithm

**Fixed-Size Chunking with Overlap:**

```typescript
export class DocumentChunker {
  chunk(content: string, options: ChunkOptions): Chunk[] {
    const { chunkSize, overlap, metadata } = options;
    const lines = content.split('\n');
    const chunks: Chunk[] = [];

    let currentChunk: string[] = [];
    let currentTokens = 0;
    let startLine = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineTokens = this.estimateTokens(line);

      // Check if adding this line exceeds chunk size
      if (currentTokens + lineTokens > chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          text: currentChunk.join('\n'),
          startLine,
          endLine: startLine + currentChunk.length - 1,
          index: chunks.length,
          tokenCount: currentTokens,
          metadata
        });

        // Start new chunk with overlap
        const overlapLines = Math.floor(overlap / (currentTokens / currentChunk.length));
        currentChunk = currentChunk.slice(-overlapLines);
        startLine = i - overlapLines + 1;
        currentTokens = this.estimateTokens(currentChunk.join('\n'));
      }

      currentChunk.push(line);
      currentTokens += lineTokens;
    }

    // Save final chunk
    if (currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.join('\n'),
        startLine,
        endLine: startLine + currentChunk.length - 1,
        index: chunks.length,
        tokenCount: currentTokens,
        metadata
      });
    }

    return chunks;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    // For production, use actual tokenizer (gpt-3-encoder)
    return Math.ceil(text.length / this.AVG_CHARS_PER_TOKEN);
  }
}
```

## Security Considerations

- **Path Validation**: All file paths validated before reading (ADR-011 PathValidator)
- **SOC Logging**: All RAG operations logged for audit trail
- **No Data Leakage**: Retrieved context never includes sensitive info (e.g., .env files excluded from indexing)
- **Context Budget**: Prevents excessive token usage (cost control)
- **Error Handling**: Graceful handling of malformed documents, invalid queries
- **Privacy**: All processing local, no external API calls

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Retrieved context not relevant to query | High | Medium | Tune relevance threshold; test with real queries; provide user feedback mechanism |
| Token counting inaccurate | Medium | Medium | Use established tokenizer library (gpt-3-encoder); validate accuracy; add safety margin |
| Context budget too restrictive | Medium | Low | Configurable budget (future enhancement); prioritize most relevant chunks |
| Chunking splits important code | Medium | Low | Use intelligent split points (sentence boundaries, code blocks); overlap ensures context |
| Large documents slow to chunk | Medium | Low | Process in background; show progress; implement caching |
| RAG overhead delays AI responses | High | Medium | Optimize retrieval (< 100ms); parallel processing where possible; measure latency |

## Definition of Done

- [ ] Document chunking implemented with 500 token chunks, 50 token overlap
- [ ] Token counting accurate within 10%
- [ ] Context retrieval returns top-5 relevant chunks
- [ ] Relevance threshold (0.3) filters irrelevant results
- [ ] Context budget enforced at 4000 tokens
- [ ] ContextBuilder prioritizes most relevant chunks
- [ ] Prompt augmentation includes context in system prompt
- [ ] Source attribution tracks file paths and line numbers correctly
- [ ] Graceful fallback when no relevant context
- [ ] SOC logging captures all RAG operations
- [ ] All unit tests written and passing (coverage ≥ 90%)
- [ ] All integration tests passing
- [ ] Performance benchmarks meet targets (chunking < 500ms, retrieval < 100ms)
- [ ] Quality tests demonstrate relevance
- [ ] Cross-provider testing passed (Claude, GPT, Gemini, Ollama)
- [ ] Code reviewed and approved
- [ ] Documentation updated (JSDoc, architecture docs)

## Related Documentation

- Epic Plan: Docs/implementation/_main/epic-10-rag-knowledge-base.md
- Feature 10.1: Docs/implementation/_main/feature-10.1-vector-service-embedding-infrastructure.md
- Feature 10.2: Docs/implementation/_main/feature-10.2-knowledge-base-ui.md
- Architecture: Docs/architecture/_main/04-Architecture.md
- ADR-018: RAG Knowledge Base Architecture

## Architecture Decision Records (ADRs)

- **ADR-018**: RAG Knowledge Base Architecture (chunking strategy, context budget, prompt augmentation)
- **ADR-006**: AI Integration (multi-provider support, prompt handling)
- **ADR-001**: Electron Architecture (services in main process, IPC patterns)

---

**Feature Plan Version:** 1.0
**Last Updated:** January 23, 2026
**Status:** Ready for Wave Planning
