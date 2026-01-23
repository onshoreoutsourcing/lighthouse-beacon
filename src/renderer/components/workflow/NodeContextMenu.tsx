/**
 * NodeContextMenu Component
 * Wave 9.5.3: Workflow Testing UI - User Story 3
 *
 * Context menu for workflow nodes with testing and editing options.
 */

import React, { useEffect, useRef } from 'react';
import { TestTube, Edit, Trash2, Copy } from 'lucide-react';

/**
 * Context menu option
 */
interface MenuOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Props for NodeContextMenu
 */
interface NodeContextMenuProps {
  /** X position on screen */
  x: number;
  /** Y position on screen */
  y: number;
  /** Menu options to display */
  options: MenuOption[];
  /** Callback when menu should close */
  onClose: () => void;
}

/**
 * NodeContextMenu Component
 *
 * Context menu that appears on right-click of workflow nodes.
 */
export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({ x, y, options, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Ensure menu stays within viewport bounds
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 1000,
  };

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-vscode-panel border border-vscode-border rounded-lg shadow-2xl py-1 min-w-[180px]"
      role="menu"
      aria-label="Node context menu"
    >
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => {
            option.onClick();
            onClose();
          }}
          disabled={option.disabled}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-vscode-text hover:bg-vscode-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          role="menuitem"
        >
          <span className="w-4 h-4">{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * Create default node context menu options
 */
export function createNodeContextMenuOptions(
  nodeId: string,
  onTestNode: () => void,
  onEditNode?: () => void,
  onDuplicateNode?: () => void,
  onDeleteNode?: () => void
): MenuOption[] {
  return [
    {
      id: 'test',
      label: 'Test Node',
      icon: <TestTube className="w-4 h-4" />,
      onClick: onTestNode,
    },
    {
      id: 'edit',
      label: 'Edit Node',
      icon: <Edit className="w-4 h-4" />,
      onClick: onEditNode || (() => undefined),
      disabled: !onEditNode,
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: <Copy className="w-4 h-4" />,
      onClick: onDuplicateNode || (() => undefined),
      disabled: !onDuplicateNode,
    },
    {
      id: 'delete',
      label: 'Delete Node',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: onDeleteNode || (() => undefined),
      disabled: !onDeleteNode,
    },
  ];
}
