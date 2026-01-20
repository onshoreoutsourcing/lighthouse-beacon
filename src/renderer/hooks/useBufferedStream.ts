import { useEffect, useRef, useState } from 'react';

/**
 * useBufferedStream Hook
 *
 * Implements 50ms buffered streaming with requestAnimationFrame for 60 FPS performance.
 * Follows ADR-009 for optimal rendering performance during token streaming.
 *
 * Features:
 * - Token buffering with 50ms intervals
 * - requestAnimationFrame for smooth rendering
 * - Automatic flush on stream completion
 * - Performance optimization for 60 FPS
 *
 * @param content - Full content string that updates with new tokens
 * @param isStreaming - Whether the content is currently streaming
 * @returns Buffered content to display
 */
export function useBufferedStream(content: string, isStreaming: boolean): string {
  const [displayContent, setDisplayContent] = useState(content);
  const lastUpdateRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isStreaming) {
      // Not streaming, just use content directly
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    // Streaming is active - use buffered updates
    const updateDisplay = () => {
      const now = window.performance.now();
      const elapsed = now - lastUpdateRef.current;

      // Update every 50ms (20 updates per second for smooth 60 FPS rendering)
      if (elapsed >= 50) {
        setDisplayContent(content);
        lastUpdateRef.current = now;
      }

      // Continue animation loop if still streaming
      rafIdRef.current = window.requestAnimationFrame(updateDisplay);
    };

    // Start animation loop
    rafIdRef.current = window.requestAnimationFrame(updateDisplay);

    // Cleanup on unmount or when streaming stops
    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [content, isStreaming]);

  // When not streaming, display content directly
  return isStreaming ? displayContent : content;
}
