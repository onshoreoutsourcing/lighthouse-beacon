import React from 'react';

/**
 * AIChatPanel Component
 *
 * Placeholder for the AI chat panel (right panel).
 * This will be implemented with chat interface in Wave 1.5.
 */
const AIChatPanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-vscode-border">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-vscode-text-muted">
          AI Chat
        </h2>
      </div>

      {/* Panel Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-vscode-accent opacity-70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <p className="text-sm text-vscode-accent font-medium">AI Chat Interface</p>
          <p className="text-xs text-vscode-text-muted mt-2 opacity-75">Coming in Wave 1.5</p>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
