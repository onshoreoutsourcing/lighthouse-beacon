/**
 * Monaco Editor Container Component
 *
 * A wrapper around Monaco Editor (VS Code's editor engine) configured with
 * professional settings, syntax highlighting, and dark theme.
 *
 * Features:
 * - Syntax highlighting for 20+ languages
 * - VS Code Dark+ theme
 * - Line numbers and minimap
 * - Auto-resize to fill container
 * - Full editing capabilities with save support
 * - View state persistence (cursor position, scroll position)
 */

import React, { useRef, useEffect } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';

/**
 * Props for MonacoEditorContainer component
 */
interface MonacoEditorContainerProps {
  /** Path of file being edited (for display/context) */
  filepath: string;
  /** File content to display in editor */
  content: string;
  /** Monaco language identifier (e.g., 'typescript', 'python', 'json') */
  language: string;
  /** Monaco editor view state (cursor position, scroll position) */
  initialViewState?: unknown;
  /** Callback when content changes */
  onChange: (content: string) => void;
  /** Callback when save is triggered (Ctrl+S / Cmd+S) */
  onSave: () => void;
  /** Callback when view state changes (for persistence) */
  onViewStateChange?: (viewState: unknown) => void;
}

/**
 * Monaco Editor Container
 *
 * Renders Monaco Editor with professional configuration matching VS Code Dark+ theme.
 * Supports full editing capabilities, save shortcuts, and view state persistence.
 *
 * @param props - Component props
 * @returns Monaco Editor component
 */
export const MonacoEditorContainer: React.FC<MonacoEditorContainerProps> = ({
  filepath: _filepath,
  content,
  language,
  initialViewState,
  onChange,
  onSave,
  onViewStateChange,
}) => {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  /**
   * Handle editor mount
   * Registers keyboard shortcuts and restores view state
   */
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register Ctrl+S / Cmd+S keyboard shortcut for save
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave();
    });

    // Restore view state if available (cursor position, scroll position)
    if (initialViewState) {
      editor.restoreViewState(initialViewState as ReturnType<typeof editor.saveViewState>);
    }

    // Focus editor after mount
    editor.focus();
  };

  /**
   * Handle content change
   * Called on every keystroke or edit operation
   */
  const handleChange = (value: string | undefined) => {
    onChange(value || '');
  };

  /**
   * Save view state before unmount
   * Preserves cursor position and scroll position when switching tabs
   */
  useEffect(() => {
    return () => {
      if (editorRef.current && onViewStateChange) {
        const viewState = editorRef.current.saveViewState();
        onViewStateChange(viewState);
      }
    };
  }, [onViewStateChange]);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        value={content}
        theme="vs-dark"
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="text-vscode-text-muted">Loading editor...</div>
          </div>
        }
        options={{
          fontSize: 14,
          lineNumbers: 'on',
          minimap: { enabled: true },
          automaticLayout: true,
          readOnly: false,
          scrollBeyondLastLine: false,
          renderWhitespace: 'selection',
          tabSize: 2,
          wordWrap: 'off',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          mouseWheelZoom: true,
          folding: true,
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            indentation: true,
            bracketPairs: true,
          },
        }}
        onChange={handleChange}
        onMount={handleEditorMount}
      />
    </div>
  );
};
