# Feature 2.1: AIChatSDK Integration and Configuration

**Feature ID:** Feature-2.1
**Epic:** Epic-2 (AI Integration with AIChatSDK)
**Status:** COMPLETE
**Completed:** January 20, 2026
**Priority:** P0 (Critical)
**Estimated Duration:** 5 days (1 wave)
**Dependencies:** Epic 1 Complete, AIChatSDK available at `../AIChatSDK`

---

## Feature Overview

### Problem Statement

With Epic 1 complete, Lighthouse Chat IDE has a functional desktop shell with file explorer and Monaco editor, but lacks AI capabilities. The application cannot communicate with AI providers, preventing the core value proposition of conversational file operations.

**Current State:** Desktop IDE shell without AI communication; chat panel shows placeholder
**Desired State:** Functional AI service layer enabling secure communication with Anthropic Claude, ready for chat interface and tool framework in subsequent features

### Business Value

**Value to Users:**
- Foundation for conversational interaction with AI about their codebase
- Secure storage of API credentials protecting user privacy
- Proper error handling ensuring reliable AI communication

**Value to Business:**
- Enables core product differentiator: conversational file operations
- Establishes multi-provider architecture foundation (starting with Claude)
- Implements SOC traceability from day one (compliance requirement)
- Sets architectural patterns for all future AI features

**References:**
- Product Vision (01-Product-Vision.md): "Visual First, Conversational Always" principle
- Business Requirements (03-Business-Requirements.md): FR-4 (AI Chat Interface), FR-5 (Multi-Provider Support), FR-10 (SOC Traceability)
- ADR-006: AIChatSDK Integration Approach
- ADR-007: Conversation Storage Strategy (context for future features)

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| AIChatSDK initialization | Successful on app start | Automated verification |
| Claude API communication | Working send/receive | Integration test |
| API key encryption | Never stored in plain text | Security audit |
| API key not in logs | Never appears in any log | Log analysis |
| SOC logging | 100% of AI requests logged | Audit verification |
| Error message clarity | All errors actionable | Manual review |
| IPC latency | < 50ms for AI channel setup | Performance test |

---

## Scope

### In Scope

**AI Service Layer:**
- [x] AIService class wrapping AIChatSDK with application-specific logic
- [x] AIChatSDK import as local module from `../AIChatSDK`
- [x] Claude provider configuration and initialization
- [x] Basic message send/receive (non-streaming) for validation
- [x] Streaming message support preparation
- [x] Connection state management (connected, disconnected, error)
- [x] Graceful shutdown and cleanup

**API Key Management:**
- [x] Electron safeStorage integration for API key encryption
- [x] API key storage/retrieval service
- [x] API key validation on entry
- [x] Secure IPC channel for API key operations
- [x] Settings persistence for provider configuration
- [x] First-run detection (prompt for API key if not configured)

**SOC Logging Integration:**
- [x] Configure AIChatSDK SOC logging endpoint
- [x] Verify all AI requests logged automatically
- [x] Verify all AI responses logged automatically
- [x] Include request metadata (timestamp, model, provider)

**Error Handling:**
- [x] Authentication failure detection and messaging
- [x] Rate limit detection and retry logic
- [x] Network error handling with clear messages
- [x] Invalid API key format detection
- [x] Provider unavailable handling
- [x] Timeout handling for long requests

**IPC Handlers:**
- [x] AI initialization channel (`ai:initialize`)
- [x] API key management channels (`settings:get-api-key`, `settings:set-api-key`)
- [x] AI send message channel (`ai:send-message`)
- [x] AI stream message event channel (`ai:stream-message`)
- [x] AI cancel channel (`ai:cancel`)
- [x] AI status channel (`ai:status`)

### Out of Scope

- Chat interface UI component (Feature 2.2)
- Streaming response visualization (Feature 2.2)
- Conversation persistence (Feature 2.2)
- Tool calling framework (Feature 2.3)
- Permission system (Feature 2.3)
- Multi-provider support beyond Claude (Epic 4)
- Provider switching UI (Epic 4)
- Advanced conversation management (Epic 4)

---

## Technical Design

### Architecture Overview

```
+------------------+       +------------------+       +------------------+
|   Renderer       |       |   Main Process   |       |   External       |
|   Process        |       |                  |       |                  |
+------------------+       +------------------+       +------------------+
|                  |       |                  |       |                  |
| ipcService       | <---> | IPC Handlers     |       |                  |
|   .initializeAI  |  IPC  |   ai:*           |       |                  |
|   .sendMessage   |       |   settings:*     |       |                  |
|   .getApiKey     |       |                  |       |                  |
|                  |       |                  |       |                  |
+------------------+       +--------+---------+       +------------------+
                                    |
                                    v
                           +------------------+
                           |   AIService      |
                           +------------------+
                           | - client         |
                           | - initialize()   |
                           | - sendMessage()  |
                           | - stream()       |
                           +--------+---------+
                                    |
                                    v
                           +------------------+       +------------------+
                           |   AIChatSDK      | ----> | Anthropic API    |
                           +------------------+       +------------------+
                           |                  |
                           +------------------+       +------------------+
                                    |                 |   Lighthouse     |
                                    +---------------> |   SOC System     |
                                                      +------------------+
```

### Component Design

#### AIService (Main Process)

**Location:** `src/main/services/ai.service.ts`

**Responsibility:** Wrap AIChatSDK with application-specific logic, manage AI client lifecycle

**Interface:**
```typescript
// src/main/services/ai.service.ts
import { AIChatClient, ClaudeProvider, SOCConfig } from '../../../AIChatSDK';

interface AIServiceConfig {
  apiKey: string;
  model?: string;
  socEndpoint?: string;
}

interface AIServiceStatus {
  initialized: boolean;
  provider: string | null;
  model: string | null;
  error: string | null;
}

interface SendMessageOptions {
  conversationId?: string;
  systemPrompt?: string;
}

interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

export interface IAIService {
  initialize(config: AIServiceConfig): Promise<void>;
  sendMessage(message: string, options?: SendMessageOptions): Promise<string>;
  streamMessage(message: string, callbacks: StreamCallbacks, options?: SendMessageOptions): Promise<void>;
  cancelCurrentRequest(): void;
  getStatus(): AIServiceStatus;
  shutdown(): Promise<void>;
}

export class AIService implements IAIService {
  private client: AIChatClient | null = null;
  private currentAbortController: AbortController | null = null;
  private status: AIServiceStatus = {
    initialized: false,
    provider: null,
    model: null,
    error: null,
  };

  async initialize(config: AIServiceConfig): Promise<void> {
    try {
      const provider = new ClaudeProvider({
        apiKey: config.apiKey,
        model: config.model || 'claude-3-sonnet-20240229',
      });

      const socConfig: SOCConfig = {
        enabled: true,
        endpoint: config.socEndpoint || process.env.LIGHTHOUSE_SOC_ENDPOINT,
      };

      this.client = new AIChatClient({
        provider,
        soc: socConfig,
      });

      // Validate connection with minimal request
      await this.client.validateConnection();

      this.status = {
        initialized: true,
        provider: 'anthropic',
        model: config.model || 'claude-3-sonnet-20240229',
        error: null,
      };
    } catch (error) {
      this.status = {
        initialized: false,
        provider: null,
        model: null,
        error: this.formatError(error),
      };
      throw error;
    }
  }

  async sendMessage(message: string, options?: SendMessageOptions): Promise<string> {
    if (!this.client) {
      throw new Error('AI service not initialized. Please configure your API key.');
    }

    try {
      const response = await this.client.chat({
        message,
        conversationId: options?.conversationId,
        systemPrompt: options?.systemPrompt,
      });
      return response.content;
    } catch (error) {
      throw new Error(this.formatError(error));
    }
  }

  async streamMessage(
    message: string,
    callbacks: StreamCallbacks,
    options?: SendMessageOptions
  ): Promise<void> {
    if (!this.client) {
      throw new Error('AI service not initialized. Please configure your API key.');
    }

    this.currentAbortController = new AbortController();

    try {
      const stream = this.client.streamChat({
        message,
        conversationId: options?.conversationId,
        systemPrompt: options?.systemPrompt,
        signal: this.currentAbortController.signal,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        fullResponse += chunk;
        callbacks.onToken(chunk);
      }

      callbacks.onComplete(fullResponse);
    } catch (error) {
      if (error.name === 'AbortError') {
        // Request was cancelled, not an error
        return;
      }
      callbacks.onError(new Error(this.formatError(error)));
    } finally {
      this.currentAbortController = null;
    }
  }

  cancelCurrentRequest(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
  }

  getStatus(): AIServiceStatus {
    return { ...this.status };
  }

  async shutdown(): Promise<void> {
    this.cancelCurrentRequest();
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
    this.status = {
      initialized: false,
      provider: null,
      model: null,
      error: null,
    };
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('401') || error.message.includes('authentication')) {
        return 'Invalid API key. Please check your Anthropic API key and try again.';
      }
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return 'Rate limit exceeded. Please wait a moment before trying again.';
      }
      if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
        return 'Network error. Please check your internet connection.';
      }
      if (error.message.includes('timeout')) {
        return 'Request timed out. Please try again.';
      }
      return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
  }
}

export const aiService = new AIService();
```

#### SettingsService (Main Process)

**Location:** `src/main/services/settings.service.ts`

**Responsibility:** Manage application settings including secure API key storage

**Interface:**
```typescript
// src/main/services/settings.service.ts
import { app, safeStorage } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

interface AppSettings {
  ai: {
    provider: string;
    model: string;
    hasApiKey: boolean; // Never expose actual key in settings
  };
  soc: {
    enabled: boolean;
    endpoint: string;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    hasApiKey: false,
  },
  soc: {
    enabled: true,
    endpoint: '',
  },
};

export interface ISettingsService {
  getApiKey(): Promise<string | null>;
  setApiKey(apiKey: string): Promise<void>;
  removeApiKey(): Promise<void>;
  hasApiKey(): Promise<boolean>;
  getSettings(): Promise<AppSettings>;
  updateSettings(updates: Partial<AppSettings>): Promise<void>;
}

export class SettingsService implements ISettingsService {
  private settingsPath: string;
  private apiKeyPath: string;
  private settings: AppSettings | null = null;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.apiKeyPath = path.join(userDataPath, '.api-key');
  }

  async getApiKey(): Promise<string | null> {
    try {
      // Check if encryption is available
      if (!safeStorage.isEncryptionAvailable()) {
        console.warn('Encryption not available. API key storage may be insecure.');
      }

      const encryptedKey = await fs.readFile(this.apiKeyPath);
      const decryptedKey = safeStorage.decryptString(encryptedKey);
      return decryptedKey;
    } catch (error) {
      // File doesn't exist or decryption failed
      return null;
    }
  }

  async setApiKey(apiKey: string): Promise<void> {
    // Validate API key format (basic validation)
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('Invalid API key format');
    }

    // Anthropic keys typically start with 'sk-ant-'
    if (!apiKey.startsWith('sk-ant-')) {
      throw new Error('Invalid Anthropic API key format. Key should start with "sk-ant-"');
    }

    // Encrypt and store
    const encryptedKey = safeStorage.encryptString(apiKey);
    await fs.writeFile(this.apiKeyPath, encryptedKey);

    // Update settings to indicate key is present
    const settings = await this.getSettings();
    settings.ai.hasApiKey = true;
    await this.saveSettings(settings);
  }

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

  async hasApiKey(): Promise<boolean> {
    try {
      await fs.access(this.apiKeyPath);
      return true;
    } catch {
      return false;
    }
  }

  async getSettings(): Promise<AppSettings> {
    if (this.settings) {
      return { ...this.settings };
    }

    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(data) };

      // Check if API key exists
      this.settings.ai.hasApiKey = await this.hasApiKey();

      return { ...this.settings };
    } catch {
      // File doesn't exist, use defaults
      this.settings = { ...DEFAULT_SETTINGS };
      this.settings.ai.hasApiKey = await this.hasApiKey();
      return { ...this.settings };
    }
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    const settings = await this.getSettings();

    // Deep merge updates
    if (updates.ai) {
      settings.ai = { ...settings.ai, ...updates.ai };
    }
    if (updates.soc) {
      settings.soc = { ...settings.soc, ...updates.soc };
    }

    await this.saveSettings(settings);
  }

  private async saveSettings(settings: AppSettings): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.settingsPath);
    await fs.mkdir(dir, { recursive: true });

    // Write settings (never include actual API key)
    const settingsToSave = {
      ...settings,
      ai: {
        ...settings.ai,
        hasApiKey: settings.ai.hasApiKey, // Only boolean, never the key itself
      },
    };

    await fs.writeFile(this.settingsPath, JSON.stringify(settingsToSave, null, 2));
    this.settings = settings;
  }
}

export const settingsService = new SettingsService();
```

#### IPC Handlers for AI Service

**Location:** `src/main/ipc/ai-handlers.ts`

```typescript
// src/main/ipc/ai-handlers.ts
import { ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/constants/ipc-channels';
import { aiService } from '@main/services/ai.service';
import { settingsService } from '@main/services/settings.service';
import { windowManager } from '@main/window-manager';

export function registerAIHandlers(): void {
  // Initialize AI service
  ipcMain.handle(IPC_CHANNELS.AI_INITIALIZE, async () => {
    try {
      const apiKey = await settingsService.getApiKey();

      if (!apiKey) {
        return {
          success: false,
          error: 'No API key configured. Please add your Anthropic API key in settings.',
        };
      }

      const settings = await settingsService.getSettings();

      await aiService.initialize({
        apiKey,
        model: settings.ai.model,
        socEndpoint: settings.soc.endpoint,
      });

      return {
        success: true,
        status: aiService.getStatus(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize AI service',
      };
    }
  });

  // Send message (non-streaming)
  ipcMain.handle(
    IPC_CHANNELS.AI_SEND_MESSAGE,
    async (_, message: string, options?: { conversationId?: string; systemPrompt?: string }) => {
      try {
        const response = await aiService.sendMessage(message, options);
        return { success: true, data: response };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send message',
        };
      }
    }
  );

  // Stream message (streaming)
  ipcMain.handle(
    IPC_CHANNELS.AI_STREAM_MESSAGE,
    async (
      event,
      message: string,
      options?: { conversationId?: string; systemPrompt?: string }
    ) => {
      const mainWindow = windowManager.getMainWindow();
      if (!mainWindow) {
        return { success: false, error: 'No window available' };
      }

      try {
        await aiService.streamMessage(
          message,
          {
            onToken: (token) => {
              // Send token to renderer
              mainWindow.webContents.send(IPC_CHANNELS.AI_STREAM_TOKEN, token);
            },
            onComplete: (fullResponse) => {
              // Send completion signal
              mainWindow.webContents.send(IPC_CHANNELS.AI_STREAM_COMPLETE, fullResponse);
            },
            onError: (error) => {
              // Send error
              mainWindow.webContents.send(IPC_CHANNELS.AI_STREAM_ERROR, error.message);
            },
          },
          options
        );

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to stream message',
        };
      }
    }
  );

  // Cancel current request
  ipcMain.handle(IPC_CHANNELS.AI_CANCEL, async () => {
    aiService.cancelCurrentRequest();
    return { success: true };
  });

  // Get AI status
  ipcMain.handle(IPC_CHANNELS.AI_STATUS, async () => {
    return { success: true, status: aiService.getStatus() };
  });

  // API Key management
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_API_KEY_STATUS, async () => {
    const hasKey = await settingsService.hasApiKey();
    return { success: true, hasApiKey: hasKey };
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET_API_KEY, async (_, apiKey: string) => {
    try {
      await settingsService.setApiKey(apiKey);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save API key',
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_REMOVE_API_KEY, async () => {
    try {
      await settingsService.removeApiKey();
      await aiService.shutdown();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove API key',
      };
    }
  });

  // Get settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => {
    try {
      const settings = await settingsService.getSettings();
      return { success: true, settings };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get settings',
      };
    }
  });

  // Update settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE, async (_, updates: Record<string, unknown>) => {
    try {
      await settingsService.updateSettings(updates);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update settings',
      };
    }
  });
}
```

#### IPC Channels Constants

**Location:** `src/shared/constants/ipc-channels.ts` (additions)

```typescript
// src/shared/constants/ipc-channels.ts (additions to existing file)
export const IPC_CHANNELS = {
  // Existing from Epic 1...
  FS_READ_DIRECTORY: 'fs:read-directory',
  FS_READ_FILE: 'fs:read-file',
  FS_WRITE_FILE: 'fs:write-file',
  // ... other existing channels

  // AI Service (Feature 2.1)
  AI_INITIALIZE: 'ai:initialize',
  AI_SEND_MESSAGE: 'ai:send-message',
  AI_STREAM_MESSAGE: 'ai:stream-message',
  AI_STREAM_TOKEN: 'ai:stream-token',        // Event: renderer receives tokens
  AI_STREAM_COMPLETE: 'ai:stream-complete',  // Event: stream completed
  AI_STREAM_ERROR: 'ai:stream-error',        // Event: stream error
  AI_CANCEL: 'ai:cancel',
  AI_STATUS: 'ai:status',

  // Settings (Feature 2.1)
  SETTINGS_GET: 'settings:get',
  SETTINGS_UPDATE: 'settings:update',
  SETTINGS_GET_API_KEY_STATUS: 'settings:get-api-key-status',
  SETTINGS_SET_API_KEY: 'settings:set-api-key',
  SETTINGS_REMOVE_API_KEY: 'settings:remove-api-key',
} as const;
```

#### Renderer IPC Service (additions)

**Location:** `src/renderer/services/ipc.service.ts` (additions)

```typescript
// src/renderer/services/ipc.service.ts (additions)

// AI Service methods
async initializeAI(): Promise<{ success: boolean; status?: AIStatus; error?: string }> {
  return window.electron.invoke(IPC_CHANNELS.AI_INITIALIZE);
}

async sendMessage(
  message: string,
  options?: { conversationId?: string; systemPrompt?: string }
): Promise<{ success: boolean; data?: string; error?: string }> {
  return window.electron.invoke(IPC_CHANNELS.AI_SEND_MESSAGE, message, options);
}

async streamMessage(
  message: string,
  options?: { conversationId?: string; systemPrompt?: string }
): Promise<{ success: boolean; error?: string }> {
  return window.electron.invoke(IPC_CHANNELS.AI_STREAM_MESSAGE, message, options);
}

async cancelAIRequest(): Promise<{ success: boolean }> {
  return window.electron.invoke(IPC_CHANNELS.AI_CANCEL);
}

async getAIStatus(): Promise<{ success: boolean; status?: AIStatus }> {
  return window.electron.invoke(IPC_CHANNELS.AI_STATUS);
}

// Stream event listeners
onStreamToken(callback: (token: string) => void): () => void {
  return window.electron.on(IPC_CHANNELS.AI_STREAM_TOKEN, callback);
}

onStreamComplete(callback: (fullResponse: string) => void): () => void {
  return window.electron.on(IPC_CHANNELS.AI_STREAM_COMPLETE, callback);
}

onStreamError(callback: (error: string) => void): () => void {
  return window.electron.on(IPC_CHANNELS.AI_STREAM_ERROR, callback);
}

// Settings methods
async getSettings(): Promise<{ success: boolean; settings?: AppSettings; error?: string }> {
  return window.electron.invoke(IPC_CHANNELS.SETTINGS_GET);
}

async updateSettings(
  updates: Partial<AppSettings>
): Promise<{ success: boolean; error?: string }> {
  return window.electron.invoke(IPC_CHANNELS.SETTINGS_UPDATE, updates);
}

async hasApiKey(): Promise<{ success: boolean; hasApiKey: boolean }> {
  return window.electron.invoke(IPC_CHANNELS.SETTINGS_GET_API_KEY_STATUS);
}

async setApiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  return window.electron.invoke(IPC_CHANNELS.SETTINGS_SET_API_KEY, apiKey);
}

async removeApiKey(): Promise<{ success: boolean; error?: string }> {
  return window.electron.invoke(IPC_CHANNELS.SETTINGS_REMOVE_API_KEY);
}
```

### Data Models

**Location:** `src/shared/types/ai.types.ts`

```typescript
// src/shared/types/ai.types.ts

export interface AIStatus {
  initialized: boolean;
  provider: string | null;
  model: string | null;
  error: string | null;
}

export interface AIConfig {
  provider: string;
  model: string;
  hasApiKey: boolean;
}

export interface SOCConfig {
  enabled: boolean;
  endpoint: string;
}

export interface AppSettings {
  ai: AIConfig;
  soc: SOCConfig;
}

export interface AIServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StreamOptions {
  conversationId?: string;
  systemPrompt?: string;
}
```

### Security Considerations

**API Key Security:**
1. **Encryption**: API keys encrypted using Electron safeStorage (OS-level encryption)
2. **Never logged**: API key never appears in console.log, file logs, or error messages
3. **Never in renderer**: API key never sent to renderer process; only boolean `hasApiKey`
4. **IPC whitelist**: Only approved IPC channels exposed via contextBridge
5. **Memory cleanup**: API key cleared from memory on shutdown

**IPC Security:**
1. **Channel whitelist**: New AI channels added to preload whitelist
2. **Input validation**: All inputs validated in main process handlers
3. **Error sanitization**: Error messages never include API key or sensitive data

**Preload Script Updates:**
```typescript
// src/preload/index.ts (additions)
const allowedChannels = [
  // Existing channels...
  IPC_CHANNELS.AI_INITIALIZE,
  IPC_CHANNELS.AI_SEND_MESSAGE,
  IPC_CHANNELS.AI_STREAM_MESSAGE,
  IPC_CHANNELS.AI_CANCEL,
  IPC_CHANNELS.AI_STATUS,
  IPC_CHANNELS.SETTINGS_GET,
  IPC_CHANNELS.SETTINGS_UPDATE,
  IPC_CHANNELS.SETTINGS_GET_API_KEY_STATUS,
  IPC_CHANNELS.SETTINGS_SET_API_KEY,
  IPC_CHANNELS.SETTINGS_REMOVE_API_KEY,
];

const allowedEventChannels = [
  IPC_CHANNELS.AI_STREAM_TOKEN,
  IPC_CHANNELS.AI_STREAM_COMPLETE,
  IPC_CHANNELS.AI_STREAM_ERROR,
];
```

---

## Implementation Approach

### Wave Breakdown

This feature will be implemented in **1 wave** with clear milestones.

#### Wave 2.1.1: AIChatSDK Integration and Configuration

**Duration:** 5 days
**Goal:** Complete AI service layer with secure API key management and SOC logging

**Milestones:**

| Day | Milestone | Deliverables |
|-----|-----------|--------------|
| 1 | AIChatSDK Import | AIChatSDK imported, TypeScript paths configured, basic instantiation working |
| 2 | AIService Implementation | AIService class complete with initialize, sendMessage, streamMessage |
| 3 | API Key Security | SettingsService with safeStorage, secure API key storage/retrieval |
| 4 | IPC Integration | All IPC handlers registered, renderer service methods complete |
| 5 | Testing & SOC | Integration testing, SOC logging verification, error handling validation |

### User Stories

**Story 2.1.1: AI Service Initialization**
- **As a** developer
- **I want** the AI service to initialize when I start the application
- **So that** I can interact with AI when I need it
- **Acceptance Criteria:**
  - [x] Application checks for API key on startup
  - [x] If API key exists, AI service initializes automatically
  - [x] If no API key, appropriate message displayed (no crash)
  - [x] Initialization status available via IPC

**Story 2.1.2: Secure API Key Storage**
- **As a** developer
- **I want** my API key stored securely
- **So that** my credentials are protected
- **Acceptance Criteria:**
  - [x] API key encrypted using Electron safeStorage
  - [x] API key never appears in logs
  - [x] API key never sent to renderer process
  - [x] API key persists across application restarts
  - [x] Can remove API key from settings

**Story 2.1.3: Claude Communication**
- **As a** developer
- **I want** to send messages to Claude and receive responses
- **So that** I can interact with AI for codebase assistance
- **Acceptance Criteria:**
  - [x] Can send message and receive response
  - [x] Streaming responses work (receive tokens progressively)
  - [x] Can cancel ongoing request
  - [x] All requests logged to SOC

**Story 2.1.4: Error Handling**
- **As a** developer
- **I want** clear error messages when AI communication fails
- **So that** I can understand and fix issues
- **Acceptance Criteria:**
  - [x] Invalid API key shows clear message
  - [x] Rate limiting shows clear message with retry guidance
  - [x] Network errors show clear message
  - [x] Timeout errors show clear message
  - [x] No raw error objects exposed to UI

### Technical Implementation Steps

**Step 1: AIChatSDK Import Setup**
```bash
# Add AIChatSDK to tsconfig paths
# In tsconfig.json:
{
  "compilerOptions": {
    "paths": {
      "AIChatSDK": ["../AIChatSDK/src"],
      "AIChatSDK/*": ["../AIChatSDK/src/*"]
    }
  }
}

# Configure Vite to resolve path
# In electron.vite.config.ts:
{
  main: {
    resolve: {
      alias: {
        'AIChatSDK': resolve(__dirname, '../AIChatSDK/src')
      }
    }
  }
}
```

**Step 2: Create AIService**
- Create `src/main/services/ai.service.ts`
- Implement IAIService interface
- Add initialization, messaging, streaming methods
- Implement error formatting

**Step 3: Create SettingsService**
- Create `src/main/services/settings.service.ts`
- Implement safeStorage integration
- Implement settings persistence
- Ensure API key never logged

**Step 4: Create IPC Handlers**
- Create `src/main/ipc/ai-handlers.ts`
- Register all AI and settings handlers
- Update main process to call registerAIHandlers()

**Step 5: Update Shared Types**
- Create `src/shared/types/ai.types.ts`
- Update `src/shared/constants/ipc-channels.ts`

**Step 6: Update Preload Script**
- Add new channels to whitelist
- Add event channel whitelist

**Step 7: Update Renderer IPC Service**
- Add AI and settings methods to ipc.service.ts

**Step 8: Integration Testing**
- Test API key storage/retrieval
- Test message send/receive
- Test streaming
- Verify SOC logging
- Test all error scenarios

---

## Testing Strategy

### Unit Testing

**AIService Tests:**
```typescript
// src/main/services/__tests__/ai.service.test.ts
describe('AIService', () => {
  describe('initialize', () => {
    it('should initialize with valid API key', async () => {});
    it('should fail with invalid API key', async () => {});
    it('should set correct status after initialization', async () => {});
  });

  describe('sendMessage', () => {
    it('should throw if not initialized', async () => {});
    it('should return response for valid message', async () => {});
    it('should handle API errors gracefully', async () => {});
  });

  describe('streamMessage', () => {
    it('should emit tokens progressively', async () => {});
    it('should call onComplete with full response', async () => {});
    it('should handle cancellation', async () => {});
  });

  describe('formatError', () => {
    it('should format authentication errors', () => {});
    it('should format rate limit errors', () => {});
    it('should format network errors', () => {});
  });
});
```

**SettingsService Tests:**
```typescript
// src/main/services/__tests__/settings.service.test.ts
describe('SettingsService', () => {
  describe('API Key Management', () => {
    it('should encrypt API key on save', async () => {});
    it('should decrypt API key on retrieve', async () => {});
    it('should validate API key format', async () => {});
    it('should remove API key', async () => {});
  });

  describe('Settings Persistence', () => {
    it('should save settings to disk', async () => {});
    it('should load settings from disk', async () => {});
    it('should use defaults when no file exists', async () => {});
  });
});
```

**Test Coverage Target:** 80% for services

### Integration Testing

**IPC Integration Tests:**
- Test AI initialization flow end-to-end
- Test message send/receive through IPC
- Test streaming through IPC events
- Test settings persistence across restarts

**AIChatSDK Integration Tests:**
- Test actual Claude API communication (requires test API key)
- Verify SOC logging captures all requests
- Test rate limit handling with actual API

### Manual Testing Checklist

**API Key Setup Flow:**
- [ ] Start app with no API key configured
- [ ] App does not crash, shows appropriate message
- [ ] Can enter API key via future settings UI (or via direct IPC call for testing)
- [ ] Invalid API key format rejected with clear message
- [ ] Valid API key encrypted and stored
- [ ] App restart: API key persists, AI initializes

**AI Communication:**
- [ ] Send simple message, receive response
- [ ] Response displays correctly (for now, log to console)
- [ ] Streaming tokens arrive progressively
- [ ] Cancel request stops streaming

**Error Scenarios:**
- [ ] Invalid API key: Clear error message
- [ ] Network disconnected: Clear error message
- [ ] Rate limited: Clear error message with retry guidance
- [ ] Request timeout: Clear error message

**Security Verification:**
- [ ] API key not in any log files
- [ ] API key not accessible from renderer process
- [ ] API key not visible in Electron DevTools

**SOC Logging:**
- [ ] All AI requests logged
- [ ] All AI responses logged
- [ ] Request metadata included (timestamp, model)

---

## Acceptance Criteria

### Functional Acceptance Criteria

- [ ] AIChatSDK imported successfully from local path
- [ ] AIService initializes with valid API key
- [ ] Claude provider configured and communicating
- [ ] API keys stored securely (encrypted with safeStorage)
- [ ] API key never appears in logs or renderer
- [ ] Settings persist across application restarts
- [ ] Messages can be sent and responses received
- [ ] Streaming responses work with progressive token delivery
- [ ] Requests can be cancelled mid-stream
- [ ] SOC logging captures all AI requests/responses
- [ ] Clear error messages for authentication failures
- [ ] Clear error messages for rate limiting
- [ ] Clear error messages for network errors
- [ ] IPC handlers registered and functional
- [ ] Renderer can interact with AI service via IPC

### Non-Functional Acceptance Criteria

- [ ] AI initialization completes in < 3 seconds
- [ ] IPC message latency < 50ms
- [ ] Streaming tokens arrive within 100ms of generation
- [ ] No memory leaks during extended streaming
- [ ] Graceful shutdown cleans up all resources

---

## Dependencies and Risks

### Dependencies

**Prerequisites (must complete before this Feature):**
- Epic 1 Complete (Desktop foundation with IPC layer)
- AIChatSDK available at `../AIChatSDK`
- Anthropic API key for testing (developer-provided)

**Enables (this Feature enables):**
- Feature 2.2: Chat Interface and Streaming (requires working AI communication)
- Feature 2.3: Tool Framework and Permissions (requires AI service foundation)
- All Epic 3 features: File operation tools use this AI service

**External Dependencies:**
- **AIChatSDK**: Local clone from Lighthouse
  - Status: Available (Lighthouse owned)
  - Impact if unavailable: Critical blocker
  - Mitigation: Guaranteed availability (internal project)
- **Anthropic Claude API**: Required for AI communication
  - Status: Available (developers provide API keys)
  - Impact if unavailable: Cannot test AI features
  - Mitigation: Clear setup documentation, test with mock in unit tests
- **Electron safeStorage**: Required for API key encryption
  - Status: Available (built into Electron)
  - Impact if unavailable: Cannot secure API keys
  - Mitigation: Electron stable technology

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **AIChatSDK Electron compatibility** | High | Low | Test early in Day 1; local clone allows modification if needed |
| **safeStorage not available on all platforms** | Medium | Low | Check `isEncryptionAvailable()` and warn user; still store key (less secure) |
| **API key validation fails silently** | Medium | Medium | Validate API key format before storage; test connection on save |
| **SOC endpoint configuration issues** | Low | Medium | Make SOC optional; log locally if endpoint unavailable |
| **TypeScript path resolution for AIChatSDK** | Medium | Medium | Test early; configure both tsconfig and Vite paths |

---

## Integration Points

### Integration with Epic 1 Components

| Component | Integration Description |
|-----------|------------------------|
| **IPC Layer** | Extend with new AI and settings channels |
| **Window Manager** | Get main window for sending stream events |
| **Main Process Index** | Register AI handlers on app startup |
| **Preload Script** | Whitelist new IPC channels |

### Integration with Feature 2.2 (Chat Interface)

- Chat UI will call `ipcService.sendMessage()` and `ipcService.streamMessage()`
- Chat UI will subscribe to stream events via `onStreamToken()`, etc.
- AI status will be displayed in chat panel header

### Integration with Feature 2.3 (Tool Framework)

- Tool execution service will use AIService for tool calling
- Permission results will be sent back to AI via AIService

### External Integrations

| System | Integration Type | Data Flow |
|--------|-----------------|-----------|
| **Anthropic Claude** | API calls via AIChatSDK | Request/response via HTTPS |
| **Lighthouse SOC** | Logging via AIChatSDK | All AI operations logged |

---

## Definition of Done

- [ ] All functional acceptance criteria met
- [ ] All non-functional acceptance criteria met
- [ ] Unit tests written and passing (80% coverage for services)
- [ ] Integration tests written and passing
- [ ] Manual testing checklist completed
- [ ] Code reviewed and approved
- [ ] No TypeScript errors in strict mode
- [ ] ESLint passes with zero errors
- [ ] Security audit: API key never in logs
- [ ] Documentation updated (inline code comments)
- [ ] IPC channel reference updated
- [ ] Ready for Feature 2.2 (Chat Interface) to begin

---

## Related Documentation

### Architecture Decision Records

- [ADR-006: AIChatSDK Integration Approach](../../architecture/decisions/ADR-006-aichatsdk-integration-approach.md) - Import as local module, wrap in service layer
- [ADR-007: Conversation Storage Strategy](../../architecture/decisions/ADR-007-conversation-storage-strategy.md) - Context for conversation persistence (Feature 2.2)

### Related Documents

| Document | Purpose |
|----------|---------|
| [Epic 2 Master Plan](./epic-2-ai-integration-master-plan.md) | Epic overview and feature breakdown |
| [Epic 2 Detailed Plan](./epic-2-ai-integration-aichatsdk.md) | Technical specifications for Epic 2 |
| [System Architecture](../../architecture/_main/04-Architecture.md) | Overall system architecture |
| [Business Requirements](../../architecture/_main/03-Business-Requirements.md) | FR-4, FR-5, FR-10 requirements |
| [Product Vision](../../architecture/_main/01-Product-Vision.md) | AI Ethics principles |

---

## Appendix A: Error Message Reference

| Error Code | User Message | Technical Cause |
|------------|--------------|-----------------|
| AUTH_FAILED | "Invalid API key. Please check your Anthropic API key and try again." | HTTP 401 from Anthropic |
| RATE_LIMITED | "Rate limit exceeded. Please wait a moment before trying again." | HTTP 429 from Anthropic |
| NETWORK_ERROR | "Network error. Please check your internet connection." | ENOTFOUND, network timeout |
| TIMEOUT | "Request timed out. Please try again." | Request exceeded timeout |
| NOT_INITIALIZED | "AI service not initialized. Please configure your API key." | sendMessage called before initialize |
| INVALID_KEY_FORMAT | "Invalid Anthropic API key format. Key should start with 'sk-ant-'" | API key doesn't match expected format |

## Appendix B: IPC Channel Reference

| Channel | Direction | Description | Parameters |
|---------|-----------|-------------|------------|
| `ai:initialize` | Request | Initialize AI service | None |
| `ai:send-message` | Request | Send non-streaming message | message: string, options?: StreamOptions |
| `ai:stream-message` | Request | Start streaming message | message: string, options?: StreamOptions |
| `ai:stream-token` | Event | Token received during stream | token: string |
| `ai:stream-complete` | Event | Stream completed | fullResponse: string |
| `ai:stream-error` | Event | Stream error | error: string |
| `ai:cancel` | Request | Cancel current request | None |
| `ai:status` | Request | Get AI service status | None |
| `settings:get` | Request | Get all settings | None |
| `settings:update` | Request | Update settings | updates: Partial<AppSettings> |
| `settings:get-api-key-status` | Request | Check if API key exists | None |
| `settings:set-api-key` | Request | Store API key | apiKey: string |
| `settings:remove-api-key` | Request | Remove API key | None |

---

**Feature Owner:** Roy Love
**Created Date:** 2026-01-19
**Last Updated:** 2026-01-20
**Status:** COMPLETE
**Next Review:** N/A - Feature complete
