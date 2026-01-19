# ADR-003: Zustand for State Management

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Roy Love (Product Owner), Claude Sonnet 4.5 (System Architect)
**Related**: Epic-1 (Desktop Foundation), ADR-002 (React + TypeScript for UI)

---

## Context

Lighthouse Chat IDE requires a state management solution to coordinate state across React components. The application has:

- **Multiple stateful domains**: File explorer state, editor state, chat state (Phase 2+), settings
- **Cross-component state sharing**: File selection affects editor, editor affects tabs, etc.
- **Async operations**: File I/O, AI requests, IPC calls
- **Performance requirements**: 60 FPS UI, no blocking updates
- **Type safety requirements**: TypeScript strict mode throughout

**Strategic context**:
- React Context + useState causes performance issues with frequent updates
- State needs to persist across component unmount/remount
- Team needs simple, productive state management (not Redux complexity)
- Future web version should use same state patterns

**Requirements addressed**:
- FR-2: File Explorer state (selected file, expanded folders, directory tree)
- FR-3: Editor state (open files, active tab, unsaved changes)
- FR-5: Chat state (Phase 2 - conversation history, streaming responses)
- NFR-2: Performance (efficient state updates without unnecessary re-renders)

---

## Considered Options

### Option 1: Zustand
**Description**: Lightweight state management library using hooks, minimal boilerplate

**Pros**:
- ✅ **Minimal boilerplate**: Define store in ~20 lines vs. ~100 for Redux
- ✅ **Hook-based API**: Natural integration with React hooks
- ✅ **No context providers**: No provider tree, cleaner component hierarchy
- ✅ **TypeScript-first**: Excellent type inference, minimal manual types
- ✅ **Small bundle**: ~1KB min+gzip
- ✅ **Good performance**: Only re-renders components that use changed state
- ✅ **Simple async**: Async actions are just async functions, no middleware
- ✅ **DevTools**: Supports Redux DevTools for debugging

**Cons**:
- ❌ **Smaller community**: Less popular than Redux
- ❌ **Fewer resources**: Fewer tutorials, examples than Redux
- ❌ **Less opinionated**: No enforced patterns (flexibility = responsibility)

**Example**:
```typescript
import { create } from 'zustand';

interface FileExplorerState {
  selectedFile: string | null;
  expandedFolders: Set<string>;
  selectFile: (path: string) => void;
  toggleFolder: (path: string) => void;
}

export const useFileExplorerStore = create<FileExplorerState>((set, get) => ({
  selectedFile: null,
  expandedFolders: new Set(),

  selectFile: (path) => set({ selectedFile: path }),

  toggleFolder: (path) => set((state) => {
    const newExpanded = new Set(state.expandedFolders);
    newExpanded.has(path) ? newExpanded.delete(path) : newExpanded.add(path);
    return { expandedFolders: newExpanded };
  }),
}));
```

### Option 2: Redux Toolkit
**Description**: Redux with opinionated patterns, less boilerplate than classic Redux

**Pros**:
- ✅ **Most popular**: Industry standard, vast ecosystem
- ✅ **Excellent DevTools**: Time-travel debugging, state inspection
- ✅ **Opinionated patterns**: Clear structure, best practices enforced
- ✅ **Middleware ecosystem**: redux-thunk, redux-saga, etc.

**Cons**:
- ❌ **More boilerplate**: Slices, actions, reducers even with Toolkit
- ❌ **Steeper learning curve**: Concepts: reducers, actions, dispatch, selectors
- ❌ **Provider tree required**: Wrap app in `<Provider>`
- ❌ **Larger bundle**: ~15KB min+gzip (15x larger than Zustand)
- ❌ **Overkill for our scale**: Redux designed for massive apps, we're medium-sized

### Option 3: MobX
**Description**: Reactive state management with observables

**Pros**:
- ✅ **Simple API**: Less boilerplate than Redux
- ✅ **Reactive**: Automatic re-renders when observed state changes
- ✅ **Good performance**: Fine-grained reactivity

**Cons**:
- ❌ **"Magic" behavior**: Proxies and observables can be hard to debug
- ❌ **Less explicit**: Not always clear what triggers updates
- ❌ **TypeScript integration**: Decorators complicate TypeScript usage
- ❌ **Learning curve**: Observables, actions, reactions concepts

### Option 4: React Context + useReducer
**Description**: Built-in React state management

**Pros**:
- ✅ **No dependencies**: Built into React
- ✅ **Simple for small apps**: Good for 1-2 contexts

**Cons**:
- ❌ **Performance issues**: Re-renders all consumers on any context change
- ❌ **Context provider hell**: Multiple contexts = nested providers
- ❌ **No DevTools**: Hard to debug state changes
- ❌ **Verbose**: More code than Zustand for same functionality

### Option 5: Jotai
**Description**: Atomic state management library

**Pros**:
- ✅ **Atomic approach**: Fine-grained state updates
- ✅ **Small bundle**: ~2KB
- ✅ **Good TypeScript support**

**Cons**:
- ❌ **Different mental model**: Atoms vs. stores requires learning
- ❌ **Newer library**: Less proven than Zustand/Redux
- ❌ **Less familiar**: Team has no Jotai experience

---

## Decision

**We have decided to use Zustand for state management in Lighthouse Chat IDE.**

### Why This Choice

Zustand is the optimal choice for Lighthouse Chat IDE's state layer, balancing:
1. **Simplicity** (20 lines of store vs. 100 lines Redux)
2. **Performance** (efficient re-renders without optimization work)
3. **TypeScript integration** (excellent inference, minimal manual types)
4. **Developer experience** (hooks API natural with React)
5. **Bundle size** (1KB vs. 15KB Redux)

**Key factors**:

1. **Minimal boilerplate**: Zustand stores are ~80% less code than Redux for same functionality. Fast development, less maintenance.

2. **Natural React integration**: Zustand uses hooks (`useFileExplorerStore()`), no Provider tree, no connect/mapStateToProps.

3. **Excellent TypeScript**: Zustand infers types from store definition. Minimal manual type annotations.

4. **Right-sized for our app**: Our app has ~5 state domains (file explorer, editor, chat, settings, window). Zustand handles this easily without Redux's heavyweight patterns.

5. **Good performance out of the box**: Zustand only re-renders components that use changed state. No need for `reselect` or manual memoization.

6. **Simple async**: Async actions are just async functions inside store. No thunks, no sagas.

**Example store (FileExplorer)**:

```typescript
// src/renderer/stores/file-explorer.store.ts
import { create } from 'zustand';
import { ipcService } from '@/services/ipc.service';

interface DirectoryNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
}

interface FileExplorerState {
  rootPath: string | null;
  expandedFolders: Set<string>;
  selectedFile: string | null;
  directoryTree: DirectoryNode | null;
  isLoading: boolean;

  // Actions
  setRootPath: (path: string) => Promise<void>;
  toggleFolder: (path: string) => void;
  selectFile: (path: string) => void;
  refreshTree: () => Promise<void>;
}

export const useFileExplorerStore = create<FileExplorerState>((set, get) => ({
  rootPath: null,
  expandedFolders: new Set<string>(),
  selectedFile: null,
  directoryTree: null,
  isLoading: false,

  setRootPath: async (path: string) => {
    set({ isLoading: true, rootPath: path });
    try {
      const entries = await ipcService.readDirectory(path);
      const tree = buildDirectoryTree(entries, path);
      set({ directoryTree: tree, isLoading: false });
    } catch (error) {
      console.error('Error loading directory:', error);
      set({ isLoading: false });
    }
  },

  toggleFolder: (path: string) => {
    const { expandedFolders } = get();
    const newExpanded = new Set(expandedFolders);

    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }

    set({ expandedFolders: newExpanded });
  },

  selectFile: (path: string) => {
    set({ selectedFile: path });
  },

  refreshTree: async () => {
    const { rootPath, setRootPath } = get();
    if (rootPath) {
      await setRootPath(rootPath);
    }
  },
}));
```

**Usage in component**:

```typescript
// src/renderer/components/FileExplorer.tsx
import { useFileExplorerStore } from '@/stores/file-explorer.store';

export const FileExplorer: FC = () => {
  const { directoryTree, selectedFile, toggleFolder, selectFile } = useFileExplorerStore();

  return (
    <div className="file-explorer">
      <TreeView
        tree={directoryTree}
        selected={selectedFile}
        onFolderClick={toggleFolder}
        onFileClick={selectFile}
      />
    </div>
  );
};
```

---

## Consequences

### Positive

- ✅ **Fast development**: ~80% less boilerplate than Redux = faster feature development
- ✅ **Clean component tree**: No Provider wrappers, simpler component hierarchy
- ✅ **Excellent TypeScript**: Automatic type inference, minimal manual types
- ✅ **Good performance**: Only re-renders components using changed state
- ✅ **Simple async**: Async actions are just async functions, no middleware
- ✅ **Small bundle**: 1KB (vs. 15KB Redux) = faster initial load
- ✅ **Easy to test**: Stores are plain functions, easy to unit test
- ✅ **DevTools support**: Works with Redux DevTools for debugging

### Negative

- ❌ **Less opinionated**: No enforced patterns (e.g., action naming, reducer patterns)
  - **Impact**: Team must establish conventions (naming, structure, organization)
  - **Mitigation**: Document patterns in architecture guide, enforce in code reviews

- ❌ **Smaller community**: Fewer tutorials, Stack Overflow answers than Redux
  - **Impact**: Harder to find answers to uncommon questions
  - **Mitigation**: Zustand docs are excellent, simpler API means fewer questions

- ❌ **Less middleware**: No built-in redux-saga equivalent for complex async flows
  - **Impact**: Complex async orchestration requires custom solutions
  - **Mitigation**: Phase 1 has no complex async; Phase 2+ can add middleware if needed

### Mitigation Strategies

**For lack of enforced patterns**:
- Document Zustand conventions in architecture guide:
  - Store naming: `use{Domain}Store` (e.g., `useFileExplorerStore`)
  - Action naming: Imperative verbs (e.g., `selectFile`, `toggleFolder`)
  - State naming: Nouns (e.g., `selectedFile`, `expandedFolders`)
  - File structure: One store per domain
- Enforce conventions in code reviews
- Provide example stores for common patterns

**For smaller community**:
- Reference Zustand docs (excellent quality)
- Build internal knowledge base as we encounter issues
- Consider Redux for Phase 2+ if Zustand proves insufficient (unlikely)

**For DevTools debugging**:
- Enable Redux DevTools middleware:
```typescript
import { devtools } from 'zustand/middleware';

export const useFileExplorerStore = create<FileExplorerState>()(
  devtools(
    (set, get) => ({
      // store implementation
    }),
    { name: 'FileExplorer' }
  )
);
```

---

## References

- **Architecture Doc**: `/Docs/architecture/_main/04-Architecture.md` (State Management section)
- **Zustand Documentation**: https://zustand-demo.pmnd.rs/
- **Zustand GitHub**: https://github.com/pmndrs/zustand
- **Zustand vs Redux**: https://tkdodo.eu/blog/zustand-and-react-context
- **Related ADRs**:
  - ADR-002: React + TypeScript for UI (Zustand integrates with React hooks)

---

**Last Updated**: 2026-01-19
