/**
 * LogViewer Component
 *
 * Displays application logs with search, filtering, export, and auto-refresh capabilities.
 *
 * Features:
 * - Display recent 100 log entries
 * - Search by keyword with highlighting (debounced for performance)
 * - Filter by log level (ALL/DEBUG/INFO/WARN/ERROR)
 * - Filter by service name
 * - Export logs to timestamped file
 * - Clear logs with confirmation dialog
 * - Auto-refresh every 5 seconds (toggle on/off)
 * - Virtualized list for performance with 10,000+ entries
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  RefreshCw,
  Search,
  Download,
  Trash2,
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import type { LogEntry, LogLevel } from '@shared/types';

interface LogViewerProps {
  onClose?: () => void;
}

const LogViewer: React.FC<LogViewerProps> = () => {
  // State management
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | LogLevel>('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Virtualization state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const itemHeight = 60; // Approximate height of each log entry
  const overscan = 5; // Number of items to render outside visible area

  // Debounce search input
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const start = window.performance.now();
      setDebouncedSearchTerm(searchTerm);
      const duration = window.performance.now() - start;
      if (duration > 100) {
        console.warn(`Search took ${duration}ms - should be <100ms`);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  // Load logs
  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.logs.read();

      if (result.success) {
        setEntries(result.data);
      } else {
        setError(result.error?.message || 'Failed to load logs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = window.setInterval(() => {
      void loadLogs();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [autoRefresh, loadLogs]);

  // Extract unique services from entries
  const services = useMemo(() => {
    const uniqueServices = new Set<string>();
    entries.forEach((entry) => {
      if (entry.service) {
        uniqueServices.add(entry.service);
      }
    });
    return Array.from(uniqueServices).sort();
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    const start = window.performance.now();

    let filtered = entries;

    // Level filter
    if (levelFilter !== 'ALL') {
      filtered = filtered.filter((e) => e.level === levelFilter);
    }

    // Service filter
    if (serviceFilter !== 'ALL') {
      filtered = filtered.filter((e) => e.service === serviceFilter);
    }

    // Search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter((e) => e.message.toLowerCase().includes(searchLower));
    }

    const duration = window.performance.now() - start;
    if (duration > 50) {
      console.warn(`Filter took ${duration}ms - should be <50ms`);
    }

    return filtered;
  }, [entries, levelFilter, serviceFilter, debouncedSearchTerm]);

  // Virtualization calculations
  const { visibleStart, visibleEnd, totalHeight, offsetY } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(filteredEntries.length, start + visibleCount + overscan * 2);

    return {
      visibleStart: start,
      visibleEnd: end,
      totalHeight: filteredEntries.length * itemHeight,
      offsetY: start * itemHeight,
    };
  }, [scrollTop, containerHeight, filteredEntries.length]);

  const visibleEntries = filteredEntries.slice(visibleStart, visibleEnd);

  // Handle scroll for virtualization
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Measure container height
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerHeight(entries[0].contentRect.height);
      }
    });

    observer.observe(scrollContainerRef.current);

    return () => observer.disconnect();
  }, []);

  // Export logs
  const handleExport = async (): Promise<void> => {
    try {
      const result = await window.electronAPI.logs.export();

      if (result.success) {
        setSuccessMessage(`Logs exported to: ${result.data}`);
        window.setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error?.message || 'Failed to export logs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export logs');
    }
  };

  // Clear logs
  const handleClear = async (): Promise<void> => {
    try {
      const result = await window.electronAPI.logs.clear();

      if (result.success) {
        setSuccessMessage('Logs cleared successfully');
        window.setTimeout(() => setSuccessMessage(null), 3000);
        setShowClearConfirm(false);
        await loadLogs();
      } else {
        setError(result.error?.message || 'Failed to clear logs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear logs');
    }
  };

  // Highlight search term in text
  const highlightText = (text: string, search: string): React.ReactNode => {
    if (!search) return text;

    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <mark key={i} className="bg-yellow-500/30 text-vscode-text">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  // Get icon for log level
  const getLevelIcon = (level: LogLevel): React.ReactNode => {
    switch (level) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug':
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get level badge color
  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'warn':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'info':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'debug':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-vscode-border">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-vscode-text">Application Logs</h3>
          <span className="text-sm text-vscode-text-muted">
            {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-vscode-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="cursor-pointer"
            />
            Auto-refresh (5s)
          </label>
          <button
            onClick={() => void loadLogs()}
            disabled={isLoading}
            className="p-2 hover:bg-vscode-bg-secondary rounded disabled:opacity-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-vscode-border bg-vscode-bg-secondary">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vscode-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs..."
            className="w-full pl-10 pr-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm text-vscode-text placeholder-vscode-text-muted focus:outline-none focus:ring-2 focus:ring-vscode-accent"
          />
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-vscode-text-muted" />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as typeof levelFilter)}
            className="px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm text-vscode-text focus:outline-none focus:ring-2 focus:ring-vscode-accent"
          >
            <option value="ALL">All Levels</option>
            <option value="debug">DEBUG</option>
            <option value="info">INFO</option>
            <option value="warn">WARN</option>
            <option value="error">ERROR</option>
          </select>
        </div>

        {/* Service Filter */}
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-sm text-vscode-text focus:outline-none focus:ring-2 focus:ring-vscode-accent"
        >
          <option value="ALL">All Services</option>
          {services.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mx-4 mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <p className="text-sm text-green-500">{successMessage}</p>
        </div>
      )}

      {/* Log Entries - Virtualized */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto"
        style={{ height: '100%' }}
      >
        {filteredEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-vscode-text-muted">
            <Info className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg">No log entries found</p>
            {(levelFilter !== 'ALL' || serviceFilter !== 'ALL' || debouncedSearchTerm) && (
              <p className="text-sm mt-2">Try adjusting your filters</p>
            )}
          </div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleEntries.map((entry, index) => {
                const actualIndex = visibleStart + index;
                return (
                  <div
                    key={actualIndex}
                    className="px-4 py-3 border-b border-vscode-border hover:bg-vscode-bg-secondary"
                    style={{ height: itemHeight }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Level Icon */}
                      <div className="mt-1">{getLevelIcon(entry.level)}</div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {/* Service Badge */}
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-vscode-accent/20 text-vscode-accent">
                            {entry.service}
                          </span>

                          {/* Level Badge */}
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded border ${getLevelColor(entry.level)}`}
                          >
                            {entry.level.toUpperCase()}
                          </span>

                          {/* Timestamp */}
                          <span className="text-xs text-vscode-text-muted">{entry.timestamp}</span>
                        </div>

                        {/* Message */}
                        <p className="text-sm text-vscode-text break-words">
                          {highlightText(entry.message, debouncedSearchTerm)}
                        </p>

                        {/* Metadata */}
                        {entry.metadata && (
                          <details className="mt-1">
                            <summary className="text-xs text-vscode-text-muted cursor-pointer hover:text-vscode-text">
                              Show metadata
                            </summary>
                            <pre className="mt-1 text-xs text-vscode-text-muted overflow-x-auto">
                              {JSON.stringify(entry.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer - Action Buttons */}
      <div className="flex items-center justify-between p-4 border-t border-vscode-border">
        <button
          onClick={() => setShowClearConfirm(true)}
          disabled={entries.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Clear Logs
        </button>

        <button
          onClick={() => void handleExport()}
          disabled={entries.length === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-vscode-accent text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Export Logs
        </button>
      </div>

      {/* Clear Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-vscode-bg border border-vscode-border rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-vscode-text mb-4">Clear All Logs?</h3>
            <p className="text-sm text-vscode-text-muted mb-6">
              This will permanently delete all log files. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm text-vscode-text-muted hover:bg-vscode-bg-secondary rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleClear()}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:opacity-90"
              >
                Clear Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogViewer;
