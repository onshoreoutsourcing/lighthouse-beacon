# Wave 10.2.1: Knowledge Tab & Document List

## Wave Overview
- **Wave ID:** Wave-10.2.1
- **Feature:** Feature 10.2 - Knowledge Base UI
- **Epic:** Epic 10 - RAG Knowledge Base
- **Status:** Planning
- **Scope:** Create Knowledge Tab in left sidebar with document list display and status indicators
- **Wave Goal:** Provide visual interface for viewing indexed documents and their status

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Create KnowledgeTab component integrated into ActivityBar
2. Implement DocumentList component with status badges
3. Display document metadata (file path, size, timestamp)
4. Enable document removal via UI action

## User Stories

### User Story 1: Knowledge Tab Sidebar Integration

**As a** developer using Lighthouse Chat IDE
**I want** a Knowledge Tab in the left sidebar next to File Explorer
**So that** I can access and manage my knowledge base easily

**Acceptance Criteria:**
- [ ] Knowledge Tab visible in ActivityBar with appropriate icon
- [ ] Tab shows active state when selected
- [ ] Tab displays document count badge when documents indexed
- [ ] Tab layout matches existing sidebar patterns (VS Code aesthetic)
- [ ] Keyboard navigation to tab works (accessibility)
- [ ] Unit tests verify tab rendering and state

**Priority:** High
**Estimated Hours:** 10
**Objective UCP:** 8

---

### User Story 2: Document List Display

**As a** developer using Lighthouse Chat IDE
**I want** to see all my indexed documents in a list
**So that** I know what files are included in the knowledge base

**Acceptance Criteria:**
- [ ] DocumentList displays all indexed documents
- [ ] Each document shows file path (relative to project)
- [ ] Each document shows memory size (e.g., "12.5 KB")
- [ ] Each document shows indexed timestamp
- [ ] List supports virtual scrolling for 1000+ documents
- [ ] Empty state shows helpful message and Add Files button

**Priority:** High
**Estimated Hours:** 12
**Objective UCP:** 9

---

### User Story 3: Document Status Indicators

**As a** developer using Lighthouse Chat IDE
**I want** to see the status of each document (indexed, processing, error)
**So that** I understand the current state of my knowledge base

**Acceptance Criteria:**
- [ ] Status badges display: indexed (green check), processing (yellow spinner), error (red X)
- [ ] Status updates in real-time during indexing operations
- [ ] Error status shows tooltip with error message
- [ ] Processing status shows which step is in progress
- [ ] Screen reader announcements for status changes (accessibility)

**Priority:** High
**Estimated Hours:** 8
**Objective UCP:** 6

---

### User Story 4: Document Removal

**As a** developer using Lighthouse Chat IDE
**I want** to remove documents from the knowledge base
**So that** I can manage what information the AI has access to

**Acceptance Criteria:**
- [ ] Remove button visible on document hover/focus
- [ ] Confirmation dialog prevents accidental deletion
- [ ] Removal updates list immediately (optimistic UI)
- [ ] Memory status updates after removal
- [ ] Keyboard accessible (Delete key on focused item)
- [ ] Unit tests verify removal flow

**Priority:** Medium
**Estimated Hours:** 6
**Objective UCP:** 5

---

## Definition of Done

- [ ] All 4 user stories completed with acceptance criteria met
- [ ] Code coverage >=90%
- [ ] Accessibility audit passed (WCAG 2.1 Level AA)
- [ ] Visual design matches VS Code aesthetic
- [ ] No linter errors or TypeScript errors
- [ ] Code reviewed and approved

## Notes

- KnowledgeTab extends existing ActivityBar component pattern
- Virtual scrolling uses react-window library (already in project)
- Status badge icons from lucide-react (already in project)
- Follow existing component patterns from File Explorer

## Dependencies

- **Prerequisites:** Feature 10.1 (VectorService for document data)
- **Enables:** Wave 10.2.2 (memory bar), Wave 10.2.3 (file operations)

---

**Total Stories:** 4
**Total Hours:** 36
**Total Objective UCP:** 28
**Wave Status:** Planning
