/**
 * ChatMessage Component Integration Tests - Source Citations
 * Wave 10.4.2 - User Story 3: Chat Message Integration
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatMessage from '../ChatMessage';
import type { ChatMessage as ChatMessageType } from '@renderer/stores/chat.store';
import type { SourceAttribution } from '@shared/types';

// Mock child components
vi.mock('../MarkdownContent', () => ({
  default: ({ content }: { content: string }) => <div>{content}</div>,
}));

vi.mock('../SourceCitations', () => ({
  SourceCitations: ({ sources }: { sources: SourceAttribution[] }) => (
    <div data-testid="source-citations" className="mt-3 border">
      {sources.length} sources
    </div>
  ),
}));

vi.mock('../RAGFailureWarning', () => ({
  RAGFailureWarning: ({ ragFailed }: { ragFailed: boolean }) =>
    ragFailed ? <div data-testid="rag-failure-warning">RAG Failed</div> : null,
}));

vi.mock('@renderer/hooks/useBufferedStream', () => ({
  useBufferedStream: (content: string) => content,
}));

describe('ChatMessage - Source Citations Integration', () => {
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
  ];

  const baseMessage: ChatMessageType = {
    id: 'msg-1',
    role: 'assistant',
    content: 'Here is the answer based on your codebase.',
    timestamp: new Date(),
    status: 'complete',
  };

  describe('RAG-Augmented Messages', () => {
    it('should render source citations for messages with sources', () => {
      const messageWithSources: ChatMessageType = {
        ...baseMessage,
        sources: mockSources,
      };

      render(<ChatMessage message={messageWithSources} />);

      expect(screen.getByTestId('source-citations')).toBeInTheDocument();
      expect(screen.getByText('2 sources')).toBeInTheDocument();
    });

    it('should render citations after message content', () => {
      const messageWithSources: ChatMessageType = {
        ...baseMessage,
        sources: mockSources,
      };

      const { container } = render(<ChatMessage message={messageWithSources} />);
      const content = screen.getByText('Here is the answer based on your codebase.');
      const citations = screen.getByTestId('source-citations');

      // Citations should come after content in DOM order
      expect(content.compareDocumentPosition(citations) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('should not render citations for user messages', () => {
      const userMessageWithSources: ChatMessageType = {
        ...baseMessage,
        role: 'user',
        sources: mockSources,
      };

      render(<ChatMessage message={userMessageWithSources} />);

      expect(screen.queryByTestId('source-citations')).not.toBeInTheDocument();
    });
  });

  describe('Non-RAG Messages', () => {
    it('should not render citations when sources array is empty', () => {
      const messageWithoutSources: ChatMessageType = {
        ...baseMessage,
        sources: [],
      };

      render(<ChatMessage message={messageWithoutSources} />);

      expect(screen.queryByTestId('source-citations')).not.toBeInTheDocument();
    });

    it('should not render citations when sources is undefined', () => {
      render(<ChatMessage message={baseMessage} />);

      expect(screen.queryByTestId('source-citations')).not.toBeInTheDocument();
    });

    it('should render identically to before when no RAG', () => {
      const { container: withoutRAG } = render(<ChatMessage message={baseMessage} />);

      // Should render normal message without any RAG UI elements
      expect(screen.getByText('Here is the answer based on your codebase.')).toBeInTheDocument();
      expect(screen.queryByTestId('source-citations')).not.toBeInTheDocument();
      expect(screen.queryByTestId('rag-failure-warning')).not.toBeInTheDocument();
    });
  });

  describe('RAG Failure Handling', () => {
    it('should render failure warning when ragFailed is true', () => {
      const failedMessage: ChatMessageType = {
        ...baseMessage,
        ragFailed: true,
      };

      render(<ChatMessage message={failedMessage} />);

      expect(screen.getByTestId('rag-failure-warning')).toBeInTheDocument();
    });

    it('should not render sources when RAG failed', () => {
      const failedMessage: ChatMessageType = {
        ...baseMessage,
        ragFailed: true,
        sources: undefined,
      };

      render(<ChatMessage message={failedMessage} />);

      expect(screen.queryByTestId('source-citations')).not.toBeInTheDocument();
      expect(screen.getByTestId('rag-failure-warning')).toBeInTheDocument();
    });

    it('should not render failure warning when ragFailed is false', () => {
      const successMessage: ChatMessageType = {
        ...baseMessage,
        ragFailed: false,
        sources: mockSources,
      };

      render(<ChatMessage message={successMessage} />);

      expect(screen.queryByTestId('rag-failure-warning')).not.toBeInTheDocument();
      expect(screen.getByTestId('source-citations')).toBeInTheDocument();
    });
  });

  describe('Streaming Messages', () => {
    it('should show citations after stream completes', () => {
      const completedMessage: ChatMessageType = {
        ...baseMessage,
        status: 'complete',
        sources: mockSources,
      };

      render(<ChatMessage message={completedMessage} />);

      expect(screen.getByTestId('source-citations')).toBeInTheDocument();
    });

    it('should not show citations while streaming', () => {
      const streamingMessage: ChatMessageType = {
        ...baseMessage,
        status: 'streaming',
        sources: mockSources,
      };

      render(<ChatMessage message={streamingMessage} />);

      // Citations should not be shown during streaming
      expect(screen.queryByTestId('source-citations')).not.toBeInTheDocument();
    });

    it('should show citations after streaming completes', () => {
      const streamingMessage: ChatMessageType = {
        ...baseMessage,
        status: 'streaming',
        sources: mockSources,
      };

      const { rerender } = render(<ChatMessage message={streamingMessage} />);
      expect(screen.queryByTestId('source-citations')).not.toBeInTheDocument();

      // Complete streaming
      const completeMessage: ChatMessageType = {
        ...streamingMessage,
        status: 'complete',
      };

      rerender(<ChatMessage message={completeMessage} />);
      expect(screen.getByTestId('source-citations')).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('should match existing chat styling', () => {
      const messageWithSources: ChatMessageType = {
        ...baseMessage,
        sources: mockSources,
      };

      const { container } = render(<ChatMessage message={messageWithSources} />);
      const messageDiv = container.querySelector('.bg-vscode-bg-secondary');

      expect(messageDiv).toBeInTheDocument();
      expect(messageDiv).toHaveClass('flex', 'gap-3', 'p-4');
    });

    it('should maintain visual separation between content and citations', () => {
      const messageWithSources: ChatMessageType = {
        ...baseMessage,
        sources: mockSources,
      };

      render(<ChatMessage message={messageWithSources} />);

      const citations = screen.getByTestId('source-citations');
      // SourceCitations component should exist and be separated visually
      expect(citations).toBeInTheDocument();
      // Check that it has border styling for separation
      expect(citations).toHaveClass('border');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sources array', () => {
      const message: ChatMessageType = {
        ...baseMessage,
        sources: [],
      };

      render(<ChatMessage message={message} />);
      expect(screen.queryByTestId('source-citations')).not.toBeInTheDocument();
    });

    it('should handle single source', () => {
      const message: ChatMessageType = {
        ...baseMessage,
        sources: [mockSources[0]],
      };

      render(<ChatMessage message={message} />);
      expect(screen.getByTestId('source-citations')).toBeInTheDocument();
      expect(screen.getByText('1 sources')).toBeInTheDocument();
    });

    it('should handle many sources (100+)', () => {
      const manySources = Array.from({ length: 100 }, (_, i) => ({
        filePath: `/project/file${i}.ts`,
        startLine: 1,
        endLine: 10,
        score: 0.5,
        snippet: `content ${i}`,
      }));

      const message: ChatMessageType = {
        ...baseMessage,
        sources: manySources,
      };

      render(<ChatMessage message={message} />);
      expect(screen.getByText('100 sources')).toBeInTheDocument();
    });

    it('should handle error messages with RAG failure', () => {
      const errorMessage: ChatMessageType = {
        ...baseMessage,
        status: 'error',
        error: 'AI service error',
        ragFailed: true,
      };

      render(<ChatMessage message={errorMessage} />);

      expect(screen.getByText(/Error: AI service error/i)).toBeInTheDocument();
      expect(screen.getByTestId('rag-failure-warning')).toBeInTheDocument();
    });
  });
});
