# Epic 5: Advanced Editor Features

## Epic Overview
- **Epic ID:** Epic-5
- **Status:** Planning
- **Duration:** 3-4 weeks
- **Team:** 1-2 developers
- **Priority:** High (P1)
- **Phase:** Phase 5

## Problem Statement

With MVP delivered (Epic 3) and multi-provider support implemented (Epic 4), Lighthouse Chat IDE provides complete conversational file operation capabilities. However, the editor and file management experience still lacks the sophistication developers expect from a professional IDE. Users cannot easily review AI-proposed changes before accepting them, advanced editing features are absent, and file management remains basic.

Currently:
- No diff view to visualize AI-proposed changes before accepting
- No change management system to review, accept, or reject modifications
- Missing advanced editor features (code folding, find/replace, autocomplete)
- Basic file explorer without context menus, drag-drop, or search
- No undo system for AI operations
- Changes are applied immediately without visual review

This Epic addresses the need for:
- **Diff View**: Side-by-side and inline comparison showing AI changes before acceptance
- **Change Management**: Review queue for proposed changes with accept/reject/partial accept controls
- **Advanced Editor Features**: Professional editing capabilities (code folding, autocomplete, find/replace)
- **Enhanced File Explorer**: Context menus, drag-drop, search, and better file management
- **Change History**: Undo/redo for AI operations with complete audit trail

**References:**
- Product Vision (01-Product-Vision.md): "Visual First, Conversational Always" - changes must be reviewable before acceptance
- Business Requirements (03-Business-Requirements.md): FR-3 (Code Editor Advanced Features), FR-7 (Real-Time Visual Feedback)
- Product Plan (02-Product-Plan.md): Phase 5 deliverables - diff view and change management
- DEVELOPMENT-PHASES.md: Phase 5 detailed requirements

## Goals and Success Criteria

**Primary Goal**: Transform Lighthouse Chat IDE from functional MVP to professional-grade development environment with advanced editor features and sophisticated change management.

**Success Metrics:**
- Diff view clearly shows AI-proposed changes with < 200ms rendering time
- Accept/reject controls work intuitively with < 50ms response time
- Advanced editor features (code folding, autocomplete) perform at VS Code parity
- File explorer supports full file management operations
- Users can undo AI changes 100% reliably
- 90%+ of AI changes reviewed in diff view before acceptance
- User satisfaction (NPS) increases from MVP baseline by 15+ points

**Exit Criteria** (must achieve to proceed to Epic 6):
- Diff view displays side-by-side and inline comparisons for AI changes
- Accept/reject/partial accept controls functional and reliable
- Code folding, find/replace, autocomplete working in Monaco editor
- File explorer has context menus, search, and drag-drop
- Undo system restores previous file state 100% correctly
- Change history persists across sessions
- Beta users report improved confidence in AI operations
- No P0 or P1 bugs in diff view or change management

## Scope

### In Scope
- **Diff View Component**:
  - Side-by-side diff comparison (before/after)
  - Inline diff highlighting (additions in green, deletions in red)
  - Before/after toggle view
  - Syntax highlighting in diff view
  - Line-by-line change indicators
  - Performance optimization for large file diffs
- **Change Management System**:
  - Track AI-proposed changes before applying to files
  - Review queue showing all pending changes
  - Accept controls (accept all, accept file, accept hunk)
  - Reject controls (reject all, reject file, reject hunk)
  - Partial accept (select specific hunks to apply)
  - Visual indicators for modified sections in editor
  - Change preview in chat before AI applies
- **Change History and Undo**:
  - Track all AI file modifications with before/after state
  - Undo/redo functionality for AI operations
  - History persistence across sessions
  - History browser UI (view past changes)
  - Restore to any previous state
- **Advanced Editor Features**:
  - Code folding (collapse/expand functions, classes, blocks)
  - Go-to-line functionality (Ctrl+G/Cmd+G)
  - Find and replace within files (Ctrl+F/Cmd+F)
  - Find across all open files
  - Multiple cursor support
  - Basic autocomplete and IntelliSense
  - Minimap for file navigation
  - Breadcrumb navigation (file path, function hierarchy)
  - Enhanced syntax highlighting
- **File Explorer Enhancements**:
  - Context menus (right-click on files/folders)
  - Rename file/folder
  - Delete file/folder with confirmation
  - New file creation
  - New folder creation
  - Drag and drop support (move files/folders)
  - File search within explorer (fuzzy find)
  - Filter files by type or pattern
  - Visual indicators for modified/unsaved files
  - Git status indicators (modified, added, deleted)
  - Expand/collapse all folders

### Out of Scope
- Full git integration beyond status indicators (future enhancement)
- Collaborative editing features (future enhancement)
- Terminal integration (Phase 6 consideration)
- Custom themes beyond basic light/dark (Phase 6)
- Extensions or plugin system (future)
- Debugger integration (future)
- Refactoring tools beyond find/replace (future)
- Advanced IntelliSense features (future - keep basic in Phase 5)

## Planned Features

This Epic will be broken down into the following Features:
- **Feature 5.1**: Diff View and Visualization - Implement side-by-side and inline diff comparison with syntax highlighting and performance optimization
- **Feature 5.2**: Change Management System - Build review queue, accept/reject controls, partial accept, and change preview workflow
- **Feature 5.3**: Change History and Undo - Implement undo/redo for AI operations with history persistence and browser UI
- **Feature 5.4**: Advanced Editor Features - Add code folding, find/replace, autocomplete, minimap, breadcrumbs, and multiple cursors
- **Feature 5.5**: Enhanced File Explorer - Implement context menus, drag-drop, search, filtering, and file management operations

{Note: Actual Feature plans will be created using /design-features command}

## Dependencies

**Prerequisites (must complete before this Epic):**
- Epic 1 complete (Desktop foundation with Monaco editor)
- Epic 2 complete (AI integration with chat interface)
- Epic 3 complete (File operation tools - MVP)
- Epic 4 complete (Multi-provider support and enhanced conversation features)
- Basic file operations working reliably (read, write, edit, delete)

**Enables (this Epic enables):**
- Epic 6 (Polish and Usability) - requires stable advanced features
- Professional product readiness
- Enterprise adoption (diff view critical for governance)
- Increased user confidence in AI operations

**External Dependencies:**
- **Monaco Editor**: Advanced features (folding, autocomplete, IntelliSense)
  - Status: Available (Monaco Editor built-in capabilities)
  - Impact if unavailable: Major feature limitations
  - Mitigation: Monaco is mature, well-documented
- **Monaco Diff Editor**: Required for diff view component
  - Status: Available (@monaco-editor/react package)
  - Impact if unavailable: Cannot implement diff view
  - Mitigation: Official Monaco package, stable
- **Node.js fs.watch**: Required for file explorer updates
  - Status: Available (Node.js built-in)
  - Impact if unavailable: Manual refresh only
  - Mitigation: Standard Node.js API
- **Git (optional)**: For git status indicators in explorer
  - Status: Available on most developer machines
  - Impact if unavailable: No git status indicators (optional feature)
  - Mitigation: Degrade gracefully, feature optional

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Diff view performance issues with large files | High | Medium | Virtualize diff rendering; limit diff to 10,000 lines; provide simplified view for large files; test with 100KB+ files |
| Change management complexity confuses users | Medium | Medium | Start with simple accept/reject; add partial accept after feedback; clear visual indicators; user testing early |
| Undo system data storage grows too large | Medium | Low | Limit history to last 50 changes per file; compress old changes; provide "clear history" option; monitor storage usage |
| Advanced editor features conflict with existing Monaco integration | High | Low | Use Monaco's built-in APIs; test thoroughly; isolate custom features from Monaco core; follow Monaco patterns |
| File explorer drag-drop introduces file operation bugs | Medium | Medium | Validate moves before executing; add confirmation for destructive operations; comprehensive testing; rollback on error |
| Git integration adds significant complexity | Low | High | Keep git features minimal (status only); make git optional; don't implement full git client; use simple-git library |

## Technical Considerations

**Architecture Patterns:**
- **State Pattern**: Manage file states (original, modified, pending review, accepted, rejected)
- **Memento Pattern**: Capture file state for undo/redo functionality
- **Observer Pattern**: File explorer watches file system changes
- **Command Pattern**: File operations as reversible commands for undo

**Technology Stack:**
- **Diff Engine**: Monaco Diff Editor (built into @monaco-editor/react)
- **Change Tracking**: Custom TypeScript service with file state management
- **Undo System**: Zustand store with persistent history (localStorage/IndexedDB)
- **File Watching**: Node.js fs.watch + chokidar (for cross-platform reliability)
- **Git Integration**: simple-git library (optional, lightweight)
- **Autocomplete**: Monaco's built-in IntelliSense + TypeScript language service

**Key Technical Decisions:**
1. **Diff View Implementation**:
   - Use Monaco's DiffEditor component (built-in, optimized)
   - Show diff in dedicated panel or overlay on editor
   - Diff calculation server-side (main process) for performance
   - Rationale: Leverage Monaco's mature diff engine, avoid reimplementation

2. **Change Management Workflow**:
   - AI proposes change → shown in diff view → user accepts/rejects → applied to file
   - Pending changes stored in memory (not written to disk until accepted)
   - All changes reversible through undo system
   - Rationale: Non-destructive workflow, user maintains control

3. **Undo System Architecture**:
   - Store before/after snapshots for each file modification
   - Limit to 50 changes per file (configurable)
   - Persist to IndexedDB for cross-session history
   - Undo stack per file, not global (clearer UX)
   - Rationale: Balance memory usage with functionality, file-level granularity clearer for users

4. **File Explorer Enhancement Approach**:
   - React component with context menu library (react-contextmenu or custom)
   - Drag-drop via React DnD or native HTML5 drag-drop
   - Search via fuzzy matching (fuse.js or custom)
   - Rationale: Standard React patterns, proven libraries, maintainable

5. **Advanced Editor Features Integration**:
   - Use Monaco's built-in APIs for folding, find, autocomplete
   - Minimal custom code - configure Monaco, don't reimplement
   - Breadcrumbs via Monaco's experimental APIs or custom
   - Rationale: Monaco designed for these features, don't reinvent wheel

**Performance Targets:**
- **Diff View Rendering**: < 200ms for typical files (< 1,000 lines), < 1 second for large files (< 10,000 lines)
- **Change Accept/Reject**: < 50ms to apply change and refresh editor
- **File Explorer Search**: < 100ms for fuzzy search in 1,000+ files
- **Undo Operation**: < 100ms to restore previous file state
- **Code Folding**: < 50ms to collapse/expand code blocks
- **Find/Replace**: < 200ms to find in file, < 2 seconds across all open files

## Compliance and Security

**Security Requirements:**
- **Undo History Security**: No sensitive data logged in undo history (or encrypt history)
- **Drag-Drop Validation**: Validate file move operations to prevent directory traversal
- **Git Integration**: No git credentials stored; use system git config only
- **File Operations**: All explorer operations go through existing permission system
- **Data Integrity**: Undo operations must be 100% reliable (no partial restores)

**Compliance Requirements:**
- **SOC Traceability**: Log all file operations (rename, delete, move) to SOC
  - Operations logged: file explorer context menu actions, drag-drop moves, undo/redo
  - Include: timestamp, operation type, file paths, user action, result
- **Audit Trail**: Change history provides complete record of AI modifications
  - Required for enterprise compliance and debugging
  - History must be exportable or queryable
- **User Control**: All destructive operations (delete, move) require confirmation
  - Undo available for accidental operations

**Privacy Considerations:**
- Undo history stored locally only (not uploaded to any server)
- Change history may contain file contents - stored securely in IndexedDB
- Git status information read-only from local git repository

## Timeline and Milestones

| Milestone | Target Date | Description |
|-----------|-------------|-------------|
| Epic 5 Start | Week 1, Day 1 | Begin Feature 5.1 (Diff View) |
| Feature 5.1 Complete | Week 1, Day 5 | Diff view working with side-by-side and inline modes |
| Feature 5.2 Complete | Week 2, Day 3 | Change management system operational |
| Feature 5.3 Complete | Week 2, Day 5 | Undo system and history browser complete |
| Feature 5.4 Complete | Week 3, Day 3 | Advanced editor features integrated |
| Feature 5.5 Complete | Week 3, Day 5 | Enhanced file explorer functional |
| Integration Testing | Week 4, Days 1-2 | Test all features together, fix integration issues |
| Beta Testing | Week 4, Days 3-4 | Lighthouse team validates advanced features |
| Epic 5 Complete | Week 4, Day 5 | All exit criteria met, ready for Phase 6 |

**Buffer**: 3-4 days built into 3-4 week estimate for complexity

**Dependencies on Timeline:**
- Feature 5.1 must complete before Feature 5.2 (change management needs diff view)
- Feature 5.3 can start in parallel with Feature 5.2
- Feature 5.4 and 5.5 are independent, can proceed in parallel
- Integration testing requires all features complete

## Resources Required

- **Development**: 1-2 full-stack developers (React + TypeScript + Monaco expertise)
- **Monaco Expertise**: Developer familiar with Monaco Editor advanced APIs or time to learn (2-3 days)
- **Testing**: Lighthouse development team for beta testing (10-15 users)
- **Test Cases**: Variety of file types, sizes, and diff scenarios
- **Documentation**: Update user guide with advanced features and workflows

**Skill Requirements:**
- Monaco Editor advanced APIs (DiffEditor, IntelliSense, language services)
- React performance optimization (virtualization, memoization)
- State management complexity (Zustand with persistence)
- IndexedDB or localStorage for history persistence
- File system watching and event handling
- Diff algorithms and visualization
- UX design for complex workflows (change management)

## Related Documentation

- Product Vision: Docs/architecture/_main/01-Product-Vision.md (Section: Visual First principle)
- Product Plan: Docs/architecture/_main/02-Product-Plan.md (Section: Phase 5 deliverables)
- Business Requirements: Docs/architecture/_main/03-Business-Requirements.md (FR-3, FR-7)
- Architecture: Docs/architecture/_main/04-Architecture.md (Editor architecture)
- User Experience: Docs/architecture/_main/05-User-Experience.md (Diff view UX)
- DEVELOPMENT-PHASES.md: Phase 5 detailed breakdown

## Architecture Decision Records (ADRs)

{Links to related ADRs will be added here during Epic planning}

Potential ADRs for this Epic:
- ADR-XXX: Diff View Implementation (Monaco DiffEditor vs. Custom)
- ADR-XXX: Change Management Workflow (Staged vs. Immediate Application)
- ADR-XXX: Undo System Architecture (File-Level vs. Global Stack)
- ADR-XXX: File Explorer Enhancement Strategy (Library Choices)
- ADR-XXX: History Persistence Approach (IndexedDB vs. localStorage)

---

**Epic Status:** Planning
**Template Version:** 1.0
**Last Updated:** 2026-01-19
