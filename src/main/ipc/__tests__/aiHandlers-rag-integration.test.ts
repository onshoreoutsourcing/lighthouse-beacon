/**
 * AI Handlers RAG Integration Tests
 * Feature 10.3 - RAG Pipeline & Context Retrieval
 * Wave 10.3.3 - Prompt Augmentation & SOC Integration
 *
 * Tests RAG integration with AIService including prompt augmentation,
 * SOC logging, and graceful fallback.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/types';
import type { StreamOptions, RetrievedContext } from '@shared/types';
import { registerAIHandlers } from '../aiHandlers';

// Mock electron
const testPath = `/tmp/test-ai-handlers-rag-${Date.now()}`;
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn(() => testPath),
  },
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
  BrowserWindow: {
    getAllWindows: vi.fn(() => [
      {
        webContents: {
          send: vi.fn(),
        },
      },
    ]),
  },
}));

// Mock logger
vi.mock('../../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  setLogLevel: vi.fn(),
  getLogConfig: vi.fn(() => ({ level: 'info', maxFiles: 7, maxSize: 10485760 })),
}));

// Mock AIService
const mockSendMessage = vi.fn().mockResolvedValue('AI response');
const mockStreamMessage = vi.fn().mockResolvedValue(undefined);
vi.mock('../../services/AIService', () => ({
  AIService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    sendMessage: mockSendMessage,
    streamMessage: mockStreamMessage,
    cancelCurrentRequest: vi.fn(),
    getStatus: vi.fn(() => ({
      initialized: true,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
      error: null,
    })),
    shutdown: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock SettingsService
vi.mock('../../services/SettingsService', () => ({
  SettingsService: vi.fn().mockImplementation(() => ({
    getApiKey: vi.fn().mockResolvedValue('sk-ant-test-key'),
    getSettings: vi.fn().mockResolvedValue({
      ai: { model: 'claude-sonnet-4-5-20250929' },
      soc: { endpoint: 'https://soc.test.com' },
    }),
  })),
}));

// Mock VectorService
vi.mock('../../services/vector/VectorService', () => ({
  VectorService: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue([]),
  })),
}));

// Create mock context
const mockRetrieveContext = vi.fn().mockResolvedValue({
  chunks: [
    {
      id: 'chunk1',
      content: 'function test() { return 42; }',
      score: 0.9,
      filePath: '/test/file.ts',
      startLine: 1,
      endLine: 5,
      tokens: 50,
    },
  ],
  sources: [
    {
      filePath: '/test/file.ts',
      startLine: 1,
      endLine: 5,
      score: 0.9,
      snippet: 'function test() { return 42; }',
    },
  ],
  contextText: 'function test() { return 42; }',
  totalTokens: 50,
  budgetUsed: 50,
  budgetAvailable: 3950,
} as RetrievedContext);

// Mock RAGService
vi.mock('../../services/rag/RAGService', () => ({
  RAGService: vi.fn().mockImplementation(() => ({
    retrieveContext: mockRetrieveContext,
  })),
}));

// Mock file system
vi.mock('node:fs', () => ({
  default: {},
  promises: {
    stat: vi.fn().mockResolvedValue({ size: 1024 }),
  },
}));

// Mock disk space utility
vi.mock('../../utils/diskSpace', () => ({
  getAvailableDiskSpace: vi.fn().mockResolvedValue(1000000000),
}));

describe('AI Handlers RAG Integration', () => {
  let handlers: Map<string, (_event: unknown, ...args: unknown[]) => Promise<unknown>>;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock IPC handler storage
    handlers = new Map();

    // Mock ipcMain.handle to store handlers
    vi.mocked(ipcMain.handle).mockImplementation((channel: string, handler) => {
      handlers.set(channel, handler as (_event: unknown, ...args: unknown[]) => Promise<unknown>);
    });

    // Register handlers
    registerAIHandlers();

    // Initialize AI service
    const initHandler = handlers.get(IPC_CHANNELS.AI_INITIALIZE);
    await initHandler?.(null);
  });

  describe('AI_SEND_MESSAGE with RAG', () => {
    it('should augment prompt when useRAG is true', async () => {
      const sendHandler = handlers.get(IPC_CHANNELS.AI_SEND_MESSAGE);
      expect(sendHandler).toBeDefined();

      const options: StreamOptions = {
        useRAG: true,
        ragOptions: {
          topK: 5,
          minScore: 0.3,
        },
      };

      const result = await sendHandler?.(null, 'What is the test function?', options);

      expect(result).toHaveProperty('success', true);

      // Verify RAGService was called
      expect(mockRetrieveContext).toHaveBeenCalledWith('What is the test function?', {
        topK: 5,
        minScore: 0.3,
      });

      // Verify AIService received augmented prompt
      expect(mockSendMessage).toHaveBeenCalled();
      const callArgs = mockSendMessage.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('systemPrompt');
      // System prompt should contain context
      expect(callArgs[1].systemPrompt).toContain('Relevant Code Context');
      expect(callArgs[1].systemPrompt).toContain('function test() { return 42; }');
    });

    it('should use standard prompt when useRAG is false', async () => {
      const sendHandler = handlers.get(IPC_CHANNELS.AI_SEND_MESSAGE);

      const options: StreamOptions = {
        useRAG: false,
      };

      await sendHandler?.(null, 'Hello', options);

      // Verify RAGService was NOT called
      expect(mockRetrieveContext).not.toHaveBeenCalled();

      // Verify AIService was called without RAG augmentation
      expect(mockSendMessage).toHaveBeenCalled();
      const callArgs = mockSendMessage.mock.calls[0];
      // systemPrompt should be undefined (not augmented with RAG context)
      expect(callArgs[1].systemPrompt).toBeUndefined();
    });

    it('should use standard prompt when useRAG is undefined', async () => {
      const sendHandler = handlers.get(IPC_CHANNELS.AI_SEND_MESSAGE);

      await sendHandler?.(null, 'Hello');

      // Verify RAGService was NOT called
      expect(mockRetrieveContext).not.toHaveBeenCalled();
    });

    it('should fallback gracefully when RAG fails', async () => {
      const sendHandler = handlers.get(IPC_CHANNELS.AI_SEND_MESSAGE);

      // Make RAG retrieval fail
      mockRetrieveContext.mockRejectedValueOnce(new Error('RAG service error'));

      const options: StreamOptions = {
        useRAG: true,
      };

      const result = await sendHandler?.(null, 'Test query', options);

      // Should still succeed with standard prompt
      expect(result).toHaveProperty('success', true);

      // Verify AIService was still called (fallback)
      expect(mockSendMessage).toHaveBeenCalled();
    });

    it('should preserve custom system prompt when provided', async () => {
      const sendHandler = handlers.get(IPC_CHANNELS.AI_SEND_MESSAGE);

      const options: StreamOptions = {
        useRAG: true,
        systemPrompt: 'You are a code reviewer',
      };

      await sendHandler?.(null, 'Review this code', options);

      // Verify custom system prompt is included in augmented prompt
      expect(mockSendMessage).toHaveBeenCalled();
      const callArgs = mockSendMessage.mock.calls[0];
      expect(callArgs[1].systemPrompt).toContain('You are a code reviewer');
    });
  });

  describe('AI_STREAM_MESSAGE with RAG', () => {
    it('should augment prompt for streaming when useRAG is true', async () => {
      const streamHandler = handlers.get(IPC_CHANNELS.AI_STREAM_MESSAGE);
      expect(streamHandler).toBeDefined();

      const options: StreamOptions = {
        useRAG: true,
        ragOptions: {
          topK: 3,
        },
      };

      const result = await streamHandler?.(null, 'Explain the code', options);

      expect(result).toHaveProperty('success', true);

      // Verify RAGService was called
      expect(mockRetrieveContext).toHaveBeenCalledWith('Explain the code', {
        topK: 3,
      });

      // Verify AIService.streamMessage received augmented prompt
      expect(mockStreamMessage).toHaveBeenCalled();
      const callArgs = mockStreamMessage.mock.calls[0];
      expect(callArgs[2]).toHaveProperty('systemPrompt');
      expect(callArgs[2].systemPrompt).toContain('Relevant Code Context');
    });

    it('should use standard streaming when useRAG is false', async () => {
      const streamHandler = handlers.get(IPC_CHANNELS.AI_STREAM_MESSAGE);

      const options: StreamOptions = {
        useRAG: false,
      };

      await streamHandler?.(null, 'Hello', options);

      // Verify RAGService was NOT called
      expect(mockRetrieveContext).not.toHaveBeenCalled();

      // Verify streaming still works
      expect(mockStreamMessage).toHaveBeenCalled();
    });

    it('should fallback gracefully for streaming when RAG fails', async () => {
      const streamHandler = handlers.get(IPC_CHANNELS.AI_STREAM_MESSAGE);

      // Make RAG retrieval fail
      mockRetrieveContext.mockRejectedValueOnce(new Error('Timeout'));

      const options: StreamOptions = {
        useRAG: true,
      };

      const result = await streamHandler?.(null, 'Test', options);

      // Should still succeed with standard streaming
      expect(result).toHaveProperty('success', true);

      // Verify streaming still works (fallback)
      expect(mockStreamMessage).toHaveBeenCalled();
    });
  });

  describe('RAG empty results handling', () => {
    it('should handle empty context gracefully', async () => {
      const sendHandler = handlers.get(IPC_CHANNELS.AI_SEND_MESSAGE);

      // Return empty context
      mockRetrieveContext.mockResolvedValueOnce({
        chunks: [],
        sources: [],
        contextText: '',
        totalTokens: 0,
        budgetUsed: 0,
        budgetAvailable: 4000,
      });

      const options: StreamOptions = {
        useRAG: true,
      };

      const result = await sendHandler?.(null, 'Test query', options);

      // Should succeed
      expect(result).toHaveProperty('success', true);

      // Verify AIService was called (standard prompt since no context)
      expect(mockSendMessage).toHaveBeenCalled();
    });
  });
});
