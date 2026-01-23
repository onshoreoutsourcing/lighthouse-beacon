/**
 * Tests for ExecutionHistoryPanel Component
 *
 * Comprehensive test coverage for execution history display and filtering.
 * Target: ≥90% coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ExecutionHistoryPanel } from '../ExecutionHistoryPanel';
import { useExecutionHistoryStore } from '../../../stores/executionHistory.store';
import type { ExecutionHistoryEntry } from '../../../stores/executionHistory.store';

// Mock the store
vi.mock('../../../stores/executionHistory.store');

describe('ExecutionHistoryPanel', () => {
  const mockGetHistory = vi.fn();
  const mockClearHistory = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementation
    (useExecutionHistoryStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      getHistory: mockGetHistory,
      clearHistory: mockClearHistory,
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      mockGetHistory.mockReturnValue([]);
    });

    it('should render empty state when no history', () => {
      render(<ExecutionHistoryPanel />);

      expect(screen.getByText(/no execution history/i)).toBeInTheDocument();
    });

    it('should have accessible empty state message', () => {
      render(<ExecutionHistoryPanel />);

      const emptyMessage = screen.getByRole('status');
      expect(emptyMessage).toHaveAttribute('aria-label', 'No execution history available');
    });

    it('should not show clear button when no history', () => {
      render(<ExecutionHistoryPanel />);

      const clearButton = screen.queryByRole('button', { name: /clear history/i });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('History Display', () => {
    const mockEntries: ExecutionHistoryEntry[] = [
      {
        id: 'exec-1',
        workflowId: 'workflow-1',
        workflowName: 'Data Analysis',
        timestamp: Date.now() - 3600000, // 1 hour ago
        duration: 5000,
        status: 'success',
        inputs: { file: 'data.csv' },
        outputs: { result: 'processed' },
        stepResults: [
          { stepId: 'step-1', status: 'success', duration: 2500 },
          { stepId: 'step-2', status: 'success', duration: 2500 },
        ],
      },
      {
        id: 'exec-2',
        workflowId: 'workflow-1',
        workflowName: 'Data Analysis',
        timestamp: Date.now() - 7200000, // 2 hours ago
        duration: 3000,
        status: 'failed',
        inputs: { file: 'bad.csv' },
        outputs: {},
        error: 'File not found',
        stepResults: [
          { stepId: 'step-1', status: 'failed', duration: 3000, error: 'File not found' },
        ],
      },
      {
        id: 'exec-3',
        workflowId: 'workflow-2',
        workflowName: 'Image Processing',
        timestamp: Date.now() - 1800000, // 30 minutes ago
        duration: 2000,
        status: 'cancelled',
        inputs: { image: 'photo.jpg' },
        outputs: {},
        stepResults: [],
      },
    ];

    beforeEach(() => {
      mockGetHistory.mockReturnValue(mockEntries);
    });

    it('should render list of execution entries', () => {
      render(<ExecutionHistoryPanel />);

      expect(screen.getAllByText('Data Analysis')).toHaveLength(2);
      expect(screen.getByText('Image Processing')).toBeInTheDocument();
    });

    it('should display execution status with correct colors', () => {
      render(<ExecutionHistoryPanel />);

      // Get all status elements
      const successElements = screen
        .getAllByRole('listitem')
        .filter((el) => el.getAttribute('data-status') === 'success');
      const failedElements = screen
        .getAllByRole('listitem')
        .filter((el) => el.getAttribute('data-status') === 'failed');
      const cancelledElements = screen
        .getAllByRole('listitem')
        .filter((el) => el.getAttribute('data-status') === 'cancelled');

      // Success status should have green styling
      expect(successElements[0]).toHaveClass('border-green-500');

      // Failed status should have red styling
      expect(failedElements[0]).toHaveClass('border-red-500');

      // Cancelled status should have yellow styling
      expect(cancelledElements[0]).toHaveClass('border-yellow-500');
    });

    it('should display timestamp in relative format', () => {
      render(<ExecutionHistoryPanel />);

      // Should show relative time like "1 hour ago", "2 hours ago", "30 minutes ago"
      expect(screen.getAllByText(/ago/).length).toBeGreaterThan(0);
    });

    it('should display duration in readable format', () => {
      render(<ExecutionHistoryPanel />);

      // Should show duration like "5.0s", "3.0s", "2.0s"
      expect(screen.getByText('5.0s')).toBeInTheDocument();
      expect(screen.getByText('3.0s')).toBeInTheDocument();
      expect(screen.getByText('2.0s')).toBeInTheDocument();
    });

    it('should have accessible list structure', () => {
      render(<ExecutionHistoryPanel />);

      const historyList = screen.getByRole('list', { name: /execution history/i });
      expect(historyList).toBeInTheDocument();

      const listItems = within(historyList).getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
    });
  });

  describe('Entry Expansion', () => {
    const mockEntry: ExecutionHistoryEntry = {
      id: 'exec-1',
      workflowId: 'workflow-1',
      workflowName: 'Test Workflow',
      timestamp: Date.now(),
      duration: 5000,
      status: 'success',
      inputs: { param1: 'value1', param2: 'value2' },
      outputs: { result: 'success', data: { count: 42 } },
      stepResults: [
        { stepId: 'step-1', status: 'success', duration: 2500 },
        { stepId: 'step-2', status: 'success', duration: 2500 },
      ],
    };

    beforeEach(() => {
      mockGetHistory.mockReturnValue([mockEntry]);
    });

    it('should initially hide entry details', () => {
      render(<ExecutionHistoryPanel />);

      expect(screen.queryByText('Inputs:')).not.toBeInTheDocument();
      expect(screen.queryByText('Outputs:')).not.toBeInTheDocument();
    });

    it('should expand entry details on click', () => {
      render(<ExecutionHistoryPanel />);

      const entryButton = screen.getByRole('button', { name: /test workflow/i });
      fireEvent.click(entryButton);

      expect(screen.getByText('Inputs:')).toBeInTheDocument();
      expect(screen.getByText('Outputs:')).toBeInTheDocument();
      expect(screen.getByText('Step Results:')).toBeInTheDocument();
    });

    it('should collapse entry details on second click', () => {
      render(<ExecutionHistoryPanel />);

      const entryButton = screen.getByRole('button', { name: /test workflow/i });

      // Expand
      fireEvent.click(entryButton);
      expect(screen.getByText('Inputs:')).toBeInTheDocument();

      // Collapse
      fireEvent.click(entryButton);
      expect(screen.queryByText('Inputs:')).not.toBeInTheDocument();
    });

    it('should display input parameters in expanded view', () => {
      render(<ExecutionHistoryPanel />);

      const entryButton = screen.getByRole('button', { name: /test workflow/i });
      fireEvent.click(entryButton);

      expect(screen.getByText(/param1/)).toBeInTheDocument();
      expect(screen.getByText(/value1/)).toBeInTheDocument();
      expect(screen.getByText(/param2/)).toBeInTheDocument();
      expect(screen.getByText(/value2/)).toBeInTheDocument();
    });

    it('should display output data in expanded view', () => {
      render(<ExecutionHistoryPanel />);

      const entryButton = screen.getByRole('button', { name: /test workflow/i });
      fireEvent.click(entryButton);

      expect(screen.getByText(/result/)).toBeInTheDocument();
      expect(screen.getByText(/success/)).toBeInTheDocument();
    });

    it('should display step results in expanded view', () => {
      render(<ExecutionHistoryPanel />);

      const entryButton = screen.getByRole('button', { name: /test workflow/i });
      fireEvent.click(entryButton);

      expect(screen.getByText(/step-1/)).toBeInTheDocument();
      expect(screen.getByText(/step-2/)).toBeInTheDocument();
    });

    it('should display error message for failed executions', () => {
      const failedEntry: ExecutionHistoryEntry = {
        ...mockEntry,
        status: 'failed',
        error: 'Python script execution failed',
      };

      mockGetHistory.mockReturnValue([failedEntry]);

      render(<ExecutionHistoryPanel />);

      const entryButton = screen.getByRole('button', { name: /test workflow/i });
      fireEvent.click(entryButton);

      expect(screen.getByText('Error:')).toBeInTheDocument();
      expect(screen.getByText(/python script execution failed/i)).toBeInTheDocument();
    });
  });

  describe('Workflow Filtering', () => {
    const mockEntries: ExecutionHistoryEntry[] = [
      {
        id: 'exec-1',
        workflowId: 'workflow-1',
        workflowName: 'Workflow A',
        timestamp: Date.now(),
        duration: 1000,
        status: 'success',
        inputs: {},
        outputs: {},
        stepResults: [],
      },
      {
        id: 'exec-2',
        workflowId: 'workflow-1',
        workflowName: 'Workflow A',
        timestamp: Date.now() - 1000,
        duration: 1000,
        status: 'success',
        inputs: {},
        outputs: {},
        stepResults: [],
      },
      {
        id: 'exec-3',
        workflowId: 'workflow-2',
        workflowName: 'Workflow B',
        timestamp: Date.now(),
        duration: 1000,
        status: 'success',
        inputs: {},
        outputs: {},
        stepResults: [],
      },
    ];

    it('should filter history by workflowId prop', () => {
      mockGetHistory.mockReturnValue(mockEntries.filter((e) => e.workflowId === 'workflow-1'));

      render(<ExecutionHistoryPanel workflowId="workflow-1" />);

      expect(mockGetHistory).toHaveBeenCalledWith('workflow-1');

      const entries = screen.getAllByText('Workflow A');
      expect(entries).toHaveLength(2);

      expect(screen.queryByText('Workflow B')).not.toBeInTheDocument();
    });

    it('should show all workflows when no filter provided', () => {
      mockGetHistory.mockReturnValue(mockEntries);

      render(<ExecutionHistoryPanel />);

      expect(mockGetHistory).toHaveBeenCalledWith(undefined);

      expect(screen.getAllByText('Workflow A')).toHaveLength(2);
      expect(screen.getByText('Workflow B')).toBeInTheDocument();
    });
  });

  describe('Clear History', () => {
    const mockEntries: ExecutionHistoryEntry[] = [
      {
        id: 'exec-1',
        workflowId: 'workflow-1',
        workflowName: 'Test',
        timestamp: Date.now(),
        duration: 1000,
        status: 'success',
        inputs: {},
        outputs: {},
        stepResults: [],
      },
    ];

    beforeEach(() => {
      mockGetHistory.mockReturnValue(mockEntries);
    });

    it('should show clear button when history exists', () => {
      render(<ExecutionHistoryPanel />);

      const clearButton = screen.getByRole('button', { name: /clear history/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should call clearHistory with no args when clearing all', () => {
      render(<ExecutionHistoryPanel />);

      const clearButton = screen.getByRole('button', { name: /clear history/i });
      fireEvent.click(clearButton);

      expect(mockClearHistory).toHaveBeenCalledWith(undefined);
    });

    it('should call clearHistory with workflowId when filtering', () => {
      render(<ExecutionHistoryPanel workflowId="workflow-1" />);

      const clearButton = screen.getByRole('button', { name: /clear history/i });
      fireEvent.click(clearButton);

      expect(mockClearHistory).toHaveBeenCalledWith('workflow-1');
    });
  });

  describe('Entry Selection Callback', () => {
    const mockEntry: ExecutionHistoryEntry = {
      id: 'exec-1',
      workflowId: 'workflow-1',
      workflowName: 'Test',
      timestamp: Date.now(),
      duration: 1000,
      status: 'success',
      inputs: {},
      outputs: {},
      stepResults: [],
    };

    beforeEach(() => {
      mockGetHistory.mockReturnValue([mockEntry]);
    });

    it('should call onSelectEntry when entry clicked', () => {
      const onSelectEntry = vi.fn();

      render(<ExecutionHistoryPanel onSelectEntry={onSelectEntry} />);

      const entryButton = screen.getByRole('button', { name: /test/i });
      fireEvent.click(entryButton);

      expect(onSelectEntry).toHaveBeenCalledWith(mockEntry);
    });

    it('should not call onSelectEntry when callback not provided', () => {
      render(<ExecutionHistoryPanel />);

      const entryButton = screen.getByRole('button', { name: /test/i });

      // Should not throw error
      expect(() => fireEvent.click(entryButton)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    const mockEntry: ExecutionHistoryEntry = {
      id: 'exec-1',
      workflowId: 'workflow-1',
      workflowName: 'Test Workflow',
      timestamp: Date.now(),
      duration: 5000,
      status: 'success',
      inputs: {},
      outputs: {},
      stepResults: [],
    };

    beforeEach(() => {
      mockGetHistory.mockReturnValue([mockEntry]);
    });

    it('should have region role for panel', () => {
      render(<ExecutionHistoryPanel />);

      const panel = screen.getByRole('region', { name: /execution history/i });
      expect(panel).toBeInTheDocument();
    });

    it('should have accessible entry buttons', () => {
      render(<ExecutionHistoryPanel />);

      const entryButton = screen.getByRole('button', { name: /test workflow/i });
      expect(entryButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(entryButton);
      expect(entryButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should use semantic HTML for status indicators', () => {
      render(<ExecutionHistoryPanel />);

      const statusBadge = screen.getByRole('status');
      expect(statusBadge).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render large history list efficiently', () => {
      const largeHistory: ExecutionHistoryEntry[] = Array.from({ length: 50 }, (_, i) => ({
        id: `exec-${i}`,
        workflowId: `workflow-${i % 10}`,
        workflowName: `Workflow ${i % 10}`,
        timestamp: Date.now() - i * 1000,
        duration: 1000,
        status: 'success' as const,
        inputs: {},
        outputs: {},
        stepResults: [],
      }));

      mockGetHistory.mockReturnValue(largeHistory);

      const startTime = performance.now();
      render(<ExecutionHistoryPanel />);
      const endTime = performance.now();

      const renderTime = endTime - startTime;

      // Should render in under 200ms
      expect(renderTime).toBeLessThan(200);
    });
  });
});
