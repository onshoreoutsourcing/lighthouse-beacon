/**
 * ActivityBar Component
 *
 * VS Code-style activity bar with tabs for switching between views:
 * - Explorer (File tree)
 * - Workflow (Visual workflow canvas)
 */

import React from 'react';
import { Files, Network } from 'lucide-react';

export type ActivityView = 'explorer' | 'workflow';

interface ActivityBarProps {
  activeView: ActivityView;
  onViewChange: (view: ActivityView) => void;
}

interface ActivityTabProps {
  icon: React.ReactNode;
  label: string;
  view: ActivityView;
  isActive: boolean;
  onClick: () => void;
}

const ActivityTab: React.FC<ActivityTabProps> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full h-12 flex items-center justify-center
        transition-colors duration-150
        ${
          isActive
            ? 'bg-vscode-bg text-vscode-text border-l-2 border-vscode-accent'
            : 'bg-vscode-panel text-vscode-text-muted hover:bg-vscode-hover'
        }
      `}
      title={label}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      {icon}
    </button>
  );
};

export const ActivityBar: React.FC<ActivityBarProps> = ({ activeView, onViewChange }) => {
  return (
    <div
      className="w-12 bg-vscode-panel border-r border-vscode-border flex flex-col"
      role="navigation"
      aria-label="Activity bar"
      style={{
        backgroundColor: '#2d2d2d',
        borderRight: '1px solid #454545',
        minWidth: '48px',
        width: '48px',
      }}
    >
      <ActivityTab
        icon={<Files className="w-6 h-6" />}
        label="Explorer"
        view="explorer"
        isActive={activeView === 'explorer'}
        onClick={() => onViewChange('explorer')}
      />
      <ActivityTab
        icon={<Network className="w-6 h-6" />}
        label="Workflows"
        view="workflow"
        isActive={activeView === 'workflow'}
        onClick={() => onViewChange('workflow')}
      />
    </div>
  );
};
