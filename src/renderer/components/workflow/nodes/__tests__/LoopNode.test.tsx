/**
 * LoopNode Component Tests
 *
 * Test suite for loop iteration node component.
 * Wave 9.4.2: Loop Nodes - User Story 1
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { LoopNode } from '../LoopNode';
import type { LoopNodeData } from '../LoopNode';

describe('LoopNode', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  const createMockData = (overrides?: Partial<LoopNodeData>): LoopNodeData => ({
    label: 'Process Items',
    status: 'idle',
    items: ['item1', 'item2', 'item3'],
    maxIterations: 100,
    loopSteps: ['step1'],
    loopStatus: 'idle',
    ...overrides,
  });

  const renderNode = (data: LoopNodeData, selected = false) => {
    return render(
      <ReactFlowProvider>
        <LoopNode data={data} selected={selected} />
      </ReactFlowProvider>
    );
  };

  describe('Rendering', () => {
    it('should render node with label', () => {
      const data = createMockData();
      renderNode(data);

      expect(screen.getByText('Process Items')).toBeInTheDocument();
    });

    it('should render array items display', () => {
      const data = createMockData({ items: ['a', 'b', 'c'] });
      renderNode(data);

      expect(screen.getByText('Array (3 items)')).toBeInTheDocument();
    });

    it('should render object items display', () => {
      const data = createMockData({
        items: { key1: 'value1', key2: 'value2' },
      });
      renderNode(data);

      expect(screen.getByText('Object (2 keys)')).toBeInTheDocument();
    });

    it('should render string variable reference', () => {
      const data = createMockData({
        items: '${workflow.inputs.files}',
      });
      renderNode(data);

      expect(screen.getByText('${workflow.inputs.files}')).toBeInTheDocument();
    });

    it('should render range expression', () => {
      const data = createMockData({
        items: 'range(0, 10)',
      });
      renderNode(data);

      expect(screen.getByText('range(0, 10)')).toBeInTheDocument();
    });

    it('should render max iterations', () => {
      const data = createMockData({ maxIterations: 50 });
      renderNode(data);

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('should render loop steps count', () => {
      const data = createMockData({ loopSteps: ['step1', 'step2', 'step3'] });
      renderNode(data);

      expect(screen.getByText('3 steps')).toBeInTheDocument();
    });

    it('should render single loop step', () => {
      const data = createMockData({ loopSteps: ['step1'] });
      renderNode(data);

      expect(screen.getByText('1 step')).toBeInTheDocument();
    });

    it('should have rounded rectangle shape', () => {
      const data = createMockData();
      const { container } = renderNode(data);

      const node = container.querySelector('.rounded-lg');
      expect(node).toBeInTheDocument();
    });
  });

  describe('Status Indicators', () => {
    it('should show idle status with play icon', () => {
      const data = createMockData({ loopStatus: 'idle' });
      renderNode(data);

      const playIcon = screen.getByLabelText('Idle');
      expect(playIcon).toBeInTheDocument();
    });

    it('should show running status with spinner', () => {
      const data = createMockData({ loopStatus: 'running' });
      renderNode(data);

      const spinner = screen.getByLabelText('Running');
      expect(spinner).toBeInTheDocument();
    });

    it('should show completed status with checkmark', () => {
      const data = createMockData({ loopStatus: 'completed' });
      renderNode(data);

      const checkmark = screen.getByLabelText('Completed');
      expect(checkmark).toBeInTheDocument();
    });

    it('should show error status with alert icon', () => {
      const data = createMockData({
        loopStatus: 'error',
        error: 'Loop items undefined',
      });
      renderNode(data);

      const errorIcon = screen.getByLabelText('Error');
      expect(errorIcon).toBeInTheDocument();
      expect(screen.getByText('Loop items undefined')).toBeInTheDocument();
    });
  });

  describe('Progress Visualization', () => {
    it('should show progress bar when running', () => {
      const data = createMockData({
        loopStatus: 'running',
        currentIteration: 2,
        totalIterations: 10,
      });
      renderNode(data);

      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('3 / 10')).toBeInTheDocument();
    });

    it('should calculate correct progress percentage', () => {
      const data = createMockData({
        loopStatus: 'running',
        currentIteration: 4,
        totalIterations: 10,
      });
      const { container } = renderNode(data);

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should not show progress when idle', () => {
      const data = createMockData({ loopStatus: 'idle' });
      renderNode(data);

      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    });

    it('should not show progress when completed', () => {
      const data = createMockData({ loopStatus: 'completed' });
      renderNode(data);

      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    });

    it('should show correct progress at 0% (first iteration)', () => {
      const data = createMockData({
        loopStatus: 'running',
        currentIteration: 0,
        totalIterations: 5,
      });
      const { container } = renderNode(data);

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow', '20');
    });

    it('should show correct progress at 100% (last iteration)', () => {
      const data = createMockData({
        loopStatus: 'running',
        currentIteration: 4,
        totalIterations: 5,
      });
      const { container } = renderNode(data);

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when present', () => {
      const data = createMockData({
        loopStatus: 'error',
        error: 'Max iterations exceeded: 200 > 100',
      });
      renderNode(data);

      expect(screen.getByText('Max iterations exceeded: 200 > 100')).toBeInTheDocument();
    });

    it('should not display error message when no error', () => {
      const data = createMockData();
      renderNode(data);

      const errorContainer = screen.queryByText(/exceeded/i);
      expect(errorContainer).not.toBeInTheDocument();
    });

    it('should only show error when status is error', () => {
      const data = createMockData({
        loopStatus: 'running',
        error: 'Some error',
      });
      renderNode(data);

      // Error message should not be shown when status is not error
      expect(screen.queryByText('Some error')).not.toBeInTheDocument();
    });
  });

  describe('Connection Handles', () => {
    it('should have input handle at top', () => {
      const data = createMockData();
      const { container } = renderNode(data);

      const inputHandle = container.querySelector('[aria-label="Input connection"]');
      expect(inputHandle).toBeInTheDocument();
      expect(inputHandle).toHaveClass('!bg-vscode-accent');
    });

    it('should have output handle at bottom', () => {
      const data = createMockData();
      const { container } = renderNode(data);

      const outputHandle = container.querySelector('[aria-label="Output connection"]');
      expect(outputHandle).toBeInTheDocument();
      expect(outputHandle).toHaveClass('!bg-vscode-accent');
    });
  });

  describe('Styling', () => {
    it('should apply selected border color when selected', () => {
      const data = createMockData();
      const { container } = renderNode(data, true);

      const node = container.querySelector('.border-vscode-accent');
      expect(node).toBeInTheDocument();
    });

    it('should apply running border color', () => {
      const data = createMockData({ loopStatus: 'running' });
      const { container } = renderNode(data);

      const node = container.querySelector('.border-blue-400');
      expect(node).toBeInTheDocument();
    });

    it('should apply completed border color', () => {
      const data = createMockData({ loopStatus: 'completed' });
      const { container } = renderNode(data);

      const node = container.querySelector('.border-green-400');
      expect(node).toBeInTheDocument();
    });

    it('should apply error border color', () => {
      const data = createMockData({ loopStatus: 'error' });
      const { container } = renderNode(data);

      const node = container.querySelector('.border-red-400');
      expect(node).toBeInTheDocument();
    });

    it('should apply running background color', () => {
      const data = createMockData({ loopStatus: 'running' });
      const { container } = renderNode(data);

      const node = container.querySelector('.bg-blue-900\\/10');
      expect(node).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      const data = createMockData();
      renderNode(data);

      const node = screen.getByRole('article');
      expect(node).toHaveAttribute('aria-label', 'Loop node: Process Items');
    });

    it('should have accessible handle labels', () => {
      const data = createMockData();
      renderNode(data);

      expect(screen.getByLabelText('Input connection')).toBeInTheDocument();
      expect(screen.getByLabelText('Output connection')).toBeInTheDocument();
    });

    it('should have accessible progress bar', () => {
      const data = createMockData({
        loopStatus: 'running',
        currentIteration: 5,
        totalIterations: 10,
      });
      const { container } = renderNode(data);

      const progressBar = container.querySelector('[role="progressbar"]');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-label', 'Loop progress: 60%');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  describe('Empty Loop Steps', () => {
    it('should not display loop steps section when empty', () => {
      const data = createMockData({ loopSteps: [] });
      renderNode(data);

      expect(screen.queryByText('Loop Steps')).not.toBeInTheDocument();
    });

    it('should handle undefined loop steps', () => {
      const data = createMockData({ loopSteps: undefined });
      renderNode(data);

      expect(screen.queryByText('Loop Steps')).not.toBeInTheDocument();
    });
  });

  describe('Long Item Expressions', () => {
    it('should handle long variable expressions', () => {
      const longExpression =
        '${steps.fetch_data.outputs.items.map(item => item.value).filter(v => v > 100)}';
      const data = createMockData({ items: longExpression });
      renderNode(data);

      expect(screen.getByText(longExpression)).toBeInTheDocument();
    });

    it('should truncate very long labels', () => {
      const data = createMockData({
        label: 'This is a very long loop label that should be truncated in the UI',
      });
      const { container } = renderNode(data);

      const labelElement = container.querySelector('.truncate');
      expect(labelElement).toBeInTheDocument();
      expect(labelElement?.textContent).toContain('This is a very long loop label');
    });
  });

  describe('Items Display Edge Cases', () => {
    it('should handle empty array', () => {
      const data = createMockData({ items: [] });
      renderNode(data);

      expect(screen.getByText('Array (0 items)')).toBeInTheDocument();
    });

    it('should handle empty object', () => {
      const data = createMockData({ items: {} });
      renderNode(data);

      expect(screen.getByText('Object (0 keys)')).toBeInTheDocument();
    });

    it('should handle large arrays', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      const data = createMockData({ items: largeArray });
      renderNode(data);

      expect(screen.getByText('Array (1000 items)')).toBeInTheDocument();
    });
  });

  describe('Max Iterations Display', () => {
    it('should default to 100 when not specified', () => {
      const data = createMockData({ maxIterations: undefined });
      renderNode(data);

      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should display custom max iterations', () => {
      const data = createMockData({ maxIterations: 500 });
      renderNode(data);

      expect(screen.getByText('500')).toBeInTheDocument();
    });
  });
});
