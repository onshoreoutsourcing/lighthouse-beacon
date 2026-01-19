# Phase 1: Desktop Foundation with Basic UI - Architecture Plan

**Version:** 1.0 - First Planning Iteration
**Date:** January 18, 2026
**Status:** Planning - Awaiting Review

---

## Planning Iteration Notes

This is the **first planning iteration** for Phase 1. After review:
- We will identify gaps and issues
- Iterate on architecture decisions
- Refine component boundaries
- Add more detail where needed
- Only proceed to implementation when explicitly instructed

---

## Phase 1 Overview

**Goal:** Create a modular, SOLID-based Electron application with file explorer and Monaco editor that can easily be extended with AI capabilities (Phase 2) and file operation tools (Phase 3).

**Core Principle:** Build infrastructure that's extensible, not just functional. Every component should be designed with future phases in mind.

---

## Technology Stack

### Core Technologies
- **Runtime:** Electron (latest stable)
- **Language:** TypeScript (strict mode)
- **Build Tool:** Vite (fast, modern, excellent for Electron)
- **UI Framework:** React 18+ (hooks-based, functional components)
- **State Management:** Zustand (lightweight, simple, no boilerplate)
- **Styling:** TailwindCSS + CSS Modules (utility-first, component-scoped)
- **Editor:** Monaco Editor (@monaco-editor/react)

### Development Tools
- **Package Manager:** pnpm (fast, efficient, workspace support for future)
- **Linting:** ESLint + Prettier
- **Type Checking:** TypeScript strict mode
- **Testing:** Vitest (Vite-native, fast) + React Testing Library (when needed)

### Electron-Specific
- **Electron Builder:** For packaging and distribution (future)
- **Electron Vite:** Vite plugin for Electron main/renderer separation

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Electron Application                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────┐         ┌──────────────────────┐  │
│  │  Main Process   │ ◄─IPC─► │  Renderer Process    │  │
│  │                 │         │                        │  │
│  │ - Window Mgmt   │         │  ┌──────────────────┐ │  │
│  │ - File System   │         │  │   React App      │ │  │
│  │ - IPC Handlers  │         │  │                  │ │  │
│  │ - App Lifecycle │         │  │ - File Explorer  │ │  │
│  │                 │         │  │ - Editor Panel   │ │  │
│  └─────────────────┘         │  │ - Layout Manager │ │  │
│                               │  └──────────────────┘ │  │
│                               │                        │  │
│  ┌─────────────────────────────────────────────────┐  │  │
│  │          Services Layer                         │  │  │
│  │  (Prepared for Phase 2 AI & Phase 3 File Ops)  │  │  │
│  └─────────────────────────────────────────────────┘  │  │
│                               └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## SOLID Principles Application

### Single Responsibility Principle (SRP)
Each module has ONE reason to change:
- **FileExplorer:** Only handles directory tree display and navigation
- **EditorPanel:** Only handles file editing and tab management
- **LayoutManager:** Only handles panel positioning and resizing
- **FileSystemService:** Only handles file I/O operations
- **IPCBridge:** Only handles main/renderer communication

### Open/Closed Principle (OCP)
Design for extension without modification:
- **Plugin Architecture:** Ready for Phase 2 AI services and Phase 3 tools
- **Event System:** Components communicate via events, not direct coupling
- **Provider Pattern:** File operations abstracted behind interfaces
- **Strategy Pattern:** Editor behaviors can be swapped/extended

### Liskov Substitution Principle (LSP)
Interfaces and abstractions are consistent:
- **IFileSystemProvider:** Any implementation (local, remote future, virtual) works
- **IEditorProvider:** Monaco can be swapped with other editors if needed
- **IPanelComponent:** All panels implement same interface for layout manager

### Interface Segregation Principle (ISP)
Small, focused interfaces:
- **IReadableFileSystem:** Only read operations
- **IWritableFileSystem:** Only write operations
- **IFileWatcher:** Only file watching capabilities
- Components depend only on interfaces they need

### Dependency Inversion Principle (DIP)
Depend on abstractions, not concrete implementations:
- UI components depend on service interfaces, not implementations
- Services injected via dependency injection pattern
- Easy to mock for testing
- Easy to swap implementations (e.g., Phase 2 AI services)

---

## Project Structure

```
lighthouse-beacon/
├── src/
│   ├── main/                          # Electron main process
│   │   ├── index.ts                   # Main process entry
│   │   ├── window-manager.ts          # Window creation/management
│   │   ├── ipc/                       # IPC handlers
│   │   │   ├── file-system-handler.ts # File operations IPC
│   │   │   └── index.ts               # Handler registration
│   │   └── services/                  # Main process services
│   │       └── file-system.service.ts # File system operations
│   │
│   ├── renderer/                      # Electron renderer process
│   │   ├── index.tsx                  # React entry point
│   │   ├── App.tsx                    # Root component
│   │   │
│   │   ├── components/                # React components
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx     # Three-panel layout
│   │   │   │   ├── ResizablePanel.tsx # Resizable panel wrapper
│   │   │   │   └── PanelContainer.tsx # Panel container
│   │   │   │
│   │   │   ├── file-explorer/
│   │   │   │   ├── FileExplorer.tsx   # Main explorer component
│   │   │   │   ├── TreeView.tsx       # Tree view component
│   │   │   │   ├── TreeNode.tsx       # Individual tree node
│   │   │   │   └── FileIcon.tsx       # File type icons
│   │   │   │
│   │   │   ├── editor/
│   │   │   │   ├── EditorPanel.tsx    # Editor container
│   │   │   │   ├── EditorTabs.tsx     # Tab bar
│   │   │   │   ├── MonacoEditor.tsx   # Monaco wrapper
│   │   │   │   └── EditorTab.tsx      # Individual tab
│   │   │   │
│   │   │   └── placeholder/
│   │   │       └── ChatPlaceholder.tsx # Empty center panel
│   │   │
│   │   ├── services/                  # Frontend services
│   │   │   ├── ipc.service.ts         # IPC communication wrapper
│   │   │   ├── file-explorer.service.ts # Explorer business logic
│   │   │   └── editor.service.ts      # Editor business logic
│   │   │
│   │   ├── stores/                    # Zustand state stores
│   │   │   ├── file-explorer.store.ts # Explorer state
│   │   │   ├── editor.store.ts        # Editor state
│   │   │   └── layout.store.ts        # Layout state
│   │   │
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useFileExplorer.ts     # Explorer hook
│   │   │   ├── useEditor.ts           # Editor hook
│   │   │   └── useLayout.ts           # Layout hook
│   │   │
│   │   ├── types/                     # TypeScript types
│   │   │   ├── file-system.types.ts   # File system types
│   │   │   ├── editor.types.ts        # Editor types
│   │   │   └── layout.types.ts        # Layout types
│   │   │
│   │   └── styles/                    # Global styles
│   │       ├── globals.css            # Global CSS
│   │       └── tailwind.css           # Tailwind imports
│   │
│   ├── shared/                        # Shared between main/renderer
│   │   ├── types/                     # Shared types
│   │   │   ├── ipc.types.ts           # IPC channel types
│   │   │   └── common.types.ts        # Common types
│   │   │
│   │   ├── constants/                 # Constants
│   │   │   ├── ipc-channels.ts        # IPC channel names
│   │   │   └── config.ts              # App configuration
│   │   │
│   │   └── interfaces/                # Shared interfaces (FUTURE)
│   │       ├── ai-service.interface.ts      # Phase 2
│   │       └── file-operations.interface.ts # Phase 3
│   │
│   └── preload/                       # Electron preload scripts
│       └── index.ts                   # Preload entry
│
├── electron-builder.config.js         # Electron Builder config
├── vite.config.ts                     # Vite configuration
├── tsconfig.json                      # TypeScript config
├── tailwind.config.js                 # Tailwind config
├── package.json                       # Dependencies
└── pnpm-workspace.yaml                # PNPM workspace (future)
```

---

## Core Module Design

### 1. Main Process Modules

#### WindowManager
**Responsibility:** Manage Electron windows lifecycle

```typescript
// src/main/window-manager.ts
interface IWindowManager {
  createMainWindow(): BrowserWindow;
  getMainWindow(): BrowserWindow | null;
  closeAllWindows(): void;
}

class WindowManager implements IWindowManager {
  private mainWindow: BrowserWindow | null = null;

  createMainWindow(): BrowserWindow {
    // Create window with configuration
    // Set up IPC handlers
    // Handle window lifecycle events
  }
}
```

**Extension Points:**
- Phase 2: Add AI service window if needed
- Phase 4: Settings window
- Future: Multiple project windows

#### FileSystemService
**Responsibility:** Handle all file system operations (main process side)

```typescript
// src/main/services/file-system.service.ts
interface IFileSystemService {
  readDirectory(path: string): Promise<DirectoryEntry[]>;
  readFile(path: string): Promise<FileContent>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  watchDirectory(path: string): void;
}

class FileSystemService implements IFileSystemService {
  // Implementation using Node.js fs/promises
  // Error handling
  // Path validation
  // Security checks (prevent access outside project)
}
```

**Extension Points:**
- Phase 3: Add glob, grep operations
- Phase 3: Add bash execution
- Future: Remote file system support

#### IPC Handlers
**Responsibility:** Bridge main process and renderer via IPC

```typescript
// src/main/ipc/file-system-handler.ts
export function registerFileSystemHandlers(
  ipcMain: IpcMain,
  fileSystemService: IFileSystemService
): void {
  // Register IPC handlers
  ipcMain.handle('fs:readDirectory', async (_, path) => {
    return await fileSystemService.readDirectory(path);
  });

  ipcMain.handle('fs:readFile', async (_, path) => {
    return await fileSystemService.readFile(path);
  });

  // ... more handlers
}
```

**Extension Points:**
- Phase 2: AI service IPC handlers
- Phase 3: Tool execution IPC handlers
- Phase 4: Settings IPC handlers

---

### 2. Renderer Process Modules

#### State Management (Zustand)

**FileExplorerStore:**
```typescript
// src/renderer/stores/file-explorer.store.ts
interface FileExplorerState {
  rootPath: string | null;
  expandedFolders: Set<string>;
  selectedFile: string | null;
  directoryTree: DirectoryNode | null;

  // Actions
  setRootPath: (path: string) => void;
  toggleFolder: (path: string) => void;
  selectFile: (path: string) => void;
  refreshTree: () => Promise<void>;
}

export const useFileExplorerStore = create<FileExplorerState>((set, get) => ({
  // Implementation
}));
```

**EditorStore:**
```typescript
// src/renderer/stores/editor.store.ts
interface EditorState {
  openFiles: Map<string, EditorFile>;
  activeFileId: string | null;
  unsavedChanges: Set<string>;

  // Actions
  openFile: (path: string) => Promise<void>;
  closeFile: (path: string) => void;
  saveFile: (path: string) => Promise<void>;
  updateContent: (path: string, content: string) => void;
  setActiveFile: (path: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Implementation
}));
```

**LayoutStore:**
```typescript
// src/renderer/stores/layout.store.ts
interface LayoutState {
  panelSizes: {
    left: number;  // percentage
    center: number;
    right: number;
  };

  // Actions
  updatePanelSize: (panel: 'left' | 'center' | 'right', size: number) => void;
  resetLayout: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  // Implementation
}));
```

**Extension Points:**
- Phase 2: Add ChatStore for AI conversation state
- Phase 3: Add ToolStore for tool execution state
- Phase 4: Add SettingsStore

---

#### Component Architecture

**MainLayout Component:**
```typescript
// src/renderer/components/layout/MainLayout.tsx
interface MainLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  leftPanel,
  centerPanel,
  rightPanel,
}) => {
  const { panelSizes, updatePanelSize } = useLayoutStore();

  return (
    <div className="flex h-screen">
      <ResizablePanel size={panelSizes.left} onResize={...}>
        {leftPanel}
      </ResizablePanel>
      <ResizablePanel size={panelSizes.center} onResize={...}>
        {centerPanel}
      </ResizablePanel>
      <ResizablePanel size={panelSizes.right} onResize={...}>
        {rightPanel}
      </ResizablePanel>
    </div>
  );
};
```

**Extension Points:**
- Phase 2: Center panel gets ChatInterface component
- Phase 4: Add settings panel overlay
- Phase 6: Add status bar component

**FileExplorer Component:**
```typescript
// src/renderer/components/file-explorer/FileExplorer.tsx
export const FileExplorer: React.FC = () => {
  const {
    rootPath,
    directoryTree,
    selectedFile,
    expandedFolders,
    setRootPath,
    toggleFolder,
    selectFile,
  } = useFileExplorerStore();

  const { openFile } = useEditorStore();

  const handleFileClick = (path: string) => {
    selectFile(path);
    openFile(path);
  };

  return (
    <div className="file-explorer">
      {/* Root path selector */}
      {/* Tree view */}
      {directoryTree && (
        <TreeView
          node={directoryTree}
          expandedFolders={expandedFolders}
          selectedFile={selectedFile}
          onFolderToggle={toggleFolder}
          onFileClick={handleFileClick}
        />
      )}
    </div>
  );
};
```

**Extension Points:**
- Phase 3: Visual indicators when AI modifies files
- Phase 5: Context menus for file operations
- Phase 5: Drag and drop support

**EditorPanel Component:**
```typescript
// src/renderer/components/editor/EditorPanel.tsx
export const EditorPanel: React.FC = () => {
  const {
    openFiles,
    activeFileId,
    unsavedChanges,
    closeFile,
    saveFile,
    updateContent,
    setActiveFile,
  } = useEditorStore();

  const activeFile = activeFileId ? openFiles.get(activeFileId) : null;

  return (
    <div className="editor-panel">
      <EditorTabs
        files={Array.from(openFiles.values())}
        activeFileId={activeFileId}
        unsavedChanges={unsavedChanges}
        onTabClick={setActiveFile}
        onTabClose={closeFile}
      />
      {activeFile && (
        <MonacoEditor
          path={activeFile.path}
          content={activeFile.content}
          language={activeFile.language}
          onChange={(content) => updateContent(activeFile.path, content)}
          onSave={() => saveFile(activeFile.path)}
        />
      )}
    </div>
  );
};
```

**Extension Points:**
- Phase 5: Diff view component
- Phase 5: Change review queue
- Phase 6: Split editor view

---

#### Services Layer

**IPCService:**
```typescript
// src/renderer/services/ipc.service.ts
import { IPC_CHANNELS } from '@/shared/constants/ipc-channels';

class IPCService {
  async readDirectory(path: string): Promise<DirectoryEntry[]> {
    return await window.electron.invoke(IPC_CHANNELS.FS_READ_DIRECTORY, path);
  }

  async readFile(path: string): Promise<FileContent> {
    return await window.electron.invoke(IPC_CHANNELS.FS_READ_FILE, path);
  }

  async writeFile(path: string, content: string): Promise<void> {
    return await window.electron.invoke(IPC_CHANNELS.FS_WRITE_FILE, path, content);
  }

  // ... more methods
}

export const ipcService = new IPCService();
```

**Extension Points:**
- Phase 2: AI service methods
- Phase 3: Tool execution methods
- Phase 4: Settings persistence methods

**FileExplorerService:**
```typescript
// src/renderer/services/file-explorer.service.ts
export class FileExplorerService {
  constructor(private ipcService: IPCService) {}

  async loadDirectoryTree(rootPath: string): Promise<DirectoryNode> {
    const entries = await this.ipcService.readDirectory(rootPath);
    return this.buildTree(entries, rootPath);
  }

  private buildTree(entries: DirectoryEntry[], parentPath: string): DirectoryNode {
    // Build tree structure
  }
}
```

**EditorService:**
```typescript
// src/renderer/services/editor.service.ts
export class EditorService {
  constructor(private ipcService: IPCService) {}

  async loadFile(path: string): Promise<EditorFile> {
    const content = await this.ipcService.readFile(path);
    return {
      path,
      content: content.data,
      language: this.detectLanguage(path),
      isDirty: false,
    };
  }

  async saveFile(path: string, content: string): Promise<void> {
    await this.ipcService.writeFile(path, content);
  }

  private detectLanguage(path: string): string {
    // Detect language from file extension
  }
}
```

---

## Type System

### Core Types

```typescript
// src/shared/types/ipc.types.ts
export interface DirectoryEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: Date;
}

export interface FileContent {
  path: string;
  data: string;
  encoding: string;
  size: number;
}

// src/renderer/types/file-system.types.ts
export interface DirectoryNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
  isExpanded?: boolean;
}

// src/renderer/types/editor.types.ts
export interface EditorFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
  cursorPosition?: { line: number; column: number };
}

export interface EditorTab {
  id: string;
  path: string;
  filename: string;
  isDirty: boolean;
}
```

### Future Phase Interfaces (Placeholder)

```typescript
// src/shared/interfaces/ai-service.interface.ts (Phase 2)
export interface IAIService {
  sendMessage(message: string): Promise<AIResponse>;
  streamMessage(message: string): AsyncIterator<AIStreamChunk>;
  executeToolCall(toolCall: ToolCall): Promise<ToolResult>;
}

// src/shared/interfaces/file-operations.interface.ts (Phase 3)
export interface IFileOperationsTool {
  read(path: string, options?: ReadOptions): Promise<string>;
  write(path: string, content: string): Promise<void>;
  edit(path: string, find: string, replace: string): Promise<void>;
  delete(path: string): Promise<void>;
  glob(pattern: string): Promise<string[]>;
  grep(pattern: string, path: string): Promise<GrepResult[]>;
}
```

---

## IPC Channel Design

### Channel Naming Convention

```typescript
// src/shared/constants/ipc-channels.ts
export const IPC_CHANNELS = {
  // File System (Phase 1)
  FS_READ_DIRECTORY: 'fs:readDirectory',
  FS_READ_FILE: 'fs:readFile',
  FS_WRITE_FILE: 'fs:writeFile',
  FS_DELETE_FILE: 'fs:deleteFile',
  FS_WATCH_DIRECTORY: 'fs:watchDirectory',

  // AI Service (Phase 2 - Placeholder)
  AI_SEND_MESSAGE: 'ai:sendMessage',
  AI_STREAM_MESSAGE: 'ai:streamMessage',
  AI_EXECUTE_TOOL: 'ai:executeTool',

  // File Operations (Phase 3 - Placeholder)
  TOOL_READ: 'tool:read',
  TOOL_WRITE: 'tool:write',
  TOOL_EDIT: 'tool:edit',
  TOOL_GLOB: 'tool:glob',
  TOOL_GREP: 'tool:grep',
  TOOL_BASH: 'tool:bash',
} as const;
```

---

## Extension Points for Future Phases

### Phase 2: AI Integration

**Where AI will plug in:**
1. **Center Panel:** Replace `ChatPlaceholder` with `ChatInterface` component
2. **New Store:** `useChatStore` for conversation state
3. **New Service:** `AIService` for AIChatSDK integration
4. **IPC Channels:** Add AI communication channels
5. **Main Process:** Add AI service coordinator

**No changes needed to:**
- File explorer
- Editor panel (initially)
- Layout system
- IPC infrastructure (just add new handlers)

### Phase 3: File Operation Tools

**Where tools will plug in:**
1. **New Service:** `FileOperationsService` implementing tool interfaces
2. **IPC Channels:** Add tool execution channels
3. **Chat Integration:** Link tools to AI conversation
4. **Editor Updates:** Refresh editor when AI modifies files
5. **Explorer Updates:** Refresh tree when AI creates/deletes files

**No changes needed to:**
- Core editor functionality
- Layout system
- File explorer UI (just refresh data)

### Phase 4+: Advanced Features

**Where features will plug in:**
1. **Settings Store:** Configuration management
2. **Diff View Component:** Replaces standard editor for review
3. **Context Menus:** Add to file explorer
4. **Keyboard Shortcuts:** Global event handler

---

## Build Configuration

### Vite Configuration Strategy

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron({
      entry: 'src/main/index.ts',
      vite: {
        // Main process config
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@main': path.resolve(__dirname, './src/main'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  // ... more config
});
```

### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"],
      "@main/*": ["./src/main/*"],
      "@renderer/*": ["./src/renderer/*"],
      "@shared/*": ["./src/shared/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Key Decisions & Rationale

### Why Vite?
- ✅ Fast HMR for React development
- ✅ Excellent TypeScript support
- ✅ Good Electron plugins available
- ✅ Modern, well-maintained
- ✅ Smaller bundle sizes than Webpack

### Why Zustand over Redux?
- ✅ Much simpler API, less boilerplate
- ✅ Excellent TypeScript support
- ✅ No context provider needed
- ✅ Easy to split into multiple stores
- ✅ Perfect for our modular approach

### Why React over Vue/Svelte?
- ✅ Largest ecosystem and community
- ✅ Monaco Editor has excellent React bindings
- ✅ Team familiarity (assumption)
- ✅ Mature Electron + React patterns
- ✅ Component library options for future

### Why TailwindCSS?
- ✅ Rapid prototyping for Phase 1
- ✅ Consistent design system
- ✅ Easy to override per component
- ✅ Good Monaco Editor integration
- ✅ Can coexist with CSS Modules for complex components

### Why pnpm?
- ✅ Faster than npm/yarn
- ✅ Efficient disk usage
- ✅ Workspace support for future monorepo needs
- ✅ Strict dependency resolution

---

## Open Questions & Decisions Needed

### 1. Root Path Selection
**Question:** How should users select the project root directory?
**Options:**
- A) File dialog on startup
- B) "Open Folder" button in file explorer
- C) Command line argument
- D) All of the above

**Recommendation:** Start with B, add C later for CLI integration

### 2. File Watching
**Question:** Should we implement file watching in Phase 1?
**Considerations:**
- Needed if external tools modify files
- Can be added later without architecture changes
- Adds complexity to Phase 1

**Recommendation:** Skip for Phase 1, add in Phase 3 when AI modifies files

### 3. File Size Limits
**Question:** Should we limit file sizes for Monaco Editor?
**Considerations:**
- Monaco can struggle with very large files (>1MB)
- Should show warning or refuse to open?
- Virtual scrolling helps but not perfect

**Recommendation:** Set soft limit (1MB) with warning, hard limit (10MB)

### 4. Unsaved Changes Handling
**Question:** How aggressive should we be about preventing data loss?
**Options:**
- A) Prompt before closing tabs with unsaved changes
- B) Auto-save after X seconds of inactivity
- C) Both

**Recommendation:** Start with A, add B in Phase 6 (polish)

### 5. Initial Window Size
**Question:** What should the default panel sizes be?
**Current thought:**
- Left (File Explorer): 20%
- Center (Future Chat): 40%
- Right (Editor): 40%

**Recommendation:** Make configurable, store in layout preferences

### 6. File Type Icon Set
**Question:** Which icon library for file types?
**Options:**
- A) VSCode icons (familiar to users)
- B) Custom set
- C) Simple generic icons

**Recommendation:** VSCode icons via vscode-icons or similar package

---

## Testing Strategy

### Phase 1 Testing Approach
**Manual Testing Priority:** Since Phase 1 is UI-focused, manual testing is primary

**Automated Tests:**
- Unit tests for services (FileSystemService, EditorService)
- Unit tests for store logic (Zustand actions)
- Integration tests for IPC communication
- Skip component tests for now (Phase 1 focus is getting UI working)

**Testing Tools:**
- Vitest for unit/integration tests
- Manual testing checklist for UI functionality

### Testing Checklist (Manual)
- [ ] Application launches without errors
- [ ] File explorer displays directory structure
- [ ] Folders expand/collapse correctly
- [ ] Clicking file opens in editor
- [ ] Monaco editor displays syntax highlighting
- [ ] Multiple files can be open in tabs
- [ ] Tab switching works correctly
- [ ] Closing tabs works
- [ ] Editing file content works
- [ ] Saving file (Ctrl+S/Cmd+S) works
- [ ] Panel resizing works
- [ ] Panel sizes persist across restarts (future)

---

## Implementation Phases (Within Phase 1)

### Phase 1.1: Project Setup & Electron Shell
**Tasks:**
- Initialize npm project with pnpm
- Install dependencies (Electron, Vite, React, TypeScript)
- Configure Vite for Electron
- Configure TypeScript
- Set up basic Electron main process
- Create basic window
- Verify hot reload works

**Deliverable:** Empty Electron window that launches

### Phase 1.2: Layout System
**Tasks:**
- Create MainLayout component
- Create ResizablePanel component
- Add TailwindCSS
- Implement basic three-panel layout
- Implement panel resizing
- Add placeholders for all three panels

**Deliverable:** Three-panel layout with resizing

### Phase 1.3: File Explorer
**Tasks:**
- Set up IPC for file system operations
- Implement FileSystemService in main process
- Create file explorer store
- Create TreeView components
- Implement expand/collapse
- Add file type icons
- Connect to IPC service

**Deliverable:** Working file explorer showing directory tree

### Phase 1.4: Monaco Editor Integration
**Tasks:**
- Install Monaco Editor packages
- Create editor store
- Create EditorPanel component
- Create MonacoEditor wrapper
- Implement tab system
- Connect file explorer clicks to editor
- Implement save functionality

**Deliverable:** Working editor with tabs and syntax highlighting

### Phase 1.5: Integration & Polish
**Tasks:**
- Connect all pieces together
- Handle edge cases (missing files, errors)
- Add loading states
- Basic error handling UI
- Testing and bug fixes
- Documentation

**Deliverable:** Complete Phase 1 with all features working

---

## Success Criteria (Phase 1)

### Functional Requirements
- ✅ Electron application launches successfully
- ✅ File explorer displays and navigates directory structure
- ✅ Clicking files opens them in Monaco editor
- ✅ Multiple files can be open simultaneously in tabs
- ✅ Manual editing works (typing, deleting, etc.)
- ✅ Saving files works (keyboard shortcut and menu)
- ✅ Panel resizing works smoothly
- ✅ Basic error handling (file not found, permission denied, etc.)

### Non-Functional Requirements
- ✅ Code follows SOLID principles
- ✅ Clear module boundaries
- ✅ Extension points identified and documented
- ✅ TypeScript strict mode with no errors
- ✅ All interfaces and types properly defined
- ✅ Services are properly abstracted
- ✅ IPC communication is type-safe
- ✅ Code is maintainable and well-organized

### Architecture Requirements
- ✅ Phase 2 (AI) can be added without modifying Phase 1 code
- ✅ Phase 3 (Tools) can be added without major refactoring
- ✅ Services are injectable and testable
- ✅ Components are reusable and composable
- ✅ State management is clear and predictable

---

## Next Steps (After Review)

1. **Review this document** - Identify gaps, issues, concerns
2. **Discuss open questions** - Make decisions on open items
3. **Refine architecture** - Adjust based on feedback
4. **Create detailed task breakdown** - Granular implementation tasks
5. **Review again** - Iterate until ready
6. **Wait for explicit go-ahead** - No implementation until instructed

---

## Notes for Future Iterations

### Things to Consider in Next Planning Round
- Detailed component props and interfaces
- More specific IPC message schemas
- Error handling strategy details
- Logging strategy (console, files, etc.)
- Development workflow (hot reload, debugging)
- Build and packaging details
- Monaco Editor configuration (themes, settings)
- Keyboard shortcut mapping
- Accessibility considerations

### Questions for Discussion
- Should we use a component library (e.g., Radix UI, shadcn/ui)?
- What's the error handling UX (toasts, modals, inline)?
- Do we need a theme system from the start?
- Should layout state persist to disk in Phase 1 or wait until Phase 4?

---

**Ready for review and feedback. This is planning iteration #1.**
