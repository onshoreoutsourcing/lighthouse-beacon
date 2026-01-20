/**
 * ConversationStorage Service
 *
 * Manages persistent storage of conversations to local file system.
 * Uses JSON files stored in Electron userData directory.
 *
 * Features:
 * - Save conversations to individual JSON files
 * - Load conversation by ID
 * - List all conversations with metadata
 * - Delete conversations
 * - Atomic writes (temp file then rename) to prevent corruption
 * - Auto-generate conversation titles from first user message
 */

import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Conversation, ConversationListItem } from '@shared/types';

/**
 * Get the conversations storage directory path
 */
const getConversationsDir = (): string => {
  return path.join(app.getPath('userData'), 'conversations');
};

/**
 * Ensure conversations directory exists
 */
const ensureConversationsDir = async (): Promise<void> => {
  const dir = getConversationsDir();
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

/**
 * Get file path for conversation by ID
 */
const getConversationPath = (conversationId: string): string => {
  return path.join(getConversationsDir(), `${conversationId}.json`);
};

/**
 * Generate conversation title from first user message
 * Max 50 characters, truncated with ellipsis
 */
const generateTitle = (conversation: Conversation): string => {
  const firstUserMessage = conversation.messages.find((msg) => msg.role === 'user');

  if (!firstUserMessage) {
    return 'New Conversation';
  }

  const content = firstUserMessage.content.trim();
  const maxLength = 50;

  if (content.length <= maxLength) {
    return content;
  }

  return content.substring(0, maxLength - 3) + '...';
};

/**
 * Save conversation to storage
 * Uses atomic write pattern: write to temp file, then rename
 *
 * @param conversation - Conversation to save
 * @returns Saved conversation with updated metadata
 */
export const saveConversation = async (conversation: Conversation): Promise<Conversation> => {
  await ensureConversationsDir();

  // Auto-generate title if not set or is default
  if (!conversation.title || conversation.title === 'New Conversation') {
    conversation.title = generateTitle(conversation);
  }

  // Update lastModified timestamp
  conversation.lastModified = new Date();

  const filePath = getConversationPath(conversation.id);
  const tempPath = `${filePath}.tmp`;

  try {
    // Serialize conversation to JSON with proper Date handling
    const json = JSON.stringify(
      conversation,
      (_key, value: unknown) => {
        // Convert Date objects to ISO strings
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      },
      2
    );

    // Write to temp file
    await fs.writeFile(tempPath, json, 'utf-8');

    // Atomic rename
    await fs.rename(tempPath, filePath);

    return conversation;
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }

    throw new Error(
      `Failed to save conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Load conversation by ID
 *
 * @param conversationId - ID of conversation to load
 * @returns Loaded conversation
 * @throws Error if conversation not found or corrupted
 */
export const loadConversation = async (conversationId: string): Promise<Conversation> => {
  const filePath = getConversationPath(conversationId);

  try {
    const json = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(json) as {
      id: string;
      title: string;
      provider: string;
      model: string;
      messages: Array<{
        id: string;
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
        status: 'sending' | 'streaming' | 'complete' | 'error';
        error?: string;
      }>;
      createdAt: string;
      lastModified: string;
    };

    // Parse Date strings back to Date objects
    const conversation: Conversation = {
      id: data.id,
      title: data.title,
      provider: data.provider,
      model: data.model,
      createdAt: new Date(data.createdAt),
      lastModified: new Date(data.lastModified),
      messages: data.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        status: msg.status,
        error: msg.error,
      })),
    };

    return conversation;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Conversation not found: ${conversationId}`);
    }

    throw new Error(
      `Failed to load conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * List all conversations with metadata
 * Returns conversations sorted by lastModified (newest first)
 *
 * @returns Array of conversation list items
 */
export const listConversations = async (): Promise<ConversationListItem[]> => {
  await ensureConversationsDir();

  try {
    const files = await fs.readdir(getConversationsDir());
    const conversationFiles = files.filter(
      (file) => file.endsWith('.json') && !file.endsWith('.tmp')
    );

    const conversations: ConversationListItem[] = [];

    for (const file of conversationFiles) {
      try {
        const filePath = path.join(getConversationsDir(), file);
        const json = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(json) as {
          id: string;
          title: string;
          provider: string;
          model: string;
          messages: unknown[];
          createdAt: string;
          lastModified: string;
        };

        conversations.push({
          id: data.id,
          title: data.title,
          provider: data.provider,
          model: data.model,
          messageCount: data.messages.length,
          createdAt: new Date(data.createdAt),
          lastModified: new Date(data.lastModified),
        });
      } catch (error) {
        // Skip corrupted files
        console.error(`Failed to read conversation file ${file}:`, error);
      }
    }

    // Sort by lastModified (newest first)
    conversations.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

    return conversations;
  } catch (error) {
    throw new Error(
      `Failed to list conversations: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Delete conversation by ID
 *
 * @param conversationId - ID of conversation to delete
 */
export const deleteConversation = async (conversationId: string): Promise<void> => {
  const filePath = getConversationPath(conversationId);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Already deleted, no-op
      return;
    }

    throw new Error(
      `Failed to delete conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
