# Wave 10.1.3: Memory Monitoring & Index Persistence

## Wave Overview
- **Wave ID:** Wave-10.1.3
- **Feature:** Feature 10.1 - Vector Service & Embedding Infrastructure
- **Epic:** Epic 10 - RAG Knowledge Base
- **Status:** Completed (January 24, 2026 - bundled into Wave 10.2.1)
- **Commit:** f3de7c0
- **Note:** MemoryMonitor and IndexPersistence implemented as dependencies for Feature 10.2 UI
- **Scope:** Implement memory budget tracking, enforcement, and vector index persistence to disk
- **Wave Goal:** Ensure stable memory management and data durability across application restarts

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Implement MemoryMonitor with 500MB budget tracking and enforcement
2. Create IndexPersistence for save/load operations to disk
3. Add memory status reporting via IPC for UI display
4. Establish memory threshold warnings (80%) and blocking (95%)

## User Stories

### User Story 1: Memory Budget Tracking & Enforcement

**As a** developer using Lighthouse Chat IDE
**I want** the knowledge base to track memory usage against a 500MB budget
**So that** my system remains stable and doesn't run out of memory

**Acceptance Criteria:**
- [ ] MemoryMonitor tracks current usage in bytes with per-document breakdown
- [ ] Memory projection estimates impact before adding documents
- [ ] Budget enforcement rejects operations that would exceed 500MB
- [ ] Memory tracking accurate within 5% of actual process memory
- [ ] Document removal correctly decreases tracked memory
- [ ] Unit tests verify budget enforcement scenarios

**Priority:** High
**Estimated Hours:** 14
**Objective UCP:** 11

---

### User Story 2: Memory Threshold Alerts

**As a** developer using Lighthouse Chat IDE
**I want** to receive warnings as I approach the memory limit
**So that** I can manage my knowledge base proactively

**Acceptance Criteria:**
- [ ] Warning status triggered at 80% usage (400MB)
- [ ] Critical status triggered at 95% usage (475MB)
- [ ] Status includes usedMB, budgetMB, percentUsed, and status string
- [ ] IPC handler exposes memory status to renderer process
- [ ] Status updates emitted when thresholds crossed
- [ ] Clear error messages explain why operations blocked

**Priority:** High
**Estimated Hours:** 8
**Objective UCP:** 6

---

### User Story 3: Vector Index Persistence

**As a** developer using Lighthouse Chat IDE
**I want** my indexed documents saved to disk automatically
**So that** I don't lose my knowledge base when the application restarts

**Acceptance Criteria:**
- [ ] Index persists to .lighthouse/knowledge/index.json
- [ ] Save operation uses atomic write (temp file + rename)
- [ ] Index loads automatically on VectorService initialization
- [ ] Integrity validation on load detects corruption
- [ ] Save completes in <1 second for typical index (1000 docs)
- [ ] Load completes in <1 second for typical index

**Priority:** High
**Estimated Hours:** 12
**Objective UCP:** 9

---

### User Story 4: Index Corruption Recovery

**As a** developer using Lighthouse Chat IDE
**I want** the system to handle corrupted index files gracefully
**So that** a bad file doesn't prevent me from using the application

**Acceptance Criteria:**
- [ ] Corrupted index detected during load (JSON parse, schema validation)
- [ ] Previous index backup retained before overwrite
- [ ] Clear error message explains corruption and recovery options
- [ ] Fresh index created if recovery impossible
- [ ] Logging captures corruption details for debugging
- [ ] Integration tests verify recovery scenarios

**Priority:** Medium
**Estimated Hours:** 6
**Objective UCP:** 5

---

## Definition of Done

- [ ] All 4 user stories completed with acceptance criteria met
- [ ] Code coverage >=90%
- [ ] Memory tracking validates against process.memoryUsage()
- [ ] Persistence survives application restart (integration test)
- [ ] No linter errors or TypeScript errors
- [ ] Code reviewed and approved
- [ ] JSDoc documentation complete

## Notes

- Index file location: userData/.lighthouse/knowledge/index.json
- Atomic writes prevent corruption during crash scenarios
- Memory budget is per-project (future: per-project settings)
- Backup index retained at index.json.backup

## Dependencies

- **Prerequisites:** Wave 10.1.1 (VectorService), Wave 10.1.2 (EmbeddingService)
- **Enables:** Feature 10.2 (UI displays memory status), Feature 10.3 (RAG pipeline)

---

**Total Stories:** 4
**Total Hours:** 40
**Total Objective UCP:** 31
**Wave Status:** Planning
