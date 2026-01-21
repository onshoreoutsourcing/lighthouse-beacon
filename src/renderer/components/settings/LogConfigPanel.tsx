/**
 * LogConfigPanel Component
 *
 * Displays current log configuration with real-time metrics.
 *
 * Features:
 * - Shows current log level with color-coded badge
 * - Displays log file path with copy-to-clipboard button
 * - Shows log file size in MB
 * - Displays available disk space with warning if <1GB
 * - Auto-refreshes configuration every 5 seconds
 * - "Open Log Folder" button to open logs in file explorer
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Copy,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  HardDrive,
  FileText,
  RefreshCw,
} from 'lucide-react';
import type { LogLevel, LogConfig } from '@shared/types';

interface LogConfigPanelProps {
  className?: string;
}

const LogConfigPanel: React.FC<LogConfigPanelProps> = ({ className = '' }) => {
  const [config, setConfig] = useState<LogConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPath, setCopiedPath] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load configuration
  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.settings.getLogConfig();

      if (result.success) {
        setConfig(result.data);
      } else {
        setError(result.error?.message || 'Failed to load log configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load log configuration');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = window.setInterval(() => {
      void loadConfig();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [autoRefresh, loadConfig]);

  // Copy path to clipboard
  const handleCopyPath = async (): Promise<void> => {
    if (!config) return;

    try {
      await window.navigator.clipboard.writeText(config.filePath);
      setCopiedPath(true);
      window.setTimeout(() => setCopiedPath(false), 2000);
    } catch (err) {
      console.error('Failed to copy path:', err);
    }
  };

  // Open log folder
  const handleOpenFolder = async (): Promise<void> => {
    try {
      const result = await window.electronAPI.logs.openLogFolder();

      if (!result.success) {
        setError(result.error?.message || 'Failed to open log folder');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open log folder');
    }
  };

  // Format file size in MB
  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  // Format disk space in GB
  const formatDiskSpace = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
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

  // Check if disk space is low
  const isLowDiskSpace = (): boolean => {
    if (!config) return false;
    const gb = config.availableDiskSpace / (1024 * 1024 * 1024);
    return gb < 1;
  };

  if (error) {
    return (
      <div className={`p-4 bg-red-500/10 border border-red-500/30 rounded ${className}`}>
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!config && isLoading) {
    return (
      <div
        className={`p-4 bg-vscode-bg-secondary border border-vscode-border rounded ${className}`}
      >
        <div className="flex items-center gap-2 text-vscode-text-muted">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <p className="text-sm">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-vscode-text">Log Configuration</h4>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-vscode-text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="cursor-pointer"
            />
            Auto-refresh (5s)
          </label>
          <button
            onClick={() => void loadConfig()}
            disabled={isLoading}
            className="p-1 hover:bg-vscode-bg-secondary rounded disabled:opacity-50"
            title="Refresh configuration"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Configuration Details */}
      <div className="p-4 bg-vscode-bg-secondary border border-vscode-border rounded space-y-3">
        {/* Log Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-vscode-text-muted" />
            <span className="text-sm text-vscode-text">Log Level:</span>
          </div>
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded border ${getLevelColor(config.level)}`}
          >
            {config.level.toUpperCase()}
          </span>
        </div>

        {/* Log File Path */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-vscode-text-muted" />
            <span className="text-sm text-vscode-text">Log File Path:</span>
          </div>
          <div className="flex items-center gap-2 ml-6">
            <code className="flex-1 px-2 py-1 text-xs bg-vscode-bg border border-vscode-border rounded text-vscode-text-muted font-mono truncate">
              {config.filePath}
            </code>
            <button
              onClick={() => void handleCopyPath()}
              className="p-1.5 hover:bg-vscode-bg-tertiary rounded"
              title="Copy path to clipboard"
            >
              {copiedPath ? (
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-vscode-text-muted" />
              )}
            </button>
          </div>
        </div>

        {/* Log File Size */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-vscode-text-muted" />
            <span className="text-sm text-vscode-text">Log File Size:</span>
          </div>
          <span className="text-sm text-vscode-text-muted font-mono">
            {formatFileSize(config.fileSize)}
          </span>
        </div>

        {/* Available Disk Space */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-vscode-text-muted" />
            <span className="text-sm text-vscode-text">Available Disk Space:</span>
          </div>
          <span
            className={`text-sm font-mono ${
              isLowDiskSpace() ? 'text-yellow-500' : 'text-vscode-text-muted'
            }`}
          >
            {formatDiskSpace(config.availableDiskSpace)}
          </span>
        </div>

        {/* Low Disk Space Warning */}
        {isLowDiskSpace() && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-yellow-500 font-medium">Low Disk Space</p>
              <p className="text-xs text-yellow-500/80 mt-1">
                Available disk space is below 1GB. Consider clearing old logs or freeing up disk
                space.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Open Log Folder Button */}
      <button
        onClick={() => void handleOpenFolder()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-vscode-bg-secondary border border-vscode-border rounded hover:bg-vscode-bg-tertiary text-vscode-text"
      >
        <FolderOpen className="w-4 h-4" />
        Open Log Folder
      </button>
    </div>
  );
};

export default LogConfigPanel;
