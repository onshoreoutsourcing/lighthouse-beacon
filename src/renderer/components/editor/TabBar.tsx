/**
 * TabBar Component
 *
 * Displays a horizontal bar of tabs for all open files.
 * Manages tab selection and closing via callbacks.
 *
 * Features:
 * - Displays all open files as tabs
 * - Horizontal scrolling for many tabs
 * - Active tab highlighting
 * - Tab selection and closing
 * - VS Code-inspired styling
 */

import React from 'react';
import { Tab } from './Tab';

/**
 * File metadata for tab display
 */
interface OpenFile {
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  viewState?: unknown;
}

/**
 * TabBar component props
 */
interface TabBarProps {
  /** Array of open files to display as tabs */
  openFiles: OpenFile[];
  /** Path of currently active file */
  activeFilePath: string | null;
  /** Callback when a tab is selected */
  onSelectTab: (path: string) => void;
  /** Callback when a tab is closed */
  onCloseTab: (path: string) => void;
}

/**
 * TabBar Component
 *
 * Renders a horizontal bar of tabs for all open files.
 * Tabs are scrollable horizontally when many files are open.
 * Active tab is highlighted with blue background.
 *
 * @param props - Component props
 * @returns TabBar component
 */
export const TabBar: React.FC<TabBarProps> = ({
  openFiles,
  activeFilePath,
  onSelectTab,
  onCloseTab,
}) => {
  return (
    <div
      className="flex overflow-x-auto bg-vscode-panel border-b border-vscode-border"
      role="tablist"
    >
      {openFiles.map((file) => (
        <Tab
          key={file.path}
          file={file}
          isActive={file.path === activeFilePath}
          onSelect={() => onSelectTab(file.path)}
          onClose={() => onCloseTab(file.path)}
        />
      ))}
    </div>
  );
};
