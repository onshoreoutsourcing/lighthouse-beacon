import React, { useCallback } from 'react';
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import type { FileEntry } from '@shared/types';
import { getFileIcon } from '../../utils/fileIcons';

/**
 * TreeNode Component Props
 */
interface TreeNodeProps {
  /** Current file or folder node */
  node: FileEntry;
  /** Nesting depth for indentation (0 = root level) */
  depth: number;
  /** Currently selected file path */
  selectedPath: string | null;
  /** Callback when folder is toggled */
  onToggle: (path: string) => void;
  /** Callback when file is selected */
  onSelectFile: (path: string) => void;
}

/**
 * TreeNode Component
 *
 * Recursive component that renders a single file or folder entry in the tree.
 * For folders, it handles expand/collapse state and renders children recursively.
 *
 * Features:
 * - Chevron icons for folders (right = collapsed, down = expanded)
 * - Click folder to toggle expand/collapse
 * - Click file to select it with visual feedback
 * - File type-specific icons with colors
 * - Recursive rendering of nested children
 * - Loading spinner while fetching folder contents
 * - Empty folder indication
 * - Indentation based on nesting depth (16px per level)
 */
const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  depth,
  selectedPath,
  onToggle,
  onSelectFile,
}) => {
  const isFolder = node.type === 'directory';
  const isExpanded = node.isExpanded ?? false;
  const isLoading = node.isLoading ?? false;
  const isSelected = !isFolder && node.path === selectedPath;

  /**
   * Handles click on row
   * - For folders: toggle expand/collapse
   * - For files: select the file
   */
  const handleClick = useCallback(() => {
    if (isFolder) {
      onToggle(node.path);
    } else {
      onSelectFile(node.path);
    }
  }, [isFolder, node.path, onToggle, onSelectFile]);

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
   * Background color based on selection state
   */
  const bgClass = isSelected ? 'bg-blue-600/30' : 'hover:bg-vscode-border/30';

  return (
    <>
      {/* Tree Node Row */}
      <div
        className={`flex items-center gap-1 px-2 py-1.5 ${bgClass} cursor-pointer transition-colors select-none`}
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

        {/* Loading Spinner or File Type Icon */}
        {isLoading ? (
          <Loader2 className="w-4 h-4 flex-shrink-0 text-vscode-accent animate-spin" />
        ) : (
          getFileIcon(node.name, isFolder, isExpanded)
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
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onToggle={onToggle}
                onSelectFile={onSelectFile}
              />
            ))}
        </div>
      )}
    </>
  );
};

/**
 * Custom comparison function for React.memo
 * Only re-render if these specific props change
 */
const arePropsEqual = (prevProps: TreeNodeProps, nextProps: TreeNodeProps): boolean => {
  return (
    prevProps.node.path === nextProps.node.path &&
    prevProps.node.isExpanded === nextProps.node.isExpanded &&
    prevProps.node.isLoading === nextProps.node.isLoading &&
    prevProps.selectedPath === nextProps.selectedPath &&
    prevProps.depth === nextProps.depth &&
    prevProps.onToggle === nextProps.onToggle &&
    prevProps.onSelectFile === nextProps.onSelectFile
  );
};

/**
 * Memoized TreeNode to prevent unnecessary re-renders
 * This is critical for performance with large file trees
 */
export default React.memo(TreeNode, arePropsEqual);
