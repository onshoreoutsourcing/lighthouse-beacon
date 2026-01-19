# Wave 3.4.1: Event-Based Visual Integration

## Wave Overview
- **Wave ID:** Wave-3.4.1
- **Feature:** Feature 3.4 - Visual Integration and Beta Testing
- **Epic:** Epic 3 - File Operation Tools Implementation
- **Status:** Planning
- **Scope:** Implement event-based refresh pattern connecting file operation tools to visual UI components
- **Wave Goal:** File explorer and editor automatically update when AI performs file operations

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Implement IPC event emission from all file operation tools
2. Connect FileExplorerStore to file operation events for automatic refresh
3. Connect EditorStore to file operation events for content refresh and tab management
4. Implement event debouncing to prevent UI thrashing during rapid operations

## User Stories

### User Story 1: File Explorer Auto-Refresh on AI Operations

**As a** developer using Beacon
**I want** the file explorer to automatically update when AI creates, modifies, or deletes files
**So that** I always see the current file system state without manual refresh

**Acceptance Criteria:**
- [ ] File explorer shows new files within 100ms of AI creating them
- [ ] Deleted files disappear from explorer immediately
- [ ] Parent directories refresh to reflect changes
- [ ] No duplicate entries appear when files are created
- [ ] Visual refresh works for all 7 file operation tools
- [ ] Unit tests passing with >80% coverage

**Priority:** High
**Objective UCP:** 18

---

### User Story 2: Editor Content Refresh on AI Modifications

**As a** developer with files open in the editor
**I want** editor tabs to automatically show updated content when AI modifies files
**So that** I see the latest file content without reopening files

**Acceptance Criteria:**
- [ ] Open file tabs refresh within 100ms when AI edits the file
- [ ] Scroll position preserved after refresh (best effort)
- [ ] "Modified" indicator clears when content matches disk
- [ ] Syntax highlighting updates correctly after refresh
- [ ] No data loss if user has unsaved changes (warning shown)
- [ ] Unit tests passing with >80% coverage

**Priority:** High
**Objective UCP:** 16

---

### User Story 3: Editor Tab Management on File Deletion

**As a** developer with a file open that AI deletes
**I want** the editor tab to close automatically with notification
**So that** I am not editing a non-existent file

**Acceptance Criteria:**
- [ ] Tabs close automatically when AI deletes the file
- [ ] User notified that file was deleted (toast notification)
- [ ] If deleted file was active, switches to next available tab
- [ ] Empty state shown if no other tabs open
- [ ] Handles batch deletions gracefully
- [ ] Unit tests passing with >80% coverage

**Priority:** High
**Objective UCP:** 12

---

### User Story 4: Event Debouncing for Rapid Operations

**As a** developer observing AI performing multiple file operations
**I want** the UI to update smoothly without flickering or freezing
**So that** the visual experience remains responsive during batch operations

**Acceptance Criteria:**
- [ ] Rapid operations (5+ files in 1 second) debounced to single refresh
- [ ] UI does not freeze during batch file operations
- [ ] All files eventually appear after debounce settles (none missed)
- [ ] Maximum debounce wait time of 500ms enforced
- [ ] Integration tests verify batched updates work correctly
- [ ] Performance acceptable (<100ms total for batch operations)

**Priority:** Medium
**Objective UCP:** 10

---

## Definition of Done

- [ ] All user stories completed with acceptance criteria met
- [ ] Event emission working for all 7 file operation tools
- [ ] FileExplorerStore event handling complete
- [ ] EditorStore event handling complete
- [ ] Event debouncing preventing UI issues
- [ ] Unit test coverage >=80%
- [ ] Integration tests passing
- [ ] No TypeScript/linter errors
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Dependencies

**Requires from previous features:**
- Feature 3.1, 3.2, 3.3: All 7 file operation tools implemented
- Feature 1.4: File Explorer component with refresh capability
- Feature 1.5: Monaco Editor integration with tab management
- Feature 2.3: Tool execution framework

**Enables:**
- Wave 3.4.2: Chat interface enhancements
- Wave 3.4.3: Beta testing

## Notes

- Architecture follows ADR-013 (Visual Integration Pattern)
- Event format: FileOperationEvent interface with operation, paths, success, timestamp
- IPC channel: 'file-operation-complete'
- Zustand stores: fileExplorerStore, editorStore
- Performance target: <100ms from operation complete to UI update

---

**Total Stories:** 4
**Total Objective UCP:** 56
**Wave Status:** Planning
