# Epic 7: Infrastructure & Operations - Brainstorming

## Epic Context
New Epic focused on operational infrastructure: logging, monitoring, debugging tools, and production readiness features.

## Feature 7.1: Logging Infrastructure

### Initial Context from Plan
- Current state: 88 console.log/error calls across 47 files
- All using `[ServiceName]` prefix pattern
- No file persistence, rotation, or level management
- Proposed solution: electron-log with file logging, rotation, configurable levels

### Key Insights from Architecture Review

**Product Vision Alignment:**
- **Vision**: Professional software development with accessibility
- **How logging helps**: Better debugging, troubleshooting, production support
- **Enterprise readiness**: SOC traceability mentions "100% of AI file operations logged"

**Business Requirements:**
- FR-SOC-1: "All AI operations must be logged to SOC with traceability"
- NFR-Reliability-2: "System should provide diagnostic information for troubleshooting"
- NFR-Security-3: "API keys and secrets must never be logged"

**Architecture:**
- Electron desktop application (main + renderer processes)
- Service-oriented architecture (AIService, PermissionService, ToolExecutionService)
- IPC bridge pattern for main/renderer communication
- SOLID principles: Single Responsibility, Interface-based programming

### Questions & Answers

**Q: Should logging integrate with existing SOC infrastructure?**
A: Not needed - SOC integration handled by AIChatSDK separately, application logging is independent

**Q: Should logs be accessible from within application UI?**
A: Yes - Settings modal with log viewer, recent logs, export, clear functionality

**Q: What level of detail for permission decisions?**
A: Decisions only (INFO) - Log approvals, denials, timeouts; not every check

**Q: Should tool execution include performance metrics?**
A: Yes - Basic timing (start/end timestamps, duration only)

**Q: Log rotation behavior?**
A: Automatic rotation at 50MB, keep 7 days, silent operation

**Q: Different log files for subsystems?**
A: Single main log - One lighthouse-main.log with all main process logs

**Q: Structured data format?**
A: JSON objects for structured data

### Key Requirements Summary

**Must Have:**
- electron-log library integration
- File logging with automatic rotation (50MB, 7 days retention)
- Configurable log levels (DEBUG, INFO, WARN, ERROR)
- Runtime log level changes via settings
- Single main log file with JSON structured data
- Settings modal UI for log viewing, export, clear
- Replace all 88 console.log/error calls
- Maintain `[ServiceName]` prefix convention
- Performance timing for tool execution (basic)
- Never log secrets, API keys, sensitive data

**Should Have:**
- Log viewer in Settings modal with filtering
- Export logs functionality
- Clear/delete logs functionality
- Display current log configuration (level, file path, size)

**Could Have (Future):**
- Separate renderer process logging
- Real-time log streaming in UI
- Log search/grep functionality
- Separate log files by severity
- Remote log shipping

**Won't Have (This Feature):**
- SOC integration (handled by AIChatSDK)
- Separate log files per service
- Advanced log analytics
- Log aggregation from multiple app instances

### Technical Approach

**Library:** electron-log (zero dependencies, Electron-native)

**Architecture:**
- Logger module: `/src/main/logger.ts`
- Initialize on app startup in `index.ts`
- Import in all services via `import { logger } from '@main/logger'`
- IPC handlers for renderer log level changes
- Settings integration for log configuration

**Migration Strategy:**
- Replace all console calls in single implementation
- Remove all `// eslint-disable-next-line no-console` comments
- Focus on main process services first (AIService, PermissionService, ToolExecutionService, tools)

### Success Criteria

- Zero console.log/error calls in production code
- Log files created in userData/logs directory
- Logs contain timestamps, levels, context, structured data
- Log level changeable at runtime
- Settings UI shows log configuration
- Users can view/export/clear logs
- All functionality works without regressions

