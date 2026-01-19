# Implement Waves

Orchestrate multi-agent implementation of specified waves with full git workflow, quality control, and architecture review.

## Required Skills

### During Wave Completion (Step 2.4)

1. **azure-devops-work-item-update**: Update Azure DevOps Tasks and User Stories with implementation status
   - Operations: Update task status, add completion details, link commits, update progress
   - Uses: Azure DevOps MCP server for work item updates
   - **Use during Step 2.4 to update DevOps work items after wave completion**

## Parameters

- **Feature**: Do the following steps for all Features within the specified Epic.

## Step 1: Initialize Git Workflow

Use **git-coordinator** to:

- Create feature branch from current branch: `feature/{feature-name}-waves-{start}-{end}`
- Verify clean starting state
- Set up branch tracking and protection

## Step 2: Wave Implementation Loop

For each wave ({start-wave} to {end-wave}):

### 2.1: Begin Wave

- **git-coordinator**: Create wave commit marker
- Load wave plan from `Docs/implementation/iterations/wave-{n}.{m}.{s}-{wave-name}.md`
- Load task list from `Docs/implementation/iterations/wave-{n}.{m}.{s}-tasks.md`

### 2.2: Implementation Phase

Execute tasks in dependency order with assigned agents:

- **backend-specialist**: Server-side implementation tasks, Data layer and migration tasks, API and service integration tasks
- **frontend-specialist**: User Interfaces, front end code

Each agent shall:

- Update TodoWrite status to track progress
- Document any deviations from plan
- Hand off to next agent as per dependencies

### 2.3: Quality Control Verification

- **quality-control**: Verify wave completeness
  - IMPORTANT: Ensure unit tests execution when API endpoints are ready and integrated fully
  - Run all tests and ensure passing
  - Verify acceptance criteria are met
  - Check Definition of Done items
  - Validate integration points
  - Document any issues or gaps

### 2.4: End Wave

- CRITICAL: **quality-control**: Run unit tests and generate quality control report
  - Report shall contain unit test execution summary, code coverage report with analysis and suggestions for additional tests for better coverage
  - Generate report in `Docs/reports/{feature-name}/wave-{n}.{m}.{s}-{wave-name}/wave-test-report.md`

- IMPORTANT: **git-coordinator**: Create wave completion commit
- Generate wave summary report in `Docs/implementation/iterations/wave-{n}.{m}.{s}-summary.md`
- Commit files modified during Implementation phase for this Feature to feature branch

- Update overall progress tracking
- Ask user if they want to update DevOps task status? If yes, continue, else go to Step 3
- Ask user what DevOps project to use?
- Project Name: user provided

**Use azure-devops-work-item-update skill** to update work items:

- Locate wave User Story by searching for title matching wave name/goals
- Update all Tasks under the User Story based on completion status from TodoWrite tracking
- Reference `Docs/implementation/iterations/wave-{n}.{m}.{s}-tasks.md` for task IDs and status mapping
- Update task details:
  - Task status (To Do → In Progress → Done)
  - Task descriptions with actual deliverables and any deviations from plan
  - Link completed tasks to specific git commits
  - CRITICAL: Add comments with implementation notes **Use ucp-calculation-planned-work Skill:** to also include Actual UCP for what was done for the task.
- Update User Story:
  - Progress percentage based on completed tasks
  - Add wave summary report link to User Story description
  - Update User Story status if all tasks complete

## Step 3: Security Assessment

After all waves complete:

- CRITICAL: **security-auditor**: Perform comprehensive vulnerability scan
  - Code security analysis
  - Dependency vulnerability check
  - Authentication/authorization review
  - Data protection compliance
- IMPORTANT: Create remediation report with specific fixes at `Docs/reports/security/implemented-waves/`
- Assign remediation tasks to appropriate implementation agents

## Step 4: Remediation Implementation

- Implementation agents fix security issues per remediation report
- **quality-control**: Verify all security fixes
- **git-coordinator**: Commit security remediation

## Step 5: Final Architecture Review

- **system-architect**: Review implementation against original architecture
  - Compare with initial architecture plan
  - Review all wave summary reports
  - Perform code architecture analysis
  - Verify design patterns and principles
- IMPORTANT: Create architecture compliance report at `Docs/reports/architecture/`
- Provide recommendations for improvements

## Step 5a: Update Architecture Decision Records (ADR)

**CRITICAL**: Update ADRs based on implementation learnings:

- **system-architect**: Review implementation for ADR updates:
  1. **Identify Relevant ADRs**:
     - Read `Docs/architecture/decisions/README.md` for ADRs related to implemented Features
     - Check "Related" field in ADRs for Feature references
     - Look for ADRs with status "Proposed" that should be "Accepted"

  2. **Update Existing ADRs**:
     - Update "Consequences" section with actual outcomes:
       - What went as expected
       - Unexpected positive outcomes
       - Unexpected challenges encountered
       - Performance measurements achieved
       - Actual vs estimated effort
       - Add mitigation strategies for unexpected negatives
     - Update "Status" to "Accepted" if implemented successfully
     - Changes tracked via git history (no separate review section)

  3. **Create New ADRs for Implementation Decisions**:
     - Document any architectural decisions made DURING implementation
     - Examples:
       - Algorithm changes for performance
       - Security enhancements discovered during coding
       - Design pattern adjustments
       - Third-party library additions
     - Create new ADR following template structure

  4. **Link ADRs to Code**:
     - Add code references in "References" section
     - Reference specific implementations that realize the decision
     - Example: `src/validators/LuhnValidator.ts:70-111` - Luhn algorithm

  5. **Document Deviations**:
     - If implementation differs from ADR, explain why in Consequences
     - Add to mitigation strategies section
     - If major deviation: Create superseding ADR

- **Deliverable**: Updated ADRs with implementation outcomes documented

## IMPORTANT: Step 6: Final Git Workflow

- **git-coordinator**:
  - Clean up any temporary commits
  - Prepare feature branch for merge
  - Tag completion milestone

## Deliverables

- Feature branch ready for merge: `feature/{feature-name}-waves-{start}-{end}`
- Wave summary reports for each wave
- Security audit and remediation report
- Architecture compliance review
- Comprehensive implementation summary
- Pull request with all changes

## Success Criteria

- All wave acceptance criteria met
- All tests passing
- No critical security vulnerabilities
- Architecture compliance verified
- Clean git history with descriptive commits
- Complete documentation and reports
