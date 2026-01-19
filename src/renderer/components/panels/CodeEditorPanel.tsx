/**
 * Code Editor Panel Component
 *
 * Center panel that displays file content using Monaco Editor with tab management.
 * Integrates with file explorer to open files and editor store to manage tabs.
 *
 * Features:
 * - Tab bar for multiple open files
 * - Monaco Editor integration with syntax highlighting
 * - Tab switching and closing
 * - Empty state when no files are open
 */

import React, { useEffect } from 'react';
import { useFileExplorerStore } from '@renderer/stores/fileExplorer.store';
import { useEditorStore } from '@renderer/stores/editor.store';
import { MonacoEditorContainer } from '@renderer/components/editor/MonacoEditorContainer';
import { TabBar } from '@renderer/components/editor/TabBar';
import { FileCode } from 'lucide-react';

/**
 * CodeEditorPanel Component
 *
 * Displays open files in a tabbed interface with Monaco Editor.
 * Listens to fileExplorer for file selection and opens files in new tabs.
 * Uses editor store to manage tab state (open files, active file).
 *
 * @returns Code editor panel component
 */
const CodeEditorPanel: React.FC = () => {
  // Subscribe to editor store
  const { openFiles, activeFilePath, openFile, closeFile, setActiveFile } = useEditorStore();

  // Subscribe to file explorer for file selection
  const selectedFilePath = useFileExplorerStore((state) => state.selectedFilePath);

  // When file selected in explorer, open it
  useEffect(() => {
    if (selectedFilePath) {
      void openFile(selectedFilePath);
    }
  }, [selectedFilePath, openFile]);

  // Get active file from openFiles
  const activeFile = openFiles.find((f) => f.path === activeFilePath);

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

      {/* Editor or Empty State */}
      {activeFile ? (
        <MonacoEditorContainer
          filepath={activeFile.path}
          content={activeFile.content}
          language={activeFile.language}
          readOnly={true}
        />
      ) : (
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
