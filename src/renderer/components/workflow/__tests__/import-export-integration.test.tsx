/**
 * Template Gallery Integration Tests
 *
 * Integration tests validating template gallery and template selection flow.
 * Wave 9.3.2: Import/Export & Workflow Templates
 *
 * Note: Import/Export Dialog integration is tested separately in ImportExportDialog.test.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TemplateGallery } from '../TemplateGallery';
import { TemplateDetailModal } from '../TemplateDetailModal';
import type { WorkflowTemplate } from '@shared/types/workflow.types';

describe('Template Gallery Integration Tests', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Template Selection Integration', () => {
    const mockTemplate: WorkflowTemplate = {
      id: 'test-template',
      name: 'Test Template',
      version: '1.0.0',
      description: 'Test template for integration',
      fullDescription: 'Full description of test template',
      tags: ['test'],
      complexity: 'Beginner',
      previewImage: '/test-preview.png',
      workflowPath: '/test/workflow.yaml',
      requiredInputs: ['input1', 'input2'],
      steps: 3,
    };

    it('should create new workflow from template selection', () => {
      const onSelectTemplate = vi.fn();

      render(<TemplateGallery templates={[mockTemplate]} onSelectTemplate={onSelectTemplate} />);

      // Click template card
      fireEvent.click(screen.getByText('Test Template'));

      expect(onSelectTemplate).toHaveBeenCalledWith(mockTemplate);
    });

    it('should show template details and allow using template', () => {
      const onUseTemplate = vi.fn();

      render(
        <TemplateDetailModal
          template={mockTemplate}
          isOpen={true}
          onClose={vi.fn()}
          onUseTemplate={onUseTemplate}
        />
      );

      // Verify template details are shown
      expect(screen.getByText('Test Template')).toBeInTheDocument();
      expect(screen.getByText('input1')).toBeInTheDocument();
      expect(screen.getByText('input2')).toBeInTheDocument();
      expect(screen.getByText(/3 steps/i)).toBeInTheDocument();

      // Click "Use This Template"
      fireEvent.click(screen.getByRole('button', { name: /use this template/i }));

      expect(onUseTemplate).toHaveBeenCalledWith(mockTemplate);
    });

    it('should complete full template selection flow', () => {
      const onSelectTemplate = vi.fn();
      const onUseTemplate = vi.fn();

      // Step 1: Select template from gallery
      const { unmount: unmountGallery } = render(
        <TemplateGallery templates={[mockTemplate]} onSelectTemplate={onSelectTemplate} />
      );

      fireEvent.click(screen.getByText('Test Template'));
      expect(onSelectTemplate).toHaveBeenCalledWith(mockTemplate);

      unmountGallery();

      // Step 2: View template details and use it
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

      // Step 3: Template would be loaded and create new workflow
      // (This would trigger workflow creation in parent component)
    });
  });
});
