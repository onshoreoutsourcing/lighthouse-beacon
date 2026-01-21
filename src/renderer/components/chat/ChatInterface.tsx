import React, { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@renderer/stores/chat.store';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import { MessageSquare, Trash2, ArrowDown, Plus, Settings } from 'lucide-react';
import { useSmartScroll } from '@renderer/hooks/useSmartScroll';
import SettingsModal from '../modals/SettingsModal';

/**
 * ChatInterface Component
 *
 * Main chat interface that displays message history and input field.
 * Replaces the placeholder AIChatPanel from Epic 1.
 *
 * Features:
 * - Scrollable message list
 * - Intelligent auto-scroll during streaming (Wave 2.2.2)
 * - Scroll-to-bottom button when user scrolls up
 * - Empty state when no messages
 * - Clear conversation button
 * - Integration with ChatStore
 * - AI initialization on mount
 * - 60 FPS scrolling performance
 */
const ChatInterface: React.FC = () => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { messages, initializeAI, clearMessages, newConversation, isInitializing, isInitialized } =
    useChatStore();

  // Smart scroll behavior (Wave 2.2.2)
  const { showScrollButton, scrollToBottom } = useSmartScroll(messagesContainerRef, [messages]);

  /**
   * Initialize AI service on component mount
   */
  useEffect(() => {
    void initializeAI();
  }, [initializeAI]);

  /**
   * Handle new conversation (Wave 2.2.4)
   */
  const handleNewConversation = () => {
    if (messages.length > 0) {
      if (window.confirm('Start a new conversation? Current conversation will be saved.')) {
        newConversation();
      }
    } else {
      newConversation();
    }
  };

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

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1 hover:bg-vscode-bg-secondary rounded transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-vscode-text-muted hover:text-vscode-text" />
          </button>

          {/* New Conversation Button (Wave 2.2.4) */}
          <button
            onClick={handleNewConversation}
            className="p-1 hover:bg-vscode-bg-secondary rounded transition-colors"
            title="New conversation"
          >
            <Plus className="w-4 h-4 text-vscode-text-muted hover:text-vscode-text" />
          </button>

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
      </div>

      {/* Messages Container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto relative">
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
          <div role="log" aria-live="polite" aria-label="Chat conversation">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}

        {/* Scroll to Bottom Button (Wave 2.2.2) */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 p-2 bg-vscode-accent hover:bg-vscode-accent/80 text-vscode-bg rounded-full shadow-lg transition-all"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Message Input */}
      <MessageInput />

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default ChatInterface;
