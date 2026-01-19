# Review and Clean Up Epic and Wave Files

You are tasked with reviewing ALL Epic plans and Wave files to identify and remove scope creep and over-engineering based on the project's actual requirements.

## Required Skills

### During Requirements Analysis (Step 1)

1. **cross-documentation-verification**: Validate consistency across requirements and architecture docs
   - Check: Requirements docs align with each other
   - Identify: Contradictions in requirements or "Out of Scope" sections
   - **Invoke during Step 1 to understand actual requirements**

### During Epic/Feature Review (Step 3)

2. **architectural-conformance-validation**: Validate Epic/Feature technical requirements align with architecture
   - Check: Component specifications match architecture and ADRs
   - Validate: Technical requirements don't violate architectural decisions
   - **Invoke during Step 3B (Epic/Feature Technical Requirements)**

3. **wave-coherence-validation**: Validate Epic/Feature dependencies and implementation order
   - Check: Dependencies between Epics/Features are correct
   - Validate: No circular dependencies
   - Verify: Implementation sequence follows proper order (database → service → API → UI)
   - **Invoke during Step 3C (Epic/Feature Dependencies)**

### During Wave Review (Step 5)

4. **development-best-practices**: Reference for appropriate testing/documentation standards
   - Validate: Testing approach matches project needs (not over-engineered)
   - Check: Documentation scope appropriate for project phase
   - Reference: Security, accessibility, performance standards
   - **Reference during Step 5B (Testing) and 5C (Documentation)**

**All skills used together during Step 8 (Validate Updates)** for final consistency check.

## Step 0: Identify Project Structure

**Standard Project Locations** (check in this order):

1. Requirements: `Docs/architecture/_main/` or `Docs/architecture/`
   - Look for: `*requirements*.md`, `vision-and-plan.md`, `architecture.md`
2. Epics: `Docs/implementation/_main/`
   - Look for: `epic-*.md` files (actual Epics)
   - Look for: `feature-*.md` files (Features within Epics)
3. Waves: `Docs/implementation/iterations/`
   - Look for: `wave-*-plan.md`, `wave-*-tasks.md`

**Discovery Process**:

```bash
# Find requirements
find Docs/architecture -name "*requirements*.md" -o -name "vision-and-plan.md" 2>/dev/null

# Find Epic and Feature files
find Docs/implementation/_main -name "epic-*.md" -o -name "feature-*.md" 2>/dev/null

# Find wave directories
find Docs/implementation/iterations -type f -name "wave-*.md" 2>/dev/null
```

## Step 1: Read and Understand Requirements

Read ALL requirements and architecture documents found in `Docs/architecture/`:

**Core Documents to Read**:

- Primary requirements document (e.g., `sdk-requirements.md`, `requirements.md`)
- Vision and Plan document (if exists)
- Architecture document (if exists)
- User Experience / Developer Experience document (if exists)
- Existing ADRs (for architectural constraints)

**Invoke cross-documentation-verification skill**:

- Validate consistency across requirements and architecture docs:
  - Check: Requirements align with Vision and Architecture
  - Identify: Contradictions in "Out of Scope" sections
  - Verify: Success criteria are consistent across documents
- Document any inconsistencies found

**Important**: Focus on requirements that are explicitly defined. Identify what is clearly marked as "Out of Scope" or "Future Phases".

**Extract Key Information**:

1. What are the actual functional requirements?
2. What is explicitly listed as "Out of Scope"?
3. What are the success criteria?
4. What testing/documentation standards are defined?
5. Are there any specific technical requirements or constraints?
6. What architectural decisions constrain implementation (from ADRs)?

## Step 2: Identify Common Over-Engineering Patterns

Based on the requirements, identify if these patterns exist (common over-engineering indicators):

### Testing Over-Engineering

- Coverage percentages (e.g., "100% coverage", "90% coverage")
- Testing internal implementation details (not just public APIs)
- Fuzz testing, penetration testing, performance benchmarking (unless required)
- Extensive cross-platform testing (if CI/CD handles this)
- Security audits (if base security framework already exists)

### Documentation Over-Engineering

- Documentation tasks > 2 hours
- ADRs for trivial implementation details (ADRs should only document significant architectural decisions)
- Comprehensive API documentation (unless explicitly required)
- Integration guides, troubleshooting guides (unless explicitly required)
- Multiple document types per wave

### Feature Scope Creep

- Features not mentioned in requirements
- "Nice to have" features treated as required
- Complex transaction/rollback systems (unless required)
- Advanced monitoring/observability (unless required)
- Update mechanisms (unless required)

### Task Estimation Issues

- Services with extensive testing: Consider if appropriate for scope
- Integration testing > 6 hours (often can be simplified)
- Multiple quality/security auditor tasks (if framework exists)

## Step 3: Review Epic and Feature Plans

**Check for Epic and Feature Files First**:

```bash
# Find Epic and Feature files in _main directory
find Docs/implementation/_main -name "epic-*.md" -o -name "feature-*.md" 2>/dev/null
```

**If Epic/Feature files exist, evaluate each**:

### A. Epic/Feature Scope Alignment

- Does the Epic/Feature align with requirements and vision?
- Is the Epic/Feature properly sequenced (dependencies correct)?
- Are deliverables clearly defined and necessary?
- Is the Epic/Feature sized appropriately (not too large/small)?

### B. Epic/Feature Technical Requirements

**Invoke architectural-conformance-validation skill**:

- Validate technical requirements align with architecture and ADRs:
  - Check: Component specifications match Architecture document
  - Verify: Technical approaches don't violate ADR decisions
  - Validate: Technology choices consistent with established stack
- Are technical requirements realistic and necessary?
- Do component specifications match architecture?
- Are testing strategies appropriate for Epic/Feature scope?
- Are success metrics measurable and relevant?

### C. Epic/Feature Dependencies

**Invoke wave-coherence-validation skill**:

- Validate dependencies and implementation order:
  - Check: Dependencies on other Epics/Features are correct
  - Verify: No circular dependencies
  - Validate: Implementation sequence follows proper order (database → service → API → UI)
  - Identify: Missing dependencies or incorrect ordering
- Is the critical path logical?

### D. Epic/Feature Documentation

- Is there sufficient context for wave planning?
- Are acceptance criteria clear and testable?
- Are integration points well-defined?

**Report Findings**: For each Epic/Feature reviewed:

- ✅ Aligned with requirements
- ⚠️ Needs adjustment (specify what)
- ❌ Out of scope (recommend removal/deferral)

## Step 4: Find Wave Files

**Only proceed if Epics/Features are validated or if none exist**.

Locate all wave files in the implementation documentation:

```bash
# Find all wave files
find Docs/implementation/iterations -name "wave-*.md" 2>/dev/null
```

For each wave file, check for:

- `wave-{n}.{m}.{s}-{name}.md` (plan)
- `wave-{n}.{m}.{s}-tasks.md` (task tracking)

**Wave Numbering**: {n} = Epic, {m} = Feature, {s} = Wave sequence (e.g., wave-5.1.1)

## Step 5: Review Each Wave

For each wave plan and tasks file, check for:

### A. Scope Alignment

- Does every task/feature align with actual requirements?
- Are there tasks implementing features listed as "Out of Scope"?
- Are tasks duplicating work from earlier Epics/Features?
- Is the wave scope well-defined and achievable?

### B. Testing Standards

**Reference development-best-practices skill**:

- Validate testing approach is appropriate (not over-engineered):
  - Check: Testing standards match project requirements (not excessive coverage targets)
  - Verify: Test types appropriate (unit vs integration vs E2E)
  - Validate: Security testing matches security requirements
  - Check: Performance testing matches performance targets
- What testing approach does the project actually need?
- Are tests focused on the right level (unit vs integration vs E2E)?
- Is coverage specified appropriately based on requirements?

### C. Documentation Standards

**Reference development-best-practices skill**:

- Validate documentation scope is appropriate:
  - Check: Documentation tasks sized reasonably (< 2 hours typically)
  - Verify: Documentation matches project standards
  - Validate: ADRs only for significant architectural decisions
- What documentation is actually required?
- Is documentation scope appropriate for the project phase?
- Are documentation tasks sized correctly?

### D. Task Dependencies

**Invoke wave-coherence-validation skill**:

- Validate task dependencies are correct:
  - Check: No circular dependencies between tasks
  - Verify: Tasks follow implementation order (database → service → API → UI)
  - Validate: Tasks not depending on removed features
  - Check: Dependency chains are logical and minimal
- Are dependency chains unnecessarily long?

## Step 6: Update Epic/Feature Files (If Needed)

For Epic/Feature files needing updates:

### A. Update Epic/Feature Scope

- Remove out-of-scope deliverables
- Adjust dependencies based on findings
- Clarify acceptance criteria
- Update success metrics

### B. Update Epic/Feature Documentation

- Add missing context if needed
- Clarify technical requirements
- Update integration points
- Adjust timelines if necessary

## Step 7: Update Wave Files

For each wave file needing updates:

### A. Remove Scope Creep

- Remove tasks/features not in requirements
- Remove tasks duplicating earlier work
- Remove features from "Out of Scope" list

### B. Adjust Testing Approach

- Align with actual testing requirements
- Remove coverage percentages if not specified
- Focus on appropriate test types
- Remove redundant testing layers

### C. Simplify Documentation

- Align with project documentation standards
- Remove extensive documentation not required
- Keep only essential documentation deliverables

### D. Update Estimations

- Recalculate task hours based on cleaned scope
- Update total hours in tasks file
- Update agent assignments
- Update critical path timings

### E. Update Task Counts

- Renumber tasks if any were removed
- Update "Total Tasks" count
- Update "Agent Assignments" totals
- Remove references to deleted tasks

## Step 8: Validate Updates

After updating files, verify using all skills:

**Invoke cross-documentation-verification skill**:
- Validate: Epic/Feature/Wave plans align with requirements and architecture
- Check: All references to removed items eliminated
- Verify: Everything maps back to actual requirements

**Invoke architectural-conformance-validation skill**:
- Validate: Technical requirements still align with architecture and ADRs
- Check: No architectural violations introduced during cleanup

**Invoke wave-coherence-validation skill**:
- Validate: All Epic/Feature and Wave dependencies are correct
- Check: Implementation order still follows proper sequence
- Verify: No circular dependencies introduced

**Reference development-best-practices skill**:
- Validate: Testing/documentation standards remain appropriate
- Check: Quality standards maintained during cleanup

**Additional checks**:
1. **Wave Consistency**: Do plan and tasks files match?
2. **Completeness**: Are all references to removed items eliminated?
3. **Accuracy**: Do totals add up correctly?
4. **Scope Definition**: Is each wave's scope clear and achievable?

## Step 9: Report Results

### A. Epic/Feature Review Summary

For each Epic/Feature reviewed, provide:

```markdown
### Epic/Feature X: [Name]

**Alignment**: ✅ Aligned | ⚠️ Needs Adjustment | ❌ Out of Scope

**Issues Found**:

- Scope issues: [list findings]
- Technical issues: [list findings]
- Dependency issues: [list findings]

**Changes Made**:

- Scope adjustments: [describe]
- Technical clarifications: [describe]
- Dependency updates: [describe]

**Status**: ✅ Complete | ⚠️ Needs Attention
```

### B. Wave Review Summary

For each Epic's/Feature's waves reviewed, provide:

```markdown
### Epic/Feature X Waves: [Name]

**Files Reviewed**: X waves (Y files total)

**Issues Found**:

- Scope creep: [list features removed]
- Over-engineering: [list simplified tasks]
- Estimation issues: [list adjustments]

**Changes Made**:

- Removed: X tasks
- Simplified: Y tasks
- Hour reduction: Z hours (A% reduction)
- New total: B hours

**Status**: ✅ Complete
```

## Execution Strategy

1. **Use `TodoWrite`** to track progress through all steps
2. **Step 0**: Identify project structure (requirements, Epics/Features, waves)
3. **Step 1**: Read and understand all requirements documents
4. **Step 2**: Identify common over-engineering patterns
5. **Step 3**: Review ALL Epic/Feature plans first
6. **Step 4**: Find wave files after Epic/Feature validation
7. **Step 5**: Review each wave against requirements
8. **Step 6**: Update Epic/Feature files if needed
9. **Step 7**: Update wave files
10. **Step 8**: Validate all updates
11. **Step 9**: Provide comprehensive report

### Processing Order

1. **Epics/Features First**: Validate all Epics and Features before reviewing waves
2. **One Epic/Feature at a Time**: Complete all waves for one Epic/Feature before moving to next
3. **Atomic Updates**: Update both plan.md and tasks.md for each wave together
4. **Mark Progress**: Update todo list after each Epic/Feature completion

## Success Criteria

- ✅ Project structure correctly identified
- ✅ All requirements documents read and understood
- ✅ All Epic/Feature plans reviewed and validated
- ✅ All wave files reviewed against requirements
- ✅ All out-of-scope features removed
- ✅ Testing aligned with project standards
- ✅ Documentation aligned with project standards
- ✅ Hour totals accurate and reasonable
- ✅ All cross-references updated correctly
- ✅ No broken dependencies
- ✅ Epic/Feature and wave dependencies validated
- ✅ Wave scope definitions clear and achievable

## Important Notes

- **Project-Agnostic**: Works with any project following standard structure
- **Read requirements FIRST** - Don't assume standards
- **Evaluate Epics/Features BEFORE Waves** - Ensures coherent scope
- **Verify alignment** - Every change should trace to requirements
- **Be project-specific** - Different projects have different needs
- **Preserve intent** - Don't remove genuinely required work
- **Update atomically** - Both plan and tasks files for each wave
- **Standard Paths**: Uses proper Docs/ casing
- **Scope-based**: Remember waves are scope-based deliverables, not time-boxed
