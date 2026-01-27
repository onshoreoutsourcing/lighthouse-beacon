# Wave 10.2.2: Memory Usage Bar & Progress Indicators

## Wave Overview
- **Wave ID:** Wave-10.2.2
- **Feature:** Feature 10.2 - Knowledge Base UI
- **Epic:** Epic 10 - RAG Knowledge Base
- **Status:** Completed (January 24, 2026)
- **Commit:** 8617f20
- **Scope:** Create visual memory usage display and indexing progress indicators
- **Wave Goal:** Provide clear visual feedback on memory consumption and indexing operations

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Implement MemoryUsageBar component with threshold visualization
2. Create IndexingProgress component for batch operations
3. Connect components to real-time IPC events from main process
4. Establish warning and critical visual states

## User Stories

### User Story 1: Memory Usage Visualization

**As a** developer using Lighthouse Chat IDE
**I want** to see how much memory my knowledge base is using
**So that** I can manage my indexed documents within the 500MB budget

**Acceptance Criteria:**
- [ ] MemoryUsageBar displays current usage vs 500MB budget
- [ ] Bar shows percentage filled visually (progress bar style)
- [ ] Text label shows "XXX MB / 500 MB" with actual values
- [ ] Tooltip provides detailed breakdown (documents, chunks, overhead)
- [ ] Updates in real-time during indexing (throttled to 10/second)
- [ ] Unit tests verify all display states

**Priority:** High
**Estimated Hours:** 10
**Objective UCP:** 8

---

### User Story 2: Memory Warning States

**As a** developer using Lighthouse Chat IDE
**I want** clear visual warnings as I approach memory limits
**So that** I know to stop adding documents before hitting the limit

**Acceptance Criteria:**
- [ ] Green state displayed when usage <80% (healthy)
- [ ] Yellow/amber state displayed at 80-95% (warning)
- [ ] Red state displayed at >95% (critical)
- [ ] Warning icon appears in warning/critical states
- [ ] Tooltip explains threshold meanings
- [ ] Color transitions smooth (not jarring)

**Priority:** High
**Estimated Hours:** 6
**Objective UCP:** 5

---

### User Story 3: Indexing Progress Display

**As a** developer using Lighthouse Chat IDE
**I want** to see progress when indexing multiple files
**So that** I know how long the operation will take

**Acceptance Criteria:**
- [ ] Progress indicator appears during batch indexing
- [ ] Shows "X of Y files" with current file name
- [ ] Progress bar fills proportionally
- [ ] Estimated time remaining displayed (after 3+ files)
- [ ] Hides automatically when indexing completes
- [ ] Accessible progress announcements for screen readers

**Priority:** High
**Estimated Hours:** 10
**Objective UCP:** 8

---

### User Story 4: Real-Time Event Integration

**As a** developer using Lighthouse Chat IDE
**I want** memory and progress displays to update instantly
**So that** I have accurate feedback during operations

**Acceptance Criteria:**
- [ ] IPC events from main process update UI within 100ms
- [ ] Memory status subscribes to kb:memory-status-changed event
- [ ] Progress subscribes to kb:indexing-progress event
- [ ] Events throttled appropriately (no UI jank)
- [ ] Cleanup on component unmount (no memory leaks)
- [ ] Integration tests verify event flow

**Priority:** Medium
**Estimated Hours:** 8
**Objective UCP:** 6

---

## Definition of Done

- [ ] All 4 user stories completed with acceptance criteria met
- [ ] Code coverage >=90%
- [ ] UI remains responsive at 60fps during updates
- [ ] Accessibility audit passed (color contrast, screen reader)
- [ ] Visual design matches VS Code aesthetic
- [ ] No linter errors or TypeScript errors
- [ ] Code reviewed and approved

## Notes

- Memory bar placement: top of Knowledge Tab content area
- Progress indicator placement: below memory bar, above document list
- Colors follow VS Code semantic coloring (green=success, yellow=warning, red=error)
- Throttle updates to max 10/second to prevent performance issues

## Dependencies

- **Prerequisites:** Wave 10.2.1 (KnowledgeTab), Feature 10.1 (memory status IPC)
- **Enables:** Wave 10.2.3 (file operations trigger progress)

---

**Total Stories:** 4
**Total Hours:** 34
**Total Objective UCP:** 27
**Wave Status:** Completed
