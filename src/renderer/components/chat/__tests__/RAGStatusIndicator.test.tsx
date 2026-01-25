/**
 * RAGStatusIndicator Component Tests
 * Wave 10.4.1 - User Story 3: RAG Status Indicator
 *
 * Tests for the "Searching knowledge base..." status indicator.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RAGStatusIndicator } from '../RAGStatusIndicator';

describe('RAGStatusIndicator', () => {
  describe('Visibility', () => {
    it('should be visible when isSearching is true', () => {
      render(<RAGStatusIndicator isSearching={true} />);

      expect(screen.getByText(/Searching knowledge base/i)).toBeInTheDocument();
    });

    it('should not be visible when isSearching is false', () => {
      render(<RAGStatusIndicator isSearching={false} />);

      expect(screen.queryByText(/Searching knowledge base/i)).not.toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should show searching message', () => {
      render(<RAGStatusIndicator isSearching={true} />);

      expect(screen.getByText('Searching knowledge base...')).toBeInTheDocument();
    });

    it('should display spinner icon', () => {
      render(<RAGStatusIndicator isSearching={true} />);

      const spinner = screen.getByTestId('rag-spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });
  });

  describe('Positioning', () => {
    it('should be positioned near message input area', () => {
      const { container } = render(<RAGStatusIndicator isSearching={true} />);

      const indicator = container.querySelector('.rag-status-indicator');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be announced to screen readers (live region)', () => {
      render(<RAGStatusIndicator isSearching={true} />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible label', () => {
      render(<RAGStatusIndicator isSearching={true} />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-label', 'RAG search status');
    });
  });

  describe('Styling', () => {
    it('should use subtle VS Code theme colors', () => {
      const { container } = render(<RAGStatusIndicator isSearching={true} />);

      const indicator = container.querySelector('.rag-status-indicator');
      expect(indicator).toHaveClass('text-vscode-text-muted');
    });

    it('should have proper spacing', () => {
      const { container } = render(<RAGStatusIndicator isSearching={true} />);

      const indicator = container.querySelector('.rag-status-indicator');
      expect(indicator).toHaveClass('px-4');
      expect(indicator).toHaveClass('py-2');
    });
  });
});
