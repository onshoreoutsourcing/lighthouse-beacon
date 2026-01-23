/**
 * DebugToolbar Component
 * Wave 9.4.6: Step-by-Step Debugging
 *
 * Toolbar for controlling workflow debugging.
 * Provides buttons for pause, resume, step-over, and continue operations.
 * Displays current debug state and breakpoint count.
 *
 * Features:
 * - Debug mode toggle (ON/OFF)
 * - Execution control buttons (pause, resume, step-over, continue)
 * - Current execution status display
 * - Breakpoint count display
 * - Disabled states when actions not available
 */

import React from 'react';
import { Pause, Play, StepForward, FastForward, Bug, BugOff } from 'lucide-react';
import type { DebugMode, DebugState } from '@shared/types';

/**
 * Props for DebugToolbar
 */
interface DebugToolbarProps {
  /** Current debug mode (ON/OFF) */
  debugMode: DebugMode;
  /** Current debug state (RUNNING/PAUSED/COMPLETED) */
  debugState: DebugState;
  /** Current node ID being debugged (if paused) */
  currentNodeId?: string;
  /** Number of active breakpoints */
  breakpointCount: number;
  /** Callback when debug mode is toggled */
  onToggleDebugMode: () => void;
  /** Callback when pause is clicked */
  onPause: () => void;
  /** Callback when resume is clicked */
  onResume: () => void;
  /** Callback when step-over is clicked */
  onStepOver: () => void;
  /** Callback when continue is clicked */
  onContinue: () => void;
  /** Whether a workflow is currently executing */
  isExecuting: boolean;
}

/**
 * DebugToolbar Component
 */
export const DebugToolbar: React.FC<DebugToolbarProps> = ({
  debugMode,
  debugState,
  currentNodeId,
  breakpointCount,
  onToggleDebugMode,
  onPause,
  onResume,
  onStepOver,
  onContinue,
  isExecuting,
}) => {
  const isPaused = debugState === 'PAUSED';
  const isRunning = debugState === 'RUNNING';
  const isDebugOn = debugMode === 'ON';

  return (
    <div className="bg-vscode-panel border border-vscode-border rounded-lg p-3 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-vscode-border">
        <div className="flex items-center gap-2">
          {isDebugOn ? (
            <Bug className="w-5 h-5 text-orange-400" aria-hidden="true" />
          ) : (
            <BugOff className="w-5 h-5 text-gray-500" aria-hidden="true" />
          )}
          <span className="text-sm font-semibold text-vscode-text">
            Debug Mode: {isDebugOn ? 'ON' : 'OFF'}
          </span>
        </div>
        <button
          onClick={onToggleDebugMode}
          className={`px-3 py-1 text-xs font-medium rounded ${
            isDebugOn
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-gray-600 text-white hover:bg-gray-700'
          } transition-colors focus:outline-none focus:ring-2 focus:ring-vscode-accent`}
          aria-label={isDebugOn ? 'Turn debug mode off' : 'Turn debug mode on'}
        >
          {isDebugOn ? 'Turn OFF' : 'Turn ON'}
        </button>
      </div>

      {/* Control Buttons - Only shown when debug mode is ON */}
      {isDebugOn && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {/* Pause Button */}
            <button
              onClick={onPause}
              disabled={!isExecuting || isPaused}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-vscode-accent"
              aria-label="Pause execution"
              title="Pause execution at next step"
            >
              <Pause className="w-4 h-4" aria-hidden="true" />
              Pause
            </button>

            {/* Resume Button */}
            <button
              onClick={onResume}
              disabled={!isPaused}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-vscode-accent"
              aria-label="Resume execution"
              title="Resume normal execution"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              Resume
            </button>

            {/* Step Over Button */}
            <button
              onClick={onStepOver}
              disabled={!isPaused}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-vscode-accent"
              aria-label="Step over to next node"
              title="Execute current step and pause at next"
            >
              <StepForward className="w-4 h-4" aria-hidden="true" />
              Step Over
            </button>

            {/* Continue Button */}
            <button
              onClick={onContinue}
              disabled={!isPaused}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-vscode-accent"
              aria-label="Continue to next breakpoint"
              title="Continue until next breakpoint or completion"
            >
              <FastForward className="w-4 h-4" aria-hidden="true" />
              Continue
            </button>
          </div>

          {/* Status Display */}
          <div className="text-xs text-vscode-text-muted space-y-1 pt-3 border-t border-vscode-border">
            <div>
              <span className="font-medium">Status: </span>
              <span
                className={
                  isPaused
                    ? 'text-yellow-400'
                    : isRunning
                      ? 'text-green-400'
                      : 'text-gray-400'
                }
              >
                {debugState}
                {currentNodeId && isPaused && ` at ${currentNodeId}`}
              </span>
            </div>
            <div>
              <span className="font-medium">Breakpoints: </span>
              <span className="text-vscode-text">{breakpointCount} active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
