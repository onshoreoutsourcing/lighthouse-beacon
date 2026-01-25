/**
 * BreakpointIndicator Component
 * Wave 9.4.6: Step-by-Step Debugging
 *
 * Visual indicator for breakpoints on workflow nodes.
 * Displays a red dot when a breakpoint is set on a node.
 * Clicking toggles the breakpoint on/off.
 *
 * Features:
 * - Red dot visual indicator
 * - Click to toggle breakpoint
 * - Enabled/disabled states with visual feedback
 * - Accessible with ARIA labels
 */

import React from 'react';
import { Circle } from 'lucide-react';

/**
 * Props for BreakpointIndicator
 */
interface BreakpointIndicatorProps {
  /** Node ID for the breakpoint */
  nodeId: string;
  /** Whether breakpoint is set */
  hasBreakpoint: boolean;
  /** Whether breakpoint is enabled (vs disabled) */
  enabled?: boolean;
  /** Callback when breakpoint is toggled */
  onToggle: (nodeId: string) => void;
  /** Whether debug mode is active */
  debugMode: boolean;
}

/**
 * BreakpointIndicator Component
 */
export const BreakpointIndicator: React.FC<BreakpointIndicatorProps> = ({
  nodeId,
  hasBreakpoint,
  enabled = true,
  onToggle,
  debugMode,
}) => {
  // Only show indicator in debug mode
  if (!debugMode) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent node selection
    onToggle(nodeId);
  };

  return (
    <button
      onClick={handleClick}
      className="absolute -top-2 -left-2 z-10 cursor-pointer hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-vscode-accent rounded-full"
      aria-label={
        hasBreakpoint
          ? enabled
            ? `Remove breakpoint from ${nodeId}`
            : `Enable breakpoint on ${nodeId}`
          : `Add breakpoint to ${nodeId}`
      }
      title={hasBreakpoint ? 'Click to remove breakpoint' : 'Click to add breakpoint'}
    >
      {hasBreakpoint ? (
        <Circle
          className={`w-5 h-5 ${
            enabled ? 'fill-red-500 text-red-500' : 'fill-red-800 text-red-800'
          }`}
          strokeWidth={2}
          aria-hidden="true"
        />
      ) : (
        <Circle
          className="w-5 h-5 fill-transparent text-gray-600 opacity-50 hover:opacity-100"
          strokeWidth={2}
          aria-hidden="true"
        />
      )}
    </button>
  );
};
