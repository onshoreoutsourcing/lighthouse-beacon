import React from 'react';
import ChatInterface from '@renderer/components/chat/ChatInterface';

/**
 * AIChatPanel Component
 *
 * Wrapper for the AI chat interface (right panel).
 * Uses ChatInterface component from Feature 2.2.
 */
const AIChatPanel: React.FC = () => {
  return <ChatInterface />;
};

export default AIChatPanel;
