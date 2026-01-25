import React, { useState } from 'react';
import { ActivityBar, type ActivityView } from './components/layout/ActivityBar';
import ThreePanelLayout from './components/layout/ThreePanelLayout';
import FileExplorerPanel from './components/panels/FileExplorerPanel';
import CodeEditorPanel from './components/panels/CodeEditorPanel';
import AIChatPanel from './components/panels/AIChatPanel';
import { WorkflowCanvas } from './components/workflow/WorkflowCanvas';
import { KnowledgeTab } from './components/knowledge/KnowledgeTab';
import { PermissionModal } from './components/modals/PermissionModal';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActivityView>('explorer');

  return (
    <div className="w-full h-full flex flex-col bg-vscode-bg">
      {/* Application Header */}
      <header className="bg-vscode-panel px-6 py-2 border-b border-vscode-border flex-shrink-0">
        <h1 className="text-sm font-semibold text-white">Lighthouse Beacon IDE</h1>
      </header>

      {/* Main Content with Activity Bar */}
      <main className="flex-1 overflow-hidden flex" style={{ position: 'relative' }}>
        {/* VS Code-style Activity Bar - Always visible */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <ActivityBar activeView={activeView} onViewChange={setActiveView} />
        </div>

        {/* View Content */}
        <div className="flex-1 overflow-hidden" style={{ position: 'relative' }}>
          {activeView === 'explorer' ? (
            <ThreePanelLayout
              leftPanel={<FileExplorerPanel />}
              centerPanel={<CodeEditorPanel />}
              rightPanel={<AIChatPanel />}
            />
          ) : activeView === 'workflow' ? (
            <div className="w-full h-full" style={{ backgroundColor: '#1e1e1e' }}>
              <WorkflowCanvas />
            </div>
          ) : (
            <div className="w-full h-full" style={{ backgroundColor: '#1e1e1e' }}>
              <KnowledgeTab />
            </div>
          )}
        </div>
      </main>

      {/* Permission Modal (Feature 2.3) */}
      <PermissionModal />
    </div>
  );
};

export default App;
