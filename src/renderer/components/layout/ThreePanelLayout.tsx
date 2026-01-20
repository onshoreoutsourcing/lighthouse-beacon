import React, { useCallback, useRef } from 'react';
import { useLayoutStore } from '@renderer/stores/layout.store';
import ResizeDivider from './ResizeDivider';

interface ThreePanelLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

/**
 * ThreePanelLayout Component
 *
 * Professional IDE layout with three resizable panels:
 * - Left panel (default 20%): File Explorer
 * - Center panel (default 45%): Code Editor
 * - Right panel (default 35%): AI Chat
 *
 * Features:
 * - Draggable dividers for resizing panels
 * - Panel widths persist across sessions via Zustand + localStorage
 * - Width constraints enforced (15-50% for left/right, 30-70% for center)
 * - Smooth 60 FPS resizing with requestAnimationFrame
 */
const ThreePanelLayout: React.FC<ThreePanelLayoutProps> = ({
  leftPanel,
  centerPanel,
  rightPanel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Get panel widths and setters from Zustand store
  const {
    leftPanelWidth,
    centerPanelWidth,
    rightPanelWidth,
    setLeftPanelWidth,
    setCenterPanelWidth,
  } = useLayoutStore();

  /**
   * Handle left divider drag (between left and center panels)
   * Adjusts left panel width, center panel compensates
   */
  const handleLeftDividerDrag = useCallback(
    (deltaX: number, containerWidth: number) => {
      // Convert pixel delta to percentage delta
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newLeftWidth = leftPanelWidth + deltaPercent;

      setLeftPanelWidth(newLeftWidth);
    },
    [leftPanelWidth, setLeftPanelWidth]
  );

  /**
   * Handle right divider drag (between center and right panels)
   * Adjusts center panel width, right panel compensates
   */
  const handleRightDividerDrag = useCallback(
    (deltaX: number, containerWidth: number) => {
      // Convert pixel delta to percentage delta
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newCenterWidth = centerPanelWidth + deltaPercent;

      setCenterPanelWidth(newCenterWidth);
    },
    [centerPanelWidth, setCenterPanelWidth]
  );

  return (
    <div ref={containerRef} className="flex w-full h-full overflow-hidden">
      {/* Left Panel - File Explorer */}
      <div
        className="h-full bg-vscode-panel overflow-y-auto flex-shrink-0"
        style={{ width: `${leftPanelWidth}%` }}
      >
        {leftPanel}
      </div>

      {/* Left Divider - Between Left and Center */}
      <ResizeDivider position="left" onDrag={handleLeftDividerDrag} />

      {/* Center Panel - Code Editor */}
      <div
        className="h-full bg-vscode-bg overflow-y-auto flex-shrink-0"
        style={{ width: `${centerPanelWidth}%` }}
      >
        {centerPanel}
      </div>

      {/* Right Divider - Between Center and Right */}
      <ResizeDivider position="right" onDrag={handleRightDividerDrag} />

      {/* Right Panel - AI Chat */}
      <div
        className="h-full bg-vscode-panel overflow-y-auto flex-shrink-0"
        style={{ width: `${rightPanelWidth}%` }}
      >
        {rightPanel}
      </div>
    </div>
  );
};

export default ThreePanelLayout;
