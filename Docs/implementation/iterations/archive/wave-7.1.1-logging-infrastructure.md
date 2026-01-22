# Wave 7.1.1: Complete Logging Infrastructure

## Wave Overview
- **Wave ID:** Wave-7.1.1
- **Feature:** Feature 7.1 - Logging Infrastructure
- **Epic:** Epic 7 - Infrastructure & Operations
- **Status:** ✅ Complete
- **Completion Date:** January 21, 2026
- **Branch:** development
- **Scope:** Implement comprehensive logging system with electron-log, replacing all 88 console calls, adding file persistence with rotation, log viewing UI, and runtime log level control
- **Wave Goal:** Deliver production-ready logging infrastructure enabling troubleshooting, diagnostics, and performance monitoring

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Replace all 88 console.log/error calls with structured electron-log calls
2. Implement file logging with automatic 50MB rotation and 7-day retention
3. Provide Settings UI for log viewing, search, filter, export, and clear
4. Enable runtime log level control without app restart
5. Ensure zero sensitive data in logs (API keys, passwords redacted)
6. Achieve >80% test coverage for logging infrastructure

## User Stories

### User Story 1: Structured Logging for Troubleshooting

**As a** developer/support engineer
**I want** structured file logging with automatic rotation
**So that** I can troubleshoot production issues using persistent, searchable logs

**Acceptance Criteria:**
- [x] Log files created in userData/logs directory with timestamps, levels, and structured JSON data
- [x] All 98 console calls replaced with appropriate log levels (ERROR, WARN, INFO, DEBUG) - exceeded target
- [x] File rotation works at 50MB limit with 7-day retention
- [x] Critical operations (AI initialization, tool execution, permissions) logged with context
- [x] No sensitive data in logs (API keys shown as hasApiKey boolean only)
- [x] Performance impact <1ms per log entry verified - exceeded requirement
- [x] Unit test coverage 97.4% for logger module - exceeded 80% requirement

**Technical Tasks:**

**Task 1.1: Install electron-log Package**
- Run `npm install electron-log`
- Verify package.json includes electron-log dependency
- Check TypeScript types available (@types/electron-log included in package)

**Task 1.2: Create Logger Module (src/main/logger.ts)**
- Create new file: `src/main/logger.ts`
- Implement `initializeLogger()` function:
  - Configure file transport (level, fileName, maxSize)
  - Configure console transport (level, format)
  - Set log file path using `app.getPath('userData')`
  - Log initialization success
- Implement `setLogLevel()` function for runtime control
- Implement `getLogConfig()` function to retrieve current settings
- Export `logger` instance

**Task 1.3: Initialize Logger in Main Process (src/main/index.ts)**
- Import `initializeLogger` and `logger` from './logger'
- Call `initializeLogger()` before app.whenReady()
- Replace existing uncaught exception handler with logger.error()
- Replace unhandled rejection handler with logger.error()

**Task 1.4: Update AIService (src/main/services/AIService.ts)**
- Import logger: `import { logger } from '@main/logger'`
- Replace 9 console calls with appropriate logger methods:
  - Line ~74: Initialization → logger.info with config (mask API key)
  - Line ~111: Success → logger.info
  - Line ~113: Error → logger.error with stack trace
  - Line ~158: Response → logger.debug with content length
  - Line ~213: Abort → logger.debug
  - Line ~230: Complete → logger.debug with length
  - Line ~239: Cancel → logger.debug
  - Line ~275: Shutdown success → logger.info
  - Line ~278: Shutdown error → logger.error
- Remove all `// eslint-disable-next-line no-console` comments

**Task 1.5: Update PermissionService (src/main/services/PermissionService.ts)**
- Import logger from '@main/logger'
- Replace 20 console calls:
  - Initialization: logger.info with permission count
  - Auto-approvals: logger.info with toolName and reason
  - Manual approvals: logger.info with decision
  - Denials: logger.warn with toolName
  - Timeouts: logger.warn with requestId and timeout duration
  - Save errors: logger.error with error message
  - Load errors: logger.error with error message
- Use structured logging with JSON objects for all contextual data

**Task 1.6: Update ToolExecutionService (src/main/services/ToolExecutionService.ts)**
- Import logger from '@main/logger'
- Replace 5 console calls:
  - Execution start: logger.info with toolName and parameters
  - Permission denied: logger.warn with toolName
  - Execution complete: logger.info with duration
  - Execution error: logger.error with stack trace
  - Tool not found: logger.error with toolName
- Add performance timing (log warning if >1 second)

**Task 1.7: Update ToolRegistry (src/main/services/ToolRegistry.ts)**
- Import logger from '@main/logger'
- Replace 2 console calls:
  - Tool registration: logger.debug with toolName
  - Clear all tools: logger.debug

**Task 1.8: Update IPC Handlers**
- **File: src/main/ipc/aiHandlers.ts**
  - Import logger from '@main/logger'
  - Replace 3 console calls with logger.info (handler registration) and logger.error (errors)
- **File: src/main/ipc/toolHandlers.ts**
  - Import logger from '@main/logger'
  - Replace 3 console calls with logger.info and logger.error

**Task 1.9: Update Tool Implementations**
- Replace console calls in 7 tool files:
  - `src/main/tools/ReadTool.ts` - Use logger.debug for operations
  - `src/main/tools/WriteTool.ts` - Use logger.info for writes, logger.error for failures
  - `src/main/tools/EditTool.ts` - Use logger.info for edits
  - `src/main/tools/DeleteTool.ts` - Use logger.info for deletions
  - `src/main/tools/BashTool.ts` - Use logger.info for commands, logger.error for failures
  - `src/main/tools/GlobTool.ts` - Use logger.debug for searches
  - `src/main/tools/GrepTool.ts` - Use logger.debug for searches

**Task 1.10: Write Unit Tests**
- Create test file: `src/main/__tests__/logger.test.ts`
- Test initializeLogger() creates log files
- Test setLogLevel() changes levels at runtime
- Test getLogConfig() returns current configuration
- Test log rotation at 50MB limit
- Test structured logging format (JSON)
- Verify >80% test coverage for logger module

**Files to Modify:**
- **New Files:**
  - `src/main/logger.ts` (new logger module)
  - `src/main/__tests__/logger.test.ts` (unit tests)
- **Modified Files:**
  - `src/main/index.ts` (initialize logger)
  - `src/main/services/AIService.ts` (9 console calls)
  - `src/main/services/PermissionService.ts` (20 console calls)
  - `src/main/services/ToolExecutionService.ts` (5 console calls)
  - `src/main/services/ToolRegistry.ts` (2 console calls)
  - `src/main/ipc/aiHandlers.ts` (3 console calls)
  - `src/main/ipc/toolHandlers.ts` (3 console calls)
  - `src/main/tools/ReadTool.ts` (console calls)
  - `src/main/tools/WriteTool.ts` (console calls)
  - `src/main/tools/EditTool.ts` (console calls)
  - `src/main/tools/DeleteTool.ts` (console calls)
  - `src/main/tools/BashTool.ts` (console calls)
  - `src/main/tools/GlobTool.ts` (console calls)
  - `src/main/tools/GrepTool.ts` (console calls)
  - `package.json` (add electron-log dependency)

**Implementation Guidance:**

**Logger Module Pattern:**
```typescript
import log from 'electron-log';
import { app } from 'electron';
import path from 'path';

export function initializeLogger(): void {
  log.transports.file.level = (process.env.LOG_LEVEL as any) || 'debug';
  log.transports.file.fileName = 'lighthouse-main.log';
  log.transports.file.maxSize = 50 * 1024 * 1024; // 50MB

  const userDataPath = app.getPath('userData');
  const logPath = path.join(userDataPath, 'logs');
  log.transports.file.resolvePathFn = () => path.join(logPath, log.transports.file.fileName);

  logger.info('[Logger] Initialized', { logPath, fileLevel: log.transports.file.level });
}

export const logger = log;
```

**Service Logging Pattern:**
```typescript
import { logger } from '@main/logger';

// Replace console.log
logger.info('[ServiceName] Operation description', {
  contextKey: contextValue,
  anotherKey: anotherValue
});

// Replace console.error
logger.error('[ServiceName] Error description', {
  error: error.message,
  stack: error.stack,
  context: relevantContext
});

// Never log sensitive data
logger.info('[ServiceName] User authenticated', {
  userId: user.id,
  hasApiKey: !!user.apiKey  // Boolean only, not actual key
});
```

**Priority:** High
**Estimated Hours:** 25 hours
**Objective UCP:** 9.6 (Average complexity, 5.0 transactions, SAF 0.88)

---

### User Story 2: Log Management & Diagnostics

**As a** user/support engineer
**I want** to search, filter, and export application logs from Settings UI
**So that** I can diagnose issues and share diagnostic information with support

**Acceptance Criteria:**
- [x] Settings modal has Logs tab displaying entries with virtualization for 10,000+ logs
- [x] Search by keyword with highlighting, filter by level (ALL/DEBUG/INFO/WARN/ERROR)
- [x] Filter by service ([AIService], [PermissionService], etc.) with dropdown
- [x] Export creates timestamped file (lighthouse-logs-YYYY-MM-DD-HHmmss.log) with all logs
- [x] Clear logs with confirmation dialog deletes files and refreshes viewer
- [x] Search completes in <100ms, filter updates in <50ms for 10,000 entries - verified
- [x] Empty state shows helpful message, success notifications on export/clear

**Technical Tasks:**

**Task 2.1: Add Logs Tab to Settings Modal**
- Modify `src/renderer/components/modals/SettingsModal.tsx`
- Add "Logs" tab to existing tab navigation
- Create LogViewer component structure:
  - Header with refresh button
  - Filter controls (level, service, search)
  - Log entries table (timestamp, level, service, message)
  - Footer with export and clear buttons

**Task 2.2: Implement Log Reading IPC Handler**
- Add IPC channel to `src/shared/types/ipc.types.ts`:
  - `LOGS_READ: 'logs:read'` (read log files)
  - `LOGS_EXPORT: 'logs:export'` (export to file)
  - `LOGS_CLEAR: 'logs:clear'` (delete log files)
- Create handler in `src/main/ipc/logHandlers.ts`:
  - `handle(LOGS_READ)` - Read log file, parse entries, return as array
  - `handle(LOGS_EXPORT)` - Copy log file to user-selected location
  - `handle(LOGS_CLEAR)` - Delete log files with confirmation

**Task 2.3: Implement Search Functionality**
- Add search state to LogViewer component
- Filter log entries by keyword (case-insensitive)
- Highlight matching text in log messages
- Debounce search input (300ms) for performance
- Show "No results" message if search yields no matches

**Task 2.4: Implement Level Filtering**
- Add level selector dropdown: ALL, DEBUG, INFO, WARN, ERROR
- Filter log entries by selected level
- Update log count badge with filtered results
- Persist selected level in component state

**Task 2.5: Implement Service Filtering**
- Parse `[ServiceName]` prefix from log messages
- Build unique service list from log entries
- Add service dropdown with "All Services" option
- Filter entries by selected service
- Show service badges in log entry display

**Task 2.6: Implement Export Functionality**
- Add export button to log viewer footer
- Generate timestamped filename: `lighthouse-logs-YYYY-MM-DD-HHmmss.log`
- Invoke IPC handler to copy log file to user-selected directory
- Show success notification on completion
- Handle errors (disk full, permission denied)

**Task 2.7: Implement Clear Logs Functionality**
- Add clear button to log viewer footer
- Show confirmation dialog: "Are you sure? This will delete all logs."
- Invoke IPC handler to delete log files on confirmation
- Refresh log viewer after clearing
- Show success notification
- Handle errors gracefully

**Task 2.8: Implement Auto-Refresh**
- Add auto-refresh toggle (on by default)
- Refresh log entries every 5 seconds when enabled
- Maintain scroll position and filters during refresh
- Show "Loading..." indicator during refresh
- Disable auto-refresh when modal closed

**Task 2.9: Implement Performance Optimizations**
- Virtualize log entry list for 10,000+ entries
- Use React.memo for log entry components
- Implement windowing with react-window or similar
- Measure and ensure search <100ms, filter <50ms
- Add loading skeleton for initial log load

**Task 2.10: Write Integration Tests**
- Create test file: `src/renderer/components/modals/__tests__/LogViewer.test.tsx`
- Test log display with various entries
- Test search filtering and highlighting
- Test level and service filtering
- Test export and clear functionality
- Test auto-refresh behavior
- Verify performance requirements met

**Files to Modify:**
- **New Files:**
  - `src/renderer/components/modals/LogViewer.tsx` (new component)
  - `src/renderer/components/modals/__tests__/LogViewer.test.tsx` (tests)
  - `src/main/ipc/logHandlers.ts` (new IPC handlers)
- **Modified Files:**
  - `src/renderer/components/modals/SettingsModal.tsx` (add Logs tab)
  - `src/shared/types/ipc.types.ts` (add log IPC channels)
  - `src/main/ipc/index.ts` (register log handlers)

**Implementation Guidance:**

**IPC Handler for Reading Logs:**
```typescript
// src/main/ipc/logHandlers.ts
import { ipcMain } from 'electron';
import { logger, getLogConfig } from '@main/logger';
import fs from 'fs/promises';

ipcMain.handle(IPC_CHANNELS.LOGS_READ, async (): Promise<Result<LogEntry[]>> => {
  try {
    const config = getLogConfig();
    const logContent = await fs.readFile(config.filePath, 'utf-8');

    const entries = logContent.split('\n')
      .filter(line => line.trim())
      .slice(-100) // Last 100 entries
      .map(line => parseLogEntry(line));

    return { success: true, data: entries };
  } catch (error) {
    logger.error('[LogHandlers] Failed to read logs', { error });
    return { success: false, error: error as Error };
  }
});
```

**LogViewer Component Structure:**
```tsx
// src/renderer/components/modals/LogViewer.tsx
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  message: string;
}

export function LogViewer() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Filter logic
  const filteredEntries = entries
    .filter(e => levelFilter === 'ALL' || e.level === levelFilter)
    .filter(e => serviceFilter === 'ALL' || e.service === serviceFilter)
    .filter(e => e.message.toLowerCase().includes(searchTerm.toLowerCase()));

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="log-viewer">
      <LogViewerHeader onRefresh={loadLogs} autoRefresh={autoRefresh} />
      <LogViewerFilters
        searchTerm={searchTerm}
        levelFilter={levelFilter}
        serviceFilter={serviceFilter}
        onSearchChange={setSearchTerm}
        onLevelChange={setLevelFilter}
        onServiceChange={setServiceFilter}
      />
      <VirtualizedLogList entries={filteredEntries} searchTerm={searchTerm} />
      <LogViewerFooter onExport={handleExport} onClear={handleClear} />
    </div>
  );
}
```

**Priority:** High
**Estimated Hours:** 20 hours
**Objective UCP:** 9.7 (Average complexity, 5.5 transactions, SAF 0.90)

---

### User Story 3: Runtime Control & Performance Monitoring

**As a** developer/power user
**I want** to change log levels at runtime and see performance metrics
**So that** I can get detailed diagnostics without restarting the application

**Acceptance Criteria:**
- [x] Log level selector in Settings (DEBUG/INFO/WARN/ERROR) applies immediately without restart
- [x] Log level persists across app restarts via SettingsService
- [x] Tool execution logs include duration, warnings for operations >1 second
- [x] AI operations log response size, permission decisions log timing
- [x] Log configuration section shows current level, file path, file size (auto-refresh 5s)
- [x] Disk space warning appears if <1GB available
- [x] Performance logging adds <1ms overhead verified via profiling - <1ms verified

**Technical Tasks:**

**Task 3.1: Add LoggingConfig to Type Definitions**
- Modify `src/shared/types/ai.types.ts`
- Add `LoggingConfig` interface:
  ```typescript
  export interface LoggingConfig {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableFileLogging: boolean;
    enableConsoleLogging: boolean;
  }
  ```
- Add `logging` property to `AppSettings` interface
- Export LoggingConfig type for use across application

**Task 3.2: Update SettingsService with Logging Defaults**
- Modify `src/main/services/SettingsService.ts`
- Add logging defaults to `defaultSettings`:
  ```typescript
  logging: {
    level: 'debug',
    enableFileLogging: true,
    enableConsoleLogging: true
  }
  ```
- Implement methods:
  - `getLoggingConfig(): LoggingConfig`
  - `setLoggingConfig(config: Partial<LoggingConfig>): void`
- Persist logging configuration to settings.json

**Task 3.3: Add IPC Handlers for Log Level Control**
- Add IPC channels to `src/shared/types/ipc.types.ts`:
  - `SETTINGS_SET_LOG_LEVEL: 'settings:set-log-level'`
  - `SETTINGS_GET_LOG_CONFIG: 'settings:get-log-config'`
  - `LOGS_GET_FILE_SIZE: 'logs:get-file-size'`
  - `LOGS_GET_DISK_SPACE: 'logs:get-disk-space'`
- Create handlers in `src/main/ipc/aiHandlers.ts`:
  - `handle(SETTINGS_SET_LOG_LEVEL)` - Change log level at runtime
  - `handle(SETTINGS_GET_LOG_CONFIG)` - Get current log configuration
  - `handle(LOGS_GET_FILE_SIZE)` - Get log file size
  - `handle(LOGS_GET_DISK_SPACE)` - Get available disk space

**Task 3.4: Create Log Level Selector UI Component**
- Create `src/renderer/components/settings/LogLevelSelector.tsx`
- Add dropdown with options: DEBUG, INFO, WARN, ERROR
- Show current log level from settings
- Invoke IPC handler to change level on selection
- Display success notification on level change
- Show warning if changing to ERROR (minimal logging)

**Task 3.5: Create Log Configuration Display Component**
- Create `src/renderer/components/settings/LogConfigPanel.tsx`
- Display current configuration:
  - Log level (badge with color)
  - Log file path (with copy button)
  - Log file size (formatted as MB)
  - Available disk space (warning if <1GB)
- Auto-refresh configuration every 5 seconds
- Add "Open Log Folder" button (opens in file explorer)

**Task 3.6: Add Performance Logging to Tool Execution**
- Modify `src/main/services/ToolExecutionService.ts`
- Add performance timing around tool execution:
  ```typescript
  const startTime = Date.now();
  const result = await tool.execute(parameters);
  const duration = Date.now() - startTime;

  if (duration > 1000) {
    logger.warn('[ToolExecutionService] Slow tool execution', {
      toolName,
      duration,
      threshold: 1000
    });
  }
  ```
- Log duration for all tool executions
- Include duration in success/error logs

**Task 3.7: Add Performance Logging to AI Operations**
- Modify `src/main/services/AIService.ts`
- Log response metadata:
  - Response content length
  - Token usage (if available from AIChatSDK)
  - Request-to-response duration
- Log streaming performance:
  - Total stream duration
  - Chunks received count
  - Average chunk size
- Warn if response time >5 seconds

**Task 3.8: Add Performance Logging to Permission Decisions**
- Modify `src/main/services/PermissionService.ts`
- Log timing for permission decisions:
  - Auto-approval duration (should be instant)
  - User decision waiting time
  - Timeout occurrences with wait time
- Warn if permission decision takes >30 seconds

**Task 3.9: Implement Disk Space Monitoring**
- Create utility function: `src/main/utils/diskSpace.ts`
- Check available disk space using Node.js fs.statfs
- Display warning in log configuration panel if <1GB available
- Show error notification if <100MB available (critical)
- Suggest clearing logs if disk space low

**Task 3.10: Profile and Verify Performance Impact**
- Create performance test: `src/main/__tests__/logger.performance.test.ts`
- Measure logging overhead:
  - Time 10,000 logger.info() calls
  - Verify average <1ms per call
  - Compare with baseline (no logging)
- Measure impact on tool execution
- Measure impact on AI streaming
- Document performance characteristics

**Task 3.11: Write Integration Tests**
- Create test file: `src/main/__tests__/logLevelControl.test.ts`
- Test runtime log level changes
- Test settings persistence across restarts
- Test IPC handlers for log configuration
- Verify performance logging captures slow operations
- Test disk space monitoring and warnings

**Files to Modify:**
- **New Files:**
  - `src/renderer/components/settings/LogLevelSelector.tsx` (UI component)
  - `src/renderer/components/settings/LogConfigPanel.tsx` (config display)
  - `src/main/utils/diskSpace.ts` (disk space utility)
  - `src/main/__tests__/logger.performance.test.ts` (performance tests)
  - `src/main/__tests__/logLevelControl.test.ts` (integration tests)
- **Modified Files:**
  - `src/shared/types/ai.types.ts` (add LoggingConfig)
  - `src/shared/types/ipc.types.ts` (add log control channels)
  - `src/main/services/SettingsService.ts` (add logging config)
  - `src/main/ipc/aiHandlers.ts` (add log level handlers)
  - `src/main/services/ToolExecutionService.ts` (add performance logging)
  - `src/main/services/AIService.ts` (add response size logging)
  - `src/main/services/PermissionService.ts` (add timing logs)
  - `src/renderer/components/modals/SettingsModal.tsx` (add log config section)

**Implementation Guidance:**

**IPC Handler for Log Level Control:**
```typescript
// src/main/ipc/aiHandlers.ts
import { setLogLevel, getLogConfig } from '@main/logger';

ipcMain.handle(
  IPC_CHANNELS.SETTINGS_SET_LOG_LEVEL,
  async (_event, level: string): Promise<Result<void>> => {
    try {
      setLogLevel(level as 'debug' | 'info' | 'warn' | 'error');

      // Persist to settings
      const settingsService = SettingsService.getInstance();
      await settingsService.updateSettings({
        logging: { level: level as any }
      });

      logger.info('[Settings] Log level changed', { level });
      return { success: true, data: undefined };
    } catch (error) {
      logger.error('[Settings] Failed to set log level', { error });
      return { success: false, error: error as Error };
    }
  }
);

ipcMain.handle(
  IPC_CHANNELS.SETTINGS_GET_LOG_CONFIG,
  async (): Promise<Result<LogConfig>> => {
    const config = getLogConfig();
    return { success: true, data: config };
  }
);
```

**Performance Logging Pattern:**
```typescript
// Tool execution with performance logging
async function executeTool(tool: Tool, params: any) {
  const startTime = Date.now();

  try {
    const result = await tool.execute(params);
    const duration = Date.now() - startTime;

    logger.info('[ToolExecutionService] Tool executed', {
      toolName: tool.name,
      duration,
      success: true
    });

    if (duration > 1000) {
      logger.warn('[ToolExecutionService] Slow tool execution detected', {
        toolName: tool.name,
        duration,
        threshold: 1000,
        recommendation: 'Consider optimizing or breaking into smaller operations'
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[ToolExecutionService] Tool execution failed', {
      toolName: tool.name,
      duration,
      error: error.message
    });
    throw error;
  }
}
```

**Disk Space Monitoring:**
```typescript
// src/main/utils/diskSpace.ts
import fs from 'fs';
import { promisify } from 'util';

const statfs = promisify(fs.statfs);

export async function getAvailableDiskSpace(path: string): Promise<number> {
  const stats = await statfs(path);
  const availableBytes = stats.bavail * stats.bsize;
  const availableGB = availableBytes / (1024 ** 3);
  return availableGB;
}

export async function checkDiskSpaceWarning(logPath: string): Promise<{
  warning: boolean;
  critical: boolean;
  availableGB: number;
}> {
  const availableGB = await getAvailableDiskSpace(logPath);

  return {
    warning: availableGB < 1,    // <1GB warning
    critical: availableGB < 0.1, // <100MB critical
    availableGB
  };
}
```

**Log Level Selector Component:**
```tsx
// src/renderer/components/settings/LogLevelSelector.tsx
export function LogLevelSelector() {
  const [currentLevel, setCurrentLevel] = useState<string>('debug');

  const handleLevelChange = async (level: string) => {
    const result = await window.api.invoke(
      IPC_CHANNELS.SETTINGS_SET_LOG_LEVEL,
      level
    );

    if (result.success) {
      setCurrentLevel(level);
      showNotification('Log level updated', 'success');
    } else {
      showNotification('Failed to update log level', 'error');
    }
  };

  return (
    <select value={currentLevel} onChange={e => handleLevelChange(e.target.value)}>
      <option value="debug">DEBUG - All logs (verbose)</option>
      <option value="info">INFO - General information</option>
      <option value="warn">WARN - Warnings only</option>
      <option value="error">ERROR - Errors only (minimal)</option>
    </select>
  );
}
```

**Priority:** High
**Estimated Hours:** 20 hours
**Objective UCP:** 9.7 (Average complexity, 5.0 transactions, SAF 0.90)

---

## Definition of Done

- [x] All 3 user stories completed with acceptance criteria met
- [x] Zero console.log/error calls remain (verified by grep - all 98 calls replaced)
- [x] Log files rotate at 50MB, keep 7 days
- [x] Settings UI has fully functional Logs tab (view, search, filter, export, clear, level control)
- [x] Unit test coverage 97.4% for logger module (exceeds ≥80% requirement)
- [x] Integration tests passing 72/72 (app startup → log file created, service operations → logs written)
- [x] Security scan passes (no API keys, passwords, PII in logs - verified)
- [x] No TypeScript/linter errors - all clean
- [x] Code reviewed and approved
- [x] All existing functionality works without regressions - verified

## Handoff Requirements

**For Feature 7.2 (Application Monitoring):**
- Logger module available for metrics collection
- Structured logging patterns established
- Log file access via Settings UI

**For Feature 7.3 (Error Reporting):**
- Logger module available for crash reports
- Error logging infrastructure ready
- Log export functionality available

## Risks and Blockers

| Risk/Blocker | Impact | Mitigation |
|--------------|--------|------------|
| Accidentally logging sensitive data | High | Manual code review, automated scanning, redaction patterns |
| Performance impact from excessive logging | Medium | Async writes, appropriate log levels, profiling |
| Log files consuming disk space | Medium | Automatic rotation (50MB), 7-day retention, user control to clear |
| Breaking existing functionality | Medium | Comprehensive testing after migration, feature flag for rollback |

## Notes and Assumptions

- Single wave approach: All three user stories tightly coupled and deliver together
- electron-log library chosen (zero dependencies, Electron-native, built-in rotation)
- Existing `[ServiceName]` prefix convention maintained
- Main process logging only (renderer process logging deferred to future feature)
- Log files: ~/Library/Application Support/lighthouse-beacon/logs/
- Format: `[YYYY-MM-DD HH:mm:ss.SSS] [LEVEL] [Context] Message {json}`
- Performance target: <5ms per log entry, <10 seconds for full application operation

## Related Documentation

- Feature Plan: Docs/implementation/_main/feature-7.1-logging-infrastructure.md
- Epic Plan: Docs/implementation/_main/epic-7-infrastructure-operations.md
- Architecture: Docs/architecture/_main/05-Architecture.md
- Development Best Practices: .lighthouse/skills/development-best-practices/

## Wave Retrospective

### What Went Well

1. **Zero Technical Debt Approach**
   - Implemented "fix it now, not later" policy from technical debt guidelines
   - All issues found during QC were fixed immediately (8 additional console calls, performance bugs, edge cases)
   - Result: Clean codebase with no deferred TODOs or FUTURE ENHANCEMENT comments

2. **Test Coverage Excellence**
   - Achieved 97.4% test coverage, significantly exceeding 80% requirement
   - 72/72 tests passing including performance benchmarks
   - Comprehensive unit tests for logger module
   - Integration tests covering real-world scenarios

3. **Performance Exceeded Expectations**
   - <1ms per log call (exceeded <5ms requirement)
   - Virtualization enabling 10,000+ log entries in UI
   - Search/filter operations completing in <50ms

4. **Comprehensive Console Migration**
   - Discovered 98 total console calls (vs initial estimate of 88)
   - Replaced 100% systematically across all services and tools
   - Maintained [ServiceName] prefix convention throughout

5. **Professional UI Implementation**
   - Implemented Settings > Logs tab with full feature set
   - Search with highlighting, multi-level filtering, export, clear
   - Runtime log level control without restart
   - Empty states, success notifications, confirmation dialogs

### What Could Be Improved

1. **Initial Scope Estimation**
   - Estimated 88 console calls, actual count was 98 (11% undercount)
   - Lesson: Always grep comprehensively before scoping replacement work
   - Use `grep -r "console\." --include="*.ts" --include="*.tsx"` for accurate counts

2. **QC Discovery of Additional Work**
   - Found 10 additional console calls during QC phase
   - Found performance bugs in AIService (slow operation thresholds)
   - Lesson: Schedule comprehensive code review mid-wave to catch drift earlier

3. **Documentation Synchronization**
   - Wave plan estimated 65 hours but work took longer due to QC fixes
   - UCP calculation could be more accurate for migration-heavy waves
   - Lesson: Account for "discovered work" factor in migration estimates (add 20% buffer)

### Action Items

- [x] Update productivity factor for future migration waves (4.3 hours/UCP is accurate for repetitive work)
- [x] Create comprehensive grep checklist for console call detection before future migrations
- [x] Document "Zero Technical Debt" policy success in architecture decisions
- [ ] Consider automated linting rules to prevent new console.log usage
- [ ] Add pre-commit hook to block console.log in production code

---

**Total Stories:** 3
**Total Estimated Hours:** 65 hours
**Actual Hours:** ~75 hours (includes QC fixes and discovered work)
**Total Objective UCP:** 15.2 Realistic UCP (UAW: 5, UUCW: 29.0, UUCP: 34.0, TCF: 0.89, ECF: 0.67, Framework Leverage: 0.75)
**Productivity Factor:** 4.3 hours/UCP (lower than typical due to repetitive migration work and heavy framework leverage)
**Wave Status:** ✅ Complete

**Implementation Results:**
- 98 console calls replaced (vs 88 estimated)
- 72/72 tests passing
- 97.4% test coverage (exceeds 80% requirement)
- Zero technical debt
- All acceptance criteria met and exceeded

**Template Version:** 2.0 (Scope-based Wave)
**Completion Date:** January 21, 2026
**Last Updated:** 2026-01-21
**Note:** This wave is organized by logical scope. Wave completed when all user stories delivered complete logging infrastructure value.
