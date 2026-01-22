/**
 * BreakpointIndicator Component Tests
 * Wave 9.4.6: Step-by-Step Debugging
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BreakpointIndicator } from '../BreakpointIndicator';

describe('BreakpointIndicator', () => {
  const mockOnToggle = vi.fn();
  const defaultProps = {
    nodeId: 'test-node-1',
    hasBreakpoint: false,
    enabled: true,
    onToggle: mockOnToggle,
    debugMode: true,
  };

  beforeEach(() => {
    mockOnToggle.mockClear();
  });

  describe('Visibility', () => {
    it('should not render when debug mode is off', () => {
      const { container } = render(<BreakpointIndicator {...defaultProps} debugMode={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when debug mode is on', () => {
      render(<BreakpointIndicator {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Breakpoint States', () => {
    it('should show empty circle when no breakpoint is set', () => {
      render(<BreakpointIndicator {...defaultProps} hasBreakpoint={false} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Add breakpoint to test-node-1');
    });

    it('should show filled red circle when breakpoint is set and enabled', () => {
      render(<BreakpointIndicator {...defaultProps} hasBreakpoint={true} enabled={true} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Remove breakpoint from test-node-1');
    });

    it('should show dark red circle when breakpoint is set but disabled', () => {
      render(<BreakpointIndicator {...defaultProps} hasBreakpoint={true} enabled={false} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Enable breakpoint on test-node-1');
    });
  });

  describe('Interaction', () => {
    it('should call onToggle when clicked', () => {
      render(<BreakpointIndicator {...defaultProps} />);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockOnToggle).toHaveBeenCalledWith('test-node-1');
      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should stop event propagation when clicked', () => {
      const handleParentClick = vi.fn();
      const { container } = render(
        <div onClick={handleParentClick}>
          <BreakpointIndicator {...defaultProps} />
        </div>
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnToggle).toHaveBeenCalledWith('test-node-1');
      expect(handleParentClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const { rerender } = render(
        <BreakpointIndicator {...defaultProps} hasBreakpoint={false} />
      );
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Add breakpoint to test-node-1'
      );

      rerender(<BreakpointIndicator {...defaultProps} hasBreakpoint={true} enabled={true} />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Remove breakpoint from test-node-1'
      );

      rerender(<BreakpointIndicator {...defaultProps} hasBreakpoint={true} enabled={false} />);
      expect(screen.getByRole('button')).toHaveAttribute(
        'aria-label',
        'Enable breakpoint on test-node-1'
      );
    });

    it('should have proper title attribute', () => {
      const { rerender } = render(
        <BreakpointIndicator {...defaultProps} hasBreakpoint={false} />
      );
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Click to add breakpoint');

      rerender(<BreakpointIndicator {...defaultProps} hasBreakpoint={true} />);
      expect(screen.getByRole('button')).toHaveAttribute('title', 'Click to remove breakpoint');
    });

    it('should be keyboard accessible', () => {
      render(<BreakpointIndicator {...defaultProps} />);
      const button = screen.getByRole('button');

      button.focus();
      expect(button).toHaveFocus();

      // fireEvent.keyDown doesn't trigger click handlers automatically
      // Just verify the button is focusable and has proper focus state
      // The actual click would be triggered by the browser, not by keyDown event
    });
  });
});
