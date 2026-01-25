# Wave 10.2.3: File Operations & Zustand Store

## Wave Overview
- **Wave ID:** Wave-10.2.3
- **Feature:** Feature 10.2 - Knowledge Base UI
- **Epic:** Epic 10 - RAG Knowledge Base
- **Status:** Completed (January 24, 2026)
- **Commit:** 69e4e1b
- **Scope:** Implement file/folder add dialogs, Zustand store, context menu, and RAG toggle
- **Wave Goal:** Complete Knowledge Base UI with all file operations and state management

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Create AddFilesDialog with file and folder picker integration
2. Implement useKnowledgeStore for centralized state management
3. Add context menu integration in File Explorer ("Add to Knowledge")
4. Implement RAG toggle with per-project persistence

## User Stories

### User Story 1: Add Files/Folder Interface

**As a** developer using Lighthouse Chat IDE
**I want** to add files or entire folders to the knowledge base via buttons
**So that** I can quickly index my codebase for AI context

**Acceptance Criteria:**
- [ ] "Add Files" button opens native file picker (multi-select enabled)
- [ ] "Add Folder" button opens native directory picker
- [ ] Selected files queued for indexing via IPC
- [ ] File type filtering available (.ts, .js, .py, etc.)
- [ ] Large folders show confirmation with file count estimate
- [ ] Operations cancel gracefully if user dismisses dialog

**Priority:** High
**Estimated Hours:** 12
**Objective UCP:** 9

---

### User Story 2: Knowledge Store State Management

**As a** frontend developer
**I want** a Zustand store managing all knowledge base state
**So that** components share consistent state and actions

**Acceptance Criteria:**
- [ ] useKnowledgeStore provides documents, memoryStatus, isIndexing, ragEnabled
- [ ] Store actions: addFiles, removeDocument, toggleRag, refreshStatus
- [ ] RAG toggle state persists to localStorage (per project)
- [ ] Store subscribes to IPC events for real-time updates
- [ ] Store follows established Zustand patterns (ADR-003)
- [ ] Unit tests verify all store actions and selectors

**Priority:** High
**Estimated Hours:** 10
**Objective UCP:** 8

---

### User Story 3: File Explorer Context Menu

**As a** developer using Lighthouse Chat IDE
**I want** to right-click files in File Explorer and add them to knowledge base
**So that** I can quickly add specific files without leaving my workflow

**Acceptance Criteria:**
- [ ] Context menu includes "Add to Knowledge Base" option
- [ ] Menu item shows appropriate icon (database/knowledge icon)
- [ ] Single file adds immediately with progress feedback
- [ ] Folder selection recursively indexes contained files
- [ ] Menu item disabled if file already indexed (with tooltip)
- [ ] Integration tests verify context menu flow

**Priority:** High
**Estimated Hours:** 8
**Objective UCP:** 6

---

### User Story 4: RAG Toggle with Persistence

**As a** developer using Lighthouse Chat IDE
**I want** the RAG toggle state to persist per project
**So that** my preference is remembered when I reopen the project

**Acceptance Criteria:**
- [ ] RAG toggle visible in Knowledge Tab header
- [ ] Toggle OFF by default for new projects (per user decision)
- [ ] Toggle state persists in localStorage keyed by project path
- [ ] Changing project loads that project's RAG preference
- [ ] Toggle disabled when no documents indexed (with tooltip)
- [ ] Toggle state available to Chat interface (cross-store)

**Priority:** High
**Estimated Hours:** 6
**Objective UCP:** 5

---

## Definition of Done

- [ ] All 4 user stories completed with acceptance criteria met
- [ ] Code coverage >=90%
- [ ] Zustand store patterns consistent with existing stores
- [ ] Accessibility audit passed (all actions keyboard accessible)
- [ ] Integration tests verify end-to-end flows
- [ ] No linter errors or TypeScript errors
- [ ] Code reviewed and approved

## Notes

- File picker uses Electron dialog API via IPC
- Context menu extends existing File Explorer context menu system
- Per-project persistence uses localStorage with project path as key
- RAG toggle state shared between Knowledge Tab and Chat (Feature 10.4)

## Dependencies

- **Prerequisites:** Wave 10.2.1 (KnowledgeTab), Wave 10.2.2 (progress display), Feature 10.1 (IPC handlers)
- **Enables:** Feature 10.4 (Chat reads RAG toggle from store)

---

**Total Stories:** 4
**Total Hours:** 36
**Total Objective UCP:** 28
**Wave Status:** Planning
