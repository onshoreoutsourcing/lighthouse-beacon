/**
 * ConditionalNode Component Tests
 *
 * Test suite for conditional branching node component.
 * Wave 9.4.1: Conditional Branching - User Story 1
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { ConditionalNode } from '../ConditionalNode';
import type { ConditionalNodeData } from '../ConditionalNode';

describe('ConditionalNode', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  const createMockData = (overrides?: Partial<ConditionalNodeData>): ConditionalNodeData => ({
    label: 'Check Score',
    status: 'idle',
    condition: '${steps.analyze.outputs.score} > 80',
    conditionalStatus: 'idle',
    ...overrides,
  });

  const renderNode = (data: ConditionalNodeData, selected = false) => {
    return render(
      <ReactFlowProvider>
        <ConditionalNode data={data} selected={selected} />
      </ReactFlowProvider>
    );
  };

  describe('Rendering', () => {
    it('should render node with label', () => {
      const data = createMockData();
      renderNode(data);

      expect(screen.getByText('Check Score')).toBeInTheDocument();
    });

    it('should render condition expression', () => {
      const data = createMockData();
      renderNode(data);

      expect(screen.getByText('${steps.analyze.outputs.score} > 80')).toBeInTheDocument();
    });

    it('should render "No condition set" when condition is empty', () => {
      const data = createMockData({ condition: '' });
      renderNode(data);

      expect(screen.getByText('No condition set')).toBeInTheDocument();
    });

    it('should render True and False labels', () => {
      const data = createMockData();
      renderNode(data);

      expect(screen.getByText('True')).toBeInTheDocument();
      expect(screen.getByText('False')).toBeInTheDocument();
    });

    it('should have diamond shape styling', () => {
      const data = createMockData();
      const { container } = renderNode(data);

      // Check for diamond container (checks for transform style containing rotate)
      const elements = container.querySelectorAll('[style]');
      const hasRotatedElement = Array.from(elements).some((el) =>
        (el as HTMLElement).style.transform?.includes('rotate(45deg)')
      );
      expect(hasRotatedElement).toBe(true);
    });
  });

  describe('Status Indicators', () => {
    it('should show evaluating status with spinner', () => {
      const data = createMockData({ conditionalStatus: 'evaluating' });
      renderNode(data);

      const spinner = screen.getByLabelText('Evaluating');
      expect(spinner).toBeInTheDocument();
    });

    it('should show true-taken status with checkmark', () => {
      const data = createMockData({ conditionalStatus: 'true-taken', branchTaken: true });
      renderNode(data);

      const checkmark = screen.getByLabelText('True branch taken');
      expect(checkmark).toBeInTheDocument();
      expect(screen.getByText('→ True branch')).toBeInTheDocument();
    });

    it('should show false-taken status with X icon', () => {
      const data = createMockData({ conditionalStatus: 'false-taken', branchTaken: false });
      renderNode(data);

      const xIcon = screen.getByLabelText('False branch taken');
      expect(xIcon).toBeInTheDocument();
      expect(screen.getByText('→ False branch')).toBeInTheDocument();
    });

    it('should show error status', () => {
      const data = createMockData({
        conditionalStatus: 'error',
        error: 'Variable not found: steps.analyze',
      });
      renderNode(data);

      const errorIcon = screen.getByLabelText('Error');
      expect(errorIcon).toBeInTheDocument();
      expect(screen.getByText('Variable not found: steps.analyze')).toBeInTheDocument();
    });

    it('should show idle status with no icon', () => {
      const data = createMockData({ conditionalStatus: 'idle' });
      renderNode(data);

      // Idle state should not have status icons
      expect(screen.queryByLabelText('Evaluating')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('True branch taken')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('False branch taken')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Error')).not.toBeInTheDocument();
    });
  });

  describe('Branch Indicators', () => {
    it('should display true branch indicator when true path taken', () => {
      const data = createMockData({
        conditionalStatus: 'true-taken',
        branchTaken: true,
      });
      renderNode(data);

      const branchText = screen.getByText('→ True branch');
      expect(branchText).toBeInTheDocument();
      expect(branchText).toHaveClass('text-green-400');
    });

    it('should display false branch indicator when false path taken', () => {
      const data = createMockData({
        conditionalStatus: 'false-taken',
        branchTaken: false,
      });
      renderNode(data);

      const branchText = screen.getByText('→ False branch');
      expect(branchText).toBeInTheDocument();
      expect(branchText).toHaveClass('text-orange-400');
    });

    it('should not show branch indicator when evaluating', () => {
      const data = createMockData({
        conditionalStatus: 'evaluating',
        branchTaken: true,
      });
      renderNode(data);

      expect(screen.queryByText(/branch$/)).not.toBeInTheDocument();
    });

    it('should not show branch indicator when idle', () => {
      const data = createMockData({ conditionalStatus: 'idle' });
      renderNode(data);

      expect(screen.queryByText(/branch$/)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when present', () => {
      const data = createMockData({
        conditionalStatus: 'error',
        error: 'Condition evaluation failed',
      });
      renderNode(data);

      expect(screen.getByText('Condition evaluation failed')).toBeInTheDocument();
    });

    it('should not display error message when no error', () => {
      const data = createMockData();
      renderNode(data);

      const errorContainer = screen.queryByText(/error/i);
      expect(errorContainer).not.toBeInTheDocument();
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

    it('should have true output handle (green)', () => {
      const data = createMockData();
      const { container } = renderNode(data);

      const trueHandle = container.querySelector('[aria-label="True branch connection"]');
      expect(trueHandle).toBeInTheDocument();
      expect(trueHandle).toHaveClass('!bg-green-500');
    });

    it('should have false output handle (red)', () => {
      const data = createMockData();
      const { container } = renderNode(data);

      const falseHandle = container.querySelector('[aria-label="False branch connection"]');
      expect(falseHandle).toBeInTheDocument();
      expect(falseHandle).toHaveClass('!bg-red-500');
    });
  });

  describe('Styling', () => {
    it('should apply selected border color when selected', () => {
      const data = createMockData();
      const { container } = renderNode(data, true);

      // Selected node should have accent border
      const diamondShape = container.querySelector('.border-vscode-accent');
      expect(diamondShape).toBeInTheDocument();
    });

    it('should apply evaluating border color', () => {
      const data = createMockData({ conditionalStatus: 'evaluating' });
      const { container } = renderNode(data);

      const diamondShape = container.querySelector('.border-blue-400');
      expect(diamondShape).toBeInTheDocument();
    });

    it('should apply true-taken border color', () => {
      const data = createMockData({ conditionalStatus: 'true-taken' });
      const { container } = renderNode(data);

      const diamondShape = container.querySelector('.border-green-400');
      expect(diamondShape).toBeInTheDocument();
    });

    it('should apply false-taken border color', () => {
      const data = createMockData({ conditionalStatus: 'false-taken' });
      const { container } = renderNode(data);

      const diamondShape = container.querySelector('.border-orange-400');
      expect(diamondShape).toBeInTheDocument();
    });

    it('should apply error border color', () => {
      const data = createMockData({ conditionalStatus: 'error' });
      const { container } = renderNode(data);

      const diamondShape = container.querySelector('.border-red-400');
      expect(diamondShape).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      const data = createMockData();
      renderNode(data);

      const node = screen.getByRole('article');
      expect(node).toHaveAttribute('aria-label', 'Conditional node: Check Score');
    });

    it('should have accessible handle labels', () => {
      const data = createMockData();
      renderNode(data);

      expect(screen.getByLabelText('Input connection')).toBeInTheDocument();
      expect(screen.getByLabelText('True branch connection')).toBeInTheDocument();
      expect(screen.getByLabelText('False branch connection')).toBeInTheDocument();
    });
  });

  describe('Long Condition Expressions', () => {
    it('should handle long condition expressions', () => {
      const longCondition =
        '${steps.check1.outputs.value} > 100 && ${steps.check2.outputs.status} === "active" && ${workflow.inputs.threshold} < 500';
      const data = createMockData({ condition: longCondition });
      renderNode(data);

      expect(screen.getByText(longCondition)).toBeInTheDocument();
    });

    it('should truncate very long labels', () => {
      const data = createMockData({
        label: 'This is a very long label that should be truncated in the UI',
      });
      const { container } = renderNode(data);

      const labelElement = container.querySelector('.truncate');
      expect(labelElement).toBeInTheDocument();
      expect(labelElement?.textContent).toContain('This is a very long label');
    });
  });
});
