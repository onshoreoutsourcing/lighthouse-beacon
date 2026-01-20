import type { RefObject, DependencyList } from 'react';
import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useSmartScroll Hook
 *
 * Implements intelligent auto-scroll behavior during streaming.
 * Auto-scrolls to bottom when user is near bottom, but allows manual scrolling up.
 * Shows "scroll to bottom" button when user has scrolled up during streaming.
 *
 * Features:
 * - Auto-scroll when near bottom (within 100px)
 * - Detects manual scroll up
 * - Shows scroll-to-bottom indicator when user scrolls up
 * - Smooth scrolling behavior
 *
 * @param containerRef - Ref to scrollable container
 * @param dependencies - Dependencies that trigger scroll updates (e.g., messages array)
 * @returns Object with scroll state and control functions
 */
export function useSmartScroll<T extends HTMLElement>(
  containerRef: RefObject<T>,
  dependencies: DependencyList
) {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const lastScrollTopRef = useRef<number>(0);

  /**
   * Check if user is near bottom of scroll container
   */
  const isNearBottom = useCallback((element: T): boolean => {
    const threshold = 100; // pixels from bottom
    return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
  }, []);

  /**
   * Scroll to bottom smoothly
   */
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setIsUserScrolled(false);
      setShowScrollButton(false);
    }
  }, [containerRef]);

  /**
   * Handle scroll events to detect user scrolling
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const scrollingUp = currentScrollTop < lastScrollTopRef.current;

      // User scrolled up manually
      if (scrollingUp && !isNearBottom(container)) {
        setIsUserScrolled(true);
        setShowScrollButton(true);
      } else if (isNearBottom(container)) {
        // User is near bottom
        setIsUserScrolled(false);
        setShowScrollButton(false);
      }

      lastScrollTopRef.current = currentScrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, isNearBottom]);

  /**
   * Auto-scroll on new content if user hasn't manually scrolled up
   */
  useEffect(() => {
    if (containerRef.current && !isUserScrolled) {
      // Use requestAnimationFrame for smooth 60 FPS scrolling
      window.requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    showScrollButton,
    scrollToBottom,
  };
}
