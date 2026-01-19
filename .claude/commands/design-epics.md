# Design Epics

Use the product-manager agent to do the following:

- Execute each step in order, completing all actions before proceeding to the next step.
- Do not provide summaries - execute actual file creation and API calls
- Create a TODO list to keep track of all needed tasks

## Required Skills

### After Epic Plan Creation (Step 3)

1. **cross-documentation-verification**: Validate Epic plans align with foundation documents
   - Check: Epic goals support Product Vision and Plan objectives
   - Validate: Epic scope aligns with Business Requirements
   - Verify: Epic technical approach feasible given Architecture
   - **Invoke after Step 3 before ADR creation (Step 4)**

### During ADR Creation (Step 4)

2. **architectural-conformance-validation**: Validate Epic-level architectural decisions don't conflict with existing ADRs
   - Check: New architectural decisions align with established architecture patterns
   - Validate: Epic technology choices consistent with existing ADRs
   - **Invoke during Step 4 for each ADR before creation**

3. **development-best-practices**: Reference for technical quality standards in Epic plans
   - Ensure: Security, accessibility, performance requirements documented
   - Validate: Anti-hardcoding approaches specified
   - **Reference during Step 3 (Epic plan creation)**

### During Azure DevOps Integration (Step 5)

4. **azure-devops-safe-operations**: Use Azure DevOps MCP server for work item operations
   - Replaces: Manual API calls or CLI commands
   - Operations: Create Epics, link work items, retrieve IDs
   - **Use during Step 5 for all Azure DevOps operations**

## Step 0: Verify Foundation Documents

Verify that foundation documents exist in Docs/architecture/_main:
- 01-Product-Vision.md
- 02-Product-Plan.md
- 03-Business-Requirements.md
- 04-Architecture.md
- 05-User-Experience.md

If foundation documents do not exist:
- Inform user they should run `/begin-lighthouse` first
- Stop execution

## Step 1: Read Product Plan and Context

Read and analyze:
- **Docs/architecture/_main/02-Product-Plan.md**: Primary source for Epic breakdown
- **Docs/architecture/_main/01-Product-Vision.md**: Strategic context and goals
- **Docs/architecture/_main/03-Business-Requirements.md**: Functional requirements
- **Docs/architecture/_main/04-Architecture.md**: Technical architecture and constraints

Extract information about:
- Release phases or major milestones
- High-level capabilities or product areas
- Feature priorities
- Dependencies and constraints
- Timeline considerations

## Step 2: Interview User for Epic Planning

Ask focused questions (5-7 questions) to understand Epic breakdown:

**Example questions:**
- "Based on the Product Plan, what are the major initiatives or capabilities you want to develop?"
- "Which of these capabilities should be prioritized as separate Epics?"
- "Are there any technical foundations or prerequisites that need their own Epic?"
- "What is the expected timeline for each Epic (e.g., 3-6 months)?"
- "Are there dependencies between these Epics that affect the order?"
- "Do any of these Epics require significant architectural decisions?"
- "Are there compliance or regulatory requirements that should be their own Epic?"

**Important:**
- Use user's actual language and terminology
- Ask clarifying questions about scope and boundaries
- Understand dependencies between Epics
- Confirm Epic priorities and sequence

## Step 3: Create Epic Master Plans

For EACH Epic identified:

1. **Determine Epic numbering:**
   - Check existing epic-*.md files in Docs/implementation/_main
   - Use next sequential number (1, 2, 3, ...)
   - Example: If epic-4-*.md exists, next is epic-5-*.md

2. **Read Epic Plan Template:**
   - Read `.lighthouse/templates/20-Epic-Plan-Template.md`
   - Use this template structure for all Epic plans

3. **Create Epic master plan:** `Docs/implementation/_main/epic-{n}-{name}.md`
   - Follow the structure from 20-Epic-Plan-Template.md
   - Fill in all sections with specific information from the interview
   - **Reference development-best-practices skill**:
     - Document security requirements (authentication, authorization, encryption)
     - Define accessibility standards (WCAG compliance level)
     - Specify performance targets (response time, throughput)
     - Document anti-hardcoding approach (secrets management, config externalization)
   - Replace all placeholders with actual content

4. **Verify Epic plan created:**
   - Read back the created file
   - Confirm all sections are complete
   - Ensure proper formatting

5. **Repeat for all Epics** identified in Step 2

## Step 3a: Validate Epic Plans Consistency

**Invoke cross-documentation-verification skill** for all created Epic plans:

- Validate Epic plans align with foundation documents:
  - Epic goals support Product Vision strategic objectives
  - Epic milestones align with Product Plan timeline
  - Epic scope addresses Business Requirements
  - Epic technical approach feasible given Architecture constraints
  - Dependencies between Epics are consistent
- If conflicts found:
  - Document with [NEEDS REVIEW: Epic says X, but Architecture requires Y]
  - Resolve conflicts before proceeding to ADR creation
  - Update Epic plans to ensure consistency

## Step 4: Document Architectural Decisions (ADR)

**Review all Epic plans for major architectural decisions:**

- **system-architect**: For each Epic plan created:
  - Identify Epic-level architectural decisions:
    - Core technology stack choices
    - Major design pattern selections (e.g., microservices vs monolith)
    - Authentication/authorization strategies
    - Data architecture (databases, data flow)
    - Integration architecture approaches
    - Scalability and performance strategies
    - Compliance strategies (PCI DSS, HIPAA, SOC 2)
    - Security architecture decisions
    - Infrastructure and deployment strategies

- For each significant decision:
  - **Invoke architectural-conformance-validation skill**:
    - Validate: New decision doesn't conflict with existing ADRs
    - Check: Decision aligns with established architecture patterns
    - Verify: Technology choices consistent with current stack
  - Read `Docs/architecture/decisions/README.md` for next ADR number
  - Create ADR from template: `.lighthouse/templates/07-ADR-Template.md`
  - Document (industry-standard format):
    - **Title + Metadata**: Status, Date, Deciders, Related (link to Epic)
    - **Context**: Strategic need, why this decision is required at Epic level
    - **Considered Options**: List 2-3+ alternatives with pros/cons
    - **Decision**: What was decided and why (rationale and trade-offs)
    - **Consequences**: Positive outcomes, negative trade-offs, mitigation strategies
    - **References**: Related docs, external resources, research
  - Reference the Epic plan in ADR's "Related" field
  - Update ADR Index in README.md
  - Add ADR reference to Epic plan document

- Ask user to review proposed ADRs before finalizing

**Note:** These are Epic-level strategic decisions. Feature-level decisions will be documented when running `/design-features`.

## Step 5: Create Azure DevOps Epics (Optional)

- Ask user: "Do you want to create Azure DevOps work items?"
  - If yes, continue with Step 5
  - If no, go to Step 6

- Ask user: "Which Azure DevOps project should I create work items in?"
  - Project name: {user provided}

**Use azure-devops-safe-operations skill:**

- For each Epic plan created:
  - Create Epic work item via Azure DevOps MCP server
  - Work item details:
    - Title: Epic {n}: {Name}
    - Description: Summary from Epic plan + link to Epic plan file
    - Priority: From Epic plan
    - Iteration Path: To be determined
    - Area Path: As appropriate
  - Do not create Features at this stage (use `/design-features` command)
  - Link Epic to Product Vision or requirements if applicable
  - Set up Epic fields and metadata

- Retrieve created work items to confirm
- Document Azure DevOps Epic IDs in Epic plan files (add to front matter or metadata)

## Step 6: Validation

Verify that:

- [ ] All Epic master plans are complete and actionable
- [ ] Epic numbering is sequential and correct
- [ ] All Epics reference foundation documents appropriately
- [ ] Dependencies between Epics are clearly documented
- [ ] Timeline and resource requirements are realistic
- [ ] All major architectural decisions have ADRs
- [ ] ADR index is updated
- [ ] (If applicable) Azure DevOps Epics created and linked
- [ ] (If applicable) Epic IDs documented in plans

## Step 7: Next Steps Guidance

Inform user of next steps:

```
✅ Epic planning complete!

Created {n} Epic master plans:
- epic-1-{name}.md
- epic-2-{name}.md
- epic-3-{name}.md
...

Created {n} ADRs for strategic architectural decisions:
- ADR-{nnn}-{title}.md
- ADR-{nnn+1}-{title}.md
...

Next steps:
1. Review and refine Epic plans
2. For each Epic, run: /design-features
   - This will break each Epic into detailed Feature plans
3. After Features are designed, run: /design-waves
   - This will break Features into implementable Waves

Recommended order:
/design-features for Epic 1 (highest priority)
/design-waves for Epic 1 Features
/implement-waves to begin implementation
```

---

## Command Summary

**What this command does:**
- Reads foundation documents (Product Plan, Vision, Requirements, Architecture)
- Interviews user about Epic breakdown
- Creates multiple Epic master plans (epic-1-*.md, epic-2-*.md, etc.)
- Creates Epic-level ADRs for strategic decisions
- Optionally creates Azure DevOps Epic work items
- Sets up project for Feature design phase

**Input:** Foundation documents from `/begin-lighthouse`

**Output:**
- Multiple Epic master plans in `Docs/implementation/_main/`
- Epic-level ADRs in `Docs/architecture/decisions/`
- Optional: Azure DevOps Epic work items

**Next command:** `/design-features` (for each Epic)
