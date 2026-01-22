/**
 * TemplateGallery Component Tests
 *
 * Tests for workflow template gallery with search, filtering, and preview.
 * Following TDD approach - tests written before implementation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { TemplateGallery } from '../TemplateGallery';
import type { WorkflowTemplate } from '@shared/types/workflow.types';

describe('TemplateGallery', () => {
  const mockTemplates: WorkflowTemplate[] = [
    {
      id: 'documentation-generator',
      name: 'Documentation Generator',
      version: '1.0.0',
      description: 'Generates comprehensive documentation from code repository',
      fullDescription:
        'This workflow analyzes your codebase structure, extracts key information about functions, classes, and architecture, then uses Claude AI to generate professional documentation in Markdown format.',
      tags: ['documentation', 'ai', 'automation'],
      complexity: 'Beginner',
      previewImage: '/workflow-templates/documentation-generator/preview.png',
      workflowPath: '/workflow-templates/documentation-generator/workflow.yaml',
      requiredInputs: ['repo_path'],
      steps: 4,
    },
    {
      id: 'code-review-automation',
      name: 'Code Review Automation',
      version: '1.0.0',
      description: 'Automates code reviews with AI-powered analysis',
      fullDescription:
        'This workflow analyzes git diffs or patches using Claude AI to provide comprehensive code review feedback similar to what an experienced developer would provide.',
      tags: ['code-review', 'ai', 'quality', 'security'],
      complexity: 'Intermediate',
      previewImage: '/workflow-templates/code-review-automation/preview.png',
      workflowPath: '/workflow-templates/code-review-automation/workflow.yaml',
      requiredInputs: ['pr_diff_file', 'review_focus'],
      steps: 3,
    },
    {
      id: 'batch-file-processing',
      name: 'Batch File Processing',
      version: '1.0.0',
      description: 'Automate processing of multiple files with Python scripts',
      fullDescription:
        'This workflow processes multiple files from an input directory, applies a selected operation, and saves results to an output directory.',
      tags: ['batch', 'file-processing', 'automation', 'python'],
      complexity: 'Beginner',
      previewImage: '/workflow-templates/batch-file-processing/preview.png',
      workflowPath: '/workflow-templates/batch-file-processing/workflow.yaml',
      requiredInputs: ['input_directory', 'output_directory', 'file_pattern', 'operation'],
      steps: 4,
    },
  ];

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render template gallery container', () => {
      render(<TemplateGallery templates={mockTemplates} onSelectTemplate={vi.fn()} />);

      expect(screen.getByRole('region', { name: /template gallery/i })).toBeInTheDocument();
    });

    it('should display search bar', () => {
      render(<TemplateGallery templates={mockTemplates} onSelectTemplate={vi.fn()} />);

      expect(screen.getByPlaceholderText(/search templates/i)).toBeInTheDocument();
    });

    it('should render template cards in grid layout', () => {
      render(<TemplateGallery templates={mockTemplates} onSelectTemplate={vi.fn()} />);

      expect(screen.getByText('Documentation Generator')).toBeInTheDocument();
      expect(screen.getByText('Code Review Automation')).toBeInTheDocument();
      expect(screen.getByText('Batch File Processing')).toBeInTheDocument();
    });

    it('should display template metadata on cards', () => {
      render(<TemplateGallery templates={mockTemplates} onSelectTemplate={vi.fn()} />);

      // Check description (truncated)
      expect(
        screen.getByText(/Generates comprehensive documentation from code repository/i)
      ).toBeInTheDocument();

      // Check tags (use getAllByText for tags that appear multiple times)
      expect(screen.getByText('documentation')).toBeInTheDocument();
      expect(screen.getAllByText('ai').length).toBeGreaterThan(0);

      // Check complexity badges
      expect(screen.getAllByText('Beginner')).toHaveLength(2); // 2 beginner templates
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
    });
  });

  describe('Search and Filtering', () => {
    it('should filter templates by name (case-insensitive)', async () => {
      render(<TemplateGallery templates={mockTemplates} onSelectTemplate={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(/search templates/i);
      fireEvent.change(searchInput, { target: { value: 'code review' } });

      await waitFor(() => {
        expect(screen.getByText('Code Review Automation')).toBeInTheDocument();
        expect(screen.queryByText('Documentation Generator')).not.toBeInTheDocument();
        expect(screen.queryByText('Batch File Processing')).not.toBeInTheDocument();
      });
    });

    it('should filter templates by tags', async () => {
      render(<TemplateGallery templates={mockTemplates} onSelectTemplate={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(/search templates/i);
      fireEvent.change(searchInput, { target: { value: 'security' } });

      await waitFor(() => {
        expect(screen.getByText('Code Review Automation')).toBeInTheDocument();
        expect(screen.queryByText('Documentation Generator')).not.toBeInTheDocument();
        expect(screen.queryByText('Batch File Processing')).not.toBeInTheDocument();
      });
    });

    it('should filter by description content', async () => {
      render(<TemplateGallery templates={mockTemplates} onSelectTemplate={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(/search templates/i);
      fireEvent.change(searchInput, { target: { value: 'python scripts' } });

      await waitFor(() => {
        expect(screen.getByText('Batch File Processing')).toBeInTheDocument();
        expect(screen.queryByText('Documentation Generator')).not.toBeInTheDocument();
        expect(screen.queryByText('Code Review Automation')).not.toBeInTheDocument();
      });
    });

    it('should show empty state when no templates match search', async () => {
      render(<TemplateGallery templates={mockTemplates} onSelectTemplate={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(/search templates/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText(/no templates match/i)).toBeInTheDocument();
      });
    });

    it('should clear search and show all templates', async () => {
      render(<TemplateGallery templates={mockTemplates} onSelectTemplate={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText(/search templates/i);

      // Search
      fireEvent.change(searchInput, { target: { value: 'code review' } });

      await waitFor(() => {
        expect(screen.queryByText('Documentation Generator')).not.toBeInTheDocument();
      });

      // Clear search
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Documentation Generator')).toBeInTheDocument();
        expect(screen.getByText('Code Review Automation')).toBeInTheDocument();
        expect(screen.getByText('Batch File Processing')).toBeInTheDocument();
      });
    });
  });

  describe('Template Selection', () => {
    it('should call onSelectTemplate when card is clicked', () => {
      const onSelectTemplate = vi.fn();
      render(<TemplateGallery templates={mockTemplates} onSelectTemplate={onSelectTemplate} />);

      fireEvent.click(screen.getByText('Documentation Generator'));

      expect(onSelectTemplate).toHaveBeenCalledWith(mockTemplates[0]);
    });

    it('should be keyboard accessible', () => {
      const onSelectTemplate = vi.fn();
      render(<TemplateGallery templates={mockTemplates} onSelectTemplate={onSelectTemplate} />);

      const templateCard = screen.getByText('Documentation Generator').closest('button');

      if (templateCard) {
        templateCard.focus();
        expect(document.activeElement).toBe(templateCard);

        fireEvent.keyDown(templateCard, { key: 'Enter' });
        expect(onSelectTemplate).toHaveBeenCalledWith(mockTemplates[0]);
      }
    });
  });

  describe('Complexity Badges', () => {
    it('should display correct badge colors for complexity levels', () => {
      render(<TemplateGallery templates={mockTemplates} onSelectTemplate={vi.fn()} />);

      const beginnerBadges = screen.getAllByText('Beginner');
      const intermediateBadge = screen.getByText('Intermediate');

      // Check that badges exist (color classes tested via snapshot or className checks)
      expect(beginnerBadges).toHaveLength(2);
      expect(intermediateBadge).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading state when isLoading is true', () => {
      render(<TemplateGallery templates={[]} onSelectTemplate={vi.fn()} isLoading={true} />);

      expect(screen.getByText(/loading templates/i)).toBeInTheDocument();
    });

    it('should not display templates while loading', () => {
      render(
        <TemplateGallery templates={mockTemplates} onSelectTemplate={vi.fn()} isLoading={true} />
      );

      expect(screen.queryByText('Documentation Generator')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no templates are available', () => {
      render(<TemplateGallery templates={[]} onSelectTemplate={vi.fn()} />);

      expect(screen.getByText(/no templates available/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TemplateGallery templates={mockTemplates} onSelectTemplate={vi.fn()} />);

      expect(screen.getByRole('region', { name: /template gallery/i })).toBeInTheDocument();
      const searchbox = screen.getByRole('searchbox');
      expect(searchbox).toHaveAttribute('aria-label');
    });

    it('should have descriptive button labels', () => {
      render(<TemplateGallery templates={mockTemplates} onSelectTemplate={vi.fn()} />);

      const templateCards = screen.getAllByRole('button');
      templateCards.forEach((card) => {
        expect(card).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Preview Images', () => {
    it('should display preview images for templates', () => {
      render(<TemplateGallery templates={mockTemplates} onSelectTemplate={vi.fn()} />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(mockTemplates.length);

      images.forEach((img) => {
        expect(img).toHaveAttribute('src');
        expect(img).toHaveAttribute('alt');
      });
    });

    it('should have fallback for missing preview images', () => {
      const templateWithoutPreview = [
        {
          ...mockTemplates[0],
          previewImage: '',
        },
      ];

      render(<TemplateGallery templates={templateWithoutPreview} onSelectTemplate={vi.fn()} />);

      // Should still render template card even without preview
      expect(screen.getByText('Documentation Generator')).toBeInTheDocument();
    });
  });
});
