/**
 * ImportExportDialog Component Tests
 *
 * Tests for workflow import/export modal dialog component.
 * Follows TDD approach with comprehensive test coverage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportExportDialog } from '../ImportExportDialog';
import type { Workflow } from '@shared/types';

// Mock window.electronAPI
const mockElectronAPI = {
  workflow: {
    import: vi.fn(),
    export: vi.fn(),
  },
  fileSystem: {
    selectFile: vi.fn(),
    showSaveDialog: vi.fn(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  (window as any).electronAPI = mockElectronAPI;
});

describe('ImportExportDialog', () => {
  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <ImportExportDialog
          isOpen={false}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render modal when isOpen is true', () => {
      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Import/Export Workflow')).toBeInTheDocument();
    });

    it('should render Import and Export tabs', () => {
      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
        />
      );

      expect(screen.getByRole('tab', { name: /import/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /export/i })).toBeInTheDocument();
    });

    it('should show Import tab by default', () => {
      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
        />
      );

      expect(screen.getByRole('tab', { name: /import/i })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Select a YAML workflow file to import')).toBeInTheDocument();
    });

    it('should switch to Export tab when clicked', () => {
      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
          workflow={{
            workflow: { name: 'Test', version: '1.0.0', description: 'Test' },
            inputs: [],
            steps: [],
          }}
        />
      );

      const exportTab = screen.getByRole('tab', { name: /export/i });
      fireEvent.click(exportTab);

      expect(exportTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Export workflow to YAML file')).toBeInTheDocument();
    });
  });

  describe('Import Tab', () => {
    it('should render file picker button', () => {
      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: /select file/i })).toBeInTheDocument();
    });

    it('should open file picker when Select File clicked', async () => {
      mockElectronAPI.fileSystem.selectFile.mockResolvedValue({
        success: true,
        data: {
          filePath: '/test/workflow.yaml',
          cancelled: false,
        },
      });

      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
        />
      );

      const selectButton = screen.getByRole('button', { name: /select file/i });
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(mockElectronAPI.fileSystem.selectFile).toHaveBeenCalled();
      });
    });

    it('should display selected file path', async () => {
      mockElectronAPI.fileSystem.selectFile.mockResolvedValue({
        success: true,
        data: {
          filePath: '/test/workflow.yaml',
          cancelled: false,
        },
      });

      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /select file/i }));

      await waitFor(() => {
        expect(screen.getByText('/test/workflow.yaml')).toBeInTheDocument();
      });
    });

    it('should import workflow when Import button clicked', async () => {
      const mockWorkflow: Workflow = {
        workflow: { name: 'Imported', version: '1.0.0', description: 'Test import' },
        inputs: [],
        steps: [],
      };

      mockElectronAPI.fileSystem.selectFile.mockResolvedValue({
        success: true,
        data: {
          filePath: '/test/workflow.yaml',
          cancelled: false,
        },
      });

      mockElectronAPI.workflow.import.mockResolvedValue({
        success: true,
        data: { workflow: mockWorkflow },
      });

      const onImportSuccess = vi.fn();

      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={onImportSuccess}
          onExportSuccess={() => {}}
        />
      );

      // Select file
      fireEvent.click(screen.getByRole('button', { name: /select file/i }));
      await waitFor(() => {
        expect(screen.getByText('/test/workflow.yaml')).toBeInTheDocument();
      });

      // Click import
      fireEvent.click(screen.getByRole('button', { name: /import workflow/i }));

      await waitFor(() => {
        expect(mockElectronAPI.workflow.import).toHaveBeenCalledWith('/test/workflow.yaml');
        expect(onImportSuccess).toHaveBeenCalledWith(mockWorkflow);
      });
    });

    it('should display validation errors with line numbers', async () => {
      mockElectronAPI.fileSystem.selectFile.mockResolvedValue({
        success: true,
        data: {
          filePath: '/test/invalid.yaml',
          cancelled: false,
        },
      });

      mockElectronAPI.workflow.import.mockResolvedValue({
        success: false,
        error: {
          field: 'steps',
          message: 'Missing required field "type"',
          severity: 'error',
          line: 15,
          suggestion: 'Add type field to step definition',
        },
      });

      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
        />
      );

      // Select file
      fireEvent.click(screen.getByRole('button', { name: /select file/i }));
      await waitFor(() => {
        expect(screen.getByText('/test/invalid.yaml')).toBeInTheDocument();
      });

      // Click import
      fireEvent.click(screen.getByRole('button', { name: /import workflow/i }));

      await waitFor(() => {
        expect(screen.getByText(/line 15/i)).toBeInTheDocument();
        expect(screen.getByText(/missing required field "type"/i)).toBeInTheDocument();
        expect(screen.getByText(/add type field to step definition/i)).toBeInTheDocument();
      });
    });

    it('should disable import button when no file selected', () => {
      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
        />
      );

      const importButton = screen.getByRole('button', { name: /import workflow/i });
      expect(importButton).toBeDisabled();
    });
  });

  describe('Export Tab', () => {
    const mockWorkflow: Workflow = {
      workflow: { name: 'Export Test', version: '1.0.0', description: 'Test export' },
      inputs: [],
      steps: [],
    };

    it('should render file name input', () => {
      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
          workflow={mockWorkflow}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /export/i }));

      expect(screen.getByLabelText(/file name/i)).toBeInTheDocument();
    });

    it('should pre-fill file name with workflow name', () => {
      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
          workflow={mockWorkflow}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /export/i }));

      const input = screen.getByLabelText<HTMLInputElement>(/file name/i);
      expect(input.value).toBe('export-test.yaml');
    });

    it('should render Choose Location button', () => {
      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
          workflow={mockWorkflow}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /export/i }));

      expect(screen.getByRole('button', { name: /choose location/i })).toBeInTheDocument();
    });

    it('should open save dialog when Choose Location clicked', async () => {
      mockElectronAPI.fileSystem.showSaveDialog.mockResolvedValue({
        success: true,
        data: {
          filePath: '/export/test.yaml',
          cancelled: false,
        },
      });

      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
          workflow={mockWorkflow}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /export/i }));
      fireEvent.click(screen.getByRole('button', { name: /choose location/i }));

      await waitFor(() => {
        expect(mockElectronAPI.fileSystem.showSaveDialog).toHaveBeenCalled();
      });
    });

    it('should export workflow when Export button clicked', async () => {
      mockElectronAPI.fileSystem.showSaveDialog.mockResolvedValue({
        success: true,
        data: {
          filePath: '/export/test.yaml',
          cancelled: false,
        },
      });

      mockElectronAPI.workflow.export.mockResolvedValue({
        success: true,
        data: { filePath: '/export/test.yaml' },
      });

      const onExportSuccess = vi.fn();

      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={onExportSuccess}
          workflow={mockWorkflow}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /export/i }));

      // Choose location
      fireEvent.click(screen.getByRole('button', { name: /choose location/i }));
      await waitFor(() => {
        expect(screen.getByText('/export/test.yaml')).toBeInTheDocument();
      });

      // Click export
      fireEvent.click(screen.getByRole('button', { name: /export workflow/i }));

      await waitFor(() => {
        expect(mockElectronAPI.workflow.export).toHaveBeenCalledWith(
          mockWorkflow,
          '/export/test.yaml'
        );
        expect(onExportSuccess).toHaveBeenCalledWith('/export/test.yaml');
      });
    });

    it('should show error when no workflow provided', () => {
      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /export/i }));

      expect(screen.getByText(/no workflow to export/i)).toBeInTheDocument();
    });

    it('should disable export button when no location selected', () => {
      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
          workflow={mockWorkflow}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /export/i }));

      const exportButton = screen.getByRole('button', { name: /export workflow/i });
      expect(exportButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should trap focus within dialog', () => {
      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should close on Escape key', () => {
      const onClose = vi.fn();

      render(
        <ImportExportDialog
          isOpen={true}
          onClose={onClose}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
        />
      );

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });

    it('should close on backdrop click', () => {
      const onClose = vi.fn();

      render(
        <ImportExportDialog
          isOpen={true}
          onClose={onClose}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
        />
      );

      const backdrop = screen.getByRole('presentation');
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalled();
    });

    it('should have proper ARIA labels', () => {
      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
        />
      );

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator during import', async () => {
      mockElectronAPI.fileSystem.selectFile.mockResolvedValue({
        success: true,
        data: {
          filePath: '/test/workflow.yaml',
          cancelled: false,
        },
      });

      mockElectronAPI.workflow.import.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /select file/i }));
      await waitFor(() => {
        expect(screen.getByText('/test/workflow.yaml')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /import workflow/i }));

      expect(screen.getByText(/importing/i)).toBeInTheDocument();
    });

    it('should show loading indicator during export', async () => {
      const mockWorkflow: Workflow = {
        workflow: { name: 'Test', version: '1.0.0', description: 'Test' },
        inputs: [],
        steps: [],
      };

      mockElectronAPI.fileSystem.showSaveDialog.mockResolvedValue({
        success: true,
        data: {
          filePath: '/export/test.yaml',
          cancelled: false,
        },
      });

      mockElectronAPI.workflow.export.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <ImportExportDialog
          isOpen={true}
          onClose={() => {}}
          onImportSuccess={() => {}}
          onExportSuccess={() => {}}
          workflow={mockWorkflow}
        />
      );

      fireEvent.click(screen.getByRole('tab', { name: /export/i }));
      fireEvent.click(screen.getByRole('button', { name: /choose location/i }));

      await waitFor(() => {
        expect(screen.getByText('/export/test.yaml')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /export workflow/i }));

      expect(screen.getByText(/exporting/i)).toBeInTheDocument();
    });
  });
});
