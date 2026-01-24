/**
 * DocumentList Component Tests
 * Wave 10.2.1 - Knowledge Tab & Document List
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DocumentList } from '../DocumentList';
import type { IndexedDocument } from '@renderer/stores/knowledge.store';

describe('DocumentList', () => {
  const mockDocuments: IndexedDocument[] = [
    {
      id: 'doc-1',
      filePath: '/path/to/file1.txt',
      relativePath: 'path/to/file1.txt',
      size: 1024,
      timestamp: Date.now(),
      status: 'indexed',
    },
    {
      id: 'doc-2',
      filePath: '/path/to/file2.txt',
      relativePath: 'path/to/file2.txt',
      size: 2048,
      timestamp: Date.now(),
      status: 'indexed',
    },
  ];

  const mockOnRemove = vi.fn();

  it('should render all documents', () => {
    render(<DocumentList documents={mockDocuments} onRemove={mockOnRemove} />);

    expect(screen.getByText('path/to/file1.txt')).toBeInTheDocument();
    expect(screen.getByText('path/to/file2.txt')).toBeInTheDocument();
  });

  it('should show empty state when no documents', () => {
    render(<DocumentList documents={[]} onRemove={mockOnRemove} />);

    expect(screen.getByText('No documents indexed. Add files to get started.')).toBeInTheDocument();
  });

  it('should be scrollable', () => {
    render(<DocumentList documents={mockDocuments} onRemove={mockOnRemove} />);

    const list = screen.getByRole('list');
    expect(list).toHaveClass('overflow-y-auto');
  });

  it('should pass onRemove to DocumentItems', () => {
    const { container } = render(
      <DocumentList documents={mockDocuments} onRemove={mockOnRemove} />
    );

    // Verify DocumentItem components are rendered
    const items = container.querySelectorAll('[role="listitem"]');
    expect(items).toHaveLength(2);
  });

  it('should handle large document lists efficiently', () => {
    // Generate 1000 documents
    const manyDocuments: IndexedDocument[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `doc-${i}`,
      filePath: `/path/to/file${i}.txt`,
      relativePath: `file${i}.txt`,
      size: 1024,
      timestamp: Date.now(),
      status: 'indexed' as const,
    }));

    const { container } = render(
      <DocumentList documents={manyDocuments} onRemove={mockOnRemove} />
    );

    // Should render all items (CSS handles scrolling)
    const items = container.querySelectorAll('[role="listitem"]');
    expect(items.length).toBe(1000);
  });
});
