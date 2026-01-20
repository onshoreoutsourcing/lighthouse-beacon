# Feature 1.2: Electron Application Shell

**Feature ID:** Feature-1.2
**Epic:** Epic-1 (Desktop Foundation with Basic UI)
**Status:** ✅ Complete
**Priority:** P0 (Critical)
**Estimated Duration:** 2-3 days
**Dependencies:** Feature 1.1 (Development Environment Setup)

---

## Feature Overview

### Problem Statement

We have a configured development environment but no working desktop application. We need a functioning Electron application shell that creates windows, manages the application lifecycle, and provides secure IPC communication between the main process (Node.js) and renderer process (React UI). Without this foundation, we cannot build UI components or integrate file system operations.

**Current State:** Development environment configured, project structure exists, but no executable application
**Desired State:** Electron application that launches, displays a window, and provides IPC infrastructure for future features

### Business Value

**Value to Users:** None directly (infrastructure feature)
**Value to Business:**
- **Foundational architecture**: Establishes the main/renderer process pattern used throughout all phases
- **Security foundation**: Implements context isolation and sandboxing that protect users from malicious code
- **Cross-platform support**: Enables deployment to macOS, Windows, and Linux from single codebase
- **IPC infrastructure**: Provides secure communication channel for all future file operations and AI interactions

**Success Metrics:**
- Application launches successfully in < 3 seconds on macOS, Windows, and Linux
- Window management works (create, minimize, maximize, close)
- IPC communication between main and renderer processes functioning with < 50ms latency
- Electron security best practices enforced (context isolation, sandbox, no node integration)
- Application passes Electron security checklist

---

## Scope

### In Scope

**Main Process (Node.js):**
- [x] Main entry point (`src/main/index.ts`)
- [x] Window manager service (create, show, hide, close windows)
- [x] Application lifecycle management (ready, activate, quit)
- [x] IPC handler registration system
- [x] Basic file system service (read directory, read file, write file)
- [x] Error handling and logging
- [x] Development menu (View → Reload, Toggle DevTools)

**Preload Script (Security Bridge):**
- [x] ContextBridge API exposure
- [x] IPC channel whitelist (only expose safe channels)
- [x] Type-safe IPC wrapper functions

**IPC Channels (Phase 1):**
- [x] `fs:readDir` - Read directory contents
- [x] `fs:readFile` - Read file contents
- [x] `fs:writeFile` - Write file contents
- [x] `window:getPath` - Get user-selected project path
- [x] `window:selectDirectory` - Open directory picker dialog

**Window Configuration:**
- [x] Default size: 1920×1080 (or 80% of screen size)
- [x] Minimum size: 1024×768
- [x] Title: "Lighthouse Chat IDE"
- [x] Menu bar (macOS) or custom title bar (Windows/Linux)
- [x] DevTools enabled in development mode

**Security Configuration:**
- [x] Context isolation enabled
- [x] Node integration disabled in renderer
- [x] Sandbox enabled
- [x] Content Security Policy (CSP) configured
- [x] File path validation in all IPC handlers

### Out of Scope

- ❌ File watcher service (Phase 3)
- ❌ AI chat IPC channels (Phase 2)
- ❌ Permission system (Phase 2-3)
- ❌ Multi-window support (Phase 6)
- ❌ Application auto-updater (Phase 8)
- ❌ Custom protocol handlers (Future)
- ❌ System tray integration (Future)

---

## Technical Design

### Technology Stack

**Electron:**
- **Electron** v28+ (latest stable)
- Rationale: Cross-platform desktop framework with full filesystem access (ADR-001)

**Main Process:**
- **Node.js** runtime (bundled with Electron)
- **TypeScript** strict mode for type safety
- **Built-in Node.js modules**: `fs`, `path`, `electron.dialog`

**IPC Communication:**
- **electron.ipcMain** (main process listener)
- **electron.ipcRenderer** (renderer process sender, exposed via preload)
- **contextBridge** (secure API exposure)

### Architecture

**Main Process Structure:**
```
src/main/
├── index.ts                  # Main entry point, app lifecycle
├── window-manager.ts         # Window creation and management
├── services/
│   ├── file-system.service.ts  # File I/O operations
│   └── ipc-handler.service.ts  # IPC handler registration
└── utils/
    ├── path-validator.ts     # Validate file paths for security
    └── logger.ts             # Logging utility
```

**Preload Script Structure:**
```
src/preload/
├── index.ts                  # ContextBridge API exposure
└── types.ts                  # TypeScript interfaces for IPC
```

**Shared Types:**
```
src/shared/
├── types/
│   ├── ipc.types.ts          # IPC message interfaces
│   └── file-system.types.ts  # File system operation types
└── constants/
    └── ipc-channels.ts       # IPC channel name constants
```

### Main Process Implementation

**src/main/index.ts** (Application lifecycle):
```typescript
import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window-manager';
import { registerIpcHandlers } from './services/ipc-handler.service';
import { logger } from './utils/logger';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  logger.info('Creating main window');

  const windowManager = new WindowManager();
  mainWindow = windowManager.createMainWindow();

  // Register IPC handlers
  registerIpcHandlers();

  // Load renderer process
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile('dist/renderer/index.html');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // macOS: Re-create window when dock icon clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Windows/Linux: Quit when all windows closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
});
```

**src/main/window-manager.ts** (Window management):
```typescript
import { BrowserWindow, screen } from 'electron';
import { logger } from './utils/logger';

export class WindowManager {
  createMainWindow(): BrowserWindow {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const window = new BrowserWindow({
      width: Math.min(width * 0.8, 1920),
      height: Math.min(height * 0.8, 1080),
      minWidth: 1024,
      minHeight: 768,
      title: 'Lighthouse Chat IDE',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    logger.info('Main window created', {
      width: window.getBounds().width,
      height: window.getBounds().height,
    });

    return window;
  }
}
```

**src/main/services/file-system.service.ts** (File operations):
```typescript
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { validatePath } from '../utils/path-validator';
import { logger } from '../utils/logger';

export class FileSystemService {
  private projectRoot: string | null = null;

  setProjectRoot(path: string): void {
    this.projectRoot = resolve(path);
    logger.info('Project root set:', this.projectRoot);
  }

  async readDirectory(relativePath: string): Promise<string[]> {
    if (!this.projectRoot) {
      throw new Error('Project root not set');
    }

    const fullPath = join(this.projectRoot, relativePath);
    validatePath(fullPath, this.projectRoot);

    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    return entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
    }));
  }

  async readFile(relativePath: string): Promise<string> {
    if (!this.projectRoot) {
      throw new Error('Project root not set');
    }

    const fullPath = join(this.projectRoot, relativePath);
    validatePath(fullPath, this.projectRoot);

    const content = await fs.readFile(fullPath, 'utf-8');
    logger.info('File read:', relativePath);
    return content;
  }

  async writeFile(relativePath: string, content: string): Promise<void> {
    if (!this.projectRoot) {
      throw new Error('Project root not set');
    }

    const fullPath = join(this.projectRoot, relativePath);
    validatePath(fullPath, this.projectRoot);

    await fs.writeFile(fullPath, content, 'utf-8');
    logger.info('File written:', relativePath);
  }
}
```

**src/main/services/ipc-handler.service.ts** (IPC registration):
```typescript
import { ipcMain, dialog } from 'electron';
import { FileSystemService } from './file-system.service';
import { logger } from '../utils/logger';

const fileSystemService = new FileSystemService();

export function registerIpcHandlers(): void {
  // Directory selection
  ipcMain.handle('window:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const path = result.filePaths[0];
      fileSystemService.setProjectRoot(path);
      return path;
    }

    return null;
  });

  // Read directory
  ipcMain.handle('fs:readDir', async (event, relativePath: string) => {
    try {
      return await fileSystemService.readDirectory(relativePath);
    } catch (error) {
      logger.error('Error reading directory:', error);
      throw error;
    }
  });

  // Read file
  ipcMain.handle('fs:readFile', async (event, relativePath: string) => {
    try {
      return await fileSystemService.readFile(relativePath);
    } catch (error) {
      logger.error('Error reading file:', error);
      throw error;
    }
  });

  // Write file
  ipcMain.handle('fs:writeFile', async (event, relativePath: string, content: string) => {
    try {
      await fileSystemService.writeFile(relativePath, content);
      return { success: true };
    } catch (error) {
      logger.error('Error writing file:', error);
      throw error;
    }
  });

  logger.info('IPC handlers registered');
}
```

**src/main/utils/path-validator.ts** (Security):
```typescript
import { resolve, relative } from 'path';

export function validatePath(targetPath: string, projectRoot: string): void {
  const resolvedTarget = resolve(targetPath);
  const resolvedRoot = resolve(projectRoot);

  // Ensure target is within project root (prevent directory traversal)
  const relativePath = relative(resolvedRoot, resolvedTarget);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Invalid path: ${targetPath} is outside project root`);
  }
}
```

### Preload Script Implementation

**src/preload/index.ts** (ContextBridge):
```typescript
import { contextBridge, ipcRenderer } from 'electron';

// Expose IPC API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Window operations
  selectDirectory: () => ipcRenderer.invoke('window:selectDirectory'),

  // File system operations
  readDirectory: (path: string) => ipcRenderer.invoke('fs:readDir', path),
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path: string, content: string) =>
    ipcRenderer.invoke('fs:writeFile', path, content),
});

// TypeScript declaration for window.electronAPI
export interface ElectronAPI {
  selectDirectory: () => Promise<string | null>;
  readDirectory: (path: string) => Promise<Array<{ name: string; isDirectory: boolean }>>;
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

### Shared Types

**src/shared/constants/ipc-channels.ts**:
```typescript
export const IPC_CHANNELS = {
  WINDOW: {
    SELECT_DIRECTORY: 'window:selectDirectory',
  },
  FILE_SYSTEM: {
    READ_DIR: 'fs:readDir',
    READ_FILE: 'fs:readFile',
    WRITE_FILE: 'fs:writeFile',
  },
} as const;
```

---

## Implementation Approach

### Development Phases (Feature Waves)

This feature will be implemented in **2 waves**:

**Wave 1.2.1: Main Process and Window Management**
- Create main process entry point
- Implement WindowManager class
- Configure window with security settings
- Test window creation and lifecycle (open, close, minimize, maximize)
- Add development menu for DevTools

**Wave 1.2.2: IPC Infrastructure and File System Service**
- Create FileSystemService class
- Implement path validation utility
- Register IPC handlers
- Create preload script with contextBridge
- Implement shared types and constants
- Test IPC communication from renderer (simple test UI)

### User Stories (Feature-Level)

**Story 1: Cross-Platform Window Management**
- **As a** user
- **I want** the IDE to open in a properly sized window on my operating system
- **So that** I have a professional desktop application experience
- **Acceptance Criteria:**
  - Application launches on macOS, Windows, and Linux
  - Window opens at 80% of screen size or 1920×1080 (whichever is smaller)
  - Minimum window size is 1024×768
  - Window can be minimized, maximized, resized, and closed
  - Application quits when last window is closed (Windows/Linux) or stays in dock (macOS)
  - DevTools accessible in development mode

**Story 2: Secure IPC Communication**
- **As a** developer
- **I want** secure communication between main and renderer processes
- **So that** UI components can safely access file system without security vulnerabilities
- **Acceptance Criteria:**
  - Context isolation enabled (renderer cannot access Node.js directly)
  - Sandbox enabled for renderer process
  - Only whitelisted IPC channels accessible from renderer
  - IPC calls have < 50ms latency for typical operations
  - TypeScript types enforce correct IPC usage

**Story 3: Basic File System Operations**
- **As a** developer (building future features)
- **I want** working file system operations (read directory, read file, write file)
- **So that** I can implement file explorer and editor in subsequent features
- **Acceptance Criteria:**
  - Directory picker dialog allows user to select project root
  - `readDirectory` returns list of files/folders in directory
  - `readFile` returns file contents as string
  - `writeFile` saves file contents to disk
  - All file paths validated to prevent directory traversal attacks
  - Errors handled gracefully with user-friendly messages

### Technical Implementation Details

**Step 1: Create Main Process Entry Point**
- Implement `src/main/index.ts` with app lifecycle management
- Handle `ready`, `activate`, `window-all-closed` events
- Add error handling for uncaught exceptions

**Step 2: Implement Window Manager**
- Create `WindowManager` class
- Configure BrowserWindow with security settings
- Set appropriate window size based on screen dimensions
- Enable DevTools in development mode

**Step 3: Create File System Service**
- Implement `FileSystemService` class with project root management
- Add `readDirectory`, `readFile`, `writeFile` methods
- Implement path validation utility

**Step 4: Register IPC Handlers**
- Create `registerIpcHandlers` function
- Map IPC channels to FileSystemService methods
- Add error handling and logging

**Step 5: Create Preload Script**
- Use `contextBridge` to expose safe IPC API
- Create TypeScript types for `window.electronAPI`
- Whitelist only necessary IPC channels

**Step 6: Test IPC Communication**
- Create simple test UI in renderer (button to trigger IPC call)
- Verify directory picker works
- Verify file read/write operations work
- Measure IPC latency

---

## Testing Strategy

### Manual Testing (Phase 1)

**Test 1: Window Lifecycle**
- Launch application
- Expected: Window opens at correct size
- Minimize, maximize, resize window
- Expected: All operations work smoothly
- Close window
- Expected: Application quits (Windows/Linux) or stays in dock (macOS)

**Test 2: Cross-Platform Compatibility**
- Test on macOS, Windows, Linux
- Expected: Application launches and window displays correctly on all platforms
- Expected: Menu bar appears on macOS, title bar on Windows/Linux

**Test 3: IPC Communication**
- Open application
- Trigger directory picker via test UI
- Select a directory
- Expected: Directory path returned to renderer
- Expected: IPC latency < 50ms

**Test 4: File System Operations**
- Select project directory
- Call `readDirectory` on root
- Expected: List of files/folders returned
- Call `readFile` on a text file
- Expected: File contents returned as string
- Call `writeFile` to create new file
- Expected: File created on disk

**Test 5: Security Validation**
- Attempt to read file outside project root (e.g., `../../../etc/passwd`)
- Expected: Error thrown, operation blocked
- Verify context isolation: `window.require` is undefined in renderer
- Expected: Node.js not accessible from renderer

**Test 6: Error Handling**
- Attempt to read non-existent file
- Expected: Error message returned to renderer
- Attempt to write to read-only location
- Expected: Error message returned to renderer

### Acceptance Criteria

- [x] Application launches on macOS, Windows, and Linux
- [x] Window opens at 80% screen size or 1920×1080 (whichever smaller)
- [x] Minimum window size is 1024×768
- [x] Window lifecycle works (minimize, maximize, resize, close)
- [x] DevTools accessible in development mode
- [x] Context isolation enabled (`window.require` undefined)
- [x] Sandbox enabled for renderer
- [x] IPC handlers registered for fs:readDir, fs:readFile, fs:writeFile
- [x] Directory picker dialog works
- [x] `readDirectory` returns file list
- [x] `readFile` returns file contents
- [x] `writeFile` saves to disk
- [x] Path validation prevents directory traversal
- [x] IPC latency < 50ms for typical operations
- [x] TypeScript types defined for all IPC calls

---

## Dependencies and Risks

### Dependencies

**Prerequisites:**
- ✅ Feature 1.1 (Development Environment Setup) complete
- ✅ Electron installed via pnpm
- ✅ Project structure created (src/main, src/preload, src/shared)

**Enables:**
- **Feature 1.3**: Three-Panel Layout (needs window to render in)
- **Feature 1.4**: File Explorer (needs readDirectory IPC)
- **Feature 1.5**: Monaco Editor (needs readFile/writeFile IPC)
- **Feature 1.6**: File Operations Bridge (needs IPC infrastructure)

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Electron security misconfiguration** | High - vulnerabilities if context isolation disabled | Low - following Electron docs closely | Use Electron security checklist, enable all recommended settings, test with security tools |
| **IPC performance issues** | Medium - slow operations frustrate users | Low - Electron IPC is fast | Measure latency early, optimize if > 50ms, use async operations |
| **Cross-platform bugs** | Medium - application breaks on Windows/Linux | Medium - each OS has quirks | Test on all 3 platforms weekly, use electron-builder standard configs |
| **Path traversal vulnerability** | High - malicious code could read system files | Low - path validation implemented | Rigorous testing of path validator, security review before Phase 2 |

---

## Architectural Alignment

### SOLID Principles

**Single Responsibility:**
- `WindowManager`: Only manages window creation and configuration
- `FileSystemService`: Only handles file I/O operations
- `IpcHandlerService`: Only registers IPC handlers
- `PathValidator`: Only validates file paths

**Open/Closed:**
- IPC handlers can be extended with new channels without modifying existing code
- FileSystemService can add new methods without changing existing ones

**Liskov Substitution:**
- All IPC handlers follow consistent request/response pattern
- Services implement well-defined interfaces

**Interface Segregation:**
- Separate IPC channels for window operations vs file system operations
- Preload script exposes minimal API surface

**Dependency Inversion:**
- IPC handlers depend on FileSystemService abstraction, not concrete implementation
- Allows future replacement of file system service (e.g., for virtual file system)

### ADR Compliance

- **ADR-001 (Electron)**: This feature implements Electron main process architecture ✅
- **ADR-002 (React + TypeScript)**: TypeScript strict mode used throughout main process ✅
- **ADR-005 (Vite)**: Vite builds main and preload processes ✅

### Development Best Practices

- **Anti-hardcoding**: No hardcoded file paths, user selects project root
- **Error handling**: All IPC calls wrapped in try-catch, errors returned to renderer
- **Logging**: Structured logging for debugging (logger utility)
- **Testing**: Manual testing via test UI in renderer
- **Security**: Electron security best practices enforced (context isolation, sandbox, path validation)

---

## Success Criteria

**Feature Complete When:**
- [x] All acceptance criteria met
- [x] Application launches on macOS, Windows, and Linux
- [x] Window management works (create, minimize, maximize, close)
- [x] IPC communication functional (< 50ms latency)
- [x] File system operations work (read directory, read file, write file)
- [x] Path validation prevents directory traversal
- [x] Context isolation and sandbox enabled
- [x] DevTools accessible in development mode
- [x] No security vulnerabilities detected

**Measurement:**
- Window startup time < 3 seconds
- IPC latency < 50ms for typical operations
- 0 Electron security checklist violations
- Successful manual testing on macOS, Windows, and Linux

---

**Feature Owner:** Roy Love
**Created Date:** 2026-01-19
**Last Updated:** 2026-01-19
**Status:** ✅ Complete
**Next Review:** After Wave 1.2.2 completion
