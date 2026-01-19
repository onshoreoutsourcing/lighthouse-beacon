# Wave 3.2.2: GrepTool Implementation

## Wave Overview
- **Wave ID:** Wave-3.2.2
- **Feature:** Feature 3.2 - Search and Discovery Tools
- **Epic:** Epic 3 - File Operation Tools Implementation (MVP)
- **Status:** Planning
- **Scope:** Implement GrepTool for content search with text/regex modes, result limiting, and binary file exclusion
- **Wave Goal:** Deliver functional GrepTool that enables AI to search file contents with sub-second performance

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

**Parallelization Opportunity:** This wave can be implemented in parallel with Waves 3.1.1 and 3.1.2 as there are no code dependencies on Core File Tools.

## Wave Goals

1. Implement GrepTool class implementing ToolExecutor<GrepParams, GrepResult> interface
2. Support both literal text and regex search modes with case sensitivity options
3. Achieve performance targets (less than 1 second for 10,000 file codebase)
4. Handle binary files and large codebases gracefully

## User Stories

### User Story 1: Content Search Engine

**As an** AI assistant
**I want** to search file contents for patterns
**So that** I can find code definitions, usages, and text across the codebase

**Acceptance Criteria:**
- [ ] Literal text search finds exact matches across files
- [ ] Regex mode supports standard regular expression patterns
- [ ] Case-sensitive search enabled by default
- [ ] Case-insensitive option available via parameter
- [ ] File pattern filter uses GlobTool infrastructure
- [ ] Matches include file path, line number, and line content
- [ ] Unit tests passing with >80% coverage

**Priority:** High
**Objective UCP:** 15

---

### User Story 2: Result Limiting and Match Context

**As a** user
**I want** search results limited and formatted for AI consumption
**So that** AI can process results without context overflow

**Acceptance Criteria:**
- [ ] Maximum 500 matches returned per search
- [ ] Truncation indicator shows when results were limited
- [ ] Total match count and files searched reported in metadata
- [ ] Line content trimmed and readable (no excessive whitespace)
- [ ] Match position (start/end) included for highlighting
- [ ] Multiple matches per file listed separately with line numbers
- [ ] Unit tests verify truncation and formatting

**Priority:** High
**Objective UCP:** 12

---

### User Story 3: Binary File Handling and Robustness

**As a** developer
**I want** grep to automatically skip binary files and handle errors gracefully
**So that** searches work reliably across diverse codebases

**Acceptance Criteria:**
- [ ] Binary files detected and excluded automatically
- [ ] Common binary extensions skipped without byte inspection
- [ ] Permission errors handled gracefully (skip and continue)
- [ ] Individual file read errors do not fail entire search
- [ ] Clear message returned when no matches found
- [ ] Symlinks handled appropriately within project bounds
- [ ] Unit tests verify binary detection and error handling

**Priority:** High
**Objective UCP:** 11

---

### User Story 4: Performance and Security

**As a** user with large codebases
**I want** fast content searches that are protected against malicious patterns
**So that** searches complete quickly without security risks

**Acceptance Criteria:**
- [ ] Performance: less than 1 second for 10,000 file codebase (text search)
- [ ] Performance: less than 3 seconds for 50,000 file codebase
- [ ] ReDoS protection validates regex patterns before execution
- [ ] Dangerous nested quantifiers rejected with helpful message
- [ ] Stream-based reading prevents memory exhaustion
- [ ] Early termination when result limit reached
- [ ] All operations logged to SOC with duration and match count
- [ ] Integration tests verify performance benchmarks

**Priority:** High
**Objective UCP:** 13

---

## Definition of Done

- [ ] All user stories completed with acceptance criteria met
- [ ] GrepTool registered in ToolRegistry
- [ ] Tool schema compatible with AIChatSDK format
- [ ] Unit test coverage >=80%
- [ ] Integration tests with real file system fixtures passing
- [ ] Performance benchmarks documented and verified
- [ ] Security tests for ReDoS prevention passing
- [ ] Cross-platform testing completed (macOS, Windows, Linux)
- [ ] ESLint/Prettier pass with no errors
- [ ] Code reviewed and approved
- [ ] SOC logging verified for all operations
- [ ] Feature 3.2 documentation complete

## Handoff Requirements

**For Feature 3.3 (Bash + Permissions):**
- Grep available for bash command output verification
- Search tools demonstrate "always-allow" permission pattern

**For Feature 3.4 (Visual Integration):**
- Grep results formatted with clickable file:line links
- Result metadata supports UI display and navigation

**For AI Capabilities:**
- Full codebase exploration enabled
- Pattern-based file discovery operational

## Risks and Blockers

| Risk/Blocker | Impact | Mitigation |
|--------------|--------|------------|
| ReDoS vulnerability from user regex | High | Validate patterns before execution; timeout execution |
| Memory exhaustion on large files | Medium | Stream-based reading; skip files over size threshold |
| Slow regex searches on large repos | Medium | Early termination; optimize file filtering before search |
| Windows line ending handling | Low | Normalize line endings during search |

## Notes

- Reference ADR-010 for ToolExecutor interface requirements
- Reference ADR-011 for directory sandboxing approach
- Depends on GlobTool (Wave 3.2.1) for file pattern filtering
- Can develop in parallel with Feature 3.1 (Core File Tools)
- Stream reading via readline interface prevents memory issues
- Binary detection: check first 8KB for null bytes, or skip known extensions

---

**Total Stories:** 4
**Total Objective UCP:** 51
**Wave Status:** Planning
