# Epic 1: Desktop Foundation with Basic UI

## Epic Overview
- **Epic ID:** Epic-1
- **Status:** ✅ Complete
- **Duration:** 3-4 weeks
- **Team:** 1-2 developers
- **Priority:** Critical (P0)
- **Phase:** Phase 1

## Problem Statement

Lighthouse Chat IDE requires a solid desktop foundation before AI capabilities can be integrated. Currently, there is no application shell, file explorer, or code editor - just planning documents. Without this foundation, we cannot proceed with AI integration (Phase 2) or file operation tools (Phase 3).

This Epic addresses the need for:
- **Cross-platform desktop application** running on macOS, Windows, and Linux
- **Professional IDE interface** with file explorer and code editor that developers expect
- **Three-panel layout** that provides visual context for conversational development
- **Manual IDE operations** (open, edit, save files) to validate the foundation before adding AI

**References:**
- Product Vision (01-Product-Vision.md): "Visual First, Conversational Always" principle requires complete IDE context
- Business Requirements (03-Business-Requirements.md): FR-2 (File Explorer), FR-3 (Code Editor), FR-8 (Three-Panel Layout)
- Architecture (04-Architecture.md): Electron application architecture with main/renderer processes

## Goals and Success Criteria

**Primary Goal**: Create a working Electron desktop application with file explorer, Monaco code editor, and three-panel layout that can be manually tested.

**Success Metrics:**
- Application launches successfully on macOS, Windows, and Linux
- File explorer displays directory tree with 1000+ files without performance issues
- Monaco editor opens files with correct syntax highlighting for 20+ languages
- Multiple files (10+) can be open in tabs simultaneously
- Manual editing and saving works without data loss or corruption
- Application runs for 8+ hour sessions without crashes
- IPC communication latency < 50ms for typical operations
- UI remains responsive (60 FPS) during file operations

**Exit Criteria** (must achieve to proceed to Phase 2):
- User (Roy Love) can:
  - Open Lighthouse Chat IDE on their development machine
  - Select a root directory (e.g., existing project)
  - Navigate file tree by expanding/collapsing folders
  - Click files to open them in Monaco editor
  - See syntax highlighting appropriate to file type
  - Edit file contents manually (typing, deleting, copy/paste)
  - Save changes with Ctrl+S/Cmd+S
  - Open multiple files in separate tabs
  - Switch between tabs
  - Close tabs
- No P0 bugs (crashes, data loss, broken core features)
- Application is stable enough for daily manual testing

## Scope

### In Scope
- **Electron Application Setup**:
  - Electron + Vite + React + TypeScript project structure
  - Development and build configuration
  - Cross-platform packaging setup (macOS, Windows, Linux)
  - Hot module replacement (HMR) for development

- **Main Process (Node.js)**:
  - Window manager (create, show, hide windows)
  - File system service (read directory, read file, write file)
  - IPC handlers for renderer ↔ main communication
  - Project structure following SOLID principles

- **Renderer Process (React UI)**:
  - Three-panel layout component (resizable panels)
  - File explorer panel (left - 20% width) with tree view
  - Monaco editor panel (center - 45% width) with tabs
  - Chat placeholder panel (right - 35% width) - empty for Phase 1
  - Zustand state management stores
  - Note: Panels will be moveable in Phase 6 per FR-8

- **File Explorer Component**:
  - Tree view display of directory structure
  - Expand/collapse folders on click
  - File type icons for common languages
  - Click file to open in editor
  - Performance: lazy loading for large directories

- **Monaco Editor Component**:
  - Monaco Editor React integration
  - Syntax highlighting for 20+ languages (JS, TS, Python, Java, Go, etc.)
  - Tab management (open, close, switch tabs)
  - Manual editing (typing, selection, copy/paste)
  - Save functionality (Ctrl+S/Cmd+S)
  - Unsaved changes indicator (* in tab)
  - Line numbers and basic editor features

- **Panel Resizing**:
  - Draggable dividers between panels
  - Minimum/maximum panel widths (15%-70%)
  - Persist panel sizes to local storage

- **Development Environment**:
  - Node.js and pnpm installation
  - TypeScript configuration (strict mode)
  - ESLint and Prettier setup
  - Git repository structure
  - README with setup instructions

### Out of Scope (Future Phases)
- ❌ AI chat interface (Phase 2)
- ❌ AIChatSDK integration (Phase 2)
- ❌ File operation tools (read, write, edit, delete, glob, grep, bash) (Phase 3)
- ❌ Permission system (Phase 2-3)
- ❌ Multi-provider AI support (Phase 4)
- ❌ Diff view (Phase 5)
- ❌ Advanced editor features (code folding, autocomplete) (Phase 5)
- ❌ Enhanced file explorer (context menus, drag-drop, search) (Phase 5)
- ❌ Status bar (Phase 6)
- ❌ Keyboard shortcuts system (Phase 6)
- ❌ Themes (Phase 6)
- ❌ Settings UI (Phase 4)
- ❌ Web version (Future)
- ❌ Automated tests (Future)

## Planned Features

This Epic will be broken down into the following Features (detailed plans via `/design-features`):

- **Feature 1.1: Development Environment Setup** - Configure Node.js, pnpm, TypeScript, linting, and project structure
- **Feature 1.2: Electron Application Shell** - Create Electron main process, window management, and basic IPC
- **Feature 1.3: Three-Panel Layout** - Build resizable three-panel layout with React
- **Feature 1.4: File Explorer Component** - Implement tree view file explorer with directory navigation
- **Feature 1.5: Monaco Editor Integration** - Integrate Monaco Editor with tabs and manual editing
- **Feature 1.6: File Operations Bridge** - Connect file explorer to editor via IPC for open/save operations

## Dependencies

### Prerequisites (must complete before this Epic):
- ✅ Product planning complete (Vision, Plan, Requirements, Architecture, UX documents)
- ✅ Architecture decision made (Custom Electron IDE vs. Extension/Fork)
- ✅ Technology stack confirmed (Electron + React + TypeScript + Zustand + Monaco + Vite)
- ⏳ Development machine with Node.js 18+ and pnpm installed
- ⏳ Git repository created and accessible

### Enables (this Epic enables):
- **Phase 2 (Epic 2)**: AI Integration with AIChatSDK - requires working desktop app shell
- **Phase 3 (Epic 3)**: File Operation Tools - requires file explorer and IPC foundation
- **All subsequent phases** - this is the foundation for everything

### External Dependencies:
- **Node.js**: LTS version (18.x or later) required
- **Electron**: Latest stable (v28+ as of Jan 2026)
- **Monaco Editor**: @monaco-editor/react package from npm
- **React**: v18+ with TypeScript support
- **Vite**: v5+ for build tooling
- **pnpm**: v8+ for package management
- **Operating Systems**: Developer machines running macOS, Windows, or Linux

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Electron complexity delays Phase 1** | High - blocks all subsequent phases | Medium - Electron has learning curve | Use electron-vite boilerplate for quick start; leverage VS Code open-source patterns; allocate 1 week buffer in timeline |
| **Monaco Editor performance issues** | Medium - poor editor hurts UX | Low - Monaco powers VS Code successfully | Set file size limits (1MB soft, 10MB hard); test with large files early; use Monaco's built-in virtualization |
| **IPC communication bugs** | High - breaks main/renderer integration | Low - Electron IPC is mature | Follow Electron security best practices; validate all IPC messages; add error handling early |
| **File explorer performance with large directories** | Medium - slow navigation frustrates users | Medium - depends on codebase size | Implement lazy loading (load folders only when expanded); use virtualization for 1000+ files; test with large repos early |
| **Cross-platform packaging issues** | Medium - delays deployment to Windows/Linux | Medium - each OS has quirks | Test on all 3 platforms weekly; use electron-builder with standard configs; address platform-specific issues incrementally |
| **Team onboarding delay** | Medium - slower start if new to Electron/React | Medium - depends on team experience | Provide clear setup documentation; pair programming for Electron concepts; reference architecture document |

## Technical Considerations

### High-Level Architecture

**Electron Multi-Process Architecture**:
```
┌─────────────────────────────────────────────────┐
│ Main Process (Node.js)                          │
│ - Window Manager                                │
│ - File System Service                           │
│ - IPC Handlers                                  │
└─────────────────────────────────────────────────┘
                    ↕ IPC
┌─────────────────────────────────────────────────┐
│ Renderer Process (React + Chromium)             │
│ ┌─────────────┬─────────────┬─────────────┐    │
│ │ File        │ Code Editor │ Chat        │    │
│ │ Explorer    │ (Monaco)    │ (Placeholder)│   │
│ │             │             │             │    │
│ │ (Zustand)   │ (Zustand)   │ (Phase 2)   │    │
│ └─────────────┴─────────────┴─────────────┘    │
└─────────────────────────────────────────────────┘
```

### Technology Stack (Phase 1)

**Core Technologies**:
- **Electron**: v28+ (desktop framework)
- **React**: v18+ (UI framework, hooks only)
- **TypeScript**: v5+ strict mode (type safety)
- **Vite**: v5+ (build tool with HMR)
- **Zustand**: v4+ (state management)
- **Monaco Editor**: @monaco-editor/react (code editing)
- **pnpm**: v8+ (package manager)

**Styling**:
- **TailwindCSS**: Utility-first CSS framework
- **CSS Modules**: Component-scoped styles (optional, for complex components)

**Code Quality**:
- **ESLint**: TypeScript + React rules
- **Prettier**: Code formatting
- **TypeScript strict mode**: No implicit any, strict null checks

### SOLID Principles Application

**Single Responsibility**:
- `WindowManager`: Only manages Electron windows
- `FileSystemService`: Only handles file I/O
- `FileExplorerStore`: Only manages file explorer state
- `EditorStore`: Only manages editor state

**Open/Closed**:
- Service interfaces allow extension without modification
- Zustand stores can be extended with new actions

**Liskov Substitution**:
- All IPC handlers follow consistent request/response patterns
- Services implement well-defined interfaces

**Interface Segregation**:
- Separate IPC channels for file system, editor, window management
- Stores expose only necessary methods to components

**Dependency Inversion**:
- Components depend on store abstractions (Zustand hooks), not concrete implementations
- Main process services use dependency injection pattern

### Performance Targets

- **Application Launch**: < 3 seconds cold start, < 1 second warm start
- **File Explorer**: Display 1000+ files without lag, virtualized scrolling
- **Monaco Editor**: Open files < 200ms, syntax highlighting < 50ms
- **IPC Latency**: < 50ms for typical operations (read file, read directory)
- **UI Responsiveness**: 60 FPS during normal operations, no blocking
- **Memory Usage**: < 500MB for typical usage (10 files open)

### Security Considerations

**Electron Security Best Practices**:
- ✅ Context isolation enabled (`contextIsolation: true`)
- ✅ Node integration disabled in renderer (`nodeIntegration: false`)
- ✅ Sandbox enabled (`sandbox: true`)
- ✅ IPC exposed only through preload script with contextBridge
- ✅ CSP (Content Security Policy) headers configured
- ✅ File path validation in main process (prevent directory traversal)

**File System Security**:
- Validate all file paths before operations
- Restrict operations to project root directory
- No access to parent directories or system files
- Safe handling of symlinks

## Compliance and Security

**Phase 1 Compliance Requirements**:
- ✅ **Code Quality**: TypeScript strict mode, ESLint, Prettier
- ✅ **Security**: Electron security checklist (context isolation, sandbox, no nodeIntegration)
- ✅ **Accessibility**: Basic keyboard navigation (Tab, Enter, Escape)
- ⏳ **WCAG 2.1**: Full compliance in Phase 6, basic support in Phase 1
- ⏳ **SOC Logging**: Not applicable in Phase 1 (no AI operations yet)
- ⏳ **PCI/HIPAA**: Not applicable in Phase 1 (no data processing yet)

**Anti-Hardcoding**:
- No hardcoded file paths (use user-selected root directory)
- No hardcoded API keys (not applicable in Phase 1)
- Configuration stored in Electron userData directory
- Environment-specific configs via Vite environment variables

**Development Best Practices** (from development-best-practices skill):
- ✅ Anti-hallucination: All file operations have error handling, no assumptions about file existence
- ✅ Security: Electron security best practices enforced
- ✅ Logging: Console logging in development, structured logging framework ready for production
- ✅ Testing: Manual testing in Phase 1, automated testing framework ready for Phase 2+
- ✅ Error Handling: All IPC calls wrapped in try-catch, user-friendly error messages

## Timeline and Milestones

| Milestone | Target Date | Description |
|-----------|-------------|-------------|
| **Epic Start** | Week 1, Day 1 | Development environment setup begins |
| **Dev Environment Ready** | Week 1, Day 3 | Node.js, pnpm, project scaffolded, first dev server running |
| **Electron Shell Running** | Week 1, Day 5 | Electron window opens, basic IPC working |
| **Three-Panel Layout** | Week 2, Day 2 | Resizable panels display, basic styling |
| **File Explorer Functional** | Week 2, Day 5 | Tree view displays files, expand/collapse works |
| **Monaco Editor Integrated** | Week 3, Day 3 | Editor displays files, syntax highlighting works |
| **File Open/Save Working** | Week 3, Day 5 | Click file → opens in editor, Ctrl+S saves |
| **Tab Management** | Week 4, Day 2 | Multiple files in tabs, switch/close tabs works |
| **Polish & Testing** | Week 4, Day 3-5 | Fix bugs, performance tuning, cross-platform testing |
| **Epic Complete** | Week 4, Day 5 | All exit criteria met, ready for Phase 2 |

**Timeline Assumptions**:
- 1-2 developers working full-time
- No major blockers or technical unknowns
- Standard working hours (8 hours/day, 5 days/week)
- 1 week buffer built into 3-4 week estimate

## Resources Required

- **Developers**: 1-2 full-stack developers with React/TypeScript experience
- **Development Machines**:
  - MacBook or Mac Mini for macOS testing
  - Windows PC or VM for Windows testing
  - Linux VM for Linux testing (or use CI/CD)
- **Software Licenses**: None (all open-source tools)
- **Cloud Services**: None (local development only in Phase 1)
- **Time Commitment**: 3-4 weeks × 1-2 developers = 120-320 developer hours

## Related Documentation

- **Product Vision**: Docs/architecture/_main/01-Product-Vision.md
- **Product Plan**: Docs/architecture/_main/02-Product-Plan.md (Section: Development Phases → Phase 1)
- **Business Requirements**: Docs/architecture/_main/03-Business-Requirements.md (FR-2, FR-3, FR-8)
- **Architecture**: Docs/architecture/_main/04-Architecture.md (Section: Main Process Architecture, Renderer Process Architecture)
- **User Experience**: Docs/architecture/_main/05-User-Experience.md (Section: UI Specifications)
- **Architecture Decision**: Docs/architecture/_main/ARCHITECTURE-DECISION-CUSTOM-IDE-VS-EXTENSION.md

## Architecture Decision Records (ADRs)

The following ADRs document major architectural decisions for Epic 1:

- **[ADR-001: Electron as Desktop Framework](../../architecture/decisions/ADR-001-electron-as-desktop-framework.md)** - Decision to use Electron for cross-platform desktop application
- **[ADR-002: React + TypeScript for UI](../../architecture/decisions/ADR-002-react-typescript-for-ui.md)** - Decision to use React 18+ with TypeScript strict mode for renderer process
- **[ADR-003: Zustand for State Management](../../architecture/decisions/ADR-003-zustand-for-state-management.md)** - Decision to use Zustand for lightweight state management
- **[ADR-004: Monaco Editor Integration](../../architecture/decisions/ADR-004-monaco-editor-integration.md)** - Decision to use Monaco Editor for code editing component
- **[ADR-005: Vite as Build Tool](../../architecture/decisions/ADR-005-vite-as-build-tool.md)** - Decision to use Vite with electron-vite for building application

---

**Epic Created By**: Claude Sonnet 4.5 (Product Manager Agent)
**Created Date**: 2026-01-19
**Last Updated**: 2026-01-19
**Template Version**: 1.0
