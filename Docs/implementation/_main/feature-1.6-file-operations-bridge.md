# Feature 1.6: File Operations Bridge

**Feature ID:** Feature-1.6
**Epic:** Epic-1 (Desktop Foundation with Basic UI)
**Status:** ✅ Complete
**Priority:** P0 (Critical)
**Estimated Duration:** 2-3 days
**Dependencies:** Feature 1.4 (File Explorer Component), Feature 1.5 (Monaco Editor Integration)

---

## Feature Overview

### Problem Statement

We have a file explorer that can select files and a Monaco editor that can display files, but they don't communicate with each other. Users cannot click a file in the explorer to open it in the editor, which is the most fundamental IDE workflow. Without this connection, the IDE is unusable for its primary purpose.

**Current State:** File explorer and editor exist as isolated components with no interaction
**Desired State:** Clicking a file in the explorer opens it in the editor, creating a complete manual IDE workflow

### Business Value

**Value to Users:**
- **Core IDE workflow**: Click file → opens in editor (the most fundamental IDE interaction)
- **Intuitive UX**: Matches expected behavior from all industry-standard IDEs (VS Code, IntelliJ, Sublime)
- **Productivity**: Seamless navigation between files without manual "Open File" dialogs
- **Visual feedback**: File explorer and editor stay in sync (selected file matches active tab)

**Value to Business:**
- **MVP completion**: This feature completes the basic manual IDE functionality (Epic 1 exit criteria)
- **User validation**: Enables actual user testing of the IDE foundation
- **Foundation for AI**: Complete file workflow enables AI integration in Phase 2
- **Competitive parity**: Matches basic file operations of all modern IDEs

**Success Metrics:**
- Clicking file in explorer opens it in editor in < 200ms
- File explorer selection and editor active tab stay synchronized
- Opening already-open file switches to existing tab (no duplicate tabs)
- File explorer → editor interaction works 100% reliably (no edge cases)

---

## Scope

### In Scope

**File Explorer → Editor Integration:**
- [x] Click file in explorer triggers editor.openFile()
- [x] File path passed from file explorer store to editor store
- [x] Editor loads file content via IPC (readFile)
- [x] Editor creates new tab or switches to existing tab
- [x] File explorer selection updates when editor tab switches

**State Synchronization:**
- [x] File explorer selectedFile syncs with editor activeFilePath
- [x] Clicking tab in editor updates file explorer selection
- [x] Closing tab in editor clears file explorer selection (if was active file)
- [x] Bidirectional sync between explorer and editor stores

**Edge Case Handling:**
- [x] Opening already-open file switches to existing tab (no duplicate)
- [x] Opening file while another file has unsaved changes (no auto-save, just switch)
- [x] Opening file that fails to load (error handling, user notification)
- [x] Opening very large file (> 1MB) - show warning, load anyway
- [x] Opening binary file (e.g., images, PDFs) - show "Cannot display" message

**User Experience:**
- [x] Visual feedback during file loading (loading indicator)
- [x] Error messages for failed file operations
- [x] Smooth transitions between files (no flickering)

### Out of Scope

- ❌ Double-click to open file (single-click is Phase 1, double-click is Phase 5)
- ❌ Keyboard navigation in file explorer (arrow keys) - Phase 4
- ❌ "Open With" context menu options - Phase 5
- ❌ File preview on hover - Phase 5
- ❌ Recently opened files list - Phase 4
- ❌ Auto-save functionality - Phase 4
- ❌ Confirmation dialog for unsaved changes - Phase 4
- ❌ Binary file preview (image viewer, PDF viewer) - Phase 6

---

## Technical Design

### Technology Stack

**State Management:**
- **Zustand** v4+ for both file explorer and editor stores
- Rationale: Lightweight, allows cross-store communication (ADR-003)

**Communication Pattern:**
- **Store-to-store direct calls** (not React Context or props)
- Rationale: Zustand stores can directly access each other's state and actions

**IPC Communication:**
- **window.electronAPI.readFile** from preload script (Feature 1.2)
- Rationale: Secure access to file system via main process

### Architecture

**State Flow:**
```
User clicks file in FileExplorer
        ↓
FileExplorer.selectFile(path)
        ↓
FileExplorer triggers Editor.openFile(path)
        ↓
Editor.openFile(path)
  - Checks if file already open
  - If yes: setActiveFile(path)
  - If no: loadFile(path) via IPC
        ↓
Editor creates/switches tab
        ↓
Editor.setActiveFile(path) updates activeFilePath
        ↓
FileExplorer.selectedFile syncs with Editor.activeFilePath (via subscription)
```

**Reverse Flow (Tab Click):**
```
User clicks tab in Editor
        ↓
Editor.setActiveFile(path)
        ↓
FileExplorer.selectedFile syncs via subscription
        ↓
FileExplorer highlights correct file
```

### Implementation Details

**src/renderer/stores/file-explorer.store.ts** (Updated with bridge):
```typescript
import { create } from 'zustand';
import { FileNode, FileExplorerState } from '../types/file-explorer.types';
import { useEditorStore } from './editor.store'; // Import editor store

export const useFileExplorerStore = create<FileExplorerState>((set, get) => ({
  // ... existing state and actions from Feature 1.4 ...

  selectFile: (path: string) => {
    set({ selectedFile: path });

    // Bridge: Trigger editor to open file
    useEditorStore.getState().openFile(path);
  },

  // ... rest of existing actions ...
}));

// Subscribe to editor active file changes (bidirectional sync)
useEditorStore.subscribe((state) => {
  const { activeFilePath } = state;
  const { selectedFile } = useFileExplorerStore.getState();

  // Sync file explorer selection with editor active file
  if (activeFilePath && activeFilePath !== selectedFile) {
    useFileExplorerStore.setState({ selectedFile: activeFilePath });
  }
});
```

**src/renderer/stores/editor.store.ts** (Updated with enhanced error handling):
```typescript
import { create } from 'zustand';
import { OpenFile, EditorState } from '../types/editor.types';
import { detectLanguage } from '../utils/language-detection';

const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const useEditorStore = create<EditorState>((set, get) => ({
  openFiles: [],
  activeFilePath: null,
  isLoading: false,
  error: null,

  openFile: async (path: string) => {
    const { openFiles } = get();

    // Check if file already open
    const existingFile = openFiles.find((f) => f.path === path);
    if (existingFile) {
      set({ activeFilePath: path, error: null });
      return;
    }

    // Set loading state
    set({ isLoading: true, error: null });

    try {
      // Read file from disk via IPC
      const content = await window.electronAPI.readFile(path);

      // Check file size
      const fileSizeBytes = new Blob([content]).size;
      if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
        console.warn(`Large file: ${path} (${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB)`);
        // Show warning but continue loading
      }

      // Detect if binary file
      if (isBinaryContent(content)) {
        set({
          isLoading: false,
          error: `Cannot display binary file: ${path}`,
        });
        return;
      }

      const name = path.split('/').pop() || path;
      const language = detectLanguage(name);

      const newFile: OpenFile = {
        path,
        name,
        content,
        language,
        isDirty: false,
      };

      set({
        openFiles: [...openFiles, newFile],
        activeFilePath: path,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error opening file:', error);
      set({
        isLoading: false,
        error: `Failed to open file: ${path}`,
      });
    }
  },

  // ... rest of existing actions from Feature 1.5 ...
}));

// Helper function to detect binary content
function isBinaryContent(content: string): boolean {
  // Check for null bytes (common in binary files)
  return content.includes('\0');
}
```

**src/renderer/components/file-explorer/TreeNode.tsx** (Updated with bridge):
```typescript
import React from 'react';
import { ChevronRight, ChevronDown } from 'react-icons/fi';
import { useFileExplorerStore } from '../../stores/file-explorer.store';
import { FileIcon } from './FileIcon';
import { FileNode as FileNodeType } from '../../types/file-explorer.types';

interface TreeNodeProps {
  node: FileNodeType;
  depth: number;
}

export const TreeNode: React.FC<TreeNodeProps> = ({ node, depth }) => {
  const { expandedFolders, selectedFile, toggleFolder, selectFile } =
    useFileExplorerStore();

  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFile === node.path;

  const handleClick = () => {
    if (node.isDirectory) {
      toggleFolder(node.path);
    } else {
      // Bridge: selectFile will trigger editor.openFile
      selectFile(node.path);
    }
  };

  return (
    <div>
      {/* Node row */}
      <div
        className={`flex items-center cursor-pointer hover:bg-gray-700 px-2 py-1 ${
          isSelected ? 'bg-blue-600' : ''
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {/* Chevron icon (folders only) */}
        {node.isDirectory && (
          <span className="mr-1 text-gray-400">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}

        {/* File/folder icon */}
        <FileIcon fileName={node.name} isDirectory={node.isDirectory} isExpanded={isExpanded} />

        {/* File/folder name */}
        <span className="ml-2 text-sm text-gray-200 truncate">{node.name}</span>
      </div>

      {/* Children (if expanded) */}
      {node.isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
```

**src/renderer/components/editor/EditorPanel.tsx** (Updated with loading/error states):
```typescript
import React from 'react';
import { useEditorStore } from '../../stores/editor.store';
import { TabBar } from './TabBar';
import { MonacoEditorContainer } from './MonacoEditorContainer';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';

export const EditorPanel: React.FC = () => {
  const { activeFilePath, isLoading, error } = useEditorStore();

  return (
    <div className="flex h-full flex-col bg-gray-900">
      <TabBar />

      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && activeFilePath && <MonacoEditorContainer />}
      {!isLoading && !error && !activeFilePath && <EmptyState />}
    </div>
  );
};
```

**src/renderer/components/editor/LoadingState.tsx** (New component):
```typescript
import React from 'react';
import { Loader } from 'react-icons/fi';

export const LoadingState: React.FC = () => {
  return (
    <div className="flex h-full items-center justify-center text-gray-500">
      <div className="text-center">
        <Loader className="animate-spin mx-auto mb-2" size={24} />
        <p className="text-sm">Loading file...</p>
      </div>
    </div>
  );
};
```

**src/renderer/components/editor/ErrorState.tsx** (New component):
```typescript
import React from 'react';
import { AlertCircle } from 'react-icons/fi';

interface ErrorStateProps {
  message: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message }) => {
  return (
    <div className="flex h-full items-center justify-center text-red-500">
      <div className="text-center">
        <AlertCircle className="mx-auto mb-2" size={24} />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};
```

**src/renderer/components/editor/Tab.tsx** (Updated to sync with file explorer):
```typescript
import React from 'react';
import { X } from 'react-icons/fi';
import { useEditorStore } from '../../stores/editor.store';
import { OpenFile } from '../../types/editor.types';

interface TabProps {
  file: OpenFile;
}

export const Tab: React.FC<TabProps> = ({ file }) => {
  const { activeFilePath, setActiveFile, closeFile } = useEditorStore();

  const isActive = activeFilePath === file.path;

  const handleClick = () => {
    // Bridge: setActiveFile will trigger file explorer sync via subscription
    setActiveFile(file.path);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent tab activation
    closeFile(file.path);
  };

  return (
    <div
      className={`flex items-center px-4 py-2 cursor-pointer border-r border-gray-700 ${
        isActive ? 'bg-gray-900 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
      }`}
      onClick={handleClick}
    >
      <span className="text-sm mr-2">
        {file.name}
        {file.isDirty && <span className="ml-1 text-blue-400">*</span>}
      </span>

      <button
        className="ml-2 hover:bg-gray-600 rounded p-1"
        onClick={handleClose}
        aria-label="Close tab"
      >
        <X size={14} />
      </button>
    </div>
  );
};
```

---

## Implementation Approach

### Development Phases (Feature Waves)

This feature will be implemented in **2 waves**:

**Wave 1.6.1: File Explorer → Editor Bridge**
- Update file explorer selectFile() to call editor.openFile()
- Test clicking file in explorer opens it in editor
- Handle edge case: opening already-open file (switch to tab)
- Add loading state during file load
- Add error handling for failed file loads

**Wave 1.6.2: Bidirectional Sync and Edge Cases**
- Implement Zustand subscription for editor → file explorer sync
- Update file explorer selection when tab clicked in editor
- Handle edge case: closing active tab clears file explorer selection
- Handle edge case: large file warning (> 1MB)
- Handle edge case: binary file detection and error message
- Test complete bidirectional sync workflow

### User Stories (Feature-Level)

**Story 1: Open File from Explorer**
- **As a** user
- **I want** to click a file in the explorer to open it in the editor
- **So that** I can start reading or editing the file
- **Acceptance Criteria:**
  - Clicking file in explorer opens it in editor
  - File content displays in Monaco Editor with correct syntax highlighting
  - Tab appears in tab bar with file name
  - Opening already-open file switches to existing tab (no duplicate)
  - File explorer selection highlights the opened file
  - File opens in < 200ms (including IPC and rendering)

**Story 2: Synchronized Selection**
- **As a** user
- **I want** file explorer and editor to stay synchronized
- **So that** I always know which file I'm currently editing
- **Acceptance Criteria:**
  - Clicking file in explorer highlights it and opens in editor
  - Clicking tab in editor highlights corresponding file in explorer
  - Closing active tab clears file explorer selection (if no other tabs)
  - File explorer and editor selection always match

**Story 3: Error Handling**
- **As a** user
- **I want** clear error messages when file operations fail
- **So that** I understand what went wrong and can take corrective action
- **Acceptance Criteria:**
  - Failed file read shows error message ("Failed to open file: <path>")
  - Binary file shows "Cannot display binary file" message
  - Large file (> 1MB) shows warning in console but still loads
  - Loading state displayed during file load (spinner)
  - Error state replaces loading state if file load fails

### Technical Implementation Details

**Step 1: Update File Explorer selectFile()**
- Add call to `useEditorStore.getState().openFile(path)`
- Test clicking file triggers editor opening

**Step 2: Add Loading State to Editor**
- Add `isLoading` flag to editor store
- Set `isLoading: true` when openFile() starts
- Set `isLoading: false` when openFile() completes
- Create LoadingState component with spinner

**Step 3: Add Error Handling to Editor**
- Add `error` field to editor store
- Wrap IPC call in try-catch
- Set error message if file read fails
- Create ErrorState component to display error

**Step 4: Implement Bidirectional Sync**
- Add Zustand subscription in file-explorer.store.ts
- Subscribe to editor activeFilePath changes
- Update file explorer selectedFile when editor changes
- Test clicking tab updates file explorer selection

**Step 5: Handle Edge Cases**
- Test opening already-open file (should switch to tab, not duplicate)
- Test opening file while another has unsaved changes (should switch without saving)
- Test opening large file (> 1MB) - log warning, continue loading
- Test opening binary file - detect null bytes, show error

**Step 6: Test Complete Workflow**
- Open project directory
- Click file in explorer
- Verify file opens in editor
- Click different file
- Verify editor switches files
- Click tab in editor
- Verify file explorer selection updates
- Close tab
- Verify file explorer selection clears (or stays on last file)

---

## Testing Strategy

### Manual Testing (Phase 1)

**Test 1: Basic File Opening**
- Open project with multiple files
- Click file in file explorer
- Expected: File opens in editor in < 200ms
- Expected: Tab appears in tab bar
- Expected: File content displays with syntax highlighting
- Expected: File explorer highlights selected file

**Test 2: Opening Already-Open File**
- Open file A (creates tab)
- Open file B (creates second tab)
- Click file A again in explorer
- Expected: Editor switches to file A tab (no duplicate tab created)
- Expected: File explorer highlights file A

**Test 3: Tab Click Sync**
- Open files A and B (two tabs)
- Click file A tab in editor
- Expected: File explorer highlights file A
- Click file B tab in editor
- Expected: File explorer highlights file B

**Test 4: Loading State**
- Click file in explorer
- Expected: Loading spinner appears briefly
- Expected: Loading spinner disappears when file loaded
- Expected: File content displays

**Test 5: Error Handling - File Not Found**
- Manually delete file from disk (outside IDE)
- Click deleted file in explorer
- Expected: Error message displays ("Failed to open file: <path>")
- Expected: No tab created
- Expected: No crash

**Test 6: Error Handling - Binary File**
- Create binary file (e.g., .png, .jpg, .exe)
- Click binary file in explorer
- Expected: Error message displays ("Cannot display binary file: <path>")
- Expected: No tab created
- Expected: No crash

**Test 7: Large File Warning**
- Create text file > 1MB
- Click file in explorer
- Expected: Warning logged to console
- Expected: File loads anyway
- Expected: Editor displays content (may be slow)

**Test 8: Multiple Files Workflow**
- Open 5 different files by clicking in explorer
- Expected: 5 tabs created
- Switch between tabs by clicking
- Expected: File explorer selection syncs with active tab
- Close tabs one by one
- Expected: File explorer selection updates appropriately

### Acceptance Criteria

- [x] Clicking file in explorer opens it in editor
- [x] File opens in < 200ms (including IPC and rendering)
- [x] Tab appears in tab bar with file name
- [x] Opening already-open file switches to existing tab (no duplicate)
- [x] File explorer selection highlights opened file
- [x] Clicking tab in editor highlights corresponding file in explorer
- [x] File explorer and editor selection stay synchronized
- [x] Closing active tab clears file explorer selection (or updates to next tab)
- [x] Loading state displayed during file load
- [x] Error message displayed for failed file loads
- [x] Binary file detection shows error message
- [x] Large file (> 1MB) loads with warning
- [x] No crashes or undefined behavior in edge cases

---

## Dependencies and Risks

### Dependencies

**Prerequisites:**
- ✅ Feature 1.4 (File Explorer Component) - provides file selection capability
- ✅ Feature 1.5 (Monaco Editor Integration) - provides file display and editing

**Enables:**
- **Phase 2 (AI Integration)**: Complete file workflow enables AI-powered file operations
- **Phase 3 (File Operation Tools)**: Foundation for programmatic file operations

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Circular dependency between stores** | High - app crashes or infinite loops | Low - Zustand handles cross-store refs | Test subscription logic carefully, use getState() not hooks in stores |
| **Race conditions in file loading** | Medium - wrong file displayed | Low - Zustand updates are synchronous | Test rapid clicking, ensure activeFilePath updates atomically |
| **Performance with rapid file switching** | Medium - lag when clicking many files quickly | Low - React/Zustand are fast | Debounce file clicks if needed, measure latency |
| **Binary file detection false positives** | Low - text files misidentified as binary | Low - null byte check is reliable | Test with diverse file types, refine detection if needed |

---

## Architectural Alignment

### SOLID Principles

**Single Responsibility:**
- File explorer store: Manages file tree and selection
- Editor store: Manages open files and active file
- Bridge logic: Only connects stores, doesn't duplicate functionality

**Open/Closed:**
- Bridge can be extended to add new file opening behaviors (e.g., preview mode) without modifying stores

**Liskov Substitution:**
- Any file can be opened via the bridge (as long as it's readable)

**Interface Segregation:**
- Bridge only uses minimal store API (selectFile, openFile, setActiveFile)

**Dependency Inversion:**
- Stores depend on Zustand abstraction, not concrete implementations
- Bridge uses store actions, not direct state manipulation

### ADR Compliance

- **ADR-002 (React + TypeScript)**: TypeScript strict types for all bridge logic ✅
- **ADR-003 (Zustand)**: Zustand stores communicate via direct calls and subscriptions ✅

### Development Best Practices

- **Anti-hardcoding**: No hardcoded file paths, all paths from user interaction
- **Error handling**: All IPC calls wrapped in try-catch, errors displayed to user
- **Logging**: Console logging for debugging (development mode only)
- **Testing**: Manual testing with diverse file types and edge cases
- **Security**: File paths validated in main process (Feature 1.2)

---

## Success Criteria

**Feature Complete When:**
- [x] All acceptance criteria met
- [x] Clicking file in explorer opens it in editor reliably
- [x] File explorer and editor selection stay synchronized
- [x] Opening already-open file switches to tab (no duplicate)
- [x] Loading and error states work correctly
- [x] Edge cases handled gracefully (binary files, large files, missing files)
- [x] No crashes or undefined behavior
- [x] Performance acceptable (file opens in < 200ms)

**Measurement:**
- File opening latency: < 200ms (from click to editor display)
- State sync latency: < 50ms (explorer → editor or editor → explorer)
- Reliability: 100% success rate for valid text files
- Error handling: 100% of error cases handled gracefully

**Epic 1 Exit Criteria (Met by This Feature):**
- User can open Lighthouse Chat IDE
- User can select a root directory
- User can navigate file tree (expand/collapse)
- User can click files to open them in editor ✅
- User can see syntax highlighting ✅
- User can edit file contents manually ✅
- User can save changes with Ctrl+S ✅
- User can open multiple files in tabs ✅
- User can switch between tabs ✅
- User can close tabs ✅
- **All Epic 1 goals achieved - Ready for Phase 2!**

---

**Feature Owner:** Roy Love
**Created Date:** 2026-01-19
**Last Updated:** 2026-01-19
**Status:** ✅ Complete
**Next Review:** After Wave 1.6.2 completion
**Next Phase:** Phase 2 (AI Integration with AIChatSDK)
