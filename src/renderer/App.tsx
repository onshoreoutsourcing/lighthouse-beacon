import React from 'react';
import ThreePanelLayout from './components/layout/ThreePanelLayout';
import FileExplorerPanel from './components/panels/FileExplorerPanel';
import CodeEditorPanel from './components/panels/CodeEditorPanel';
import AIChatPanel from './components/panels/AIChatPanel';

const App: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col bg-vscode-bg">
      {/* Application Header */}
      <header className="bg-vscode-panel px-6 py-2 border-b border-vscode-border flex-shrink-0">
        <h1 className="text-sm font-semibold text-white">Lighthouse Beacon IDE</h1>
      </header>

      {/* Three Panel Layout */}
      <main className="flex-1 overflow-hidden">
        <ThreePanelLayout
          leftPanel={<FileExplorerPanel />}
          centerPanel={<CodeEditorPanel />}
          rightPanel={<AIChatPanel />}
        />
      </main>
    </div>
  );
};

export default App;
