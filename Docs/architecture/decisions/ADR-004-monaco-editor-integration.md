# ADR-004: Monaco Editor Integration

**Status**: Accepted
**Date**: 2026-01-19
**Deciders**: Roy Love (Product Owner), Claude Sonnet 4.5 (System Architect)
**Related**: Epic-1 (Desktop Foundation), ADR-001 (Electron), ADR-002 (React + TypeScript)

---

## Context

Lighthouse Chat IDE requires a professional code editor component with syntax highlighting, IntelliSense, and advanced editing features. The editor must:

- **Professional quality**: Match or exceed VS Code editing experience
- **Language support**: Syntax highlighting for 20+ languages (JS, TS, Python, Java, Go, etc.)
- **Large file support**: Handle files up to 10MB efficiently
- **Tab management**: Support multiple open files with tab switching
- **IntelliSense**: Autocomplete, parameter hints, quick info
- **Keyboard shortcuts**: Standard shortcuts (Ctrl+S, Ctrl+F, Ctrl+Z, etc.)
- **Diff view**: Side-by-side comparison (Phase 5)
- **React integration**: Work seamlessly in React component

**Strategic context**:
- Core FR-3 requirement: Code editor with Monaco
- Manual editing must work perfectly before AI features (Phase 1)
- Future AI modifications need diff view (Phase 5)
- Electron renderer provides Chromium environment (ideal for web-based editors)

**Requirements addressed**:
- FR-3: Code Editor with Monaco for manual code editing
- FR-4: Tab management (multiple open files)
- NFR-2: Performance (open files <200ms, 60 FPS scrolling)

---

## Considered Options

### Option 1: Monaco Editor
**Description**: VS Code's editor component, extracted for standalone use

**Pros**:
- ✅ **VS Code engine**: Exact same editor that powers VS Code
- ✅ **Feature-complete**: Syntax highlighting, IntelliSense, diff view, all built-in
- ✅ **50+ languages**: JavaScript, TypeScript, Python, Java, Go, Rust, etc.
- ✅ **Large file support**: Handles 10MB+ files efficiently
- ✅ **Excellent TypeScript support**: First-class TypeScript language service
- ✅ **Diff editor**: Side-by-side comparison built-in (needed for Phase 5)
- ✅ **Active maintenance**: Microsoft maintains, releases regularly
- ✅ **React integration**: @monaco-editor/react package (official)
- ✅ **Free and open source**: MIT license

**Cons**:
- ❌ **Large bundle**: ~3MB min (vs. ~300KB for CodeMirror)
- ❌ **Some features we don't need**: Debugger integration, extensions API

**Example**:
```typescript
import Editor from '@monaco-editor/react';

<Editor
  height="90vh"
  defaultLanguage="typescript"
  defaultValue="// code here"
  theme="vs-dark"
  options={{
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on',
  }}
/>
```

### Option 2: CodeMirror 6
**Description**: Lightweight, extensible code editor

**Pros**:
- ✅ **Smaller bundle**: ~300KB (10x smaller than Monaco)
- ✅ **Good performance**: Fast rendering, efficient
- ✅ **Extensible**: Plugin-based architecture
- ✅ **Modern architecture**: Rebuilt from scratch in 2021

**Cons**:
- ❌ **Less feature-complete**: IntelliSense requires custom integration
- ❌ **More setup required**: Need to configure language support manually
- ❌ **No built-in diff view**: Would need to build ourselves
- ❌ **TypeScript support**: Not as robust as Monaco
- ❌ **More development time**: Would need ~1-2 weeks to match Monaco features

### Option 3: ACE Editor
**Description**: Older, widely-used code editor

**Pros**:
- ✅ **Mature**: Proven in production for years
- ✅ **Good language support**: 100+ languages

**Cons**:
- ❌ **Older codebase**: Less actively maintained than Monaco/CodeMirror
- ❌ **Less modern**: Architecture older than Monaco/CodeMirror 6
- ❌ **No built-in IntelliSense**: Would need custom integration
- ❌ **No built-in diff view**: Would need to build ourselves
- ❌ **Worse TypeScript support**: Not as good as Monaco

### Option 4: Custom Editor
**Description**: Build editor from scratch using contenteditable or textarea

**Pros**:
- ✅ **Complete control**: No framework limitations
- ✅ **Smallest bundle**: No external dependencies

**Cons**:
- ❌ **Massive development effort**: 6-12 months to match Monaco
- ❌ **Would never match Monaco quality**: Monaco is result of 10+ years of development
- ❌ **Maintenance burden**: Ongoing bug fixes, features, language support
- ❌ **Not feasible**: Phase 1 timeline is 3-4 weeks

---

## Decision

**We have decided to use Monaco Editor (via @monaco-editor/react) as the code editor component.**

### Why This Choice

Monaco Editor is the optimal choice for Lighthouse Chat IDE's code editor, balancing:
1. **Professional quality** (VS Code-level editing experience)
2. **Feature completeness** (syntax highlighting, IntelliSense, diff view all built-in)
3. **Development speed** (integrate in days vs. weeks for alternatives)
4. **TypeScript support** (first-class TypeScript language service)
5. **Future-proof** (diff view for Phase 5, extensions for Phase 6+)

**Key factors**:

1. **VS Code validation**: Monaco Editor IS VS Code's editor. If Monaco is good enough for VS Code (tens of millions of users), it's good enough for us.

2. **Feature completeness**: Monaco includes everything we need:
   - Syntax highlighting: 50+ languages built-in
   - IntelliSense: Autocomplete, parameter hints, quick info
   - Diff editor: Side-by-side comparison (critical for Phase 5)
   - Find/replace: With regex support
   - Multi-cursor: Edit multiple places simultaneously
   - Code folding: Collapse/expand functions, blocks
   - Minimap: Scrollable overview
   - Line numbers: Gutter with line numbers
   - Themes: vs-dark, vs-light, high-contrast

3. **TypeScript integration**: Monaco has the best TypeScript support of any web editor. TypeScript language service built-in, no custom integration needed.

4. **React integration**: @monaco-editor/react is official, well-maintained package. Simple API, works perfectly in Electron.

5. **Development speed**: Can integrate Monaco in 1-2 days vs. 1-2 weeks for CodeMirror (need to build IntelliSense, diff view).

6. **Bundle size acceptable**: 3MB Monaco in ~200MB total app bundle = 1.5%. Acceptable for professional editing experience.

**Example Monaco integration**:

```typescript
// src/renderer/components/MonacoEditor.tsx
import { FC, useRef } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface MonacoEditorProps {
  file: {
    path: string;
    content: string;
    language: string;
  };
  onChange: (content: string) => void;
}

export const MonacoEditor: FC<MonacoEditorProps> = ({ file, onChange }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure editor
    editor.updateOptions({
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
    });

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save file
      const content = editor.getValue();
      onChange(content);
    });
  };

  return (
    <Editor
      height="100%"
      language={file.language}
      value={file.content}
      theme="vs-dark"
      onMount={handleEditorDidMount}
      onChange={(value) => onChange(value || '')}
    />
  );
};
```

**Diff view (Phase 5)**:

```typescript
import { DiffEditor } from '@monaco-editor/react';

<DiffEditor
  height="600px"
  language="typescript"
  original={originalCode}
  modified={modifiedCode}
  theme="vs-dark"
/>
```

---

## Consequences

### Positive

- ✅ **VS Code quality**: Same professional editing experience as VS Code
- ✅ **Feature-complete**: IntelliSense, syntax highlighting, diff view, all built-in
- ✅ **Fast integration**: 1-2 days to integrate vs. 1-2 weeks for alternatives
- ✅ **Excellent TypeScript**: First-class TypeScript language service
- ✅ **Large file support**: Handles 10MB+ files efficiently with virtualization
- ✅ **Diff view ready**: Built-in side-by-side comparison for Phase 5
- ✅ **Active maintenance**: Microsoft releases updates regularly
- ✅ **React integration**: @monaco-editor/react works perfectly

### Negative

- ❌ **Large bundle**: ~3MB (vs. ~300KB CodeMirror)
  - **Impact**: Slightly larger initial download
  - **Acceptable for**: 3MB in ~200MB total bundle = 1.5%, professional editor worth it

- ❌ **Some unused features**: Extensions API, debugger integration we don't use
  - **Impact**: Slightly larger than needed
  - **Acceptable for**: Tree-shaking removes some unused code, features may be useful in Phase 6+

- ❌ **Chromium-specific**: Monaco requires modern browser, won't work in older environments
  - **Impact**: Can't run in IE11 or very old browsers
  - **Acceptable for**: Electron uses Chromium (perfect environment), desktop-only in Phase 1

### Mitigation Strategies

**For bundle size**:
- Use webpack/vite tree-shaking to remove unused Monaco features
- Load Monaco asynchronously (code splitting) to improve initial load
- Monitor bundle size with webpack-bundle-analyzer
- Target: Keep Monaco contribution < 5% of total bundle

**For performance with large files**:
- Set file size soft limit: 1MB (show warning)
- Set file size hard limit: 10MB (reject)
- Monaco's built-in virtualization handles large files efficiently
- Test with 5MB+ files in Phase 1 to validate performance

**For unused features**:
- Accept that some Monaco features go unused (extensions API, debugger)
- Tree-shaking removes some unused code automatically
- Consider features "free options" for Phase 6+ enhancements

---

## References

- **Architecture Doc**: `/Docs/architecture/_main/04-Architecture.md` (Monaco Editor section)
- **Business Requirements**: `/Docs/architecture/_main/03-Business-Requirements.md` (FR-3)
- **Monaco Editor Documentation**: https://microsoft.github.io/monaco-editor/
- **@monaco-editor/react**: https://github.com/suren-atoyan/monaco-react
- **Monaco Playground**: https://microsoft.github.io/monaco-editor/playground.html
- **VS Code Source**: https://github.com/microsoft/vscode (Monaco usage examples)
- **Related ADRs**:
  - ADR-001: Electron as Desktop Framework (provides Chromium environment)
  - ADR-002: React + TypeScript for UI (Monaco integrates via React component)

---

**Last Updated**: 2026-01-19
