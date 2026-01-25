import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import { useChatStore } from '@renderer/stores/chat.store';
import { useKnowledgeStore } from '@renderer/stores/knowledge.store';
import { useChatRAG } from '@renderer/hooks/useChatRAG';
import { RAGStatusIndicator } from './RAGStatusIndicator';

/**
 * MessageInput Component
 *
 * Provides text input for composing and sending chat messages.
 *
 * Features:
 * - Multi-line text area with auto-resize
 * - Send via Enter key (Shift+Enter for new line)
 * - Send button with disabled state
 * - Input validation (no empty messages)
 * - Cancel button during streaming
 */
const MessageInput: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    sendMessage,
    cancelStreaming,
    streamingMessageId,
    isInitialized,
    error,
    messages: _messages,
    attachSourcesToMessage,
    markMessageRAGFailed,
  } = useChatStore();

  // Wave 10.4.1 - RAG integration
  const { ragEnabled, documents } = useKnowledgeStore();
  const { isSearching, sendMessageWithRAG } = useChatRAG();
  const documentCount = documents.length;

  const isStreaming = !!streamingMessageId;
  const canSend = isInitialized && inputValue.trim().length > 0 && !isStreaming && !isSearching;

  /**
   * Auto-resize textarea based on content
   */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  /**
   * Handle send message
   * Wave 10.4.1 - Use RAG-augmented flow if enabled
   * Wave 10.4.2 - Attach retrieved sources to assistant message
   */
  const handleSend = async () => {
    if (!canSend) {
      return;
    }

    const message = inputValue.trim();
    setInputValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Use RAG-augmented flow if enabled
    if (ragEnabled && documentCount > 0) {
      try {
        // Send message and retrieve context
        const context = await sendMessageWithRAG(message, {
          ragEnabled: true,
          documentCount,
        });

        // Wait for assistant message to be created
        // The assistant message is the last message in the array after sendMessageWithRAG
        setTimeout(() => {
          const currentMessages = useChatStore.getState().messages;
          const assistantMessage = currentMessages[currentMessages.length - 1];

          if (assistantMessage && assistantMessage.role === 'assistant') {
            if (context && context.sources && context.sources.length > 0) {
              // Attach sources to assistant message
              attachSourcesToMessage(assistantMessage.id, context.sources);
            } else if (!context) {
              // RAG retrieval failed
              markMessageRAGFailed(assistantMessage.id);
            }
          }
        }, 100); // Small delay to ensure message is created
      } catch (err) {
        console.error('[MessageInput] RAG flow error:', err);
        // Standard flow fallback happens in useChatRAG
      }
    } else {
      // Standard message flow
      void sendMessage(message);
    }
  };

  /**
   * Handle key press in textarea
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without shift = send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Handle cancel streaming
   */
  const handleCancel = () => {
    void cancelStreaming();
  };

  return (
    <div className="border-t border-vscode-border bg-vscode-bg">
      {/* Wave 10.4.1 - RAG Status Indicator */}
      <RAGStatusIndicator isSearching={isSearching} />

      <div className="p-4">
        {/* Error Display */}
        {error && (
          <div className="mb-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
            {error}
          </div>
        )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isInitialized
                ? 'Type a message... (Enter to send, Shift+Enter for new line)'
                : 'Initializing AI service...'
            }
            disabled={!isInitialized || isStreaming}
            className="w-full resize-none bg-vscode-bg-secondary text-vscode-text text-sm border border-vscode-border rounded px-3 py-2 focus:outline-none focus:border-vscode-accent min-h-[40px] max-h-[200px] overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
          />
        </div>

        {/* Send/Cancel Button */}
        {isStreaming ? (
          <button
            onClick={handleCancel}
            className="flex-shrink-0 p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            title="Cancel streaming"
          >
            <Square className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex-shrink-0 p-2 bg-vscode-accent hover:bg-vscode-accent/80 text-vscode-bg rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-vscode-accent"
            title="Send message (Enter)"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>

        {/* Help Text */}
        <div className="mt-2 text-xs text-vscode-text-muted">
          {isSearching
            ? 'Retrieving context from knowledge base...'
            : isStreaming
              ? 'Generating response...'
              : isInitialized
                ? 'Press Enter to send, Shift+Enter for new line'
                : 'Please wait while AI service initializes'}
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
