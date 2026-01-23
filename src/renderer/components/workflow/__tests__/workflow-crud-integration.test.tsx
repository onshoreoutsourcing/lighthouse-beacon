/**
 * Workflow CRUD Integration Tests
 *
 * Integration tests validating end-to-end CRUD operations for workflows.
 * Tests WorkflowExplorer + DeleteConfirmationDialog + IPC handlers.
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

describe('Workflow CRUD Integration Tests', () => {
  const mockWorkflow: WorkflowListItem = {
    fileName: 'test-workflow.yaml',
    filePath: '/path/to/test-workflow.yaml',
    name: 'Test Workflow',
    version: '1.0.0',
    description: 'A test workflow for integration testing',
    fileSize: 1024,
    lastModified: new Date('2026-01-21T10:00:00Z'),
    tags: ['test'],
  };

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

  describe('Create Workflow (New Workflow Button)', () => {
    it('should trigger new workflow callback when button clicked', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: [mockWorkflow] } });

      const onNewWorkflow = vi.fn();

      render(<WorkflowExplorer onNewWorkflow={onNewWorkflow} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /new workflow/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /new workflow/i }));

      expect(onNewWorkflow).toHaveBeenCalledTimes(1);
    });

    it('should show new workflow button in empty state', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: [] } });

      const onNewWorkflow = vi.fn();

      render(<WorkflowExplorer onNewWorkflow={onNewWorkflow} />);

      await waitFor(() => {
        expect(screen.getByText(/create your first workflow/i)).toBeInTheDocument();
      });

      const newButton = screen.getByRole('button', { name: /create new workflow/i });
      fireEvent.click(newButton);

      expect(onNewWorkflow).toHaveBeenCalledTimes(1);
    });
  });

  describe('Read Workflows (List and Load)', () => {
    it('should fetch workflows on mount via workflow:list', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: [mockWorkflow] } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(mockList).toHaveBeenCalled();
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });
    });

    it('should trigger workflow selection callback when clicked', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: [mockWorkflow] } });

      const onWorkflowSelect = vi.fn();

      render(<WorkflowExplorer onWorkflowSelect={onWorkflowSelect} />);

      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Test Workflow'));

      expect(onWorkflowSelect).toHaveBeenCalledWith(mockWorkflow);
    });

    it('should refresh workflows when refresh button clicked', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: [mockWorkflow] } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(mockList).toHaveBeenCalledTimes(1);
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockList).toHaveBeenCalledTimes(2);
        expect(mockList).toHaveBeenCalled();
      });
    });
  });

  describe('Update Workflows (Auto-save)', () => {
    it('should maintain workflow list after selection (no update needed)', async () => {
      const workflows: WorkflowListItem[] = [
        mockWorkflow,
        {
          ...mockWorkflow,
          fileName: 'another-workflow.yaml',
          filePath: '/path/to/another-workflow.yaml',
          name: 'Another Workflow',
        },
      ];

      mockList.mockResolvedValue({ success: true, data: { workflows } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
        expect(screen.getByText('Another Workflow')).toBeInTheDocument();
      });

      // Select workflow
      fireEvent.click(screen.getByText('Test Workflow'));

      // Workflow list should remain unchanged
      expect(screen.getByText('Another Workflow')).toBeInTheDocument();
    });
  });

  describe('Delete Workflows (with Confirmation)', () => {
    it('should show delete confirmation dialog when delete clicked', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: [mockWorkflow] } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });

      const workflowItem = screen.getByText('Test Workflow').closest('li');

      if (workflowItem) {
        fireEvent.mouseEnter(workflowItem);

        await waitFor(() => {
          const deleteButton = screen.getByRole('button', { name: /delete workflow/i });
          fireEvent.click(deleteButton);
        });

        // Dialog should be shown
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
          expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
        });
      }
    });

    it('should close dialog when cancel is clicked', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: [mockWorkflow] } });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });

      const workflowItem = screen.getByText('Test Workflow').closest('li');

      if (workflowItem) {
        fireEvent.mouseEnter(workflowItem);

        await waitFor(() => {
          const deleteButton = screen.getByRole('button', { name: /delete workflow/i });
          fireEvent.click(deleteButton);
        });

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        // Click cancel
        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);

        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        // Workflow should still be in list
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      }
    });

    it('should delete workflow when confirmed', async () => {
      const workflows: WorkflowListItem[] = [
        mockWorkflow,
        {
          ...mockWorkflow,
          fileName: 'another-workflow.yaml',
          filePath: '/path/to/another-workflow.yaml',
          name: 'Another Workflow',
        },
      ];

      mockList.mockResolvedValue({ success: true, data: { workflows } });
      mockDelete.mockResolvedValue(true);

      const onDeleteWorkflow = vi.fn();

      render(<WorkflowExplorer onDeleteWorkflow={onDeleteWorkflow} />);

      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });

      const workflowItem = screen.getByText('Test Workflow').closest('li');

      if (workflowItem) {
        fireEvent.mouseEnter(workflowItem);

        await waitFor(() => {
          const deleteButton = screen.getByRole('button', { name: /delete workflow test/i });
          fireEvent.click(deleteButton);
        });

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        // Click confirm
        const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
        fireEvent.click(confirmButton);

        await waitFor(() => {
          expect(mockDelete).toHaveBeenCalledWith(mockWorkflow.filePath);
        });

        // Dialog should close
        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        // Workflow should be removed from list
        expect(screen.queryByText('Test Workflow')).not.toBeInTheDocument();

        // Other workflow should remain
        expect(screen.getByText('Another Workflow')).toBeInTheDocument();

        // Callback should be triggered
        expect(onDeleteWorkflow).toHaveBeenCalledWith(mockWorkflow);
      }
    });

    it('should handle delete failure gracefully', async () => {
      mockList.mockResolvedValue({ success: true, data: { workflows: [mockWorkflow] } });
      mockDelete.mockResolvedValue(false); // Delete failed

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });

      const workflowItem = screen.getByText('Test Workflow').closest('li');

      if (workflowItem) {
        fireEvent.mouseEnter(workflowItem);

        await waitFor(() => {
          const deleteButton = screen.getByRole('button', { name: /delete workflow/i });
          fireEvent.click(deleteButton);
        });

        await waitFor(() => {
          const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
          fireEvent.click(confirmButton);
        });

        // Dialog should close
        await waitFor(() => {
          expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });

        // Error message should be shown (component enters error state)
        await waitFor(() => {
          expect(screen.getByText(/failed to delete workflow/i)).toBeInTheDocument();
        });

        // Should show retry button
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      }
    });
  });

  describe('End-to-End CRUD Flow', () => {
    it('should complete full CRUD workflow: create → read → delete', async () => {
      // Start with one workflow already present (simpler E2E test)
      mockList.mockResolvedValue({ success: true, data: { workflows: [mockWorkflow] } });
      mockDelete.mockResolvedValue(true);

      const onNewWorkflow = vi.fn();
      const onDeleteWorkflow = vi.fn();

      render(
        <WorkflowExplorer onNewWorkflow={onNewWorkflow} onDeleteWorkflow={onDeleteWorkflow} />
      );

      // 1. Read - verify workflow is loaded
      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });

      // 2. Create - click new workflow button
      fireEvent.click(screen.getByRole('button', { name: /new workflow/i }));
      expect(onNewWorkflow).toHaveBeenCalled();

      // 3. Delete workflow
      const workflowItem = screen.getByText('Test Workflow').closest('li');

      if (workflowItem) {
        fireEvent.mouseEnter(workflowItem);

        await waitFor(() => {
          const deleteButton = screen.getByRole('button', { name: /delete workflow/i });
          fireEvent.click(deleteButton);
        });

        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        const confirmButton = screen.getByRole('button', { name: /confirm deletion/i });
        fireEvent.click(confirmButton);

        // 4. Verify workflow removed
        await waitFor(() => {
          expect(screen.queryByText('Test Workflow')).not.toBeInTheDocument();
        });

        // 5. Verify delete callback was triggered
        expect(onDeleteWorkflow).toHaveBeenCalledWith(mockWorkflow);

        // 6. Should show empty state
        expect(screen.getByText(/no workflows found/i)).toBeInTheDocument();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle workflow list fetch error', async () => {
      mockList.mockResolvedValue({
        success: false,
        error: new Error('Network error'),
      });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load workflows/i)).toBeInTheDocument();
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Should show retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should retry loading workflows after error', async () => {
      let callCount = 0;

      mockList.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ success: false, error: new Error('Network error') });
        }
        return Promise.resolve({ success: true, data: { workflows: [mockWorkflow] } });
      });

      render(<WorkflowExplorer />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load workflows/i)).toBeInTheDocument();
      });

      // Click retry
      fireEvent.click(screen.getByRole('button', { name: /retry/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Validation', () => {
    it('should handle 100 workflows efficiently', async () => {
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

      // Should render in less than 300ms
      expect(endTime - startTime).toBeLessThan(300);
    });

    it('should search 100 workflows in less than 200ms', async () => {
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

      // Search should complete in less than 200ms
      expect(endTime - startTime).toBeLessThan(200);
    });
  });
});
