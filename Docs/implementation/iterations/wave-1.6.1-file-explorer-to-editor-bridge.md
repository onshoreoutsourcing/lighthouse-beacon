# Wave 1.6.1: File Explorer to Editor Bridge

## Wave Overview
- **Wave ID:** Wave-1.6.1
- **Feature:** Feature 1.6 - File Operations Bridge
- **Epic:** Epic 1 - Desktop Foundation with Basic UI
- **Status:** Planning
- **Scope:** Connect file explorer selection to editor file opening
- **Wave Goal:** Clicking a file in the explorer opens it in the editor

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Bridge file explorer selectFile() to editor openFile()
2. Add loading state during file read operations
3. Implement error handling for failed file loads

---

## User Story 1: File Explorer to Editor Integration

**As a** user
**I want** to click a file in the explorer to open it in the editor
**So that** I can start reading or editing the file

**Acceptance Criteria:**
- [ ] Clicking file in explorer triggers editor.openFile()
- [ ] File content displays in Monaco Editor with correct syntax highlighting
- [ ] Tab appears in tab bar with file name
- [ ] Opening already-open file switches to existing tab (no duplicate)
- [ ] File opens in < 200ms (including IPC and rendering)

**Priority:** High
**Estimated Hours:** 5
**Objective UCP:** 10

---

## User Story 2: Loading State Display

**As a** user
**I want** to see loading feedback while files are opening
**So that** I know the application is working on my request

**Acceptance Criteria:**
- [ ] Loading spinner appears when file read starts
- [ ] Loading state managed in editor store (isLoading flag)
- [ ] Spinner disappears when file content loads
- [ ] Loading indicator centered in editor area
- [ ] No flicker for fast-loading files (< 100ms threshold)

**Priority:** Medium
**Estimated Hours:** 3
**Objective UCP:** 6

---

## User Story 3: Error Handling for File Operations

**As a** user
**I want** clear error messages when file operations fail
**So that** I understand what went wrong and can take action

**Acceptance Criteria:**
- [ ] Failed file read shows error message in editor area
- [ ] Error message includes file path that failed
- [ ] Error state managed in editor store (error field)
- [ ] Error clears when new file successfully opens
- [ ] No crash or undefined behavior on errors

**Priority:** High
**Estimated Hours:** 4
**Objective UCP:** 8

---

## Definition of Done

- [ ] All user stories completed with acceptance criteria met
- [ ] Clicking file in explorer opens it in editor reliably
- [ ] Loading state displays during file read
- [ ] Errors handled gracefully with user-facing messages
- [ ] No duplicate tabs created for same file
- [ ] File opens in < 200ms
- [ ] No TypeScript or linter errors
- [ ] Code reviewed and approved

---

## Notes

- Depends on Feature 1.4 (file explorer with selection)
- Depends on Feature 1.5 (editor with tab management)
- Store-to-store communication via Zustand getState()
- This is the first full IDE workflow (browse -> open -> view)

---

**Total Stories:** 3
**Total Hours:** 12
**Wave Status:** Planning
