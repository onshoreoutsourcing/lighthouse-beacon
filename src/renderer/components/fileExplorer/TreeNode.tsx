import React from 'react';
import { ChevronRight, ChevronDown, Folder, File, Loader2 } from 'lucide-react';
import type { FileEntry } from '@shared/types';

/**
 * TreeNode Component Props
 */
interface TreeNodeProps {
  /** Current file or folder node */
  node: FileEntry;
  /** Nesting depth for indentation (0 = root level) */
  depth: number;
  /** Callback when folder is toggled */
  onToggle: (path: string) => void;
}

/**
 * TreeNode Component
 *
 * Recursive component that renders a single file or folder entry in the tree.
 * For folders, it handles expand/collapse state and renders children recursively.
 *
 * Features:
 * - Chevron icons for folders (right = collapsed, down = expanded)
 * - Click anywhere on folder row to toggle expand/collapse
 * - Recursive rendering of nested children
 * - Loading spinner while fetching folder contents
 * - Empty folder indication
 * - Indentation based on nesting depth (16px per level)
 */
const TreeNode: React.FC<TreeNodeProps> = ({ node, depth, onToggle }) => {
  const isFolder = node.type === 'directory';
  const isExpanded = node.isExpanded ?? false;
  const isLoading = node.isLoading ?? false;

  /**
   * Handles click on folder row
   */
  const handleClick = () => {
    if (isFolder) {
      onToggle(node.path);
    }
  };

  /**
   * Calculates indentation based on depth
   */
  const indentationStyle = {
    paddingLeft: `${depth * 16}px`,
  };

  /**
   * Determines which chevron icon to show
   */
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  /**
   * Determines which content icon to show
   */
  const ContentIcon = isFolder ? Folder : File;

  /**
   * Icon color based on type
   */
  const iconColor = isFolder ? 'text-vscode-warning' : 'text-vscode-text';

  return (
    <>
      {/* Tree Node Row */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 hover:bg-vscode-border/30 cursor-pointer transition-colors select-none"
        style={indentationStyle}
        onClick={handleClick}
        title={node.path}
      >
        {/* Chevron Icon (folders only) */}
        {isFolder ? (
          <ChevronIcon className="w-4 h-4 flex-shrink-0 text-vscode-text-muted" />
        ) : (
          <div className="w-4 h-4 flex-shrink-0" />
        )}

        {/* Loading Spinner or Content Icon */}
        {isLoading ? (
          <Loader2 className="w-4 h-4 flex-shrink-0 text-vscode-accent animate-spin" />
        ) : (
          <ContentIcon className={`w-4 h-4 flex-shrink-0 ${iconColor}`} />
        )}

        {/* File/Folder Name */}
        <span className="text-sm text-vscode-text truncate">{node.name}</span>
      </div>

      {/* Expanded Folder Contents */}
      {isFolder && isExpanded && (
        <div>
          {/* Loading State */}
          {isLoading && (
            <div
              className="text-xs text-vscode-text-muted italic py-1"
              style={{ paddingLeft: `${(depth + 1) * 16 + 20}px` }}
            >
              Loading...
            </div>
          )}

          {/* Empty Folder */}
          {!isLoading && node.children && node.children.length === 0 && (
            <div
              className="text-xs text-vscode-text-muted italic py-1"
              style={{ paddingLeft: `${(depth + 1) * 16 + 20}px` }}
            >
              (empty)
            </div>
          )}

          {/* Nested Children - Recursive Rendering */}
          {!isLoading &&
            node.children &&
            node.children.length > 0 &&
            node.children.map((child) => (
              <TreeNode key={child.path} node={child} depth={depth + 1} onToggle={onToggle} />
            ))}
        </div>
      )}
    </>
  );
};

export default TreeNode;
