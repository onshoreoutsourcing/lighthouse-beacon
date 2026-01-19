import React, { useEffect, useCallback } from 'react';
import { Folder, Loader2, AlertCircle } from 'lucide-react';
import { useFileExplorerStore } from '../../stores/fileExplorer.store';
import { useEditorStore } from '../../stores/editor.store';
import { IPC_CHANNELS } from '@shared/types';
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
   * DISABLED: Let user manually click the button instead of auto-prompting
   */
  // useEffect(() => {
  //   if (!rootPath) {
  //     void handleSelectDirectory();
  //   }
  // }, [rootPath, handleSelectDirectory]);

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

  /**
   * Menu event listeners - respond to File menu actions
   * Register once on mount, cleanup on unmount
   */
  useEffect(() => {
    // Open Folder menu action
    const handleOpenFolder = () => {
      void handleSelectDirectory();
    };

    // Close Folder menu action
    const handleCloseFolder = () => {
      useFileExplorerStore.getState().reset();
    };

    // Save current file
    const handleSave = async () => {
      const { activeFilePath, saveFile } = useEditorStore.getState();
      if (!activeFilePath) {
        console.warn('No active file to save');
        return;
      }

      try {
        await saveFile(activeFilePath);
      } catch (error) {
        console.error('Failed to save file:', error);
      }
    };

    // Save all dirty files
    const handleSaveAll = async () => {
      const { openFiles, saveFile } = useEditorStore.getState();
      const dirtyFiles = openFiles.filter((f) => f.isDirty);

      if (dirtyFiles.length === 0) {
        // No unsaved files
        return;
      }

      let savedCount = 0;
      let failedCount = 0;

      for (const file of dirtyFiles) {
        try {
          await saveFile(file.path);
          savedCount++;
        } catch (error) {
          console.error(`Failed to save ${file.path}:`, error);
          failedCount++;
        }
      }

      if (failedCount > 0) {
        console.error(`Saved ${savedCount} file(s), ${failedCount} failed`);
      }
      // Successfully saved all files (if failedCount === 0)
    };

    // Open file picker and load file in editor
    const handleOpenFile = async () => {
      try {
        const result = await window.electronAPI.fileSystem.selectFile();
        if (!result.success || result.data.canceled || !result.data.path) {
          return; // User cancelled
        }

        const { openFile } = useEditorStore.getState();
        await openFile(result.data.path);
      } catch (error) {
        console.error('Failed to open file:', error);
      }
    };

    // Create new file
    const handleNewFile = async () => {
      const fileName = window.prompt('Enter file name:');
      if (!fileName) {
        return; // User cancelled
      }

      if (!rootPath) {
        console.error('No project root set');
        return;
      }

      try {
        const filePath = `${rootPath}/${fileName}`;
        // Create empty file by writing empty content
        await window.electronAPI.fileSystem.writeFile({
          path: filePath,
          content: '',
        });

        // Refresh file explorer
        const { loadFolderContents } = useFileExplorerStore.getState();
        await loadFolderContents(rootPath);

        // Open new file in editor
        const { openFile } = useEditorStore.getState();
        await openFile(filePath);
      } catch (error) {
        console.error('Failed to create file:', error);
      }
    };

    // Create new folder
    const handleNewFolder = async () => {
      const folderName = window.prompt('Enter folder name:');
      if (!folderName) {
        return; // User cancelled
      }

      if (!rootPath) {
        console.error('No project root set');
        return;
      }

      try {
        await window.electronAPI.fileSystem.createDirectory({
          path: rootPath,
          name: folderName,
        });

        // Refresh file explorer
        const { loadFolderContents } = useFileExplorerStore.getState();
        await loadFolderContents(rootPath);
      } catch (error) {
        console.error('Failed to create folder:', error);
      }
    };

    // Save as - prompt for new location
    const handleSaveAs = async () => {
      const { activeFilePath, openFiles, openFile } = useEditorStore.getState();
      if (!activeFilePath) {
        console.warn('No active file to save');
        return;
      }

      const activeFile = openFiles.find((f) => f.path === activeFilePath);
      if (!activeFile) {
        console.error('Active file not found');
        return;
      }

      try {
        const result = await window.electronAPI.fileSystem.showSaveDialog(activeFilePath);
        if (!result.success || result.data.canceled || !result.data.path) {
          return; // User cancelled
        }

        const newPath = result.data.path;

        // Write content to new location
        await window.electronAPI.fileSystem.writeFile({
          path: newPath,
          content: activeFile.content,
        });

        // Open the new file in editor
        await openFile(newPath);

        // Refresh file explorer if saved within project
        if (rootPath && newPath.startsWith(rootPath)) {
          const { loadFolderContents } = useFileExplorerStore.getState();
          await loadFolderContents(rootPath);
        }
      } catch (error) {
        console.error('Failed to save file as:', error);
      }
    };

    // Register menu event listeners (wrap async handlers with void)
    window.electronAPI.onMenuEvent(IPC_CHANNELS.MENU_OPEN_FOLDER, () => void handleOpenFolder());
    window.electronAPI.onMenuEvent(IPC_CHANNELS.MENU_CLOSE_FOLDER, handleCloseFolder);
    window.electronAPI.onMenuEvent(IPC_CHANNELS.MENU_OPEN_FILE, () => void handleOpenFile());
    window.electronAPI.onMenuEvent(IPC_CHANNELS.MENU_NEW_FILE, () => void handleNewFile());
    window.electronAPI.onMenuEvent(IPC_CHANNELS.MENU_NEW_FOLDER, () => void handleNewFolder());
    window.electronAPI.onMenuEvent(IPC_CHANNELS.MENU_SAVE, () => void handleSave());
    window.electronAPI.onMenuEvent(IPC_CHANNELS.MENU_SAVE_AS, () => void handleSaveAs());
    window.electronAPI.onMenuEvent(IPC_CHANNELS.MENU_SAVE_ALL, () => void handleSaveAll());

    // Cleanup listeners on unmount
    // Note: Using arrow functions in registration means we can't remove them properly
    // This is acceptable since this component only mounts once
    return () => {
      // Listeners will be cleaned up when component unmounts
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

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

        {/* No Folder Selected State */}
        {!isLoading && !error && !rootPath && (
          <div className="flex flex-col items-center justify-center p-8">
            <Folder className="w-16 h-16 text-vscode-text-muted opacity-50 mb-4" />
            <p className="text-sm text-vscode-text font-medium mb-2">No folder open</p>
            <p className="text-xs text-vscode-text-muted mb-4 text-center opacity-75">
              Open a folder to start exploring your project
            </p>
            <button
              onClick={() => void handleSelectDirectory()}
              className="px-4 py-2 bg-vscode-accent text-white text-sm font-medium rounded hover:opacity-90 transition-opacity"
            >
              Open Folder
            </button>
          </div>
        )}

        {/* Empty Directory State */}
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
