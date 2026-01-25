/**
 * DocumentItem Component Tests
 * Wave 10.2.1 - Knowledge Tab & Document List
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentItem } from '../DocumentItem';
import type { IndexedDocument } from '@renderer/stores/knowledge.store';

describe('DocumentItem', () => {
  const mockDocument: IndexedDocument = {
    id: 'doc-1',
    filePath: '/Users/test/project/src/file.ts',
    relativePath: 'project/src/file.ts',
    size: 2048,
    timestamp: Date.now() - 3600000, // 1 hour ago
    status: 'indexed',
  };

  const mockOnRemove = vi.fn();

  it('should render document information', () => {
    render(<DocumentItem document={mockDocument} onRemove={mockOnRemove} />);

    expect(screen.getByText('project/src/file.ts')).toBeInTheDocument();
    expect(screen.getByText(/2\s+KB/)).toBeInTheDocument();
    expect(screen.getByText(/hour ago/)).toBeInTheDocument();
  });

  it('should show indexed status with green checkmark', () => {
    render(<DocumentItem document={mockDocument} onRemove={mockOnRemove} />);

    const status = screen.getByRole('status');
    expect(status).toHaveAccessibleName('Status: indexed');
  });

  it('should show processing status with yellow spinner', () => {
    const processingDoc: IndexedDocument = {
      ...mockDocument,
      status: 'processing',
    };

    render(<DocumentItem document={processingDoc} onRemove={mockOnRemove} />);

    const status = screen.getByRole('status');
    expect(status).toHaveAccessibleName('Status: processing');
  });

  it('should show error status with red X and tooltip', async () => {
    const errorDoc: IndexedDocument = {
      ...mockDocument,
      status: 'error',
      errorMessage: 'Failed to generate embedding',
    };

    render(<DocumentItem document={errorDoc} onRemove={mockOnRemove} />);

    const status = screen.getByRole('status');
    expect(status).toHaveAccessibleName('Status: error');

    // Hover to show tooltip
    const user = userEvent.setup();
    await user.hover(status);

    expect(await screen.findByText('Failed to generate embedding')).toBeInTheDocument();
  });

  it('should show remove button on hover', async () => {
    render(<DocumentItem document={mockDocument} onRemove={mockOnRemove} />);

    const user = userEvent.setup();
    const item = screen.getByRole('listitem');

    // Button should exist but be hidden with opacity-0
    const removeButton = screen.getByRole('button', { name: /remove/i });
    expect(removeButton).toHaveClass('opacity-0');

    // Hover to show button
    await user.hover(item);

    // After hover, should have opacity-100
    expect(removeButton).toHaveClass('opacity-100');
  });

  it('should call onRemove when remove button clicked', async () => {
    render(<DocumentItem document={mockDocument} onRemove={mockOnRemove} />);

    const user = userEvent.setup();
    const item = screen.getByRole('listitem');

    await user.hover(item);
    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledWith('doc-1');
  });

  it('should be keyboard accessible', async () => {
    render(<DocumentItem document={mockDocument} onRemove={mockOnRemove} />);

    const user = userEvent.setup();
    const item = screen.getByRole('listitem');

    // Focus with keyboard
    await user.tab();
    expect(item).toHaveFocus();

    // Remove with Delete key
    await user.keyboard('{Delete}');
    expect(mockOnRemove).toHaveBeenCalledWith('doc-1');
  });

  it('should show full path on hover', async () => {
    render(<DocumentItem document={mockDocument} onRemove={mockOnRemove} />);

    const user = userEvent.setup();
    const pathElement = screen.getByText('project/src/file.ts');

    await user.hover(pathElement);

    expect(pathElement).toHaveAttribute('title', '/Users/test/project/src/file.ts');
  });
});
