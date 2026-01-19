/**
 * Tab Component
 *
 * Displays a single file tab with name and close button.
 * Used within TabBar to show open files.
 *
 * Features:
 * - File name display with ellipsis for long names
 * - Active/inactive state styling
 * - Close button (X icon)
 * - Click to activate tab
 * - VS Code-inspired styling
 */

import React from 'react';
import { X } from 'lucide-react';

/**
 * File metadata for tab display
 */
interface OpenFile {
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty?: boolean;
}

/**
 * Tab component props
 */
interface TabProps {
  /** File metadata to display */
  file: OpenFile;
  /** Whether this tab is currently active */
  isActive: boolean;
  /** Callback when tab is clicked */
  onSelect: () => void;
  /** Callback when close button is clicked */
  onClose: (e: React.MouseEvent) => void;
}

/**
 * Tab Component
 *
 * Renders a single file tab with name and close button.
 * Active tabs are highlighted with blue background.
 * Inactive tabs show darker background with hover effect.
 *
 * @param props - Component props
 * @returns Tab component
 */
export const Tab: React.FC<TabProps> = ({ file, isActive, onSelect, onClose }) => {
  /**
   * Handle close button click
   * Stops event propagation to prevent tab selection
   */
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(e);
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-r border-vscode-border ${
        isActive ? 'bg-blue-600/30 text-white' : 'bg-vscode-panel hover:bg-vscode-bg'
      }`}
      onClick={onSelect}
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <span className="truncate text-sm" title={file.path}>
        {file.name}
      </span>
      <X
        className="w-4 h-4 flex-shrink-0 hover:text-red-400 transition-colors"
        onClick={handleClose}
        aria-label={`Close ${file.name}`}
      />
    </div>
  );
};
