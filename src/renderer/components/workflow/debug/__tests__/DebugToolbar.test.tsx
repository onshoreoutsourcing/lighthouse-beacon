/**
 * DebugToolbar Component Tests
 * Wave 9.4.6: Step-by-Step Debugging
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DebugToolbar } from '../DebugToolbar';

describe('DebugToolbar', () => {
  const mockCallbacks = {
    onToggleDebugMode: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onStepOver: vi.fn(),
    onContinue: vi.fn(),
  };

  const defaultProps = {
    debugMode: 'OFF' as const,
    debugState: 'RUNNING' as const,
    currentNodeId: undefined,
    breakpointCount: 0,
    isExecuting: false,
    ...mockCallbacks,
  };

  beforeEach(() => {
    Object.values(mockCallbacks).forEach((fn) => fn.mockClear());
  });

  describe('Debug Mode Toggle', () => {
    it('should show OFF state when debug mode is off', () => {
      render(<DebugToolbar {...defaultProps} />);
      expect(screen.getByText('Debug Mode: OFF')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /turn debug mode on/i })).toBeInTheDocument();
    });

    it('should show ON state when debug mode is on', () => {
      render(<DebugToolbar {...defaultProps} debugMode="ON" />);
      expect(screen.getByText('Debug Mode: ON')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /turn debug mode off/i })).toBeInTheDocument();
    });

    it('should call onToggleDebugMode when toggle button is clicked', () => {
      render(<DebugToolbar {...defaultProps} />);
      const toggleButton = screen.getByRole('button', { name: /turn debug mode on/i });
      fireEvent.click(toggleButton);
      expect(mockCallbacks.onToggleDebugMode).toHaveBeenCalledTimes(1);
    });

    it('should not show control buttons when debug mode is OFF', () => {
      render(<DebugToolbar {...defaultProps} debugMode="OFF" />);
      expect(screen.queryByRole('button', { name: /pause execution/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /resume execution/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /step over/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /continue/i })).not.toBeInTheDocument();
    });

    it('should show control buttons when debug mode is ON', () => {
      render(<DebugToolbar {...defaultProps} debugMode="ON" />);
      expect(screen.getByRole('button', { name: /pause execution/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resume execution/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /step over/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });
  });

  describe('Control Buttons - Enabled/Disabled States', () => {
    it('should disable pause button when not executing', () => {
      render(<DebugToolbar {...defaultProps} debugMode="ON" isExecuting={false} />);
      const pauseButton = screen.getByRole('button', { name: /pause execution/i });
      expect(pauseButton).toBeDisabled();
    });

    it('should enable pause button when executing and not paused', () => {
      render(
        <DebugToolbar
          {...defaultProps}
          debugMode="ON"
          isExecuting={true}
          debugState="RUNNING"
        />
      );
      const pauseButton = screen.getByRole('button', { name: /pause execution/i });
      expect(pauseButton).not.toBeDisabled();
    });

    it('should disable pause button when already paused', () => {
      render(
        <DebugToolbar {...defaultProps} debugMode="ON" isExecuting={true} debugState="PAUSED" />
      );
      const pauseButton = screen.getByRole('button', { name: /pause execution/i });
      expect(pauseButton).toBeDisabled();
    });

    it('should disable resume, step-over, and continue when not paused', () => {
      render(<DebugToolbar {...defaultProps} debugMode="ON" debugState="RUNNING" />);
      expect(screen.getByRole('button', { name: /resume execution/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /step over/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
    });

    it('should enable resume, step-over, and continue when paused', () => {
      render(<DebugToolbar {...defaultProps} debugMode="ON" debugState="PAUSED" />);
      expect(screen.getByRole('button', { name: /resume execution/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /step over/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
    });
  });

  describe('Control Button Callbacks', () => {
    it('should call onPause when pause button is clicked', () => {
      render(
        <DebugToolbar
          {...defaultProps}
          debugMode="ON"
          isExecuting={true}
          debugState="RUNNING"
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /pause execution/i }));
      expect(mockCallbacks.onPause).toHaveBeenCalledTimes(1);
    });

    it('should call onResume when resume button is clicked', () => {
      render(<DebugToolbar {...defaultProps} debugMode="ON" debugState="PAUSED" />);
      fireEvent.click(screen.getByRole('button', { name: /resume execution/i }));
      expect(mockCallbacks.onResume).toHaveBeenCalledTimes(1);
    });

    it('should call onStepOver when step-over button is clicked', () => {
      render(<DebugToolbar {...defaultProps} debugMode="ON" debugState="PAUSED" />);
      fireEvent.click(screen.getByRole('button', { name: /step over/i }));
      expect(mockCallbacks.onStepOver).toHaveBeenCalledTimes(1);
    });

    it('should call onContinue when continue button is clicked', () => {
      render(<DebugToolbar {...defaultProps} debugMode="ON" debugState="PAUSED" />);
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      expect(mockCallbacks.onContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe('Status Display', () => {
    it('should show RUNNING status', () => {
      render(<DebugToolbar {...defaultProps} debugMode="ON" debugState="RUNNING" />);
      expect(screen.getByText(/RUNNING/)).toBeInTheDocument();
    });

    it('should show PAUSED status', () => {
      render(<DebugToolbar {...defaultProps} debugMode="ON" debugState="PAUSED" />);
      expect(screen.getByText(/PAUSED/)).toBeInTheDocument();
    });

    it('should show current node ID when paused', () => {
      render(
        <DebugToolbar
          {...defaultProps}
          debugMode="ON"
          debugState="PAUSED"
          currentNodeId="test-node-1"
        />
      );
      expect(screen.getByText(/PAUSED at test-node-1/)).toBeInTheDocument();
    });

    it('should show breakpoint count', () => {
      render(<DebugToolbar {...defaultProps} debugMode="ON" breakpointCount={3} />);
      expect(screen.getByText('3 active')).toBeInTheDocument();
    });

    it('should update breakpoint count reactively', () => {
      const { rerender } = render(
        <DebugToolbar {...defaultProps} debugMode="ON" breakpointCount={0} />
      );
      expect(screen.getByText('0 active')).toBeInTheDocument();

      rerender(<DebugToolbar {...defaultProps} debugMode="ON" breakpointCount={5} />);
      expect(screen.getByText('5 active')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on all buttons', () => {
      render(<DebugToolbar {...defaultProps} debugMode="ON" />);

      expect(screen.getByRole('button', { name: /turn debug mode off/i })).toHaveAttribute(
        'aria-label',
        'Turn debug mode off'
      );
      expect(screen.getByRole('button', { name: /pause execution/i })).toHaveAttribute(
        'aria-label',
        'Pause execution'
      );
      expect(screen.getByRole('button', { name: /resume execution/i })).toHaveAttribute(
        'aria-label',
        'Resume execution'
      );
      expect(screen.getByRole('button', { name: /step over/i })).toHaveAttribute(
        'aria-label',
        'Step over to next node'
      );
      expect(screen.getByRole('button', { name: /continue/i })).toHaveAttribute(
        'aria-label',
        'Continue to next breakpoint'
      );
    });

    it('should have proper title attributes', () => {
      render(<DebugToolbar {...defaultProps} debugMode="ON" />);

      expect(screen.getByRole('button', { name: /pause execution/i })).toHaveAttribute(
        'title',
        'Pause execution at next step'
      );
      expect(screen.getByRole('button', { name: /resume execution/i })).toHaveAttribute(
        'title',
        'Resume normal execution'
      );
      expect(screen.getByRole('button', { name: /step over/i })).toHaveAttribute(
        'title',
        'Execute current step and pause at next'
      );
      expect(screen.getByRole('button', { name: /continue/i })).toHaveAttribute(
        'title',
        'Continue until next breakpoint or completion'
      );
    });
  });
});
