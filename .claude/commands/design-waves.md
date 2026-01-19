# Design Waves

For each feature-{n}.{m}-{name}.md in Docs/implementation/_main, have a new wave-planner do the following:

## Required Skills

### During Wave Plan Creation (Step 2)

1. **ucp-calculation-planned-work**: Calculate Objective UCP for User Stories
   - Calculate: UCP values for each User Story in the Wave plan
   - Include: UCP values in the Wave document itself (not just Azure DevOps)
   - Purpose: Size and estimate User Stories for planning and Azure DevOps integration
   - **Invoke during Step 2 for each User Story in Wave plan**

2. **wave-coherence-validation**: Validate Wave dependencies and implementation order
   - Check: Dependencies within Wave follow correct order (database → service → API → UI)
   - Validate: User Stories and Tasks organized in logical sequence
   - Prevent: Task dependencies creating implementation blockers
   - **Invoke during Step 2 for each Wave plan**

3. **development-best-practices**: Reference for technical quality standards in Wave tasks
   - Ensure: Security, accessibility, performance requirements in tasks
   - Validate: Anti-hardcoding approaches, error handling, logging in technical tasks
   - **Reference during Step 2 (Wave plan creation)**

4. **architectural-conformance-validation**: Validate Wave tasks align with established architecture
   - Check: Tasks implement features according to architectural patterns (layered architecture, component structure)
   - Validate: Technical tasks don't violate ADRs or architecture decisions
   - Examples: Service layer tasks follow pattern, API tasks use correct authentication, UI tasks use approved state management
   - **Invoke during Step 2 to validate tasks align with architecture**

### After Wave Plan Creation (Step 2)

5. **cross-documentation-verification**: Validate Wave plans align with Feature plan
   - Check: Wave goals support Feature objectives
   - Validate: Wave scope addresses Feature requirements
   - Verify: All Feature requirements covered across Waves
   - **Invoke after Step 2 before Azure DevOps creation (Step 3)**

### During Azure DevOps Integration (Step 3)

6. **azure-devops-work-item-creation**: Use Azure DevOps MCP server for User Story and Task creation
   - Operations: Create User Stories, create Tasks, link hierarchy
   - Transfers UCP values from Wave plan to Azure DevOps work items
   - **Use during Step 3 for all Azure DevOps work item operations**

## Step 1: Get Feature Context

Read and analyze the feature-{n}.{m}-{name}.md file including:
- Implementation scope and objectives
- Technical requirements and dependencies
- Testing strategy and acceptance criteria
- Integration points with other Features
- Review any existing wave plans to avoid duplication

## Step 2: Develop Wave Implementation Plans

Break the Feature into scope-based waves (logical implementation units).

**Wave Philosophy:**
- Waves are scope-based deliverables, NOT time-boxed iterations
- Each wave contains User Stories from ONE Feature only
- Duration is determined by scope completion, not fixed calendar periods
- Organized by logical deliverable units for AI-assisted development

**For EACH Wave to be created:**

1. **Determine Wave numbering:**
   - {n} = Epic number
   - {m} = Feature number within Epic
   - {s} = Wave sequence within Feature (1, 2, 3...)
   - Example: `wave-5.1.1-workspace-context-foundation.md` for first Wave in Feature 5.1

2. **Read Wave Plan Template and Granularity Guides:**
   - Read `.lighthouse/templates/22-Wave-Plan-Template.md`
   - Read `.lighthouse/templates/USER_STORY_GRANULARITY_GUIDE.md` - Comprehensive guide for correct user story granularity
   - Read `.lighthouse/templates/USER_STORY_QUICK_REFERENCE.md` - Quick validation checklist
   - Use template structure and granularity rules for all Wave plans

3. **Create Wave implementation plan:** `Docs/implementation/iterations/wave-{n}.{m}.{s}-{wave-name}.md`
   - Follow the structure from 22-Wave-Plan-Template.md
   - **CRITICAL: Apply USER_STORY_GRANULARITY_GUIDE.md rules:**
     - **3-5 user stories per wave** (NOT 5 stories + 12 technical tasks)
     - **Feature-level capabilities** (e.g., "Workspace Lifecycle Management", NOT "Create WorkspaceService class")
     - **Outcome-focused criteria** (e.g., "All commands support multi-workspace", NOT "File `src/commands.ts` modified")
     - **Testing is implicit** (e.g., "Unit test coverage >80%", NOT 7 explicit test cases)
     - **Document length: 50-150 lines** (NOT 500+ lines)
   - Fill in all sections with specific information
   - **Reference development-best-practices skill**:
     - Include security tasks (authentication, authorization, encryption)
     - Define accessibility tasks (WCAG compliance, ARIA labels, keyboard navigation)
     - Specify performance tasks (optimization, caching, monitoring)
     - Include anti-hardcoding tasks (externalize config, secrets management)
     - Add error handling and logging tasks
   - Include:
     - **Wave Goals**: Specific, measurable objectives for this scope
     - **User Stories** (3-5 feature-level capabilities):
       - Use "As a [role], I want [capability], So that [value]" format
       - **Calculate and include Objective UCP** for each User Story using ucp-calculation-planned-work skill
       - UCP values must be in the wave document itself, not just Azure DevOps
       - Acceptance criteria must be outcome-focused (WHAT works, not HOW it's built)
       - No file paths, method names, or implementation details in criteria
       - Testing mentioned as outcome only ("tests passing >80%")
     - **Definition of Done**: Measurable completion criteria
   - **DO NOT INCLUDE:**
     - ❌ "Logical Unit Test Cases" section (makes testing implicit instead)
     - ❌ "Technical Tasks" breakdown (track in Azure DevOps, not wave doc)
     - ❌ "Task Dependencies" diagram (implementation detail)
     - ❌ "Agent Assignments" table (track in Azure DevOps)
     - ❌ Explicit test case specifications
     - ❌ File paths or method signatures in acceptance criteria
   - **Invoke wave-coherence-validation skill** for Wave dependencies:
     - Validate: Task order follows implementation dependencies (database → service → API → UI)
     - Check: User Stories organized in logical sequence
     - Ensure: No circular dependencies between tasks
   - **Invoke architectural-conformance-validation skill** for task alignment:
     - Validate: Tasks follow established architecture patterns
     - Check: Backend tasks use correct service layer structure
     - Check: Frontend tasks use approved state management approach
     - Verify: API tasks follow authentication/authorization patterns from ADRs
   - Replace all placeholders with actual content

4. **Validate Wave plan granularity:**
   - **Use USER_STORY_QUICK_REFERENCE.md checklist:**
     - [ ] 3-5 user stories (not 15+ items)
     - [ ] No "Technical Tasks" section
     - [ ] No "Logical Unit Test Cases" section
     - [ ] No file paths in acceptance criteria
     - [ ] No method names in acceptance criteria
     - [ ] Testing mentioned as outcome only
     - [ ] Document length < 200 lines
     - [ ] Each story has estimated hours
     - [ ] Stories describe WHAT, not HOW
   - **Pass threshold: 7/9 checks** = Good granularity
   - If validation fails, refactor wave document to correct granularity

5. **Verify Wave plan created:**
   - Read back the created file
   - Confirm all sections are complete
   - Ensure proper formatting
   - Confirm granularity checklist passed

6. **Repeat for all Waves** needed for the Feature

## Step 2a: Validate Wave Plans Consistency

**Invoke cross-documentation-verification skill** for all created Wave plans:

- Validate Wave plans align with Feature plan:
  - Wave goals support Feature objectives
  - Wave scope addresses all Feature requirements
  - Technical approach in Waves feasible given Feature plan
  - Dependencies between Waves are consistent and logical
  - All Feature requirements covered across Waves
- If conflicts found:
  - Document with [NEEDS REVIEW: Wave says X, but Feature requires Y]
  - Resolve conflicts before proceeding to Azure DevOps creation
  - Update Wave plans to ensure consistency

## CRITICAL: Step 3: Create Azure DevOps User Stories and Tasks

- Ask user if they want to create DevOps work items? If yes, then continue with Step 3, else go to Step 4
- Ask user which Azure DevOps project to create work items in?
- Project name: user provided

**IMPORTANT: Azure DevOps Mapping**
- Lighthouse LM: Epic → Feature → Wave → User Story → Task
- Azure DevOps: Epic → Feature → User Story → Task (assigned to Iterations/Sprints)
- Waves are documentation/planning only, NOT created as DevOps work items

**Use azure-devops-work-item-creation skill:**

- For each Wave plan created:
  - Create User Stories from Wave plan via Azure DevOps MCP server
  - Create Tasks under each User Story with:
    - Clear descriptions from wave plans
    - Agent assignments in task descriptions
    - Acceptance criteria from wave plans
    - **Transfer Objective UCP values** from Wave plan user stories to Azure DevOps work items
    - Work item hierarchy: Link Tasks to User Stories, link User Stories to parent Feature
    - Final hierarchy: Epic > Feature > User Story > Task
  - Do not include tags
- Create task tracking files:
  - `Docs/implementation/iterations/wave-{n}.{m}.{s}-tasks.md` in TodoWrite format
  - Include task status tracking for agent coordination

- Retrieve created work items to confirm
- Document Azure DevOps work item IDs in Wave plan files

## CRITICAL: Step 4: Validation

Verify that:
- All wave plans are complete and actionable
- **Wave plans pass USER_STORY_QUICK_REFERENCE.md granularity checklist (7/9 checks)**
- Confirm Azure DevOps User Story and Task creation by retrieving the created work items
- Implementation order is logical and dependency-aware
- Proper work item hierarchy established (Epic > Feature > User Story > Task)
- Wave scope is well-defined and achievable

---

## User Story Granularity Requirements (CRITICAL)

**All wave documents MUST follow these rules from USER_STORY_GRANULARITY_GUIDE.md:**

### The 5 Golden Rules
1. **3-5 user stories per wave** (NOT 5 stories + 12 technical tasks)
2. **Feature-level capabilities** (e.g., "Workspace Lifecycle Management", NOT "Create WorkspaceService class")
3. **Outcome-focused criteria** (e.g., "All commands support multi-workspace", NOT "File `src/commands.ts` modified")
4. **Testing is implicit** (e.g., "Unit test coverage >80%", NOT 7 explicit test case specs)
5. **50-150 lines per wave** (NOT 500+ lines)

### Quick Validation (Must Pass 7/9)
- [ ] 3-5 user stories (not 15+ items)
- [ ] No "Technical Tasks" section
- [ ] No "Logical Unit Test Cases" section
- [ ] No file paths in acceptance criteria
- [ ] No method names in acceptance criteria
- [ ] Testing mentioned as outcome only
- [ ] Document length < 200 lines
- [ ] Each story has estimated hours
- [ ] Stories describe WHAT, not HOW

### The Test Questions
- Would a product manager see this as ONE deliverable? → User Story
- Can this be implemented multiple ways? → Good acceptance criteria
- Do these capabilities always ship together? → Keep as ONE story

### Common Mistakes to Avoid
- ❌ Breaking stories too far (task-level instead of feature-level)
- ❌ Technical tasks disguised as user stories
- ❌ Implementation details in acceptance criteria
- ❌ Documenting explicit test cases
- ❌ Including "Technical Tasks" or "Test Cases" sections

**Impact**: Correct granularity reduces UCP over-estimation from 6.3x to 1.4x

**References**:
- Full Guide: `.lighthouse/templates/USER_STORY_GRANULARITY_GUIDE.md`
- Quick Reference: `.lighthouse/templates/USER_STORY_QUICK_REFERENCE.md`
