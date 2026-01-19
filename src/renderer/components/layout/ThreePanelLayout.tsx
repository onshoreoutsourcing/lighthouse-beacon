import React from 'react';

interface ThreePanelLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

/**
 * ThreePanelLayout Component
 *
 * Professional IDE layout with three panels:
 * - Left panel (20%): File Explorer
 * - Center panel (45%): Code Editor
 * - Right panel (35%): AI Chat
 *
 * Uses flexbox for responsive layout that fills the window.
 */
const ThreePanelLayout: React.FC<ThreePanelLayoutProps> = ({
  leftPanel,
  centerPanel,
  rightPanel,
}) => {
  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Left Panel - File Explorer */}
      <div className="w-[20%] h-full bg-vscode-panel border-r border-vscode-border overflow-y-auto flex-shrink-0">
        {leftPanel}
      </div>

      {/* Center Panel - Code Editor */}
      <div className="w-[45%] h-full bg-vscode-bg overflow-y-auto flex-shrink-0">{centerPanel}</div>

      {/* Right Panel - AI Chat */}
      <div className="w-[35%] h-full bg-vscode-panel border-l border-vscode-border overflow-y-auto flex-shrink-0">
        {rightPanel}
      </div>
    </div>
  );
};

export default ThreePanelLayout;
