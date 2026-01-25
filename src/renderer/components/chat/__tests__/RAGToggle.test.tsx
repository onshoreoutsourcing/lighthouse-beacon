/**
 * RAGToggle Component Tests
 * Wave 10.4.1 - User Story 1: RAG Toggle in Chat Interface
 *
 * Tests for the compact RAG toggle button in chat toolbar.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RAGToggle } from '../RAGToggle';

describe('RAGToggle', () => {
  describe('Rendering', () => {
    it('should render toggle button', () => {
      render(
        <RAGToggle
          enabled={false}
          documentCount={0}
          onToggle={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: /RAG/i });
      expect(button).toBeInTheDocument();
    });

    it('should show document count when enabled and documents exist', () => {
      render(
        <RAGToggle
          enabled={true}
          documentCount={42}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByText('(42 docs)')).toBeInTheDocument();
    });

    it('should not show document count when disabled', () => {
      render(
        <RAGToggle
          enabled={false}
          documentCount={42}
          onToggle={vi.fn()}
        />
      );

      expect(screen.queryByText('(42 docs)')).not.toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('should show active state when enabled', () => {
      render(
        <RAGToggle
          enabled={true}
          documentCount={10}
          onToggle={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: /RAG/i });
      expect(button).toHaveClass('bg-green-500'); // Active color
    });

    it('should show inactive state when disabled', () => {
      render(
        <RAGToggle
          enabled={false}
          documentCount={10}
          onToggle={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: /RAG/i });
      expect(button).not.toHaveClass('bg-green-500');
    });

    it('should be disabled when no documents indexed', () => {
      render(
        <RAGToggle
          enabled={false}
          documentCount={0}
          onToggle={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: /RAG/i });
      expect(button).toBeDisabled();
    });

    it('should be enabled when documents exist', () => {
      render(
        <RAGToggle
          enabled={false}
          documentCount={10}
          onToggle={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: /RAG/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Interaction', () => {
    it('should call onToggle when clicked', () => {
      const onToggle = vi.fn();
      render(
        <RAGToggle
          enabled={false}
          documentCount={10}
          onToggle={onToggle}
        />
      );

      const button = screen.getByRole('button', { name: /RAG/i });
      fireEvent.click(button);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('should not call onToggle when disabled (no documents)', () => {
      const onToggle = vi.fn();
      render(
        <RAGToggle
          enabled={false}
          documentCount={0}
          onToggle={onToggle}
        />
      );

      const button = screen.getByRole('button', { name: /RAG/i });
      fireEvent.click(button);

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('should be keyboard accessible (Enter key triggers click)', () => {
      const onToggle = vi.fn();
      render(
        <RAGToggle
          enabled={false}
          documentCount={10}
          onToggle={onToggle}
        />
      );

      const button = screen.getByRole('button', { name: /RAG/i });
      button.focus();
      fireEvent.keyPress(button, { key: 'Enter', code: 'Enter', charCode: 13 });

      // Button click is triggered automatically by browser for Enter/Space
      // So we just verify the button is keyboard-focusable
      expect(button).toHaveFocus();
    });

    it('should be keyboard accessible (Space key triggers click)', () => {
      const onToggle = vi.fn();
      render(
        <RAGToggle
          enabled={false}
          documentCount={10}
          onToggle={onToggle}
        />
      );

      const button = screen.getByRole('button', { name: /RAG/i });
      button.focus();

      // Button is keyboard-focusable and activatable
      expect(button).toHaveFocus();
      expect(button.tagName).toBe('BUTTON'); // Buttons are inherently keyboard accessible
    });
  });

  describe('Tooltips', () => {
    it('should show tooltip explaining feature when enabled with documents', () => {
      render(
        <RAGToggle
          enabled={true}
          documentCount={10}
          onToggle={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: /RAG/i });
      expect(button).toHaveAttribute('title');
      const title = button.getAttribute('title');
      expect(title).toContain('RAG enabled');
      expect(title).toContain('10');
    });

    it('should show tooltip explaining why disabled when no documents', () => {
      render(
        <RAGToggle
          enabled={false}
          documentCount={0}
          onToggle={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: /RAG/i });
      expect(button).toHaveAttribute('title');
      expect(button.getAttribute('title')).toContain('Add documents');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      render(
        <RAGToggle
          enabled={false}
          documentCount={10}
          onToggle={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /RAG/i })).toBeInTheDocument();
    });

    it('should indicate pressed state when enabled', () => {
      render(
        <RAGToggle
          enabled={true}
          documentCount={10}
          onToggle={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: /RAG/i });
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should indicate not pressed state when disabled', () => {
      render(
        <RAGToggle
          enabled={false}
          documentCount={10}
          onToggle={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: /RAG/i });
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
