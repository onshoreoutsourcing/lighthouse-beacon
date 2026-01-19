/**
 * ResizeDivider Component
 *
 * Draggable divider for resizing adjacent panels.
 * Provides visual feedback on hover and during drag.
 * Uses mouse capture to ensure smooth dragging even when cursor leaves the divider.
 *
 * Features:
 * - Hover state with visual feedback
 * - Drag state with highlighted divider
 * - Mouse capture for smooth dragging
 * - Performance optimized with requestAnimationFrame
 */

import React, { useCallback, useRef, useState } from 'react';

interface ResizeDividerProps {
  /**
   * Callback fired during drag with delta X in pixels
   * @param deltaX - Change in X position since drag start
   * @param containerWidth - Total container width for percentage calculation
   */
  onDrag: (deltaX: number, containerWidth: number) => void;

  /**
   * Position identifier for styling/debugging
   */
  position: 'left' | 'right';
}

/**
 * ResizeDivider - Draggable panel divider component
 */
const ResizeDivider: React.FC<ResizeDividerProps> = ({ onDrag, position }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * Handle mouse down - start drag operation
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartXRef.current = e.clientX;

      // Get container width for percentage calculations
      const container = e.currentTarget.parentElement;
      const containerWidth = container?.offsetWidth || 1;

      /**
       * Handle mouse move during drag
       */
      const handleMouseMove = (moveEvent: MouseEvent) => {
        // Cancel previous animation frame if it exists
        if (animationFrameRef.current !== null) {
          window.cancelAnimationFrame(animationFrameRef.current);
        }

        // Use requestAnimationFrame for 60 FPS performance
        animationFrameRef.current = window.requestAnimationFrame(() => {
          const deltaX = moveEvent.clientX - dragStartXRef.current;
          onDrag(deltaX, containerWidth);
          dragStartXRef.current = moveEvent.clientX;
        });
      };

      /**
       * Handle mouse up - end drag operation
       */
      const handleMouseUp = () => {
        setIsDragging(false);

        // Cancel any pending animation frame
        if (animationFrameRef.current !== null) {
          window.cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }

        // Remove event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      // Add event listeners to document for mouse capture
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [onDrag]
  );

  /**
   * Handle mouse enter - show hover state
   */
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  /**
   * Handle mouse leave - hide hover state
   */
  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setIsHovered(false);
    }
  }, [isDragging]);

  // Dynamic classes based on state
  const baseClasses =
    'w-1 h-full cursor-col-resize flex-shrink-0 transition-colors duration-150 relative';
  const colorClasses = isDragging
    ? 'bg-blue-500' // Active drag - bright blue
    : isHovered
      ? 'bg-gray-500' // Hover - gray
      : 'bg-vscode-border'; // Default - subtle border

  // Hover area - wider invisible area for easier grabbing
  const hoverAreaClasses = 'absolute inset-y-0 -left-1 -right-1 cursor-col-resize';

  return (
    <div
      className={`${baseClasses} ${colorClasses}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-position={position}
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${position} panel divider`}
    >
      {/* Wider hover/drag area for better UX */}
      <div className={hoverAreaClasses} />
    </div>
  );
};

export default ResizeDivider;
