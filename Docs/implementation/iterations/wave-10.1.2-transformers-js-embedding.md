# Wave 10.1.2: Transformers.js Embedding Generation

## Wave Overview
- **Wave ID:** Wave-10.1.2
- **Feature:** Feature 10.1 - Vector Service & Embedding Infrastructure
- **Epic:** Epic 10 - RAG Knowledge Base
- **Status:** Planning
- **Scope:** Integrate Transformers.js for local embedding generation with all-MiniLM-L6-v2 model
- **Wave Goal:** Enable local text-to-embedding conversion for document indexing

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Integrate Transformers.js library with Electron compatibility
2. Implement EmbeddingService for local model inference
3. Connect EmbeddingService to VectorService for automatic embedding generation
4. Establish model downloading and caching infrastructure

## User Stories

### User Story 1: Local Embedding Generation

**As a** developer using Lighthouse Chat IDE
**I want** text documents to be converted into vector embeddings locally
**So that** my code stays private and I can search semantically without external API calls

**Acceptance Criteria:**
- [ ] Transformers.js library installed and configured for Electron
- [ ] EmbeddingService generates 384-dimensional embeddings from text
- [ ] Embedding generation completes in <2 seconds per document
- [ ] Embeddings produce valid float arrays in range [-1, 1]
- [ ] Service operates entirely offline after initial model download
- [ ] Unit tests verify embedding quality and consistency

**Priority:** High
**Estimated Hours:** 16
**Objective UCP:** 12

---

### User Story 2: Model Management Infrastructure

**As a** developer using Lighthouse Chat IDE
**I want** the embedding model downloaded automatically and cached locally
**So that** I don't need to manage model files manually

**Acceptance Criteria:**
- [ ] all-MiniLM-L6-v2 model downloads on first use (~22MB)
- [ ] Model cached in Electron userData directory
- [ ] Download progress reported via events
- [ ] Integrity check validates downloaded model
- [ ] Graceful handling of download failures with retry
- [ ] Model loads from cache on subsequent starts (<1s load time)

**Priority:** High
**Estimated Hours:** 12
**Objective UCP:** 9

---

### User Story 3: VectorService Integration

**As a** developer using Lighthouse Chat IDE
**I want** embeddings generated automatically when adding documents
**So that** I can simply add text and have it become searchable

**Acceptance Criteria:**
- [ ] VectorService.addDocument automatically generates embeddings
- [ ] Query embeddings generated for search operations
- [ ] EmbeddingService initialization happens lazily on first use
- [ ] Service reports ready state before accepting documents
- [ ] Integration tests verify end-to-end add-search flow

**Priority:** High
**Estimated Hours:** 8
**Objective UCP:** 6

---

### User Story 4: Non-Blocking Embedding Operations

**As a** developer using Lighthouse Chat IDE
**I want** embedding generation to happen in the background
**So that** the application remains responsive during indexing

**Acceptance Criteria:**
- [ ] Embedding operations execute asynchronously
- [ ] UI remains responsive (60fps) during batch embedding
- [ ] Progress events emitted for long-running operations
- [ ] Operations cancellable if user navigates away
- [ ] Error handling for timeout scenarios (>30s per document)

**Priority:** Medium
**Estimated Hours:** 8
**Objective UCP:** 6

---

## Definition of Done

- [ ] All 4 user stories completed with acceptance criteria met
- [ ] Code coverage >=90%
- [ ] Performance benchmarks: <2s per document embedding
- [ ] No linter errors or TypeScript errors
- [ ] Code reviewed and approved
- [ ] JSDoc documentation complete

## Notes

- Transformers.js uses ONNX runtime for cross-platform inference
- Model stored in app.getPath('userData')/models directory
- Web Workers considered for future optimization if needed
- First model load may take 10-30s (download + warm-up)

## Dependencies

- **Prerequisites:** Wave 10.1.1 (VectorService foundation)
- **Enables:** Wave 10.1.3 (memory monitoring), Feature 10.3 (RAG pipeline)

---

**Total Stories:** 4
**Total Hours:** 44
**Total Objective UCP:** 33
**Wave Status:** Planning
