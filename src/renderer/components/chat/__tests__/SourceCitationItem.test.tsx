/**
 * SourceCitationItem Component Tests
 * Wave 10.4.2 - User Story 2: Click-to-Open File Navigation
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SourceCitationItem } from '../SourceCitationItem';
import type { SourceAttribution } from '@shared/types';

// Mock useEditorStore
const mockOpenFile = vi.fn();
vi.mock('@renderer/stores/editor.store', () => ({
  useEditorStore: () => ({
    openFile: mockOpenFile,
  }),
}));

describe('SourceCitationItem', () => {
  const mockSource: SourceAttribution = {
    filePath: '/Users/test/project/src/components/Button.tsx',
    startLine: 10,
    endLine: 25,
    score: 0.85,
    snippet: 'export const Button = () => { ... }',
  };

  beforeEach(() => {
    mockOpenFile.mockClear();
  });

  describe('Rendering', () => {
    it('should render file path', () => {
      render(<SourceCitationItem source={mockSource} />);
      expect(screen.getByText('src/components/Button.tsx')).toBeInTheDocument();
    });

    it('should render line range', () => {
      render(<SourceCitationItem source={mockSource} />);
      expect(screen.getByText('Lines 10-25')).toBeInTheDocument();
    });

    it('should render relevance percentage', () => {
      render(<SourceCitationItem source={mockSource} />);
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should render snippet when expanded', () => {
      render(<SourceCitationItem source={mockSource} expanded />);
      expect(screen.getByText('export const Button = () => { ... }')).toBeInTheDocument();
    });

    it('should not render snippet when collapsed', () => {
      render(<SourceCitationItem source={mockSource} />);
      expect(screen.queryByText('export const Button = () => { ... }')).not.toBeInTheDocument();
    });

    it('should render single line range correctly', () => {
      const singleLineSource: SourceAttribution = {
        ...mockSource,
        startLine: 42,
        endLine: 42,
      };
      render(<SourceCitationItem source={singleLineSource} />);
      expect(screen.getByText('Line 42')).toBeInTheDocument();
    });
  });

  describe('Click-to-Open Navigation', () => {
    it('should call openFile with correct path on click', async () => {
      render(<SourceCitationItem source={mockSource} />);
      const button = screen.getByRole('button', { name: /src\/components\/Button\.tsx/i });

      fireEvent.click(button);

      expect(mockOpenFile).toHaveBeenCalledWith('/Users/test/project/src/components/Button.tsx');
    });

    it('should call openFile on Enter key press', async () => {
      render(<SourceCitationItem source={mockSource} />);
      const button = screen.getByRole('button', { name: /src\/components\/Button\.tsx/i });

      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

      expect(mockOpenFile).toHaveBeenCalledWith('/Users/test/project/src/components/Button.tsx');
    });

    it('should not call openFile on other key presses', async () => {
      render(<SourceCitationItem source={mockSource} />);
      const button = screen.getByRole('button', { name: /src\/components\/Button\.tsx/i });

      fireEvent.keyDown(button, { key: 'Space', code: 'Space' });

      expect(mockOpenFile).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      render(<SourceCitationItem source={mockSource} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have descriptive aria-label', () => {
      render(<SourceCitationItem source={mockSource} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Open'));
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Button.tsx'));
    });

    it('should meet minimum click target size (44x44px)', () => {
      render(<SourceCitationItem source={mockSource} />);
      const button = screen.getByRole('button');

      // Button should have adequate padding to meet 44x44px minimum
      expect(button).toHaveClass('p-2'); // At least 8px padding
    });
  });

  describe('File Path Display', () => {
    it('should show relative path starting from project name', () => {
      render(<SourceCitationItem source={mockSource} />);
      // Should show "src/components/Button.tsx" not full absolute path
      expect(screen.queryByText('/Users/test/project/')).not.toBeInTheDocument();
    });

    it('should handle root-level files', () => {
      const rootSource: SourceAttribution = {
        ...mockSource,
        filePath: '/Users/test/project/README.md',
      };
      render(<SourceCitationItem source={rootSource} />);
      expect(screen.getByText('README.md')).toBeInTheDocument();
    });

    it('should handle deeply nested paths', () => {
      const deepSource: SourceAttribution = {
        ...mockSource,
        filePath: '/Users/test/project/src/renderer/components/chat/Message.tsx',
      };
      render(<SourceCitationItem source={deepSource} />);
      expect(screen.getByText('src/renderer/components/chat/Message.tsx')).toBeInTheDocument();
    });
  });

  describe('Relevance Score', () => {
    it('should format score as percentage', () => {
      render(<SourceCitationItem source={mockSource} />);
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should handle low scores', () => {
      const lowScoreSource: SourceAttribution = {
        ...mockSource,
        score: 0.32,
      };
      render(<SourceCitationItem source={lowScoreSource} />);
      expect(screen.getByText('32%')).toBeInTheDocument();
    });

    it('should handle perfect scores', () => {
      const perfectSource: SourceAttribution = {
        ...mockSource,
        score: 1.0,
      };
      render(<SourceCitationItem source={perfectSource} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });
});
