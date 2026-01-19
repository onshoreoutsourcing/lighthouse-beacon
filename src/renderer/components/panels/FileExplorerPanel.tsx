import React from 'react';

/**
 * FileExplorerPanel Component
 *
 * Placeholder for the file explorer panel (left panel).
 * This will be implemented with actual file tree functionality in Wave 1.4.
 */
const FileExplorerPanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-vscode-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-vscode-text-muted">
          Explorer
        </h2>
      </div>

      {/* Panel Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-vscode-text-muted opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
          </div>
          <p className="text-sm text-vscode-text-muted font-medium">File Explorer</p>
          <p className="text-xs text-vscode-text-muted mt-2 opacity-75">Coming in Wave 1.4</p>
        </div>
      </div>
    </div>
  );
};

export default FileExplorerPanel;
