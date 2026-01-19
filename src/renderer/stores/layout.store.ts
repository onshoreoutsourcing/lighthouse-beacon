/**
 * Layout Store
 *
 * Manages panel width state for the three-panel layout with persistence.
 * Uses Zustand with persist middleware to save panel widths to localStorage.
 *
 * Panel Width Constraints:
 * - Left panel: 15% min, 50% max
 * - Center panel: 30% min, 70% max
 * - Right panel: 15% min, 50% max
 *
 * Default widths: 20% / 45% / 35% (always sum to 100%)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Panel width constraints (percentages)
export const PANEL_CONSTRAINTS = {
  left: { min: 15, max: 50 },
  center: { min: 30, max: 70 },
  right: { min: 15, max: 50 },
} as const;

// Default panel widths (percentages, sum to 100%)
export const DEFAULT_PANEL_WIDTHS = {
  left: 20,
  center: 45,
  right: 35,
} as const;

interface LayoutState {
  // Panel widths (percentages)
  leftPanelWidth: number;
  centerPanelWidth: number;
  rightPanelWidth: number;

  // Actions
  setLeftPanelWidth: (width: number) => void;
  setCenterPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  resetToDefaults: () => void;
}

/**
 * Validates and constrains a panel width value
 * @param width - Proposed width percentage
 * @param min - Minimum allowed width
 * @param max - Maximum allowed width
 * @returns Constrained width value
 */
const constrainWidth = (width: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, width));
};

/**
 * Ensures all three panel widths sum to 100%
 * Adjusts the third panel to make up the difference
 */
const normalizePanelWidths = (
  left: number,
  center: number,
  right: number
): { left: number; center: number; right: number } => {
  const total = left + center + right;
  const diff = 100 - total;

  // If very close to 100%, adjust right panel slightly
  if (Math.abs(diff) < 0.1) {
    return { left, center, right: right + diff };
  }

  // If significant difference, return defaults
  if (Math.abs(diff) > 5) {
    return DEFAULT_PANEL_WIDTHS;
  }

  return { left, center, right: right + diff };
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      // Initial state
      leftPanelWidth: DEFAULT_PANEL_WIDTHS.left,
      centerPanelWidth: DEFAULT_PANEL_WIDTHS.center,
      rightPanelWidth: DEFAULT_PANEL_WIDTHS.right,

      // Set left panel width (adjusts center panel to compensate)
      setLeftPanelWidth: (width: number) => {
        const constrained = constrainWidth(
          width,
          PANEL_CONSTRAINTS.left.min,
          PANEL_CONSTRAINTS.left.max
        );

        const { rightPanelWidth } = get();
        const newCenterWidth = 100 - constrained - rightPanelWidth;

        // Ensure center panel stays within constraints
        if (
          newCenterWidth >= PANEL_CONSTRAINTS.center.min &&
          newCenterWidth <= PANEL_CONSTRAINTS.center.max
        ) {
          set({
            leftPanelWidth: constrained,
            centerPanelWidth: newCenterWidth,
          });
        }
      },

      // Set center panel width (used when dragging right divider)
      setCenterPanelWidth: (width: number) => {
        const constrained = constrainWidth(
          width,
          PANEL_CONSTRAINTS.center.min,
          PANEL_CONSTRAINTS.center.max
        );

        const { leftPanelWidth } = get();
        const newRightWidth = 100 - leftPanelWidth - constrained;

        // Ensure right panel stays within constraints
        if (
          newRightWidth >= PANEL_CONSTRAINTS.right.min &&
          newRightWidth <= PANEL_CONSTRAINTS.right.max
        ) {
          set({
            centerPanelWidth: constrained,
            rightPanelWidth: newRightWidth,
          });
        }
      },

      // Set right panel width (adjusts center panel to compensate)
      setRightPanelWidth: (width: number) => {
        const constrained = constrainWidth(
          width,
          PANEL_CONSTRAINTS.right.min,
          PANEL_CONSTRAINTS.right.max
        );

        const { leftPanelWidth } = get();
        const newCenterWidth = 100 - leftPanelWidth - constrained;

        // Ensure center panel stays within constraints
        if (
          newCenterWidth >= PANEL_CONSTRAINTS.center.min &&
          newCenterWidth <= PANEL_CONSTRAINTS.center.max
        ) {
          set({
            rightPanelWidth: constrained,
            centerPanelWidth: newCenterWidth,
          });
        }
      },

      // Reset all panel widths to defaults
      resetToDefaults: () => {
        set({
          leftPanelWidth: DEFAULT_PANEL_WIDTHS.left,
          centerPanelWidth: DEFAULT_PANEL_WIDTHS.center,
          rightPanelWidth: DEFAULT_PANEL_WIDTHS.right,
        });
      },
    }),
    {
      name: 'lighthouse-layout-storage', // localStorage key
      // Only persist the width values, not the action functions
      partialize: (state) => ({
        leftPanelWidth: state.leftPanelWidth,
        centerPanelWidth: state.centerPanelWidth,
        rightPanelWidth: state.rightPanelWidth,
      }),
      // Custom merge function to validate persisted state
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<LayoutState>;

        // Validate persisted widths exist and are numbers
        if (
          typeof persisted.leftPanelWidth === 'number' &&
          typeof persisted.centerPanelWidth === 'number' &&
          typeof persisted.rightPanelWidth === 'number'
        ) {
          // Normalize to ensure they sum to 100%
          const normalized = normalizePanelWidths(
            persisted.leftPanelWidth,
            persisted.centerPanelWidth,
            persisted.rightPanelWidth
          );

          return {
            ...currentState,
            ...normalized,
          };
        }

        // If validation fails, use defaults
        return currentState;
      },
    }
  )
);
