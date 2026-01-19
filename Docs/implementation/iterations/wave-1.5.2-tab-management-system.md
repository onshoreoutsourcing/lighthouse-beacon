# Wave 1.5.2: Tab Management System

## Wave Overview
- **Wave ID:** Wave-1.5.2
- **Feature:** Feature 1.5 - Monaco Editor Integration
- **Epic:** Epic 1 - Desktop Foundation with Basic UI
- **Status:** Planning
- **Scope:** Implement tab bar for managing multiple open files
- **Wave Goal:** Enable working with multiple files through tabbed interface

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Create Zustand editor store with open files state management
2. Implement TabBar and Tab components with visual styling
3. Add tab operations: open file, switch tab, close tab

---

## User Story 1: Editor State Management

**As a** developer
**I want** a Zustand store managing open files and active tab
**So that** editor state is centralized and predictable

**Acceptance Criteria:**
- [ ] Store tracks openFiles array with file metadata
- [ ] Store tracks activeFilePath for current tab
- [ ] openFile action reads file via IPC and adds to openFiles
- [ ] closeFile action removes file from openFiles
- [ ] setActiveFile action switches the current tab

**Priority:** High
**Estimated Hours:** 5
**Objective UCP:** 10

---

## User Story 2: Tab Bar Interface

**As a** user
**I want** a tab bar displaying all open files
**So that** I can see and switch between open files

**Acceptance Criteria:**
- [ ] Tab bar appears above editor when files are open
- [ ] Each tab shows file name
- [ ] Active tab visually highlighted (different background)
- [ ] Clicking tab switches to that file in editor
- [ ] Tab bar scrolls horizontally if many tabs open

**Priority:** High
**Estimated Hours:** 5
**Objective UCP:** 10

---

## User Story 3: Tab Operations

**As a** user
**I want** to close tabs and manage open files
**So that** I can control which files are open

**Acceptance Criteria:**
- [ ] Close button (X) on each tab
- [ ] Closing tab removes file from tab bar
- [ ] Closing active tab switches to adjacent tab
- [ ] Closing last tab shows empty state
- [ ] 10+ tabs can be open without performance issues

**Priority:** High
**Estimated Hours:** 4
**Objective UCP:** 8

---

## Definition of Done

- [ ] All user stories completed with acceptance criteria met
- [ ] Tab bar displays all open files
- [ ] Tab switching updates editor content
- [ ] Tab close removes file and updates display
- [ ] 10+ tabs work without performance degradation
- [ ] No TypeScript or linter errors
- [ ] Code reviewed and approved

---

## Notes

- Depends on Wave 1.5.1 (Monaco Editor must be integrated)
- Reference ADR-003 (Zustand) for state management approach
- Tab styling should match VS Code appearance
- Empty state shows when no files are open

---

**Total Stories:** 3
**Total Hours:** 14
**Wave Status:** Planning
