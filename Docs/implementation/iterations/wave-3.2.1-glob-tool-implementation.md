# Wave 3.2.1: GlobTool Implementation

## Wave Overview
- **Wave ID:** Wave-3.2.1
- **Feature:** Feature 3.2 - Search and Discovery Tools
- **Epic:** Epic 3 - File Operation Tools Implementation (MVP)
- **Status:** Planning
- **Scope:** Implement GlobTool for file pattern matching with result limiting, .gitignore support, and performance optimization
- **Wave Goal:** Deliver functional GlobTool that enables AI to find files by pattern with sub-second performance

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

**Parallelization Opportunity:** This wave can be implemented in parallel with Waves 3.1.1 and 3.1.2 as there are no code dependencies on Core File Tools.

## Wave Goals

1. Implement GlobTool class implementing ToolExecutor<GlobParams, GlobResult> interface
2. Support comprehensive glob patterns with result limiting for AI context management
3. Achieve performance targets (less than 1 second for 10,000 file codebase)
4. Integrate with SOC logging for complete audit trail

## User Stories

### User Story 1: Glob Pattern Matching Engine

**As an** AI assistant
**I want** to search for files using glob patterns
**So that** I can locate files by name, extension, or directory structure during conversations

**Acceptance Criteria:**
- [ ] All standard glob patterns supported: `*`, `**`, `?`, `[...]`, `{a,b,c}`
- [ ] Recursive patterns (`**/*.tsx`) search entire project tree
- [ ] Brace expansion works correctly for multiple extensions
- [ ] Results returned as relative paths from project root
- [ ] Empty pattern returns helpful guidance message
- [ ] Unit tests passing with >80% coverage

**Priority:** High
**Objective UCP:** 14

---

### User Story 2: Result Limiting and Context Management

**As a** user
**I want** glob results limited to prevent overwhelming AI context
**So that** conversations remain responsive and focused

**Acceptance Criteria:**
- [ ] Maximum 100 results returned per search
- [ ] Truncation indicator clearly shows when results were limited
- [ ] Total match count reported even when truncated
- [ ] Results sorted by relevance (most recently modified first preferred)
- [ ] Metadata includes pattern used and scope searched
- [ ] Unit tests verify truncation behavior

**Priority:** High
**Objective UCP:** 10

---

### User Story 3: Ignore Patterns and Scope Control

**As a** developer
**I want** to control which files are searched and which are ignored
**So that** searches exclude irrelevant files like node_modules

**Acceptance Criteria:**
- [ ] Default ignores applied: node_modules, .git, build directories
- [ ] .gitignore patterns respected automatically
- [ ] Custom ignore patterns supported via parameter
- [ ] Subdirectory scope limits search to specified folder
- [ ] Hidden files excluded by default with option to include
- [ ] Unit tests verify ignore behavior

**Priority:** High
**Objective UCP:** 12

---

### User Story 4: Performance and Security

**As a** user with large codebases
**I want** fast glob searches that stay within project boundaries
**So that** searches complete quickly without accessing unauthorized files

**Acceptance Criteria:**
- [ ] Performance: less than 1 second for 10,000 file codebase
- [ ] Performance: less than 3 seconds for 50,000 file codebase
- [ ] Path traversal attempts blocked (../ patterns filtered)
- [ ] Symlinks followed only within project boundaries
- [ ] All operations logged to SOC with duration tracking
- [ ] Integration tests verify performance benchmarks

**Priority:** High
**Objective UCP:** 11

---

## Definition of Done

- [ ] All user stories completed with acceptance criteria met
- [ ] GlobTool registered in ToolRegistry
- [ ] Tool schema compatible with AIChatSDK format
- [ ] Unit test coverage >=80%
- [ ] Integration tests with real file system fixtures passing
- [ ] Performance benchmarks documented and verified
- [ ] Security tests for path traversal passing
- [ ] ESLint/Prettier pass with no errors
- [ ] Code reviewed and approved
- [ ] SOC logging verified for all operations

## Handoff Requirements

**For Wave 3.2.2 (GrepTool):**
- Glob infrastructure available for file filtering in grep searches
- Performance optimization patterns established
- Path validation utilities shared

**For Feature 3.4 (Visual Integration):**
- Glob results formatted for clickable file links
- Result metadata supports UI display

## Risks and Blockers

| Risk/Blocker | Impact | Mitigation |
|--------------|--------|------------|
| fast-glob performance on Windows | Medium | Test cross-platform early; have fallback to minimatch |
| Memory issues with very large repos | Medium | Early termination when limit reached; stream API |
| Symlink cycles causing infinite loops | Low | Use fast-glob built-in cycle detection |

## Notes

- Reference ADR-010 for ToolExecutor interface requirements
- Reference ADR-011 for directory sandboxing approach
- Can develop in parallel with Feature 3.1 (Core File Tools)
- fast-glob library preferred for performance and .gitignore support
- Test with fixtures: small (~100), medium (~1000), large (~10000) file codebases

---

**Total Stories:** 4
**Total Objective UCP:** 47
**Wave Status:** Planning
