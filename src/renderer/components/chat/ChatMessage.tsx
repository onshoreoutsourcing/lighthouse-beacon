import React from 'react';
import type { ChatMessage as ChatMessageType } from '@renderer/stores/chat.store';
import { User, Bot } from 'lucide-react';
import { useBufferedStream } from '@renderer/hooks/useBufferedStream';
import MarkdownContent from './MarkdownContent';
import { SourceCitations } from './SourceCitations';
import { RAGFailureWarning } from './RAGFailureWarning';

/**
 * ChatMessage Component Props
 */
interface ChatMessageProps {
  message: ChatMessageType;
}

/**
 * ChatMessage Component
 *
 * Displays a single chat message with role-specific styling.
 * Distinguishes between user and AI messages visually.
 *
 * Features:
 * - Role-based styling (user vs assistant)
 * - Timestamp display
 * - Status indicators (sending, streaming, complete, error)
 * - Error message display
 * - Buffered streaming with 50ms intervals for 60 FPS performance
 * - Visual streaming cursor
 * - Markdown rendering for AI messages (Wave 2.2.3)
 * - Syntax highlighting for code blocks
 * - Clickable file paths
 */
const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const isStreaming = message.status === 'streaming';

  // Use buffered streaming for performance (50ms intervals, 60 FPS)
  const displayContent = useBufferedStream(message.content, isStreaming);

  // Format timestamp
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div
      className={`flex gap-3 p-4 ${
        isUser ? 'bg-vscode-bg' : 'bg-vscode-bg-secondary'
      } ${isError ? 'border-l-2 border-red-500' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-vscode-accent' : 'bg-vscode-bg-tertiary'
        }`}
      >
        {isUser ? (
          <User className="w-5 h-5 text-vscode-bg" />
        ) : (
          <Bot className="w-5 h-5 text-vscode-accent" />
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-vscode-text">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-vscode-text-muted">{formatTime(message.timestamp)}</span>
          {isStreaming && (
            <span className="text-xs text-vscode-accent animate-pulse">Generating...</span>
          )}
        </div>

        {/* Content */}
        <div className="text-sm text-vscode-text">
          {isUser ? (
            /* User messages: plain text with line breaks */
            <div className="whitespace-pre-wrap break-words">{displayContent}</div>
          ) : (
            /* AI messages: markdown rendering with syntax highlighting */
            <>
              {displayContent ? (
                <MarkdownContent content={displayContent} />
              ) : (
                isStreaming && <div className="text-vscode-text-muted italic">Thinking...</div>
              )}
              {isStreaming && displayContent && (
                <span className="inline-block w-2 h-4 ml-1 bg-vscode-accent animate-pulse" />
              )}
            </>
          )}
        </div>

        {/* Error */}
        {isError && message.error && (
          <div className="mt-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
            Error: {message.error}
          </div>
        )}

        {/* RAG Failure Warning (Wave 10.4.2 - User Story 4) */}
        {!isUser && message.ragFailed && (
          <RAGFailureWarning ragFailed={message.ragFailed} />
        )}

        {/* Source Citations (Wave 10.4.2 - User Story 1 & 3) */}
        {!isUser && !isStreaming && message.sources && message.sources.length > 0 && (
          <SourceCitations sources={message.sources} />
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
