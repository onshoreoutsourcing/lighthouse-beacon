/**
 * KnowledgeTab Component Tests
 * Wave 10.2.1 - Knowledge Tab & Document List
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KnowledgeTab } from '../KnowledgeTab';
import { useKnowledgeStore } from '@renderer/stores/knowledge.store';
import type { Result, DocumentInput } from '@shared/types';

// Mock the store
vi.mock('@renderer/stores/knowledge.store');

// Mock electronAPI
const mockElectronAPI = {
  vector: {
    list: vi.fn<[], Promise<Result<DocumentInput[]>>>(),
    remove: vi.fn<[string], Promise<Result<void>>>(),
  },
};

beforeEach(() => {
  window.electronAPI = mockElectronAPI as unknown as typeof window.electronAPI;
  vi.clearAllMocks();
});

describe('KnowledgeTab', () => {
  // Default mock functions that return resolved promises
  const createDefaultMocks = () => ({
    fetchDocuments: vi.fn().mockResolvedValue(undefined),
    removeDocument: vi.fn().mockResolvedValue(undefined),
    refreshMemoryStatus: vi.fn().mockResolvedValue(undefined),
    startIndexing: vi.fn().mockResolvedValue(undefined),
    updateIndexingProgress: vi.fn(),
    clearIndexingProgress: vi.fn(),
    clearError: vi.fn(),
    reset: vi.fn(),
  });

  it('should render header with title', () => {
    vi.mocked(useKnowledgeStore).mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      memoryStatus: null,
      indexingProgress: null,
      ...createDefaultMocks(),
    });

    render(<KnowledgeTab />);

    expect(screen.getByText('Knowledge Base')).toBeInTheDocument();
  });

  it('should fetch documents on mount', () => {
    const mockFetch = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useKnowledgeStore).mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      memoryStatus: null,
      indexingProgress: null,
      ...createDefaultMocks(),
      fetchDocuments: mockFetch,
    });

    render(<KnowledgeTab />);

    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('should show loading indicator while fetching', () => {
    vi.mocked(useKnowledgeStore).mockReturnValue({
      documents: [],
      isLoading: true,
      error: null,
      memoryStatus: null,
      indexingProgress: null,
      ...createDefaultMocks(),
    });

    render(<KnowledgeTab />);

    expect(screen.getByText('Loading documents...')).toBeInTheDocument();
  });

  it('should show error message when fetch fails', () => {
    const mockClearError = vi.fn();

    vi.mocked(useKnowledgeStore).mockReturnValue({
      documents: [],
      isLoading: false,
      error: 'Failed to load documents',
      memoryStatus: null,
      indexingProgress: null,
      fetchDocuments: vi.fn(),
      removeDocument: vi.fn(),
      refreshMemoryStatus: vi.fn(),
      startIndexing: vi.fn(),
      updateIndexingProgress: vi.fn(),
      clearIndexingProgress: vi.fn(),
      clearError: mockClearError,
      reset: vi.fn(),
    });

    render(<KnowledgeTab />);

    expect(screen.getByText('Failed to load documents')).toBeInTheDocument();

    // Should be dismissible
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    expect(dismissButton).toBeInTheDocument();
  });

  it('should clear error when dismiss clicked', async () => {
    const mockClearError = vi.fn();
    const user = userEvent.setup();

    vi.mocked(useKnowledgeStore).mockReturnValue({
      documents: [],
      isLoading: false,
      error: 'Test error',
      memoryStatus: null,
      indexingProgress: null,
      fetchDocuments: vi.fn(),
      removeDocument: vi.fn(),
      refreshMemoryStatus: vi.fn(),
      startIndexing: vi.fn(),
      updateIndexingProgress: vi.fn(),
      clearIndexingProgress: vi.fn(),
      clearError: mockClearError,
      reset: vi.fn(),
    });

    render(<KnowledgeTab />);

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissButton);

    expect(mockClearError).toHaveBeenCalledOnce();
  });

  it('should show document count in header', () => {
    vi.mocked(useKnowledgeStore).mockReturnValue({
      documents: [
        {
          id: 'doc-1',
          filePath: '/path/to/file.txt',
          relativePath: 'file.txt',
          size: 1024,
          timestamp: Date.now(),
          status: 'indexed',
        },
        {
          id: 'doc-2',
          filePath: '/path/to/file2.txt',
          relativePath: 'file2.txt',
          size: 2048,
          timestamp: Date.now(),
          status: 'indexed',
        },
      ],
      isLoading: false,
      error: null,
      memoryStatus: null,
      indexingProgress: null,
      ...createDefaultMocks(),
    });

    render(<KnowledgeTab />);

    expect(screen.getByText('2 documents')).toBeInTheDocument();
  });

  it('should show refresh button', async () => {
    const mockFetch = vi.fn().mockResolvedValue(undefined);
    const mockRefreshMemory = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    vi.mocked(useKnowledgeStore).mockReturnValue({
      documents: [],
      isLoading: false,
      error: null,
      memoryStatus: null,
      indexingProgress: null,
      ...createDefaultMocks(),
      fetchDocuments: mockFetch,
      refreshMemoryStatus: mockRefreshMemory,
    });

    render(<KnowledgeTab />);

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    await user.click(refreshButton);

    // Should call fetch twice: once on mount, once on click
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // Should also call refreshMemoryStatus twice
    expect(mockRefreshMemory).toHaveBeenCalledTimes(2);
  });

  it('should show confirmation dialog when removing document', async () => {
    const user = userEvent.setup();

    vi.mocked(useKnowledgeStore).mockReturnValue({
      documents: [
        {
          id: 'doc-1',
          filePath: '/path/to/file.txt',
          relativePath: 'file.txt',
          size: 1024,
          timestamp: Date.now(),
          status: 'indexed',
        },
      ],
      isLoading: false,
      error: null,
      memoryStatus: null,
      indexingProgress: null,
      ...createDefaultMocks(),
    });

    render(<KnowledgeTab />);

    // Hover to show remove button
    const item = screen.getByRole('listitem');
    await user.hover(item);

    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });
});
