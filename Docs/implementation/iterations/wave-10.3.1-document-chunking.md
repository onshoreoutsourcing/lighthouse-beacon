# Wave 10.3.1: Document Chunking & Processing

## Wave Overview
- **Wave ID:** Wave-10.3.1
- **Feature:** Feature 10.3 - RAG Pipeline & Context Retrieval
- **Epic:** Epic 10 - RAG Knowledge Base
- **Status:** Completed (January 25, 2026)
- **Commit:** 56f2469
- **Scope:** Implement document chunking with fixed-size chunks and token counting
- **Wave Goal:** Enable documents to be split into searchable, indexable chunks

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Implement DocumentChunker with 500-token chunks and 50-token overlap
2. Create TokenCounter utility for accurate token estimation
3. Integrate chunking into document indexing pipeline
4. Track chunk metadata (line numbers, file path, index)

## User Stories

### User Story 1: Fixed-Size Document Chunking

**As a** developer using Lighthouse Chat IDE
**I want** my documents split into consistent 500-token chunks
**So that** the AI can retrieve relevant context without exceeding limits

**Acceptance Criteria:**
- [ ] Documents chunk into ~500 token segments (with tolerance)
- [ ] Chunks overlap by 50 tokens for context continuity
- [ ] Chunking preserves line boundaries where possible
- [ ] Large documents (10,000+ lines) chunk correctly
- [ ] Small documents (<500 tokens) remain as single chunk
- [ ] Chunking completes in <500ms per document
- [ ] Unit tests verify chunking accuracy

**Priority:** High
**Estimated Hours:** 14
**Objective UCP:** 11

---

### User Story 2: Token Counting Infrastructure

**As a** developer building the RAG pipeline
**I want** accurate token counting for text content
**So that** context budgets can be enforced reliably

**Acceptance Criteria:**
- [ ] TokenCounter estimates tokens within 10% of actual count
- [ ] Counting handles code, prose, and mixed content
- [ ] Performance: <10ms for 10KB of text
- [ ] Library-based counting (gpt-3-encoder or similar)
- [ ] Fallback estimation if library fails
- [ ] Unit tests verify accuracy against known samples

**Priority:** High
**Estimated Hours:** 8
**Objective UCP:** 6

---

### User Story 3: Chunk Metadata Tracking

**As a** developer using Lighthouse Chat IDE
**I want** each chunk to include its source location
**So that** I can navigate to the exact code when reviewing AI responses

**Acceptance Criteria:**
- [ ] Each chunk includes startLine and endLine
- [ ] Each chunk includes filePath and chunkIndex
- [ ] Each chunk includes timestamp of creation
- [ ] Metadata serializes/deserializes correctly (JSON)
- [ ] Metadata available in search results
- [ ] Integration tests verify metadata accuracy

**Priority:** High
**Estimated Hours:** 6
**Objective UCP:** 5

---

### User Story 4: Chunking Pipeline Integration

**As a** developer using Lighthouse Chat IDE
**I want** files automatically chunked when added to knowledge base
**So that** the indexing process is seamless

**Acceptance Criteria:**
- [ ] Files read, chunked, and indexed in single operation
- [ ] Each chunk added to VectorService with embedding
- [ ] Progress events emitted per chunk for large files
- [ ] Errors on individual chunks don't fail entire file
- [ ] IPC handler orchestrates full pipeline
- [ ] Integration tests verify end-to-end flow

**Priority:** High
**Estimated Hours:** 10
**Objective UCP:** 8

---

## Definition of Done

- [ ] All 4 user stories completed with acceptance criteria met
- [ ] Code coverage >=90%
- [ ] Chunking performance verified (<500ms per document)
- [ ] Token counting accuracy verified (within 10%)
- [ ] No linter errors or TypeScript errors
- [ ] Code reviewed and approved
- [ ] JSDoc documentation complete

## Notes

- 500-token chunk size balances context window utilization and granularity
- 50-token overlap ensures important context not lost at boundaries
- Token counting uses gpt-3-encoder library (or tiktoken equivalent)
- Line-aware chunking avoids splitting mid-statement where possible

## Dependencies

- **Prerequisites:** Feature 10.1 (VectorService for storage)
- **Enables:** Wave 10.3.2 (context retrieval), Wave 10.3.3 (prompt augmentation)

---

**Total Stories:** 4
**Total Hours:** 38
**Total Objective UCP:** 30
**Wave Status:** Planning
