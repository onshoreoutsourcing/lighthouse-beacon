/**
 * Code Editor Panel Component
 *
 * Center panel that displays file content using Monaco Editor with tab management.
 * Integrates with file explorer to open files and editor store to manage tabs.
 *
 * Features:
 * - Tab bar for multiple open files with unsaved changes indicator
 * - Monaco Editor integration with full editing capabilities
 * - Tab switching and closing with view state persistence
 * - Save functionality with Ctrl+S / Cmd+S keyboard shortcut
 * - Error handling and user feedback for save failures
 * - Empty state when no files are open
 */

import React, { useEffect, useCallback, useState } from 'react';
import { useFileExplorerStore } from '@renderer/stores/fileExplorer.store';
import { useEditorStore } from '@renderer/stores/editor.store';
import { MonacoEditorContainer } from '@renderer/components/editor/MonacoEditorContainer';
import { TabBar } from '@renderer/components/editor/TabBar';
import { FileCode, Loader2 } from 'lucide-react';

/**
 * CodeEditorPanel Component
 *
 * Displays open files in a tabbed interface with Monaco Editor.
 * Listens to fileExplorer for file selection and opens files in new tabs.
 * Uses editor store to manage tab state (open files, active file).
 * Handles editing, saving, and view state persistence.
 *
 * @returns Code editor panel component
 */
const CodeEditorPanel: React.FC = () => {
  // Subscribe to editor store with all actions
  const {
    openFiles,
    activeFilePath,
    isLoading,
    error,
    openFile,
    closeFile,
    setActiveFile,
    updateFileContent,
    saveFile,
    updateViewState,
    clearError,
  } = useEditorStore();

  // Subscribe to file explorer for file selection
  const selectedFilePath = useFileExplorerStore((state) => state.selectedFilePath);

  // Track save errors for user feedback
  const [saveError, setSaveError] = useState<string | null>(null);

  // When file selected in explorer, open it
  useEffect(() => {
    if (selectedFilePath) {
      void openFile(selectedFilePath);
    }
  }, [selectedFilePath, openFile]);

  // Get active file from openFiles
  const activeFile = openFiles.find((f) => f.path === activeFilePath);

  /**
   * Handle content change in editor
   * Called on every keystroke - updates content and marks as dirty
   */
  const handleContentChange = useCallback(
    (content: string) => {
      if (activeFilePath) {
        updateFileContent(activeFilePath, content);
      }
    },
    [activeFilePath, updateFileContent]
  );

  /**
   * Handle save operation (Ctrl+S / Cmd+S)
   * Saves file to disk and clears dirty flag on success
   */
  const handleSave = useCallback(async () => {
    if (!activeFilePath) return;

    try {
      await saveFile(activeFilePath);
      setSaveError(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setSaveError(`Failed to save file: ${errorMsg}`);
      console.error('Save error:', error);
    }
  }, [activeFilePath, saveFile]);

  /**
   * Handle view state change (when switching tabs)
   * Saves cursor position and scroll position for later restoration
   */
  const handleViewStateChange = useCallback(
    (viewState: unknown) => {
      if (activeFilePath) {
        updateViewState(activeFilePath, viewState);
      }
    },
    [activeFilePath, updateViewState]
  );

  /**
   * Handle error retry
   * Clears error state and re-attempts to open the selected file
   */
  const handleRetry = useCallback(() => {
    clearError();
    if (selectedFilePath) {
      void openFile(selectedFilePath);
    }
  }, [clearError, selectedFilePath, openFile]);

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar - only show if files are open */}
      {openFiles.length > 0 && (
        <TabBar
          openFiles={openFiles}
          activeFilePath={activeFilePath}
          onSelectTab={setActiveFile}
          onCloseTab={closeFile}
        />
      )}

      {/* Save Error Display */}
      {saveError && (
        <div className="bg-red-900/50 text-red-200 px-4 py-2 text-sm border-b border-red-800">
          {saveError}
          <button
            onClick={() => setSaveError(null)}
            className="ml-2 underline hover:text-red-100 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* File Load Error Display */}
      {error && (
        <div className="bg-red-900/50 text-red-200 px-4 py-2 text-sm border-b border-red-800 flex items-center justify-between">
          <span>{error}</span>
          <div>
            <button
              onClick={handleRetry}
              className="ml-2 underline hover:text-red-100 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={clearError}
              className="ml-2 underline hover:text-red-100 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        // Loading State
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-400 animate-spin" />
            <p className="text-gray-400">Loading file...</p>
          </div>
        </div>
      ) : activeFile ? (
        // Active File - Monaco Editor
        <MonacoEditorContainer
          filepath={activeFile.path}
          content={activeFile.content}
          language={activeFile.language}
          initialViewState={activeFile.viewState}
          onChange={handleContentChange}
          onSave={() => {
            void handleSave();
          }}
          onViewStateChange={handleViewStateChange}
        />
      ) : (
        // Empty State - No File Open
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <FileCode className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">No file open</p>
            <p className="text-sm text-gray-500 mt-2">Select a file from the explorer to open it</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditorPanel;
