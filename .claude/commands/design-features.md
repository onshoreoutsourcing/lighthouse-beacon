# Design Features

Use the wave-planner agent to do the following:

- Execute each step in order, completing all actions before proceeding to the next step.
- Do not provide summaries - execute actual file creation and API calls
- Create a TODO list to keep track of all needed tasks

## Required Skills

### During Master Plan & Feature Plan Creation (Steps 2-3)

1. **wave-coherence-validation**: Validate implementation order and dependencies
   - Check: Core features implemented before enhancements
   - Validate: Dependencies between Features follow correct order (database → service → API → UI)
   - Prevent: Feature dependencies creating implementation blockers
   - **Invoke during Step 2 (master plan) and Step 3 (Feature plans)**

2. **development-best-practices**: Reference for technical quality standards in Feature plans
   - Ensure: Security, accessibility, performance requirements documented
   - Validate: Anti-hardcoding approaches, error handling, logging strategies specified
   - **Reference during Step 3 (Feature plan creation)**

### After Feature Plan Creation (Step 3)

3. **cross-documentation-verification**: Validate Feature plans align with Epic and architecture docs
   - Check: Feature goals support Epic objectives
   - Validate: Feature scope aligns with Epic master plan
   - Verify: Feature technical approach feasible given Architecture
   - **Invoke after Step 3 before ADR creation (Step 4)**

### During ADR Creation (Step 4)

4. **architectural-conformance-validation**: Validate Feature-level architectural decisions don't conflict with existing ADRs
   - Check: New decisions align with established architecture patterns
   - Validate: Technology/library choices consistent with existing ADRs
   - **Invoke during Step 4 for each ADR before creation**

### During Azure DevOps Integration (Step 5)

5. **azure-devops-safe-operations**: Use Azure DevOps MCP server for Feature work item operations
   - Replaces: Manual API calls or CLI commands
   - Operations: Create Features, link to parent Epic, retrieve IDs
   - **Use during Step 5 for all Azure DevOps operations**

## Step 0: Ask user what we are designing features for

- Ask user: "What Epic are we designing features for?"
- Ask user: "Which features or phases within this Epic should we design?"
- Design features for only the specified Epic and components.

## Step 1: Get project context

Read core documents in Docs/architecture/_main including:

- Project vision and business requirements
- Technical architecture and constraints
- UI/UX design specifications
- Any existing implementation status or dependencies, for thorough understanding of project vision, business requirements, architecture, and UI/UX design in order to develop a master Epic implementation plan.

## Step 2: Develop master Epic implementation plan

Design a master implementation plan for the Epic:

- Use the Write tool to create master implementation plan as `Docs/implementation/_main/epic-{n}-{name}-master-plan.md`
- **Invoke wave-coherence-validation skill**:
  - Validate: Core features implemented before enhancements
  - Check: Implementation order follows dependencies (database → service → API → UI)
  - Ensure: No Feature dependencies create implementation blockers
- Utilize previously planned features and functions. Do not duplicate, or create conflicting/unnecessary implementations.
- The master implementation plan shall be created in Docs/implementation/_main
- The master implementation plan shall have sufficient context from the core documents included to allow our wave-planner agent to design the feature implementation plans.

## Step 3: Develop Feature implementation plans

Based on the master implementation plan created from Step 2, create multiple Feature implementation plans.

**Terminology:**
- **Epic** = Major initiative (e.g., "Epic 5: Multi-Workspace Support")
- **Feature** = Significant component within an Epic (e.g., "Feature 5.1: Global Services Foundation")
- **Wave** = Scope-based implementation unit (logical deliverable within a Feature)

**For EACH Feature to be created:**

1. **Identify Feature numbering:**
   - Check existing epic-{n}-*.md or feature-{n}.{m}-*.md files in Docs/implementation/_main
   - Use Epic number {n} and next Feature sequence {m} (1, 2, 3...)
   - Example: `feature-5.1-global-services-foundation.md` for first Feature in Epic 5

2. **Read Feature Plan Template:**
   - Read `.lighthouse/templates/21-Feature-Plan-Template.md`
   - Use this template structure for all Feature plans

3. **Create Feature implementation plan:** `Docs/implementation/_main/feature-{n}.{m}-{name}.md`
   - Follow the structure from 21-Feature-Plan-Template.md
   - Fill in all sections with specific information
   - **Reference development-best-practices skill**:
     - Document security requirements (authentication, authorization, encryption)
     - Define accessibility standards (WCAG compliance level)
     - Specify performance targets (response time, throughput)
     - Document anti-hardcoding approach (secrets management, config externalization)
     - Include error handling and logging strategies
   - Include:
     - Implementation scope and objectives
     - Technical requirements and dependencies
     - Logical unit tests which call API endpoints and verify data creation or modification
     - Testing strategy and acceptance criteria
     - Integration points with other Features and Epics
   - **Invoke wave-coherence-validation skill** for Feature dependencies:
     - Validate: Feature dependencies follow correct order
     - Check: Backend Features before frontend Features
     - Ensure: No circular dependencies between Features
   - Replace all placeholders with actual content
   - Ensure sufficient context for wave-planner to design detailed wave implementations

4. **Verify Feature plan created:**
   - Read back the created file
   - Confirm all sections are complete
   - Ensure proper formatting

5. **Repeat for all Features** in the Epic master plan

## Step 3a: Validate Feature Plans Consistency

**Invoke cross-documentation-verification skill** for all created Feature plans:

- Validate Feature plans align with Epic and architecture docs:
  - Feature goals support Epic objectives and master plan
  - Feature scope addresses Epic requirements
  - Feature technical approach feasible given Architecture constraints
  - Dependencies between Features are consistent and logical
  - Features don't duplicate or conflict with existing implementations
- If conflicts found:
  - Document with [NEEDS REVIEW: Feature says X, but Epic requires Y]
  - Resolve conflicts before proceeding to ADR creation
  - Update Feature plans to ensure consistency

## Step 4: Document Architectural Decisions (ADR)

**Review all Feature plans for architectural decisions:**

- **system-architect**: For each Feature plan created:
  - Identify architectural decisions:
    - New technology/library introductions
    - Design pattern choices (e.g., factory, strategy, observer)
    - Security architecture (authentication, authorization, encryption)
    - Data architecture (storage, validation, processing)
    - Integration patterns (APIs, message queues, webhooks)
    - Performance strategies (caching, optimization, scaling)
    - Compliance strategies (PCI DSS, HIPAA safe harbor, audit logging)

- For each significant decision:
  - **Invoke architectural-conformance-validation skill**:
    - Validate: New decision doesn't conflict with existing ADRs
    - Check: Decision aligns with established architecture patterns
    - Verify: Technology/library choices consistent with current stack
  - Read `Docs/architecture/decisions/README.md` for next ADR number
  - Create ADR from template: `.lighthouse/templates/07-ADR-Template.md`
  - Document (industry-standard format):
    - **Title + Metadata**: Status, Date, Deciders, Related (link to Feature)
    - **Context**: Problem this Feature solves, why decision needed
    - **Considered Options**: List 2-3+ alternatives with brief descriptions
    - **Decision**: What was decided and why (includes rationale and trade-offs)
    - **Consequences**: Positive outcomes, negative trade-offs, mitigation strategies
    - **References**: Related docs, code, external resources
  - Reference the Feature plan in ADR's "Related" field
  - Update ADR Index in README.md
  - Add ADR reference to Feature plan document

- Ask user to review proposed ADRs before finalizing

## CRITICAL: Step 5: Create Azure DevOps Features

- Ask user if they want to create DevOps work items? If yes, then continue with Step 5, else go to Step 6
- Ask user which Azure DevOps project to create work items in?
- Project name: user provided

**Use azure-devops-safe-operations skill:**

- For each Feature plan created:
  - Create Feature work item via Azure DevOps MCP server
  - Work item details:
    - Title: Feature {n}.{m}: {Name}
    - Description: Summary from Feature plan + link to Feature plan file
    - Priority: From Feature plan
    - Parent: Link to Epic work item if it exists
  - Do not create Tasks at this stage (use design-waves command for that)
  - Do not create duplicate Features
  - Link implementation plans to created Features
  - Set up Feature hierarchy and relationships

- Retrieve created work items to confirm
- Document Azure DevOps Feature IDs in Feature plan files (add to front matter or metadata)

## CRITICAL: Step 6: Validation

Verify that:

- All Feature plans are complete and actionable
- Confirm Azure DevOps Feature creation by retrieving the created work items
- Implementation order is logical and dependency-aware
- Features properly linked to parent Epic
- All ADRs are documented and referenced
