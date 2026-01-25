/**
 * Execution History Store
 *
 * Manages workflow execution history with localStorage persistence.
 * Stores the 5 most recent executions per workflow.
 *
 * Features:
 * - Execution history tracking
 * - Automatic pruning (keeps 5 most recent per workflow)
 * - localStorage persistence
 * - Fast queries (<200ms even with 50+ entries)
 * - Filter by workflow ID
 *
 * Storage Schema:
 * {
 *   "workflow-1": [
 *     { id: "exec-1", timestamp: 1234567890, ... },
 *     { id: "exec-2", timestamp: 1234567900, ... }
 *   ],
 *   "workflow-2": [...]
 * }
 */

import { create } from 'zustand';

const STORAGE_KEY = 'workflow-execution-history';
const MAX_ENTRIES_PER_WORKFLOW = 5;

/**
 * Step execution result details
 */
export interface StepExecutionResult {
  /** Step ID */
  stepId: string;
  /** Step execution status */
  status: 'success' | 'failed' | 'skipped';
  /** Step execution duration in milliseconds */
  duration: number;
  /** Error message if step failed */
  error?: string;
}

/**
 * Execution history entry
 */
export interface ExecutionHistoryEntry {
  /** Unique execution ID */
  id: string;
  /** Workflow ID */
  workflowId: string;
  /** Workflow name at time of execution */
  workflowName: string;
  /** Execution start timestamp (Unix milliseconds) */
  timestamp: number;
  /** Total execution duration in milliseconds */
  duration: number;
  /** Overall execution status */
  status: 'success' | 'failed' | 'cancelled';
  /** Workflow input parameters */
  inputs: Record<string, unknown>;
  /** Workflow output results */
  outputs: Record<string, unknown>;
  /** Error message if execution failed */
  error?: string;
  /** Individual step execution results */
  stepResults: StepExecutionResult[];
}

/**
 * Internal storage format: workflow ID -> array of entries
 */
type HistoryStorage = Record<string, ExecutionHistoryEntry[]>;

/**
 * Execution History Store state
 */
interface ExecutionHistoryState {
  /** Internal history storage (workflow ID -> entries) */
  history: HistoryStorage;

  /**
   * Add new execution entry
   * Automatically prunes to keep 5 most recent per workflow
   * Persists to localStorage
   */
  addEntry: (entry: ExecutionHistoryEntry) => void;

  /**
   * Get execution history
   * @param workflowId - Optional workflow ID to filter by
   * @returns Array of execution entries, sorted by timestamp (newest first)
   */
  getHistory: (workflowId?: string) => ExecutionHistoryEntry[];

  /**
   * Get single execution entry by ID
   * @param id - Execution ID
   * @returns Execution entry or undefined if not found
   */
  getEntry: (id: string) => ExecutionHistoryEntry | undefined;

  /**
   * Clear execution history
   * @param workflowId - Optional workflow ID to clear specific workflow history
   */
  clearHistory: (workflowId?: string) => void;
}

/**
 * Load history from localStorage
 * Handles corrupted or missing data gracefully
 */
function loadHistoryFromStorage(): HistoryStorage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as HistoryStorage;
    return parsed;
  } catch (error) {
    console.error('[ExecutionHistoryStore] Failed to load history from localStorage:', error);
    return {};
  }
}

/**
 * Save history to localStorage
 */
function saveHistoryToStorage(history: HistoryStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('[ExecutionHistoryStore] Failed to save history to localStorage:', error);
  }
}

/**
 * Prune workflow history to keep only the 5 most recent entries
 * @param entries - Array of execution entries
 * @returns Pruned array (5 most recent)
 */
function pruneWorkflowHistory(entries: ExecutionHistoryEntry[]): ExecutionHistoryEntry[] {
  if (entries.length <= MAX_ENTRIES_PER_WORKFLOW) {
    return entries;
  }

  // Sort by timestamp (newest first) and take first 5
  return entries.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_ENTRIES_PER_WORKFLOW);
}

/**
 * Execution History Store
 *
 * Manages workflow execution history with automatic persistence and pruning.
 */
export const useExecutionHistoryStore = create<ExecutionHistoryState>((set, get) => ({
  // Initialize with data from localStorage
  history: loadHistoryFromStorage(),

  /**
   * Add new execution entry
   */
  addEntry: (entry: ExecutionHistoryEntry) => {
    const { history } = get();

    // Get existing entries for this workflow
    const workflowHistory = history[entry.workflowId] || [];

    // Add new entry
    const updatedWorkflowHistory = [...workflowHistory, entry];

    // Prune to keep only 5 most recent
    const prunedHistory = pruneWorkflowHistory(updatedWorkflowHistory);

    // Update store
    const updatedHistory = {
      ...history,
      [entry.workflowId]: prunedHistory,
    };

    set({ history: updatedHistory });

    // Persist to localStorage
    saveHistoryToStorage(updatedHistory);
  },

  /**
   * Get execution history
   * Returns entries sorted by timestamp (newest first)
   */
  getHistory: (workflowId?: string) => {
    const { history } = get();

    if (workflowId) {
      // Return history for specific workflow
      const workflowHistory = history[workflowId] || [];
      return workflowHistory.sort((a, b) => b.timestamp - a.timestamp);
    }

    // Return all history across all workflows
    const allEntries: ExecutionHistoryEntry[] = [];

    Object.values(history).forEach((entries) => {
      allEntries.push(...entries);
    });

    return allEntries.sort((a, b) => b.timestamp - a.timestamp);
  },

  /**
   * Get single execution entry by ID
   */
  getEntry: (id: string) => {
    const { history } = get();

    // Search across all workflows
    for (const entries of Object.values(history)) {
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        return entry;
      }
    }

    return undefined;
  },

  /**
   * Clear execution history
   */
  clearHistory: (workflowId?: string) => {
    const { history } = get();

    if (workflowId) {
      // Clear history for specific workflow
      const updatedHistory = { ...history };
      delete updatedHistory[workflowId];

      set({ history: updatedHistory });
      saveHistoryToStorage(updatedHistory);
    } else {
      // Clear all history
      set({ history: {} });
      saveHistoryToStorage({});
    }
  },
}));
