# Wave 1.6.2: Bidirectional Sync and Edge Cases

## Wave Overview
- **Wave ID:** Wave-1.6.2
- **Feature:** Feature 1.6 - File Operations Bridge
- **Epic:** Epic 1 - Desktop Foundation with Basic UI
- **Status:** Planning
- **Scope:** Implement bidirectional state sync and handle edge cases
- **Wave Goal:** Complete file bridge with synchronized selection and robust edge case handling

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Implement editor-to-explorer sync via Zustand subscription
2. Handle edge cases: binary files, large files, closing active tab
3. Validate complete bidirectional sync workflow

---

## User Story 1: Bidirectional Selection Sync

**As a** user
**I want** file explorer and editor to stay synchronized
**So that** I always know which file I am currently editing

**Acceptance Criteria:**
- [ ] Clicking file in explorer highlights it and opens in editor
- [ ] Clicking tab in editor highlights corresponding file in explorer
- [ ] Closing active tab updates explorer selection appropriately
- [ ] File explorer and editor selection always match
- [ ] Sync latency < 50ms (imperceptible)

**Priority:** High
**Estimated Hours:** 5
**Objective UCP:** 10

---

## User Story 2: Binary File Detection

**As a** user
**I want** binary files to display an error instead of corrupted content
**So that** I understand the file cannot be edited as text

**Acceptance Criteria:**
- [ ] Binary files detected (null byte check)
- [ ] Binary file shows "Cannot display binary file" message
- [ ] No tab created for binary files
- [ ] Error message includes file path
- [ ] Application does not crash on binary file selection

**Priority:** High
**Estimated Hours:** 4
**Objective UCP:** 8

---

## User Story 3: Large File Handling

**As a** user
**I want** large files to load with a warning but not break the application
**So that** I can still view large files when necessary

**Acceptance Criteria:**
- [ ] Files > 1MB trigger warning in console
- [ ] Large files still load and display in editor
- [ ] Performance acceptable for files up to 10MB
- [ ] Very large files may have slower syntax highlighting
- [ ] No application crash or freeze on large files

**Priority:** Medium
**Estimated Hours:** 3
**Objective UCP:** 6

---

## User Story 4: Tab Close Sync

**As a** user
**I want** explorer selection to update correctly when closing tabs
**So that** the highlighted file always matches the active tab

**Acceptance Criteria:**
- [ ] Closing non-active tab does not change explorer selection
- [ ] Closing active tab switches to next tab and updates explorer
- [ ] Closing last tab clears explorer selection
- [ ] Rapid tab closing handled correctly (no race conditions)
- [ ] State remains consistent through all close operations

**Priority:** Medium
**Estimated Hours:** 3
**Objective UCP:** 6

---

## Definition of Done

- [ ] All user stories completed with acceptance criteria met
- [ ] Bidirectional sync works perfectly (explorer <-> editor)
- [ ] Binary files detected and handled with error message
- [ ] Large files load with warning
- [ ] Tab close operations update explorer correctly
- [ ] No race conditions or state inconsistencies
- [ ] All Epic 1 exit criteria achieved
- [ ] No TypeScript or linter errors
- [ ] Code reviewed and approved

---

## Notes

- This wave completes Epic 1 - Desktop Foundation with Basic UI
- After this wave, the IDE is ready for Phase 2 (AI Integration)
- Zustand subscription pattern for cross-store sync
- Test edge cases thoroughly before marking complete

---

**Total Stories:** 4
**Total Hours:** 15
**Wave Status:** Planning
