# Feature 10.2: Knowledge Base UI

## Feature Overview
- **Feature ID:** Feature-10.2
- **Epic:** Epic 10 - RAG Knowledge Base
- **Status:** Planning
- **Duration:** 3 waves, 2-3 weeks
- **Priority:** High (User-facing foundation)

## Implementation Scope

Feature 10.2 delivers the user interface for managing the RAG Knowledge Base in Lighthouse Chat IDE. This includes a new Knowledge Tab in the left sidebar, document management UI, memory usage visualization, and integration with the File Explorer for easy document addition.

**Objectives:**
- Create Knowledge Tab in left sidebar (next to File Explorer, Workflow tabs)
- Display indexed documents with status indicators (indexed, processing, error)
- Visualize memory usage with warning thresholds (80% warning, 95% critical)
- Provide Add Files/Folder buttons with progress indicators
- Integrate right-click context menu in File Explorer ("Add to Knowledge")
- Implement RAG toggle with persistent per-project settings
- Create Zustand store for knowledge base state management

## Technical Requirements

### Functional Requirements
- **FR-10.2.1**: Knowledge Tab visible in left sidebar with proper icon and active state
- **FR-10.2.2**: Document list shows all indexed documents with status badges (indexed ✓, processing ⏳, error ❌)
- **FR-10.2.3**: Memory usage bar displays current usage vs budget with visual warning states
- **FR-10.2.4**: "Add Files" button opens file picker for individual file selection
- **FR-10.2.5**: "Add Folder" button opens directory picker for recursive folder indexing
- **FR-10.2.6**: Progress indicator during indexing shows current file and completion percentage
- **FR-10.2.7**: Context menu in File Explorer includes "Add to Knowledge" option
- **FR-10.2.8**: Document removal via delete button or context menu
- **FR-10.2.9**: RAG toggle persists per project in Zustand store
- **FR-10.2.10**: Real-time memory status updates during indexing operations

### Non-Functional Requirements
- **Performance:**
  - UI remains responsive during bulk indexing (60fps)
  - Document list renders efficiently with virtual scrolling for 1000+ items
  - Memory status updates throttled to max 10 updates/second
  - Context menu appears within 100ms of right-click

- **Usability:**
  - Memory usage bar uses clear visual language (green/yellow/red)
  - Progress indicator shows estimated time remaining
  - Error messages provide actionable guidance
  - Tooltips explain memory thresholds and RAG toggle
  - Keyboard shortcuts for common actions

- **Accessibility:**
  - ARIA labels on all interactive elements
  - Keyboard navigation for document list
  - Screen reader announcements for status changes
  - High contrast mode support

- **Reliability:**
  - UI state persists across application restarts
  - Graceful handling of IPC errors
  - No UI blocking during long operations
  - Automatic refresh on external index changes

### Technical Constraints
- Must integrate with existing ActivityBar component (Epic 1)
- Must follow Zustand state management patterns (ADR-003)
- Must use existing IPC patterns for main/renderer communication (ADR-001)
- Must match VS Code-inspired design system
- Must respect React best practices (hooks, functional components)

## Dependencies

**Prerequisites (must complete before this Feature):**
- ✅ Feature 10.1: Vector Service & Embedding Infrastructure (IPC handlers for indexing)
- ✅ Epic 1: Desktop Foundation (ActivityBar, layout components)
- ✅ Epic 3: File Operations (File Explorer component for integration)
- ✅ Zustand state management patterns (ADR-003)

**Enables (this Feature enables):**
- Feature 10.4: Chat Integration (RAG toggle component reused)
- User visibility into knowledge base status and health

**External Dependencies:**
- **lucide-react**: Icons for UI (already in project)
- **React**: UI framework (already in project)
- **Zustand**: State management (already in project)
- **Feature 10.1 IPC handlers**: kb:add-file, kb:get-memory-status, etc.

## Logical Unit Tests

Unit tests will render React components and verify UI behavior:

**Test Cases:**
1. **Test: Knowledge Tab Renders**
   - Render KnowledgeTab component
   - Verify tab visible in sidebar
   - Verify icon displayed correctly
   - Verify active state styling

2. **Test: Document List Display**
   - Populate store with 3 documents (1 indexed, 1 processing, 1 error)
   - Render DocumentList component
   - Verify all 3 documents displayed
   - Verify correct status badges shown
   - Verify document metadata displayed (file path, size, timestamp)

3. **Test: Memory Usage Bar**
   - Set memory status to 85% (warning threshold)
   - Render MemoryUsageBar component
   - Verify bar shows yellow warning color
   - Verify percentage displayed correctly
   - Verify tooltip shows memory details

4. **Test: Add Files Button**
   - Click "Add Files" button
   - Verify file picker dialog opens
   - Mock file selection (2 files)
   - Verify IPC call made with correct file paths
   - Verify progress indicator appears

5. **Test: Add Folder Button**
   - Click "Add Folder" button
   - Verify directory picker dialog opens
   - Mock folder selection
   - Verify IPC call made with correct directory path
   - Verify recursive indexing starts

6. **Test: Context Menu Integration**
   - Right-click on file in File Explorer
   - Verify "Add to Knowledge" menu item appears
   - Click menu item
   - Verify file added to knowledge base

7. **Test: Document Removal**
   - Click delete button on document
   - Verify confirmation dialog appears
   - Confirm deletion
   - Verify IPC call made to remove document
   - Verify document removed from list

8. **Test: RAG Toggle Persistence**
   - Toggle RAG on
   - Reload application
   - Verify RAG still enabled (persisted state)

9. **Test: Progress Indicator**
   - Start indexing 10 files
   - Verify progress bar shows 0/10
   - Mock progress updates (3/10, 7/10, 10/10)
   - Verify progress bar updates correctly
   - Verify current file name displayed

10. **Test: Memory Warning Display**
    - Set memory to 82% (above warning threshold)
    - Verify warning icon appears
    - Verify tooltip explains warning
    - Set memory to 96% (above critical threshold)
    - Verify critical styling applied

## Testing Strategy and Acceptance Criteria

### Testing Strategy
- **Unit Tests:**
  - `KnowledgeTab.test.tsx`: Tab visibility, layout, basic interactions
  - `DocumentList.test.tsx`: Document display, status badges, sorting
  - `DocumentItem.test.tsx`: Individual document rendering, actions
  - `MemoryUsageBar.test.tsx`: Memory visualization, thresholds
  - `AddFilesDialog.test.tsx`: File/folder picker integration
  - `useKnowledgeStore.test.ts`: Zustand store actions, persistence

- **Integration Tests:**
  - End-to-end: Open Knowledge Tab → Add files → See documents indexed → Check memory usage
  - Context menu flow: Right-click in File Explorer → Add to Knowledge → Verify in Knowledge Tab
  - Persistence test: Toggle RAG → Restart app → Verify state persisted

- **Visual Regression Tests:**
  - Screenshot comparisons for all UI states (empty, loading, populated, error, warning)

- **Accessibility Tests:**
  - Keyboard navigation through document list
  - Screen reader announcements
  - ARIA labels verification

### Acceptance Criteria
- [ ] Knowledge Tab visible in left sidebar with correct icon
- [ ] Tab shows document count badge when documents indexed
- [ ] Document list displays all indexed documents with correct status
- [ ] Status badges update in real-time during indexing
- [ ] Memory usage bar shows current usage vs budget (500MB)
- [ ] Memory bar turns yellow at 80% usage (warning)
- [ ] Memory bar turns red at 95% usage (critical)
- [ ] "Add Files" button opens file picker and indexes selected files
- [ ] "Add Folder" button opens directory picker and indexes recursively
- [ ] Progress indicator shows during indexing with file count and current file
- [ ] Context menu in File Explorer includes "Add to Knowledge" option
- [ ] Context menu action successfully adds file to knowledge base
- [ ] Document removal button removes document from list and index
- [ ] RAG toggle persists per project (survives application restart)
- [ ] All unit tests passing (coverage ≥ 90%)
- [ ] All integration tests passing
- [ ] Accessibility audit passed (WCAG 2.1 Level AA)
- [ ] Visual regression tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated

## Integration Points

### Integration with Other Features
- **Feature 10.1 (Vector Service):** IPC calls to kb:add-file, kb:remove-document, kb:get-memory-status
- **Feature 10.3 (RAG Pipeline):** Memory status informs when indexing capacity reached
- **Feature 10.4 (Chat Integration):** RAG toggle component reused in chat UI

### Integration with Other Epics
- **Epic 1 (Desktop Foundation):** Extends ActivityBar with new Knowledge Tab
- **Epic 3 (File Operations):** Integrates with File Explorer for context menu

### External Integrations
- **Electron Dialog API**: For file/folder picker dialogs
- **IPC Bridge**: Communication with VectorService in main process

## Implementation Phases

### Wave 10.2.1: Knowledge Tab & Document List
- Create KnowledgeTab component with sidebar integration
- Implement DocumentList component with status badges
- Create DocumentItem component with actions
- Add Knowledge Tab to ActivityBar
- Write unit tests for components
- **Deliverables:** KnowledgeTab.tsx, DocumentList.tsx, DocumentItem.tsx, tests

### Wave 10.2.2: Memory Usage Bar & Progress Indicators
- Create MemoryUsageBar component with threshold visualization
- Implement IndexingProgress component with file count
- Add real-time memory status updates
- Implement progress events from IPC
- Write unit tests for memory and progress
- **Deliverables:** MemoryUsageBar.tsx, IndexingProgress.tsx, tests

### Wave 10.2.3: File Operations & Zustand Store
- Implement AddFilesDialog with file/folder pickers
- Create useKnowledgeStore with persistence
- Add context menu integration in File Explorer
- Implement RAG toggle with per-project persistence
- Wire up IPC handlers for all operations
- Write integration tests
- **Deliverables:** AddFilesDialog.tsx, useKnowledgeStore.ts, context menu, tests

## Architecture and Design

### Component Architecture

```
src/renderer/components/knowledge/
├── KnowledgeTab.tsx           # Main sidebar tab container
├── DocumentList.tsx           # List of indexed documents
├── DocumentItem.tsx           # Single document row with actions
├── MemoryUsageBar.tsx         # Memory budget visualization
├── IndexingProgress.tsx       # Progress indicator during indexing
├── AddFilesDialog.tsx         # File/folder picker dialog
└── __tests__/                 # Component tests

src/renderer/stores/
└── knowledge.store.ts         # Zustand store for KB state

src/renderer/hooks/
└── useKnowledgeOperations.ts  # Hook for IPC operations
```

**Component Hierarchy:**

```
ActivityBar (existing)
└── KnowledgeTab ← NEW
    ├── Header
    │   ├── Title + Document Count Badge
    │   └── Actions
    │       ├── Add Files Button
    │       └── Add Folder Button
    ├── MemoryUsageBar
    │   ├── Progress Bar (visual)
    │   └── Memory Label (text)
    ├── IndexingProgress (conditional)
    │   ├── Progress Bar
    │   ├── File Count (3/10)
    │   └── Current File Name
    └── DocumentList
        └── DocumentItem[]
            ├── FileIcon
            ├── File Path
            ├── Status Badge
            ├── Memory Size
            └── Actions (Remove button)
```

### Data Model

**KnowledgeState:**
```typescript
interface KnowledgeState {
  documents: IndexedDocument[];
  memoryStatus: MemoryStatus;
  isIndexing: boolean;
  indexingProgress: IndexingProgress | null;
  ragEnabled: boolean;

  // Actions
  addFiles: (mode: 'files' | 'folder') => Promise<void>;
  removeDocument: (docId: string) => Promise<void>;
  refreshMemoryStatus: () => Promise<void>;
  toggleRag: () => void;
  loadProjectSettings: (projectPath: string) => Promise<void>;
}
```

**IndexedDocument:**
```typescript
interface IndexedDocument {
  id: string;
  filePath: string;
  relativePath: string;
  status: 'indexed' | 'processing' | 'error';
  memorySizeMB: number;
  chunkCount: number;
  timestamp: string;
  error?: string;
}
```

**MemoryStatus:**
```typescript
interface MemoryStatus {
  usedMB: number;
  budgetMB: number;
  percentUsed: number;
  status: 'healthy' | 'warning' | 'critical';
  documentsIndexed: number;
  chunksIndexed: number;
}
```

**IndexingProgress:**
```typescript
interface IndexingProgress {
  current: number;
  total: number;
  currentFile: string;
  estimatedTimeRemaining?: number;
}
```

### UI Design

**Memory Usage Bar States:**

```typescript
// Healthy (< 80%): Green
<div className="memory-bar-fill bg-green-500" style={{ width: '45%' }} />

// Warning (80-95%): Yellow
<div className="memory-bar-fill bg-yellow-500" style={{ width: '85%' }} />

// Critical (> 95%): Red
<div className="memory-bar-fill bg-red-500" style={{ width: '97%' }} />
```

**Status Badges:**
- ✓ Indexed: Green badge with checkmark
- ⏳ Processing: Yellow badge with spinner
- ❌ Error: Red badge with X icon

**Context Menu:**
```typescript
// File Explorer context menu extension
contextMenuItems: [
  ...existingItems,
  { type: 'separator' },
  {
    label: 'Add to Knowledge Base',
    icon: <DatabaseIcon />,
    onClick: () => addFileToKnowledge(filePath)
  }
]
```

## Security Considerations

- **Path Validation**: All file paths validated before indexing (existing PathValidator from ADR-011)
- **IPC Security**: All IPC channels whitelisted in preload script
- **No External Data**: All operations local, no data transmission
- **User Confirmation**: Batch operations (folder indexing) show confirmation dialog
- **Error Handling**: Graceful handling of file access errors, invalid paths
- **Memory Protection**: Memory limits prevent resource exhaustion

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Performance degradation with large document lists | Medium | Medium | Use virtual scrolling (react-window); lazy load document details |
| User confusion about memory limits | Medium | High | Clear tooltips explaining memory budget; visual warnings; "Learn More" link |
| Context menu integration breaks File Explorer | High | Low | Extensive testing; graceful fallback; feature flag for rollback |
| Progress indicator inaccurate | Low | Medium | Accurate file counting before indexing; real-time updates from backend |
| RAG toggle persistence fails | Medium | Low | Test persistence thoroughly; fallback to OFF if load fails |
| UI blocking during batch indexing | High | Medium | All operations async; Web Workers if needed; cancel button |

## Definition of Done

- [ ] Knowledge Tab component created and visible in sidebar
- [ ] Document list displays all indexed documents with status
- [ ] Status badges update in real-time during indexing
- [ ] Memory usage bar visualizes budget with thresholds
- [ ] Memory bar shows green/yellow/red based on usage
- [ ] "Add Files" button works with file picker
- [ ] "Add Folder" button works with directory picker
- [ ] Progress indicator shows during indexing
- [ ] Context menu integration in File Explorer works
- [ ] Document removal functionality works
- [ ] RAG toggle persists per project
- [ ] All unit tests written and passing (coverage ≥ 90%)
- [ ] All integration tests passing
- [ ] Accessibility audit passed (WCAG 2.1 Level AA)
- [ ] Visual regression tests passing
- [ ] Keyboard navigation works correctly
- [ ] Screen reader compatibility verified
- [ ] Code reviewed and approved
- [ ] Documentation updated (JSDoc, user guide)

## Related Documentation

- Epic Plan: Docs/implementation/_main/epic-10-rag-knowledge-base.md
- Feature 10.1: Docs/implementation/_main/feature-10.1-vector-service-embedding-infrastructure.md
- Architecture: Docs/architecture/_main/04-Architecture.md
- UX Design: Docs/architecture/_main/05-User-Experience.md
- ADR-018: RAG Knowledge Base Architecture

## Architecture Decision Records (ADRs)

- **ADR-018**: RAG Knowledge Base Architecture (toggle-based RAG, memory-based limits)
- **ADR-002**: React UI Framework (component patterns, functional components)
- **ADR-003**: Zustand State Management (store patterns, persistence)
- **ADR-001**: Electron IPC Bridge (renderer/main communication)

---

**Feature Plan Version:** 1.0
**Last Updated:** January 23, 2026
**Status:** Ready for Wave Planning
