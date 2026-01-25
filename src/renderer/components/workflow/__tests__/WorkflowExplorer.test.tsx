/**
 * WorkflowExplorer Component Tests
 *
 * Tests for workflow file browser component with search and CRUD operations.
 * Following TDD approach - tests written before implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { WorkflowExplorer } from '../WorkflowExplorer';
import type { WorkflowListItem } from '@main/services/workflow/WorkflowService';

// Mock workflow API functions
const mockList = vi.fn();
const mockDelete = vi.fn();

// Setup window.electronAPI mock before all tests
beforeAll(() => {
  // Setup window.electronAPI mock
  if (!window.electronAPI) {
    (window as any).electronAPI = {
      workflow: {
        list: mockList,
        delete: mockDelete,
      },
    };
  }
});

describe('WorkflowExplorer', () => {
  const mockWorkflows: WorkflowListItem[] = [
    {
      fileName: 'analyze-repo.yaml',
      filePath: '/path/to/analyze-repo.yaml',
      name: 'Analyze Repository',
      version: '1.0.0',
      description: 'Analyzes code repository structure and generates documentation',
      fileSize: 1024,
      lastModified: new Date('2026-01-20T10:00:00Z'),
      tags: ['analysis', 'documentation'],
    },
    {
      fileName: 'test-workflow.yaml',
      filePath: '/path/to/test-workflow.yaml',
      name: 'Test Workflow',
      version: '0.1.0',
      description: 'A simple test workflow for validation',
      fileSize: 512,
      lastModified: new Date('2026-01-21T15:30:00Z'),
      tags: ['test'],
    },
    {
      fileName: 'data-pipeline.yaml',
      filePath: '/path/to/data-pipeline.yaml',
      name: 'Data Pipeline',
      version: '2.0.0',
      description: 'ETL data processing workflow with validation and error handling',
      fileSize: 2048,
      lastModified: new Date('2026-01-19T08:00:00Z'),
      tags: ['data', 'etl'],
    },
  ];

  beforeEach(() => {
    // Clean up any mounted React components
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up React state after each test
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render workflow explorer container', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: [] } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByRole('status', { name: /no workflows available/i })).toBeInTheDocument();
      });
    });

    it('should display header with title and new workflow button', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: [] } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText(/workflows/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /new workflow/i })).toBeInTheDocument();
      });
    });

    it('should display search input', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search workflows/i)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Loading', () => {
    it('should load and display workflows on mount', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(mockList).toHaveBeenCalled();
        expect(screen.getByText('Analyze Repository')).toBeInTheDocument();
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
        expect(screen.getByText('Data Pipeline')).toBeInTheDocument();
      });
    });

    it('should display workflow metadata (description truncated, last modified)', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        // Check description is displayed
        expect(screen.getByText(/Analyzes code repository/i)).toBeInTheDocument();

        // Check last modified is displayed (should show relative time) - multiple workflows have "ago"
        const agoElements = screen.getAllByText(/ago/i);
        expect(agoElements.length).toBeGreaterThan(0);
      });
    });

    it('should display loading state while fetching workflows', () => {
      mockList.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      render(<WorkflowExplorer />);

      expect(screen.getByText(/loading workflows/i)).toBeInTheDocument();
    });

    it('should display error state if loading fails', async () => {
      mockList.mockResolvedValue({
        success: false,
        error: new Error('Test error message'),
      });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        // Check for error message in the error state
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/failed to load workflows/i)).toBeInTheDocument();
        expect(screen.getByText(/test error message/i)).toBeInTheDocument();
      });
    });

    it('should display empty state when no workflows exist', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: [] } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText(/no workflows found/i)).toBeInTheDocument();
        expect(screen.getByText(/create your first workflow/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Filtering', () => {
    it('should filter workflows by name in real-time', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });

      render(<WorkflowExplorer />);

      // Wait for workflows to load
      await waitFor(() => {
        expect(screen.getByText('Analyze Repository')).toBeInTheDocument();
      });

      // Search for "test"
      const searchInput = screen.getByPlaceholderText(/search workflows/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Should only show "Test Workflow"
      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
        expect(screen.queryByText('Analyze Repository')).not.toBeInTheDocument();
        expect(screen.queryByText('Data Pipeline')).not.toBeInTheDocument();
      });
    });

    it('should be case-insensitive search', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText('Data Pipeline')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search workflows/i);
      fireEvent.change(searchInput, { target: { value: 'DATA' } });

      await waitFor(() => {
        expect(screen.getByText('Data Pipeline')).toBeInTheDocument();
        expect(screen.queryByText('Test Workflow')).not.toBeInTheDocument();
      });
    });

    it('should search in description as well', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText('Data Pipeline')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search workflows/i);
      fireEvent.change(searchInput, { target: { value: 'validation' } });

      await waitFor(() => {
        // Should match both "Test Workflow" (description: "validation")
        // and "Data Pipeline" (description: "validation and error handling")
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
        expect(screen.getByText('Data Pipeline')).toBeInTheDocument();
        expect(screen.queryByText('Analyze Repository')).not.toBeInTheDocument();
      });
    });

    it('should show empty search results state', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText('Analyze Repository')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search workflows/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText(/no workflows match/i)).toBeInTheDocument();
      });
    });

    it('should clear search results when input is cleared', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText('Analyze Repository')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search workflows/i);

      // Search
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.queryByText('Analyze Repository')).not.toBeInTheDocument();
      });

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Analyze Repository')).toBeInTheDocument();
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
        expect(screen.getByText('Data Pipeline')).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Selection', () => {
    it('should call onWorkflowSelect when workflow is clicked', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });

      const onWorkflowSelect = vi.fn();

      render(<WorkflowExplorer onWorkflowSelect={onWorkflowSelect} />);

      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });

      // Click workflow
      fireEvent.click(screen.getByText('Test Workflow'));

      expect(onWorkflowSelect).toHaveBeenCalledWith(mockWorkflows[1]);
    });

    it('should highlight selected workflow', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });

      const workflowItem = screen.getByText('Test Workflow').closest('li');

      // Click to select
      fireEvent.click(screen.getByText('Test Workflow'));

      await waitFor(() => {
        expect(workflowItem).toHaveClass('selected');
      });
    });
  });

  describe('New Workflow Action', () => {
    it('should call onNewWorkflow when new workflow button is clicked', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });

      const onNewWorkflow = vi.fn();

      render(<WorkflowExplorer onNewWorkflow={onNewWorkflow} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new workflow/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /new workflow/i }));

      expect(onNewWorkflow).toHaveBeenCalled();
    });
  });

  describe('Delete Workflow Action', () => {
    it('should show delete button on workflow hover/context', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });

      const workflowItem = screen.getByText('Test Workflow').closest('li');

      // Hover over workflow
      if (workflowItem) {
        fireEvent.mouseEnter(workflowItem);

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /delete workflow/i })).toBeInTheDocument();
        });
      }
    });

    it('should call onDeleteWorkflow when delete button is clicked', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });
      mockDelete.mockResolvedValue(true);

      const onDeleteWorkflow = vi.fn();

      render(<WorkflowExplorer onDeleteWorkflow={onDeleteWorkflow} />);

      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });

      const workflowItem = screen.getByText('Test Workflow').closest('li');

      // Hover to show delete button
      if (workflowItem) {
        fireEvent.mouseEnter(workflowItem);

        await waitFor(() => {
          const deleteButton = screen.getByRole('button', { name: /delete workflow/i });
          fireEvent.click(deleteButton);
        });

        // Confirm deletion in dialog
        await waitFor(() => {
          const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
          fireEvent.click(confirmButton);
        });

        await waitFor(() => {
          expect(onDeleteWorkflow).toHaveBeenCalledWith(mockWorkflows[1]);
        });
      }
    });
  });

  describe('Performance', () => {
    it('should load 100 workflows in less than 300ms', async () => {
      const manyWorkflows: WorkflowListItem[] = Array.from({ length: 100 }, (_, i) => ({
        fileName: `workflow-${i}.yaml`,
        filePath: `/path/to/workflow-${i}.yaml`,
        name: `Workflow ${i}`,
        version: '1.0.0',
        description: `Test workflow number ${i}`,
        fileSize: 1024,
        lastModified: new Date(),
        tags: ['test'],
      }));

      mockList.mockResolvedValue({ success: true, data: { workflows: manyWorkflows } });

      const startTime = performance.now();

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText('Workflow 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(300);
    });

    it('should update search results in less than 200ms', async () => {
      const manyWorkflows: WorkflowListItem[] = Array.from({ length: 100 }, (_, i) => ({
        fileName: `workflow-${i}.yaml`,
        filePath: `/path/to/workflow-${i}.yaml`,
        name: `Workflow ${i}`,
        version: '1.0.0',
        description: `Test workflow number ${i}`,
        fileSize: 1024,
        lastModified: new Date(),
        tags: ['test'],
      }));

      mockList.mockResolvedValue({ success: true, data: { workflows: manyWorkflows } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText('Workflow 0')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search workflows/i);

      const startTime = performance.now();

      fireEvent.change(searchInput, { target: { value: '50' } });

      await waitFor(() => {
        expect(screen.getByText('Workflow 50')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      expect(searchTime).toBeLessThan(200);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByRole('region', { name: /workflow explorer/i })).toBeInTheDocument();
        const searchbox = screen.getByRole('searchbox');
        expect(searchbox).toHaveAttribute('aria-label', 'Search workflows by name or description');
        expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Workflow list');
      });
    });

    it('should be keyboard navigable', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText('Analyze Repository')).toBeInTheDocument();
      });

      const firstWorkflow = screen.getByText('Analyze Repository').closest('button');

      if (firstWorkflow) {
        // Should be focusable
        firstWorkflow.focus();
        expect(document.activeElement).toBe(firstWorkflow);

        // Initially should not be pressed
        expect(firstWorkflow).toHaveAttribute('aria-pressed', 'false');

        // Click to select
        fireEvent.click(firstWorkflow);

        await waitFor(() => {
          expect(firstWorkflow).toHaveAttribute('aria-pressed', 'true');
        });
      }
    });
  });

  describe('Refresh Workflows', () => {
    it('should reload workflows when refresh is triggered', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: mockWorkflows } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(mockList).toHaveBeenCalledTimes(1);
      });

      // Trigger refresh (via prop callback or button)
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockList).toHaveBeenCalledTimes(2);
      });
    });
  });
});
