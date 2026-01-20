import React, { useEffect, useRef } from 'react';
import { useChatStore } from '@renderer/stores/chat.store';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import { MessageSquare, Trash2 } from 'lucide-react';

/**
 * ChatInterface Component
 *
 * Main chat interface that displays message history and input field.
 * Replaces the placeholder AIChatPanel from Epic 1.
 *
 * Features:
 * - Scrollable message list
 * - Auto-scroll to bottom on new messages
 * - Empty state when no messages
 * - Clear conversation button
 * - Integration with ChatStore
 * - AI initialization on mount
 */
const ChatInterface: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { messages, initializeAI, clearMessages, isInitializing, isInitialized } = useChatStore();

  /**
   * Initialize AI service on component mount
   */
  useEffect(() => {
    void initializeAI();
  }, [initializeAI]);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /**
   * Handle clear conversation
   */
  const handleClearMessages = () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      clearMessages();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-vscode-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-vscode-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-vscode-text">
            AI Chat
          </h2>
          {isInitializing && (
            <span className="text-xs text-vscode-text-muted animate-pulse">Initializing...</span>
          )}
          {isInitialized && <span className="text-xs text-green-500">Ready</span>}
        </div>

        {/* Clear Button */}
        {messages.length > 0 && (
          <button
            onClick={handleClearMessages}
            className="p-1 hover:bg-vscode-bg-secondary rounded transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4 text-vscode-text-muted hover:text-vscode-text" />
          </button>
        )}
      </div>

      {/* Messages Container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-vscode-accent opacity-70" />
              <p className="text-sm text-vscode-accent font-medium mb-2">Start a conversation</p>
              <p className="text-xs text-vscode-text-muted max-w-xs">
                Ask questions about your code, get help with debugging, or discuss implementation
                ideas with AI.
              </p>
            </div>
          </div>
        ) : (
          /* Message List */
          <div>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <MessageInput />
    </div>
  );
};

export default ChatInterface;
