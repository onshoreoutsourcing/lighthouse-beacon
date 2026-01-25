# Wave 10.3.2: Context Retrieval & Budget Management

## Wave Overview
- **Wave ID:** Wave-10.3.2
- **Feature:** Feature 10.3 - RAG Pipeline & Context Retrieval
- **Epic:** Epic 10 - RAG Knowledge Base
- **Status:** Completed (January 25, 2026)
- **Commit:** 178fd83
- **Scope:** Implement context retrieval from vector index with relevance filtering and token budget
- **Wave Goal:** Enable retrieval of relevant context chunks within 4000 token budget

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Implement RAGService.retrieveContext method with relevance filtering
2. Create ContextBuilder with 4000 token budget enforcement
3. Implement source attribution tracking for retrieved chunks
4. Establish relevance threshold filtering (minimum 0.3 score)

## User Stories

### User Story 1: Context Retrieval from Vector Index

**As a** developer using Lighthouse Chat IDE
**I want** the system to retrieve relevant code context for my queries
**So that** the AI can provide answers grounded in my actual codebase

**Acceptance Criteria:**
- [ ] retrieveContext accepts query string and returns relevant chunks
- [ ] Top-5 most relevant chunks retrieved by default
- [ ] Results ordered by relevance score (highest first)
- [ ] Retrieval completes in <100ms for typical index
- [ ] Empty result set returned gracefully if no matches
- [ ] Unit tests verify retrieval accuracy with test data

**Priority:** High
**Estimated Hours:** 12
**Objective UCP:** 9

---

### User Story 2: Context Token Budget Management

**As a** developer using Lighthouse Chat IDE
**I want** retrieved context to stay within a 4000 token limit
**So that** the AI prompt doesn't exceed model context windows

**Acceptance Criteria:**
- [ ] ContextBuilder assembles context within 4000 token budget
- [ ] Most relevant chunks prioritized when budget constrained
- [ ] Budget allocation visible in returned metadata
- [ ] Partial chunks excluded (no truncation mid-chunk)
- [ ] Budget configurable for future flexibility
- [ ] Unit tests verify budget enforcement at boundaries

**Priority:** High
**Estimated Hours:** 10
**Objective UCP:** 8

---

### User Story 3: Relevance Filtering

**As a** developer using Lighthouse Chat IDE
**I want** low-relevance chunks filtered out automatically
**So that** only truly relevant context reaches the AI

**Acceptance Criteria:**
- [ ] Minimum relevance threshold of 0.3 applied by default
- [ ] Chunks below threshold excluded from results
- [ ] Threshold configurable via search options
- [ ] Relevance scores included in result metadata
- [ ] Zero results returned if nothing meets threshold
- [ ] Unit tests verify filtering at threshold boundaries

**Priority:** High
**Estimated Hours:** 6
**Objective UCP:** 5

---

### User Story 4: Source Attribution Tracking

**As a** developer using Lighthouse Chat IDE
**I want** each retrieved chunk to include its source information
**So that** I can verify where the AI's context came from

**Acceptance Criteria:**
- [ ] SourceTracker records filePath, startLine, endLine per chunk
- [ ] Relevance score included in source attribution
- [ ] Sources deduplicated if overlapping chunks from same file
- [ ] Source list ordered by relevance
- [ ] Attribution survives serialization for IPC transport
- [ ] Integration tests verify source accuracy

**Priority:** High
**Estimated Hours:** 8
**Objective UCP:** 6

---

## Definition of Done

- [ ] All 4 user stories completed with acceptance criteria met
- [ ] Code coverage >=90%
- [ ] Retrieval performance verified (<100ms)
- [ ] Budget enforcement verified at 4000 tokens
- [ ] No linter errors or TypeScript errors
- [ ] Code reviewed and approved
- [ ] JSDoc documentation complete

## Notes

- 4000 token budget is user decision (balances context vs. response quality)
- Relevance threshold 0.3 based on empirical testing with code search
- Source deduplication uses file path + line range overlap detection
- ContextBuilder outputs formatted text ready for prompt injection

## Dependencies

- **Prerequisites:** Wave 10.3.1 (chunking), Feature 10.1 (vector search)
- **Enables:** Wave 10.3.3 (prompt augmentation), Feature 10.4 (chat integration)

---

**Total Stories:** 4
**Total Hours:** 36
**Total Objective UCP:** 28
**Wave Status:** Planning
