# Begin Lighthouse

This is the beginning step for starting a project with the Lighthouse LM IDF.
The goal is to have comprehensive documentation to continue the IDF
(implementation).

## Required Skills

### After Each Artifact Generation Phase

1. **cross-documentation-verification**: Validate consistency across generated artifacts
   - Phase 1: After generating Vision+Plan (Step 3), verify they align and are internally consistent
   - Phase 2: After generating Requirements+Architecture (Step 6), verify consistency with Vision+Plan and each other
   - Phase 3: After generating User Experience (Step 9), verify consistency with all prior artifacts
   - **ALWAYS invoke before user review steps (Steps 4, 7, 10)**

### During Architecture Generation (Step 6)

2. **development-best-practices**: Reference for technical standards validation
   - Security: Validate authentication, authorization, encryption patterns included
   - Accessibility: Ensure WCAG compliance requirements documented
   - Performance: Check performance targets and optimization strategies included
   - Anti-hardcoding: Verify architecture externalizes config, secrets management
   - Error handling: Validate logging and error handling strategies documented
   - **Use during Step 6 (Architecture generation) to validate technical quality**

## Skill Integration Workflow

```
Phase 1: Vision & Plan
→ Step 2: Interview
→ Step 3: Generate Vision + Plan artifacts
→ Step 3a: Invoke cross-documentation-verification skill
   → Validate: Vision mission aligns with Plan objectives
   → Check: Plan milestones support Vision goals
   → Check: No contradictions between Vision and Plan
   → Report conflicts for resolution before user review
→ Step 4: Present to user for review (with verification results)

Phase 2: Requirements & Architecture
→ Step 5: Interview
→ Step 6: Generate Requirements + Architecture artifacts
   → Reference development-best-practices during architecture generation
   → Validate: Security patterns documented
   → Validate: Accessibility requirements included
   → Validate: Performance targets defined
   → Validate: Anti-hardcoding approach documented
→ Step 6a: Invoke cross-documentation-verification skill
   → Validate: Requirements align with Vision and Plan
   → Check: Architecture supports all Requirements
   → Check: Architecture aligns with Plan milestones
   → Check: No conflicts between Requirements and Architecture
   → Report conflicts for resolution before user review
→ Step 7: Present to user for review (with verification results)

Phase 3: User Experience
→ Step 8: Interview
→ Step 9: Generate User Experience artifact
→ Step 9a: Invoke cross-documentation-verification skill
   → Validate: UX aligns with all prior artifacts (Vision, Plan, Requirements, Architecture)
   → Check: User roles align with Requirements
   → Check: User workflows feasible given Architecture
   → Check: UX supports Vision goals and Plan objectives
   → Report conflicts for resolution before user review
→ Step 10: Present to user for review (with verification results)
```

## Configuration Phase

### Step 0: Assess starting point and configuration

1. **Check for existing artifacts** in `/docs/architecture/_main`:
   - 01-Product-Vision.md
   - 02-Product-Plan.md
   - 03-Business-Requirements.md
   - 04-Architecture.md
   - 05-User-Experience.md

2. **Ask user for documentation depth preference**:
   - **Essential (KISS)** - Core information only, focuses on key decisions and
     critical details (~2-3 pages per artifact). Best for: startups, MVPs,
     fast-moving projects
   - **Standard (Balanced)** - Key details with appropriate depth (~5-7 pages
     per artifact). Best for: most projects, established teams
   - **Comprehensive (Detailed)** - Full template with all sections (~10+ pages
     per artifact). Best for: enterprise, regulated industries, complex systems

3. **Ask user for process mode**:
   - **Hybrid (Recommended)** - Generate Vision+Plan together (review), then
     Business Requirements+Architecture (review), then User Experience (review).
     Balances efficiency with quality control.

4. **Ask about additional context sources**: "Do you have any existing
   documentation or context files to provide? Supported formats: .md, .txt,
   .docx (Word), .xlsx (Excel), .pptx (PowerPoint), .pdf"

### Step 0.5: Load and assess context (if applicable)

- Load any provided documentation files from any supported format
- For non-markdown files (.docx, .xlsx, .pptx, .pdf), extract relevant
  information and summarize key points
- If existing Lighthouse artifacts found, perform **quality assessment**:
  - **Completeness**: Are key sections filled out or just placeholders?
  - **Clarity**: Is information specific or vague?
  - **Alignment**: Do documents align with each other?
  - **Currency**: Is information up-to-date?
  - Provide brief assessment (2-3 sentences max) to user
- **Determine resume point**: If artifacts already exist, ask user: "I found
  [list artifacts]. Would you like to: (1) Review and enhance existing docs, (2)
  Start fresh, or (3) Continue from where you left off?"

## Interview & Generation Guidelines (CRITICAL - Apply to ALL artifacts)

### Interview Best Practices

- Ask **5-7 focused questions** for Vision+Plan, **3-5 questions** for Business
  Requirements, **5-7 questions** for Architecture, **3-5 questions** for User
  Experience
- Ask specific questions - avoid assumptions
- Use user's actual language and terminology
- Can include files, screenshots, or documentation as part of context gathering

### Content Generation Standards

**✅ DO:**

- Use specific information provided by the user
- Maintain KISS principle appropriate to selected depth setting
- Ensure artifact alignment and consistency with prior artifacts
- Mark uncertainties clearly with "[RESEARCH NEEDED]" or "[TO BE DETERMINED]"
- Use user's actual language and descriptions

**❌ DON'T:**

- Generate "Current State" or "Current System" sections unless user has
  described an existing system
- Include made-up statistics, market data, or financial projections
- Fabricate competitor information, user research, or quantitative metrics
- Assume features, requirements, or technical details not explicitly discussed
- Create migration or integration sections for greenfield projects

### Handling Missing Information

- **For quantitative data** (market size, metrics, statistics):
  - ONLY include if user provides specific numbers
  - If unavailable, use: "[TO BE DETERMINED - requires market research]"
  - Mark sections: "📊 RESEARCH NEEDED"
- **For competitive/market data**: Only include if user provides; otherwise mark
  for future research
- **For current systems**: Only generate if user describes existing system;
  otherwise focus on "Target Architecture" and "Future State"

## Step 1: Read Template Documents

Read the template files to understand the structure:

- 01-Product-Vision-Template.md
- 02-Product-Plan-Template.md
- 03-Business-Requirements-Template.md
- 04-Architecture-Template.md
- 05-User-Experience-Template.md

Adapt template depth based on user's selected preference
(Essential/Standard/Comprehensive).

## Artifact Generation Process (Hybrid Mode)

### Phase 1: Vision & Plan (Steps 2-3)

**Step 2: Vision and Plan Interview**

- Conduct **combined interview** gathering context for both Vision and Plan (5-7
  focused questions)
- Can include files, documentation, or other context sources
- Follow Interview Best Practices and Content Generation Standards above

**Step 3: Generate Vision and Plan Artifacts**

- Generate both 01-Product-Vision.md and 02-Product-Plan.md in
  `/docs/architecture/_main`
- Ensure alignment between the two documents
- Apply selected depth level (Essential/Standard/Comprehensive)

**Step 3a: Invoke cross-documentation-verification skill**

- Validate Vision and Plan consistency:
  - Vision mission statement aligns with Plan objectives
  - Plan milestones support Vision strategic goals
  - Target market/users consistent across both documents
  - Success metrics in Plan support Vision outcomes
  - No contradictions in scope, timeline, or approach
- If conflicts found:
  - Document conflicts with [NEEDS REVIEW: Vision says X, Plan says Y]
  - Resolve conflicts before user review
  - Update artifacts to ensure consistency

**Step 4: Review Vision and Plan**

- Present both artifacts to user for review
- Include verification results: "✅ Documents verified for consistency" or "⚠️ Minor conflicts resolved in [sections]"
- Review against acquired context to verify all details are covered
- Ask additional questions for clarification if needed - do not assume
- Make appropriate edits based on feedback
- Get user approval before proceeding

### Phase 2: Business Requirements & Architecture (Steps 5-7)

**Step 5: Business Requirements and Architecture Interview**

- Conduct **combined interview** for both Business Requirements and Architecture
- **Business Requirements questions** (3-5 focused questions): Features, user
  stories, functional requirements
- **Architecture questions** (5-7 focused questions): Technical stack, system
  components, integrations, scalability needs
- Use Vision and Plan artifacts for context and alignment

**Step 6: Generate Business Requirements and Architecture Artifacts**

- Generate 03-Business-Requirements.md in `/docs/architecture/_main`
- Generate 04-Architecture.md in `/docs/architecture/_main`
  - **Reference development-best-practices skill during Architecture generation**:
    - Include authentication/authorization patterns (OAuth, JWT, RBAC)
    - Document encryption strategies (at rest, in transit, key management)
    - Define WCAG accessibility compliance level (AA or AAA)
    - Specify performance targets (load time, response time, throughput)
    - Document anti-hardcoding approach (secrets management, config externalization)
    - Include error handling and logging strategies
    - Define monitoring and observability requirements
- Ensure alignment with Vision and Plan
- Ensure Business Requirements and Architecture are aligned with each other
- Apply selected depth level

**Step 6a: Invoke cross-documentation-verification skill**

- Validate Requirements and Architecture consistency:
  - All functional requirements from Requirements addressed in Architecture
  - Non-functional requirements (performance, security, scalability) reflected in Architecture
  - Architecture components support all required features
  - Requirements align with Vision goals and Plan milestones
  - Architecture technical decisions don't contradict Plan timeline or scope
  - User roles in Requirements supported by Architecture (authentication, authorization)
- If conflicts found:
  - Document conflicts with [NEEDS REVIEW: Requirements needs X, Architecture provides Y]
  - Resolve conflicts before user review
  - Update artifacts to ensure consistency

**Step 7: Review Business Requirements and Architecture**

- Present both artifacts to user for review
- Include verification results: "✅ Documents verified for consistency with Vision/Plan" or "⚠️ Conflicts resolved in [sections]"
- Verify alignment with Vision and Plan
- Verify all features from requirements are addressed in architecture
- Ask additional questions for clarification if needed - do not assume
- Make appropriate edits based on feedback
- Get user approval before proceeding

### Phase 3: User Experience (Steps 8-9)

**Step 8: User Experience Interview**

- Conduct interview for User Experience specifications (3-5 focused questions)
- Focus on: user roles, workflows, interface requirements, user journey
- Use all prior artifacts (Vision, Plan, Business Requirements, Architecture)
  for context

**Step 9: Generate User Experience Artifact**

- Generate 05-User-Experience.md in `/docs/architecture/_main`
- Ensure alignment with all prior artifacts
- Map out user flows for all roles identified in prior documents
- Apply selected depth level

**Step 9a: Invoke cross-documentation-verification skill**

- Validate User Experience consistency with all prior artifacts:
  - User roles in UX match roles defined in Requirements
  - User workflows are feasible given Architecture constraints
  - User journeys support Vision goals and Plan objectives
  - UI/UX requirements align with functional Requirements
  - Accessibility requirements in UX match Architecture specifications
  - User experience supports all features from Requirements
  - No conflicts between UX design and technical Architecture
- If conflicts found:
  - Document conflicts with [NEEDS REVIEW: UX proposes X, but Architecture only supports Y]
  - Resolve conflicts before user review
  - Update artifacts to ensure consistency across all 5 documents

**Step 10: Review User Experience**

- Present artifact to user for review
- Include verification results: "✅ All 5 documents verified for consistency" or "⚠️ Final conflicts resolved"
- Verify alignment with all prior artifacts
- Verify all user roles and workflows are covered
- Ask additional questions for clarification if needed - do not assume
- Make appropriate edits based on feedback
- Get user approval

## Completion

Once all artifacts are approved:

- Confirm all 5 artifacts are in `/docs/architecture/_main`
- Provide brief summary of what was created
- Suggest next steps (e.g., "Ready to begin implementation planning with Epic
  Design process")
