# Wave 10.4.1: RAG Toggle & Context Retrieval Integration

## Wave Overview
- **Wave ID:** Wave-10.4.1
- **Feature:** Feature 10.4 - Chat Integration & Source Citations
- **Epic:** Epic 10 - RAG Knowledge Base
- **Status:** Planning
- **Scope:** Integrate RAG toggle into Chat UI and implement automatic context retrieval on message send
- **Wave Goal:** Enable RAG-augmented chat with user-controlled activation

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Create RAGToggle component for Chat Interface toolbar
2. Implement useChatRAG hook for RAG-augmented message flow
3. Add RAG status indicator during context retrieval
4. Integrate with existing chat streaming without blocking

## User Stories

### User Story 1: RAG Toggle in Chat Interface

**As a** developer using Lighthouse Chat IDE
**I want** a toggle button in the chat toolbar to enable/disable RAG
**So that** I can control when the AI uses my knowledge base context

**Acceptance Criteria:**
- [ ] RAGToggle button visible in Chat Interface toolbar
- [ ] Toggle shows document count when documents indexed (e.g., "(42 docs)")
- [ ] Toggle disabled with tooltip when no documents indexed
- [ ] Active state clearly indicated (color, icon change)
- [ ] Toggle state synced with useKnowledgeStore
- [ ] Keyboard accessible (Enter/Space to toggle)
- [ ] Unit tests verify all toggle states

**Priority:** High
**Estimated Hours:** 10
**Objective UCP:** 8

---

### User Story 2: RAG-Augmented Chat Flow

**As a** developer using Lighthouse Chat IDE
**I want** context retrieved automatically when I send a message with RAG enabled
**So that** the AI has relevant codebase knowledge to answer

**Acceptance Criteria:**
- [ ] useChatRAG hook handles RAG-enabled message flow
- [ ] Context retrieved before sending message to AI
- [ ] Retrieved context passed through IPC to main process
- [ ] Response includes source metadata for citation display
- [ ] Non-RAG messages bypass retrieval entirely
- [ ] Integration tests verify full RAG chat flow

**Priority:** High
**Estimated Hours:** 12
**Objective UCP:** 9

---

### User Story 3: RAG Status Indicator

**As a** developer using Lighthouse Chat IDE
**I want** to see when the system is searching the knowledge base
**So that** I understand why there might be a brief delay before the AI responds

**Acceptance Criteria:**
- [ ] Status indicator appears during context retrieval
- [ ] Shows "Searching knowledge base..." text with spinner
- [ ] Indicator hides when retrieval completes (success or failure)
- [ ] Positioned near message input area
- [ ] Accessible to screen readers (live region)
- [ ] Unit tests verify indicator lifecycle

**Priority:** Medium
**Estimated Hours:** 6
**Objective UCP:** 5

---

### User Story 4: Non-Blocking Streaming Integration

**As a** developer using Lighthouse Chat IDE
**I want** RAG retrieval to not delay the AI response noticeably
**So that** my workflow remains smooth and responsive

**Acceptance Criteria:**
- [ ] Context retrieval happens in parallel where possible
- [ ] AI streaming begins immediately after prompt construction
- [ ] Total RAG overhead <200ms for typical queries
- [ ] UI remains responsive (60fps) during retrieval
- [ ] Performance benchmarks documented
- [ ] Integration tests verify streaming not blocked

**Priority:** High
**Estimated Hours:** 8
**Objective UCP:** 6

---

## Definition of Done

- [ ] All 4 user stories completed with acceptance criteria met
- [ ] Code coverage >=90%
- [ ] RAG overhead verified <200ms
- [ ] Accessibility audit passed (toggle, status indicator)
- [ ] Visual design matches VS Code aesthetic
- [ ] No linter errors or TypeScript errors
- [ ] Code reviewed and approved

## Notes

- RAG toggle shares state with Knowledge Tab (useKnowledgeStore)
- Status indicator uses similar pattern to existing loading states
- Streaming architecture already supports async operations (ADR-009)
- Performance measured from user click to first token streamed

## Dependencies

- **Prerequisites:** Feature 10.2 (useKnowledgeStore), Feature 10.3 (RAGService)
- **Enables:** Wave 10.4.2 (source citations display)

---

**Total Stories:** 4
**Total Hours:** 36
**Total Objective UCP:** 28
**Wave Status:** Planning
