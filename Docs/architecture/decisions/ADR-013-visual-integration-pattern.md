# ADR-013: Visual Integration Pattern (Explorer Refresh, Editor Updates)

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Lighthouse Development Team
**Related**: Epic-3, Feature-3.4, Product Vision (Visual First), Business Requirements (FR-7)

---

## Context

Lighthouse Chat IDE enables conversational file operations, but these operations must integrate seamlessly with the visual IDE interface. When AI performs file operations:
- **File Explorer**: Must refresh to show new/deleted/renamed files
- **Editor Tabs**: Must refresh if open file modified by AI
- **Chat Interface**: Must show clickable file links
- **Status Indicators**: Must show pending operations

Product Vision: "Visual First, Conversational Always" - conversation and visual interface must stay synchronized.

**Requirements:**
- File explorer updates when AI creates/deletes files (<100ms latency)
- Editor tabs refresh when AI modifies open files (no stale content)
- Auto-open files in editor when AI references them
- Clickable file paths in chat (file://path format)
- Visual feedback for pending operations
- No UI freezing during rapid file operations
- Work with Zustand state management (Epic 1 architecture)
- Handle race conditions (multiple operations in parallel)

**Constraints:**
- File operations happen in main process (IPC to renderer)
- File explorer already has refresh logic from Epic 1
- Monaco Editor integration from Epic 1
- Cannot use file system watchers (performance concerns with large repos)
- Must work with existing Zustand stores

**User Experience Goals:**
- User sees file appear in explorer immediately after AI creates it
- Editor content updates without user needing to close/reopen
- Clicking file path in chat opens file in editor
- Clear indication when operations pending

---

## Considered Options

- **Option 1: Event-Based Refresh** - File operation tools emit events, UI components subscribe
- **Option 2: Polling File System** - UI polls for changes every 100ms
- **Option 3: File System Watcher** - Use Node.js fs.watch() or chokidar
- **Option 4: Manual Refresh Button** - User manually refreshes when needed
- **Option 5: Full Re-Render on Every Operation** - Re-fetch entire file tree
- **Option 6: Optimistic UI Updates** - Update UI before operation completes

---

## Decision

**We have decided to use an event-based refresh pattern where file operation tools emit events via IPC, and UI components subscribe to these events to update Zustand stores and trigger re-renders.**

### Why This Choice

Event-based pattern provides immediate updates without polling overhead or file watcher complexity.

**Key factors:**

1. **Immediate Updates**: UI updates as soon as operation completes (< 10ms after tool execution)

2. **No Polling Overhead**: Only update when changes actually happen (vs checking every 100ms)

3. **Targeted Updates**: Know exactly what changed (file path, operation type) - can update efficiently

4. **Existing Architecture**: Leverages Electron IPC already in use (Epic 1 foundation)

5. **Race Condition Safe**: Events queued and processed in order via IPC

6. **Testable**: Can emit mock events in tests to verify UI updates

**Event flow:**

```
AI suggests operation
  ↓
Permission approved
  ↓
Tool executes (main process)
  ↓
Tool emits IPC event: 'file-operation-complete'
  ↓
Renderer receives event
  ↓
Updates Zustand stores (fileExplorerStore, editorStore)
  ↓
React components re-render
  ↓
UI shows updated state
```

**Implementation:**

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
        paths: this.getAffectedPaths(params),
        timestamp: Date.now()
      });
    }

    return result;
  }

  private emitFileOperationEvent(event: FileOperationEvent): void {
    // Send via IPC to renderer process
    BrowserWindow.getAllWindows()[0].webContents.send(
      'file-operation-complete',
      event
    );
  }
}
```

```typescript
// src/renderer/stores/fileExplorerStore.ts
import { create } from 'zustand';

interface FileExplorerStore {
  files: FileNode[];
  refreshFile: (path: string) => Promise<void>;
  refreshDirectory: (path: string) => Promise<void>;
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
  }
}));

// Register IPC listener (renderer process)
window.api.onFileOperationComplete((event: FileOperationEvent) => {
  const store = useFileExplorerStore.getState();

  switch (event.operation) {
    case 'write':
    case 'edit':
      // File created or modified - refresh file
      event.paths.forEach(path => store.refreshFile(path));
      break;

    case 'delete':
      // File deleted - refresh parent directory
      event.paths.forEach(path => {
        const dir = path.split('/').slice(0, -1).join('/');
        store.refreshDirectory(dir);
      });
      break;

    case 'mkdir':
      // Directory created - refresh parent
      event.paths.forEach(path => {
        const parent = path.split('/').slice(0, -1).join('/');
        store.refreshDirectory(parent);
      });
      break;
  }
});
```

```typescript
// src/renderer/stores/editorStore.ts
export const useEditorStore = create<EditorStore>((set, get) => ({
  openTabs: [],

  refreshTab: async (path: string) => {
    // Re-read file content if tab open
    const content = await window.api.readFile(path);
    set((state) => ({
      openTabs: state.openTabs.map(tab =>
        tab.path === path
          ? { ...tab, content, modified: false }
          : tab
      )
    }));
  }
}));

// Listen for file modifications
window.api.onFileOperationComplete((event: FileOperationEvent) => {
  if (event.operation === 'write' || event.operation === 'edit') {
    const store = useEditorStore.getState();

    // Check if any modified file is open in editor
    event.paths.forEach(path => {
      const isOpen = store.openTabs.some(tab => tab.path === path);
      if (isOpen) {
        store.refreshTab(path);
      }
    });
  }
});
```

**Clickable file links in chat:**

```tsx
// src/renderer/components/ChatMessage.tsx
function ChatMessage({ message }: Props) {
  // Parse message for file paths
  const contentWithLinks = parseFilePaths(message.content);

  return (
    <MessageContainer>
      <Markdown
        content={contentWithLinks}
        renderers={{
          link: ({ href, children }) => {
            // Handle file:// links
            if (href.startsWith('file://')) {
              return (
                <FileLink
                  onClick={() => handleFileClick(href)}
                >
                  {children}
                </FileLink>
              );
            }
            return <a href={href}>{children}</a>;
          }
        }}
      />
    </MessageContainer>
  );
}

function handleFileClick(fileUrl: string) {
  const path = fileUrl.replace('file://', '');
  const editorStore = useEditorStore.getState();

  // Open file in editor
  editorStore.openFile(path);
}

// Convert file paths to file:// links
function parseFilePaths(content: string): string {
  // Match common file path patterns
  return content.replace(
    /([./][\w/.-]+\.(ts|tsx|js|jsx|md|json|css|html))/g,
    (match) => `[${match}](file://${match})`
  );
}
```

**Why we rejected alternatives:**

- **Polling**: Wasteful (checks even when no changes), adds 100ms latency, CPU overhead
- **File system watcher**: Complex setup, performance issues with large repos, cross-platform challenges
- **Manual refresh**: Poor UX, breaks "Visual First" principle
- **Full re-render**: Inefficient, causes UI flicker, doesn't preserve scroll position
- **Optimistic updates**: Can show incorrect state if operation fails, complex rollback

---

## Consequences

### Positive

- **Immediate Updates**: UI refreshes within 10ms of operation completion
- **Efficient**: Only update what changed (not full re-render)
- **No Polling**: Zero CPU overhead when idle
- **Race Condition Safe**: IPC events queued and processed in order
- **Visual First**: Conversation and visual interface stay synchronized
- **Clickable Paths**: File links in chat improve navigation
- **Testable**: Easy to test by emitting mock events

### Negative

- **IPC Overhead**: Extra IPC call for each file operation
- **Event Complexity**: Need to handle multiple event types correctly
- **State Coordination**: Multiple stores need to subscribe to events
- **No Proactive Discovery**: Won't detect external file changes (user edits outside Beacon)

### Mitigation Strategies

**For IPC overhead:**
- IPC calls are fast (<1ms) - acceptable overhead
- Batch multiple operations if possible (Epic 4 enhancement)
- Event payloads kept minimal (just paths and operation type)

**For event complexity:**
- Comprehensive tests for each event type
- Clear documentation of event format and handling
- Type-safe event definitions (TypeScript interfaces)

**For state coordination:**
- Centralize event handling logic
- Document which stores subscribe to which events
- Consider event bus pattern if complexity grows (future)

**For external changes:**
- Document that Beacon doesn't detect external edits automatically
- Provide manual "Refresh" button in file explorer
- Epic 5 enhancement: Optional file watcher for external change detection
- Show warning if file modified externally when user tries to save

---

## References

- Product Vision: Docs/architecture/_main/01-Product-Vision.md (Visual First, Conversational Always)
- Business Requirements: FR-7 (Real-Time Visual Feedback)
- Epic 3 Plan: `Docs/implementation/_main/epic-3-file-operation-tools-mvp.md`
- [Electron IPC](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- Related ADRs:
  - ADR-001: Electron as Desktop Framework
  - ADR-003: Zustand for State Management
  - ADR-010: File Operation Tool Architecture
- Implementation:
  - `src/tools/ToolExecutor.ts` (event emission)
  - `src/renderer/stores/fileExplorerStore.ts` (explorer refresh)
  - `src/renderer/stores/editorStore.ts` (editor refresh)
  - `src/renderer/components/ChatMessage.tsx` (clickable links)

---

**Last Updated**: 2026-01-19
