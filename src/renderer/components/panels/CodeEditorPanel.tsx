import React from 'react';

/**
 * CodeEditorPanel Component
 *
 * Placeholder for the code editor panel (center panel).
 * This will be implemented with Monaco Editor in Wave 1.4.
 */
const CodeEditorPanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-vscode-border bg-vscode-panel">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-vscode-text-muted">
          Editor
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
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </div>
          <p className="text-sm text-vscode-text-muted font-medium">Code Editor</p>
          <p className="text-xs text-vscode-text-muted mt-2 opacity-75">
            Monaco Editor coming in Wave 1.4
          </p>
        </div>
      </div>
    </div>
  );
};

export default CodeEditorPanel;
