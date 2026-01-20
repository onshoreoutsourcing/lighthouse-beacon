# Wave 3.3.2: Enhanced Permission System

## Wave Overview
- **Wave ID:** Wave-3.3.2
- **Feature:** Feature 3.3 - Shell Command Tool and Enhanced Permissions
- **Epic:** Epic 3 - File Operation Tools Implementation
- **Status:** Planning
- **Scope:** Enhance PermissionService with per-tool permission levels, session trust, risk indicators, and persistence
- **Wave Goal:** Deliver graduated permission controls that balance security with workflow efficiency across all seven tools

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Implement per-tool permission levels (ALWAYS_ALLOW, PROMPT, ALWAYS_DENY) for all seven tools
2. Enable session trust for moderate-risk operations while enforcing always-prompt for dangerous operations
3. Persist permission settings across application restarts with corruption-resistant defaults

---

## User Story 1: Per-Tool Permission Levels

**As a** user with different comfort levels for different operations
**I want** per-tool permission settings (always-allow, prompt, always-deny)
**So that** I can customize my security posture based on operation risk

**Priority:** High

**Acceptance Criteria:**
- [ ] read, glob, grep default to ALWAYS_ALLOW (safe operations)
- [ ] write, edit default to PROMPT with session trust option (moderate operations)
- [ ] delete, bash default to PROMPT without session trust option (dangerous operations)
- [ ] Permission level changes take effect immediately
- [ ] Unit test coverage >= 90%

**Estimated Hours:** 10 hours
**Objective UCP:** 7

---

## User Story 2: Session Trust for Batch Operations

**As a** power user performing batch refactoring
**I want** to trust AI for write/edit operations during my session
**So that** I can work efficiently without repeated permission prompts

**Priority:** High

**Acceptance Criteria:**
- [ ] "Trust this session" checkbox available for moderate-risk operations only
- [ ] Session trust skips permission modal for subsequent operations of same type
- [ ] Session trust resets when conversation ends
- [ ] Dangerous operations (delete, bash) never offer session trust option
- [ ] Integration tests verify trust reset on conversation end

**Estimated Hours:** 8 hours
**Objective UCP:** 6

---

## User Story 3: Permission Persistence

**As a** returning user
**I want** my permission settings remembered across app restarts
**So that** I do not have to reconfigure my preferences every time

**Priority:** High

**Acceptance Criteria:**
- [ ] Permission levels saved to userData/permissions.json
- [ ] Permissions loaded automatically on app start
- [ ] Corrupt or missing permission file falls back to safe defaults
- [ ] Session trust state is NOT persisted (session-only by design)
- [ ] Schema validation prevents invalid permission states

**Estimated Hours:** 6 hours
**Objective UCP:** 4

---

## User Story 4: Risk Indicators in Permission Modal

**As a** user making permission decisions
**I want** to see clear risk level indicators in the permission modal
**So that** I understand the severity of the operation before approving

**Priority:** Medium

**Acceptance Criteria:**
- [ ] Risk level (safe/moderate/dangerous) displayed in modal header
- [ ] Visual differentiation by color or icon for each risk level
- [ ] Keyboard shortcuts functional (Enter=approve, Esc=deny)
- [ ] Modal explains why dangerous operations cannot be trusted
- [ ] Permission decision logged with source tracking

**Estimated Hours:** 8 hours
**Objective UCP:** 5

---

## Definition of Done

- [ ] All 4 user stories completed with acceptance criteria met
- [ ] All seven tools have appropriate permission levels configured
- [ ] PermissionService enhanced per ADR-014 specification
- [ ] Unit test coverage >= 90% for PermissionService
- [ ] Integration tests verify permission flows across all tools
- [ ] Permission persistence tested across app restarts
- [ ] Code reviewed and approved
- [ ] No TypeScript/linter errors
- [ ] Security scan passed (no high/critical issues)
- [ ] Documentation updated (user guide section on permissions)

---

## Handoff Requirements

**For Feature 3.4 (Visual Integration):**
- Permission modal with risk indicators ready for integration
- All tools properly categorized by risk level

**For Epic 4 (Multi-Provider):**
- Permission system provider-agnostic (works with any AI provider)

---

## Risks and Blockers

| Risk/Blocker | Impact | Mitigation |
|--------------|--------|------------|
| Session trust concept confusing to users | Medium | Tooltip explanation, default unchecked |
| Permission file corruption | Low | Schema validation, fallback to defaults |
| Permission fatigue for bash commands | Medium | Clear UX, keyboard shortcuts, explain always-prompt rationale |

---

## Notes and Assumptions

- Builds on Epic 2 permission system foundation (ADR-008)
- BashTool from Wave 3.3.1 must be complete for integration testing
- Session trust reset triggers on conversation end event from ChatService
- ADR-014 defines the authoritative permission model

---

## Related Documentation

- Feature Plan: `/Users/roylove/dev/lighthouse-beacon/Docs/implementation/_main/feature-3.3-bash-permissions.md`
- ADR-014: `/Users/roylove/dev/lighthouse-beacon/Docs/architecture/decisions/ADR-014-permission-system-enhancement.md`
- ADR-008: Permission System UX Pattern (Foundation)
- Epic Plan: `/Users/roylove/dev/lighthouse-beacon/Docs/implementation/_main/epic-3-file-operation-tools-mvp.md`

---

**Total Stories:** 4
**Total Hours:** 32 hours
**Total Objective UCP:** 22
**Wave Status:** Planning
