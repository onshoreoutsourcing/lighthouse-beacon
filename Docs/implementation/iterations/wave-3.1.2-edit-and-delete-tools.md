# Wave 3.1.2: Edit and Delete Tools

## Wave Overview
- **Wave ID:** Wave-3.1.2
- **Feature:** Feature 3.1 - Core File Tools
- **Epic:** Epic 3 - File Operation Tools Implementation
- **Status:** Planning
- **Scope:** Implement EditTool and DeleteTool, complete integration testing for all core file tools
- **Wave Goal:** Deliver regex-capable file editing and safe deletion to complete the core file tool suite

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Implement EditTool with string and regex find/replace capabilities
2. Implement DeleteTool with recursive directory support and safety checks
3. Complete integration testing for all four core file tools
4. Verify SOC logging compliance across all file operations

---

## User Story 1: File Editing Capability

**As a** developer using conversational AI
**I want** AI to find and replace text within my files
**So that** AI can make targeted modifications without rewriting entire files

**Acceptance Criteria:**
- [ ] String-based find/replace works for exact matches
- [ ] Regex patterns supported for complex replacements
- [ ] Global replacement replaces all occurrences by default
- [ ] Single replacement mode available when requested
- [ ] Original content preserved for potential undo
- [ ] Invalid regex patterns return clear error message
- [ ] Permission prompt shown before edit operation
- [ ] Operations logged to SOC for compliance
- [ ] Unit test coverage exceeds 80%

**Priority:** High
**Objective UCP:** 14

---

## User Story 2: File and Directory Deletion Capability

**As a** developer using conversational AI
**I want** AI to delete files and directories from my project
**So that** AI can clean up generated or obsolete files

**Acceptance Criteria:**
- [ ] Individual files deleted successfully
- [ ] Empty directories deleted without special flags
- [ ] Non-empty directories require explicit recursive flag
- [ ] Deletion metadata returned (type, items deleted)
- [ ] Permission prompt always shown (no session trust for delete)
- [ ] Non-existent paths return clear error message
- [ ] Operations logged to SOC for compliance
- [ ] Unit test coverage exceeds 80%

**Priority:** High
**Objective UCP:** 12

---

## User Story 3: Core File Tools Integration

**As a** AI integration developer
**I want** all four core file tools working end-to-end with the AI framework
**So that** users can perform conversational file operations reliably

**Acceptance Criteria:**
- [ ] All tools (read, write, edit, delete) registered in ToolRegistry
- [ ] Tool schemas available to AIChatSDK for AI tool calling
- [ ] Permission system integration verified for all tools
- [ ] SOC logging verified for all operations
- [ ] Error messages AI-readable across all tools
- [ ] Integration tests passing for complete tool execution loop
- [ ] Security tests passing (no operations outside project root)

**Priority:** High
**Objective UCP:** 10

---

## Definition of Done

- [ ] All user stories completed with acceptance criteria met
- [ ] Unit tests written and passing (80% coverage minimum)
- [ ] Integration tests passing for all four tools
- [ ] Security tests passing (path traversal, symlink escape)
- [ ] SOC logging verified for all operations
- [ ] Permission integration verified (write/edit prompt, delete always-prompt)
- [ ] Code reviewed and approved
- [ ] No TypeScript/linter errors
- [ ] Documentation updated (tool API reference)

---

## Handoff Requirements

**For Feature 3.2 (Search Tools):**
- Core file tools complete and tested
- PathValidator and tool infrastructure stable
- ToolRegistry pattern established for new tools

**For Feature 3.3 (Bash Tool):**
- PathValidator available for working directory validation
- Tool execution patterns documented

**For Feature 3.4 (Visual Integration):**
- File operation events ready for UI integration
- Tool results structured for chat display

---

## Risks and Blockers

| Risk/Blocker | Impact | Mitigation |
|--------------|--------|------------|
| Regex catastrophic backtracking | Medium | Implement timeout for regex operations |
| Recursive delete safety | High | Require explicit flag, always prompt for confirmation |
| Wave 3.1.1 incomplete | High | Ensure PathValidator and tool types ready |

---

## Notes and Assumptions

- Depends on Wave 3.1.1 completion (PathValidator, tool types, ReadTool, WriteTool)
- Delete operations have highest risk level - always prompt, no session trust
- Reference ADR-010 for tool interface patterns
- Reference ADR-011 for path validation in all tools

---

## Related Documentation

- Feature Plan: Docs/implementation/_main/feature-3.1-core-file-tools.md
- Epic Plan: Docs/implementation/_main/epic-3-file-operation-tools-mvp.md
- ADR-010: File Operation Tool Architecture
- ADR-011: Directory Sandboxing Approach

---

**Total Stories:** 3
**Total Objective UCP:** 36
**Wave Status:** Planning
