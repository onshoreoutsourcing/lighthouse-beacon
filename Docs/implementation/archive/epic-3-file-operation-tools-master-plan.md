# Epic 3: File Operation Tools - Master Implementation Plan

## Document Overview

| Field | Value |
|-------|-------|
| **Epic** | Epic 3: File Operation Tools Implementation |
| **Status** | COMPLETE |
| **Completed** | January 20, 2026 |
| **Milestone** | MVP Complete |
| **Duration** | 2-3 weeks |
| **Priority** | P0 - Critical |
| **Prerequisites** | Epic 1 (Desktop Foundation), Epic 2 (AI Integration) |

---

## 1. Executive Summary

### Epic Goals

Epic 3 delivers the **complete file operation toolset** that transforms Lighthouse Chat IDE from an AI chat interface into a fully functional conversational development environment. This epic represents the **MVP milestone** - the first version providing immediate, tangible value to users.

**Primary Objectives:**
- Implement 7 core file operation tools (read, write, edit, delete, glob, grep, bash)
- Enable AI to perform all file operations conversationally
- Integrate visual feedback (file explorer refresh, editor updates, clickable links)
- Enhance permission system with per-tool controls
- Achieve beta testing validation with Lighthouse developers

### MVP Significance

**This epic completes the MVP.** After Epic 3:
- Users can explore and understand codebases conversationally
- Users can perform refactoring tasks 5x faster than manual approach
- File operations integrate seamlessly with visual UI
- 50+ Lighthouse developers can actively use the product
- Product provides immediate, measurable value

### Prerequisites

| Prerequisite | Source | Status |
|--------------|--------|--------|
| Desktop foundation with file explorer and editor | Epic 1 | Required |
| AI integration with tool calling framework | Epic 2 | Required |
| Permission system foundation | Epic 2 | Required |
| AIChatSDK integration operational | Epic 2 | Required |
| SOC logging infrastructure | Epic 2 | Required |

---

## 2. Feature Breakdown

### Feature 3.1: Core File Tools (Read, Write, Edit, Delete)

**Scope:** Implement the four fundamental file manipulation tools that enable AI to read, create, modify, and remove files through conversation.

**Tools:**

| Tool | Purpose | Risk Level | Permission Default |
|------|---------|------------|-------------------|
| `read` | Read file contents (full or line range) | Safe | Always-Allow |
| `write` | Create new files or overwrite existing | Moderate | Prompt |
| `edit` | Find and replace operations within files | Moderate | Prompt |
| `delete` | Delete files or directories | Dangerous | Always-Prompt |

**Key Deliverables:**
- ReadTool implementation with line range support
- WriteTool implementation with atomic writes (temp file + rename)
- EditTool implementation with regex find/replace
- DeleteTool implementation with recursive directory support
- Path validation for all tools (directory sandboxing per ADR-011)
- Structured error handling with AI-readable messages
- SOC logging for all operations

**Technical Reference:**
- ADR-010: File Operation Tool Architecture (ToolExecutor interface)
- ADR-011: Directory Sandboxing Approach (PathValidator)

**Estimated Duration:** 4-5 days

---

### Feature 3.2: Search and Discovery Tools (Glob, Grep)

**Scope:** Implement search tools that enable AI to find files by pattern and search content across the codebase.

**Tools:**

| Tool | Purpose | Risk Level | Permission Default |
|------|---------|------------|-------------------|
| `glob` | Find files matching patterns (e.g., `*.ts`, `src/**/*.tsx`) | Safe | Always-Allow |
| `grep` | Search file contents with regex support | Safe | Always-Allow |

**Key Deliverables:**
- GlobTool implementation using fast-glob or minimatch
- GrepTool implementation with regex pattern matching
- Result limiting (max 100 files for glob, max 500 matches for grep)
- Performance optimization for large codebases (<1 second for typical repos)
- Clear result formatting for AI consumption
- SOC logging for all searches

**Technical Reference:**
- ADR-010: File Operation Tool Architecture

**Estimated Duration:** 2-3 days

---

### Feature 3.3: Shell Command Tool and Enhanced Permissions

**Scope:** Implement the bash tool with comprehensive safety controls and enhance the permission system with per-tool controls.

**Bash Tool:**

| Aspect | Implementation |
|--------|----------------|
| Risk Level | Dangerous (always prompt) |
| Blocklist | Dangerous patterns blocked (rm -rf /, sudo, curl|bash, etc.) |
| Sandboxing | Working directory = project root |
| Timeout | 60 seconds maximum |
| Output | Capture stdout, stderr, exit code |

**Permission Enhancements:**

| Permission Level | Behavior |
|-----------------|----------|
| Always-Allow | Auto-approve, no prompt (read, glob, grep) |
| Prompt | Show modal, user decides (write, edit) |
| Always-Deny | Auto-deny, no prompt (configurable) |

**Session Trust:**
- "Trust this session" checkbox for moderate operations (write, edit)
- Dangerous operations (delete, bash) always prompt - no trust option
- Session trust resets when conversation ends

**Key Deliverables:**
- BashTool implementation with blocklist validation
- Command execution with timeout and sandboxing
- Enhanced PermissionService with per-tool levels
- Updated PermissionModal with risk indicators
- Session trust tracking and reset logic
- Permission persistence (save/load settings)
- Comprehensive security logging

**Technical Reference:**
- ADR-012: Bash Command Safety Strategy
- ADR-014: Permission System Enhancement

**Estimated Duration:** 4-5 days

---

### Feature 3.4: Visual Integration and Beta Testing

**Scope:** Connect all tools to the visual UI and conduct beta testing with Lighthouse developers.

**Visual Integration:**

| Component | Update Trigger | Behavior |
|-----------|----------------|----------|
| File Explorer | write, delete | Refresh affected directories |
| Editor Tabs | write, edit | Reload content if file open |
| Chat Interface | All operations | Display results with clickable file links |

**Event-Based Architecture:**
```
Tool executes -> Emits IPC event -> Renderer receives -> Updates Zustand store -> React re-renders
```

**Beta Testing:**
- 10-15 Lighthouse developers
- Real development tasks (not synthetic tests)
- Feedback collection (Slack, surveys, weekly check-ins)
- Bug tracking and prioritization

**Key Deliverables:**
- File operation event emission from all tools
- FileExplorerStore event subscription and refresh logic
- EditorStore event subscription and content refresh
- ChatMessage component with file path parsing and clickable links
- Auto-open files in editor when AI references them
- Beta testing coordination and feedback collection
- Bug fixes based on beta feedback

**Technical Reference:**
- ADR-013: Visual Integration Pattern

**Estimated Duration:** 4-5 days (including 2-3 days beta testing)

---

## 3. Implementation Order and Dependencies

### Dependency Chain

```
Feature 3.1 (Core File Tools)
    |
    +---> Feature 3.2 (Search Tools) [Can run in parallel]
    |
    v
Feature 3.3 (Bash + Permissions) [Depends on 3.1 for testing]
    |
    v
Feature 3.4 (Visual Integration + Beta) [Depends on all tools]
```

### Detailed Sequencing

| Order | Feature | Dependencies | Can Parallelize With |
|-------|---------|--------------|---------------------|
| 1 | 3.1 Core File Tools | Epic 2 complete | - |
| 2 | 3.2 Search Tools | Epic 2 complete | Feature 3.1 |
| 3 | 3.3 Bash + Permissions | Feature 3.1 (for integration testing) | - |
| 4 | 3.4 Visual Integration | Features 3.1, 3.2, 3.3 | - |

### Parallelization Strategy

**Week 1:**
- Day 1-3: Feature 3.1 (ReadTool, WriteTool)
- Day 2-3: Feature 3.2 (GlobTool, GrepTool) - parallel
- Day 4-5: Feature 3.1 continued (EditTool, DeleteTool)

**Week 2:**
- Day 1-3: Feature 3.3 (BashTool, Permission enhancements)
- Day 4-5: Feature 3.3 continued (Permission UI, security testing)

**Week 3:**
- Day 1-2: Feature 3.4 (Visual integration)
- Day 2-5: Beta testing and bug fixes

---

## 4. Technical Stack

### Core Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| File Operations | Node.js fs/promises | Async file I/O |
| Path Handling | Node.js path module | Cross-platform path resolution |
| Pattern Matching | fast-glob or minimatch | Glob pattern matching |
| Content Search | Custom implementation | Regex search across files |
| Shell Execution | Node.js child_process.spawn | Bash command execution |
| Path Validation | Custom PathValidator | Security sandboxing |

### File System APIs

```typescript
// Primary APIs used
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';

// Key operations
fs.readFile(path, 'utf-8')      // Read file content
fs.writeFile(path, content)     // Write file (atomic via temp file)
fs.unlink(path)                 // Delete file
fs.rmdir(path, { recursive })   // Delete directory
fs.readdir(path, { withFileTypes }) // List directory
fs.stat(path)                   // File metadata
fs.realpath(path)               // Resolve symlinks
```

### IPC Communication

```typescript
// Main process -> Renderer (events)
BrowserWindow.webContents.send('file-operation-complete', event);

// Renderer -> Main (requests)
ipcRenderer.invoke('tool:execute', toolName, params);

// Event format
interface FileOperationEvent {
  operation: 'read' | 'write' | 'edit' | 'delete' | 'glob' | 'grep' | 'bash';
  paths: string[];
  success: boolean;
  timestamp: number;
}
```

### Tool Implementation Pattern

```typescript
// From ADR-010
interface ToolExecutor<TParams, TResult> {
  readonly name: string;
  readonly description: string;
  readonly schema: ToolSchema;

  execute(params: TParams, context: ExecutionContext): Promise<TResult>;
  validate?(params: TParams): ValidationResult;
}

interface ExecutionContext {
  projectRoot: string;
  userId: string;
  conversationId: string;
  socLogger: SOCLogger;
}

interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: ToolError;
}
```

---

## 5. Success Criteria

### Functional Requirements

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| All 7 tools functional | 100% | Each tool executes successfully |
| File operation success rate | >95% | Operations complete without errors |
| Search performance | <1 second | Glob/grep on typical codebase |
| Visual refresh latency | <100ms | Explorer/editor update after operation |
| Permission enforcement | 100% | No unauthorized operations execute |
| SOC logging coverage | 100% | All operations logged |

### MVP Exit Criteria

| Criterion | Target | Validation Method |
|-----------|--------|-------------------|
| Beta user adoption | 50+ developers | User tracking |
| User satisfaction | NPS > 40 | Survey |
| Productivity gain | 30%+ time savings | User feedback |
| Tool reliability | >99% uptime | Error monitoring |
| Security validation | Zero violations | Security testing |

### Quality Gates

**Per-Feature Gates:**
- [ ] All acceptance criteria met with evidence
- [ ] Code review completed and approved
- [ ] Unit tests passing (80% coverage target)
- [ ] Integration tests passing
- [ ] Security scan passed (no critical issues)
- [ ] SOC logging verified

**Epic Completion Gates:**
- [ ] All 7 tools functional end-to-end
- [ ] Visual integration working correctly
- [ ] Beta testing completed with positive feedback
- [ ] All P0 bugs fixed
- [ ] Documentation updated
- [ ] MVP criteria validated

---

## 6. Integration Points

### AI Service Integration

```
User Message
    |
    v
AI Service (AIChatSDK)
    |
    v
Tool Call Detected
    |
    v
ToolExecutionService
    |
    v
PermissionService.checkPermission()
    |
    +-- Denied --> Return denial to AI
    |
    +-- Approved --> ToolRegistry.get(toolName).execute()
                         |
                         v
                    Tool Result --> AI continues conversation
```

**Tool Schema Registration:**
```typescript
// Tools registered with AIChatSDK
const toolSchemas = toolRegistry.getSchemas();
aiService.setTools(toolSchemas);

// Tool call handling
aiService.onToolCall(async (call) => {
  const tool = toolRegistry.get(call.name);
  const result = await toolExecutionService.execute(tool, call.params);
  return result;
});
```

### Permission System Integration

**Permission Check Flow:**
```
Tool Execution Request
    |
    v
PermissionService.checkPermission(tool, params)
    |
    +-- Level: ALWAYS_ALLOW --> Execute immediately
    |
    +-- Level: ALWAYS_DENY --> Return denial
    |
    +-- Level: PROMPT
            |
            +-- Session trusted --> Execute immediately
            |
            +-- Not trusted --> Show PermissionModal
                                    |
                                    +-- User approves --> Execute
                                    |
                                    +-- User denies --> Return denial
```

### File Explorer Integration

```typescript
// Listen for file operations
window.api.onFileOperationComplete((event) => {
  const store = useFileExplorerStore.getState();

  if (event.operation === 'write') {
    // New file created - refresh parent directory
    event.paths.forEach(path => {
      const dir = dirname(path);
      store.refreshDirectory(dir);
    });
  }

  if (event.operation === 'delete') {
    // File deleted - refresh parent directory
    event.paths.forEach(path => {
      const dir = dirname(path);
      store.refreshDirectory(dir);
    });
  }
});
```

### Editor Integration

```typescript
// Listen for file modifications
window.api.onFileOperationComplete((event) => {
  if (event.operation === 'write' || event.operation === 'edit') {
    const store = useEditorStore.getState();

    // Check if modified file is open
    event.paths.forEach(path => {
      const isOpen = store.openTabs.some(tab => tab.path === path);
      if (isOpen) {
        // Reload content from disk
        store.refreshTab(path);
      }
    });
  }
});
```

---

## 7. Testing Strategy

### Unit Tests (Per Tool)

| Tool | Test Cases |
|------|------------|
| ReadTool | Read existing file, read with line range, file not found, path outside project |
| WriteTool | Create new file, overwrite existing, atomic write (temp + rename), path validation |
| EditTool | Single replacement, multiple replacements, regex patterns, no matches found |
| DeleteTool | Delete file, delete directory (recursive), path outside project, permission denied |
| GlobTool | Simple patterns, recursive patterns, no matches, result limiting |
| GrepTool | Text search, regex search, multiple files, result limiting |
| BashTool | Simple command, blocked command, timeout, exit code handling |

**Test Coverage Target:** 80% line coverage

### Integration Tests

| Test Scenario | Components Involved |
|---------------|---------------------|
| AI reads file through conversation | AIService -> ToolExecutionService -> ReadTool |
| AI creates file, explorer refreshes | WriteTool -> IPC Event -> FileExplorerStore |
| AI edits open file, editor refreshes | EditTool -> IPC Event -> EditorStore |
| User approves/denies permission | PermissionService -> PermissionModal -> Tool |
| Click file link opens in editor | ChatMessage -> EditorStore -> Monaco |

### Security Tests

| Test Category | Test Cases |
|---------------|------------|
| Path Traversal | `../../../etc/passwd`, absolute paths outside project, symlink escape |
| Bash Injection | `rm -rf /`, `sudo command`, `curl | bash`, fork bombs |
| Permission Bypass | Tool execution without permission check, session trust manipulation |
| Sandboxing | All operations restricted to project root |

**Security Test Suite:** `tests/security/`
- `path-traversal.test.ts`
- `bash-safety.test.ts`
- `permission-enforcement.test.ts`

### Visual Integration Tests

| Test Scenario | Expected Behavior |
|---------------|-------------------|
| Create file via AI | File appears in explorer within 100ms |
| Delete file via AI | File removed from explorer immediately |
| Edit open file via AI | Editor content refreshes without losing scroll position |
| Click file link in chat | File opens in editor, becomes active tab |

### Beta Testing Protocol

**Participants:** 10-15 Lighthouse developers

**Duration:** 2-3 days (concurrent with development)

**Test Scenarios:**
1. Explore unfamiliar codebase using AI
2. Perform multi-file refactoring task
3. Search for patterns across project
4. Execute common shell commands (npm install, git status)
5. Test permission system with various settings

**Feedback Collection:**
- Slack channel: #beacon-beta
- Weekly survey: satisfaction, issues, suggestions
- Bug reports: GitHub Issues

---

## 8. Risk Management

### Risk Register

| Risk ID | Risk | Impact | Probability | Mitigation |
|---------|------|--------|-------------|------------|
| R1 | Bash tool security vulnerabilities | High | Medium | Blocklist validation, mandatory approval, sandboxing, timeout |
| R2 | Permission fatigue slows workflow | Medium | Medium | Session trust option, per-tool defaults, clear UX |
| R3 | Performance issues on large repos | Medium | Low | Result limiting, lazy loading, benchmarking |
| R4 | File corruption from failed writes | High | Low | Atomic writes (temp + rename), validation before execution |
| R5 | Visual integration causes UI lag | Medium | Low | Async operations, debounce refresh, virtual scrolling |
| R6 | Beta users find critical bugs | Medium | Medium | Buffer time for bug fixes, prioritized triage |
| R7 | AI suggests incorrect file paths | Low | Medium | Clear error messages, AI can retry, user sees operation |

### Mitigation Details

**R1 - Bash Security:**
- Comprehensive blocklist of dangerous patterns (ADR-012)
- Every bash command requires explicit user approval
- Working directory sandboxed to project root
- 60-second timeout prevents runaway processes
- All commands logged to SOC

**R2 - Permission Fatigue:**
- Safe operations (read, glob, grep) auto-approve by default
- "Trust this session" for moderate operations
- Clear, non-disruptive modal design
- Keyboard shortcuts (Enter=approve, Esc=deny)

**R3 - Large Repo Performance:**
- Glob results limited to 100 files
- Grep results limited to 500 matches
- Progress indicators for long operations
- Test with repos of 10,000+ files

**R4 - File Corruption:**
- Write to temp file, then atomic rename
- Validate content before write
- Backup on delete (future enhancement)
- Transaction logging in SOC

**R5 - UI Performance:**
- File operations async (don't block UI)
- Debounce rapid refresh events
- Use React concurrent features
- Profile and optimize hot paths

**R6 - Beta Bugs:**
- 2-3 days buffer for bug fixes
- Prioritize P0 (blocking) issues
- Daily triage during beta period
- Clear communication with beta users

---

## 9. Timeline and Milestones

### Week-by-Week Schedule

| Week | Days | Focus | Deliverables |
|------|------|-------|--------------|
| 1 | 1-2 | Feature 3.1 Start | ReadTool, WriteTool |
| 1 | 3-5 | Feature 3.1 + 3.2 | EditTool, DeleteTool, GlobTool, GrepTool |
| 2 | 1-3 | Feature 3.3 | BashTool, Permission enhancements |
| 2 | 4-5 | Feature 3.3 Complete | Permission UI, security testing |
| 3 | 1-2 | Feature 3.4 | Visual integration |
| 3 | 2-5 | Beta Testing | User testing, bug fixes, feedback |

### Milestone Checkpoints

| Milestone | Target | Validation |
|-----------|--------|------------|
| Feature 3.1 Complete | Week 1, Day 5 | All 4 file tools working, tests passing |
| Feature 3.2 Complete | Week 2, Day 2 | Search tools working, performance validated |
| Feature 3.3 Complete | Week 2, Day 5 | Bash tool secure, permissions enhanced |
| Beta Testing Start | Week 3, Day 2 | All tools ready for user testing |
| Epic 3 Complete (MVP) | Week 3, Day 5 | All criteria met, beta feedback positive |

### Buffer and Contingency

- **Bug Fix Buffer:** 2-3 days during beta testing
- **Scope Reduction Candidates:** Advanced bash features (pipes, env vars) can defer to Epic 4
- **Critical Path:** Feature 3.1 -> 3.3 -> 3.4 (cannot reduce)

---

## 10. Resources Required

### Development Team

| Role | Allocation | Skills Required |
|------|------------|-----------------|
| Full-Stack Developer | 100% | Node.js fs, TypeScript, React, Electron |
| Secondary Developer (optional) | 50% | Can work on Feature 3.2 in parallel |

### Technical Skills

- Node.js file system APIs (fs/promises, path)
- TypeScript advanced types (generics, conditional types)
- Security best practices (input validation, sandboxing)
- Pattern matching and text search algorithms
- Child process management (spawn, timeout)
- React state management (Zustand)
- Electron IPC communication

### Beta Testing Resources

- 10-15 Lighthouse developers committed
- Variety of project types (web, backend, monolith)
- Feedback mechanism (Slack channel, surveys)
- Bug tracking (GitHub Issues)

### Test Codebases

| Size | Files | Purpose |
|------|-------|---------|
| Small | ~100 | Quick iteration, basic testing |
| Medium | ~1,000 | Typical project, performance baseline |
| Large | ~10,000 | Stress testing, performance edge cases |

---

## 11. Architecture Decision Records

The following ADRs document key architectural decisions for Epic 3:

| ADR | Title | Key Decision |
|-----|-------|--------------|
| ADR-010 | File Operation Tool Architecture | Modular tools with ToolExecutor<T,R> interface |
| ADR-011 | Directory Sandboxing Approach | Path validation with symlink resolution |
| ADR-012 | Bash Command Safety Strategy | Blocklist + mandatory approval + timeout |
| ADR-013 | Visual Integration Pattern | Event-based refresh via IPC |
| ADR-014 | Permission System Enhancement | Per-tool levels with session trust |

**ADR Locations:** `Docs/architecture/decisions/ADR-01X-*.md`

---

## 12. Related Documentation

### Product Documentation
- Product Vision: `Docs/architecture/_main/01-Product-Vision.md`
- Business Requirements: `Docs/architecture/_main/03-Business-Requirements.md` (FR-1, FR-6, FR-7, FR-9)
- System Architecture: `Docs/architecture/_main/04-Architecture.md`

### Epic Documentation
- Epic 3 Plan: `Docs/implementation/_main/epic-3-file-operation-tools-mvp.md`
- Epic 2 (Prerequisite): `Docs/implementation/_main/epic-2-ai-integration-aichatsdk.md`

### Technical References
- Tool Implementation Guide: `Docs/guides/tools/README.md` (to be created)
- Security Testing Guide: `Docs/guides/security/testing.md` (to be created)

---

## 13. Appendix: Tool Specifications

### ReadTool Specification

```typescript
interface ReadParams {
  path: string;           // Relative path to file
  startLine?: number;     // Optional start line (0-indexed)
  endLine?: number;       // Optional end line (exclusive)
}

interface ReadResult {
  path: string;
  content: string;
  lineCount: number;
  totalLines: number;     // Total lines in file
}
```

### WriteTool Specification

```typescript
interface WriteParams {
  path: string;           // Relative path to file
  content: string;        // File content to write
  createDirectories?: boolean;  // Create parent dirs if needed
}

interface WriteResult {
  path: string;
  bytesWritten: number;
  created: boolean;       // True if new file, false if overwrite
}
```

### EditTool Specification

```typescript
interface EditParams {
  path: string;           // Relative path to file
  search: string;         // Pattern to find (string or regex)
  replace: string;        // Replacement text
  isRegex?: boolean;      // Treat search as regex
  global?: boolean;       // Replace all occurrences (default: true)
}

interface EditResult {
  path: string;
  replacements: number;   // Number of replacements made
  originalContent: string;  // For undo (future)
}
```

### DeleteTool Specification

```typescript
interface DeleteParams {
  path: string;           // Relative path to file/directory
  recursive?: boolean;    // Required for non-empty directories
}

interface DeleteResult {
  path: string;
  type: 'file' | 'directory';
  itemsDeleted: number;   // 1 for file, count for directory
}
```

### GlobTool Specification

```typescript
interface GlobParams {
  pattern: string;        // Glob pattern (e.g., "**/*.ts")
  cwd?: string;           // Optional subdirectory to search
  ignore?: string[];      // Patterns to ignore
}

interface GlobResult {
  pattern: string;
  matches: string[];      // Array of matching paths
  totalMatches: number;
  truncated: boolean;     // True if results limited
}
```

### GrepTool Specification

```typescript
interface GrepParams {
  pattern: string;        // Search pattern (string or regex)
  files?: string;         // File pattern to search (default: "**/*")
  isRegex?: boolean;      // Treat pattern as regex
  caseSensitive?: boolean;  // Case-sensitive search
}

interface GrepMatch {
  path: string;
  line: number;
  content: string;        // Matching line content
  matchStart: number;     // Character offset
  matchEnd: number;
}

interface GrepResult {
  pattern: string;
  matches: GrepMatch[];
  totalMatches: number;
  filesSearched: number;
  truncated: boolean;
}
```

### BashTool Specification

```typescript
interface BashParams {
  command: string;        // Shell command to execute
  cwd?: string;           // Working directory (default: project root)
}

interface BashResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;       // Execution time in ms
}
```

---

## Document Information

| Field | Value |
|-------|-------|
| **Created By** | Wave Planner Agent |
| **Creation Date** | 2026-01-19 |
| **Last Updated** | 2026-01-19 |
| **Version** | 1.0 |
| **Status** | COMPLETE |
| **Next Review** | After Feature 3.1 completion |

---

*This master plan is a planning document. Implementation will proceed only after explicit instruction following review cycles.*
