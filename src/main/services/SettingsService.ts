import { app, safeStorage } from 'electron';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { AppSettings } from '@shared/types';
import { logger } from '../logger';

/**
 * SettingsService
 *
 * Manages application settings including secure API key storage.
 * Uses Electron's safeStorage API for OS-level encryption of sensitive data.
 *
 * Security Features:
 * - API keys encrypted using OS-level encryption (Keychain on macOS, DPAPI on Windows)
 * - API key never appears in settings file or logs
 * - Settings persist across application restarts
 * - Automatic directory creation for user data
 *
 * @example
 * const service = new SettingsService();
 * await service.setApiKey('sk-ant-...');
 * const key = await service.getApiKey();
 */
export class SettingsService {
  private settingsPath: string;
  private apiKeyPath: string;
  private settings: AppSettings | null = null;

  /**
   * Default application settings
   */
  private static readonly DEFAULT_SETTINGS: AppSettings = {
    ai: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
      hasApiKey: false,
    },
    soc: {
      enabled: true,
      endpoint: process.env.LIGHTHOUSE_SOC_ENDPOINT || '',
    },
    logging: {
      level: 'debug',
      enableFileLogging: true,
      enableConsoleLogging: true,
    },
  };

  constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.apiKeyPath = path.join(userDataPath, '.api-key');
  }

  /**
   * Get encrypted API key from secure storage
   *
   * @returns Decrypted API key or null if not set
   */
  async getApiKey(): Promise<string | null> {
    try {
      // Check if encryption is available
      if (!safeStorage.isEncryptionAvailable()) {
        logger.warn('[SettingsService] Encryption not available - API key storage may be insecure');
      }

      const encryptedKey = await fs.readFile(this.apiKeyPath);
      const decryptedKey = safeStorage.decryptString(encryptedKey);
      return decryptedKey;
    } catch {
      // File doesn't exist or decryption failed
      return null;
    }
  }

  /**
   * Store API key in encrypted format
   *
   * @param apiKey - Anthropic API key to store
   * @throws Error if API key format is invalid
   */
  async setApiKey(apiKey: string): Promise<void> {
    // Validate API key format
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid API key format');
    }

    // Anthropic keys must start with 'sk-ant-'
    if (!apiKey.startsWith('sk-ant-')) {
      throw new Error('Invalid Anthropic API key format. Key should start with "sk-ant-"');
    }

    // Encrypt and store
    const encryptedKey = safeStorage.encryptString(apiKey);
    await fs.writeFile(this.apiKeyPath, encryptedKey);

    // Update settings to indicate key is present (never store actual key in settings)
    const settings = await this.getSettings();
    settings.ai.hasApiKey = true;
    await this.saveSettings(settings);
  }

  /**
   * Remove API key from storage
   */
  async removeApiKey(): Promise<void> {
    try {
      await fs.unlink(this.apiKeyPath);

      // Update settings
      const settings = await this.getSettings();
      settings.ai.hasApiKey = false;
      await this.saveSettings(settings);
    } catch {
      // File doesn't exist, nothing to remove
    }
  }

  /**
   * Check if API key exists
   *
   * @returns True if API key file exists
   */
  async hasApiKey(): Promise<boolean> {
    try {
      await fs.access(this.apiKeyPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get application settings
   *
   * @returns Current application settings
   */
  async getSettings(): Promise<AppSettings> {
    if (this.settings) {
      return { ...this.settings };
    }

    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      const parsedData = JSON.parse(data) as Partial<AppSettings>;

      // Merge with defaults to ensure all required fields exist
      const settings: AppSettings = {
        ai: { ...SettingsService.DEFAULT_SETTINGS.ai, ...parsedData.ai },
        soc: { ...SettingsService.DEFAULT_SETTINGS.soc, ...parsedData.soc },
        logging: { ...SettingsService.DEFAULT_SETTINGS.logging, ...parsedData.logging },
      };

      // Always check if API key exists (file-based, not in settings)
      settings.ai.hasApiKey = await this.hasApiKey();

      this.settings = settings;
      return { ...this.settings };
    } catch {
      // File doesn't exist, use defaults
      const settings: AppSettings = { ...SettingsService.DEFAULT_SETTINGS };
      settings.ai.hasApiKey = await this.hasApiKey();
      this.settings = settings;
      return { ...this.settings };
    }
  }

  /**
   * Update application settings
   *
   * @param updates - Partial settings to merge with current settings
   */
  async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    const settings = await this.getSettings();

    // Deep merge updates - ensure full objects after merge
    const updatedSettings: AppSettings = {
      ai: updates.ai ? { ...settings.ai, ...updates.ai } : settings.ai,
      soc: updates.soc ? { ...settings.soc, ...updates.soc } : settings.soc,
      logging: updates.logging ? { ...settings.logging, ...updates.logging } : settings.logging,
    };

    await this.saveSettings(updatedSettings);
  }

  /**
   * Get current logging configuration
   *
   * @returns Current logging settings
   */
  async getLoggingConfig(): Promise<AppSettings['logging']> {
    const settings = await this.getSettings();
    return settings.logging;
  }

  /**
   * Update logging configuration
   *
   * @param config - Partial logging config to merge with current settings
   */
  async setLoggingConfig(config: Partial<AppSettings['logging']>): Promise<void> {
    const current = await this.getLoggingConfig();
    await this.updateSettings({
      logging: { ...current, ...config },
    });
  }

  /**
   * Save settings to disk
   *
   * @param settings - Settings to save
   * @private
   */
  private async saveSettings(settings: AppSettings): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.settingsPath);
    await fs.mkdir(dir, { recursive: true });

    // Never include actual API key in settings file
    const settingsToSave = {
      ...settings,
      ai: {
        ...settings.ai,
        hasApiKey: settings.ai.hasApiKey, // Only boolean flag
      },
    };

    await fs.writeFile(this.settingsPath, JSON.stringify(settingsToSave, null, 2));
    this.settings = settings;
  }
}
