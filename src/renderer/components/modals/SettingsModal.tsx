/**
 * SettingsModal Component
 *
 * Modal dialog for configuring application settings, primarily API key management.
 *
 * Features:
 * - API key input with masked display
 * - API key validation (basic format check)
 * - Secure storage via electron-store
 * - Error handling and user feedback
 * - Escape key to close
 */

import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Check, AlertCircle, Settings, FileText } from 'lucide-react';
import { useChatStore } from '@renderer/stores/chat.store';
import LogViewer from './LogViewer';
import LogLevelSelector from '../settings/LogLevelSelector';
import LogConfigPanel from '../settings/LogConfigPanel';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'logs'>('settings');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get reset and initializeAI from chat store
  const { reset: resetChat, initializeAI } = useChatStore();

  // Check if API key exists on mount
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const result = await window.electronAPI.settings.hasApiKey();
        if (result.success) {
          setHasExistingKey(result.data.hasApiKey);
        }
      } catch (err) {
        console.error('Failed to check API key status:', err);
      }
    };

    if (isOpen) {
      void checkApiKey();
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const validateApiKey = (key: string): boolean => {
    // Basic Anthropic API key format validation
    // Format: sk-ant-api03-... (58+ characters)
    return key.startsWith('sk-ant-') && key.length >= 58;
  };

  const handleSave = async (): Promise<void> => {
    setError(null);
    setSuccess(false);

    // Validate API key format
    if (!validateApiKey(apiKey)) {
      setError(
        'Invalid API key format. Anthropic API keys should start with "sk-ant-" and be at least 58 characters.'
      );
      return;
    }

    setIsSaving(true);

    try {
      const result = await window.electronAPI.settings.setApiKey(apiKey);

      if (result.success) {
        setSuccess(true);
        setHasExistingKey(true);
        setApiKey(''); // Clear input for security
        setShowApiKey(false);

        // Reset chat store to clear isInitialized flag
        resetChat();

        // Reinitialize AI with new API key
        await initializeAI();

        // Auto-close after success
        window.setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error?.message || 'Failed to save API key');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      const result = await window.electronAPI.settings.removeApiKey();

      if (result.success) {
        setSuccess(true);
        setHasExistingKey(false);
        setApiKey('');

        // Reset chat store when API key is removed
        resetChat();

        window.setTimeout(() => {
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error?.message || 'Failed to remove API key');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove API key');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-vscode-bg border border-vscode-border rounded-lg shadow-xl w-full max-w-4xl mx-4 h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-vscode-border">
          <h2 className="text-lg font-semibold text-vscode-text">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-vscode-bg-secondary rounded"
            title="Close settings"
          >
            <X className="w-5 h-5 text-vscode-text-muted" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-vscode-border">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-vscode-accent text-vscode-accent'
                : 'border-transparent text-vscode-text-muted hover:text-vscode-text'
            }`}
          >
            <Settings className="w-4 h-4" />
            General
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-vscode-accent text-vscode-accent'
                : 'border-transparent text-vscode-text-muted hover:text-vscode-text'
            }`}
          >
            <FileText className="w-4 h-4" />
            Logs
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'settings' ? (
            <div className="p-4 space-y-4 overflow-auto h-full">
              {/* API Key Section */}
              <div>
                <label className="block text-sm font-medium text-vscode-text mb-2">
                  Anthropic API Key
                </label>

                {hasExistingKey && (
                  <div className="mb-3 p-3 bg-green-500/10 border border-green-500/30 rounded flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-500">API key is configured</span>
                  </div>
                )}

                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-api03-..."
                    className="w-full px-3 py-2 pr-10 bg-vscode-bg-secondary border border-vscode-border rounded text-vscode-text placeholder-vscode-text-muted focus:outline-none focus:ring-2 focus:ring-vscode-accent font-mono text-sm"
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-vscode-bg-tertiary rounded"
                    title={showApiKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4 text-vscode-text-muted" />
                    ) : (
                      <Eye className="w-4 h-4 text-vscode-text-muted" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-vscode-text-muted mt-2">
                  Get your API key from{' '}
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-vscode-accent hover:underline"
                  >
                    Anthropic Console
                  </a>
                </p>
              </div>

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
                  <Check className="w-4 h-4 text-green-500" />
                  <p className="text-sm text-green-500">Settings saved successfully!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <div className="p-4 space-y-6">
                {/* Log Level Selector */}
                <LogLevelSelector />

                {/* Divider */}
                <div className="border-t border-vscode-border" />

                {/* Log Configuration Panel */}
                <LogConfigPanel />

                {/* Divider */}
                <div className="border-t border-vscode-border" />
              </div>

              {/* Log Viewer */}
              <LogViewer onClose={onClose} />
            </div>
          )}
        </div>

        {/* Footer - Only show for settings tab */}
        {activeTab === 'settings' && (
          <div className="flex items-center justify-between p-4 border-t border-vscode-border">
            <div>
              {hasExistingKey && (
                <button
                  onClick={() => void handleRemove()}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove API Key
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-sm text-vscode-text-muted hover:bg-vscode-bg-secondary rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={isSaving || !apiKey}
                className="px-4 py-2 text-sm bg-vscode-accent text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;
