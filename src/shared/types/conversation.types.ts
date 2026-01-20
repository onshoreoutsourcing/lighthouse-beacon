/**
 * Conversation Type Definitions
 * Types for conversation persistence and management
 */

/**
 * Message in a conversation
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status: 'sending' | 'streaming' | 'complete' | 'error';
  error?: string;
}

/**
 * Conversation metadata and messages
 */
export interface Conversation {
  id: string;
  title: string;
  provider: string;
  model: string;
  messages: ConversationMessage[];
  createdAt: Date;
  lastModified: Date;
}

/**
 * Conversation list item (minimal data for lists)
 */
export interface ConversationListItem {
  id: string;
  title: string;
  provider: string;
  model: string;
  messageCount: number;
  createdAt: Date;
  lastModified: Date;
}
