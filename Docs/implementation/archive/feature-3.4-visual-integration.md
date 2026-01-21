# Feature 3.4: Visual Integration and Beta Testing

## Feature Overview

| Field | Value |
|-------|-------|
| **Feature ID** | Feature-3.4 |
| **Epic** | Epic-3 (File Operation Tools Implementation) |
| **Status** | COMPLETE |
| **Completed** | January 20, 2026 |
| **Priority** | P0 (Critical - MVP Milestone) |
| **Estimated Duration** | 4-5 days (including 2-3 days beta testing) |
| **Dependencies** | Feature 3.1, Feature 3.2, Feature 3.3 (all tools must be complete) |

---

## Problem Statement

With all seven file operation tools implemented (Features 3.1, 3.2, 3.3), users can perform conversational file operations, but the visual interface does not reflect these changes. When AI creates a file, the file explorer does not update. When AI edits an open file, the editor still shows stale content. File paths mentioned in chat are plain text, not clickable links.

**Current State:** File operation tools work, but visual UI is disconnected from tool execution
**Desired State:** Visual interface updates in real-time when AI performs operations, creating seamless integration between conversation and visual context

This feature addresses the Product Vision principle: **"Visual First, Conversational Always"** - conversation and visual interface must stay synchronized.

---

## Business Value

### Value to Users

- **Real-time visual feedback**: See file changes immediately in explorer and editor
- **Clickable file links**: Click file paths in chat to open files directly in editor
- **Seamless workflow**: No need to manually refresh or navigate after AI operations
- **Trust and transparency**: Visual confirmation of AI operations builds confidence
- **Productivity**: Reduces context switching between conversation and manual navigation

### Value to Business

- **MVP completion**: This feature completes the MVP milestone (Epic 3 exit criteria)
- **Beta validation**: Real user testing validates the core product concept
- **User adoption**: Seamless integration drives user satisfaction and adoption
- **Competitive differentiation**: Visual + conversational integration distinguishes from CLI-only tools

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Visual refresh latency | < 100ms | Time from tool completion to UI update |
| File explorer accuracy | 100% | All created/deleted files reflected |
| Editor refresh accuracy | 100% | All modified open files updated |
| File link click success | 100% | Clicking file link opens correct file |
| Beta user NPS | > 40 | User satisfaction survey |
| Beta user adoption | 50+ | Number of active beta users |
| Productivity gain | 30%+ | User-reported time savings |

---

## Implementation Scope

### In Scope

**Event-Based Visual Integration (ADR-013):**
- [ ] File operation event emission from all tools (read, write, edit, delete, glob, grep, bash)
- [ ] IPC channel for file operation events (main process to renderer)
- [ ] FileExplorerStore event subscription and refresh logic
- [ ] EditorStore event subscription and content refresh
- [ ] Event debouncing for rapid operations (prevent UI thrashing)
- [ ] Error handling for failed refresh operations

**Chat Interface Enhancements:**
- [ ] ChatMessage component with file path parsing
- [ ] Clickable file links (file://path format)
- [ ] Auto-open files in editor when AI references them (optional setting)
- [ ] Visual indication of file operations in chat (icons for create, edit, delete)
- [ ] File path syntax highlighting in chat messages

**Beta Testing Program:**
- [ ] Beta testing coordination (10-15 Lighthouse developers)
- [ ] Feedback collection mechanism (Slack channel, surveys)
- [ ] Bug tracking and prioritization
- [ ] Daily triage during beta period
- [ ] Bug fixes based on beta feedback
- [ ] MVP exit criteria validation

### Out of Scope

- Preview panel for file changes (Epic 5 - Diff view)
- Undo/redo for AI operations (Epic 5 - Change management)
- File watching for external changes (future enhancement)
- Batch operation visualization (future enhancement)
- Operation history panel (future enhancement)
- Real-time collaborative editing (future enhancement)

---

## Technical Design

### Architecture Overview (ADR-013)

**Event-Based Refresh Pattern:**

```
AI suggests operation
    |
    v
Permission approved
    |
    v
Tool executes (main process)
    |
    v
Tool emits IPC event: 'file-operation-complete'
    |
    v
Renderer receives event
    |
    v
Updates Zustand stores (fileExplorerStore, editorStore)
    |
    v
React components re-render
    |
    v
UI shows updated state
```

### Event Format

```typescript
// src/types/file-operation-events.ts
export interface FileOperationEvent {
  operation: 'read' | 'write' | 'edit' | 'delete' | 'glob' | 'grep' | 'bash';
  paths: string[];           // Affected file paths
  success: boolean;          // Operation succeeded
  timestamp: number;         // Event timestamp
  metadata?: {
    created?: boolean;       // True if file was created (write)
    bytesWritten?: number;   // For write operations
    replacements?: number;   // For edit operations
    itemsDeleted?: number;   // For delete operations
  };
}
```

### Tool Event Emission

```typescript
// src/tools/ToolExecutor.ts (main process)
export abstract class ToolExecutor<TParams, TResult> {
  async execute(params: TParams, context: ExecutionContext): Promise<TResult> {
    // Execute operation
    const result = await this.doExecute(params, context);

    // Emit event for UI refresh
    if (result.success) {
      this.emitFileOperationEvent({
        operation: this.name,
        paths: this.getAffectedPaths(params, result),
        success: true,
        timestamp: Date.now(),
        metadata: this.getEventMetadata(result)
      });
    }

    return result;
  }

  private emitFileOperationEvent(event: FileOperationEvent): void {
    // Send via IPC to renderer process
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('file-operation-complete', event);
    });
  }

  protected abstract getAffectedPaths(params: TParams, result: TResult): string[];
  protected abstract getEventMetadata(result: TResult): Record<string, unknown>;
}
```

### File Explorer Store Integration

```typescript
// src/renderer/stores/fileExplorerStore.ts
import { create } from 'zustand';

interface FileExplorerStore {
  files: FileNode[];
  refreshFile: (path: string) => Promise<void>;
  refreshDirectory: (path: string) => Promise<void>;
  removeFile: (path: string) => void;
}

export const useFileExplorerStore = create<FileExplorerStore>((set, get) => ({
  files: [],

  refreshFile: async (path: string) => {
    // Re-fetch single file metadata
    const metadata = await window.api.getFileMetadata(path);
    set((state) => ({
      files: updateFileInTree(state.files, path, metadata)
    }));
  },

  refreshDirectory: async (path: string) => {
    // Re-fetch directory contents
    const contents = await window.api.listDirectory(path);
    set((state) => ({
      files: updateDirectoryInTree(state.files, path, contents)
    }));
  },

  removeFile: (path: string) => {
    set((state) => ({
      files: removeFileFromTree(state.files, path)
    }));
  }
}));

// Event listener registration
export function registerFileOperationListener(): void {
  window.api.onFileOperationComplete((event: FileOperationEvent) => {
    const store = useFileExplorerStore.getState();

    switch (event.operation) {
      case 'write':
        // File created or modified - refresh parent directory
        event.paths.forEach(path => {
          const dir = getParentDirectory(path);
          store.refreshDirectory(dir);
        });
        break;

      case 'delete':
        // File deleted - remove from tree and refresh parent
        event.paths.forEach(path => {
          store.removeFile(path);
          const dir = getParentDirectory(path);
          store.refreshDirectory(dir);
        });
        break;

      case 'edit':
        // File modified - refresh file metadata (size, modified date)
        event.paths.forEach(path => {
          store.refreshFile(path);
        });
        break;

      // read, glob, grep, bash don't modify file system
    }
  });
}
```

### Editor Store Integration

```typescript
// src/renderer/stores/editorStore.ts
export const useEditorStore = create<EditorStore>((set, get) => ({
  openTabs: [],
  activeFilePath: null,

  refreshTab: async (path: string) => {
    const { openTabs } = get();
    const tab = openTabs.find(t => t.path === path);

    if (tab) {
      // Re-read file content
      const content = await window.api.readFile(path);
      set((state) => ({
        openTabs: state.openTabs.map(t =>
          t.path === path
            ? { ...t, content, isDirty: false, lastRefreshed: Date.now() }
            : t
        )
      }));
    }
  },

  closeTab: (path: string) => {
    set((state) => ({
      openTabs: state.openTabs.filter(t => t.path !== path),
      activeFilePath: state.activeFilePath === path
        ? state.openTabs[0]?.path || null
        : state.activeFilePath
    }));
  }
}));

// Event listener registration
export function registerEditorEventListener(): void {
  window.api.onFileOperationComplete((event: FileOperationEvent) => {
    const store = useEditorStore.getState();

    if (event.operation === 'write' || event.operation === 'edit') {
      // Check if any modified file is open in editor
      event.paths.forEach(path => {
        const isOpen = store.openTabs.some(tab => tab.path === path);
        if (isOpen) {
          store.refreshTab(path);
        }
      });
    }

    if (event.operation === 'delete') {
      // Close tabs for deleted files
      event.paths.forEach(path => {
        const isOpen = store.openTabs.some(tab => tab.path === path);
        if (isOpen) {
          store.closeTab(path);
        }
      });
    }
  });
}
```

### Clickable File Links in Chat

```typescript
// src/renderer/components/chat/ChatMessage.tsx
import React from 'react';
import { useEditorStore } from '../../stores/editorStore';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const contentWithLinks = parseFilePaths(message.content);

  return (
    <MessageContainer role={message.role}>
      <Markdown
        content={contentWithLinks}
        renderers={{
          link: ({ href, children }) => {
            // Handle file:// links
            if (href?.startsWith('file://')) {
              return (
                <FileLink onClick={() => handleFileClick(href)}>
                  {children}
                </FileLink>
              );
            }
            return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
          }
        }}
      />
    </MessageContainer>
  );
};

function handleFileClick(fileUrl: string): void {
  const path = fileUrl.replace('file://', '');
  const editorStore = useEditorStore.getState();
  editorStore.openFile(path);
}

// Convert file paths to file:// links
function parseFilePaths(content: string): string {
  // Match common file path patterns
  // Patterns: ./path, ../path, /absolute/path, relative/path.ext
  const filePathRegex = /(?<![`\w])([./][\w/.-]+\.(ts|tsx|js|jsx|md|json|css|html|py|go|rs|java|c|cpp|h|hpp|yaml|yml|toml|sh|bash|sql|xml|env|gitignore|dockerfile))(?![`\w])/gi;

  return content.replace(
    filePathRegex,
    (match) => `[\`${match}\`](file://${match})`
  );
}
```

### File Link Styling

```typescript
// src/renderer/components/chat/FileLink.tsx
import styled from 'styled-components';

export const FileLink = styled.button`
  background: none;
  border: none;
  color: #58a6ff;
  text-decoration: underline;
  cursor: pointer;
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
  padding: 0;

  &:hover {
    color: #79b8ff;
    text-decoration: none;
  }

  &:focus {
    outline: 2px solid #58a6ff;
    outline-offset: 2px;
  }
`;
```

### Event Debouncing

```typescript
// src/renderer/utils/eventDebouncer.ts
import { debounce } from 'lodash';

// Debounce directory refresh to prevent rapid UI updates
export const debouncedRefreshDirectory = debounce(
  (path: string, store: FileExplorerStore) => {
    store.refreshDirectory(path);
  },
  100,
  { leading: true, trailing: true, maxWait: 500 }
);

// Batch multiple file refreshes
export const batchedRefresh = (() => {
  const pendingPaths = new Set<string>();
  let timeout: NodeJS.Timeout | null = null;

  return (path: string, store: FileExplorerStore) => {
    pendingPaths.add(path);

    if (!timeout) {
      timeout = setTimeout(() => {
        pendingPaths.forEach(p => store.refreshFile(p));
        pendingPaths.clear();
        timeout = null;
      }, 50);
    }
  };
})();
```

---

## Dependencies

### Prerequisites (Must Complete Before This Feature)

| Dependency | Source | Status | Impact if Missing |
|------------|--------|--------|-------------------|
| Feature 3.1: Core File Tools | Epic 3 | Required | Cannot integrate tools that don't exist |
| Feature 3.2: Search Tools | Epic 3 | Required | Incomplete tool set for integration |
| Feature 3.3: Bash + Permissions | Epic 3 | Required | Missing dangerous operation handling |
| File Explorer Component | Epic 1 (Feature 1.4) | Complete | No UI to update |
| Editor Integration | Epic 1 (Feature 1.5) | Complete | No editor to refresh |
| File Operations Bridge | Epic 1 (Feature 1.6) | Complete | No existing sync pattern |
| AI Integration | Epic 2 | Complete | No tool execution framework |

### Enables (This Feature Enables)

- **MVP Milestone**: First complete, usable product
- **Beta Testing**: Real user validation of core concept
- **Epic 4**: Multi-provider support with validated tool UI
- **Epic 5**: Advanced visual features (diff view, change management)
- **User Adoption**: Product ready for Lighthouse developer use

### External Dependencies

| Dependency | Purpose | Status | Mitigation |
|------------|---------|--------|------------|
| Electron IPC | Event communication | Available | Built into Electron |
| Zustand | State management | Available | Already in use (Epic 1) |
| React | UI rendering | Available | Already in use |
| Slack | Beta feedback collection | Available | #beacon-beta channel |
| GitHub Issues | Bug tracking | Available | Repository ready |

---

## Implementation Phases

### Wave 3.4.1: Event-Based Visual Integration

**Scope:** Implement event emission from tools and UI refresh in file explorer and editor

**Duration:** 2-3 days

**Deliverables:**
- [ ] FileOperationEvent interface and IPC channel
- [ ] Event emission from all 7 tools (read, write, edit, delete, glob, grep, bash)
- [ ] FileExplorerStore event subscription and refresh logic
- [ ] EditorStore event subscription and content refresh
- [ ] Event debouncing for rapid operations
- [ ] Error handling for failed refreshes
- [ ] Unit tests for event handling
- [ ] Integration tests for visual refresh

**User Stories:**

**Story 3.4.1.1: File Explorer Refresh on Create**
- **As a** user
- **I want** the file explorer to show new files immediately when AI creates them
- **So that** I can see the results of AI operations without manual refresh

**Acceptance Criteria:**
- [ ] When AI creates file via write tool, file appears in explorer within 100ms
- [ ] Parent directory expands automatically if collapsed
- [ ] New file is visually highlighted briefly (optional)
- [ ] No duplicate entries if file already exists

**Story 3.4.1.2: File Explorer Refresh on Delete**
- **As a** user
- **I want** deleted files to disappear from the explorer immediately
- **So that** the explorer accurately reflects the file system state

**Acceptance Criteria:**
- [ ] When AI deletes file, it disappears from explorer within 100ms
- [ ] If deleted file was selected, selection clears
- [ ] If deleted directory was expanded, children removed
- [ ] No errors if file already missing

**Story 3.4.1.3: Editor Refresh on Edit**
- **As a** user
- **I want** the editor to show updated content when AI modifies an open file
- **So that** I see the latest file content without reopening

**Acceptance Criteria:**
- [ ] When AI edits open file, editor content refreshes within 100ms
- [ ] Scroll position preserved (or near original)
- [ ] Cursor position preserved (or reasonable)
- [ ] "Modified" indicator clears (content now matches disk)
- [ ] Syntax highlighting updates correctly

**Story 3.4.1.4: Editor Tab Closes on Delete**
- **As a** user
- **I want** editor tabs to close automatically when AI deletes the file
- **So that** I don't have a tab for a non-existent file

**Acceptance Criteria:**
- [ ] When AI deletes file, corresponding tab closes
- [ ] If deleted file was active, switches to next tab
- [ ] If no other tabs, shows empty state
- [ ] User notified that file was deleted (toast or message)

---

### Wave 3.4.2: Chat Interface Enhancements

**Scope:** Implement clickable file links and operation visualization in chat

**Duration:** 1-2 days

**Deliverables:**
- [ ] File path parsing in chat messages
- [ ] Clickable file links (file://path format)
- [ ] FileLink styled component
- [ ] Click handler to open files in editor
- [ ] Operation icons in chat (create, edit, delete)
- [ ] Auto-open setting for AI-referenced files (optional)
- [ ] Unit tests for path parsing
- [ ] Manual testing of click behavior

**User Stories:**

**Story 3.4.2.1: Clickable File Paths**
- **As a** user
- **I want** to click on file paths mentioned in AI messages to open them
- **So that** I can quickly navigate to files the AI is discussing

**Acceptance Criteria:**
- [ ] File paths in AI messages are styled as links (underlined, colored)
- [ ] Clicking file path opens file in editor
- [ ] If file already open, switches to existing tab
- [ ] Works for relative paths (./src/file.ts)
- [ ] Works for absolute paths (/Users/.../file.ts)
- [ ] Keyboard accessible (Enter to activate)

**Story 3.4.2.2: Operation Indicators**
- **As a** user
- **I want** visual indicators showing what operation AI performed
- **So that** I understand what changed at a glance

**Acceptance Criteria:**
- [ ] Create operations show file icon with "+" badge
- [ ] Edit operations show pencil icon
- [ ] Delete operations show trash icon
- [ ] Search operations show magnifying glass icon
- [ ] Bash operations show terminal icon

---

### Wave 3.4.3: Beta Testing and Bug Fixes

**Scope:** Conduct beta testing with Lighthouse developers, collect feedback, fix critical bugs

**Duration:** 2-3 days (concurrent with development)

**Deliverables:**
- [ ] Beta testing program setup (participants, channels, schedule)
- [ ] Onboarding documentation for beta users
- [ ] Feedback collection mechanism (Slack, surveys)
- [ ] Daily bug triage and prioritization
- [ ] P0 bug fixes (critical/blocking issues)
- [ ] P1 bug fixes (high-priority issues)
- [ ] MVP exit criteria validation
- [ ] Beta testing summary report

**Beta Testing Protocol:**

**Participants:**
- 10-15 Lighthouse developers
- Variety of project types (web, backend, monolith, microservices)
- Mix of experience levels (junior, mid, senior)

**Test Scenarios:**
1. **Codebase Exploration**: Use AI to understand unfamiliar codebase (navigate, read, explain)
2. **Multi-File Refactoring**: Perform refactoring task spanning multiple files
3. **Pattern Search**: Search for patterns across project using glob/grep
4. **Shell Commands**: Execute common shell commands (npm install, git status, tests)
5. **Permission Testing**: Test approve/deny workflow with various permission settings
6. **Visual Integration**: Verify explorer/editor update correctly after AI operations
7. **Error Handling**: Trigger error conditions and verify graceful handling

**Feedback Collection:**
- **Slack Channel**: #beacon-beta for real-time feedback and questions
- **Weekly Survey**: Satisfaction, issues, suggestions (5 questions)
- **Bug Reports**: GitHub Issues with template
- **Check-ins**: Brief 15-minute calls with participants (optional)

**Bug Prioritization:**

| Priority | Definition | Response Time |
|----------|------------|---------------|
| P0 (Critical) | Crashes, data loss, security issues | Fix immediately |
| P1 (High) | Major feature broken, workflow blocked | Fix within 24 hours |
| P2 (Medium) | Minor feature broken, workaround exists | Fix before Epic 3 close |
| P3 (Low) | Cosmetic, edge case, enhancement | Track for future |

---

## Testing Strategy

### Unit Tests

| Component | Test Cases |
|-----------|------------|
| FileOperationEvent | Valid event structure, all operation types, missing fields |
| parseFilePaths() | Common patterns (.ts, .tsx, .js), edge cases (no extension, special chars), no false positives |
| FileExplorerStore refresh | Create file updates tree, delete file removes from tree, edit updates metadata |
| EditorStore refresh | Open file refreshes, closed file ignored, preserve scroll position |
| Event debouncing | Rapid events batched, single event passes through, maxWait enforced |

**Coverage Target:** 80% line coverage

### Integration Tests

| Scenario | Components Tested |
|----------|-------------------|
| AI creates file, explorer updates | WriteTool -> IPC Event -> FileExplorerStore -> React render |
| AI edits open file, editor updates | EditTool -> IPC Event -> EditorStore -> Monaco refresh |
| AI deletes file, tab closes | DeleteTool -> IPC Event -> EditorStore -> Tab removal |
| Click file link opens in editor | ChatMessage -> handleFileClick -> EditorStore -> Monaco |
| Rapid operations debounced | Multiple tools -> IPC Events -> Debouncer -> Single refresh |

### Visual Integration Tests

| Scenario | Expected Behavior | Latency |
|----------|-------------------|---------|
| Create file via AI | File appears in explorer | < 100ms |
| Delete file via AI | File removed from explorer | < 100ms |
| Edit open file via AI | Editor content refreshes | < 100ms |
| Click file link | File opens in editor | < 200ms |
| Rapid create (5 files) | All 5 appear, no duplicates | < 500ms total |

### Security Tests

| Category | Test Cases |
|----------|------------|
| Path validation | File links with path traversal (../../../etc/passwd) blocked |
| IPC validation | Malformed events rejected, large payloads handled |
| XSS prevention | File paths with script tags properly escaped |

### Beta Testing Acceptance Criteria

| Criterion | Target | Validation Method |
|-----------|--------|-------------------|
| User onboarding success | 100% | All beta users complete setup |
| Daily active usage | 80% | Users use tool at least once daily |
| Bug report rate | < 5 P0/P1 per day | GitHub Issues tracking |
| User satisfaction | NPS > 40 | Survey results |
| Task completion | > 90% | Users complete assigned test scenarios |

---

## MVP Exit Criteria

This feature completes the MVP milestone. The following criteria must be met:

### Functional Criteria

| Criterion | Target | Validation |
|-----------|--------|------------|
| All 7 tools functional | 100% | Each tool executes successfully end-to-end |
| File operation success rate | > 95% | Operations complete without errors |
| Search performance | < 1 second | Glob/grep on typical codebase (1000 files) |
| Visual refresh latency | < 100ms | Explorer/editor update after operation |
| Permission enforcement | 100% | No unauthorized operations execute |
| SOC logging coverage | 100% | All operations logged |
| Clickable file links | 100% | Links parse and open correctly |

### User Validation Criteria

| Criterion | Target | Validation Method |
|-----------|--------|-------------------|
| Beta user adoption | 50+ developers | User tracking |
| User satisfaction | NPS > 40 | Survey |
| Productivity gain | 30%+ time savings | User feedback |
| Tool reliability | > 99% uptime | Error monitoring |
| Security validation | Zero violations | Security testing |

### Quality Gates

**Feature 3.4 Completion Gates:**
- [ ] Event emission working for all tools
- [ ] File explorer refreshes correctly on create/delete
- [ ] Editor refreshes correctly on edit
- [ ] Editor tabs close on delete
- [ ] Clickable file links work in chat
- [ ] Event debouncing prevents UI thrashing
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Security scan passed

**Epic 3 / MVP Completion Gates:**
- [ ] All 7 tools functional end-to-end
- [ ] Visual integration working correctly
- [ ] Beta testing completed with positive feedback
- [ ] All P0 bugs fixed
- [ ] All P1 bugs fixed
- [ ] Documentation updated
- [ ] NPS > 40 achieved
- [ ] 50+ active users validated
- [ ] Product is usable and valuable (beta confirms core concept)

---

## Risks and Mitigation

| Risk ID | Risk | Impact | Probability | Mitigation |
|---------|------|--------|-------------|------------|
| R1 | Visual refresh causes UI lag | Medium | Low | Event debouncing, async operations, batch updates |
| R2 | File path parsing false positives | Low | Medium | Comprehensive regex testing, escape heuristics |
| R3 | Race conditions between events | Medium | Low | IPC guarantees order, debouncing, atomic state updates |
| R4 | Beta users find critical bugs | Medium | Medium | 2-3 day buffer for fixes, prioritized triage |
| R5 | Large file refresh causes editor freeze | Medium | Low | Async loading, streaming for large files |
| R6 | External file changes cause sync issues | Medium | Low | Document limitation, provide manual refresh button |
| R7 | Beta adoption lower than expected | Medium | Low | Active recruitment, clear value proposition, support |

### Mitigation Details

**R1 - UI Lag:**
- Event debouncing with 100ms window
- Batch multiple rapid refreshes into single update
- Async file system operations (don't block UI thread)
- Profile and optimize hot paths
- Test with rapid operations (10+ files in 1 second)

**R4 - Beta Bugs:**
- 2-3 days buffer allocated for bug fixes
- Daily triage meetings during beta period
- P0/P1 bugs fixed immediately
- Clear communication with beta users
- Rollback plan if critical issues found

**R6 - External Changes:**
- Document that Beacon doesn't detect external edits automatically
- Provide manual "Refresh" button in file explorer
- Show warning if file modified externally when user tries to save
- Track as Epic 5 enhancement for file watching

---

## Security Considerations

### Event Validation

- Validate all IPC event payloads in renderer
- Reject events with malformed paths or unexpected operation types
- Log validation failures for debugging

### Path Sanitization

- File links must be validated before opening
- Block path traversal attempts (../ sequences)
- Resolve symlinks to verify within project root
- Reuse PathValidator from ADR-011

### XSS Prevention

- Escape file paths when rendering in React
- Use React's built-in XSS protection
- Don't use dangerouslySetInnerHTML for file content

### Audit Logging

- All visual refresh events logged to console (development)
- File link clicks logged to SOC (with user ID, timestamp)
- Error events logged with full context

---

## Definition of Done

### Feature Complete When:

- [ ] Event emission implemented for all 7 tools
- [ ] FileExplorerStore event handling complete
- [ ] EditorStore event handling complete
- [ ] Clickable file links in chat working
- [ ] Event debouncing preventing UI issues
- [ ] All unit tests passing (80% coverage)
- [ ] All integration tests passing
- [ ] Security scan passed
- [ ] Code review completed
- [ ] Beta testing completed
- [ ] All P0 bugs fixed
- [ ] All P1 bugs fixed
- [ ] MVP exit criteria validated
- [ ] Documentation updated

### MVP Complete When (Epic 3 Exit):

- [ ] All Feature 3.4 deliverables complete
- [ ] 50+ beta users actively using product
- [ ] NPS > 40 achieved
- [ ] 30%+ productivity gain reported
- [ ] Zero security violations
- [ ] Product provides immediate, measurable value
- [ ] Ready for Epic 4 (Multi-Provider Support)

---

## Related Documentation

### Epic Documentation
- Epic 3 Master Plan: `Docs/implementation/_main/epic-3-file-operation-tools-master-plan.md`
- Epic 3 Detailed Plan: `Docs/implementation/_main/epic-3-file-operation-tools-mvp.md`

### Feature Documentation
- Feature 3.1: Core File Tools
- Feature 3.2: Search and Discovery Tools
- Feature 3.3: Shell Command Tool and Enhanced Permissions

### Architecture Documentation
- Product Vision: `Docs/architecture/_main/01-Product-Vision.md`
- Business Requirements: `Docs/architecture/_main/03-Business-Requirements.md` (FR-7: Real-Time Visual Feedback)
- Architecture: `Docs/architecture/_main/04-Architecture.md`

### Epic 1 Foundation (Dependencies)
- Feature 1.4: File Explorer Component
- Feature 1.5: Monaco Editor Integration
- Feature 1.6: File Operations Bridge

---

## Architecture Decision Records (ADRs)

| ADR | Title | Relevance |
|-----|-------|-----------|
| ADR-013 | Visual Integration Pattern | Primary reference for event-based refresh |
| ADR-010 | File Operation Tool Architecture | Tool interface for event emission |
| ADR-011 | Directory Sandboxing Approach | Path validation for file links |
| ADR-014 | Permission System Enhancement | Permission context in events |
| ADR-003 | Zustand for State Management | Store patterns for event handling |
| ADR-001 | Electron as Desktop Framework | IPC communication pattern |

**ADR Locations:** `Docs/architecture/decisions/ADR-01X-*.md`

---

## Appendix: Beta Testing Materials

### Beta User Onboarding Checklist

1. [ ] Install Beacon application (download link provided)
2. [ ] Configure AI provider API key (Anthropic Claude)
3. [ ] Open test project directory
4. [ ] Complete "Getting Started" tutorial (5 minutes)
5. [ ] Join #beacon-beta Slack channel
6. [ ] Review test scenarios document
7. [ ] Acknowledge beta testing agreement

### Weekly Survey Questions

1. How satisfied are you with Beacon this week? (1-10)
2. What tasks did you use Beacon for?
3. Did you encounter any bugs or issues? (describe)
4. What feature would you most like to see improved?
5. Would you recommend Beacon to a colleague? (0-10 NPS)

### Bug Report Template

```markdown
**Summary:** Brief description of the issue

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:** What should happen

**Actual Behavior:** What actually happened

**Screenshots/Logs:** (if applicable)

**Environment:**
- OS: (macOS/Windows/Linux version)
- Beacon Version: (from About dialog)
- AI Provider: (Claude/GPT/etc.)

**Severity:** (P0 Critical / P1 High / P2 Medium / P3 Low)
```

---

**Document Information:**

| Field | Value |
|-------|-------|
| **Created By** | Wave Planner Agent |
| **Creation Date** | 2026-01-19 |
| **Last Updated** | 2026-01-19 |
| **Version** | 1.0 |
| **Status** | COMPLETE |
| **Next Review** | N/A - Feature complete |

---

*This feature plan is a planning document. Implementation will proceed only after explicit instruction following review cycles.*
