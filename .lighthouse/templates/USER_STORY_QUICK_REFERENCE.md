# User Story Granularity Quick Reference Card

**One-Page Guide for Wave Planning**

---

## The Golden Rules

| # | Rule | Good Example | Bad Example |
|---|------|--------------|-------------|
| 1 | **3-5 stories per wave** | 3 feature-level stories | 5 stories + 12 technical tasks |
| 2 | **Feature-level capabilities** | "Workspace Lifecycle Management" | "Create WorkspaceService class" |
| 3 | **Outcome-focused criteria** | "All commands support multi-workspace" | "File `src/commands.ts` modified" |
| 4 | **Testing is implicit** | "Unit test coverage >80%" | 7 explicit test case specs |
| 5 | **50-150 lines per wave** | Concise, clear scope | 500+ lines with every detail |

---

## Quick Validation Checklist

**Before finalizing wave document, verify:**

- [ ] 3-5 user stories (not 15+ items)
- [ ] No "Technical Tasks" section
- [ ] No "Logical Unit Test Cases" section
- [ ] No file paths in acceptance criteria
- [ ] No method names in acceptance criteria
- [ ] Testing mentioned as outcome only
- [ ] Document length < 200 lines
- [ ] Each story has estimated hours
- [ ] Stories describe WHAT, not HOW

**Pass: 7/9 checks** = Good granularity

---

## The Tests

### Is this a User Story or Technical Task?

**Ask**: Would a product manager consider this ONE deliverable?
- ✅ Yes → User Story
- ❌ No → Technical Task (track in Azure DevOps, not wave doc)

### Is this Good Acceptance Criteria?

**Ask**: Can this be implemented multiple valid ways?
- ✅ Yes → Outcome-focused (Good)
- ❌ No → Implementation-prescriptive (Bad)

### Should we break this into multiple stories?

**Ask**: Do these capabilities always ship together?
- ✅ Yes → Keep as ONE story
- ❌ No → Split into separate stories

---

## Common Mistakes & Fixes

| Mistake | Fix |
|---------|-----|
| **Breaking stories too far** | Merge related tasks into feature-level story |
| "Implement SEO Scorer" (task-level) | → "Dual-Scoring System Implementation" (feature-level) |
| **Technical tasks as stories** | Remove from wave doc, track in Azure DevOps |
| "Create base analyzer class" | → Part of implementation, not a user story |
| **Implementation in criteria** | Convert to outcome-focused |
| "File `config.json` created" | → "Configuration externalized in JSON" |
| **Documenting test cases** | Make testing implicit |
| "Test Case 1: Perfect score = 100" | → "Edge cases handled (perfect/failing/boundary)" |

---

## Wave Document Structure

```markdown
# Wave X.X.X: [Feature Name]

## Wave Overview
- Wave ID, Scope, Goal, Hours, Status

## User Story 1: [Feature-Level Capability]
**As a** [role]
**I want** [capability]
**So that** [value]

**Acceptance Criteria:**
- [ ] Outcome 1
- [ ] Outcome 2
- [ ] Tests passing >80%

**Estimated Hours:** XX

## User Story 2-3: [Repeat]

## Definition of Done
- All stories complete
- Tests passing
- Code reviewed

## Notes
- References, performance targets

**Total: 3 stories, XX hours**
```

---

## UCP Impact

| Granularity | Items | UCP | Accuracy |
|-------------|-------|-----|----------|
| Too Detailed | 27 | 329 | 6.3x over |
| Feature-Level | 3 | 37 | 1.4x over |
| Reality | 3 | 52 | Baseline |

**Correct granularity reduces over-estimation from 6.3x to 1.4x**

---

## What NOT to Include

❌ Logical Unit Test Cases section
❌ Technical Tasks breakdown (12+ tasks)
❌ Task Dependencies diagram
❌ Agent Assignments table
❌ Handoff Requirements (unless critical)
❌ Explicit test case specifications
❌ File paths or method signatures
❌ Code examples in user stories

---

**Full Guide**: `docs/templates/USER_STORY_GRANULARITY_GUIDE.md`
**Version**: 1.0 (2026-01-18)
