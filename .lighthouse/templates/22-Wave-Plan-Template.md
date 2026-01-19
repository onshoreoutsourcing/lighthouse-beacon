# Wave {n}.{m}.{s}: {Wave Name}

## Wave Overview
- **Wave ID:** Wave-{n}.{m}.{s}
- **Feature:** Feature {n}.{m} - {Feature Name}
- **Epic:** Epic {n} - {Epic Name}
- **Status:** Planning
- **Scope**: {Describe the logical scope of deliverables for this wave}
- **Wave Goal:** {One sentence describing the wave goal - what will be delivered}

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

{Specific, measurable objectives for this wave's scope}

1. {Goal 1}
2. {Goal 2}
3. {Goal 3}

## User Stories

### User Story 1: {User Story Title}

**As a** {user role}
**I want** {capability}
**So that** {benefit}

**Acceptance Criteria:**
- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

**Priority:** {High/Medium/Low}

---

### User Story 2: {User Story Title}

**As a** {user role}
**I want** {capability}
**So that** {benefit}

**Acceptance Criteria:**
- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

**Priority:** {High/Medium/Low}

---

{Add more user stories as needed}

## Logical Unit Test Cases

{Unit tests to call API endpoints with data verification for creating or modifying data}

### Test Case 1: {Test Name}
- **Endpoint:** {API endpoint}
- **Method:** {GET/POST/PUT/DELETE}
- **Test Data:** {input data}
- **Expected Result:** {expected output}
- **Verification:** {what to verify}

### Test Case 2: {Test Name}
- **Endpoint:** {API endpoint}
- **Method:** {GET/POST/PUT/DELETE}
- **Test Data:** {input data}
- **Expected Result:** {expected output}
- **Verification:** {what to verify}

{Add more test cases as needed}

## Technical Tasks

### Task 1: {Task Description}
- **Agent:** {backend-specialist/frontend-specialist/quality-control/etc.}
- **Estimation:** {4-8 hours}
- **Dependencies:** {None or Task X}
- **Priority:** {High/Medium/Low}

**Deliverables:**
- {Deliverable 1 - specific files or features}
- {Deliverable 2}
- {Deliverable 3}

**Acceptance Criteria:**
- [ ] {Criterion 1}
- [ ] {Criterion 2}

---

### Task 2: {Task Description}
- **Agent:** {backend-specialist/frontend-specialist/quality-control/etc.}
- **Estimation:** {4-8 hours}
- **Dependencies:** {Task 1}
- **Priority:** {High/Medium/Low}

**Deliverables:**
- {Deliverable 1}
- {Deliverable 2}

**Acceptance Criteria:**
- [ ] {Criterion 1}
- [ ] {Criterion 2}

---

{Add more tasks as needed - each task should be 4-8 hours}

## Task Dependencies

```
Task 1 (no dependencies)
  ↓
Task 2 (depends on Task 1)
  ↓
Task 3 (depends on Task 2)
  ├─> Task 4 (parallel)
  └─> Task 5 (parallel)
      ↓
    Task 6 (depends on Task 4 & 5)
```

## Agent Assignments

| Agent | Tasks | Total Hours |
|-------|-------|-------------|
| backend-specialist | Task 1, Task 2, Task 4 | {total hours} |
| frontend-specialist | Task 3, Task 5 | {total hours} |
| quality-control | Task 6 | {total hours} |

## Definition of Done

- [ ] All user stories completed
- [ ] All acceptance criteria met
- [ ] All tasks completed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Code coverage ≥ 90%
- [ ] Code reviewed and approved
- [ ] No TypeScript/linter errors
- [ ] Security scan passed (no high/critical issues)
- [ ] Documentation updated
- [ ] Wave demo completed
- [ ] Deployed to staging environment

## Handoff Requirements

{What other agents or waves need from this wave to continue}

**For next wave ({n}.{m}.{s+1}):**
- {Handoff item 1}
- {Handoff item 2}

**For other Features/Epics:**
- {Integration point 1}
- {Integration point 2}

## Risks and Blockers

| Risk/Blocker | Impact | Mitigation |
|--------------|--------|------------|
| {Risk 1} | {High/Med/Low} | {Mitigation strategy} |
| {Risk 2} | {High/Med/Low} | {Mitigation strategy} |

## Notes and Assumptions

- {Assumption 1}
- {Assumption 2}
- {Note 1}

## Related Documentation

- Feature Plan: Docs/implementation/_main/feature-{n}.{m}-{feature-name}.md
- Epic Plan: Docs/implementation/_main/epic-{n}-{epic-name}.md
- Architecture: Docs/architecture/_main/05-Architecture.md

## Wave Retrospective

{This section will be filled in after wave completion}

### What Went Well
- {Item 1}

### What Could Be Improved
- {Item 1}

### Action Items
- [ ] {Action item 1}

---

**Template Version:** 2.0 (Scope-based Wave)
**Last Updated:** 2025-01-21
**Note:** Waves are organized by logical scope, not time periods. Complete when scope is delivered.
