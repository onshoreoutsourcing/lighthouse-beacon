# Wave 10.4.2: Source Citations & Click-to-Open

## Wave Overview
- **Wave ID:** Wave-10.4.2
- **Feature:** Feature 10.4 - Chat Integration & Source Citations
- **Epic:** Epic 10 - RAG Knowledge Base
- **Status:** Completed (January 25, 2026)
- **Commit:** 24c06ab
- **Scope:** Display source citations below AI responses with click-to-open file navigation
- **Wave Goal:** Complete RAG user experience with transparent source attribution

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Create SourceCitations component for collapsible source display
2. Implement SourceCitationItem with click-to-open functionality
3. Integrate source display into chat message rendering
4. Add graceful fallback messaging when retrieval fails

## User Stories

### User Story 1: Source Citations Display

**As a** developer using Lighthouse Chat IDE
**I want** to see which files informed the AI's response
**So that** I can verify the AI's context and trust its answers

**Acceptance Criteria:**
- [ ] SourceCitations component renders below AI responses
- [ ] Header shows source count (e.g., "3 sources")
- [ ] Citations collapsible by default (expand on click)
- [ ] Each citation shows file path, line range, relevance %
- [ ] Sources ordered by relevance (highest first)
- [ ] No citations section when no sources used
- [ ] Unit tests verify all display states

**Priority:** High
**Estimated Hours:** 12
**Objective UCP:** 9

---

### User Story 2: Click-to-Open File Navigation

**As a** developer using Lighthouse Chat IDE
**I want** to click a source citation to open that file at the correct line
**So that** I can quickly navigate to the relevant code

**Acceptance Criteria:**
- [ ] Clicking citation opens file in Monaco editor
- [ ] Editor scrolls to and highlights the cited line range
- [ ] File opens in new tab if not already open
- [ ] Handles missing files gracefully (file deleted since indexing)
- [ ] Click target meets accessibility size requirements (44x44px)
- [ ] Keyboard accessible (Enter to open)
- [ ] Integration tests verify file opening

**Priority:** High
**Estimated Hours:** 10
**Objective UCP:** 8

---

### User Story 3: Chat Message Integration

**As a** developer using Lighthouse Chat IDE
**I want** source citations to appear naturally as part of AI messages
**So that** the chat experience remains clean and organized

**Acceptance Criteria:**
- [ ] Citations attached to ChatMessage data model
- [ ] MessageList component renders citations after message content
- [ ] RAG metadata (chunks count, tokens) available but not prominent
- [ ] Non-RAG messages render identically to before
- [ ] Streaming messages show citations after stream completes
- [ ] Visual design matches existing chat styling

**Priority:** High
**Estimated Hours:** 8
**Objective UCP:** 6

---

### User Story 4: Retrieval Failure Messaging

**As a** developer using Lighthouse Chat IDE
**I want** to know when RAG retrieval failed and chat continued without context
**So that** I understand why the AI might not have codebase knowledge

**Acceptance Criteria:**
- [ ] Subtle warning indicator when retrieval failed
- [ ] Warning message: "Could not retrieve knowledge base context"
- [ ] Warning doesn't block chat flow (non-modal)
- [ ] Warning dismissible and not persistent
- [ ] Error details logged for debugging (not shown to user)
- [ ] Chat message clearly marked as non-RAG augmented
- [ ] Unit tests verify warning display logic

**Priority:** Medium
**Estimated Hours:** 6
**Objective UCP:** 5

---

## Definition of Done

- [ ] All 4 user stories completed with acceptance criteria met
- [ ] Code coverage >=90%
- [ ] Click-to-open verified with real editor integration
- [ ] Accessibility audit passed (WCAG 2.1 Level AA)
- [ ] Visual design matches VS Code aesthetic
- [ ] No linter errors or TypeScript errors
- [ ] Code reviewed and approved
- [ ] User documentation updated

## Notes

- Citations use existing Editor store for file opening (openFile action)
- Line highlighting uses Monaco editor setSelection API
- Warning indicator uses toast/notification pattern (non-blocking)
- Citations section collapsed by default to reduce visual clutter

## Dependencies

- **Prerequisites:** Wave 10.4.1 (RAG toggle and retrieval), Epic 4 (Editor store)
- **Enables:** Epic 10 complete - full RAG Knowledge Base functionality

---

**Total Stories:** 4
**Total Hours:** 36
**Total Objective UCP:** 28
**Wave Status:** Planning
