/**
 * Conversation IPC Handlers
 *
 * Handles IPC communication for conversation persistence operations.
 * Exposes conversation storage operations to renderer process.
 *
 * Handlers:
 * - conversation:save - Save conversation to storage
 * - conversation:load - Load conversation by ID
 * - conversation:list - List all conversations
 * - conversation:delete - Delete conversation by ID
 */

import { ipcMain } from 'electron';
import { CONVERSATION_CHANNELS } from '@shared/types';
import type { Conversation, ConversationListItem, Result } from '@shared/types';
import {
  saveConversation,
  loadConversation,
  listConversations,
  deleteConversation,
} from '../services/ConversationStorage';

/**
 * Register all conversation IPC handlers
 */
export const registerConversationHandlers = (): void => {
  /**
   * Save conversation
   * Handler: conversation:save
   */
  ipcMain.handle(
    CONVERSATION_CHANNELS.CONVERSATION_SAVE,
    async (_event, conversation: Conversation): Promise<Result<Conversation>> => {
      try {
        // Validate conversation object
        if (!conversation || !conversation.id) {
          return {
            success: false,
            error: new Error('Invalid conversation: missing required fields'),
          };
        }

        const savedConversation = await saveConversation(conversation);

        return {
          success: true,
          data: savedConversation,
        };
      } catch (error) {
        console.error('Failed to save conversation:', error);
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to save conversation'),
        };
      }
    }
  );

  /**
   * Load conversation by ID
   * Handler: conversation:load
   */
  ipcMain.handle(
    CONVERSATION_CHANNELS.CONVERSATION_LOAD,
    async (_event, conversationId: string): Promise<Result<Conversation>> => {
      try {
        // Validate conversation ID
        if (!conversationId || typeof conversationId !== 'string') {
          return {
            success: false,
            error: new Error('Invalid conversation ID'),
          };
        }

        const conversation = await loadConversation(conversationId);

        return {
          success: true,
          data: conversation,
        };
      } catch (error) {
        console.error('Failed to load conversation:', error);
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to load conversation'),
        };
      }
    }
  );

  /**
   * List all conversations
   * Handler: conversation:list
   */
  ipcMain.handle(
    CONVERSATION_CHANNELS.CONVERSATION_LIST,
    async (): Promise<Result<ConversationListItem[]>> => {
      try {
        const conversations = await listConversations();

        return {
          success: true,
          data: conversations,
        };
      } catch (error) {
        console.error('Failed to list conversations:', error);
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to list conversations'),
        };
      }
    }
  );

  /**
   * Delete conversation by ID
   * Handler: conversation:delete
   */
  ipcMain.handle(
    CONVERSATION_CHANNELS.CONVERSATION_DELETE,
    async (_event, conversationId: string): Promise<Result<void>> => {
      try {
        // Validate conversation ID
        if (!conversationId || typeof conversationId !== 'string') {
          return {
            success: false,
            error: new Error('Invalid conversation ID'),
          };
        }

        await deleteConversation(conversationId);

        return {
          success: true,
          data: undefined,
        };
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to delete conversation'),
        };
      }
    }
  );
};

/**
 * Unregister all conversation IPC handlers
 */
export const unregisterConversationHandlers = (): void => {
  ipcMain.removeHandler(CONVERSATION_CHANNELS.CONVERSATION_SAVE);
  ipcMain.removeHandler(CONVERSATION_CHANNELS.CONVERSATION_LOAD);
  ipcMain.removeHandler(CONVERSATION_CHANNELS.CONVERSATION_LIST);
  ipcMain.removeHandler(CONVERSATION_CHANNELS.CONVERSATION_DELETE);
};
