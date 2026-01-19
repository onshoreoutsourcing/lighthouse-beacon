# User Story Granularity Guide for Wave Planning

**Version**: 1.0
**Created**: January 18, 2026
**Purpose**: Ensure wave documents have correct granularity for UCP estimation and development efficiency

---

## Executive Summary

**Problem**: Over-detailed wave documents (500+ lines with technical tasks) inflate UCP estimates by 156% and create artificial complexity.

**Solution**: Use feature-level user stories (3-5 per wave) focused on outcomes, not implementation details.

**Result**: Accurate UCP estimates, faster development, clearer scope.

---

## The Granularity Problem

### ❌ What We Had (WRONG)

**Lighthouse Site Engine Wave 1.1.1** (Original):
- **Length**: 566 lines
- **Structure**: 5 user stories + 12 technical tasks + 7 test cases + dependencies + risks
- **UCP Impact**: 329 UCP (grossly inflated)
- **Actual Complexity**: 52 UCP (6x over-estimate)

**Why It's Wrong**:
1. Technical tasks counted as separate use cases
2. Test cases treated as independent deliverables
3. Implementation details (file paths, method names) in acceptance criteria
4. Double-counting: User story + task describe same work

### ✅ What We Need (RIGHT)

**Lighthouse IDE Extension Sprint 5.5.2** (Mature Format):
- **Length**: 20 lines
- **Structure**: 1 user story with clear goals and acceptance criteria
- **Focus**: Feature-level capability (what), not implementation (how)
- **Testing**: Implicit ("unit tests passing >80%")
- **Technical Tasks**: Tracked separately in Azure DevOps

---

## The Golden Rules

### Rule 1: User Stories = Feature-Level Capabilities

**Definition**: A user story describes a complete, user-facing capability that delivers value.

**✅ GOOD Examples** (Feature-Level):
- "Dual-Scoring System Implementation"
- "WorkspaceServiceManager & Lifecycle Management"
- "Command Updates for Multi-Workspace"
- "Configuration Management System"

**❌ BAD Examples** (Too Granular):
- "Create Base Analyzer Class" (technical task)
- "Write Unit Tests for SEO Scorer" (implementation detail)
- "Add JSON schema validation function" (code-level task)
- "Create `tools/config/seo_geo_config.json`" (file creation)

**Test**: Would a product manager consider this ONE deliverable? If yes, it's a user story. If no, it's a technical task.

### Rule 2: 3-5 User Stories Per Wave (Not 5 Stories + 12 Tasks)

**Why**: Each wave should deliver 3-5 cohesive capabilities, not 20+ granular tasks.

**✅ GOOD** (Wave 1.1.1 - Correct Granularity):
```
Wave 1.1.1: Core Scoring Engine

User Stories:
1. Dual-Scoring System Implementation (25 hours)
2. Configuration Management System (15 hours)
3. Component Scoring Implementation (25 hours)

Total: 3 stories, 65 hours
```

**❌ BAD** (Wave 1.1.1 - Original):
```
Wave 1.1.1: Core Scoring Engine

User Stories (5):
1. Calculate SEO/GEO Composite Score
2. Configure Scoring Weights and Thresholds
3. Implement Individual Component Scorers
4. Generate Detailed Scoring Reports
5. Validate Scoring Accuracy

Technical Tasks (12):
1. Create Base Analyzer Class
2. Implement SEO Scorer
3. Implement GEO Scorer
4. Create Configuration System
5. Implement Configuration Loader
[... 7 more tasks ...]

Total: 17 items, 67 hours (same work, artificially fragmented)
```

**Result**: Same feature, 17 items vs 3 items. UCP inflation from artificial granularity.

### Rule 3: Acceptance Criteria = Testable Outcomes (Not Implementation)

**Focus**: What must be true when done, not how it's implemented.

**✅ GOOD** (Outcome-Focused):
- "Composite score calculated from 11 components with correct weights"
- "Scores validated within 5% of manual calculations"
- "Unit test coverage >80%"
- "All existing commands updated for multi-workspace support"
- "No memory leaks verified"
- "Performance acceptable (<10 seconds)"

**❌ BAD** (Implementation-Focused):
- "File `tools/config/seo_geo_config.json` created"
- "Function `calculate_seo_score()` returns float"
- "Class `SEOGEOAnalyzer` inherits from `BaseAnalyzer`"
- "Method `_calculate_scores()` implemented with type hints"
- "7 unit test functions written for component scorers"

**Test**: Can multiple implementations satisfy this criterion? If yes, it's outcome-focused (good). If no, it's prescriptive (bad).

### Rule 4: Testing is Implicit

**Don't**: Document explicit test cases in wave documents.

**❌ BAD**:
```markdown
## Logical Unit Test Cases

### Test Case 1: SEO Composite Score Calculation
- Function: `calculate_seo_score(component_scores)`
- Test Data:
  ```python
  component_scores = {
      'technical_seo': 90, 'on_page': 85, ...
  }
  ```
- Expected Result: `seo_score = 86.86`
- Verification: Assert score within 0.1 of expected value

[... 6 more test cases ...]
```

**✅ GOOD**:
```markdown
Acceptance Criteria:
- Unit test coverage >80%
- Integration tests passing
- Scores validated against manual calculations (within 5% margin)
```

**Why**: Explicit test cases are counted as separate use cases by UCP analysis, inflating estimates.

### Rule 5: No Technical Tasks as Separate Items

**Don't**: Break user stories into technical implementation tasks.

**❌ BAD**:
```markdown
User Story 1: Calculate SEO/GEO Composite Score

[... user story details ...]

Technical Tasks:
- Task 2: Implement SEO Scorer (8 hours)
- Task 3: Implement GEO Scorer (8 hours)
- Task 6: Implement Total Score Calculation (4 hours)
```

**✅ GOOD**:
```markdown
User Story 1: Dual-Scoring System Implementation

Acceptance Criteria:
- SEO score calculated from 6 components
- GEO score calculated from 5 components
- Total score = (SEO × 0.60) + (GEO × 0.40)
- Unit tests passing

Estimated Hours: 25 hours
```

**Why**: User story already describes the work. Technical tasks create double-counting.

**Where Technical Tasks Go**: Azure DevOps task board (created during sprint planning, not wave planning).

---

## The Wave Document Template

### Correct Format (Azure DevOps Aligned)

```markdown
# Wave [ID]: [Feature Name]

## Wave Overview
- **Wave ID:** Wave-X.X.X
- **Feature:** [Feature category]
- **Epic:** [Epic name]
- **Scope:** [1-2 sentence description of what this wave delivers]
- **Goal:** [Clear, measurable objective]
- **Estimated Hours:** [Total hours]
- **Status:** Not Started

---

## User Story 1: [Feature-Level Capability]

**As a** [user role]
**I want** [capability]
**So that** [business value]

**Priority:** High | Medium | Low

**Acceptance Criteria:**
- [ ] [Outcome 1 - what must be true]
- [ ] [Outcome 2 - what must be true]
- [ ] [Outcome 3 - what must be true]
- [ ] Unit test coverage ≥80%
- [ ] Integration tests passing
- [ ] [Performance requirement if applicable]

**Estimated Hours:** [Hours]

---

## User Story 2: [Feature-Level Capability]

[Same format as User Story 1]

---

## User Story 3: [Feature-Level Capability]

[Same format as User Story 1]

---

## Definition of Done

- [ ] All user stories completed with acceptance criteria met
- [ ] Code coverage ≥80%
- [ ] Integration tests validate expected behavior
- [ ] No linter errors or type errors
- [ ] Documentation complete (README, API docs)
- [ ] Code reviewed and approved
- [ ] Deployed to staging/production

---

## Notes
- [Reference materials]
- [Architecture decisions]
- [Performance targets]
- [Dependencies on other waves]

---

**Total Stories:** [Count]
**Total Hours:** [Sum]
**Wave Status:** Not Started
```

### What NOT to Include

**❌ Remove These Sections**:
- Logical Unit Test Cases (implementation detail)
- Technical Tasks breakdown (too granular, tracked in Azure DevOps)
- Task Dependencies diagram (implementation detail)
- Agent Assignments table (tracked in Azure DevOps)
- Handoff Requirements (assume continuous delivery)
- Risks and Blockers (track in Azure DevOps, not wave docs)
- Wave Retrospective template (conduct after wave, not plan before)

**Why**: These sections inflate perceived scope and cause UCP over-counting.

---

## Real-World Examples

### Example 1: Good Granularity (Sprint 5.5.2)

```markdown
# Sprint 5.5.2: WorkspaceServiceManager & Lifecycle Management

Implement the WorkspaceServiceManager to orchestrate multiple workspace instances,
handle VS Code workspace events, and manage service lifecycle.

## Sprint Goals:
- Implement WorkspaceServiceManager core functionality
- Handle VS Code workspace add/remove events
- Integrate with extension activation/deactivation
- Ensure error isolation between workspaces

## Acceptance Criteria:
- WorkspaceServiceManager fully implemented
- Workspace lifecycle management working
- VS Code event handling integrated
- Extension activation updated
- Error isolation verified
- All workspaces properly managed
- Unit test coverage >80%
- Integration tests passing
- No memory leaks
- Performance acceptable

**Total Hours:** 30-40 hours
```

**Analysis**:
- ✅ 1 user story (feature-level)
- ✅ 4 clear goals (what, not how)
- ✅ 10 outcome-focused criteria
- ✅ Testing implicit
- ✅ ~20 lines
- ✅ **UCP**: ~15-20 (accurate)

### Example 2: Bad Granularity (Wave 1.1.1 Original)

```markdown
# Wave 1.1.1: Core Scoring Engine

[566 lines of content including:]

## User Stories (5)
1. Calculate SEO/GEO Composite Score
2. Configure Scoring Weights and Thresholds
3. Implement Individual Component Scorers
4. Generate Detailed Scoring Reports
5. Validate Scoring Accuracy

## Logical Unit Test Cases (7)
[105 lines of test case specifications]

## Technical Tasks (12)
1. Create Base Analyzer Class (6 hours)
2. Implement SEO Scorer (8 hours)
3. Implement GEO Scorer (8 hours)
4. Create Configuration System (6 hours)
5. Implement Configuration Loader (4 hours)
[... 7 more tasks with detailed deliverables ...]

## Task Dependencies
[ASCII diagram showing task relationships]

## Agent Assignments
[Table mapping tasks to agents]

## Definition of Done
[Comprehensive checklist]

## Handoff Requirements
[Requirements for 3 subsequent waves]

## Risks and Blockers
[Table with mitigation strategies]

**Total Hours:** 67 hours
```

**Analysis**:
- ❌ 5 user stories + 12 technical tasks = 17 items (too many)
- ❌ 7 explicit test cases counted as use cases
- ❌ Implementation details in acceptance criteria
- ❌ 566 lines (28x longer than necessary)
- ❌ **UCP**: 329 (6x over-estimated)

### Example 3: Corrected Granularity (Wave 1.1.1 Fixed)

```markdown
# Wave 1.1.1: Core Scoring Engine

## Wave Overview
- **Wave ID:** Wave-1.1.1
- **Scope:** Implement dual-scoring system with SEO/GEO components and configurable weights
- **Goal:** Deliver functional scoring engine validated against manual calculations
- **Estimated Hours:** 65 hours
- **Status:** Not Started

---

## User Story 1: Dual-Scoring System Implementation

**As a** SEO analyst
**I want** composite SEO/GEO scoring with 60/40 weighting
**So that** I can evaluate both traditional SEO and AI answer engine optimization

**Priority:** High

**Acceptance Criteria:**
- [ ] Composite score calculated from 11 components (6 SEO, 5 GEO)
- [ ] Scores validated within 5% of manual calculations
- [ ] Letter grade assigned (A-F scale)
- [ ] Unit test coverage >80%
- [ ] Integration tests passing

**Estimated Hours:** 25 hours

---

## User Story 2: Configuration Management System

**As a** technical lead
**I want** externalized scoring configuration in JSON
**So that** weights can be adjusted quarterly without code changes

**Priority:** High

**Acceptance Criteria:**
- [ ] Configuration file with all weights and thresholds
- [ ] JSON schema validation at startup
- [ ] Environment variable overrides supported
- [ ] Default values provided if config missing
- [ ] Invalid configurations trigger clear error messages
- [ ] Unit tests passing

**Estimated Hours:** 15 hours

---

## User Story 3: Component Scoring Implementation

**As a** SEO analyst
**I want** individual scoring for all 11 SEO/GEO components
**So that** I can identify specific optimization opportunities

**Priority:** High

**Acceptance Criteria:**
- [ ] All 11 component scorers implemented (6 SEO, 5 GEO)
- [ ] Each component returns 0-100 score with breakdown
- [ ] Correct weights applied per component
- [ ] Edge cases handled (perfect, failing, boundary)
- [ ] Integration tests passing

**Estimated Hours:** 25 hours

---

## Definition of Done

- [ ] All 3 user stories completed with acceptance criteria met
- [ ] Code coverage ≥80%
- [ ] Integration tests validate against manual calculations
- [ ] No linter errors or type errors
- [ ] Documentation complete (README, architecture decisions)
- [ ] Code reviewed and approved

---

## Notes
- Manual calculation reference: onshoreoutsourcing.com SEO/GEO report
- Configuration follows ADR-004 quarterly recalibration pattern
- Performance target: <10 seconds for full analysis

---

**Total Stories:** 3
**Total Hours:** 65 hours
**Wave Status:** Not Started
```

**Analysis**:
- ✅ 3 user stories (consolidated from 5 + 12 tasks)
- ✅ Feature-level capabilities
- ✅ Outcome-focused acceptance criteria
- ✅ Testing implicit
- ✅ ~80 lines (86% reduction)
- ✅ **UCP**: 37 (accurate, close to pure blind 52)

---

## Granularity Checklist

Use this checklist to verify wave documents have correct granularity:

### Document Structure
- [ ] 3-5 user stories per wave (not 5 stories + 10+ tasks)
- [ ] Each user story is feature-level (not code-level)
- [ ] User stories follow "As a/I want/So that" format
- [ ] Document length: 50-150 lines (not 500+)

### User Story Content
- [ ] User stories describe capabilities, not implementation
- [ ] Acceptance criteria are outcome-focused
- [ ] Testing is implicit ("tests passing >80%")
- [ ] No file paths or method names in acceptance criteria
- [ ] No code examples in user stories

### What's Missing (Good)
- [ ] No "Logical Unit Test Cases" section
- [ ] No "Technical Tasks" breakdown (12+ tasks)
- [ ] No "Task Dependencies" diagram
- [ ] No "Agent Assignments" table
- [ ] No explicit test case specifications
- [ ] No "Handoff Requirements" section (unless truly needed)

### UCP Validation
- [ ] If analyzed by AI, user stories should map to 3-5 use cases (not 20+)
- [ ] Test cases NOT counted as separate use cases
- [ ] Technical tasks NOT counted as separate use cases
- [ ] Wave UCP estimate roughly equals hours ÷ 1.5 (rough check)

### Outcome Test
- [ ] Can a developer implement this in multiple valid ways? (Good)
- [ ] Does the story prescribe specific code structure? (Bad)
- [ ] Would a product manager see this as ONE deliverable? (Good)
- [ ] Are we describing WHAT, not HOW? (Good)

**Pass Threshold**: 15/20 checks passing = good granularity

---

## UCP Impact Analysis

### Impact of Correct Granularity on UCP

| Granularity | Use Cases Counted | UCP Estimate | Accuracy |
|-------------|-------------------|--------------|----------|
| **Too Detailed** (Original) | 27 items | 329 UCP | 6.3x over-estimate |
| **Feature-Level** (Corrected) | 3 stories | 37 UCP | 1.4x over-estimate |
| **Pure Blind** (Code-only) | Natural boundaries | 52 UCP | Baseline (most accurate) |

**Conclusion**: Correct granularity reduces UCP over-estimation from 6.3x to 1.4x.

### Why Granularity Matters for UCP

**UCP Methodology** (Use Case Points):
- **Actors**: External systems that interact with software
- **Use Cases**: User-facing capabilities that deliver value
- **Transactions**: Steps within a use case

**Counting Rules**:
- ✅ Each user story = 1 use case
- ❌ Technical tasks ≠ use cases
- ❌ Test cases ≠ use cases
- ❌ Implementation details ≠ use cases

**Example (Wave 1.1.1)**:

**Wrong Counting** (Original Docs):
```
5 user stories = 5 use cases
12 technical tasks = 12 use cases (WRONG - these are transactions)
7 test cases = 7 use cases (WRONG - these are verification steps)
3 handoffs = 3 use cases (WRONG - these are dependencies)
Total: 27 use cases → 329 UCP
```

**Correct Counting** (Fixed Docs):
```
3 user stories = 3 use cases
Technical tasks = transactions within use cases
Test cases = verification (not counted)
Total: 3 use cases → 37 UCP
```

**Reality Check** (Pure Blind Code Analysis):
```
Dual-scoring system = 1 use case
Configuration system = 1 use case
Component scoring = 1 use case
Total: 3 use cases → 52 UCP (with complexity factors)
```

---

## Common Mistakes

### Mistake 1: Breaking User Stories Too Far

**❌ Wrong**:
```
User Story 1: Implement SEO Scorer
User Story 2: Implement GEO Scorer
User Story 3: Implement Total Score Calculator
User Story 4: Implement Letter Grade Assigner
```

**✅ Right**:
```
User Story 1: Dual-Scoring System Implementation
  (Includes SEO, GEO, total score, letter grade - all part of ONE feature)
```

**Why**: If these capabilities always ship together, they're ONE user story.

### Mistake 2: Technical Tasks Disguised as User Stories

**❌ Wrong**:
```
As a developer
I want a base analyzer class with inheritance support
So that I can extend functionality easily
```

**✅ Right**:
```
As a SEO analyst
I want composite SEO/GEO scoring with configurable weights
So that I can evaluate websites across both dimensions
```

**Test**: Is the role "developer" or "technical lead"? If yes, it's probably a technical task, not a user story.

### Mistake 3: Implementation Details in Acceptance Criteria

**❌ Wrong**:
```
Acceptance Criteria:
- File `tools/config/seo_geo_config.json` created
- Class `SEOGEOAnalyzer` inherits from `BaseAnalyzer`
- Method `analyze(url)` returns `SEOGEOReport` dataclass
- Function `calculate_seo_score()` uses numpy arrays
```

**✅ Right**:
```
Acceptance Criteria:
- Configuration externalized in JSON format
- Analyzer supports all 11 SEO/GEO components
- Analysis returns comprehensive report with scores and breakdowns
- Calculations validated within 5% of manual results
```

**Test**: Could this be implemented differently and still satisfy the criterion? If yes, it's outcome-focused (good).

### Mistake 4: Documenting Test Cases

**❌ Wrong**:
```
## Test Case 1: Perfect Score Calculation
Given component_scores all = 100
When calculate_seo_score() is called
Then return 100.0

## Test Case 2: Minimum Score Calculation
[... detailed test specification ...]
```

**✅ Right**:
```
Acceptance Criteria:
- Scores validated against manual calculations (within 5% margin)
- Edge cases handled (perfect, failing, boundary)
- Unit test coverage >80%
```

**Why**: Test implementation is the developer's job. Wave docs define WHAT must work, not HOW to test it.

---

## Migration Guide

### Converting Existing Wave Documents

**Step 1: Identify Real User Stories**

Go through existing wave doc and highlight true user-facing capabilities:
- ✅ "Calculate composite SEO/GEO score" (user-facing)
- ✅ "Configure scoring weights externally" (user-facing)
- ❌ "Create base analyzer class" (implementation detail)
- ❌ "Write unit tests for SEO scorer" (implementation detail)

**Step 2: Consolidate Fragmented Stories**

Merge related user stories and technical tasks into feature-level stories:

**Before**:
- User Story 2: Configure weights and thresholds
- Task 4: Create configuration system
- Task 10: Write configuration tests
- Test Case 4: Configuration validation

**After**:
- User Story 2: Configuration Management System
  - Covers configuration file, validation, defaults, tests

**Step 3: Rewrite Acceptance Criteria**

Convert implementation-focused criteria to outcome-focused:

**Before**: "File `tools/config/seo_geo_config.json` created"
**After**: "Configuration externalized in JSON format"

**Before**: "Function `calculate_seo_score()` returns float"
**After**: "SEO score calculated from 6 components with correct weights"

**Step 4: Remove Over-Documentation**

Delete these sections:
- ❌ Logical Unit Test Cases
- ❌ Technical Tasks (move to Azure DevOps if needed)
- ❌ Task Dependencies diagram
- ❌ Agent Assignments table
- ❌ Explicit test specifications

**Step 5: Validate Granularity**

Run through checklist:
- 3-5 user stories? ✅
- Feature-level capabilities? ✅
- Outcome-focused criteria? ✅
- Document <150 lines? ✅
- Testing implicit? ✅

**Result**: 566 lines → 80 lines, 329 UCP → 37 UCP

---

## For `/design-waves` Skill

### Instructions for Wave Generation

When generating wave documents, follow these rules:

1. **Create 3-5 user stories per wave** (NOT 5 stories + 10 tasks)

2. **User stories must be feature-level**:
   - ✅ "Workspace Lifecycle Management"
   - ❌ "Create WorkspaceService class"

3. **Acceptance criteria must be outcome-focused**:
   - ✅ "All commands updated for multi-workspace support"
   - ❌ "File `src/commands/workspaceCommands.ts` modified"

4. **Testing is implicit**:
   - ✅ "Unit test coverage >80%"
   - ❌ Don't write "Test Case 1: Test workspace creation..."

5. **No technical task breakdown**:
   - ✅ Track in Azure DevOps during sprint planning
   - ❌ Don't add "Technical Tasks" section with 10+ tasks

6. **Document length: 50-150 lines** (NOT 500+)

7. **Use the template exactly** as shown in this guide

### Validation Before Output

Before outputting wave document, verify:
- [ ] 3-5 user stories (not 15+ items)
- [ ] No "Technical Tasks" section
- [ ] No "Logical Unit Test Cases" section
- [ ] Acceptance criteria are outcomes, not implementation
- [ ] Document length < 200 lines
- [ ] Each user story has estimated hours

If validation fails, refactor to correct granularity before output.

---

## Summary

### The Golden Rules (Quick Reference)

1. **3-5 user stories per wave** (not 5 stories + 12 tasks)
2. **Feature-level capabilities** (not code-level tasks)
3. **Outcome-focused criteria** (what works, not how it's built)
4. **Testing is implicit** (">80% coverage", not 7 test cases)
5. **50-150 lines** (not 500+ lines)

### The Test

**Ask yourself**:
- Would a product manager see this as ONE deliverable? → User story
- Would a developer see this as an implementation detail? → Not a user story
- Can this be implemented multiple ways? → Good acceptance criteria
- Does this prescribe code structure? → Bad acceptance criteria

### The Impact

| Metric | Over-Detailed | Correct Granularity |
|--------|--------------|---------------------|
| **Document Length** | 566 lines | 80 lines |
| **User Stories** | 5 stories + 12 tasks | 3 stories |
| **UCP Estimate** | 329 UCP | 37 UCP |
| **Estimation Error** | 6.3x over | 1.4x over |
| **Development Impact** | Confusing scope | Clear scope |

### Bottom Line

**Correct granularity** = **Accurate UCP** = **Faster development** = **Better outcomes**

Use this guide for all future wave planning.

---

**Version History**:
- v1.0 (2026-01-18): Initial guide based on Lighthouse Site Engine and IDE Extension analysis

**References**:
- User Story Granularity Comparison: `validation/commit_analysis/output/user_story_granularity_comparison.md`
- UCP Calculation Guide v4.0: `docs/reference/UCP_Calculation_Guide_v4.0.md`
- Azure DevOps User Stories: Lighthouse IDE Extension Sprints 5.5-5.7
