# ADR-002: React + TypeScript for UI

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Roy Love (Product Owner), Claude Sonnet 4.5 (System Architect)
**Related**: Epic-1 (Desktop Foundation), ADR-001 (Electron as Desktop Framework)

---

## Context

Lighthouse Chat IDE's renderer process (UI layer) requires a UI framework and type system to build a professional, maintainable IDE interface. The UI must support:

- **Complex component hierarchy**: File explorer tree, Monaco editor tabs, AI chat interface, panels, modals
- **High-frequency updates**: Real-time AI streaming, file system changes, editor updates
- **Type safety**: Prevent runtime errors, self-documenting code, better IDE support
- **Component reusability**: Share components between desktop and future web version
- **Developer productivity**: Fast development iteration, clear patterns, good debugging
- **Long-term maintainability**: Easy to onboard new developers, refactor safely

**Strategic context**:
- Team has strong JavaScript/TypeScript experience, limited experience with other frameworks
- Electron renderer process (ADR-001) uses Chromium, supports any web UI framework
- Phase 1-6 timeline requires rapid UI development (weeks, not months)
- Future web version (post-Phase 6) would benefit from component reusability

**Requirements addressed**:
- FR-2: File Explorer UI with tree view
- FR-3: Code Editor integration (Monaco Editor)
- FR-5: AI Chat Interface (Phase 2)
- FR-8: Three-Panel Layout with resizing
- NFR-2: Performance (60 FPS UI, responsive interactions)
- NFR-5: Maintainability (clear code, type safety, testability)

---

## Considered Options

### Option 1: React + TypeScript (Hooks, Functional Components)
**Description**: Use React 18+ with TypeScript strict mode, functional components only, hooks for state/effects

**Pros**:
- ✅ **Industry standard**: Most popular UI framework (45%+ market share)
- ✅ **Mature ecosystem**: Vast library of components, tools, resources
- ✅ **Team expertise**: Team has strong React experience
- ✅ **TypeScript integration**: Excellent type inference, type checking
- ✅ **Functional patterns**: Hooks enable clean, testable code
- ✅ **Large talent pool**: Easy to hire React developers
- ✅ **Electron integration**: electron-vite, electron-builder support React
- ✅ **Component reusability**: Can reuse components in future web version

**Cons**:
- ❌ **Bundle size**: ~45KB min+gzip (React + ReactDOM)
- ❌ **Learning curve**: Hooks, memoization, re-render optimization requires understanding
- ❌ **Boilerplate**: More verbose than some alternatives (Vue, Svelte)

### Option 2: Vue.js + TypeScript
**Description**: Use Vue 3 with Composition API and TypeScript

**Pros**:
- ✅ **Easier learning curve**: Simpler mental model than React
- ✅ **Good TypeScript support**: Vue 3 rebuilt with TypeScript
- ✅ **Smaller bundle**: ~35KB min+gzip
- ✅ **Good performance**: Virtual DOM + compiler optimizations

**Cons**:
- ❌ **Less Electron ecosystem**: Fewer Electron+Vue examples
- ❌ **Smaller community**: ~20% market share vs. React's 45%
- ❌ **Team unfamiliarity**: No Vue experience on team
- ❌ **Reusability concerns**: Harder to share with web if using different framework

### Option 3: Svelte + TypeScript
**Description**: Use Svelte 4 with TypeScript preprocessor

**Pros**:
- ✅ **Smallest bundle**: ~15-20KB (compiles to vanilla JS)
- ✅ **Best performance**: No virtual DOM, direct DOM updates
- ✅ **Less boilerplate**: More concise code than React/Vue
- ✅ **Good developer experience**: Reactive variables, simple syntax

**Cons**:
- ❌ **Newer framework**: Smaller ecosystem, fewer resources
- ❌ **TypeScript integration**: Less mature than React/Vue
- ❌ **Team unfamiliarity**: No Svelte experience on team
- ❌ **Electron integration**: Fewer examples, less community support
- ❌ **Job market**: Harder to hire Svelte developers

### Option 4: Angular + TypeScript
**Description**: Use Angular 17 with TypeScript

**Pros**:
- ✅ **TypeScript-first**: Built with TypeScript from ground up
- ✅ **Batteries-included**: Routing, forms, HTTP client all included
- ✅ **Enterprise adoption**: Popular in large organizations

**Cons**:
- ❌ **Heavy framework**: ~130KB min+gzip
- ❌ **Steep learning curve**: Complex concepts (modules, dependency injection, RxJS)
- ❌ **Opinionated**: Less flexibility than React/Vue
- ❌ **Team unfamiliarity**: No Angular experience on team
- ❌ **Electron integration**: Less common, fewer examples

### Option 5: Vanilla TypeScript (No Framework)
**Description**: Use TypeScript with direct DOM manipulation, no framework

**Pros**:
- ✅ **Smallest bundle**: ~0KB framework overhead
- ✅ **Maximum control**: No framework abstractions
- ✅ **Best performance**: Direct DOM, no virtual DOM overhead

**Cons**:
- ❌ **High development time**: Build everything from scratch
- ❌ **No component model**: Harder to organize complex UI
- ❌ **Manual state management**: No reactivity, manual DOM updates
- ❌ **Unmaintainable**: Complex IDE UI would be very difficult to maintain
- ❌ **No reusability**: Can't share components with web version

---

## Decision

**We have decided to use React 18+ with TypeScript strict mode, functional components only, and hooks for state and effects.**

### Why This Choice

React + TypeScript is the optimal choice for Lighthouse Chat IDE's UI layer, balancing:
1. **Team velocity** (immediate productivity vs. learning new framework)
2. **Ecosystem maturity** (extensive Electron+React resources vs. limited alternatives)
3. **Type safety** (TypeScript strict mode prevents entire classes of bugs)
4. **Component reusability** (React components work in web version)
5. **Long-term maintainability** (large talent pool, extensive documentation)

**Key factors**:

1. **Team expertise**: Team has strong React experience. Can be productive from day 1 vs. weeks/months learning Vue/Svelte/Angular.

2. **Electron ecosystem**: React is the most common UI framework for Electron apps. electron-vite, electron-builder, and most Electron examples use React. VS Code's web components use React patterns.

3. **TypeScript integration**: React's TypeScript support is excellent. Type inference works smoothly, JSX type checking is robust, hooks have excellent type definitions.

4. **Component reusability**: React components can be reused in future web version (Phase 7+). Same components work in Electron renderer and browser.

5. **Modern patterns**: Functional components + hooks provide clean, testable patterns:
   - Custom hooks for reusable logic
   - `useMemo` / `useCallback` for performance
   - `useEffect` for side effects
   - No class components or lifecycle methods

6. **Large talent pool**: If team scales, React developers are abundant. Easier to hire, onboard, and train than Svelte/Angular developers.

**Trade-offs accepted**:
- **Larger bundle** (~45KB vs. ~15KB Svelte) - Acceptable for desktop app, amortized across UI complexity
- **Learning curve** (hooks, memoization) - Mitigated by team's existing React experience
- **Verbosity** (more code than Svelte) - Acceptable for explicitness, type safety, maintainability

**Example React + TypeScript pattern**:

```typescript
// File Explorer Component (functional + hooks)
import { FC, useCallback } from 'react';
import { useFileExplorerStore } from '@/stores/file-explorer.store';

interface FileExplorerProps {
  rootPath: string;
}

export const FileExplorer: FC<FileExplorerProps> = ({ rootPath }) => {
  const { directoryTree, expandedFolders, toggleFolder, selectFile } = useFileExplorerStore();

  const handleFolderClick = useCallback((path: string) => {
    toggleFolder(path);
  }, [toggleFolder]);

  const handleFileClick = useCallback((path: string) => {
    selectFile(path);
  }, [selectFile]);

  return (
    <div className="file-explorer">
      <TreeView
        tree={directoryTree}
        expanded={expandedFolders}
        onFolderClick={handleFolderClick}
        onFileClick={handleFileClick}
      />
    </div>
  );
};
```

**TypeScript strict mode configuration**:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "jsx": "react-jsx",
    "esModuleInterop": true
  }
}
```

---

## Consequences

### Positive

- ✅ **Immediate productivity**: Team productive from day 1 with React (no framework learning)
- ✅ **Type safety**: TypeScript strict mode catches bugs at compile time (prevents runtime errors)
- ✅ **Rich ecosystem**: Access to React component libraries (react-window, react-virtualized, etc.)
- ✅ **Excellent debugging**: React DevTools, TypeScript error messages, stack traces
- ✅ **Component reusability**: React components work in future web version
- ✅ **Large talent pool**: Easy to hire React developers if team scales
- ✅ **VS Code patterns**: Can reference VS Code web components (React-based)
- ✅ **Functional patterns**: Hooks enable clean, testable, reusable logic

### Negative

- ❌ **Bundle size**: ~45KB React + ReactDOM (vs. ~15KB Svelte)
  - **Impact**: Slightly larger initial load
  - **Acceptable for**: Desktop app with ~200MB total bundle, 45KB is 0.02%

- ❌ **Performance overhead**: Virtual DOM reconciliation (vs. Svelte's compiled approach)
  - **Impact**: Slightly higher CPU usage for complex UIs
  - **Mitigation**: Use `React.memo`, `useMemo`, `useCallback` for performance-critical components; profiling with React DevTools

- ❌ **Learning curve**: Hooks, memoization, re-render optimization requires understanding
  - **Impact**: New team members need to learn React optimization patterns
  - **Mitigation**: Code reviews, pair programming, clear patterns in architecture doc

- ❌ **Verbosity**: More code than Svelte (explicit vs. reactive)
  - **Impact**: Slightly longer development time for simple components
  - **Acceptable for**: Explicitness aids maintainability, debugging, type checking

### Mitigation Strategies

**For bundle size**:
- Use code splitting for Phase 2+ features (AI chat, diff view, settings)
- Tree-shake unused React features
- Monitor bundle size with webpack-bundle-analyzer
- Target: Keep total bundle < 250MB (React is <0.02% of that)

**For performance**:
- Use `React.memo` for expensive components (file tree nodes, editor tabs)
- Use `useMemo` for expensive computations (filtering, sorting)
- Use `useCallback` for event handlers passed to children
- Profile with React DevTools to identify re-render bottlenecks
- Use virtual scrolling for long lists (react-window)

**For learning curve**:
- Document React patterns in architecture guide
- Code review for optimization anti-patterns
- Pair programming for complex components
- Reference material: Official React docs, VS Code source code

---

## References

- **Architecture Doc**: `/Docs/architecture/_main/04-Architecture.md` (Renderer process architecture)
- **Product Plan**: `/Docs/architecture/_main/02-Product-Plan.md` (Technology stack)
- **React Documentation**: https://react.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **React + TypeScript Cheatsheet**: https://react-typescript-cheatsheet.netlify.app/
- **VS Code Source**: https://github.com/microsoft/vscode (React patterns)
- **electron-vite**: https://electron-vite.org/ (React + Electron integration)
- **Related ADRs**:
  - ADR-001: Electron as Desktop Framework (provides renderer environment)
  - ADR-003: Zustand for State Management (state layer above React)
  - ADR-005: Vite as Build Tool (Vite + React + TypeScript + Electron)

---

**Last Updated**: 2026-01-19
