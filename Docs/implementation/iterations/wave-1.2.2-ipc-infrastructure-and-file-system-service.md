# Wave 1.2.2: IPC Infrastructure and File System Service

## Wave Overview
- **Wave ID:** Wave-1.2.2
- **Feature:** Feature 1.2 - Electron Application Shell
- **Epic:** Epic 1 - Desktop Foundation with Basic UI
- **Status:** Planning
- **Scope:** Create IPC communication layer and file system service for main-renderer communication
- **Wave Goal:** Deliver secure IPC infrastructure enabling file system operations from the renderer process

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Implement preload script with contextBridge API exposure
2. Create FileSystemService with secure file operations
3. Register IPC handlers with path validation and error handling

---

## User Story 1: Secure IPC Communication Layer

**As a** developer
**I want** secure IPC communication between main and renderer processes
**So that** UI components can safely access file system without security vulnerabilities

**Acceptance Criteria:**
- [ ] Preload script exposes whitelisted IPC channels via contextBridge
- [ ] TypeScript types enforce correct IPC usage (window.electronAPI)
- [ ] Only documented channels accessible from renderer
- [ ] IPC calls complete in < 50ms for typical operations
- [ ] Error responses returned to renderer gracefully

**Priority:** High
**Estimated Hours:** 6
**Objective UCP:** 12

---

## User Story 2: File System Service Implementation

**As a** developer
**I want** working file system operations (read directory, read file, write file)
**So that** I can implement file explorer and editor in subsequent features

**Acceptance Criteria:**
- [ ] readDirectory returns list of files/folders with type information
- [ ] readFile returns file contents as string
- [ ] writeFile saves content to disk and confirms success
- [ ] All file paths validated to prevent directory traversal
- [ ] Meaningful error messages returned for failed operations

**Priority:** High
**Estimated Hours:** 6
**Objective UCP:** 12

---

## User Story 3: Project Directory Selection

**As a** user
**I want** to select a project directory to work with
**So that** I can open my codebase in the IDE

**Acceptance Criteria:**
- [ ] Native directory picker dialog opens on request
- [ ] Selected path becomes project root for all file operations
- [ ] File operations restricted to project root (security boundary)
- [ ] Directory selection can be triggered from renderer via IPC
- [ ] Path validation blocks access outside project root

**Priority:** High
**Estimated Hours:** 4
**Objective UCP:** 8

---

## Definition of Done

- [ ] All user stories completed with acceptance criteria met
- [ ] IPC handlers registered for fs:readDir, fs:readFile, fs:writeFile
- [ ] Directory picker dialog works from renderer
- [ ] Path validation prevents directory traversal attacks
- [ ] IPC latency < 50ms for typical operations
- [ ] TypeScript types defined for all IPC calls
- [ ] Unit tests passing > 80% coverage
- [ ] Code reviewed and approved

---

## Notes

- Depends on Wave 1.2.1 (main process and window must be working)
- Path validation is security-critical - test with malicious inputs
- FileSystemService follows Single Responsibility principle
- IPC channel names defined in shared constants file

---

**Total Stories:** 3
**Total Hours:** 16
**Wave Status:** Planning
