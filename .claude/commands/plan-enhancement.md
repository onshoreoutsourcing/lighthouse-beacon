# Plan Enhancement

This is the beginning step for adding an enhancement for the project with the
Lighthouse LM IDF. The goal is to have comprehensive phased plan document to
outline the technologies, integrations, changes, enhancements needed.

- **product-manager** Step 0, 1, 2, and 3
- **system-architect** Step 4

## Required Skills

### During Plan Generation (Step 3)

1. **wave-coherence-validation**: Validate implementation phases follow correct dependency order
   - Check: Core functionality before enhancements
   - Validate: Dependencies between phases (database → service → API → UI)
   - Prevent: Phase dependencies creating implementation blockers
   - **Invoke during Step 3 for Epic/Feature plans with multiple phases**

2. **development-best-practices**: Reference for technical quality standards in plans
   - Ensure: Security, accessibility, performance requirements documented
   - Validate: Anti-hardcoding approaches, error handling, logging strategies specified
   - **Reference during Step 3 (plan generation)**

### After Plan Generation (Step 3) and During Review (Step 4)

3. **cross-documentation-verification**: Validate plan aligns with existing documentation
   - Check: Plan aligns with architecture docs, business requirements, user experience
   - Verify: Enhancement goals support project vision
   - Identify: Conflicts between plan and existing documentation
   - **Invoke after Step 3 and during Step 4 review**

### During ADR Creation (Step 5)

4. **architectural-conformance-validation**: Validate architectural decisions don't conflict with existing ADRs
   - Check: New decisions align with established architecture patterns
   - Validate: Technology choices consistent with existing ADRs
   - **Invoke during Step 5 for each ADR before creation**

## Step 0: Determine Enhancement Scope

**IMPORTANT**: First determine the appropriate scope and location:

### Scope Decision Matrix

Ask user: "What is the scope of this enhancement?"

1. **Epic** (3-6 months, major initiative)
   - Multiple Features/components
   - Significant architectural changes
   - Cross-team coordination
   - Location: `Docs/implementation/_main/epic-{n}-{name}.md`
   - Use: `/design-features` command after planning

2. **Feature** (1-3 waves, significant functionality)
   - Part of existing Epic
   - Single major component or capability
   - Location: `Docs/implementation/_main/feature-{n}.{m}-{name}.md`
   - Use: `/design-waves` command after planning

3. **Enhancement** (Small improvement, bug fix, minor addition)
   - Limited scope, quick implementation
   - No major architectural changes
   - Location: `Docs/planning/{enhancement-name}-plan.md`
   - Implement directly without formal Epic/Feature structure

**Determine and document scope before proceeding.**

### Link to Existing Work

- If Feature: Ask which Epic it belongs to
- If Enhancement: Check if it relates to existing Epic/Feature
- Document relationships in plan

## Step 1: Identify documents for context

- Read key documents in `Docs/architecture/_main/` {business requirements,
  architecture, user experience}
- Ask for any other key documents for additional context

## Step 2: Plan Brainstorming

- Ask questions regarding the enhancement to understand the business
  requirements, the desired outcome, and any architectural guidance.
- Write key insights to appropriate location based on scope:
  - **Epic**: `Docs/planning/epic-{n}-brainstorming.md`
  - **Feature**: `Docs/planning/feature-{n}.{m}-brainstorming.md`
  - **Enhancement**: `Docs/planning/{enhancement-name}-brainstorming.md`
- Continue question and note taking until you feel you have sufficient context
  to provide a solution that fits within the current project architecture.
- Ask user if ready to proceed with Plan file creation to proceed.

## Step 3: Generate Implementation Plan

Create plan in location determined in Step 0:

- **Epic**: `Docs/implementation/_main/epic-{n}-{name}.md`
  - Include Epic master plan structure
  - List Features that will comprise the Epic
  - Reference Epic numbering from existing files
  - **Reference development-best-practices skill**:
    - Document security requirements (authentication, authorization, encryption)
    - Define accessibility standards (WCAG compliance level)
    - Specify performance targets (response time, throughput)
    - Document anti-hardcoding approach (secrets management, config externalization)
  - **Invoke wave-coherence-validation skill** for phases:
    - Validate: Phase order follows dependencies (database → service → API → UI)
    - Check: Core functionality before enhancements
    - Ensure: No circular dependencies between phases

- **Feature**: `Docs/implementation/_main/feature-{n}.{m}-{name}.md`
  - Link to parent Epic
  - Use Feature numbering: {epic}.{feature-sequence}
  - Example: feature-5.1 for first Feature in Epic 5
  - **Reference development-best-practices skill** (same as Epic)
  - **Invoke wave-coherence-validation skill** for phases (same as Epic)

- **Enhancement**: `Docs/planning/{enhancement-name}-plan.md`
  - Simple implementation plan
  - No Epic/Feature ceremony required
  - **Reference development-best-practices skill** for technical standards

- The implementation plan shall be broken down into short phases that focus on
  core functionality first.

## Step 3a: Validate Plan Consistency

**Invoke cross-documentation-verification skill** for generated plan:

- Validate plan aligns with existing documentation:
  - Plan goals support project vision and business requirements
  - Technical approach feasible given Architecture constraints
  - Enhancement doesn't conflict with User Experience design
  - Dependencies align with existing Epic/Feature plans
- If conflicts found:
  - Document with [NEEDS REVIEW: Plan says X, but Architecture requires Y]
  - Resolve conflicts before proceeding to review
  - Update plan to ensure consistency

## Step 4: Review Implementation Plan

- **Invoke cross-documentation-verification skill** during review:
  - Double-check plan alignment with architecture docs, requirements, UX
  - Verify all details from brainstorming session captured
  - Confirm no conflicts with existing documentation
- Review the implementation plan document against the acquired context to double
  check that all details are covered.
- Ask additional questions for clarification. Especially if the plan has options
  for implementation. Do not assume.
- CRITICAL: Make appropriate edits to implementation plan document based on your
  review analysis.

## Step 5: Document Architectural Decisions (ADR)

**IMPORTANT**: If the enhancement involves architectural decisions, create ADRs:

- **system-architect**: Review the implementation plan for architectural
  decisions:
  - Technology choices (new libraries, frameworks, services)
  - Design pattern selections
  - Security architecture changes
  - Compliance strategy decisions (PCI DSS, HIPAA)
  - Integration approaches
  - Data storage/processing strategies
  - Performance optimization approaches

- For each significant decision identified:
  - **Invoke architectural-conformance-validation skill**:
    - Validate: New decision doesn't conflict with existing ADRs
    - Check: Decision aligns with established architecture patterns
    - Verify: Technology choices consistent with current stack
  - Read `Docs/architecture/decisions/README.md` to get next ADR number
  - Create ADR using template: `.lighthouse/templates/07-ADR-Template.md`
  - Fill in all sections (industry-standard format):
    - Title + Metadata: Status, Date, Deciders, Related (link to Epic/Feature/Enhancement)
    - Context: Situation and why decision is needed
    - Considered Options: List of alternatives (min 2-3)
    - Decision: What was decided, why this choice, key factors
    - Consequences: Positive outcomes, negative trade-offs, mitigation
    - References: Related docs, external resources
  - Save ADR to: `Docs/architecture/decisions/ADR-{nnn}-{title}.md`
  - Update ADR Index in `Docs/architecture/decisions/README.md`
  - Link ADR to Epic/Feature/Enhancement plan document

- If no architectural decisions: Skip this step and note "No ADRs required"

## Step 6: Next Steps Guidance

Based on scope determined in Step 0:

- **Epic**: Use `/design-features` command to break down into Features
- **Feature**: Use `/design-waves` command to break down into Waves
- **Enhancement**: Proceed directly to implementation
