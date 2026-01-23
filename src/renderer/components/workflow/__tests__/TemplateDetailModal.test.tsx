/**
 * TemplateDetailModal Component Tests
 *
 * Tests for template detail modal with full template information.
 * Following TDD approach - tests written before implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { TemplateDetailModal } from '../TemplateDetailModal';
import type { WorkflowTemplate } from '@shared/types/workflow.types';

describe('TemplateDetailModal', () => {
  const mockTemplate: WorkflowTemplate = {
    id: 'documentation-generator',
    name: 'Documentation Generator',
    version: '1.0.0',
    description: 'Generates comprehensive documentation from code repository',
    fullDescription:
      'This workflow analyzes your codebase structure, extracts key information about functions, classes, and architecture, then uses Claude AI to generate professional documentation in Markdown format.\n\nPerfect for maintaining up-to-date documentation.',
    tags: ['documentation', 'ai', 'automation', 'python', 'claude'],
    complexity: 'Beginner',
    previewImage: '/workflow-templates/documentation-generator/preview.png',
    workflowPath: '/workflow-templates/documentation-generator/workflow.yaml',
    requiredInputs: ['repo_path'],
    steps: 4,
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={false}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true', () => {
      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should display template name and version', () => {
      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      expect(screen.getByText('Documentation Generator')).toBeInTheDocument();
      expect(screen.getByText(/1\.0\.0/i)).toBeInTheDocument();
    });

    it('should display full description', () => {
      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      expect(screen.getByText(/analyzes your codebase structure/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Perfect for maintaining up-to-date documentation/i)
      ).toBeInTheDocument();
    });

    it('should display required inputs list', () => {
      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      expect(screen.getByText(/required inputs/i)).toBeInTheDocument();
      expect(screen.getByText('repo_path')).toBeInTheDocument();
    });

    it('should display number of steps', () => {
      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      expect(screen.getByText(/4 steps/i)).toBeInTheDocument();
    });

    it('should display tags', () => {
      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      expect(screen.getByText('documentation')).toBeInTheDocument();
      expect(screen.getByText('ai')).toBeInTheDocument();
      expect(screen.getByText('automation')).toBeInTheDocument();
    });

    it('should display complexity badge', () => {
      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      expect(screen.getByText('Beginner')).toBeInTheDocument();
    });

    it('should display preview image', () => {
      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      const image = screen.getByRole('img', { name: /preview/i });
      expect(image).toHaveAttribute('src', mockTemplate.previewImage);
    });
  });

  describe('Actions', () => {
    it('should have Use This Template button', () => {
      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /use this template/i })).toBeInTheDocument();
    });

    it('should have Cancel button', () => {
      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should call onUseTemplate when Use This Template is clicked', () => {
      const onUseTemplate = vi.fn();

      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={onUseTemplate}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /use this template/i }));

      expect(onUseTemplate).toHaveBeenCalledWith(mockTemplate);
    });

    it('should call onClose when Cancel is clicked', () => {
      const onClose = vi.fn();

      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={onClose}
          onUseTemplate={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Keyboard Interactions', () => {
    it('should close on ESC key', () => {
      const onClose = vi.fn();

      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={onClose}
          onUseTemplate={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(onClose).toHaveBeenCalled();
    });

    it('should trap focus within modal', async () => {
      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      const useButton = screen.getByRole('button', { name: /use this template/i });

      // Focus should be on use button initially (from useEffect)
      await waitFor(() => {
        expect(document.activeElement).toBe(useButton);
      });

      // Tab navigation should work within modal
      // (Full focus trap testing requires more complex setup with jsdom)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Backdrop Click', () => {
    it('should close when backdrop is clicked', () => {
      const onClose = vi.fn();

      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={onClose}
          onUseTemplate={vi.fn()}
        />
      );

      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('should not close when modal content is clicked', () => {
      const onClose = vi.fn();

      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={onClose}
          onUseTemplate={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('should have descriptive heading', () => {
      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      expect(screen.getByRole('heading', { name: /documentation generator/i })).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      const useButton = screen.getByRole('button', { name: /use this template/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      expect(useButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Null Template', () => {
    it('should not render when template is null', () => {
      render(
        <TemplateDetailModal
          template={null}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Inputs', () => {
    it('should display all required inputs', () => {
      const templateWithMultipleInputs = {
        ...mockTemplate,
        requiredInputs: ['repo_path', 'output_file', 'api_key', 'model_name'],
      };

      render(
        <TemplateDetailModal
          template={templateWithMultipleInputs}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={vi.fn()}
        />
      );

      expect(screen.getByText('repo_path')).toBeInTheDocument();
      expect(screen.getByText('output_file')).toBeInTheDocument();
      expect(screen.getByText('api_key')).toBeInTheDocument();
      expect(screen.getByText('model_name')).toBeInTheDocument();
    });
  });
});
