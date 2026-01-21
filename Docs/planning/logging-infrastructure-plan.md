# Logging Infrastructure Implementation Plan

## Overview
Replace console-based logging with electron-log library to provide professional logging infrastructure with file persistence, log rotation, and configurable log levels.

## Goals
1. Implement electron-log across main process services
2. Replace all console.log/error/warn calls in critical services with proper logging
3. Enable configurable log levels with runtime control
4. Provide file logging with automatic rotation
5. Maintain existing `[ServiceName]` prefix convention

## Technical Approach

### Library Choice: electron-log
- **Zero dependencies**, Electron-native design
- Built-in file rotation and log management
- Automatic path management via Electron's userData
- Multiple transport support (file, console, remote)
- TypeScript types included
- Performance: <1ms per log entry, ~2-3MB memory overhead

### Log Levels Strategy
```
DEBUG   - Detailed diagnostic information
INFO    - General informational messages
WARN    - Warning messages for potential issues
ERROR   - Error conditions
```

**Default configuration:**
- Development: All levels (DEBUG, INFO, WARN, ERROR) to console + file
- Can be changed at runtime via settings or environment variable

### File Storage
```
~/Library/Application Support/lighthouse-beacon/logs/
├── lighthouse-main.log       (main process logs)
├── lighthouse-main-2026-01-21.log  (rotated logs)
└── lighthouse-main-2026-01-20.log
```

**Rotation settings:**
- Max file size: 50MB
- Retention: 7 days of logs
- Format: `[YYYY-MM-DD HH:mm:ss.SSS] [LEVEL] [Context] Message {data}`

### Service Integration Pattern

**Initialize logger once in main process:**
```typescript
import log from 'electron-log';

// Configure on app startup
log.transports.file.level = process.env.LOG_LEVEL || 'debug';
log.transports.console.level = process.env.LOG_LEVEL || 'debug';
log.transports.file.fileName = 'lighthouse-main.log';
log.transports.file.maxSize = 50 * 1024 * 1024; // 50MB

export const logger = log;
```

**Usage in services:**
```typescript
import { logger } from '@main/logger';

// Replace:
console.log('[AIService] Initialize called with config:', config);

// With:
logger.info('[AIService] Initialize called with config', { config });

// Replace:
console.error('[AIService] Initialization failed:', error);

// With:
logger.error('[AIService] Initialization failed', { error: error.message, stack: error.stack });
```

## Implementation Steps

### Step 1: Install electron-log
```bash
npm install electron-log
```

### Step 2: Create Logger Module
**File: `/src/main/logger.ts`**
```typescript
import log from 'electron-log';
import { app } from 'electron';
import path from 'path';

/**
 * Initialize and configure electron-log for main process
 */
export function initializeLogger(): void {
  // Configure file transport
  log.transports.file.level = (process.env.LOG_LEVEL as any) || 'debug';
  log.transports.file.fileName = 'lighthouse-main.log';
  log.transports.file.maxSize = 50 * 1024 * 1024; // 50MB

  // Configure console transport
  log.transports.console.level = (process.env.LOG_LEVEL as any) || 'debug';
  log.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

  // Set log file path
  const userDataPath = app.getPath('userData');
  const logPath = path.join(userDataPath, 'logs');
  log.transports.file.resolvePathFn = () => path.join(logPath, log.transports.file.fileName);

  // Log startup
  logger.info('[Logger] Initialized', {
    logPath,
    fileLevel: log.transports.file.level,
    consoleLevel: log.transports.console.level,
  });
}

/**
 * Set log level at runtime
 */
export function setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
  log.transports.file.level = level;
  log.transports.console.level = level;
  logger.info('[Logger] Log level changed', { level });
}

/**
 * Get current log configuration
 */
export function getLogConfig() {
  return {
    fileLevel: log.transports.file.level,
    consoleLevel: log.transports.console.level,
    filePath: log.transports.file.getFile()?.path,
  };
}

// Export configured logger
export const logger = log;
```

### Step 3: Initialize Logger in Main Process
**File: `/src/main/index.ts`** (modify existing file)

Add at the top after imports:
```typescript
import { initializeLogger, logger } from './logger';

// Initialize logger before app ready
initializeLogger();
```

Replace existing uncaught exception handlers:
```typescript
// Replace:
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// With:
process.on('uncaughtException', (error) => {
  logger.error('[Process] Uncaught Exception', { error: error.message, stack: error.stack });
});
```

### Step 4: Update AIService
**File: `/src/main/services/AIService.ts`**

Replace all 9 console calls:
```typescript
import { logger } from '@main/logger';

// Line 74-79: Replace initialization log
logger.info('[AIService] Initialize called with config', {
  model: config.model || 'claude-3-sonnet-20240229',
  socEndpoint: config.socEndpoint || 'not configured',
  hasApiKey: !!config.apiKey,
});

// Line 111: Replace success log
logger.info('[AIService] Successfully initialized AIChatSDK');

// Line 113-114: Replace error log
logger.error('[AIService] Initialization failed', {
  error: error instanceof Error ? error.message : 'Unknown error',
  stack: error instanceof Error ? error.stack : undefined,
});

// Line 158-162: Replace response log
logger.debug('[AIService] Received response from AIChatSDK', {
  contentLength: response.content.length,
  usage: response.usage,
});

// Line 213-214: Replace abort log
logger.debug('[AIService] Stream aborted by user');

// Line 230-233: Replace stream complete log
logger.debug('[AIService] Stream complete', {
  totalLength: fullResponse.length,
});

// Line 239-240: Replace cancel log
logger.debug('[AIService] Stream cancelled');

// Line 275-276: Replace shutdown success log
logger.info('[AIService] Successfully shut down AIChatSDK');

// Line 278: Replace shutdown error log
logger.error('[AIService] Error during shutdown', { error });
```

### Step 5: Update PermissionService
**File: `/src/main/services/PermissionService.ts`**

Replace all 20 console calls with appropriate log levels:
- Initialization: `logger.info()`
- Permission decisions: `logger.info()` or `logger.debug()`
- Errors: `logger.error()`
- Warnings (timeout, invalid): `logger.warn()`

Example:
```typescript
import { logger } from '@main/logger';

// Initialization (line ~47)
logger.info('[PermissionService] Initialized with persisted permissions', {
  permissionCount: this.permissions.size,
});

// Auto-approval (line ~112)
logger.info('[PermissionService] Auto-approved', { toolName, reason: 'always-allow permission' });

// Timeout (line ~182)
logger.warn('[PermissionService] Permission request timeout', {
  toolName,
  requestId,
  timeoutMs: timeout,
});

// Save error (line ~243)
logger.error('[PermissionService] Failed to save permissions', {
  error: error instanceof Error ? error.message : 'Unknown error',
});
```

### Step 6: Update ToolExecutionService
**File: `/src/main/services/ToolExecutionService.ts`**

Replace all 5 console calls:
```typescript
import { logger } from '@main/logger';

// Execution start
logger.info('[ToolExecutionService] Executing tool', { toolName, parameters });

// Permission denied
logger.warn('[ToolExecutionService] Permission denied', { toolName });

// Execution complete
logger.info('[ToolExecutionService] Completed tool', {
  toolName,
  duration: `${duration}ms`,
  success: true,
});

// Execution error
logger.error('[ToolExecutionService] Tool execution failed', {
  toolName,
  error: error.message,
  stack: error.stack,
});
```

### Step 7: Update IPC Handlers
**Files: `/src/main/ipc/aiHandlers.ts`, `/src/main/ipc/toolHandlers.ts`**

Replace console logs with logger:
```typescript
import { logger } from '@main/logger';

// Handler registration
logger.info('[AI Handlers] AI and settings IPC handlers registered');

// Initialization errors (line ~90 in aiHandlers.ts)
logger.error('[AI Handlers] Initialization error', {
  error: error instanceof Error ? error.message : 'Unknown error',
});
```

### Step 8: Update ToolRegistry
**File: `/src/main/services/ToolRegistry.ts`**

Replace 2 console calls:
```typescript
import { logger } from '@main/logger';

logger.debug('[ToolRegistry] Registered tool', { toolName: tool.name });
logger.debug('[ToolRegistry] Cleared all tools');
```

### Step 9: Update Tool Implementations
**Files in `/src/main/tools/`** (ReadTool, WriteTool, EditTool, DeleteTool, BashTool, GlobTool, GrepTool)

Replace console logs with appropriate levels:
- Success operations: `logger.debug()` (low noise)
- Important operations: `logger.info()` (file writes, deletions)
- Errors: `logger.error()`

Example from WriteTool:
```typescript
import { logger } from '@main/logger';

logger.info('[WriteTool] Created parent directories for', { path: filePath });
logger.error('[WriteTool] Execution error', { error: error.message });
```

### Step 10: Add Log Level Configuration to Settings
**File: `/src/shared/types/ai.types.ts`** (add to AppSettings)

```typescript
export interface AppSettings {
  ai: AIConfig;
  soc: SOCConfig;
  logging: LoggingConfig; // NEW
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableFileLogging: boolean;
  enableConsoleLogging: boolean;
}
```

**File: `/src/main/services/SettingsService.ts`** (update defaults)

```typescript
private defaultSettings: AppSettings = {
  ai: { ... },
  soc: { ... },
  logging: {
    level: 'debug',
    enableFileLogging: true,
    enableConsoleLogging: true,
  },
};
```

### Step 11: Add IPC Handler for Log Level Changes
**File: `/src/main/ipc/aiHandlers.ts`** (add new handler)

```typescript
import { setLogLevel, getLogConfig } from '@main/logger';

ipcMain.handle(IPC_CHANNELS.SETTINGS_SET_LOG_LEVEL, async (_event, level: string): Promise<Result<void>> => {
  try {
    setLogLevel(level as any);
    return { success: true, data: undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to set log level'),
    };
  }
});

ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_LOG_CONFIG, async (): Promise<Result<any>> => {
  return { success: true, data: getLogConfig() };
});
```

**File: `/src/shared/types/ipc.types.ts`** (add new channels)

```typescript
export const IPC_CHANNELS = {
  // ... existing channels
  SETTINGS_SET_LOG_LEVEL: 'settings:set-log-level',
  SETTINGS_GET_LOG_CONFIG: 'settings:get-log-config',
} as const;
```

### Step 12: Remove ESLint Disable Comments
After replacing all console calls, remove all:
```typescript
// eslint-disable-next-line no-console
```
Comments are no longer needed since we're using the proper logger.

## Files to Modify

### New Files (1)
1. `/src/main/logger.ts` - Logger initialization and configuration module

### Modified Files (17)
1. `/src/main/index.ts` - Initialize logger, replace uncaught exception handlers
2. `/src/main/services/AIService.ts` - Replace 9 console calls
3. `/src/main/services/PermissionService.ts` - Replace 20 console calls
4. `/src/main/services/ToolExecutionService.ts` - Replace 5 console calls
5. `/src/main/services/ToolRegistry.ts` - Replace 2 console calls
6. `/src/main/services/SettingsService.ts` - Add logging config defaults
7. `/src/main/ipc/aiHandlers.ts` - Replace 3 console calls, add log level handlers
8. `/src/main/ipc/toolHandlers.ts` - Replace 3 console calls
9. `/src/main/tools/ReadTool.ts` - Replace console calls
10. `/src/main/tools/WriteTool.ts` - Replace console calls
11. `/src/main/tools/EditTool.ts` - Replace console calls
12. `/src/main/tools/DeleteTool.ts` - Replace console calls
13. `/src/main/tools/BashTool.ts` - Replace console calls
14. `/src/main/tools/GlobTool.ts` - Replace console calls
15. `/src/main/tools/GrepTool.ts` - Replace console calls
16. `/src/shared/types/ai.types.ts` - Add LoggingConfig interface
17. `/src/shared/types/ipc.types.ts` - Add log level IPC channels
18. `package.json` - Add electron-log dependency

## Verification Steps

### 1. Install and Build
```bash
npm install
npm run dev
```

### 2. Verify Log Files Created
```bash
# Check log directory exists
ls -la ~/Library/Application\ Support/lighthouse-beacon/logs/

# Should see:
# lighthouse-main.log
```

### 3. Verify Log Output
```bash
# Tail the log file
tail -f ~/Library/Application\ Support/lighthouse-beacon/logs/lighthouse-main.log

# Should see logs like:
# [2026-01-21 07:30:00.123] [info] [Logger] Initialized {"logPath":"...","fileLevel":"debug"}
# [2026-01-21 07:30:01.456] [info] [AIService] Initialize called with config {"model":"claude-3-sonnet-20240229"}
```

### 4. Test Log Levels
In the application:
- Change log level via settings (once UI is added)
- Or set environment variable: `LOG_LEVEL=error npm run dev`
- Verify only ERROR level logs appear

### 5. Verify Console Output
Console should show same logs as file, with timestamp and level formatting.

### 6. Test Log Rotation
Create large log file to trigger rotation:
```bash
# Generate lots of logs (stress test)
# After 50MB, should see rotation to dated file
```

### 7. Verify Service Operations
- Initialize AI service → should see info logs
- Execute tools → should see debug/info logs
- Trigger errors → should see error logs with stack traces
- Grant/deny permissions → should see permission logs

### 8. Test Error Scenarios
- Initialize without API key → should log error
- Tool execution failure → should log error with context
- Permission timeout → should log warning

## Success Criteria
- ✅ No more console.log/error calls in modified files
- ✅ Log files created in userData/logs directory
- ✅ Logs contain proper timestamps, levels, and context
- ✅ Log level can be changed at runtime
- ✅ File rotation works at 50MB limit
- ✅ Error logs include stack traces
- ✅ All existing functionality works (no regressions)
- ✅ Console output remains visible during development

## Notes
- This focuses on main process only; renderer logging can be added later via IPC
- Existing `[ServiceName]` prefix convention is maintained in log messages
- Structured data logged as JSON objects for parsing/analysis
- TypeScript path alias `@main/logger` keeps imports clean
- Log files persist across app restarts for debugging
