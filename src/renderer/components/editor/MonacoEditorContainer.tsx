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
 * - Read-only mode support
 */

import React from 'react';
import Editor from '@monaco-editor/react';

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
  /** Callback when content changes (for future editing features) */
  onChange?: (value: string) => void;
  /** Whether editor is read-only (default: true) */
  readOnly?: boolean;
}

/**
 * Monaco Editor Container
 *
 * Renders Monaco Editor with professional configuration matching VS Code Dark+ theme.
 * Supports syntax highlighting, line numbers, minimap, and automatic layout.
 *
 * @param props - Component props
 * @returns Monaco Editor component
 */
export const MonacoEditorContainer: React.FC<MonacoEditorContainerProps> = ({
  filepath: _filepath,
  content,
  language,
  onChange,
  readOnly = true,
}) => {
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
          readOnly,
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
        onChange={(value) => onChange?.(value || '')}
      />
    </div>
  );
};
