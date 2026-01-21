/**
 * LogLevelSelector Component
 *
 * Provides a dropdown to change the application log level at runtime.
 *
 * Features:
 * - Dropdown with DEBUG, INFO, WARN, ERROR options
 * - Shows current log level from settings
 * - Applies changes immediately without restart
 * - Displays success notification on change
 * - Shows warning when changing to ERROR level (minimal logging)
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import type { LogLevel } from '@shared/types';

interface LogLevelSelectorProps {
  className?: string;
}

const LogLevelSelector: React.FC<LogLevelSelectorProps> = ({ className = '' }) => {
  const [currentLevel, setCurrentLevel] = useState<LogLevel>('debug');
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Load current log level on mount
  useEffect(() => {
    const loadCurrentLevel = async () => {
      try {
        const result = await window.electronAPI.settings.getLogConfig();
        if (result.success) {
          setCurrentLevel(result.data.level);
        }
      } catch (err) {
        console.error('Failed to load current log level:', err);
      }
    };

    void loadCurrentLevel();
  }, []);

  const handleLevelChange = async (newLevel: LogLevel): Promise<void> => {
    setError(null);
    setSuccess(false);
    setShowWarning(false);

    // Show warning for ERROR level
    if (newLevel === 'error') {
      setShowWarning(true);
    }

    setIsChanging(true);

    try {
      const result = await window.electronAPI.settings.setLogLevel(newLevel);

      if (result.success) {
        setCurrentLevel(newLevel);
        setSuccess(true);

        // Auto-hide success message after 3 seconds
        window.setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error?.message || 'Failed to update log level');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update log level');
    } finally {
      setIsChanging(false);
    }
  };

  const getLevelDescription = (level: LogLevel): string => {
    switch (level) {
      case 'debug':
        return 'DEBUG - All logs (verbose)';
      case 'info':
        return 'INFO - General information';
      case 'warn':
        return 'WARN - Warnings only';
      case 'error':
        return 'ERROR - Errors only (minimal)';
    }
  };

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'debug':
        return 'text-gray-500';
      case 'info':
        return 'text-blue-500';
      case 'warn':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label and Current Level Badge */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-vscode-text">Log Level</label>
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded border ${getLevelColor(currentLevel)}`}
        >
          Current: {currentLevel.toUpperCase()}
        </span>
      </div>

      {/* Dropdown */}
      <select
        value={currentLevel}
        onChange={(e) => void handleLevelChange(e.target.value as LogLevel)}
        disabled={isChanging}
        className="w-full px-3 py-2 bg-vscode-bg-secondary border border-vscode-border rounded text-vscode-text focus:outline-none focus:ring-2 focus:ring-vscode-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="debug">{getLevelDescription('debug')}</option>
        <option value="info">{getLevelDescription('info')}</option>
        <option value="warn">{getLevelDescription('warn')}</option>
        <option value="error">{getLevelDescription('error')}</option>
      </select>

      <p className="text-xs text-vscode-text-muted">
        Changes apply immediately without restarting the application. Log level persists across
        restarts.
      </p>

      {/* Warning for ERROR level */}
      {showWarning && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-500 font-medium">Minimal Logging Enabled</p>
            <p className="text-xs text-yellow-500/80 mt-1">
              ERROR level will only log critical errors. This may make troubleshooting difficult.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <p className="text-sm text-green-500">Log level updated successfully!</p>
        </div>
      )}
    </div>
  );
};

export default LogLevelSelector;
