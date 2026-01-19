# Lighthouse Chat IDE: Project Requirements Document

**Version:** 1.0
**Date:** January 18, 2026
**Status:** Planning Phase
**Project Codename:** Beacon

---

## Document Purpose

This document serves as the single source of truth for Lighthouse Chat IDE requirements. It consolidates product vision, technical specifications, functional requirements, and success criteria from all planning documents.

**Reference Documents:**
- Product Summary: `/Docs/planning/PRODUCT-SUMMARY.md`
- Development Phases: `/Docs/planning/DEVELOPMENT-PHASES.md`
- Phase 1 Architecture: `/Docs/planning/PHASE-1-ARCHITECTURE.md`

---

## Executive Summary

**What:** An AI-powered desktop IDE that enables natural language interaction with codebases through conversational file operations.

**Why:** Modern development requires intuitive tools that lower the barrier between intent and execution. Developers spend significant time navigating codebases, performing repetitive tasks, and maintaining consistency.

**How:** Visual IDE with three-panel layout (file explorer, chat interface, code editor) powered by AIChatSDK for multi-provider AI support, with real-time visual feedback and permission-controlled file operations.

**MVP Definition:** Phase 3 completion - Desktop IDE with file explorer, Monaco editor, AI chat, and complete file operation toolset (read, write, edit, delete, glob, grep, bash).

---

## Product Vision

### Core Concept

Lighthouse Chat IDE provides a chat interface where developers interact with their codebase through conversation. Instead of manually navigating files and making edits, users describe what they want, and the AI performs the operations using specialized file manipulation tools.

### Primary Goals

1. **Intuitive Development:** Make code development conversational and accessible
2. **Visual Context:** Provide complete visual IDE experience unlike terminal-based tools
3. **Multi-Provider AI:** Support multiple AI providers (Claude, GPT, Gemini, Ollama)
4. **Safety & Control:** Permission system with transparent, controllable operations
5. **Ecosystem Integration:** Deep integration with Lighthouse framework (SOC, compliance, waves)

### Differentiation

**vs Claude Code CLI:**
- ✅ Full graphical IDE (file explorer, integrated editor, diff views)
- ✅ Multi-provider AI support (not just Anthropic)
- ✅ Lighthouse ecosystem integration (SOC, waves, compliance)
- ✅ Desktop + web deployment (future)

**Goal:** Not to compete with Claude Code, but to provide richer visual experience integrated with Lighthouse workflows.

---

## Functional Requirements

### FR-1: Natural Language File Operations

**Description:** Users can perform file operations through conversational interaction.

**Capabilities:**
- Read files (full or line ranges)
- Create new files
- Edit existing code (find & replace)
- Delete files or directories
- Search for files (glob patterns)
- Search content (grep)
- Execute shell commands (sandboxed)

**Example Interactions:**
- "Read the authentication module and explain how it works"
- "Create a new user service that handles registration and login"
- "Find all API endpoints and update them to use the new error handling pattern"
- "Refactor the database connection to use connection pooling"

**Priority:** P0 (Critical - Core functionality)

---

### FR-2: Visual File Explorer

**Description:** VS Code-style file explorer showing complete directory structure.

**Capabilities:**
- Tree view with expand/collapse navigation
- File type icons
- Click to open files in editor
- Real-time updates when AI creates/modifies files
- Root directory selection
- Context menus (Phase 5: rename, delete, new file)
- Search functionality (Phase 5)
- Visual indicators for modified files (Phase 5)

**Priority:** P0 (Critical - Core UI component)

---

### FR-3: Code Editor with Monaco

**Description:** Integrated code editor for viewing and manually editing files.

**Capabilities (Phase 1 - Basic):**
- Monaco Editor integration (VS Code engine)
- Tabbed interface for multiple open files
- Syntax highlighting for major languages
- Line numbers
- Manual editing (type, delete, save)
- Save functionality (Ctrl+S / Cmd+S)
- Tab management (open, close, switch)

**Capabilities (Phase 5 - Advanced):**
- Diff view for AI-proposed changes
- Accept/reject controls
- Side-by-side or inline diff
- Code folding
- Go-to-line functionality
- Find and replace within files
- Autocomplete and IntelliSense
- Minimap

**Priority:** P0 (Critical - Core UI component)

---

### FR-4: AI Chat Interface

**Description:** Conversational interface for interacting with AI.

**Capabilities (Phase 2):**
- Message history display
- User input field
- Streaming response visualization
- Clear distinction between user and AI messages
- File operation highlighting with clickable links
- Inline code blocks with syntax highlighting
- Auto-scroll to latest message
- Conversation history persistence

**Capabilities (Phase 4):**
- New conversation button
- Conversation save/load
- Conversation search/filtering
- Provider selection UI

**Priority:** P0 (Critical - Core functionality)

---

### FR-5: Multi-Provider AI Support

**Description:** Support multiple AI providers with seamless switching.

**Supported Providers:**
- Anthropic Claude (Phase 2 - Initial)
- OpenAI GPT (Phase 4)
- Google Gemini (Phase 4)
- Ollama local models (Phase 4)

**Capabilities:**
- Provider abstraction through AIChatSDK
- Per-provider configuration (API keys, model selection)
- Seamless provider switching
- Same tool set works across all providers

**Priority:** P1 (High - Key differentiator)

---

### FR-6: Permission and Safety System

**Description:** Control and approve AI file operations.

**Capabilities (Phase 2 - Basic):**
- Approve/deny tool operations
- Basic logging of all operations

**Capabilities (Phase 3 - Enhanced):**
- Per-tool permission controls
- Directory sandboxing (restrict AI to specific folders)
- Dangerous operation warnings (delete, bash)
- Approve/deny prompts in UI
- Safety checks (prevent operations outside project)

**Priority:** P0 (Critical - Security requirement)

---

### FR-7: Real-Time Visual Feedback

**Description:** Visual updates as AI performs operations.

**Capabilities:**
- New files appear immediately in file explorer
- Modified files refresh in editor
- File operation results displayed in chat
- Clickable file links in chat (jump to file in editor)
- Visual indicators when AI modifies files
- Diff view for changes (Phase 5)

**Priority:** P0 (Critical - Core UX)

---

### FR-8: Three-Panel Layout

**Description:** Familiar IDE layout with resizable panels.

**Capabilities (Phase 1):**
- Left: File explorer panel
- Center: Chat interface panel (placeholder in Phase 1)
- Right: Code editor panel
- Panel resizing capability
- Basic styling

**Capabilities (Phase 6):**
- Layout presets (different panel arrangements)
- Tab dragging between panels
- Panel show/hide toggle
- Layout persistence across sessions
- Fullscreen mode

**Priority:** P0 (Critical - Core UI structure)

---

### FR-9: Tool Execution Loop

**Description:** Automatic cycle for AI tool calling.

**Flow:**
1. AI suggests operations
2. System executes approved tools
3. Results feed back to AI
4. Conversation continues

**Capabilities:**
- Tool calling infrastructure using AIChatSDK
- Permission checks before execution
- Result formatting and display
- Error handling and retry logic
- Multi-step workflow support

**Priority:** P0 (Critical - Core architecture)

---

### FR-10: Context Understanding

**Description:** AI maintains awareness of conversation history.

**Capabilities:**
- Multi-turn conversation management
- Reference to previous operations
- Context-aware responses
- Conversation persistence

**Example:**
- User: "Read the authentication module"
- AI: [Reads and explains]
- User: "Now edit that file to add logging"
- AI: [Knows which file was just read]

**Priority:** P0 (Critical - Core functionality)

---

## Technical Requirements

### TR-1: Technology Stack

**Core Technologies:**
- **Language:** TypeScript (strict mode)
- **Desktop:** Electron (latest stable)
- **Build Tool:** Vite (fast, modern, Electron support)
- **UI Framework:** React 18+ (hooks-based, functional components)
- **State Management:** Zustand (lightweight, no boilerplate)
- **Styling:** TailwindCSS + CSS Modules
- **Editor:** Monaco Editor (@monaco-editor/react)
- **Package Manager:** pnpm (fast, efficient, workspace support)

**AI Integration:**
- **SDK:** AIChatSDK (local clone in adjacent directory)
- **Providers:** Anthropic, OpenAI, Google, Ollama

**Development Tools:**
- **Linting:** ESLint + Prettier
- **Testing:** Vitest + React Testing Library
- **Type Checking:** TypeScript strict mode

**Priority:** P0 (Critical - Foundation)

---

### TR-2: Project Structure

**Required Organization:**

```
lighthouse-beacon/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts
│   │   ├── window-manager.ts
│   │   ├── ipc/                 # IPC handlers
│   │   └── services/            # Main process services
│   │
│   ├── renderer/                # Electron renderer process
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── components/          # React components
│   │   ├── services/            # Frontend services
│   │   ├── stores/              # Zustand stores
│   │   ├── hooks/               # Custom React hooks
│   │   └── types/               # TypeScript types
│   │
│   ├── shared/                  # Shared between main/renderer
│   │   ├── types/
│   │   ├── constants/
│   │   └── interfaces/
│   │
│   └── preload/                 # Electron preload scripts
│       └── index.ts
│
├── Docs/                        # Documentation
├── .claude/                     # Claude configuration
├── .lighthouse/                 # Lighthouse templates
└── [config files]
```

**Priority:** P0 (Critical - Architecture)

---

### TR-3: SOLID Principles

**Application:**

**Single Responsibility Principle (SRP):**
- FileExplorer: Only handles directory tree display
- EditorPanel: Only handles file editing
- LayoutManager: Only handles panel positioning
- FileSystemService: Only handles file I/O
- IPCBridge: Only handles main/renderer communication

**Open/Closed Principle (OCP):**
- Plugin architecture for Phase 2 AI services
- Event system for component communication
- Provider pattern for file operations
- Strategy pattern for editor behaviors

**Liskov Substitution Principle (LSP):**
- IFileSystemProvider: Any implementation works
- IEditorProvider: Monaco can be swapped
- IPanelComponent: All panels implement same interface

**Interface Segregation Principle (ISP):**
- IReadableFileSystem: Only read operations
- IWritableFileSystem: Only write operations
- IFileWatcher: Only file watching

**Dependency Inversion Principle (DIP):**
- UI components depend on service interfaces
- Services injected via dependency injection
- Easy to mock for testing
- Easy to swap implementations

**Priority:** P0 (Critical - Code quality)

---

### TR-4: AIChatSDK Integration

**Requirements:**
- Import local AIChatSDK clone (../AIChatSDK)
- Configure for Electron environment
- Set up provider configuration
- API key management and secure storage
- Error handling for AI communication
- Streaming response support
- SOC logging (built-in)
- Compliance scanning (built-in)

**Integration Points:**
- Main process: Service coordination
- Renderer process: UI integration
- IPC: Communication bridge
- Services: Tool execution

**Priority:** P0 (Critical - AI functionality)

---

### TR-5: IPC Communication

**Channel Structure:**

```typescript
IPC_CHANNELS = {
  // File System (Phase 1)
  FS_READ_DIRECTORY: 'fs:readDirectory',
  FS_READ_FILE: 'fs:readFile',
  FS_WRITE_FILE: 'fs:writeFile',
  FS_DELETE_FILE: 'fs:deleteFile',

  // AI Service (Phase 2)
  AI_SEND_MESSAGE: 'ai:sendMessage',
  AI_STREAM_MESSAGE: 'ai:streamMessage',

  // File Operations (Phase 3)
  TOOL_READ: 'tool:read',
  TOOL_WRITE: 'tool:write',
  TOOL_EDIT: 'tool:edit',
  TOOL_GLOB: 'tool:glob',
  TOOL_GREP: 'tool:grep',
  TOOL_BASH: 'tool:bash',
}
```

**Requirements:**
- Type-safe IPC communication
- Error handling and validation
- Security checks
- Result formatting

**Priority:** P0 (Critical - Architecture)

---

### TR-6: State Management

**Zustand Stores:**

1. **FileExplorerStore:**
   - Root path
   - Expanded folders
   - Selected file
   - Directory tree
   - Actions: setRootPath, toggleFolder, selectFile, refreshTree

2. **EditorStore:**
   - Open files map
   - Active file ID
   - Unsaved changes set
   - Actions: openFile, closeFile, saveFile, updateContent, setActiveFile

3. **LayoutStore:**
   - Panel sizes (left, center, right percentages)
   - Actions: updatePanelSize, resetLayout

4. **ChatStore (Phase 2):**
   - Message history
   - Streaming state
   - Active conversation ID
   - Actions: sendMessage, receiveMessage, startNewConversation

**Priority:** P0 (Critical - State management)

---

### TR-7: Security and Safety

**Requirements:**

**Sandboxing:**
- Prevent operations outside project directory
- Path validation
- Security checks before execution

**Permission System:**
- Approve/deny UI for operations
- Per-tool permission controls
- Dangerous operation warnings

**API Key Security:**
- Secure storage (Electron safeStorage)
- Never log API keys
- Environment variable support

**Input Validation:**
- Sanitize file paths
- Validate tool parameters
- Prevent command injection

**Priority:** P0 (Critical - Security)

---

### TR-8: Performance

**Requirements:**

**File Operations:**
- Fast file reading (<100ms for typical files)
- Efficient directory tree building
- Lazy loading for large directories

**UI Responsiveness:**
- No blocking operations on UI thread
- Smooth panel resizing
- Fast tab switching
- Debounced search

**AI Streaming:**
- Efficient streaming response handling
- Incremental UI updates
- No memory leaks

**Editor Performance:**
- Monaco handles large files efficiently
- Syntax highlighting doesn't block UI
- Fast save operations

**Priority:** P1 (High - User experience)

---

### TR-9: Error Handling

**Requirements:**

**Graceful Failure:**
- User-friendly error messages
- Clear error states in UI
- Recovery suggestions

**Error Categories:**
- File system errors (not found, permission denied)
- AI communication errors (timeout, rate limit)
- Tool execution errors (invalid parameters)
- IPC communication errors

**Logging:**
- Console logging for development
- File logging (future)
- Error reporting (future)

**Priority:** P0 (Critical - Reliability)

---

### TR-10: Extension Points

**Architecture must support:**

**Phase 2 Extensions:**
- AI service plug-in
- Chat interface integration
- No changes to Phase 1 code

**Phase 3 Extensions:**
- File operation tools plug-in
- Visual integration updates
- No major refactoring

**Phase 4+ Extensions:**
- Multi-provider support
- Settings system
- Advanced editor features

**Priority:** P0 (Critical - Future-proofing)

---

## Non-Functional Requirements

### NFR-1: Usability

- Intuitive UI matching VS Code conventions
- Clear visual feedback for all operations
- Keyboard shortcuts for common actions
- Accessible design (WCAG compliance - Phase 6)
- Responsive layout

**Priority:** P0 (Critical - User experience)

---

### NFR-2: Reliability

- Stable application (no crashes)
- Data integrity (file operations don't corrupt)
- Graceful error recovery
- Auto-save for unsaved changes (Phase 6)
- Conversation persistence

**Priority:** P0 (Critical - Trust)

---

### NFR-3: Maintainability

- SOLID principles throughout
- Clear module boundaries
- Comprehensive TypeScript types
- Self-documenting code
- Consistent code style (ESLint + Prettier)

**Priority:** P0 (Critical - Long-term success)

---

### NFR-4: Testability

- Services easily mockable
- Component isolation
- Unit test coverage targets (future)
- Integration test strategy (future)

**Priority:** P1 (High - Quality)

---

### NFR-5: Scalability

- Architecture supports future web version
- Code sharing between desktop and web
- Plugin architecture for extensions
- Multi-workspace support (future consideration)

**Priority:** P2 (Medium - Future)

---

## Development Phases (Summary)

### Phase 1: Desktop Foundation with Basic UI
**MVP Milestone 1:** Working Electron app with file explorer and Monaco editor
- Electron setup
- File explorer (tree view, expand/collapse, click to open)
- Monaco editor (syntax highlighting, tabs, save)
- Three-panel layout with resizing

**Duration:** Foundation phase
**Priority:** P0

---

### Phase 2: AI Integration with AIChatSDK
**MVP Milestone 2:** AI chat interface with streaming
- AIChatSDK integration
- Chat interface (messages, streaming, history)
- Basic tool calling framework
- Permission system
- Anthropic Claude provider

**Duration:** After Phase 1
**Priority:** P0

---

### Phase 3: File Operation Tools Implementation
**MVP COMPLETE:** Full AI-driven file operations
- Core tools: read, write, edit, delete
- Search tools: glob, grep
- Bash tool (sandboxed)
- Visual integration (file links, explorer updates)
- Permission enhancements

**Duration:** After Phase 2
**Priority:** P0

---

### Phase 4: Multi-Provider and Enhanced Features
**Enhanced Product:** Multiple AI providers
- OpenAI, Gemini, Ollama support
- Settings UI
- Conversation save/load
- Performance optimizations

**Duration:** After Phase 3
**Priority:** P1

---

### Phase 5: Advanced Editor Features
**Professional Product:** Sophisticated editor
- Diff view with accept/reject
- Change management
- Advanced editor features
- Enhanced file explorer

**Duration:** After Phase 4
**Priority:** P1

---

### Phase 6: Polish and Usability Improvements
**Polished Product:** Production-ready UX
- Professional styling
- Keyboard shortcuts
- Layout customization
- Status bar and notifications

**Duration:** After Phase 5
**Priority:** P2

---

### Future Enhancements (Deprioritized)
- Web deployment
- Production readiness (testing, docs, security audit)

---

## Success Criteria

### Phase 1 Success (Desktop Foundation)
- ✅ Application launches and runs stably
- ✅ File explorer displays directory structure correctly
- ✅ Folders expand/collapse properly
- ✅ Files open in Monaco editor
- ✅ Multiple files in tabs simultaneously
- ✅ Manual editing and saving works
- ✅ Application is manually testable

### Phase 2 Success (AI Integration)
- ✅ AIChatSDK communicates with Claude successfully
- ✅ Chat interface is responsive and intuitive
- ✅ Streaming responses work correctly
- ✅ Multi-turn conversations maintain context
- ✅ Basic tool calling framework in place
- ✅ Permission system blocks unauthorized operations

### Phase 3 Success (MVP Complete)
- ✅ AI can perform all file operations through conversation
- ✅ Visual interface updates when AI modifies files
- ✅ Permission system prevents unauthorized operations
- ✅ All file operations logged via AIChatSDK (SOC)
- ✅ Users can click file references in chat
- ✅ **Product is usable and valuable**

### Overall Product Success
- ✅ Developers naturally interact with codebases through conversation
- ✅ File operations happen reliably and safely through AI guidance
- ✅ System works seamlessly across multiple AI providers
- ✅ Desktop version provides excellent user experience
- ✅ Lighthouse ecosystem integration adds measurable value
- ✅ Tool becomes regular part of developer workflows
- ✅ **Developers find conversational approach faster than traditional methods**

---

## Constraints and Assumptions

### Technical Constraints
- Desktop-first (web is future enhancement)
- AIChatSDK must be cloned locally in adjacent directory
- TypeScript strict mode required
- Electron provides full filesystem access
- Monaco Editor is non-negotiable (VS Code engine)

### Business Constraints
- No budget for third-party services (initial phase)
- Open source friendly (MIT license consideration)
- Must integrate with Lighthouse ecosystem
- Wave-based development methodology
- Iterative planning before implementation

### Assumptions
- Users have Node.js installed
- Users have API keys for AI providers
- Users understand basic IDE concepts
- File operations in TypeScript are straightforward
- AIChatSDK handles SOC and compliance automatically
- Manual testing is acceptable for Phase 1-3

---

## Risks and Mitigation

### Risk: Electron Complexity
**Impact:** High
**Mitigation:** Start with simple setup, use established patterns, leverage Vite plugin

### Risk: AIChatSDK Integration Issues
**Impact:** High
**Mitigation:** AIChatSDK is proven in other projects, local clone ensures control

### Risk: Monaco Editor Performance
**Impact:** Medium
**Mitigation:** Set file size limits, lazy loading, established patterns available

### Risk: Phase 1 Takes Longer Than Expected
**Impact:** Medium
**Mitigation:** Phase 1 is foundation, acceptable to invest time, visual testing helps catch issues

### Risk: Permission System Complexity
**Impact:** Medium
**Mitigation:** Start simple (approve/deny), enhance incrementally

---

## Dependencies

### External Dependencies
- **AIChatSDK:** Local clone required, must be adjacent to project
- **AI Provider APIs:** Anthropic (Phase 2), OpenAI/Gemini/Ollama (Phase 4)
- **Node.js:** Latest LTS required
- **Electron:** Framework dependency
- **Monaco Editor:** VS Code editor component

### Internal Dependencies
- **Lighthouse Templates:** Wave planning, user story guides
- **Lighthouse Skills:** Wave creation, UCP calculation, validation

---

## Open Questions

### For Phase 1
1. Root path selection: File dialog, button, or CLI arg? **Recommendation:** Button in file explorer
2. File watching: Phase 1 or Phase 3? **Recommendation:** Phase 3 when AI modifies files
3. File size limits: 1MB soft, 10MB hard? **Recommendation:** Yes, with warnings
4. Unsaved changes: Prompt or auto-save? **Recommendation:** Prompt initially, auto-save in Phase 6
5. Default panel sizes: 20/40/40? **Recommendation:** Make configurable
6. Icon library: VSCode icons? **Recommendation:** Yes, familiar to users

---

## References

### Planning Documents
- Product Summary: `/Docs/planning/PRODUCT-SUMMARY.md`
- Development Phases: `/Docs/planning/DEVELOPMENT-PHASES.md`
- Phase 1 Architecture: `/Docs/planning/PHASE-1-ARCHITECTURE.md`
- Product Name Analysis: `/Docs/planning/PRODUCT-NAME-ANALYSIS.md`

### Templates
- Wave Plan Template: `/.lighthouse/templates/22-Wave-Plan-Template.md`
- User Story Granularity Guide: `/.lighthouse/templates/USER_STORY_GRANULARITY_GUIDE.md`
- User Story Quick Reference: `/.lighthouse/templates/USER_STORY_QUICK_REFERENCE.md`

### External References
- Claude Code CLI: https://claude.com/claude-code
- Electron Documentation: https://www.electronjs.org/docs
- Monaco Editor: https://microsoft.github.io/monaco-editor/
- AIChatSDK: Local clone in adjacent directory

---

## Version History

- **v1.0 (2026-01-18):** Initial requirements document consolidating all planning documents

---

**This document is the single source of truth for Lighthouse Chat IDE requirements. All implementation must align with these requirements unless explicitly approved deviations are documented.**
