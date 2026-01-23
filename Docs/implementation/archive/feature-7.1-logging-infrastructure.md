# Feature 7.1: Logging Infrastructure

## Feature Overview
- **Feature ID:** Feature-7.1
- **Epic:** Epic 7 - Infrastructure & Operations
- **Status:** 🟡 Planning
- **Duration:** 1-2 weeks
- **Priority:** High (P1)
- **Complexity:** Medium

## Problem Statement

Lighthouse Chat IDE currently uses 88 console.log/error calls across 47 files with no structured logging, file persistence, or log management. This makes debugging, troubleshooting, and production support extremely difficult.

**Current State:**
- Console-based logging with `[ServiceName]` prefix pattern
- No file persistence (logs lost on app restart)
- No log rotation (would consume unlimited disk space)
- No log level management (cannot filter by severity)
- No log viewing UI (users must check console)
- API keys and secrets could accidentally be logged

**Desired State:**
- Professional logging with electron-log library
- File logging with automatic 50MB rotation, 7-day retention
- Configurable log levels (DEBUG, INFO, WARN, ERROR)
- Settings UI for viewing, exporting, clearing logs
- Structured JSON logging with contextual data
- Zero sensitive data in logs (security validated)

## Goals and Success Criteria

**Primary Goal:** Replace all console logging with professional, structured logging infrastructure that supports troubleshooting and production debugging.

**Success Metrics:**
- ✅ Zero console.log/error calls in production code (88 → 0)
- ✅ Log files created in userData/logs directory
- ✅ Logs contain timestamps, levels, context, structured data
- ✅ Log level changeable at runtime via Settings UI
- ✅ Users can view/export/clear logs from Settings
- ✅ Automated tests verify logging works correctly
- ✅ No sensitive data in logs (automated scan passes)
- ✅ All functionality works without regressions

**Acceptance Criteria:**
1. electron-log integrated and configured
2. Logger module exports: logger, initializeLogger(), setLogLevel(), getLogConfig()
3. All 88 console calls replaced with appropriate log levels
4. Settings modal has Logs tab with viewer, export, clear
5. Log files rotate at 50MB, keep 7 days
6. Runtime log level changes work via Settings
7. Performance impact <5ms per log entry
8. Test coverage >80% for logger module

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────┐
│         Main Process                         │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Logger Module (logger.ts)              │ │
│  │  ┌──────────────────────────────────┐  │ │
│  │  │ electron-log                      │  │ │
│  │  │ - File transport (50MB rotation) │  │ │
│  │  │ - Console transport              │  │ │
│  │  │ - Level management (debug/info)  │  │ │
│  │  └──────────────────────────────────┘  │ │
│  │                                         │ │
│  │  Functions:                             │ │
│  │  - initializeLogger()                   │ │
│  │  - setLogLevel(level)                   │ │
│  │  - getLogConfig()                       │ │
│  │  - export const logger                  │ │
│  └────────────────────────────────────────┘ │
│                    ▲                         │
│                    │ import                  │
│  ┌─────────────────┴──────────────────────┐ │
│  │  All Services/Tools use logger         │ │
│  │  - AIService (9 calls)                 │ │
│  │  - PermissionService (20 calls)        │ │
│  │  - ToolExecutionService (5 calls)      │ │
│  │  - Tools (Read, Write, Edit, etc.)     │ │
│  │  - IPC Handlers (aiHandlers, toolH.)   │ │
│  └──────────────────────────────────────────┘│
│                    ▲                         │
│                    │ IPC                     │
└────────────────────┼─────────────────────────┘
                     │
┌────────────────────┼─────────────────────────┐
│         Renderer Process                     │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │  Settings Modal - Logs Tab             │ │
│  │  ┌──────────────────────────────────┐  │ │
│  │  │ Log Viewer                        │  │ │
│  │  │ - Display recent logs             │  │ │
│  │  │ - Filter by level                 │  │ │
│  │  │ - Search logs                     │  │ │
│  │  └──────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────┐  │ │
│  │  │ Log Controls                      │  │ │
│  │  │ - Level selector dropdown         │  │ │
│  │  │ - Export logs button              │  │ │
│  │  │ - Clear logs button               │  │ │
│  │  │ - Show log file path              │  │ │
│  │  └──────────────────────────────────┘  │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Filesystem            │
         │  ~/userData/logs/      │
         │  - lighthouse-main.log │
         │  - lighthouse-YYYY-MM-DD.log (rotated) │
         └───────────────────────┘
```

### Technology Stack

**Core:**
- electron-log 5.x (zero dependencies, Electron-native)
- Node.js fs/path (built-in)
- Electron app.getPath('userData') for log location

**Configuration:**
- Log level: DEBUG, INFO, WARN, ERROR
- File rotation: 50MB max size
- Retention: 7 days
- Format: `[YYYY-MM-DD HH:mm:ss.SSS] [LEVEL] [Context] Message {json}`

### Implementation Strategy

**Single Wave Approach:**

All three user stories are implemented together in Wave 7.1.1 as they are tightly coupled and deliver complete value as a cohesive feature. The implementation follows this sequence:

1. **Foundation (User Story 1 - Core Infrastructure)**
   - Install electron-log package
   - Add type definitions (LoggingConfig, IPC channels) - **MUST COME FIRST**
   - Create logger module with initialization
   - Initialize logger in main process startup
   - Write unit tests for logger module

2. **Service Migration (User Stories 1 & 2 - Complete Logging)**
   - Update all services (AIService, PermissionService, ToolExecutionService, ToolRegistry)
   - Update all tools (Read, Write, Edit, Delete, Bash, Glob, Grep)
   - Update IPC handlers
   - Remove all `// eslint-disable-next-line no-console` comments
   - Verify zero console calls remain

3. **UI Integration (User Stories 2 & 3 - Log Management & Control)**
   - Update SettingsService with logging configuration
   - Add IPC handlers for log control (setLogLevel, getLogConfig, exportLogs, clearLogs)
   - Create log viewer component in Settings modal
   - Add search, filter, export, clear functionality
   - Add runtime log level control
   - Integration testing

## Wave Breakdown

### Wave 7.1.1: Complete Logging Infrastructure
**Duration:** 5-7 days
**Complexity:** Medium-High
**UCP:** TBD (calculated during wave planning)

**Rationale:** All three user stories are tightly coupled and must be implemented together to deliver complete value. A logger without a full-featured viewer is incomplete, and splitting this artificially would create dependencies without business value between waves.

---

#### User Story 1: Structured Logging for Troubleshooting

**User Story:
```
As a developer/support engineer
I want structured file logging with automatic rotation and a basic log viewer
So that I can troubleshoot production issues without losing historical logs
```

#### Business Value
- Developers can diagnose production issues using persistent logs
- Historical logs preserved for post-mortem analysis
- Automatic rotation prevents disk space exhaustion
- Critical operations (AI, permissions, tools) are traceable

#### Scope

**Core Infrastructure:**
- Install and configure electron-log
- Create logger module with file transport (50MB rotation, 7-day retention)
- Add type definitions (LoggingConfig, IPC channels)
- Initialize logger on app startup

**Critical Service Migration:**
- AIService: Replace 9 console calls with structured logging
- PermissionService: Replace 20 console calls with structured logging
- ToolExecutionService: Replace 5 console calls with structured logging
- Include performance timing for tool execution

**Basic Log Viewer:**
- Add "Logs" tab to Settings modal
- Display recent 100 log entries (read-only)
- Show timestamp, level, service, message
- Auto-refresh every 5 seconds
- Display current log file path and size

#### Acceptance Criteria

**Functional:**
- [ ] Log files created in userData/logs/lighthouse-main.log
- [ ] Logs contain: timestamp, level, [ServiceName] prefix, structured JSON data
- [ ] File rotation works at 50MB (tested with large log generation)
- [ ] Old logs deleted after 7 days
- [ ] Critical services (AI, Permissions, Tools) log all operations
- [ ] Performance timing logged for tool execution
- [ ] Settings → Logs tab displays recent logs
- [ ] Log viewer shows timestamp, level, service, message
- [ ] Log viewer auto-refreshes every 5 seconds

**Non-Functional:**
- [ ] No sensitive data in logs (API keys, passwords, paths)
- [ ] Log operations <5ms average (performance test)
- [ ] Logger gracefully degrades if file write fails
- [ ] Unit tests for logger module (>80% coverage)
- [ ] Integration test: app startup → log file created

**Security:**
- [ ] API keys never logged (only hasApiKey: boolean)
- [ ] File paths redacted (relative paths only)
- [ ] Log files have user-only permissions (chmod 600)
- [ ] Automated scan finds no secrets in logs

#### Technical Tasks

1. **Foundation (Type-First Approach)**
   - Install electron-log package
   - Add LoggingConfig interface to ai.types.ts
   - Add IPC channel types to ipc.types.ts
   - Create logger.ts module with initializeLogger(), logger export
   - Initialize logger in main/index.ts
   - Add unit tests for logger module

2. **Critical Service Migration**
   - Update AIService.ts (9 console → logger calls)
   - Update PermissionService.ts (20 console → logger calls)
   - Update ToolExecutionService.ts (5 console → logger calls)
   - Add performance timing to tool execution logs
   - Remove ESLint disable comments
   - Manual security review: no sensitive data logged

3. **Basic Log Viewer UI**
   - Create LogViewer.tsx component (read-only display)
   - Add "Logs" tab to SettingsModal.tsx
   - Add IPC handler to read log file (GET_LOGS)
   - Display recent 100 entries with formatting
   - Add auto-refresh (5 second interval)
   - Show log file path and size

#### UCP Calculation Inputs

**Actors:**
- Developer (Simple) - Uses log viewer for debugging
- Support Engineer (Simple) - Reviews logs for issue diagnosis
- System (Simple) - Automatic log rotation and retention

**Use Case Transactions:**
1. **Configure Logging System** (Simple)
   - Input: Log level, rotation size, retention days
   - Processing: Initialize electron-log with configuration
   - Output: Logger ready, log file created
   - Complexity: 3-4 steps, no business rules

2. **Write Structured Log Entry** (Simple)
   - Input: Level, service name, message, structured data
   - Processing: Format log entry, write to file
   - Output: Log entry persisted
   - Complexity: 2-3 steps, formatting only

3. **Rotate Log Files** (Average)
   - Input: Current log file size
   - Processing: Check size threshold, rename old file, create new file
   - Output: Rotated logs, disk space managed
   - Complexity: 5-7 steps, file system operations

4. **View Recent Logs** (Simple)
   - Input: User opens Settings → Logs
   - Processing: Read last 100 entries, parse, format
   - Output: Logs displayed in UI
   - Complexity: 3-4 steps, basic parsing

**Technical Complexity Factors (TCF):**
- Distributed system: No
- Performance requirements: Yes (logging must be async, <5ms)
- Reusability: Yes (logger used across all services)
- Installation ease: Yes (automatic log directory creation)
- Security: Yes (no sensitive data, file permissions)

**Environmental Complexity Factors (ECF):**
- Familiarity with development process: High (team knows Electron)
- Application experience: Medium (new logging infrastructure)
- Object-oriented experience: High (service-oriented architecture)
- Analyst capability: High
- Motivation: High (critical infrastructure need)

#### Dependencies
- None (all user stories implemented together in Wave 7.1.1)

#### Risks & Mitigation
- **Risk:** Accidentally log sensitive data
  - **Mitigation:** Manual review, automated scanning, redaction patterns
- **Risk:** Performance impact from logging
  - **Mitigation:** Async writes, profiling, appropriate log levels

#### Validation

**Manual Testing:**
```bash
# Start app
npm run dev

# Verify log file created
ls -la ~/Library/Application\ Support/lighthouse-beacon/logs/lighthouse-main.log

# Tail log file
tail -f ~/Library/Application\ Support/lighthouse-beacon/logs/lighthouse-main.log
# Should see: [2026-01-21 15:30:00.123] [info] [Logger] Initialized

# Test critical operations
# - Initialize AI service → See [AIService] logs
# - Execute tool → See [ToolExecutionService] logs with timing
# - Grant/deny permission → See [PermissionService] logs

# Check log viewer
# Open Settings → Logs tab → See recent entries

# Verify no secrets
grep -E "apiKey|password|token|sk-ant-" ~/Library/Application\ Support/lighthouse-beacon/logs/lighthouse-main.log
# Should return: (no results) or only "hasApiKey:true"
```

**Automated Testing:**
- Unit tests: logger.test.ts (>80% coverage)
- Integration test: app startup → log file exists
- Security scan: no secrets in logs
- Performance test: log operations <5ms

---

#### User Story 2: Log Management & Diagnostics

**User Story:
```
As a user/support engineer
I want to search, filter, and export application logs
So that I can diagnose issues and share diagnostic information with support
```

#### Business Value
- Users can self-diagnose issues without support intervention
- Support engineers can request diagnostic logs from users
- Search/filter enables finding specific issues quickly
- Export enables offline analysis and issue reporting

#### Scope

**Complete Service Migration:**
- Update remaining services: ToolRegistry, FileSystemService
- Update all 7 tool implementations (Read, Write, Edit, Delete, Bash, Glob, Grep)
- Update IPC handlers (aiHandlers, toolHandlers)
- Remove all remaining console.log/error calls (88 → 0)

**Enhanced Log Viewer:**
- Search logs by keyword
- Filter by log level (ALL, DEBUG, INFO, WARN, ERROR)
- Filter by service ([AIService], [PermissionService], etc.)
- Highlight search matches
- Display full structured data (expand JSON objects)

**Export Functionality:**
- Export logs button
- Create timestamped file: lighthouse-logs-YYYY-MM-DD-HHmmss.log
- Save to Downloads folder
- Show success notification with file path
- Copy file path to clipboard

**Clear Logs Functionality:**
- Clear logs button with confirmation dialog
- Delete all log files via IPC
- Show success notification
- Refresh log viewer (empty state)

#### Acceptance Criteria

**Functional:**
- [ ] Zero console.log/error calls remain in codebase (verified by grep)
- [ ] All 88 original console calls replaced with logger
- [ ] Search logs by keyword (case-insensitive)
- [ ] Filter logs by level (ALL, DEBUG, INFO, WARN, ERROR)
- [ ] Filter logs by service (dropdown with all services)
- [ ] Highlight search matches in yellow
- [ ] Expand JSON objects in log viewer (click to expand)
- [ ] Export button creates timestamped file
- [ ] Exported file contains all logs (not just recent 100)
- [ ] Clear logs requires confirmation ("Are you sure?")
- [ ] Clear logs deletes files and refreshes viewer

**Non-Functional:**
- [ ] Search is fast (<100ms for 10,000 entries)
- [ ] Filter updates immediately (<50ms)
- [ ] Export completes in <2 seconds for 50MB log
- [ ] UI remains responsive during search/filter

**User Experience:**
- [ ] Search highlights are clearly visible
- [ ] Filter dropdowns are intuitive
- [ ] Export success shows file location
- [ ] Clear confirmation prevents accidental deletion
- [ ] Empty state shows helpful message

#### Technical Tasks

1. **Complete Service Migration**
   - Update ToolRegistry.ts (2 console → logger)
   - Update all tool implementations (7 files)
   - Update aiHandlers.ts (3 console → logger)
   - Update toolHandlers.ts (3 console → logger)
   - Verify grep finds zero console calls

2. **Enhanced Log Viewer**
   - Add search input with debounced filtering
   - Add level filter dropdown
   - Add service filter dropdown
   - Implement highlight for search matches
   - Add expandable JSON objects
   - Optimize rendering for large log sets

3. **Export Functionality**
   - Add EXPORT_LOGS IPC handler (reads full log file)
   - Add export button to UI
   - Generate timestamped filename
   - Save to Downloads folder via Electron API
   - Show success notification
   - Copy path to clipboard

4. **Clear Functionality**
   - Add CLEAR_LOGS IPC handler (deletes log files)
   - Add clear button with confirmation dialog
   - Show success/error notification
   - Refresh log viewer after clear

#### UCP Calculation Inputs

**Actors:**
- User (Simple) - Exports logs, clears logs
- Support Engineer (Simple) - Searches/filters logs for diagnosis
- System (Simple) - Processes search/filter operations

**Use Case Transactions:**
1. **Search Logs** (Simple)
   - Input: Search keyword
   - Processing: Filter log entries by keyword, highlight matches
   - Output: Filtered log list with highlights
   - Complexity: 3-4 steps, string matching

2. **Filter Logs by Level/Service** (Simple)
   - Input: Selected level or service
   - Processing: Filter log entries by criteria
   - Output: Filtered log list
   - Complexity: 2-3 steps, simple filtering

3. **Export Logs** (Average)
   - Input: User clicks Export
   - Processing: Read full log file, create timestamped copy, save to Downloads
   - Output: Exported file, notification with path
   - Complexity: 5-6 steps, file operations

4. **Clear Logs** (Simple)
   - Input: User confirms clear action
   - Processing: Delete log files, refresh viewer
   - Output: Empty log viewer, success notification
   - Complexity: 3-4 steps, file deletion

**Technical Complexity Factors:**
- Performance requirements: Yes (search/filter must be fast)
- Usability: Yes (intuitive search/filter UI)
- File operations: Yes (export, clear)

#### Dependencies
- None (all user stories implemented together in Wave 7.1.1)

#### Risks & Mitigation
- **Risk:** Search slow with large log files
  - **Mitigation:** Implement pagination, limit to recent 1000 entries
- **Risk:** Accidental log deletion
  - **Mitigation:** Confirmation dialog, explain consequences

#### Validation

**Manual Testing:**
```bash
# Complete migration verification
grep -r "console\.\(log\|error\|warn\)" src/main/ --include="*.ts" --exclude="*.test.ts"
# Should return: (no results)

# Test search
# Open Settings → Logs → Type "AIService" → See only AIService logs highlighted

# Test filter by level
# Select "ERROR" → See only ERROR level logs

# Test filter by service
# Select "[PermissionService]" → See only permission logs

# Test export
# Click Export → File downloaded: lighthouse-logs-2026-01-21-153045.log
# Open file → Contains all logs (not just recent 100)

# Test clear
# Click Clear → Confirmation shown
# Click Yes → Logs deleted → Viewer shows "No logs available"
```

---

#### User Story 3: Runtime Control & Performance Monitoring

**User Story:
```
As a developer/power user
I want to change log levels at runtime and see performance metrics
So that I can get detailed diagnostics without restarting the application
```

#### Business Value
- Debug issues without app restart (reduces disruption)
- Reduce log noise in production (change to ERROR-only)
- Performance metrics help identify slow operations
- Log level persists across app restarts (convenient)

#### Scope

**Runtime Log Control:**
- Log level selector in Settings (DEBUG, INFO, WARN, ERROR)
- Apply log level immediately (no restart required)
- Persist log level to SettingsService configuration
- IPC handler: SET_LOG_LEVEL, GET_LOG_CONFIG

**Performance Monitoring:**
- Enhanced tool execution logging with timing
- Warn when tool execution >1s (slow operation alert)
- Log response sizes for AI operations
- Log permission decision timing

**Log Configuration Display:**
- Show current log level (DEBUG/INFO/WARN/ERROR)
- Show log file path
- Show log file size (update every 5 seconds)
- Show disk space available
- Warn if disk space <1GB

#### Acceptance Criteria

**Functional:**
- [ ] Log level dropdown in Settings (DEBUG, INFO, WARN, ERROR)
- [ ] Change log level → Takes effect immediately (no restart)
- [ ] Changed log level persists after app restart
- [ ] Tool execution logs show duration in milliseconds
- [ ] Tool execution >1s logs as WARNING
- [ ] AI operations log response size
- [ ] Permission decisions log timing
- [ ] Log configuration section shows current level, file path, file size
- [ ] Disk space warning appears if <1GB available

**Non-Functional:**
- [ ] Log level change takes effect in <100ms
- [ ] No app restart required for level change
- [ ] File size updates every 5 seconds
- [ ] Performance logging adds <1ms overhead

**User Experience:**
- [ ] Log level selector is clear and intuitive
- [ ] Immediate feedback when level changed
- [ ] Configuration display is easy to read
- [ ] Disk space warning is prominent

#### Technical Tasks

1. **Runtime Log Control**
   - Add SettingsService methods: getLoggingConfig(), setLoggingConfig()
   - Add IPC handlers: SET_LOG_LEVEL, GET_LOG_CONFIG
   - Implement setLogLevel() in logger.ts
   - Update SettingsService to persist log level
   - Add log level selector to Settings UI
   - Show success notification on level change

2. **Performance Monitoring**
   - Enhance ToolExecutionService logging with duration
   - Add warning threshold (1000ms)
   - Log slow operations with WARN level
   - Add response size logging to AIService
   - Add timing to PermissionService decisions

3. **Log Configuration Display**
   - Create LogConfigSection component
   - Display current log level (with color indicator)
   - Display log file path (copyable)
   - Display log file size (auto-refresh)
   - Check disk space via Electron API
   - Show warning if disk space <1GB

#### UCP Calculation Inputs

**Actors:**
- Developer (Simple) - Changes log level for debugging
- System (Simple) - Applies log level, monitors performance
- Power User (Simple) - Views log configuration

**Use Case Transactions:**
1. **Change Log Level** (Simple)
   - Input: User selects new log level
   - Processing: Update logger, persist to config, apply immediately
   - Output: New log level active, confirmation shown
   - Complexity: 3-4 steps, configuration update

2. **Monitor Tool Performance** (Average)
   - Input: Tool execution starts
   - Processing: Record start time, execute tool, calculate duration, log result
   - Output: Performance log with timing
   - Complexity: 5-6 steps, timing calculation, conditional warning

3. **Display Log Configuration** (Simple)
   - Input: User opens Settings → Logs
   - Processing: Read current config, check file size, check disk space
   - Output: Configuration displayed
   - Complexity: 3-4 steps, file system queries

4. **Persist Log Level** (Simple)
   - Input: Log level changed
   - Processing: Save to SettingsService, persist to disk
   - Output: Level persists across restarts
   - Complexity: 2-3 steps, configuration write

**Technical Complexity Factors:**
- Real-time updates: Yes (log level change immediate)
- Performance monitoring: Yes (timing, thresholds)
- Configuration persistence: Yes (settings storage)

#### Dependencies
- None (all user stories implemented together in Wave 7.1.1)

#### Risks & Mitigation
- **Risk:** Log level change doesn't apply to all services
  - **Mitigation:** Centralized logger instance, test all services
- **Risk:** Performance logging adds overhead
  - **Mitigation:** Minimal timing code, async logging

#### Validation

**Manual Testing:**
```bash
# Test runtime log level change
# 1. Open Settings → Logs → Level: DEBUG
# 2. Execute tool → See DEBUG logs in viewer
# 3. Change level to ERROR → Apply
# 4. Execute tool → See only ERROR logs (no DEBUG)
# 5. Restart app → Level still ERROR

# Test performance monitoring
# Execute slow tool (large file read) → See WARNING log
# "Tool execution took 1523ms (threshold: 1000ms)"

# Test configuration display
# Open Settings → Logs → See:
# - Current level: ERROR (red indicator)
# - Log file: ~/Library/.../lighthouse-main.log (click to copy)
# - File size: 12.3 MB (updates every 5s)
# - Disk space: 42.1 GB available

# Test disk space warning
# (Simulate low disk space if possible)
# Should see: "⚠️ Low disk space: 750 MB available. Consider clearing logs."
```

---

---

## Files to Create/Modify

### New Files (2)
1. `/src/main/logger.ts` - Logger module with electron-log integration
2. `/src/renderer/components/settings/LogViewer.tsx` - Log viewer component with search/filter/export

### Modified Files (20)
1. `package.json` - Add electron-log dependency
2. `src/shared/types/ai.types.ts` - Add LoggingConfig interface
3. `src/shared/types/ipc.types.ts` - Add log control IPC channels
4. `src/main/index.ts` - Initialize logger on startup
5. `src/main/services/AIService.ts` - Replace 9 console calls with structured logging
6. `src/main/services/PermissionService.ts` - Replace 20 console calls with structured logging
7. `src/main/services/ToolExecutionService.ts` - Replace 5 console calls, add performance timing
8. `src/main/services/ToolRegistry.ts` - Replace 2 console calls with structured logging
9. `src/main/tools/ReadTool.ts` - Replace console calls with structured logging
10. `src/main/tools/WriteTool.ts` - Replace console calls with structured logging
11. `src/main/tools/EditTool.ts` - Replace console calls with structured logging
12. `src/main/tools/DeleteTool.ts` - Replace console calls with structured logging
13. `src/main/tools/BashTool.ts` - Replace console calls with structured logging
14. `src/main/tools/GlobTool.ts` - Replace console calls with structured logging
15. `src/main/tools/GrepTool.ts` - Replace console calls with structured logging
16. `src/main/ipc/aiHandlers.ts` - Replace 3 console calls, add log management IPC handlers
17. `src/main/ipc/toolHandlers.ts` - Replace 3 console calls with structured logging
18. `src/main/services/SettingsService.ts` - Add logging configuration management
19. `src/renderer/components/modals/SettingsModal.tsx` - Add Logs tab with viewer/controls
20. `tsconfig.json` - Verify @main path alias works for logger imports

## Technical Requirements

### Security (Development Best Practices) ✅

**No Sensitive Data in Logs:**
```typescript
// ❌ BAD: Logging API key
logger.info('[AIService] Initialize', { apiKey: config.apiKey });

// ✅ GOOD: Redact sensitive data
logger.info('[AIService] Initialize', {
  model: config.model,
  socEndpoint: config.socEndpoint,
  hasApiKey: !!config.apiKey  // Boolean only
});
```

**Security Checklist:**
- [ ] Never log API keys, tokens, passwords
- [ ] Never log full file paths (use relative paths)
- [ ] Never log user PII (email, phone, address)
- [ ] Redact sensitive fields in objects
- [ ] Log file permissions: User-only read/write
- [ ] Automated scan for secrets in logs

### Error Handling (Development Best Practices) ✅

**Graceful Degradation:**
```typescript
export function initializeLogger(): void {
  try {
    log.transports.file.level = process.env.LOG_LEVEL || 'debug';
    log.transports.file.fileName = 'lighthouse-main.log';
    // ... configuration
    logger.info('[Logger] Initialized');
  } catch (error) {
    // Fallback: Log to console only
    console.error('[Logger] Failed to initialize file logging:', error);
    console.error('[Logger] Falling back to console-only logging');
  }
}
```

**Error Handling Checklist:**
- [ ] Try-catch around logger initialization
- [ ] Fallback to console if file logging fails
- [ ] Finally blocks for cleanup
- [ ] Errors logged with stack traces
- [ ] User-friendly error messages in UI

### Logging Standards (Development Best Practices) ✅

**Structured Logging:**
```typescript
// ✅ GOOD: Structured data as object
logger.info('[ToolExecutionService] Executing tool', {
  toolName: 'read_file',
  parameters: { path: 'src/index.ts' },
  timestamp: Date.now()
});

// Output:
// [2026-01-21 15:30:45.123] [info] [ToolExecutionService] Executing tool {"toolName":"read_file","parameters":{"path":"src/index.ts"},"timestamp":1737475845123}
```

**Appropriate Log Levels:**
```typescript
logger.error('[AIService] Initialization failed', { error: error.message }); // Critical failures
logger.warn('[PermissionService] Permission timeout', { toolName, timeout }); // Issues/warnings
logger.info('[ToolExecutionService] Tool complete', { duration }); // Important operations
logger.debug('[ToolRegistry] Registered tool', { toolName }); // Detailed diagnostics
```

**Performance Logging:**
```typescript
const start = Date.now();
const result = await tool.execute(params);
const duration = Date.now() - start;

if (duration > 1000) {
  logger.warn('[ToolExecutionService] Slow operation', {
    toolName: tool.name,
    duration,
    threshold: 1000
  });
} else {
  logger.info('[ToolExecutionService] Tool complete', {
    toolName: tool.name,
    duration
  });
}
```

### Anti-Hardcoding (Development Best Practices) ✅

**No Hardcoded Paths:**
```typescript
// ❌ BAD: Hardcoded path
const logPath = '/Users/roylove/Library/Application Support/lighthouse-beacon/logs';

// ✅ GOOD: Use Electron API
const userDataPath = app.getPath('userData');
const logPath = path.join(userDataPath, 'logs');
```

**Configuration-Driven:**
```typescript
// Log level from environment or config
const logLevel = process.env.LOG_LEVEL || config.get('logging.level', 'debug');

// Rotation settings from config
const maxSize = config.get('logging.maxSize', 50 * 1024 * 1024);
const retention = config.get('logging.retentionDays', 7);
```

### Testing Requirements (Development Best Practices) ✅

**Unit Tests:**
```typescript
describe('Logger Module', () => {
  describe('initializeLogger', () => {
    it('should initialize electron-log with correct configuration', () => {
      initializeLogger();
      expect(log.transports.file.level).toBe('debug');
      expect(log.transports.file.fileName).toBe('lighthouse-main.log');
    });

    it('should handle initialization errors gracefully', () => {
      // Mock file system error
      jest.spyOn(log.transports.file, 'resolvePathFn').mockImplementation(() => {
        throw new Error('Permission denied');
      });

      // Should not throw, should log to console
      expect(() => initializeLogger()).not.toThrow();
    });
  });

  describe('setLogLevel', () => {
    it('should change log level at runtime', () => {
      setLogLevel('error');
      expect(log.transports.file.level).toBe('error');
      expect(log.transports.console.level).toBe('error');
    });

    it('should validate log level values', () => {
      expect(() => setLogLevel('invalid')).toThrow('Invalid log level');
    });
  });

  describe('getLogConfig', () => {
    it('should return current log configuration', () => {
      const config = getLogConfig();
      expect(config).toEqual({
        fileLevel: 'debug',
        consoleLevel: 'debug',
        filePath: expect.stringContaining('lighthouse-main.log')
      });
    });
  });
});
```

**Integration Tests:**
```typescript
describe('Logging Integration', () => {
  it('should create log file on app startup', async () => {
    // Start app
    await app.ready;

    // Check log file exists
    const logPath = path.join(app.getPath('userData'), 'logs', 'lighthouse-main.log');
    expect(fs.existsSync(logPath)).toBe(true);
  });

  it('should rotate log file at 50MB', async () => {
    // Write 50MB+ of logs
    for (let i = 0; i < 1000000; i++) {
      logger.info('Test log entry', { iteration: i });
    }

    // Check rotated file exists
    const logDir = path.join(app.getPath('userData'), 'logs');
    const files = fs.readdirSync(logDir);
    const rotatedFiles = files.filter(f => f.match(/lighthouse-main-\d{4}-\d{2}-\d{2}\.log/));
    expect(rotatedFiles.length).toBeGreaterThan(0);
  });

  it('should log from all services correctly', async () => {
    // Initialize services
    await aiService.initialize({ apiKey: 'test-key' });
    await permissionService.initialize();
    await toolExecutionService.executeTool('read_file', { path: 'test.ts' });

    // Read log file
    const logPath = path.join(app.getPath('userData'), 'logs', 'lighthouse-main.log');
    const logContent = fs.readFileSync(logPath, 'utf-8');

    // Verify logs from all services
    expect(logContent).toContain('[AIService] Successfully initialized');
    expect(logContent).toContain('[PermissionService] Initialized');
    expect(logContent).toContain('[ToolExecutionService] Executing tool');
  });
});
```

**Test Coverage Target:** >80% for logger module, >70% for service migrations

---

## Risk Assessment

### High Risk
**Risk:** Accidentally logging sensitive data (API keys, passwords)
- **Probability:** Medium
- **Impact:** Critical (security vulnerability)
- **Mitigation:**
  - Code review checklist: "No sensitive data in logs"
  - Automated scanning: `grep -r "apiKey\|password\|token" logs/`
  - Redaction patterns in logger module
  - Sanitization function for objects
- **Contingency:** Provide log sanitization tool, clear logs immediately if leaked

### Medium Risk
**Risk:** Log files consuming excessive disk space
- **Probability:** Low
- **Impact:** Medium (app unusable if disk full)
- **Mitigation:**
  - Automatic rotation at 50MB
  - 7-day retention (max ~350MB)
  - User control to clear logs
  - Warn user if disk space <1GB
- **Contingency:** Emergency log cleanup, reduce retention to 3 days

**Risk:** Performance impact from excessive logging
- **Probability:** Low
- **Impact:** Medium (app feels slow)
- **Mitigation:**
  - Async file writes (non-blocking)
  - Appropriate log levels (DEBUG for dev only)
  - Profiling before/after implementation
  - Ability to disable file logging
- **Contingency:** Add SILENT log level, disable file transport

### Low Risk
**Risk:** Breaking existing functionality during migration
- **Probability:** Low
- **Impact:** Medium (features broken)
- **Mitigation:**
  - Comprehensive testing after each wave
  - Verify app works with logger enabled
  - Feature flags to disable logging if needed
  - Rollback plan (revert commits)
- **Contingency:** Hot-fix to restore console logging, fix issues

---

## Dependencies

**Internal Dependencies:**
- Existing SettingsService for configuration
- Existing Settings modal for UI extension
- IPC channel infrastructure (ai.types.ts, ipc.types.ts)
- Electron app.getPath('userData') API
- Node.js fs/path modules

**External Dependencies:**
- electron-log npm package (5.x)

**Blocked By:** None

**Blocks:**
- Feature 7.2: Application Monitoring (needs logger for metrics)
- Feature 7.3: Error Reporting (needs logger for crash reports)

---

## Success Metrics

**Quantitative:**
- ✅ Zero console.log/error calls (88 → 0)
- ✅ Log files <50MB before rotation
- ✅ Log operations <5ms average
- ✅ Test coverage >80%
- ✅ Zero sensitive data in logs (scan clean)

**Qualitative:**
- ✅ Developers can troubleshoot using logs
- ✅ Users find log viewer helpful
- ✅ Support team can diagnose issues from exported logs
- ✅ No user complaints about disk space

---

## Validation & Testing

### Comprehensive Wave Validation

The single wave delivers all three user stories together. Validation should be performed incrementally as implementation progresses:

**Phase 1: Foundation & Core Logging (User Story 1)**
```bash
# Install and verify
npm install
npm run dev

# Check log file created
ls -la ~/Library/Application\ Support/lighthouse-beacon/logs/
# Should see: lighthouse-main.log

# Tail log file
tail -f ~/Library/Application\ Support/lighthouse-beacon/logs/lighthouse-main.log
# Should see: [2026-01-21 15:30:00.123] [info] [Logger] Initialized

# Unit tests
npm test -- logger.test.ts
# Should pass with >80% coverage
```

**Phase 2: Complete Service Migration (User Stories 1 & 2)**
```bash
# Verify no console calls remain
grep -r "console\.\(log\|error\|warn\)" src/main/ --include="*.ts" --exclude="*.test.ts"
# Should return: (no results)

# Check structured logs
tail -50 ~/Library/Application\ Support/lighthouse-beacon/logs/lighthouse-main.log
# Should see JSON objects in logs

# Test tool execution logs timing
# Execute read_file tool → Check log shows duration
grep "ToolExecutionService" ~/Library/Application\ Support/lighthouse-beacon/logs/lighthouse-main.log | tail -5
# Should see: "duration":"125ms"

# Verify no secrets
grep -E "apiKey|password|token|secret" ~/Library/Application\ Support/lighthouse-beacon/logs/lighthouse-main.log
# Should return: (no matches) or only "hasApiKey:true"
```

**Phase 3: UI Integration & Log Management (User Stories 2 & 3)**
```bash
# Open Settings → Logs tab
# Should see: Logs tab exists, recent logs displayed

# Test search & filtering
# Type "AIService" → Should filter and highlight matches
# Select ERROR level → Should only show ERROR logs
# Select [PermissionService] → Should only show permission logs

# Test export
# Click Export → Should download lighthouse-logs-YYYY-MM-DD-HHmmss.log
# Verify file contains all logs (not just recent 100)

# Test clear
# Click Clear → Confirm → Logs deleted → Viewer empty

# Test runtime log level control
# Change to ERROR → Click Apply → New logs at ERROR level only
# Verify immediate effect (no restart required)

# Test persistence
# Restart app → Log level should persist

# Test performance monitoring
# Execute slow operation → Should see WARNING for operations >1s
# Check log shows: "Slow operation detected" with duration

# Test log configuration display
# Verify shows: current level, file path, file size, disk space
# If disk space <1GB → Should show warning
```

---

## Notes

**Development Best Practices Compliance:**
- ✅ Anti-hallucination: Read actual file paths, verify APIs exist
- ✅ Anti-hardcoding: Use app.getPath(), externalize config
- ✅ Error handling: Try-catch, graceful degradation
- ✅ Logging: Structured JSON, appropriate levels, no secrets
- ✅ Testing: Unit tests, integration tests, >80% coverage
- ✅ Security: No sensitive data, input validation, permissions

**Code Quality:**
- Follow existing service patterns
- TypeScript strict mode
- SOLID principles
- JSDoc comments for public APIs
- Existing IPC patterns

**User Experience:**
- Settings UI intuitive
- Log viewer responsive
- Search/filter fast
- Export creates timestamped file
- Clear asks for confirmation

---

## Next Steps

1. ✅ Feature plan complete and reviewed
2. → Use `/design-waves` command to create detailed wave plans
3. → Review wave plans with team
4. → Begin Wave 1 implementation
5. → Iterate based on testing and feedback

---

*Last Updated: January 21, 2026*
*Status: Planning Complete - Ready for wave design*
*Wave Coherence: ✅ VALIDATED (corrected dependency order)*
