/**
 * SourceCitations Component Tests
 * Wave 10.4.2 - User Story 1: Source Citations Display
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SourceCitations } from '../SourceCitations';
import type { SourceAttribution } from '@shared/types';

// Mock child components
vi.mock('../SourceCitationItem', () => ({
  SourceCitationItem: ({ source }: { source: SourceAttribution }) => (
    <div data-testid={`citation-${source.filePath}`}>
      {source.filePath} ({source.score})
    </div>
  ),
}));

// Mock useEditorStore
vi.mock('@renderer/stores/editor.store', () => ({
  useEditorStore: () => ({
    openFile: vi.fn(),
  }),
}));

describe('SourceCitations', () => {
  const mockSources: SourceAttribution[] = [
    {
      filePath: '/project/src/components/Button.tsx',
      startLine: 10,
      endLine: 25,
      score: 0.85,
      snippet: 'export const Button = () => { ... }',
    },
    {
      filePath: '/project/src/utils/helpers.ts',
      startLine: 5,
      endLine: 15,
      score: 0.72,
      snippet: 'export function helper() { ... }',
    },
    {
      filePath: '/project/README.md',
      startLine: 1,
      endLine: 10,
      score: 0.65,
      snippet: '# Project Documentation',
    },
  ];

  describe('Rendering', () => {
    it('should not render when sources array is empty', () => {
      const { container } = render(<SourceCitations sources={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when sources is undefined', () => {
      const { container } = render(<SourceCitations sources={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render header with source count', () => {
      render(<SourceCitations sources={mockSources} />);
      expect(screen.getByText('3 sources')).toBeInTheDocument();
    });

    it('should render singular "source" for single item', () => {
      render(<SourceCitations sources={[mockSources[0]]} />);
      expect(screen.getByText('1 source')).toBeInTheDocument();
    });

    it('should render all citations when expanded', () => {
      render(<SourceCitations sources={mockSources} />);
      const header = screen.getByRole('button');

      // Expand to see citations
      fireEvent.click(header);

      expect(screen.getByTestId('citation-/project/src/components/Button.tsx')).toBeInTheDocument();
      expect(screen.getByTestId('citation-/project/src/utils/helpers.ts')).toBeInTheDocument();
      expect(screen.getByTestId('citation-/project/README.md')).toBeInTheDocument();
    });
  });

  describe('Collapsible Behavior', () => {
    it('should be collapsed by default', () => {
      render(<SourceCitations sources={mockSources} />);
      const citationList = screen.queryByRole('list');
      expect(citationList).not.toBeInTheDocument();
    });

    it('should expand when header is clicked', () => {
      render(<SourceCitations sources={mockSources} />);
      const header = screen.getByRole('button', { name: /3 sources/i });

      fireEvent.click(header);

      // Citations should now be visible
      const citations = screen.getAllByTestId(/citation-/);
      citations.forEach(citation => {
        expect(citation).toBeVisible();
      });
    });

    it('should collapse when clicked again', () => {
      render(<SourceCitations sources={mockSources} />);
      const header = screen.getByRole('button', { name: /3 sources/i });

      // Expand
      fireEvent.click(header);
      expect(screen.getAllByTestId(/citation-/)[0]).toBeVisible();

      // Collapse
      fireEvent.click(header);
      const citationList = screen.queryByRole('list');
      expect(citationList).not.toBeInTheDocument();
    });

    it('should show chevron down when collapsed', () => {
      render(<SourceCitations sources={mockSources} />);
      expect(screen.getByLabelText('Expand sources')).toBeInTheDocument();
    });

    it('should show chevron up when expanded', () => {
      render(<SourceCitations sources={mockSources} />);
      const header = screen.getByRole('button');

      fireEvent.click(header);

      expect(screen.getByLabelText('Collapse sources')).toBeInTheDocument();
    });
  });

  describe('Source Ordering', () => {
    it('should order sources by relevance (highest first)', () => {
      render(<SourceCitations sources={mockSources} />);
      const header = screen.getByRole('button');
      fireEvent.click(header);

      const citations = screen.getAllByTestId(/citation-/);

      // Should be ordered: Button (0.85), helpers (0.72), README (0.65)
      expect(citations[0]).toHaveTextContent('Button.tsx');
      expect(citations[1]).toHaveTextContent('helpers.ts');
      expect(citations[2]).toHaveTextContent('README.md');
    });

    it('should maintain order when toggling collapse', () => {
      render(<SourceCitations sources={mockSources} />);
      const header = screen.getByRole('button');

      // Expand
      fireEvent.click(header);
      const firstExpand = screen.getAllByTestId(/citation-/);
      expect(firstExpand[0]).toHaveTextContent('Button.tsx');

      // Collapse and re-expand
      fireEvent.click(header);
      fireEvent.click(header);
      const secondExpand = screen.getAllByTestId(/citation-/);
      expect(secondExpand[0]).toHaveTextContent('Button.tsx');
    });
  });

  describe('Accessibility', () => {
    it('should have button role for header', () => {
      render(<SourceCitations sources={mockSources} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have aria-expanded attribute', () => {
      render(<SourceCitations sources={mockSources} />);
      const header = screen.getByRole('button');

      expect(header).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(header);

      expect(header).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have aria-label describing functionality', () => {
      render(<SourceCitations sources={mockSources} />);
      const header = screen.getByRole('button');
      expect(header).toHaveAttribute('aria-label', expect.stringContaining('sources'));
    });

    it('should support keyboard navigation (Enter/Space)', () => {
      render(<SourceCitations sources={mockSources} />);
      const header = screen.getByRole('button');

      fireEvent.keyDown(header, { key: 'Enter' });
      expect(header).toHaveAttribute('aria-expanded', 'true');

      fireEvent.keyDown(header, { key: ' ' });
      expect(header).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Visual Design', () => {
    it('should have VS Code aesthetic styling', () => {
      render(<SourceCitations sources={mockSources} />);
      const container = screen.getByRole('button').parentElement;

      // Should use VS Code theme classes
      expect(container).toHaveClass('border-vscode-border');
    });

    it('should have clear visual separation from message content', () => {
      render(<SourceCitations sources={mockSources} />);
      const container = screen.getByRole('button').parentElement;

      expect(container).toHaveClass('mt-3'); // Margin top for separation
    });
  });

  describe('Edge Cases', () => {
    it('should handle null sources gracefully', () => {
      const { container } = render(<SourceCitations sources={null as any} />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle very long file paths', () => {
      const longPathSource: SourceAttribution = {
        filePath: '/very/long/path/to/deeply/nested/folder/structure/component.tsx',
        startLine: 1,
        endLine: 1,
        score: 0.5,
        snippet: 'test',
      };

      render(<SourceCitations sources={[longPathSource]} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle many sources (100+)', () => {
      const manySources = Array.from({ length: 100 }, (_, i) => ({
        filePath: `/project/file${i}.ts`,
        startLine: 1,
        endLine: 10,
        score: 0.5 + (i / 200), // Varying scores
        snippet: `content ${i}`,
      }));

      render(<SourceCitations sources={manySources} />);
      expect(screen.getByText('100 sources')).toBeInTheDocument();
    });
  });
});
