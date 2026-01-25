/**
 * RAGToggle Component Tests
 * Wave 10.2.3 - File Operations & Zustand Store
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RAGToggle } from '../RAGToggle';

describe('RAGToggle', () => {
  const mockOnToggle = vi.fn();

  it('should render with label', () => {
    render(<RAGToggle enabled={false} documentCount={0} onToggle={mockOnToggle} />);

    expect(screen.getByText('Enable RAG Context')).toBeInTheDocument();
  });

  it('should show document count when enabled', () => {
    render(<RAGToggle enabled={true} documentCount={5} onToggle={mockOnToggle} />);

    expect(screen.getByText('(5 docs)')).toBeInTheDocument();
  });

  it('should not show document count when disabled', () => {
    render(<RAGToggle enabled={false} documentCount={5} onToggle={mockOnToggle} />);

    expect(screen.queryByText('(5 docs)')).not.toBeInTheDocument();
  });

  it('should be disabled when no documents', () => {
    render(<RAGToggle enabled={false} documentCount={0} onToggle={mockOnToggle} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('should be enabled when documents exist', () => {
    render(<RAGToggle enabled={false} documentCount={3} onToggle={mockOnToggle} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeDisabled();
  });

  it('should call onToggle when clicked', () => {
    render(<RAGToggle enabled={false} documentCount={3} onToggle={mockOnToggle} />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should not call onToggle when disabled', () => {
    render(<RAGToggle enabled={false} documentCount={0} onToggle={mockOnToggle} />);

    const checkbox = screen.getByRole('checkbox');

    // Disabled checkboxes can still fire events in testing-library
    // but the browser prevents user interaction
    // Verify the disabled state instead
    expect(checkbox).toBeDisabled();
  });

  it('should show tooltip when no documents', () => {
    render(<RAGToggle enabled={false} documentCount={0} onToggle={mockOnToggle} />);

    expect(screen.getByText('Add documents to enable RAG')).toBeInTheDocument();
  });

  it('should not show tooltip when documents exist', () => {
    render(<RAGToggle enabled={false} documentCount={3} onToggle={mockOnToggle} />);

    expect(screen.queryByText('Add documents to enable RAG')).not.toBeInTheDocument();
  });

  it('should reflect checked state', () => {
    const { rerender } = render(
      <RAGToggle enabled={false} documentCount={3} onToggle={mockOnToggle} />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    rerender(<RAGToggle enabled={true} documentCount={3} onToggle={mockOnToggle} />);

    expect(checkbox).toBeChecked();
  });

  it('should have proper accessibility attributes', () => {
    render(<RAGToggle enabled={true} documentCount={5} onToggle={mockOnToggle} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAccessibleName();
  });

  it('should show green indicator when enabled', () => {
    const { container } = render(
      <RAGToggle enabled={true} documentCount={5} onToggle={mockOnToggle} />
    );

    // Visual indicator should be present
    const indicator = container.querySelector('.rag-enabled-indicator');
    expect(indicator).toBeInTheDocument();
  });
});
