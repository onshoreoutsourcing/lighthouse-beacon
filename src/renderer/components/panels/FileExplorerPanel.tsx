import React, { useEffect, useCallback } from 'react';
import { Folder, Loader2, AlertCircle } from 'lucide-react';
import { useFileExplorerStore } from '../../stores/fileExplorer.store';
import { useEditorStore } from '../../stores/editor.store';
import TreeNode from '../fileExplorer/TreeNode';

/**
 * FileExplorerPanel Component
 *
 * Displays the project directory structure in the left panel.
 * Features:
 * - Directory picker on first load
 * - File tree display with folder/file icons
 * - Bidirectional sync with editor (editor active file syncs to explorer selection)
 * - Loading states
 * - Error handling
 * - Scrollable list view
 */
const FileExplorerPanel: React.FC = () => {
  const {
    rootPath,
    files,
    isLoading,
    error,
    selectedFilePath,
    setRootPath,
    clearError,
    toggleFolder,
    selectFile,
  } = useFileExplorerStore();

  // Subscribe to editor's active file for bidirectional sync
  const activeFilePath = useEditorStore((state) => state.activeFilePath);

  /**
   * Handles directory selection via native dialog
   */
  const handleSelectDirectory = useCallback(async () => {
    try {
      const result = await window.electronAPI.fileSystem.selectDirectory();

      if (result.success && result.data.path) {
        await setRootPath(result.data.path);
      }
      // User canceled - do nothing
    } catch (err) {
      console.error('Failed to select directory:', err);
    }
  }, [setRootPath]);

  /**
   * Prompt for directory selection on mount if no root path is set
   */
  useEffect(() => {
    if (!rootPath) {
      void handleSelectDirectory();
    }
  }, [rootPath, handleSelectDirectory]);

  /**
   * Bidirectional sync: When editor's active file changes, update explorer selection
   * This ensures that when users switch tabs or close tabs in the editor,
   * the file explorer selection stays in sync.
   */
  useEffect(() => {
    // When editor's active file changes and differs from explorer selection, sync it
    if (activeFilePath !== null && activeFilePath !== selectedFilePath) {
      selectFile(activeFilePath);
    }
    // When no file is active in editor (all tabs closed), clear explorer selection
    if (activeFilePath === null && selectedFilePath !== null) {
      selectFile(null);
    }
  }, [activeFilePath, selectedFilePath, selectFile]);

  /**
   * Handles folder toggle via TreeNode
   */
  const handleToggleFolder = useCallback(
    (path: string) => {
      void toggleFolder(path);
    },
    [toggleFolder]
  );

  /**
   * Handles file selection via TreeNode
   */
  const handleSelectFile = useCallback(
    (path: string) => {
      selectFile(path);
    },
    [selectFile]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-vscode-border flex-shrink-0">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-vscode-text-muted">
          Explorer
        </h2>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 text-vscode-accent animate-spin mb-3" />
            <p className="text-sm text-vscode-text-muted">Loading directory...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-4">
            <div className="flex items-start gap-3 p-3 bg-vscode-error/10 border border-vscode-error/30 rounded">
              <AlertCircle className="w-5 h-5 text-vscode-error flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-vscode-error mb-1">Error</p>
                <p className="text-xs text-vscode-text-muted break-words">{error}</p>
                <button
                  onClick={clearError}
                  className="mt-2 text-xs text-vscode-accent hover:underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && files.length === 0 && rootPath && (
          <div className="flex flex-col items-center justify-center p-8">
            <Folder className="w-12 h-12 text-vscode-text-muted opacity-50 mb-3" />
            <p className="text-sm text-vscode-text-muted font-medium">No files</p>
            <p className="text-xs text-vscode-text-muted mt-1 opacity-75">
              This directory is empty
            </p>
          </div>
        )}

        {/* File Tree List */}
        {!isLoading && !error && files.length > 0 && (
          <div className="py-1">
            {files.map((entry) => (
              <TreeNode
                key={entry.path}
                node={entry}
                depth={0}
                selectedPath={selectedFilePath}
                onToggle={handleToggleFolder}
                onSelectFile={handleSelectFile}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with current path */}
      {rootPath && !error && (
        <div className="px-3 py-2 border-t border-vscode-border flex-shrink-0">
          <button
            onClick={() => void handleSelectDirectory()}
            className="text-xs text-vscode-text-muted hover:text-vscode-accent transition-colors truncate w-full text-left"
            title={rootPath}
          >
            {rootPath}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileExplorerPanel;
