/**
 * OperationIndicator Component
 *
 * Displays visual indicators for different file operation types in AI responses.
 * Helps users understand what type of file operation the AI performed at a glance.
 *
 * Wave 3.4.2 - User Story 3:
 * - Create operations show file icon with "+" badge
 * - Edit operations show pencil icon
 * - Delete operations show trash icon
 * - Read operations show eye icon
 * - Search operations (glob/grep) show magnifying glass icon
 * - Bash operations show terminal icon
 */

import React from 'react';
import { FilePlus, Pencil, Trash2, Eye, Search, Terminal } from 'lucide-react';

/**
 * Operation type
 */
export type OperationType = 'create' | 'edit' | 'delete' | 'read' | 'search' | 'bash';

/**
 * OperationIndicator Props
 */
interface OperationIndicatorProps {
  operation: OperationType;
  label?: string;
  className?: string;
}

/**
 * OperationIndicator Component
 * Shows icon and optional label for file operations
 */
const OperationIndicator: React.FC<OperationIndicatorProps> = ({
  operation,
  label,
  className = '',
}) => {
  // Icon configuration for each operation type
  const getOperationConfig = (): {
    icon: React.ReactNode;
    color: string;
    defaultLabel: string;
  } => {
    const iconSize = 'w-4 h-4';

    switch (operation) {
      case 'create':
        return {
          icon: <FilePlus className={iconSize} />,
          color: 'text-green-500',
          defaultLabel: 'Created',
        };
      case 'edit':
        return {
          icon: <Pencil className={iconSize} />,
          color: 'text-blue-500',
          defaultLabel: 'Edited',
        };
      case 'delete':
        return {
          icon: <Trash2 className={iconSize} />,
          color: 'text-red-500',
          defaultLabel: 'Deleted',
        };
      case 'read':
        return {
          icon: <Eye className={iconSize} />,
          color: 'text-gray-400',
          defaultLabel: 'Read',
        };
      case 'search':
        return {
          icon: <Search className={iconSize} />,
          color: 'text-purple-500',
          defaultLabel: 'Searched',
        };
      case 'bash':
        return {
          icon: <Terminal className={iconSize} />,
          color: 'text-yellow-500',
          defaultLabel: 'Executed',
        };
      default:
        // TypeScript ensures type safety at compile-time, but this provides
        // a defensive runtime fallback for potential type inconsistencies
        // (e.g., from external data sources or future operation types)
        return {
          icon: <Eye className={iconSize} />,
          color: 'text-gray-400',
          defaultLabel: 'Operation',
        };
    }
  };

  const config = getOperationConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded bg-vscode-bg-tertiary border border-vscode-border ${className}`}
      title={label || config.defaultLabel}
    >
      <span className={config.color}>{config.icon}</span>
      {label && <span className="text-xs text-vscode-text-muted">{label}</span>}
    </span>
  );
};

export default OperationIndicator;
