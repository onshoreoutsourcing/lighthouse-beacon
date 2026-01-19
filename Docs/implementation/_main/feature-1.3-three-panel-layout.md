# Feature 1.3: Three-Panel Layout

**Feature ID:** Feature-1.3
**Epic:** Epic-1 (Desktop Foundation with Basic UI)
**Status:** Planning
**Priority:** P0 (Critical)
**Estimated Duration:** 2-3 days
**Dependencies:** Feature 1.2 (Electron Application Shell)

---

## Feature Overview

### Problem Statement

We have a working Electron window but no UI layout structure. The IDE requires a professional three-panel layout (file explorer, code editor, chat interface) that provides visual context for conversational development. Without this layout foundation, we cannot implement individual components like the file explorer or Monaco editor.

**Current State:** Empty Electron window with minimal React app
**Desired State:** Responsive three-panel layout with resizable panels that persists user preferences

### Business Value

**Value to Users:**
- **Professional IDE appearance**: Familiar layout matching industry-standard IDEs (VS Code, IntelliJ, etc.)
- **Customizable workspace**: Users can adjust panel sizes to match their workflow preferences
- **Visual context**: All three IDE contexts (files, code, AI chat) visible simultaneously

**Value to Business:**
- **Competitive differentiation**: Professional UI demonstrates product quality and attention to UX
- **User retention**: Customizable layout increases user comfort and productivity
- **Foundation for MVP**: Panel layout is required for all Phase 1 features

**Success Metrics:**
- Panels resize smoothly at 60 FPS
- Panel size preferences persist across application restarts
- Minimum/maximum panel widths enforced (15%-70%)
- Layout renders correctly on all screen sizes (1024×768 minimum)
- Layout adapts to window resizes without visual glitches

---

## Scope

### In Scope

**Three-Panel Structure:**
- [x] Left panel: File Explorer (20% default width, 15-50% range)
- [x] Center panel: Code Editor (45% default width, 30-70% range)
- [x] Right panel: Chat Interface (35% default width, 15-50% range)

**Panel Resizing:**
- [x] Draggable dividers between panels
- [x] Visual feedback during drag (cursor change, divider highlight)
- [x] Minimum width enforcement (15% of viewport)
- [x] Maximum width enforcement (70% of viewport)
- [x] Smooth resizing performance (60 FPS)

**Layout Persistence:**
- [x] Save panel widths to localStorage
- [x] Restore panel widths on application startup
- [x] Reset to defaults option (keyboard shortcut or menu)

**Responsive Design:**
- [x] Layout adapts to window resize
- [x] Maintains panel proportions during resize
- [x] Minimum window size support (1024×768)
- [x] Large display support (4K, ultrawide monitors)

**Styling:**
- [x] Professional color scheme (dark theme, following VS Code aesthetics)
- [x] Panel borders and dividers with proper contrast
- [x] Hover states for draggable dividers
- [x] CSS transitions for smooth interactions

### Out of Scope

- ❌ Panel content (file explorer, editor, chat) - implemented in Features 1.4-1.6
- ❌ Panel visibility toggles (hide/show panels) - Phase 5
- ❌ Panel drag-and-drop reordering - Phase 6
- ❌ Vertical panel splits (horizontal dividers) - Phase 6
- ❌ Multiple panel layouts (e.g., 2-panel, 4-panel) - Future
- ❌ Light theme - Phase 6
- ❌ Panel zoom controls - Future

---

## Technical Design

### Technology Stack

**UI Framework:**
- **React** v18+ with hooks (functional components only)
- Rationale: Modern, performant, TypeScript-friendly UI library (ADR-002)

**Styling:**
- **TailwindCSS** v3+ for utility-first styling
- **CSS Modules** (optional) for component-scoped styles
- Rationale: Fast development, consistent design system, excellent IDE support

**State Management:**
- **Zustand** v4+ for layout state (panel widths)
- Rationale: Lightweight, simple API, no boilerplate (ADR-003)

**Persistence:**
- **localStorage** API for saving panel widths
- Rationale: Built-in, synchronous, simple API for small data

### Component Architecture

**Component Hierarchy:**
```
App
└── MainLayout
    ├── LeftPanel (FileExplorerPanel)
    ├── ResizeDivider
    ├── CenterPanel (EditorPanel)
    ├── ResizeDivider
    └── RightPanel (ChatPanel)
```

**File Structure:**
```
src/renderer/
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx          # Three-panel container
│   │   ├── Panel.tsx               # Generic panel wrapper
│   │   └── ResizeDivider.tsx       # Draggable divider component
│   ├── file-explorer/
│   │   └── FileExplorerPanel.tsx   # Placeholder (Feature 1.4)
│   ├── editor/
│   │   └── EditorPanel.tsx         # Placeholder (Feature 1.5)
│   └── chat/
│       └── ChatPanel.tsx           # Placeholder (Phase 2)
├── stores/
│   └── layout.store.ts             # Zustand store for panel widths
└── styles/
    └── layout.css                  # Layout-specific styles
```

### Implementation Details

**src/renderer/stores/layout.store.ts** (Zustand store):
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutState {
  leftPanelWidth: number;   // Percentage (0-100)
  centerPanelWidth: number; // Percentage (0-100)
  rightPanelWidth: number;  // Percentage (0-100)

  setLeftPanelWidth: (width: number) => void;
  setCenterPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  resetPanelWidths: () => void;
}

const DEFAULT_WIDTHS = {
  left: 20,
  center: 45,
  right: 35,
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      leftPanelWidth: DEFAULT_WIDTHS.left,
      centerPanelWidth: DEFAULT_WIDTHS.center,
      rightPanelWidth: DEFAULT_WIDTHS.right,

      setLeftPanelWidth: (width: number) =>
        set({ leftPanelWidth: Math.max(15, Math.min(50, width)) }),

      setCenterPanelWidth: (width: number) =>
        set({ centerPanelWidth: Math.max(30, Math.min(70, width)) }),

      setRightPanelWidth: (width: number) =>
        set({ rightPanelWidth: Math.max(15, Math.min(50, width)) }),

      resetPanelWidths: () =>
        set({
          leftPanelWidth: DEFAULT_WIDTHS.left,
          centerPanelWidth: DEFAULT_WIDTHS.center,
          rightPanelWidth: DEFAULT_WIDTHS.right,
        }),
    }),
    {
      name: 'layout-storage', // localStorage key
    }
  )
);
```

**src/renderer/components/layout/MainLayout.tsx** (Main layout container):
```typescript
import React from 'react';
import { useLayoutStore } from '../../stores/layout.store';
import { Panel } from './Panel';
import { ResizeDivider } from './ResizeDivider';
import { FileExplorerPanel } from '../file-explorer/FileExplorerPanel';
import { EditorPanel } from '../editor/EditorPanel';
import { ChatPanel } from '../chat/ChatPanel';

export const MainLayout: React.FC = () => {
  const { leftPanelWidth, centerPanelWidth, rightPanelWidth } = useLayoutStore();

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-100">
      {/* Left Panel: File Explorer */}
      <Panel width={leftPanelWidth} minWidth={15} maxWidth={50}>
        <FileExplorerPanel />
      </Panel>

      {/* Divider between left and center */}
      <ResizeDivider
        onResize={(delta) => {
          // Adjust left and center panel widths
          const newLeftWidth = leftPanelWidth + delta;
          const newCenterWidth = centerPanelWidth - delta;
          useLayoutStore.getState().setLeftPanelWidth(newLeftWidth);
          useLayoutStore.getState().setCenterPanelWidth(newCenterWidth);
        }}
      />

      {/* Center Panel: Code Editor */}
      <Panel width={centerPanelWidth} minWidth={30} maxWidth={70}>
        <EditorPanel />
      </Panel>

      {/* Divider between center and right */}
      <ResizeDivider
        onResize={(delta) => {
          // Adjust center and right panel widths
          const newCenterWidth = centerPanelWidth + delta;
          const newRightWidth = rightPanelWidth - delta;
          useLayoutStore.getState().setCenterPanelWidth(newCenterWidth);
          useLayoutStore.getState().setRightPanelWidth(newRightWidth);
        }}
      />

      {/* Right Panel: Chat */}
      <Panel width={rightPanelWidth} minWidth={15} maxWidth={50}>
        <ChatPanel />
      </Panel>
    </div>
  );
};
```

**src/renderer/components/layout/Panel.tsx** (Generic panel wrapper):
```typescript
import React from 'react';

interface PanelProps {
  width: number;       // Percentage (0-100)
  minWidth: number;    // Percentage
  maxWidth: number;    // Percentage
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ width, minWidth, maxWidth, children }) => {
  const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width));

  return (
    <div
      className="overflow-hidden border-r border-gray-700"
      style={{
        width: `${clampedWidth}%`,
        minWidth: `${minWidth}%`,
        maxWidth: `${maxWidth}%`,
      }}
    >
      {children}
    </div>
  );
};
```

**src/renderer/components/layout/ResizeDivider.tsx** (Draggable divider):
```typescript
import React, { useState, useRef } from 'react';

interface ResizeDividerProps {
  onResize: (deltaPercentage: number) => void;
}

export const ResizeDivider: React.FC<ResizeDividerProps> = ({ onResize }) => {
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef<number>(0);
  const windowWidth = useRef<number>(window.innerWidth);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    windowWidth.current = window.innerWidth;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX.current;
    const deltaPercentage = (deltaX / windowWidth.current) * 100;

    onResize(deltaPercentage);
    startX.current = e.clientX;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`w-1 cursor-col-resize bg-gray-700 hover:bg-blue-500 transition-colors ${
        isDragging ? 'bg-blue-500' : ''
      }`}
      onMouseDown={handleMouseDown}
    />
  );
};
```

**src/renderer/components/file-explorer/FileExplorerPanel.tsx** (Placeholder):
```typescript
import React from 'react';

export const FileExplorerPanel: React.FC = () => {
  return (
    <div className="flex h-full flex-col bg-gray-800">
      <div className="border-b border-gray-700 p-3">
        <h2 className="text-sm font-semibold uppercase text-gray-400">Files</h2>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <p className="text-gray-500 text-sm">File explorer component (Feature 1.4)</p>
      </div>
    </div>
  );
};
```

**src/renderer/components/editor/EditorPanel.tsx** (Placeholder):
```typescript
import React from 'react';

export const EditorPanel: React.FC = () => {
  return (
    <div className="flex h-full flex-col bg-gray-900">
      <div className="border-b border-gray-700 p-3">
        <h2 className="text-sm font-semibold uppercase text-gray-400">Editor</h2>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <p className="text-gray-500 text-sm">Monaco editor component (Feature 1.5)</p>
      </div>
    </div>
  );
};
```

**src/renderer/components/chat/ChatPanel.tsx** (Placeholder):
```typescript
import React from 'react';

export const ChatPanel: React.FC = () => {
  return (
    <div className="flex h-full flex-col bg-gray-800">
      <div className="border-b border-gray-700 p-3">
        <h2 className="text-sm font-semibold uppercase text-gray-400">Chat</h2>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <p className="text-gray-500 text-sm">Chat interface (Phase 2)</p>
      </div>
    </div>
  );
};
```

---

## Implementation Approach

### Development Phases (Feature Waves)

This feature will be implemented in **2 waves**:

**Wave 1.3.1: Panel Structure and Styling**
- Install TailwindCSS and configure
- Create MainLayout component with three static panels
- Create Panel component with percentage-based widths
- Add professional styling (dark theme, borders, spacing)
- Test layout on different screen sizes (1024×768 to 4K)

**Wave 1.3.2: Panel Resizing and Persistence**
- Create ResizeDivider component with drag functionality
- Implement mouse event handlers (mousedown, mousemove, mouseup)
- Create Zustand layout store for panel widths
- Add localStorage persistence with zustand/middleware
- Test resizing performance (60 FPS target)
- Add keyboard shortcut for reset (Ctrl+0 / Cmd+0)

### User Stories (Feature-Level)

**Story 1: Professional Three-Panel Layout**
- **As a** user
- **I want** a professional IDE layout with three panels (files, editor, chat)
- **So that** I have visual context for all IDE operations
- **Acceptance Criteria:**
  - Three panels visible simultaneously (left, center, right)
  - Each panel has distinct visual styling (borders, headers)
  - Layout matches VS Code aesthetics (dark theme, gray color palette)
  - Layout renders correctly on 1024×768 minimum screen size
  - Layout scales to 4K and ultrawide displays without distortion

**Story 2: Customizable Panel Widths**
- **As a** user
- **I want** to resize panels by dragging dividers
- **So that** I can customize my workspace to match my workflow
- **Acceptance Criteria:**
  - Dividers between panels are draggable (visual cursor change on hover)
  - Dragging divider adjusts adjacent panel widths smoothly
  - Minimum panel width enforced (15% for left/right, 30% for center)
  - Maximum panel width enforced (50% for left/right, 70% for center)
  - Resizing performs at 60 FPS without lag or jank

**Story 3: Persistent Layout Preferences**
- **As a** user
- **I want** my panel width preferences to persist across sessions
- **So that** I don't have to reconfigure my workspace every time I open the IDE
- **Acceptance Criteria:**
  - Panel widths saved to localStorage when changed
  - Panel widths restored on application startup
  - Default widths used on first launch (20% / 45% / 35%)
  - Reset to defaults option available (keyboard shortcut)

### Technical Implementation Details

**Step 1: Install and Configure TailwindCSS**
```bash
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configure `tailwind.config.js`:
```javascript
module.exports = {
  content: ['./src/renderer/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          800: '#1e1e1e', // Panel background
          900: '#252526', // Main background
        },
      },
    },
  },
  plugins: [],
};
```

**Step 2: Create MainLayout Component**
- Implement three-panel structure with flexbox
- Use percentage-based widths from Zustand store
- Add placeholder content for each panel

**Step 3: Create ResizeDivider Component**
- Implement mouse event handlers (mousedown, mousemove, mouseup)
- Calculate delta in percentage based on window width
- Apply visual feedback (cursor change, color change on hover/drag)

**Step 4: Create Zustand Layout Store**
- Define interface with panel width state
- Implement setters with min/max validation
- Add localStorage persistence with zustand middleware

**Step 5: Test Resizing Performance**
- Use React DevTools Profiler to measure render performance
- Optimize if rendering > 16ms (60 FPS threshold)
- Test on low-end hardware (if available)

**Step 6: Test Responsive Behavior**
- Test on 1024×768 (minimum supported resolution)
- Test on 1920×1080 (common desktop resolution)
- Test on 4K (3840×2160)
- Test on ultrawide (3440×1440)
- Verify layout adapts without visual glitches

---

## Testing Strategy

### Manual Testing (Phase 1)

**Test 1: Layout Structure**
- Launch application
- Expected: Three panels visible (left, center, right)
- Expected: Default widths: 20% / 45% / 35%
- Expected: Professional dark theme styling

**Test 2: Panel Resizing**
- Hover over divider between panels
- Expected: Cursor changes to col-resize
- Expected: Divider highlights on hover
- Drag divider left/right
- Expected: Adjacent panels resize smoothly at 60 FPS
- Expected: No visual glitches or flickering

**Test 3: Minimum/Maximum Widths**
- Drag left divider fully to the left
- Expected: Left panel stops at 15% width
- Drag left divider fully to the right
- Expected: Left panel stops at 50% width
- Repeat for center and right panels
- Expected: Min/max enforced for all panels

**Test 4: Persistence**
- Resize panels to custom widths (e.g., 30% / 40% / 30%)
- Close application
- Reopen application
- Expected: Panel widths restored to custom values (30% / 40% / 30%)

**Test 5: Reset to Defaults**
- Resize panels to non-default widths
- Press Ctrl+0 / Cmd+0 (or use menu option)
- Expected: Panel widths reset to 20% / 45% / 35%

**Test 6: Responsive Behavior**
- Resize application window from 1024×768 to maximized
- Expected: Panels scale proportionally without visual glitches
- Expected: Layout remains functional at all window sizes

### Acceptance Criteria

- [x] Three panels visible simultaneously (left, center, right)
- [x] Default widths: 20% / 45% / 35%
- [x] Professional dark theme styling (VS Code aesthetics)
- [x] Dividers are draggable (cursor changes on hover)
- [x] Resizing performs at 60 FPS
- [x] Minimum widths enforced: 15% (left/right), 30% (center)
- [x] Maximum widths enforced: 50% (left/right), 70% (center)
- [x] Panel widths persist to localStorage
- [x] Panel widths restored on startup
- [x] Reset to defaults option available
- [x] Layout renders correctly on 1024×768 minimum
- [x] Layout scales to 4K without distortion

---

## Dependencies and Risks

### Dependencies

**Prerequisites:**
- ✅ Feature 1.2 (Electron Application Shell) complete
- ✅ React and TypeScript configured
- ✅ Electron window displaying React app

**Enables:**
- **Feature 1.4**: File Explorer Component (needs left panel container)
- **Feature 1.5**: Monaco Editor Integration (needs center panel container)
- **Phase 2**: Chat Interface (needs right panel container)

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Resizing performance issues** | Medium - poor UX if laggy | Low - flexbox is performant | Use React.memo for optimization, test on low-end hardware, measure with Profiler |
| **Cross-browser inconsistencies** | Low - Electron uses Chromium | Very Low - single browser engine | Test on different Electron versions if needed |
| **localStorage quota exceeded** | Low - only storing 3 numbers | Very Low - minimal data | Use try-catch for localStorage operations, fallback to defaults |
| **TailwindCSS bundle size** | Low - larger CSS bundle | Low - Tailwind purges unused styles | Configure purge options, measure bundle size, optimize if > 100KB |

---

## Architectural Alignment

### SOLID Principles

**Single Responsibility:**
- `MainLayout`: Only manages three-panel structure
- `Panel`: Only renders panel with specified width
- `ResizeDivider`: Only handles drag interactions
- `layout.store`: Only manages panel width state

**Open/Closed:**
- Panel component can be extended with new props without modification
- ResizeDivider can be styled differently without changing core logic

**Liskov Substitution:**
- Any component can be placed inside Panel (FileExplorer, Editor, Chat)
- ResizeDivider works between any two panels

**Interface Segregation:**
- Panel only requires width, minWidth, maxWidth props
- ResizeDivider only requires onResize callback

**Dependency Inversion:**
- Components depend on Zustand store abstraction (useLayoutStore hook)
- No direct coupling to localStorage implementation

### ADR Compliance

- **ADR-002 (React + TypeScript)**: React functional components with TypeScript strict types ✅
- **ADR-003 (Zustand)**: Zustand store manages layout state ✅

### Development Best Practices

- **Anti-hardcoding**: Panel widths configurable via store, not hardcoded in components
- **Error handling**: localStorage operations wrapped in try-catch
- **Logging**: Console logging for debugging (development mode only)
- **Testing**: Manual testing via application usage
- **Security**: No security concerns (UI-only feature)

---

## Success Criteria

**Feature Complete When:**
- [x] All acceptance criteria met
- [x] Three panels render correctly with default widths
- [x] Dividers draggable with visual feedback
- [x] Panel widths persist across application restarts
- [x] Resizing performs at 60 FPS
- [x] Layout responsive to window resizes
- [x] Professional dark theme styling applied
- [x] Reset to defaults option works

**Measurement:**
- Resizing frame rate: 60 FPS (measured with React DevTools Profiler)
- Panel width persistence: 100% success rate
- Layout rendering: No visual glitches on window resize
- User satisfaction: Professional appearance matching VS Code quality

---

**Feature Owner:** Roy Love
**Created Date:** 2026-01-19
**Last Updated:** 2026-01-19
**Status:** Planning
**Next Review:** After Wave 1.3.2 completion
