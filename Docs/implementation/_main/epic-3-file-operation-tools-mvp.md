# Epic 3: File Operation Tools Implementation (MVP Complete)

## Epic Overview
- **Epic ID:** Epic-3
- **Status:** Planning
- **Duration:** 2-3 weeks
- **Team:** 1-2 developers
- **Priority:** Critical (P0) - **MVP Milestone**
- **Phase:** Phase 3

## Problem Statement

With desktop foundation (Epic 1) and AI integration (Epic 2) complete, users can converse with AI but cannot perform actual file operations. The AI can suggest operations but has no tools to execute them. This Epic implements the core file operation tools that enable conversational development - the primary value proposition of Lighthouse Chat IDE.

Currently:
- AI can respond to questions but cannot read files
- No way to create, edit, or delete files through conversation
- Cannot search codebase (glob, grep)
- Cannot execute shell commands safely
- Tool framework exists but has no actual tools

**This Epic delivers the MVP** - after completion, users can perform all file operations conversationally, making Lighthouse Chat IDE a complete, usable product that provides immediate value.

This Epic addresses the need for:
- **File Operation Tools**: Read, write, edit, delete files through AI conversation
- **Search Tools**: Find files (glob) and search content (grep) efficiently
- **Shell Command Tool**: Execute bash commands with proper sandboxing
- **Visual Integration**: Files open in editor, explorer refreshes, clickable file links
- **Enhanced Permissions**: Per-tool controls, sandboxing, dangerous operation warnings
- **Complete Tool Execution Loop**: AI suggests → permission check → execute → result → AI continues

**References:**
- Product Vision (01-Product-Vision.md): "Visual First, Conversational Always" - tools must integrate with visual UI
- Business Requirements (03-Business-Requirements.md): FR-1 (Natural Language File Operations), FR-7 (Real-Time Visual Feedback), FR-9 (Tool Execution Loop)
- Product Plan (02-Product-Plan.md): Phase 3 marks MVP completion
- DEVELOPMENT-PHASES.md: Phase 3 detailed requirements and MVP definition

## Goals and Success Criteria

**Primary Goal**: Implement complete file operation toolset enabling AI to perform all codebase modifications conversationally, achieving MVP status.

**Success Metrics:**
- AI successfully reads, creates, edits, deletes files through conversation (> 95% success rate)
- File searches (glob, grep) work efficiently (< 1 second for typical codebases)
- Shell commands execute safely with sandboxing (no operations outside project directory)
- Visual interface updates correctly when AI performs operations (< 100ms refresh)
- Permission system prevents unauthorized operations (100% approval required before dangerous operations)
- All file operations logged via AIChatSDK (100% SOC coverage)
- Users can click file references in chat to open in editor
- Beta users successfully use tool for real development tasks

**MVP Exit Criteria** (must achieve before Epic 4):
- Complete working MVP with all file operation tools functional
- Users can explore and understand codebases conversationally
- Users can perform refactoring tasks 5x faster than manual approach
- File operations integrate seamlessly with visual UI (explorer, editor)
- 50+ Lighthouse developers actively using MVP
- User satisfaction: NPS > 40
- **Product is usable and valuable** - beta testing validates core concept

## Scope

### In Scope
- Core file operation tools implementation:
  - `read`: Read file contents (full file or line ranges)
  - `write`: Create new files or overwrite existing
  - `edit`: Find and replace operations within files
  - `delete`: Delete files or directories (with confirmation for dangerous operations)
  - `glob`: Find files matching patterns (e.g., "*.ts", "src/**/*.tsx")
  - `grep`: Search content across files (regex support)
  - `bash`: Execute shell commands with safety controls
- Tool implementations in TypeScript with error handling and validation
- Integration with Electron file system APIs
- Tool schemas/definitions for AIChatSDK integration
- Visual integration:
  - File operation results displayed in chat with clickable links
  - File explorer updates when AI creates/deletes files
  - Editor tabs refresh when AI modifies open files
  - Auto-open files in editor when AI references them
- Permission system enhancements:
  - Per-tool permission controls (e.g., allow read but require approval for write)
  - Directory sandboxing (restrict AI to specific folders)
  - Dangerous operation warnings (delete, bash) with extra confirmation
  - Approve/deny prompts showing operation details
- Complete tool execution loop (AI → permission → execute → result → AI)
- Safety checks:
  - Prevent operations outside project directory
  - Validate file paths (no directory traversal attacks)
  - Sanitize bash commands (block dangerous patterns)
- Error handling and user-friendly error messages
- Beta testing with Lighthouse development team

### Out of Scope
- Multi-provider support (Epic 4 - still Claude only in MVP)
- Advanced conversation features (Epic 4 - save/load UI, search)
- Diff view or change review UI (Epic 5)
- Advanced editor features beyond basic viewing (Epic 5)
- Undo/redo for AI operations (Epic 5 - change management)
- Advanced bash features like pipes, environment variables (keep MVP simple)
- File watching for external changes (future enhancement)
- Batch operations or macros (future enhancement)

## Planned Features

This Epic will be broken down into the following Features:
- **Feature 3.1**: Core File Tools (Read, Write, Edit, Delete) - Implement basic file manipulation tools with safety checks and error handling
- **Feature 3.2**: Search and Discovery Tools (Glob, Grep) - Build efficient file finding and content search capabilities
- **Feature 3.3**: Shell Command Tool and Enhanced Permissions - Implement bash tool with sandboxing, enhance permission system with per-tool controls and warnings
- **Feature 3.4**: Visual Integration and Beta Testing - Connect tools to UI (explorer refresh, editor updates, clickable links), conduct beta testing

{Note: Actual Feature plans will be created using /design-features command}

## Dependencies

**Prerequisites (must complete before this Epic):**
- Epic 1 complete (Desktop foundation with file explorer and editor)
- Epic 2 complete (AI integration with tool calling framework and permissions)
- Tool calling infrastructure operational
- Permission system foundation in place

**Enables (this Epic enables):**
- **MVP Product**: First usable version providing immediate value
- Epic 4 (Multi-Provider Support - requires working tool set to validate across providers)
- Epic 5 (Advanced Features - requires basic operations working)
- Beta testing and user feedback collection

**External Dependencies:**
- **Node.js fs module**: Required for file system operations
  - Status: Available (built into Node.js)
  - Impact if unavailable: Critical blocker
  - Mitigation: Node.js stable, fs module standard
- **Electron file system access**: Required for accessing user's codebase
  - Status: Available (Electron provides full filesystem access)
  - Impact if unavailable: Critical blocker
  - Mitigation: Electron architecture designed for filesystem access
- **Child Process API**: Required for bash tool
  - Status: Available (Node.js built-in)
  - Impact if unavailable: Cannot implement bash tool
  - Mitigation: Standard Node.js feature, well-documented

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Bash tool security vulnerabilities (command injection) | High | Medium | Whitelist safe commands; sanitize input; require explicit approval; sandbox to project directory |
| File operations corrupt files or cause data loss | High | Low | Validate operations before execution; implement atomic writes; backup on delete; thorough testing |
| Permission prompts too disruptive, slow workflow | Medium | Medium | Per-tool settings; "trust this session" option; remember decisions per-operation-type |
| Glob/grep performance poor on large codebases | Medium | Low | Use efficient algorithms (ripgrep patterns); limit results; provide progress indicators; test with large repos |
| AI suggests incorrect file paths or operations | Low | Medium | Validate paths; provide clear errors to AI so it can correct; user sees operation before approval |
| Visual integration introduces lag or UI freezes | Medium | Low | Async operations; debounce refresh; test with rapid operations; use React concurrent features |

## Technical Considerations

**Architecture Patterns:**
- **Strategy Pattern**: Different tool implementations with common interface
- **Command Pattern**: Each tool operation as encapsulated command for logging and undo (future)
- **Facade Pattern**: Unified FileOperationService wrapping individual tools
- **Observer Pattern**: UI components subscribe to file system changes

**Technology Stack:**
- **File Operations**: Node.js fs/promises (async/await)
- **Path Handling**: Node.js path module (cross-platform compatibility)
- **Pattern Matching**: minimatch or globby for glob patterns
- **Content Search**: Fast-glob + custom grep implementation (or ripgrep-js)
- **Shell Execution**: Node.js child_process.spawn (for bash tool)
- **Validation**: Path validation library to prevent directory traversal

**Key Technical Decisions:**
1. **Tool Implementation Architecture**:
   - Each tool as separate TypeScript module
   - Common interface: `ToolExecutor<TParams, TResult>`
   - Centralized registration in ToolRegistry
   - Rationale: Modularity, testability, easy to add new tools

2. **File Path Handling**:
   - All paths relative to project root
   - Convert to absolute internally for operations
   - Validate against project root to prevent escapes
   - Rationale: Security, simplicity for AI, clear user expectations

3. **Error Handling Strategy**:
   - Tools return structured errors (type, message, recoverable flag)
   - Errors formatted for AI understanding
   - User-friendly error messages in UI
   - Rationale: AI can adapt to errors, users understand issues

4. **Visual Integration Approach**:
   - File explorer polling every 100ms when operations active
   - Editor refreshes via file watcher events
   - Chat displays results with markdown formatting and clickable file://paths
   - Rationale: Balance responsiveness with performance

5. **Permission System Enhancements**:
   - Per-tool permission levels: always-allow, always-deny, prompt
   - Dangerous operations (delete, bash) always require confirmation
   - Session-based trust optional but defaults to prompt-per-operation
   - Rationale: Flexibility while maintaining safety

## Compliance and Security

**Security Requirements:**
- **Directory Sandboxing**: All file operations restricted to project root directory
  - Validate all paths before execution
  - Block directory traversal attempts (../, absolute paths outside project)
  - Clear error messages when operations blocked
- **Bash Command Safety**:
  - Whitelist approach: block known dangerous commands (rm -rf /, sudo, etc.)
  - Require explicit approval for every bash command
  - Execute in sandboxed environment (cwd = project root, no elevated privileges)
  - Display full command before execution
- **Data Integrity**:
  - Atomic file writes (write to temp file, then rename)
  - Backup files before delete operations (move to trash, not permanent delete)
  - Validate file content before operations (encoding detection, corruption checks)
- **Input Validation**:
  - Sanitize all AI-provided parameters
  - Validate file paths, patterns, and content
  - Reject invalid or suspicious input with clear errors

**Compliance Requirements:**
- **SOC Traceability**: 100% of file operations logged
  - Log entry: timestamp, tool, parameters, result (success/failure), user approval status
  - Operations logged: read, write, edit, delete, glob, grep, bash
  - Storage: Via AIChatSDK to Lighthouse SOC system
- **Audit Trail**: Complete record of all file modifications
  - What changed, when, by whom (AI with user approval), why (conversation context)
- **User Control**: Explicit approval required for write/delete/bash operations
- **Compliance Scanning** (via AIChatSDK): PCI, HIPAA, SOC 2 violations detection
  - Flag sensitive data exposure (credit cards, SSNs, health records)
  - Warn before writing sensitive data to files

**Privacy Considerations:**
- File contents sent to AI provider only when explicitly requested
- File paths may appear in AI requests and SOC logs (acceptable for traceability)
- No telemetry or analytics beyond SOC logging

## Timeline and Milestones

| Milestone | Target Date | Description |
|-----------|-------------|-------------|
| Epic 3 Start | Week 1, Day 1 | Begin Feature 3.1 (Core File Tools) |
| Feature 3.1 Complete | Week 1, Day 5 | Read, Write, Edit, Delete tools working |
| Feature 3.2 Complete | Week 2, Day 2 | Glob and Grep tools operational |
| Feature 3.3 Complete | Week 2, Day 5 | Bash tool and enhanced permissions complete |
| Feature 3.4 Start | Week 3, Day 1 | Begin visual integration work |
| Beta Testing Start | Week 3, Day 2 | Lighthouse team begins using MVP |
| Epic 3 Complete / MVP | Week 3, Day 5 | All tools working, beta feedback positive, MVP criteria met |

**Buffer**: 2-3 days for beta testing feedback and bug fixes

**Dependencies on Timeline:**
- Feature 3.2 can start in parallel with Feature 3.1 completion (independent tools)
- Feature 3.3 depends on Feature 3.1 (needs core file operations for testing)
- Feature 3.4 depends on all tools being functional

**MVP Validation Period**: 1-2 weeks concurrent with Epic 3 for beta feedback and iteration

## Resources Required

- **Development**: 1-2 full-stack developers (Node.js + TypeScript + React)
- **Testing**: Lighthouse development team (10-15 beta users) starting Week 3
- **AI Provider**: Anthropic Claude API access for testing (users provide own keys)
- **Test Codebases**: Various sizes (small ~100 files, medium ~1,000 files, large ~10,000 files)
- **Documentation**: User guide for file operation tools and examples

**Skill Requirements:**
- Node.js file system APIs (fs/promises, path module)
- TypeScript advanced types (generics, conditional types)
- Security best practices (input validation, sandboxing)
- Pattern matching and text search algorithms
- Child process management and command execution
- React UI integration (hooks, context, async state)

**Beta Testing Requirements:**
- 10-15 Lighthouse developers committed to beta testing
- Variety of project types (web, backend, monolith, microservices)
- Feedback mechanism (Slack channel, surveys, weekly check-ins)
- Bug tracking system (GitHub Issues or similar)

## Related Documentation

- Product Vision: Docs/architecture/_main/01-Product-Vision.md (Section: Core Product Principles - Human in Control)
- Product Plan: Docs/architecture/_main/02-Product-Plan.md (Section: MVP Definition - Phase 3 Complete)
- Business Requirements: Docs/architecture/_main/03-Business-Requirements.md (FR-1, FR-6, FR-7, FR-9)
- Architecture: Docs/architecture/_main/04-Architecture.md (Tool Execution Architecture)
- DEVELOPMENT-PHASES.md: Phase 3 detailed breakdown and MVP criteria

## Architecture Decision Records (ADRs)

The following ADRs document key architectural decisions for this Epic:

- [ADR-010: File Operation Tool Architecture](../../architecture/decisions/ADR-010-file-operation-tool-architecture.md) - Modular tools with common ToolExecutor interface
- [ADR-011: Directory Sandboxing Approach](../../architecture/decisions/ADR-011-directory-sandboxing-approach.md) - Path validation and resolution to prevent directory traversal
- [ADR-012: Bash Command Safety Strategy](../../architecture/decisions/ADR-012-bash-command-safety-strategy.md) - Blocklist of dangerous commands with mandatory per-command approval
- [ADR-013: Visual Integration Pattern](../../architecture/decisions/ADR-013-visual-integration-pattern.md) - Event-based refresh for file explorer and editor updates
- [ADR-014: Permission System Enhancement](../../architecture/decisions/ADR-014-permission-system-enhancement.md) - Per-tool permission levels with session trust option

---

**Epic Status:** Planning
**MVP Milestone:** This Epic completes MVP - first usable product
**Template Version:** 1.0
**Last Updated:** 2026-01-19
