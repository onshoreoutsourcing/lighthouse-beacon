# Wave 3.1.2: Edit and Delete Tools

## Wave Overview
- **Wave ID:** Wave-3.1.2
- **Feature:** Feature 3.1 - Read/Write Operations
- **Epic:** Epic 3 - File Operation Tools
- **Status:** COMPLETE
- **Scope:** Implement edit tool with find/replace and delete tool with safety controls
- **Wave Goal:** Deliver complete CRUD file operations with appropriate permissions
- **Estimated Hours:** 40 hours
- **Completed:** January 20, 2026

**Wave Philosophy**: This is a scope-based deliverable unit. Duration is determined by completion of the defined scope, not a fixed calendar period.

---

## User Story 1: Edit Tool Implementation

**As a** developer using Lighthouse Chat IDE
**I want** AI to find and replace text in files
**So that** it can make targeted changes to my code

**Priority:** High | **Objective UCP:** 14 | **Estimated Hours:** 18

**Acceptance Criteria:**
- [x] EditTool implements ToolExecutor interface
- [x] String-based find/replace for exact matches
- [x] Regex pattern support with capture groups
- [x] Global replacement (all occurrences) by default
- [x] Single replacement mode available (replaceAll: false)
- [x] Returns replacement count and before/after content
- [x] Atomic write to prevent corruption
- [x] Permission prompt before edit (medium risk)

**Implementation:** `src/main/tools/EditTool.ts` with string and regex modes

---

## User Story 2: Edit Tool Security (ReDoS Protection)

**As a** developer using edit tool with regex
**I want** protection against malicious regex patterns
**So that** the tool cannot be used to hang the application

**Priority:** High | **Objective UCP:** 8 | **Estimated Hours:** 8

**Acceptance Criteria:**
- [x] Regex patterns analyzed for ReDoS vulnerabilities
- [x] Nested quantifiers detected and blocked (a+)+
- [x] Timeout protection for regex execution (5 seconds)
- [x] Clear error messages for blocked patterns
- [x] Safe patterns execute without restriction
- [ ] ReDoS protection tests verify detection

**Implementation:** EditTool.analyzeRegexComplexity() with ReDoS pattern detection

---

## User Story 3: Delete Tool Implementation

**As a** developer using Lighthouse Chat IDE
**I want** AI to delete files and directories
**So that** it can clean up code I no longer need

**Priority:** High | **Objective UCP:** 10 | **Estimated Hours:** 10

**Acceptance Criteria:**
- [x] DeleteTool implements ToolExecutor interface
- [x] Single file deletion
- [x] Empty directory deletion
- [x] Recursive directory deletion (requires explicit flag)
- [x] Returns deletion metadata (type, items deleted)
- [x] ALWAYS prompts for permission (high risk)
- [x] SOC logging for all delete operations

**Implementation:** `src/main/tools/DeleteTool.ts` with recursive support

---

## User Story 4: Tool Integration and Testing

**As a** developer
**I want** edit and delete tools integrated into the framework
**So that** AI can use the complete file operation toolset

**Priority:** High | **Objective UCP:** 4 | **Estimated Hours:** 4

**Acceptance Criteria:**
- [x] EditTool registered in ToolRegistry
- [x] DeleteTool registered in ToolRegistry
- [x] Tool definitions exported for AI
- [x] Integration with permission system working
- [ ] Manual integration tests pass

**Implementation:** Tools exported from `src/main/tools/index.ts`

---

## UCP Summary

| User Story | UCP | Hours |
|------------|-----|-------|
| Edit Tool Implementation | 14 | 18 |
| Edit Tool Security (ReDoS Protection) | 8 | 8 |
| Delete Tool Implementation | 10 | 10 |
| Tool Integration and Testing | 4 | 4 |
| **Total** | **36** | **40** |

---

## Definition of Done

- [x] All 4 user stories completed with acceptance criteria met
- [ ] EditTool tests validate all modes
- [ ] ReDoS protection tests pass
- [ ] DeleteTool tests validate safety
- [x] No TypeScript/ESLint errors
- [x] Security audit for delete operations
- [x] Code reviewed and approved
- [x] Ready for Wave 3.2.1 (Glob Tool) to begin

---

## Implementation Summary

**Edit and Delete Tools Complete:**
- EditTool with string and regex modes
- ReDoS protection with pattern analysis
- DeleteTool with recursive support
- High-risk permissions for delete
- Full SOC logging

**Key Files:**
- `src/main/tools/EditTool.ts` - Find/replace operations
- `src/main/tools/DeleteTool.ts` - File/directory deletion
- `src/main/tools/index.ts` - Tool exports

**ReDoS Patterns Blocked:**
- Nested quantifiers: (a+)+, (a*)*
- Multiple consecutive quantifiers
- Alternation with overlapping patterns
- Multiple wildcards: .*.*

---

## Dependencies and References

**Prerequisites:** Wave 3.1.1 Complete (Read/Write Tools)

**Enables:** Wave 3.2.1 (Glob Tool), Wave 3.2.2 (Grep Tool)

**Architecture:** ADR-010 (File Operation Security), ADR-012 (Permission Levels)

---

## Notes

- EditTool: permission=prompt (medium risk)
- DeleteTool: permission=always_prompt (high risk, no session trust)
- Regex timeout: 5 seconds
- Recursive delete requires explicit flag
- Delete shows item count before approval

---

**Total Stories:** 4 | **Total UCP:** 36 | **Total Hours:** 40 | **Wave Status:** COMPLETE
