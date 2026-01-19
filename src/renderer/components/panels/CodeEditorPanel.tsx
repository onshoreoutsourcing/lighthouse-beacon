/**
 * Code Editor Panel Component
 *
 * Center panel that displays file content using Monaco Editor.
 * Integrates with file explorer to load and display selected files.
 *
 * Features:
 * - Monaco Editor integration with syntax highlighting
 * - File loading via IPC
 * - Automatic language detection
 * - Loading, error, and empty states
 */

import React, { useEffect, useState } from 'react';
import { useFileExplorerStore } from '@renderer/stores/fileExplorer.store';
import { MonacoEditorContainer } from '@renderer/components/editor/MonacoEditorContainer';
import { detectLanguage } from '@renderer/utils/languageDetection';

/**
 * CodeEditorPanel Component
 *
 * Displays selected file content in Monaco Editor with syntax highlighting.
 * Listens to fileExplorer store for file selection changes and loads content via IPC.
 *
 * @returns Code editor panel component
 */
const CodeEditorPanel: React.FC = () => {
  // Subscribe to selected file path from file explorer store
  const selectedFilePath = useFileExplorerStore((state) => state.selectedFilePath);

  // Local state for file content and loading
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load file content when selected file changes
  useEffect(() => {
    // Reset state if no file selected
    if (!selectedFilePath) {
      setFileContent('');
      setError(null);
      return;
    }

    const loadFile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load file content via IPC
        const result = await window.electronAPI.fileSystem.readFile(selectedFilePath);

        if (result.success) {
          setFileContent(result.data.content);
        } else {
          setError(result.error?.message || 'Failed to load file');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    void loadFile();
  }, [selectedFilePath]);

  // Render no file selected state
  if (!selectedFilePath) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-vscode-border bg-vscode-panel">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-vscode-text-muted">
            Editor
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-vscode-text-muted opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>
            <p className="text-sm text-vscode-text-muted font-medium">No file selected</p>
            <p className="text-xs text-vscode-text-muted mt-2 opacity-75">
              Select a file from the explorer to view its contents
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-vscode-border bg-vscode-panel">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-vscode-text-muted">
            Editor
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vscode-accent mx-auto mb-3"></div>
            <p className="text-sm text-vscode-text-muted">Loading file...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b border-vscode-border bg-vscode-panel">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-vscode-text-muted">
            Editor
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <svg
                className="w-12 h-12 mx-auto text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-red-400 font-medium mb-2">Error loading file</p>
            <p className="text-xs text-vscode-text-muted">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Detect language from filename
  const language = detectLanguage(selectedFilePath);

  // Extract filename from path for display
  const filename = selectedFilePath.split('/').pop() || selectedFilePath;

  // Render Monaco Editor with file content
  return (
    <div className="flex flex-col h-full">
      {/* Panel Header with filename */}
      <div className="px-4 py-3 border-b border-vscode-border bg-vscode-panel">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-vscode-text-muted">
          {filename}
        </h2>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <MonacoEditorContainer
          filepath={selectedFilePath}
          content={fileContent}
          language={language}
          readOnly={true}
        />
      </div>
    </div>
  );
};

export default CodeEditorPanel;
