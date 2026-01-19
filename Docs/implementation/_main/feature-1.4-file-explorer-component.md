# Feature 1.4: File Explorer Component

**Feature ID:** Feature-1.4
**Epic:** Epic-1 (Desktop Foundation with Basic UI)
**Status:** Planning
**Priority:** P0 (Critical)
**Estimated Duration:** 3-4 days
**Dependencies:** Feature 1.2 (Electron Application Shell), Feature 1.3 (Three-Panel Layout)

---

## Feature Overview

### Problem Statement

The IDE has a three-panel layout but the left panel is empty. Developers need a file explorer to visualize their project's directory structure and navigate between files. Without a file explorer, users cannot see what files exist in their project or select files to open in the editor.

**Current State:** Empty left panel with placeholder text
**Desired State:** Fully functional file tree with expand/collapse, file selection, and performance optimization for large directories

### Business Value

**Value to Users:**
- **Project visibility**: See complete project structure at a glance
- **Easy navigation**: Click to navigate through folders and files
- **Familiar UX**: Tree view matches industry-standard IDEs (VS Code, IntelliJ, Sublime)
- **Visual context**: Understand file location within project hierarchy

**Value to Business:**
- **Critical for MVP**: File explorer is required for basic IDE functionality (FR-2)
- **User adoption**: Professional file explorer drives user confidence in product quality
- **Foundation for AI**: File context enables AI to understand project structure (Phase 2+)

**Success Metrics:**
- Display 1000+ files without performance issues (< 100ms to render)
- Expand/collapse folders with < 50ms response time
- File selection highlights and enables editor opening (Feature 1.6)
- Tree view scrollable with virtualization for very large projects (10,000+ files)

---

## Scope

### In Scope

**File Tree Display:**
- [x] Hierarchical tree view of directory structure
- [x] File and folder icons with type differentiation
- [x] File/folder names with proper truncation for long names
- [x] Indentation to show nesting levels (visual hierarchy)
- [x] Scroll support for long file lists

**Expand/Collapse Functionality:**
- [x] Click folder to expand/collapse
- [x] Chevron icon indicating expand state (▶ collapsed, ▼ expanded)
- [x] Lazy loading: Load folder contents only when expanded
- [x] Persist expand/collapse state in Zustand store

**File Selection:**
- [x] Click file to select (highlight)
- [x] Only one file selected at a time (single selection)
- [x] Selected file highlighted with visual feedback
- [x] Selection state stored in Zustand store

**Performance Optimization:**
- [x] Lazy loading for folders (don't load until expanded)
- [x] Virtualization for very large file lists (1000+ items)
- [x] Debouncing for rapid expand/collapse actions
- [x] Efficient re-rendering (React.memo, useMemo)

**File Type Icons:**
- [x] Folder icons (open/closed states)
- [x] File icons for common types:
  - JavaScript/TypeScript (.js, .jsx, .ts, .tsx)
  - Python (.py)
  - Java (.java)
  - Markdown (.md)
  - JSON (.json)
  - CSS (.css, .scss, .sass)
  - HTML (.html)
  - Generic file icon (fallback)

### Out of Scope

- ❌ File operations (create, rename, delete, move) - Phase 5
- ❌ Context menu (right-click actions) - Phase 5
- ❌ File search/filtering - Phase 5
- ❌ Drag-and-drop file organization - Phase 6
- ❌ Git status indicators (modified, untracked) - Phase 5
- ❌ Multi-file selection (Ctrl+Click, Shift+Click) - Phase 5
- ❌ Breadcrumb navigation - Phase 5
- ❌ Quick file navigation (Ctrl+P fuzzy search) - Phase 4

---

## Technical Design

### Technology Stack

**UI Framework:**
- **React** v18+ with hooks (functional components only)
- Rationale: Modern, performant, TypeScript-friendly (ADR-002)

**Virtualization:**
- **react-window** or **react-virtualized** (optional, for 1000+ files)
- Rationale: Efficient rendering of large lists without DOM bloat

**State Management:**
- **Zustand** v4+ for file explorer state (expanded folders, selected file)
- Rationale: Lightweight, minimal boilerplate (ADR-003)

**Icons:**
- **react-icons** (Feather Icons or VS Code Icons)
- Rationale: Comprehensive icon library, tree-shakeable, TypeScript support

**IPC Communication:**
- **window.electronAPI.readDirectory** from preload script (Feature 1.2)
- Rationale: Secure access to file system via main process

### Component Architecture

**Component Hierarchy:**
```
FileExplorerPanel
├── FileExplorerHeader
│   └── ProjectName
├── FileTree
│   ├── TreeNode (recursive)
│   │   ├── FolderNode
│   │   │   ├── ChevronIcon
│   │   │   ├── FolderIcon
│   │   │   └── FolderName
│   │   └── FileNode
│   │       ├── FileIcon
│   │       └── FileName
│   └── VirtualList (if using virtualization)
└── LoadingSpinner (optional, during initial load)
```

**File Structure:**
```
src/renderer/
├── components/
│   └── file-explorer/
│       ├── FileExplorerPanel.tsx      # Main panel container
│       ├── FileTree.tsx               # Tree root component
│       ├── TreeNode.tsx               # Recursive tree node (folder or file)
│       ├── FileIcon.tsx               # File type icon component
│       └── FileExplorerHeader.tsx     # Header with project name
├── stores/
│   └── file-explorer.store.ts        # Zustand store
└── types/
    └── file-explorer.types.ts         # TypeScript interfaces
```

### Implementation Details

**src/renderer/types/file-explorer.types.ts** (TypeScript types):
```typescript
export interface FileNode {
  name: string;
  path: string;           // Relative path from project root
  isDirectory: boolean;
  children?: FileNode[];  // Only loaded if expanded
}

export interface FileExplorerState {
  rootPath: string | null;
  fileTree: FileNode[];
  expandedFolders: Set<string>;  // Paths of expanded folders
  selectedFile: string | null;   // Path of selected file
  isLoading: boolean;

  setRootPath: (path: string) => void;
  loadDirectory: (path: string) => Promise<void>;
  toggleFolder: (path: string) => void;
  selectFile: (path: string) => void;
  collapseAll: () => void;
}
```

**src/renderer/stores/file-explorer.store.ts** (Zustand store):
```typescript
import { create } from 'zustand';
import { FileNode, FileExplorerState } from '../types/file-explorer.types';

export const useFileExplorerStore = create<FileExplorerState>((set, get) => ({
  rootPath: null,
  fileTree: [],
  expandedFolders: new Set(),
  selectedFile: null,
  isLoading: false,

  setRootPath: (path: string) => {
    set({ rootPath: path });
    get().loadDirectory(''); // Load root directory
  },

  loadDirectory: async (relativePath: string) => {
    set({ isLoading: true });

    try {
      const entries = await window.electronAPI.readDirectory(relativePath);

      const nodes: FileNode[] = entries.map((entry) => ({
        name: entry.name,
        path: relativePath ? `${relativePath}/${entry.name}` : entry.name,
        isDirectory: entry.isDirectory,
        children: entry.isDirectory ? [] : undefined,
      }));

      // Sort: folders first, then files (alphabetically)
      nodes.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      // Update file tree
      if (relativePath === '') {
        set({ fileTree: nodes });
      } else {
        // Update children of specific folder (recursive update)
        set((state) => ({
          fileTree: updateTreeNode(state.fileTree, relativePath, nodes),
        }));
      }
    } catch (error) {
      console.error('Error loading directory:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFolder: (path: string) => {
    const { expandedFolders } = get();
    const newExpanded = new Set(expandedFolders);

    if (newExpanded.has(path)) {
      newExpanded.delete(path); // Collapse
    } else {
      newExpanded.add(path); // Expand
      get().loadDirectory(path); // Lazy load children
    }

    set({ expandedFolders: newExpanded });
  },

  selectFile: (path: string) => {
    set({ selectedFile: path });
  },

  collapseAll: () => {
    set({ expandedFolders: new Set() });
  },
}));

// Helper function to update tree node children
function updateTreeNode(
  tree: FileNode[],
  targetPath: string,
  children: FileNode[]
): FileNode[] {
  return tree.map((node) => {
    if (node.path === targetPath) {
      return { ...node, children };
    }
    if (node.children) {
      return { ...node, children: updateTreeNode(node.children, targetPath, children) };
    }
    return node;
  });
}
```

**src/renderer/components/file-explorer/FileExplorerPanel.tsx** (Main panel):
```typescript
import React, { useEffect } from 'react';
import { useFileExplorerStore } from '../../stores/file-explorer.store';
import { FileExplorerHeader } from './FileExplorerHeader';
import { FileTree } from './FileTree';

export const FileExplorerPanel: React.FC = () => {
  const { rootPath, setRootPath, isLoading } = useFileExplorerStore();

  useEffect(() => {
    // On mount, prompt user to select project directory
    const selectProjectDirectory = async () => {
      const path = await window.electronAPI.selectDirectory();
      if (path) {
        setRootPath(path);
      }
    };

    if (!rootPath) {
      selectProjectDirectory();
    }
  }, [rootPath, setRootPath]);

  return (
    <div className="flex h-full flex-col bg-gray-800">
      <FileExplorerHeader />

      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="p-4 text-gray-500">Loading project files...</div>
        )}
        {!isLoading && <FileTree />}
      </div>
    </div>
  );
};
```

**src/renderer/components/file-explorer/FileTree.tsx** (Tree root):
```typescript
import React from 'react';
import { useFileExplorerStore } from '../../stores/file-explorer.store';
import { TreeNode } from './TreeNode';

export const FileTree: React.FC = () => {
  const { fileTree } = useFileExplorerStore();

  if (fileTree.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm">No files in project.</div>
    );
  }

  return (
    <div className="py-2">
      {fileTree.map((node) => (
        <TreeNode key={node.path} node={node} depth={0} />
      ))}
    </div>
  );
};
```

**src/renderer/components/file-explorer/TreeNode.tsx** (Recursive node):
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

**src/renderer/components/file-explorer/FileIcon.tsx** (File type icons):
```typescript
import React from 'react';
import {
  FiFolder,
  FiFolderOpen,
  FiFile,
  FiFileText,
} from 'react-icons/fi';
import {
  SiJavascript,
  SiTypescript,
  SiPython,
  SiJava,
  SiMarkdown,
} from 'react-icons/si';

interface FileIconProps {
  fileName: string;
  isDirectory: boolean;
  isExpanded?: boolean;
}

export const FileIcon: React.FC<FileIconProps> = ({
  fileName,
  isDirectory,
  isExpanded,
}) => {
  if (isDirectory) {
    return isExpanded ? (
      <FiFolderOpen className="text-blue-400" size={16} />
    ) : (
      <FiFolder className="text-blue-400" size={16} />
    );
  }

  // File type detection
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'js':
    case 'jsx':
      return <SiJavascript className="text-yellow-400" size={16} />;
    case 'ts':
    case 'tsx':
      return <SiTypescript className="text-blue-500" size={16} />;
    case 'py':
      return <SiPython className="text-blue-400" size={16} />;
    case 'java':
      return <SiJava className="text-red-500" size={16} />;
    case 'md':
      return <SiMarkdown className="text-gray-400" size={16} />;
    case 'json':
      return <FiFileText className="text-green-400" size={16} />;
    default:
      return <FiFile className="text-gray-400" size={16} />;
  }
};
```

---

## Implementation Approach

### Development Phases (Feature Waves)

This feature will be implemented in **3 waves**:

**Wave 1.4.1: Basic File Tree Display**
- Create Zustand file explorer store
- Implement FileExplorerPanel component
- Implement FileTree component (no expand/collapse yet)
- Integrate IPC call to read root directory
- Display flat list of root files/folders
- Add basic styling

**Wave 1.4.2: Expand/Collapse and Lazy Loading**
- Implement TreeNode component with recursion
- Add expand/collapse functionality (toggle folder)
- Add chevron icons (▶ collapsed, ▼ expanded)
- Implement lazy loading (load children only when expanded)
- Test with large directories (1000+ files)

**Wave 1.4.3: File Selection and Performance Optimization**
- Add file selection on click
- Highlight selected file
- Implement FileIcon component with type detection
- Add virtualization (if needed for large projects)
- Optimize re-rendering with React.memo
- Test performance with 10,000+ file projects

### User Stories (Feature-Level)

**Story 1: Visual Project Structure**
- **As a** user
- **I want** to see my project's directory structure in a tree view
- **So that** I can understand how my files are organized
- **Acceptance Criteria:**
  - Tree view displays all files and folders in project
  - Files and folders sorted (folders first, then alphabetically)
  - Indentation shows nesting levels clearly
  - Tree view scrollable if content exceeds panel height
  - File/folder icons differentiate types visually

**Story 2: Navigate Through Folders**
- **As a** user
- **I want** to expand and collapse folders by clicking
- **So that** I can explore different parts of my project
- **Acceptance Criteria:**
  - Clicking folder expands/collapses it
  - Chevron icon indicates expand state (▶ collapsed, ▼ expanded)
  - Folder contents load only when expanded (lazy loading)
  - Expand state persists during session (Zustand store)
  - Expand/collapse responds in < 50ms

**Story 3: Select Files for Editing**
- **As a** user
- **I want** to click files to select them
- **So that** I can prepare to open them in the editor (Feature 1.6)
- **Acceptance Criteria:**
  - Clicking file highlights it with visual feedback
  - Only one file selected at a time
  - Selected file path stored in Zustand store
  - Selection state accessible from other components (editor bridge)

### Technical Implementation Details

**Step 1: Create Zustand Store**
- Define FileExplorerState interface
- Implement store with actions (setRootPath, loadDirectory, toggleFolder, selectFile)
- Add helper functions for tree updates

**Step 2: Implement FileExplorerPanel**
- Prompt user to select project directory on mount
- Call IPC to read root directory
- Display loading state while fetching
- Render FileTree component

**Step 3: Implement FileTree Component**
- Map over fileTree array
- Render TreeNode for each root item
- Handle empty state (no files)

**Step 4: Implement TreeNode Component**
- Recursive component rendering node and children
- Handle click events (toggle folder or select file)
- Render chevron icon for folders
- Render FileIcon component
- Apply indentation based on depth

**Step 5: Implement FileIcon Component**
- Detect file type from extension
- Return appropriate icon component
- Return folder icon (open/closed) for directories

**Step 6: Test Performance**
- Test with small project (10 files)
- Test with medium project (100 files)
- Test with large project (1000+ files)
- Test with very large project (10,000+ files)
- Measure rendering time (should be < 100ms)

**Step 7: Optimize (if needed)**
- Add React.memo to TreeNode component
- Add useMemo for expensive calculations
- Add virtualization with react-window (if > 1000 items)

---

## Testing Strategy

### Manual Testing (Phase 1)

**Test 1: Project Directory Selection**
- Launch application
- Expected: Directory picker dialog appears
- Select a project directory
- Expected: File tree loads and displays project structure

**Test 2: Tree View Display**
- Open project with mixed files and folders
- Expected: Folders appear first, then files
- Expected: All items sorted alphabetically within category
- Expected: File/folder icons displayed correctly

**Test 3: Expand/Collapse Folders**
- Click collapsed folder
- Expected: Folder expands, shows children, chevron changes to ▼
- Click expanded folder
- Expected: Folder collapses, hides children, chevron changes to ▶
- Expected: Response time < 50ms

**Test 4: Lazy Loading**
- Expand folder with 100+ files
- Expected: Files load only when folder expanded (not on initial render)
- Expected: Loading completes in < 500ms

**Test 5: File Selection**
- Click file
- Expected: File highlighted with blue background
- Click different file
- Expected: Previous selection cleared, new file highlighted
- Expected: Selection state stored in Zustand (verify with React DevTools)

**Test 6: Large Project Performance**
- Open project with 1000+ files
- Expected: Initial render < 100ms
- Expand/collapse folders
- Expected: No lag or stuttering
- Scroll through long file list
- Expected: Smooth scrolling at 60 FPS

**Test 7: File Type Icons**
- Create test project with various file types (.js, .ts, .py, .md, .json)
- Expected: Each file displays correct icon
- Folders display folder icon (open/closed based on state)

### Acceptance Criteria

- [x] Tree view displays project directory structure
- [x] Files and folders sorted (folders first, alphabetically)
- [x] Indentation shows nesting levels
- [x] Clicking folder expands/collapses it
- [x] Chevron icon indicates expand state
- [x] Folder contents lazy loaded (only when expanded)
- [x] Clicking file selects it (highlights with visual feedback)
- [x] Only one file selected at a time
- [x] Selected file path stored in Zustand
- [x] File type icons displayed correctly
- [x] Tree view scrollable
- [x] Performance: 1000+ files render in < 100ms
- [x] Performance: Expand/collapse responds in < 50ms

---

## Dependencies and Risks

### Dependencies

**Prerequisites:**
- ✅ Feature 1.2 (Electron Application Shell) - provides IPC for readDirectory
- ✅ Feature 1.3 (Three-Panel Layout) - provides left panel container

**Enables:**
- **Feature 1.6**: File Operations Bridge (file selection triggers editor opening)

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Performance with large projects** | Medium - slow rendering frustrates users | Medium - depends on project size | Implement lazy loading, use virtualization for 1000+ items, test early with large repos |
| **Recursive rendering issues** | High - stack overflow with deep nesting | Low - most projects < 10 levels deep | Add max depth limit (e.g., 50 levels), test with pathological cases |
| **IPC latency for large directories** | Medium - slow folder expansion | Low - modern SSDs are fast | Measure latency, optimize if > 500ms, show loading indicator |
| **Memory usage with many expanded folders** | Low - high memory if all folders expanded | Low - users typically expand few folders | Monitor memory usage, implement collapse-all feature if needed |

---

## Architectural Alignment

### SOLID Principles

**Single Responsibility:**
- `FileExplorerPanel`: Only manages file explorer container
- `FileTree`: Only renders root-level tree
- `TreeNode`: Only renders individual node (file or folder)
- `FileIcon`: Only selects and renders appropriate icon
- `file-explorer.store`: Only manages file explorer state

**Open/Closed:**
- FileIcon component can be extended with new file types without modifying existing code
- TreeNode can be styled differently without changing core logic

**Liskov Substitution:**
- TreeNode handles both files and folders (isDirectory determines behavior)
- FileIcon accepts any fileName and returns appropriate icon

**Interface Segregation:**
- TreeNode only requires node and depth props
- FileIcon only requires fileName, isDirectory, isExpanded

**Dependency Inversion:**
- Components depend on Zustand store abstraction (useFileExplorerStore hook)
- No direct coupling to IPC implementation (uses window.electronAPI interface)

### ADR Compliance

- **ADR-002 (React + TypeScript)**: React functional components with TypeScript strict types ✅
- **ADR-003 (Zustand)**: Zustand store manages file explorer state ✅

### Development Best Practices

- **Anti-hardcoding**: No hardcoded file paths, user selects project root
- **Error handling**: IPC calls wrapped in try-catch, errors logged to console
- **Logging**: Console logging for debugging (development mode only)
- **Testing**: Manual testing with projects of varying sizes
- **Security**: File paths validated in main process (Feature 1.2)

---

## Success Criteria

**Feature Complete When:**
- [x] All acceptance criteria met
- [x] Tree view displays project structure correctly
- [x] Expand/collapse works smoothly (< 50ms response)
- [x] File selection works with visual feedback
- [x] File type icons displayed correctly
- [x] Lazy loading prevents unnecessary IPC calls
- [x] Performance acceptable with 1000+ files (< 100ms render)
- [x] Tree view scrollable without layout issues
- [x] No memory leaks or performance degradation over time

**Measurement:**
- Initial render time: < 100ms for 1000 files
- Expand/collapse response: < 50ms
- IPC latency: < 500ms for large directories
- Memory usage: < 100MB for typical projects (1000 files)
- User satisfaction: Professional appearance matching VS Code file explorer

---

**Feature Owner:** Roy Love
**Created Date:** 2026-01-19
**Last Updated:** 2026-01-19
**Status:** Planning
**Next Review:** After Wave 1.4.3 completion
