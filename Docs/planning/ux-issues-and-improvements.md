# UX Issues and Improvements

**Status:** Living Document
**Date Created:** 2026-01-21
**Last Updated:** 2026-01-21

---

## Purpose

This document tracks user experience issues, friction points, and improvement opportunities discovered during development and testing. Each issue is documented with:

- Current behavior (what happens now)
- Expected behavior (what should happen)
- User impact (why it matters)
- Reference implementations (how other tools solve this)

This is a **living document** - new issues should be added as they're discovered.

---

## Issue Categories

- **Critical** - Blocks core workflows, must fix
- **High Priority** - Significant friction, should fix soon
- **Medium Priority** - Quality of life improvement
- **Low Priority** - Nice to have, future consideration

---

## Open Issues

### Issue #1: File/Folder Creation in File Explorer

**Category:** High Priority
**Component:** File Explorer Panel
**Date Reported:** 2026-01-21

#### Current Behavior

The File Explorer panel displays the folder structure but provides no way to create new files or folders directly. Users must:
- Use AI chat to create files (which doesn't work without agentic tool integration)
- Use external tools/terminal
- Manually create files outside the application

#### Expected Behavior

Users should be able to create files and folders directly from the File Explorer:
- Right-click context menu with "New File" and "New Folder" options
- Keyboard shortcuts for quick creation
- Inline editing for naming new items
- Visual feedback during creation

#### User Impact

**Problem:** Creating new files is a fundamental operation in any IDE. Without this capability, users cannot build projects efficiently within Lighthouse.

**Workflow Blocked:**
- Starting new features
- Adding configuration files
- Creating test files
- Organizing project structure

#### Reference: VS Code File Explorer

VS Code provides comprehensive file/folder operations:

**File Operations:**
- New File (toolbar button + right-click)
- New Folder (toolbar button + right-click)
- Rename (right-click, F2 key)
- Delete (right-click, Delete key)
- Duplicate/Copy
- Cut/Copy/Paste
- Reveal in Finder/Explorer

**Toolbar Actions:**
- New File icon (always visible)
- New Folder icon (always visible)
- Refresh icon
- Collapse All icon

**Context Menu (Right-Click):**
```
New File
New Folder
---
Rename
Delete
---
Cut
Copy
Paste
---
Copy Path
Copy Relative Path
---
Reveal in Finder
Open in Integrated Terminal
```

**Keyboard Shortcuts:**
- `Cmd+N` - New File
- `Cmd+Shift+N` - New Folder
- `F2` or `Enter` - Rename
- `Delete` or `Cmd+Backspace` - Delete
- `Cmd+C` - Copy
- `Cmd+X` - Cut
- `Cmd+V` - Paste

**Creation Flow:**
1. User clicks "New File" or "New Folder"
2. New item appears in tree with inline text input
3. User types name and presses Enter
4. File/folder is created
5. For files, editor opens automatically

**Edge Cases Handled:**
- Duplicate names (prompts for confirmation)
- Invalid characters (prevents or sanitizes)
- Nested creation (creates parent folders if needed)
- Cancel operation (Escape key)

#### Investigation Needed

- How does VS Code handle file watchers to update the tree?
- What validation does VS Code perform on file names?
- How are permissions handled (read-only folders)?
- How does inline editing work with the tree component?
- What happens when creation fails (disk full, permissions, etc.)?

---

### Issue #2: Conversation Context Management

**Category:** Critical
**Component:** AI Chat Interface
**Date Reported:** 2026-01-21

#### Current Behavior

Each message to the AI appears to start a fresh conversation with no memory of previous messages. When a user asks:

```
User: "create a document called wizzle.md"
AI: [attempts to create, but no tools available]

User: "what is the full path to the file created?"
AI: "I don't have enough context to answer your question..."
```

The AI loses track of:
- Previous requests in the conversation
- Files it discussed or "created"
- Working directory context
- User preferences stated earlier

#### Expected Behavior

The AI should maintain conversation context throughout a session:
- Remember all previous messages
- Reference earlier discussion points
- Maintain working directory context
- Build on previous answers
- Track files and operations discussed

**Example of Expected Flow:**
```
User: "create a document called wizzle.md in the docs folder"
AI: [creates file] "Created /Users/roylove/dev/lighthouse-beacon/Docs/wizzle.md"

User: "what's the full path to that file?"
AI: "The file I just created is at /Users/roylove/dev/lighthouse-beacon/Docs/wizzle.md"

User: "add a section about installation"
AI: [edits wizzle.md] "Added an installation section to wizzle.md"
```

#### User Impact

**Problem:** Without context, the AI cannot:
- Answer follow-up questions
- Reference previous operations
- Build on earlier work
- Maintain a coherent conversation

**Workflow Broken:**
- Multi-step tasks require re-explaining context
- Cannot ask clarifying questions
- Frustrating user experience
- Appears buggy/broken

#### Reference: Claude Code Context Management

Claude Code maintains full conversation context:

**Message History:**
- All user messages stored
- All assistant responses stored
- Tool use requests stored
- Tool execution results stored
- Complete conversation thread maintained

**Context Persistence:**
- Context maintained throughout session
- Conversation history visible in sidebar
- Can scroll back through entire conversation
- Context survives app restart (saved to disk)

**Context Window Management:**
- Full conversation history sent with each request
- Automatic summarization when approaching token limits
- Option to manually "compress" old messages
- Warning when context is getting large

**Working Directory Context:**
- AI knows current working directory
- Relative paths resolved correctly
- File references maintain full paths
- Directory structure understood

**Conversation Branching:**
- Can start new conversation
- Previous conversations saved
- Can switch between conversations
- Each conversation independent

#### Technical Considerations

**Message History Storage:**
- Where: Store in conversation state (already implemented in useChatStore)
- Format: Array of messages with role (user/assistant) and content
- Persistence: Save to disk for later retrieval

**Context Window Limits:**
- Claude Sonnet 4.5: 200K token context window (1M with beta header)
- Need to track cumulative token usage
- Implement summarization when approaching limits
- Warn user when context is getting large

**API Integration:**
- Current: Each request is independent (no history)
- Needed: Send full message history with each request
- Format: Array of message objects in Anthropic API format

#### Investigation Needed

- How does Claude Code handle very long conversations?
- What triggers context summarization?
- How are token counts tracked?
- How does conversation history UI work?
- What's the performance impact of large contexts?

---

### Issue #3: File Operation Root Directory

**Category:** High Priority
**Component:** File Operations (Tools), File Explorer
**Date Reported:** 2026-01-21

#### Current Behavior

When a user opens a folder in the File Explorer panel, file operations (via AI or direct tools) don't automatically use that folder as the root. The working directory context is unclear:

**Observed Problems:**
- AI generates paths like `/root/docs/file.md` (incorrect)
- Relative paths may not resolve correctly
- No clear indication of "current working directory"
- User must specify full paths to avoid ambiguity

**Example:**
```
User opens: /Users/roylove/dev/lighthouse-beacon
User asks: "create docs/wizzle.md"
AI creates: /root/docs/wizzle.md (wrong location)
```

#### Expected Behavior

When a user opens a folder via File Explorer:
1. That folder becomes the **project root**
2. All file operations default to being relative to this root
3. The root is clearly displayed in the UI
4. Relative paths are resolved against this root
5. The AI understands and uses this root context

**Example of Expected Flow:**
```
User opens: /Users/roylove/dev/lighthouse-beacon
[File Explorer shows root: "lighthouse-beacon"]

User asks: "create docs/wizzle.md"
AI creates: /Users/roylove/dev/lighthouse-beacon/docs/wizzle.md ✓
AI responds: "Created docs/wizzle.md" (relative path, user-friendly)

User asks: "what's the full path?"
AI responds: "/Users/roylove/dev/lighthouse-beacon/docs/wizzle.md"
```

#### User Impact

**Problem:** Without a clear root directory:
- File operations create files in wrong locations
- User must always specify absolute paths
- Relative paths are confusing/broken
- Project organization is difficult

**Workflow Issues:**
- Cannot think in project-relative terms
- Every operation requires full path specification
- Risk of creating files outside project
- Harder to share instructions (paths are user-specific)

#### Reference: VS Code Workspace Root

VS Code has a clear concept of workspace root:

**Workspace Root Concept:**
- When opening a folder, that folder is the workspace root
- All relative paths resolve from root
- Terminal opens in root directory
- File search scopes to root
- Extensions use root as base path

**UI Indicators:**
- Folder name shown in window title
- Folder path in status bar (bottom)
- Breadcrumb navigation shows path from root
- File tree shows root folder name at top

**Terminal Integration:**
- Integrated terminal starts in workspace root
- `pwd` command shows root directory
- Relative paths work as expected

**Multi-Root Workspaces:**
- VS Code supports opening multiple folders
- Each folder is a separate root
- User can choose which root for operations
- Out of scope for Lighthouse MVP (single root only)

#### Technical Considerations

**Root Directory Storage:**
- Store in application state (EditorStore or new RootStore)
- Persist across sessions
- Update when user opens new folder
- Clear when folder closed

**Path Resolution:**
- All file operations should:
  1. Accept relative paths
  2. Resolve against project root
  3. Validate resolved path is within root (security)
  4. Convert to absolute path for execution

**AI Context:**
- Include root directory in system prompt
- Format: "You are working in project root: /Users/.../project"
- All file paths should be relative to this root
- AI should respond with relative paths for brevity

**Security Considerations:**
- Validate paths don't escape project root
- Block operations on files outside root (unless explicitly allowed)
- Warn when operations affect files outside project
- Integrate with existing PathValidator

#### Investigation Needed

- How does VS Code determine workspace root with multi-folder projects?
- How are paths normalized across Windows/Mac/Linux?
- What happens when user tries to access parent directories (`../`)?
- How does path resolution work with symlinks?
- Should we support changing root without reopening folder?

---

## Issue Tracking

### Issues by Priority

**Critical:** 1
- #2: Conversation Context Management

**High Priority:** 2
- #1: File/Folder Creation in File Explorer
- #3: File Operation Root Directory

**Medium Priority:** 0

**Low Priority:** 0

### Issues by Component

**File Explorer Panel:** 1
- #1: File/Folder Creation

**AI Chat Interface:** 1
- #2: Conversation Context Management

**File Operations/Tools:** 1
- #3: File Operation Root Directory

---

## Adding New Issues

When documenting a new issue, include:

1. **Header:** Issue number, title, category, component, date
2. **Current Behavior:** What happens now (with examples)
3. **Expected Behavior:** What should happen (with examples)
4. **User Impact:** Why this matters, what's blocked
5. **Reference Implementation:** How other tools solve this (VS Code, Claude Code, etc.)
6. **Technical Considerations:** High-level technical notes (no implementation details)
7. **Investigation Needed:** Questions to research

Use the existing issues as templates.

---

## Resolution Process

When an issue is resolved:

1. Add **Resolution** section to the issue
2. Document which epic/feature/wave addressed it
3. Link to implementation details
4. Move issue to **Resolved Issues** section below
5. Update priority counts

---

## Resolved Issues

*No issues resolved yet*

---

## Related Documentation

- **Epic 1:** Desktop Foundation (File Explorer implementation)
- **Epic 2:** AI Integration (Chat interface)
- **Epic 3:** File Operation Tools (Tool framework)
- **Epic 8:** Agentic Tool Integration (Planning)
- **Product Summary:** `/Docs/planning/PRODUCT-SUMMARY.md`
- **Development Phases:** `/Docs/planning/DEVELOPMENT-PHASES.md`

---

**Maintainers:** Development team, Product stakeholders
**Review Frequency:** Weekly during active development
**Last Review:** 2026-01-21
