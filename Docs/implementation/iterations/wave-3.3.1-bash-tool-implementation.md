# Wave 3.3.1: BashTool Implementation

## Wave Overview
- **Wave ID:** Wave-3.3.1
- **Feature:** Feature 3.3 - Shell Command Tool and Enhanced Permissions
- **Epic:** Epic 3 - File Operation Tools Implementation
- **Status:** Planning
- **Scope:** Implement BashTool with blocklist validation, command execution, timeout enforcement, and security logging
- **Wave Goal:** Deliver a secure shell command execution tool that blocks dangerous commands while enabling common developer workflows

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Implement BashTool with comprehensive dangerous command blocklist validation
2. Enable secure command execution with timeout enforcement and directory sandboxing
3. Establish complete security logging for all command attempts and executions

---

## User Story 1: Shell Command Execution

**As a** developer using Beacon IDE
**I want** AI to execute common shell commands like npm, git, and node
**So that** I can perform development tasks conversationally without leaving the IDE

**Priority:** High

**Acceptance Criteria:**
- [ ] Shell commands execute in project root directory
- [ ] stdout and stderr captured and returned to AI for feedback
- [ ] Exit code returned for success/failure determination
- [ ] Commands start within 100ms of user approval
- [ ] Unit test coverage >= 90%

**Estimated Hours:** 12 hours
**Objective UCP:** 8

---

## User Story 2: Dangerous Command Protection

**As a** user concerned about system security
**I want** dangerous commands blocked before execution
**So that** AI cannot accidentally or maliciously harm my system

**Priority:** High (P0 - Critical Security)

**Acceptance Criteria:**
- [ ] All documented blocklist patterns validated (destructive, privilege escalation, remote execution, resource exhaustion)
- [ ] Blocked commands return clear explanation to user and AI
- [ ] No blocked command can bypass validation to execution
- [ ] Security test coverage 100% for all blocklist categories
- [ ] Unit tests cover both positive (blocked) and negative (allowed) cases

**Estimated Hours:** 14 hours
**Objective UCP:** 10

---

## User Story 3: Command Timeout and Resource Protection

**As a** user running commands through AI
**I want** runaway commands to timeout automatically
**So that** infinite loops or long-running processes do not hang the application

**Priority:** High

**Acceptance Criteria:**
- [ ] Commands timeout after 60 seconds with clean process termination
- [ ] Timeout uses SIGTERM then SIGKILL for graceful shutdown
- [ ] Partial output captured before timeout
- [ ] Clear timeout error message returned to AI
- [ ] Integration tests verify timeout behavior

**Estimated Hours:** 6 hours
**Objective UCP:** 5

---

## User Story 4: Command Execution Audit Trail

**As a** security auditor or compliance officer
**I want** all command executions logged to SOC
**So that** I have a complete audit trail of AI-initiated system operations

**Priority:** High

**Acceptance Criteria:**
- [ ] Successful executions logged with command, exit code, duration
- [ ] Failed executions logged with command and error details
- [ ] Blocked commands logged with command and block reason
- [ ] Logs include conversation context and timestamp
- [ ] Integration with AIChatSDK SOC logging verified

**Estimated Hours:** 6 hours
**Objective UCP:** 4

---

## Definition of Done

- [ ] All 4 user stories completed with acceptance criteria met
- [ ] BashTool implements ToolExecutor interface per ADR-010
- [ ] Blocklist patterns match ADR-012 specification
- [ ] Unit test coverage >= 90% for BashTool
- [ ] Security test coverage 100% for blocklist validation
- [ ] Integration tests verify AI tool calling flow
- [ ] Code reviewed and approved
- [ ] No TypeScript/linter errors
- [ ] Security scan passed (no high/critical issues)
- [ ] Documentation updated (inline comments)

---

## Handoff Requirements

**For Wave 3.3.2 (Permission System Enhancement):**
- BashTool registered with PermissionService as 'dangerous' risk level
- BashTool integration point ready for permission check injection

**For Feature 3.4 (Visual Integration):**
- BashTool output format compatible with chat display
- Error messages suitable for user-facing display

---

## Risks and Blockers

| Risk/Blocker | Impact | Mitigation |
|--------------|--------|------------|
| Blocklist false positives block legitimate commands | Medium | Extensive testing against common workflows (npm, git, node) |
| Blocklist misses dangerous pattern variant | High | Follow OWASP guidance, plan for quarterly review |
| Process termination incomplete on timeout | Medium | Use SIGTERM then SIGKILL sequence |

---

## Notes and Assumptions

- Focus on macOS/Linux for MVP; Windows support deferred to Epic 4
- No advanced bash features (pipes, environment variables) in MVP scope
- Depends on Feature 3.1 completion for integration testing with file tools
- ADR-012 defines the authoritative blocklist patterns

---

## Related Documentation

- Feature Plan: `/Users/roylove/dev/lighthouse-beacon/Docs/implementation/_main/feature-3.3-bash-permissions.md`
- ADR-012: `/Users/roylove/dev/lighthouse-beacon/Docs/architecture/decisions/ADR-012-bash-command-safety-strategy.md`
- ADR-010: File Operation Tool Architecture (ToolExecutor interface)
- Epic Plan: `/Users/roylove/dev/lighthouse-beacon/Docs/implementation/_main/epic-3-file-operation-tools-mvp.md`

---

**Total Stories:** 4
**Total Hours:** 38 hours
**Total Objective UCP:** 27
**Wave Status:** Planning
