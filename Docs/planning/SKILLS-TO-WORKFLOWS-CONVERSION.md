# Skills to Workflows Conversion Plan

**Status:** Planning / Under Review
**Created:** January 25, 2026
**Last Updated:** January 25, 2026
**Purpose:** Convert existing Claude Code skills to executable workflows exposed via MCP server

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Conversion Strategy](#conversion-strategy)
3. [Architectural Approach](#architectural-approach)
4. [Skill Analysis & Classification](#skill-analysis--classification)
5. [Workflow Patterns](#workflow-patterns)
6. [Example Conversions](#example-conversions)
7. [MCP Tool Definitions](#mcp-tool-definitions)
8. [Implementation Plan](#implementation-plan)
9. [User Experience Flow](#user-experience-flow)
10. [Technical Implementation](#technical-implementation)

---

## Executive Summary

### The Goal

Convert 15 existing Claude Code skills into executable workflows that:
- Can be run manually from Workflow Builder UI
- Are exposed to Claude Code CLI via MCP server
- Use ClaudeAPINode for reasoning/generation within workflows
- Provide streaming progress updates
- Support both autonomous execution and Claude orchestration

### Current State

**15 Claude Code Skills:**
- `azure-devops-work-item-creation`
- `azure-devops-work-item-update`
- `azure-devops-safe-operations`
- `wave-coherence-validation`
- `architectural-conformance-validation`
- `cross-documentation-verification`
- `development-best-practices`
- `git-safe-operations`
- `git-agentic-branching-strategy`
- `git-repository-setup-validation`
- `git-development-workflow-setup`
- `implementation-velocity-tracking`
- `requirements-coverage-analysis`
- `ucp-calculation-planned-work`

**Current Implementation:**
- Markdown files (SKILL.md) with YAML frontmatter
- Instructions for Claude Code to follow
- Call Python scripts and MCP tools
- Claude reads and executes instructions manually

### Target State

**Executable Workflows + MCP Tools:**

```
Each skill becomes:

Option A (Autonomous Workflow):
├─ Complete workflow YAML
├─ Runs start-to-finish without Claude
├─ Uses ClaudeAPINode for reasoning
├─ Exposes MCP tool: execute_workflow(name, inputs)
└─ Streams progress back to Claude

Option B (Tool Collection):
├─ Multiple small workflows (one per major step)
├─ Each exposed as separate MCP tool
├─ Claude orchestrates the sequence
└─ More flexible, adaptive

Option C (Hybrid):
├─ Core workflow for main path
├─ Individual tools for steps Claude might want separately
└─ Best of both worlds
```

### Design Decisions

Based on user requirements:

1. **Hybrid Approach** - Case-by-case basis for each skill
2. **Claude API Integration** - Use ClaudeAPINode within workflows (not external calls back to CLI)
3. **Skill Dependencies** - Extend workflows with additional nodes or let Claude orchestrate
4. **Granularity** - Varies by skill complexity and use case
5. **Dual Access** - Both explicit (Workflow Builder) and implicit (MCP for Claude)
6. **Streaming Updates** - Real-time progress feedback (Option C)

---

## Conversion Strategy

### Decision Framework

For each skill, evaluate:

**Question 1: Is it a linear procedure or requires adaptive reasoning?**
- **Linear/Deterministic** → Autonomous Workflow (Option A)
- **Adaptive/Conditional** → Tool Collection (Option B) or Hybrid (Option C)

**Question 2: Does it involve external system integration?**
- **Yes (Azure DevOps, Git)** → Autonomous Workflow (handles auth, retries, etc.)
- **No (File analysis)** → Tool Collection (Claude can orchestrate)

**Question 3: How often do users need intermediate results?**
- **Rarely** → Autonomous Workflow
- **Frequently** → Tool Collection or Hybrid

**Question 4: Does it call other skills?**
- **Yes** → Hybrid (workflow includes sub-workflows or Claude orchestrates)
- **No** → Either approach works

**Question 5: How complex is the Claude reasoning required?**
- **Simple (UCP calculation)** → Autonomous Workflow with ClaudeAPINode
- **Complex (Architecture review)** → Tool Collection (Claude orchestrates with full context)

### Conversion Patterns

**Pattern 1: Pure Autonomous Workflow**
```
Skill → Single Workflow → MCP Tool

User invokes:
- From UI: Click "Run" in Workflow Builder
- Via MCP: Claude calls execute_workflow('skill-name', inputs)

Workflow runs autonomously, streams progress
```

**Pattern 2: Tool Collection**
```
Skill → Multiple Small Workflows → Multiple MCP Tools

User invokes:
- From UI: Run individual workflows
- Via MCP: Claude orchestrates sequence

Claude: "Let me parse the epic, then calculate UCP, then create work items"
```

**Pattern 3: Hybrid**
```
Skill → Core Workflow + Individual Step Tools

User invokes:
- From UI: Run main workflow (does everything)
- Via MCP: Claude can run full workflow OR individual steps

Flexibility for both use cases
```

---

## Architectural Approach

### Workflow Node Types Used

From our existing workflow implementation:

**1. PythonScriptNode**
- Execute Python scripts (parse markdown, validate files, etc.)
- Capture stdout/stderr
- Handle exit codes
- Example: `parse_markdown.py`, `validate_architecture.py`

**2. ClaudeAPINode**
- Call Claude API for reasoning/generation
- Provide context from previous steps
- Parse structured responses
- Example: "Calculate UCP from these tasks", "Generate user stories"

**3. ConditionalNode**
- Branch based on conditions
- Example: If validation fails, take error path; else continue

**4. LoopNode**
- Iterate over collections
- Example: Create work item for each feature in epic

**5. FallbackNode**
- Error handling and retries
- Example: Retry Azure DevOps call on network failure

**6. OutputNode**
- Structure final results
- Return to Claude or display in UI

### Claude API Integration Pattern

**ClaudeAPINode Configuration:**

```yaml
- id: reason_about_data
  type: claude
  config:
    model: claude-3-5-sonnet-20241022
    max_tokens: 4000
    temperature: 0.7
    system_prompt: |
      You are a UCP calculation expert. Analyze the provided tasks
      and calculate the Objective UCP based on Lighthouse methodology.

      Return JSON: { "ucp": number, "breakdown": {...}, "confidence": string }
    prompt_template: |
      Analyze these tasks and calculate Objective UCP:

      Tasks:
      ${parse_result.tasks}

      Consider:
      - Technical complexity factors
      - Environmental factors
      - Specificity adjustment
  inputs:
    - name: parse_result
      from: step_parse_markdown.output
  outputs:
    - name: ucp_result
```

**Key Benefits:**
- ✅ Claude reasoning stays within workflow
- ✅ No context switching back to CLI
- ✅ Structured input/output
- ✅ Auditable (logged in workflow execution)

### Streaming Progress Pattern

**Workflow Execution Events:**

```typescript
// From workflow execution
EventEmitter.emit('workflow:step:started', {
  workflowId: 'uuid',
  stepId: 'parse_markdown',
  stepName: 'Parse Epic Markdown',
  timestamp: Date.now()
});

EventEmitter.emit('workflow:step:progress', {
  workflowId: 'uuid',
  stepId: 'parse_markdown',
  message: 'Parsing file...',
  progress: 0.5
});

EventEmitter.emit('workflow:step:completed', {
  workflowId: 'uuid',
  stepId: 'parse_markdown',
  outputs: { ... },
  duration: 1250
});
```

**MCP Server Forwards to Claude:**

```typescript
// MCP server streams updates
server.sendProgress({
  workflowId: 'uuid',
  message: 'Step 1/5: Parse Epic Markdown - Complete',
  progress: 0.2
});
```

**Claude Sees:**
```
Executing workflow: azure-devops-work-item-creation
├─ Step 1/5: Parse Epic Markdown ✓ (1.2s)
├─ Step 2/5: Calculate UCP ⏳
└─ ...
```

---

## Skill Analysis & Classification

### Skill-by-Skill Evaluation

#### 1. azure-devops-work-item-creation

**Analysis:**
- Linear 5-step procedure
- Integrates with Azure DevOps (external system)
- Calls UCP calculation (can use ClaudeAPINode)
- Creates hierarchical work items

**Classification:** **Autonomous Workflow** (Pattern 1)

**Reasoning:**
- Deterministic sequence
- External system integration benefits from workflow handling auth/retries
- Users want "create all work items from epic" in one command

**Workflow Structure:**
```yaml
name: azure-devops-work-item-creation
steps:
  1. parse_markdown (Python)
  2. calculate_ucp (Claude API)
  3. create_epic (Azure DevOps MCP)
  4. create_features_loop (Loop + Azure DevOps MCP)
  5. link_parent_child (Azure DevOps MCP)
```

**MCP Tool:**
```typescript
execute_workflow('azure-devops-work-item-creation', {
  epicFile: 'path/to/epic.md',
  project: 'ProjectName'
})
```

---

#### 2. wave-coherence-validation

**Analysis:**
- Complex analysis requiring reasoning
- Multiple validation checks
- Adaptive based on findings
- Generates detailed report

**Classification:** **Hybrid** (Pattern 3)

**Reasoning:**
- Core workflow for full validation
- Individual tools for specific checks (Claude might want granular control)
- Complex reasoning benefits from Claude's full context

**Workflow Structure:**

**Main Workflow:**
```yaml
name: wave-coherence-validation-full
steps:
  1. scope_analysis (Python + Git)
  2. dependency_detection (Claude API - analyze code structure)
  3. api_contract_validation (Python + Claude API)
  4. implementation_order_check (Claude API - reason about dependencies)
  5. generate_report (Python + Claude API)
```

**Individual Tools:**
```yaml
name: check-implementation-dependencies
steps:
  1. analyze_dependencies (Python)
  2. output_results (Output)

name: validate-api-contracts
steps:
  1. find_api_endpoints (Python)
  2. check_contracts (Claude API)
  3. output_results (Output)
```

**MCP Tools:**
```typescript
// Full validation
execute_workflow('wave-coherence-validation-full', { branch: 'feature-x' })

// Or granular
execute_workflow('check-implementation-dependencies', { branch: 'feature-x' })
execute_workflow('validate-api-contracts', { branch: 'feature-x' })
```

---

#### 3. ucp-calculation-planned-work

**Analysis:**
- Specialized calculation logic
- Needs Claude reasoning for complexity assessment
- Returns structured numeric result
- Frequently used by other skills

**Classification:** **Autonomous Workflow** (Pattern 1)

**Reasoning:**
- Called by other workflows (azure-devops-work-item-creation)
- Deterministic calculation methodology
- Self-contained

**Workflow Structure:**
```yaml
name: ucp-calculation
steps:
  1. classify_work_items (Claude API - classify tasks as stories/bugs/tests)
  2. count_transactions (Python + Claude API)
  3. calculate_tcf (Python)
  4. calculate_ecf (Python)
  5. calculate_saf (Claude API - assess specificity)
  6. compute_final_ucp (Python)
```

**MCP Tool:**
```typescript
execute_workflow('ucp-calculation', {
  workItems: [{id: 1, title: '...', estimate: 8}, ...],
  projectType: 'web-application'
})
// Returns: { ucp: 42.5, breakdown: {...}, confidence: 'high' }
```

---

#### 4. architectural-conformance-validation

**Analysis:**
- Deep architectural analysis
- Compares implementation to ADRs
- Complex pattern matching
- Generates findings report

**Classification:** **Autonomous Workflow** (Pattern 1)

**Reasoning:**
- Comprehensive analysis best done in one pass
- Needs to read many files and ADRs
- Benefits from workflow managing file I/O and caching

**Workflow Structure:**
```yaml
name: architectural-conformance-validation
steps:
  1. load_adrs (Python - read all ADRs)
  2. analyze_codebase_structure (Python + Claude API)
  3. validate_patterns (Claude API - deep reasoning)
  4. check_technology_compliance (Python + Claude API)
  5. calculate_conformance_score (Python)
  6. generate_findings_report (Claude API + Python)
```

**MCP Tool:**
```typescript
execute_workflow('architectural-conformance-validation', {
  scope: 'feature-10.4' // or 'full'
})
// Returns detailed conformance report
```

---

#### 5. cross-documentation-verification

**Analysis:**
- Reads multiple documentation types
- Detects inconsistencies and conflicts
- Generates cross-reference report
- Complex reasoning required

**Classification:** **Autonomous Workflow** (Pattern 1)

**Reasoning:**
- Reads many files (epics, features, waves, ADRs)
- Comprehensive analysis
- Workflows can cache file reads efficiently

**Workflow Structure:**
```yaml
name: cross-documentation-verification
steps:
  1. gather_documentation (Python - find all docs)
  2. parse_all_documents (Loop + Python)
  3. build_cross_reference_map (Python)
  4. detect_conflicts (Claude API - deep reasoning)
  5. identify_gaps (Claude API)
  6. generate_verification_report (Claude API + Python)
```

---

#### 6. development-best-practices

**Analysis:**
- Knowledge base / guidelines
- Not really procedural
- Reference material for other workflows

**Classification:** **Skill Remains as Skill** (Not converted to workflow)

**Reasoning:**
- This is reference knowledge, not a procedure
- Better as a skill that other workflows reference
- Claude reads this when making decisions in ClaudeAPINodes

**Alternative:**
- Package as a resource in MCP server
- Workflows can reference it in ClaudeAPINode system prompts

---

#### 7. git-safe-operations

**Analysis:**
- Wraps git commands with safety checks
- Validates before destructive operations
- Not a full workflow, more like guard rails

**Classification:** **Tool Collection** (Pattern 2)

**Reasoning:**
- Individual git operations are discrete
- Claude orchestrates git workflow
- Workflows provide safety validation

**Workflows:**
```yaml
name: git-safe-commit
steps:
  1. validate_commit_message (Python)
  2. check_no_secrets (Python)
  3. commit_with_safety (Bash)

name: git-safe-push
steps:
  1. check_branch_protection (Python)
  2. validate_no_force_push_to_main (Python)
  3. push_with_safety (Bash)

name: git-safe-merge
steps:
  1. check_branch_up_to_date (Bash)
  2. validate_merge_target (Python)
  3. merge_with_safety (Bash)
```

**MCP Tools:**
```typescript
execute_workflow('git-safe-commit', { message: '...' })
execute_workflow('git-safe-push', { branch: 'feature-x' })
execute_workflow('git-safe-merge', { from: 'feature-x', to: 'development' })
```

---

#### 8. azure-devops-work-item-update

**Analysis:**
- Updates existing work items
- Links git commits
- Adds implementation summaries
- Changes status to "Ready for Testing"

**Classification:** **Autonomous Workflow** (Pattern 1)

**Reasoning:**
- Clear sequence of steps
- Integrates with Azure DevOps
- Called after completing implementation

**Workflow Structure:**
```yaml
name: azure-devops-work-item-update
steps:
  1. find_work_item (Azure DevOps MCP)
  2. get_git_commits (Bash)
  3. generate_implementation_summary (Claude API)
  4. update_work_item_fields (Azure DevOps MCP)
  5. link_git_commits (Azure DevOps MCP)
  6. update_status (Azure DevOps MCP)
```

---

#### 9. git-repository-setup-validation

**Analysis:**
- Validates git workflow setup
- Checks branch protection
- Verifies development branch exists
- Returns validation report

**Classification:** **Autonomous Workflow** (Pattern 1)

**Reasoning:**
- Deterministic checks
- Returns pass/fail report
- Self-contained

**Workflow Structure:**
```yaml
name: git-repository-setup-validation
steps:
  1. check_development_branch_exists (Bash)
  2. validate_main_branch_protection (Bash)
  3. check_branch_naming_convention (Bash)
  4. validate_pr_requirements (Bash)
  5. generate_validation_report (Python)
```

---

#### 10. implementation-velocity-tracking

**Analysis:**
- Tracks metrics (actual vs estimated hours, defects, etc.)
- Calculates team velocity
- Generates velocity dashboard
- Data-driven analysis

**Classification:** **Tool Collection** (Pattern 2)

**Reasoning:**
- Users might want individual metrics separately
- Claude can compose custom reports
- Flexible querying

**Workflows:**
```yaml
name: record-wave-completion
steps:
  1. extract_wave_metrics (Python)
  2. store_in_velocity_db (Python)

name: calculate-team-velocity
steps:
  1. load_historical_data (Python)
  2. calculate_velocity (Python + Claude API)
  3. output_velocity_metrics (Output)

name: generate-velocity-dashboard
steps:
  1. load_all_metrics (Python)
  2. generate_visualizations (Python)
  3. create_markdown_report (Claude API + Python)
```

---

#### 11. requirements-coverage-analysis

**Analysis:**
- Maps requirements to features/waves
- Identifies gaps
- Generates traceability matrix
- Complex cross-referencing

**Classification:** **Autonomous Workflow** (Pattern 1)

**Reasoning:**
- Comprehensive analysis
- Reads many files
- Generates detailed report

**Workflow Structure:**
```yaml
name: requirements-coverage-analysis
steps:
  1. gather_requirements (Python)
  2. gather_features_and_waves (Python)
  3. build_traceability_matrix (Python + Claude API)
  4. identify_uncovered_requirements (Claude API)
  5. detect_orphaned_features (Claude API)
  6. generate_coverage_report (Python + Claude API)
```

---

### Summary Matrix

| Skill | Pattern | Workflow Type | MCP Exposure |
|-------|---------|---------------|--------------|
| azure-devops-work-item-creation | Autonomous | Single workflow | `execute_workflow('azure-devops-work-item-creation', ...)` |
| azure-devops-work-item-update | Autonomous | Single workflow | `execute_workflow('azure-devops-work-item-update', ...)` |
| azure-devops-safe-operations | Tool Collection | Multiple workflows | Multiple tools for each operation |
| wave-coherence-validation | Hybrid | Main + individual tools | Full workflow + granular tools |
| architectural-conformance-validation | Autonomous | Single workflow | `execute_workflow('architectural-conformance-validation', ...)` |
| cross-documentation-verification | Autonomous | Single workflow | `execute_workflow('cross-documentation-verification', ...)` |
| development-best-practices | Skill (unchanged) | N/A (reference knowledge) | Resource in MCP |
| git-safe-operations | Tool Collection | Multiple safety wrappers | Multiple tools |
| git-agentic-branching-strategy | Skill (unchanged) | N/A (decision guide) | Resource in MCP |
| git-repository-setup-validation | Autonomous | Single workflow | `execute_workflow('git-repository-setup-validation', ...)` |
| git-development-workflow-setup | Autonomous | Single workflow | `execute_workflow('git-development-workflow-setup', ...)` |
| implementation-velocity-tracking | Tool Collection | Multiple metric tools | Multiple tools |
| requirements-coverage-analysis | Autonomous | Single workflow | `execute_workflow('requirements-coverage-analysis', ...)` |
| ucp-calculation-planned-work | Autonomous | Single workflow | `execute_workflow('ucp-calculation', ...)` |

**Breakdown:**
- **Autonomous Workflows:** 9
- **Tool Collections:** 3
- **Hybrid:** 1
- **Skills Remain:** 2 (reference knowledge)

---

## Workflow Patterns

### Pattern A: Autonomous Workflow with Claude Reasoning

**Example: UCP Calculation**

```yaml
name: ucp-calculation
description: Calculate Objective UCP from work items using Lighthouse methodology
version: 1.0.0

inputs:
  - name: work_items
    type: array
    required: true
    description: Array of work items with id, title, estimate
  - name: project_type
    type: string
    required: false
    default: web-application

steps:
  # Step 1: Classify work items
  - id: classify_items
    type: claude
    config:
      model: claude-3-5-sonnet-20241022
      max_tokens: 2000
      system_prompt: |
        Classify work items as Story, Task, Bug, or Test based on titles and descriptions.
        Return JSON array: [{ id, type, confidence }]
      prompt_template: |
        Classify these work items:
        ${work_items}
    outputs:
      - name: classifications

  # Step 2: Count transactions per work item
  - id: count_transactions
    type: claude
    config:
      model: claude-3-5-sonnet-20241022
      max_tokens: 3000
      system_prompt: |
        Analyze each work item and count CRUD transactions.
        Consider: Database operations, API calls, UI interactions.
        Return JSON: [{ id, transactions: { simple, average, complex } }]
      prompt_template: |
        Work items with classifications:
        ${classify_items.classifications}

        Original work items:
        ${work_items}
    outputs:
      - name: transactions

  # Step 3: Calculate Technical Complexity Factor (TCF)
  - id: calculate_tcf
    type: python
    script: |
      import json
      transactions = json.loads('${count_transactions.transactions}')

      # Weighted complexity: simple=5, average=10, complex=15
      total = sum(
        t['transactions']['simple'] * 5 +
        t['transactions']['average'] * 10 +
        t['transactions']['complex'] * 15
        for t in transactions
      )

      # TCF formula (simplified)
      tcf = 0.6 + (total * 0.01)
      print(json.dumps({'tcf': tcf, 'total_transactions': total}))
    outputs:
      - name: tcf_result

  # Step 4: Calculate Environmental Complexity Factor (ECF)
  - id: calculate_ecf
    type: python
    script: |
      # ECF based on project type
      project_type = '${project_type}'
      ecf_map = {
        'web-application': 1.2,
        'api-service': 1.0,
        'data-pipeline': 1.3,
        'mobile-app': 1.4
      }
      ecf = ecf_map.get(project_type, 1.0)
      print(json.dumps({'ecf': ecf}))
    outputs:
      - name: ecf_result

  # Step 5: Calculate Specificity Adjustment Factor (SAF)
  - id: calculate_saf
    type: claude
    config:
      model: claude-3-5-sonnet-20241022
      max_tokens: 1500
      system_prompt: |
        Assess work item specificity on scale 0.0-1.0:
        - 1.0 = Fully specified (clear requirements, acceptance criteria)
        - 0.5 = Partially specified (some ambiguity)
        - 0.0 = Vague (unclear requirements)

        Return JSON: { saf: number, rationale: string }
      prompt_template: |
        Assess specificity of these work items:
        ${work_items}
    outputs:
      - name: saf_result

  # Step 6: Compute Final UCP
  - id: compute_ucp
    type: python
    script: |
      import json

      tcf = json.loads('${calculate_tcf.tcf_result}')['tcf']
      ecf = json.loads('${calculate_ecf.ecf_result}')['ecf']
      saf = json.loads('${calculate_saf.saf_result}')['saf']
      total_transactions = json.loads('${calculate_tcf.tcf_result}')['total_transactions']

      # UCP = Transactions * TCF * ECF * (1 + SAF)
      ucp = total_transactions * tcf * ecf * (1 + saf)

      result = {
        'ucp': round(ucp, 2),
        'breakdown': {
          'transactions': total_transactions,
          'tcf': tcf,
          'ecf': ecf,
          'saf': saf
        },
        'confidence': 'high' if saf > 0.7 else 'medium' if saf > 0.4 else 'low'
      }

      print(json.dumps(result))
    outputs:
      - name: final_result

outputs:
  - name: ucp
    value: ${compute_ucp.final_result}
```

**MCP Tool Definition:**

```typescript
{
  name: 'calculate_ucp',
  description: 'Calculate Objective UCP from work items using Lighthouse methodology v4.0',
  inputSchema: {
    type: 'object',
    properties: {
      work_items: {
        type: 'array',
        description: 'Work items to analyze',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            estimate: { type: 'number' }
          }
        }
      },
      project_type: {
        type: 'string',
        enum: ['web-application', 'api-service', 'data-pipeline', 'mobile-app'],
        default: 'web-application'
      }
    },
    required: ['work_items']
  }
}
```

---

### Pattern B: Tool Collection (Git Safe Operations)

**Example: Git Safe Commit**

```yaml
name: git-safe-commit
description: Safely commit changes with validation checks
version: 1.0.0

inputs:
  - name: message
    type: string
    required: true
  - name: files
    type: array
    required: false
    description: Specific files to commit (or all staged if not provided)

steps:
  # Step 1: Validate commit message
  - id: validate_message
    type: python
    script: |
      import re
      message = '${message}'

      # Check message follows convention: "type: description"
      # Examples: "feat: add feature", "fix: bug fix", "docs: update"
      pattern = r'^(feat|fix|docs|style|refactor|test|chore):\s.{10,}'

      if not re.match(pattern, message):
        print(json.dumps({
          'valid': False,
          'error': 'Commit message must follow format: "type: description" (min 10 chars)'
        }))
      else:
        print(json.dumps({'valid': True}))
    outputs:
      - name: validation_result

  # Step 2: Check for secrets in staged files
  - id: check_secrets
    type: bash
    command: |
      # Use detect-secrets or similar tool
      git diff --cached | grep -E "(password|api_key|secret|token)" && echo "SECRETS_FOUND" || echo "OK"
    outputs:
      - name: secrets_check

  # Step 3: Conditional - fail if secrets found
  - id: validate_no_secrets
    type: conditional
    condition: ${check_secrets.secrets_check} == "OK"
    then: commit_changes
    else: fail_with_error

  # Step 4: Perform commit
  - id: commit_changes
    type: bash
    command: |
      if [ -n "${files}" ]; then
        git add ${files}
      fi
      git commit -m "${message}"
    outputs:
      - name: commit_result

  # Step 5: Error output
  - id: fail_with_error
    type: output
    value:
      success: false
      error: "Potential secrets detected in commit"

outputs:
  - name: result
    value: ${commit_changes.commit_result}
```

**MCP Tool:**

```typescript
{
  name: 'git_safe_commit',
  description: 'Safely commit changes with validation (message format, no secrets)',
  inputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string', minLength: 10 },
      files: { type: 'array', items: { type: 'string' } }
    },
    required: ['message']
  }
}
```

---

### Pattern C: Hybrid (Wave Coherence Validation)

**Main Workflow:**

```yaml
name: wave-coherence-validation-full
description: Complete wave coherence validation with dependency analysis
version: 1.0.0

inputs:
  - name: branch
    type: string
    required: true
    description: Feature/wave branch to validate

steps:
  # Step 1: Scope Analysis
  - id: scope_analysis
    type: bash
    command: |
      git checkout ${branch}
      parent_branch=$(git show-branch | grep '*' | grep -v "$(git rev-parse --abbrev-ref HEAD)" | head -1 | sed 's/.*\[\(.*\)\].*/\1/')
      git diff --name-status $parent_branch...HEAD > /tmp/changed_files.txt
      git log --oneline $parent_branch..HEAD > /tmp/commits.txt

      echo "{\"parent\": \"$parent_branch\", \"changed_files\": \"$(cat /tmp/changed_files.txt)\", \"commits\": \"$(cat /tmp/commits.txt)\"}"
    outputs:
      - name: scope

  # Step 2: Detect dependencies
  - id: detect_dependencies
    type: claude
    config:
      model: claude-3-5-sonnet-20241022
      max_tokens: 4000
      system_prompt: |
        Analyze code changes and detect dependencies:
        - Database changes that APIs depend on
        - API endpoints that UIs depend on
        - Shared utilities that multiple components use

        Return JSON:
        {
          "dependencies": [
            { "file": "path", "depends_on": ["paths"], "type": "database|api|ui|util" }
          ],
          "dependency_order": ["file1", "file2", ...]
        }
      prompt_template: |
        Changed files:
        ${scope_analysis.scope}

        Analyze dependencies and implementation order.
    outputs:
      - name: dependencies

  # Step 3: Validate API contracts
  - id: validate_contracts
    type: python
    script: |
      import json
      import re

      dependencies = json.loads('${detect_dependencies.dependencies}')

      # For each API file, check if endpoints match expected contracts
      # (This would read actual files and check signatures)

      issues = []
      for dep in dependencies['dependencies']:
        if dep['type'] == 'api':
          # Validate API endpoint exists and matches contract
          # (Simplified for example)
          issues.append({
            'file': dep['file'],
            'issue': 'API contract validation not yet implemented',
            'severity': 'info'
          })

      print(json.dumps({'issues': issues}))
    outputs:
      - name: contract_issues

  # Step 4: Check implementation order
  - id: check_order
    type: claude
    config:
      model: claude-3-5-sonnet-20241022
      max_tokens: 3000
      system_prompt: |
        Review commit history and determine if implementation followed correct dependency order.
        Flag any commits that implement dependent code before dependencies exist.

        Return JSON:
        {
          "order_violations": [
            { "commit": "sha", "issue": "description", "recommendation": "what to do" }
          ],
          "assessment": "pass|warn|fail"
        }
      prompt_template: |
        Commits:
        ${scope_analysis.scope}

        Dependencies:
        ${detect_dependencies.dependencies}

        Check if implementation order is coherent.
    outputs:
      - name: order_check

  # Step 5: Generate report
  - id: generate_report
    type: claude
    config:
      model: claude-3-5-sonnet-20241022
      max_tokens: 4000
      system_prompt: |
        Generate a comprehensive wave coherence validation report in markdown.
        Include: summary, dependency graph, violations found, recommendations.
      prompt_template: |
        Generate report from:

        Scope: ${scope_analysis.scope}
        Dependencies: ${detect_dependencies.dependencies}
        Contract Issues: ${validate_contracts.contract_issues}
        Order Check: ${check_order.order_check}
    outputs:
      - name: report

outputs:
  - name: validation_report
    value: ${generate_report.report}
  - name: assessment
    value: ${check_order.order_check}
```

**Individual Tool Workflows:**

```yaml
name: check-implementation-dependencies
description: Analyze dependencies between changed files
version: 1.0.0

inputs:
  - name: branch
    type: string

steps:
  - id: analyze
    type: bash
    command: |
      git diff --name-status origin/development...${branch} > /tmp/files.txt
      cat /tmp/files.txt
    outputs:
      - name: files

  - id: detect_deps
    type: claude
    config:
      model: claude-3-5-sonnet-20241022
      system_prompt: "Detect dependencies between files"
      prompt_template: "Files: ${analyze.files}"
    outputs:
      - name: dependencies

outputs:
  - name: result
    value: ${detect_deps.dependencies}
```

**MCP Tools:**

```typescript
// Full validation
{
  name: 'validate_wave_coherence',
  description: 'Complete wave coherence validation with dependency analysis',
  inputSchema: {
    type: 'object',
    properties: {
      branch: { type: 'string', description: 'Branch to validate' }
    },
    required: ['branch']
  }
}

// Granular tool
{
  name: 'check_implementation_dependencies',
  description: 'Analyze dependencies between changed files',
  inputSchema: {
    type: 'object',
    properties: {
      branch: { type: 'string' }
    },
    required: ['branch']
  }
}
```

---

## MCP Tool Definitions

### Complete MCP Tool Registry

**Workflow Execution Tools:**

```typescript
// Generic workflow execution
{
  name: 'execute_workflow',
  description: 'Execute a named workflow with inputs',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_name: { type: 'string', description: 'Name of workflow to execute' },
      inputs: { type: 'object', description: 'Workflow inputs' },
      streaming: { type: 'boolean', default: true, description: 'Stream progress updates' }
    },
    required: ['workflow_name']
  }
}

// List available workflows
{
  name: 'list_workflows',
  description: 'List all available workflows with descriptions',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['azure-devops', 'git', 'validation', 'analysis', 'all'],
        default: 'all'
      }
    }
  }
}

// Get workflow status
{
  name: 'get_workflow_status',
  description: 'Get execution status of a running workflow',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: { type: 'string', description: 'Workflow execution ID' }
    },
    required: ['workflow_id']
  }
}
```

**Specific Workflow Tools (Examples):**

```typescript
// Azure DevOps
{
  name: 'create_devops_work_items',
  description: 'Create Azure DevOps work items from epic/feature markdown',
  inputSchema: {
    type: 'object',
    properties: {
      markdown_file: { type: 'string', description: 'Path to epic/feature markdown' },
      project: { type: 'string', description: 'Azure DevOps project name' },
      auto_link_hierarchy: { type: 'boolean', default: true }
    },
    required: ['markdown_file', 'project']
  }
}

// Git Operations
{
  name: 'git_safe_commit',
  description: 'Commit with safety checks (message format, no secrets)',
  inputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string', minLength: 10 },
      files: { type: 'array', items: { type: 'string' } }
    },
    required: ['message']
  }
}

// Validation
{
  name: 'validate_wave_coherence',
  description: 'Validate wave implementation coherence and dependencies',
  inputSchema: {
    type: 'object',
    properties: {
      branch: { type: 'string' }
    },
    required: ['branch']
  }
}

{
  name: 'validate_architecture_conformance',
  description: 'Validate implementation conforms to ADRs and patterns',
  inputSchema: {
    type: 'object',
    properties: {
      scope: { type: 'string', description: 'Feature/wave to validate or "full"' }
    },
    required: ['scope']
  }
}

// Analysis
{
  name: 'calculate_ucp',
  description: 'Calculate Objective UCP from work items',
  inputSchema: {
    type: 'object',
    properties: {
      work_items: { type: 'array' },
      project_type: { type: 'string', enum: ['web-application', 'api-service', 'data-pipeline', 'mobile-app'] }
    },
    required: ['work_items']
  }
}

{
  name: 'analyze_requirements_coverage',
  description: 'Analyze requirements coverage across features/waves',
  inputSchema: {
    type: 'object',
    properties: {
      scope: { type: 'string', description: 'Epic/feature to analyze or "all"' }
    }
  }
}
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

**Goal:** Convert 3 high-value skills to workflows

**Skills to Convert:**
1. `ucp-calculation-planned-work` - Frequently used by other workflows
2. `git-safe-commit` - Simple, demonstrates pattern
3. `azure-devops-work-item-creation` - High user value

**Tasks:**
- [ ] Create workflow YAML files
- [ ] Implement ClaudeAPINode integration
- [ ] Test workflows in Workflow Builder UI
- [ ] Expose as MCP tools
- [ ] Test from Claude Code CLI

**Acceptance Criteria:**
- ✅ 3 workflows execute successfully
- ✅ ClaudeAPINode correctly calls Claude API
- ✅ MCP tools discoverable by Claude Code
- ✅ Streaming progress updates work

### Phase 2: Validation Workflows (Week 2)

**Goal:** Convert validation/analysis skills

**Skills to Convert:**
1. `wave-coherence-validation`
2. `architectural-conformance-validation`
3. `git-repository-setup-validation`
4. `cross-documentation-verification`

**Tasks:**
- [ ] Create workflow YAMLs
- [ ] Implement complex Claude reasoning nodes
- [ ] Handle file reading and git operations
- [ ] Generate comprehensive reports
- [ ] Test validation accuracy

**Acceptance Criteria:**
- ✅ All validation workflows execute
- ✅ Reports generated correctly
- ✅ Claude reasoning accurate
- ✅ Performance acceptable (<30s per validation)

### Phase 3: Azure DevOps & Git Workflows (Week 3)

**Goal:** Complete Azure DevOps and Git tool collections

**Skills to Convert:**
1. `azure-devops-work-item-update`
2. `azure-devops-safe-operations`
3. `git-development-workflow-setup`
4. Git safe operations (remaining)

**Tasks:**
- [ ] Azure DevOps workflows with MCP integration
- [ ] Git workflow setup automation
- [ ] Error handling and retries
- [ ] Auth management
- [ ] Test end-to-end

**Acceptance Criteria:**
- ✅ Can create/update work items from workflows
- ✅ Git setup automation works
- ✅ Safe operations validated
- ✅ Proper error messages

### Phase 4: Analysis & Metrics (Week 4)

**Goal:** Complete remaining analytical workflows

**Skills to Convert:**
1. `requirements-coverage-analysis`
2. `implementation-velocity-tracking`

**Tasks:**
- [ ] Create analysis workflows
- [ ] Implement data collection
- [ ] Generate visualizations
- [ ] Create dashboards
- [ ] Test reporting

**Acceptance Criteria:**
- ✅ All analysis workflows complete
- ✅ Reports generated correctly
- ✅ Metrics accurate
- ✅ Visualizations helpful

### Phase 5: Polish & Documentation (Week 5)

**Goal:** Production ready

**Tasks:**
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] User documentation
- [ ] MCP tool documentation
- [ ] Example use cases

**Acceptance Criteria:**
- ✅ All 15 skills converted or documented
- ✅ MCP tools documented
- ✅ User guide complete
- ✅ Claude can discover and use all tools

---

## User Experience Flow

### Scenario 1: Explicit Workflow Execution

**User Action:** Click "Run" button in Workflow Builder UI

**Flow:**
```
1. User selects "azure-devops-work-item-creation" from workflow list
2. UI prompts for inputs:
   - Epic markdown file: [file picker]
   - Azure DevOps project: [text input]
3. User clicks "Execute"
4. Workflow Builder shows real-time progress:
   ├─ Step 1/5: Parse Epic Markdown ✓ (1.2s)
   ├─ Step 2/5: Calculate UCP ✓ (3.5s)
   ├─ Step 3/5: Create Epic ✓ (2.1s)
   ├─ Step 4/5: Create Features ⏳ (running...)
   └─ ...
5. On completion, shows results panel with:
   - Summary: "Created 1 Epic and 3 Features"
   - Links to Azure DevOps work items
   - Execution logs
```

### Scenario 2: Claude Code Orchestration

**User Action:** Natural language request to Claude

**Flow:**
```
User: "Create Azure DevOps work items from epic-10-rag-knowledge-base.md"

Claude reasoning:
1. Recognizes this as a DevOps work item creation task
2. Discovers MCP tool: create_devops_work_items
3. Calls tool with appropriate inputs

Claude: "I'll create the work items for you."

[MCP call: create_devops_work_items({
  markdown_file: 'epic-10-rag-knowledge-base.md',
  project: 'LighthouseBeacon'
})]

[Receives streaming updates:]
├─ Parsing epic markdown...
├─ Calculating UCP...
├─ Creating Epic in Azure DevOps...
└─ ...

Claude: "✓ Created work items:
- Epic 10: RAG Knowledge Base (#123)
- Feature 10.1: Vector Service (#124)
- Feature 10.2: Knowledge Base UI (#125)
- Feature 10.3: RAG Pipeline (#126)
- Feature 10.4: Chat Integration (#127)

All items linked in proper hierarchy. Objective UCP: 187.5"
```

### Scenario 3: Claude Orchestrates Multiple Workflows

**User Action:** Complex multi-step request

**Flow:**
```
User: "Validate wave coherence, then if valid, create DevOps work items"

Claude reasoning:
1. This requires two steps
2. First: validate_wave_coherence
3. If pass: create_devops_work_items

Claude: "I'll validate the wave first, then create work items if validation passes."

[MCP call: validate_wave_coherence({ branch: 'wave-10.4.1' })]
[Receives result: { assessment: 'pass', report: '...' }]

Claude: "✓ Wave coherence validation passed. Dependencies are in correct order.

Now creating Azure DevOps work items..."

[MCP call: create_devops_work_items({ ... })]

Claude: "✓ Work items created. Ready for implementation."
```

---

## Technical Implementation

### MCP Server Code Structure

```typescript
// src/mcp/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { WorkflowExecutor } from '../services/workflow/WorkflowExecutor';
import { WorkflowRegistry } from '../services/workflow/WorkflowRegistry';

const server = new Server({
  name: 'lighthouse-workflows',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {},
    resources: {}
  }
});

// Initialize workflow system
const workflowRegistry = new WorkflowRegistry();
const workflowExecutor = new WorkflowExecutor();

// Load all workflow YAMLs
await workflowRegistry.loadFromDirectory('./workflows');

// Register generic workflow execution tool
server.setRequestHandler('tools/list', async () => {
  const workflows = workflowRegistry.listAll();

  const tools = [
    // Generic execution
    {
      name: 'execute_workflow',
      description: 'Execute a workflow by name',
      inputSchema: {
        type: 'object',
        properties: {
          workflow_name: { type: 'string' },
          inputs: { type: 'object' },
          streaming: { type: 'boolean', default: true }
        },
        required: ['workflow_name']
      }
    },

    // List workflows
    {
      name: 'list_workflows',
      description: 'List available workflows',
      inputSchema: { type: 'object', properties: {} }
    },

    // Specific workflow tools (auto-generated)
    ...workflows.map(w => ({
      name: w.name.replace(/-/g, '_'),
      description: w.description,
      inputSchema: generateSchemaFromWorkflow(w)
    }))
  ];

  return { tools };
});

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'execute_workflow') {
    return await executeWorkflow(args.workflow_name, args.inputs, args.streaming);
  }

  if (name === 'list_workflows') {
    const workflows = workflowRegistry.listAll();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(workflows.map(w => ({
          name: w.name,
          description: w.description,
          inputs: w.inputs
        })))
      }]
    };
  }

  // Specific workflow call (auto-routed)
  const workflowName = name.replace(/_/g, '-');
  return await executeWorkflow(workflowName, args, true);
});

async function executeWorkflow(name: string, inputs: any, streaming: boolean) {
  const workflow = workflowRegistry.get(name);
  if (!workflow) {
    throw new Error(`Workflow not found: ${name}`);
  }

  // Execute workflow
  const executionId = await workflowExecutor.start(workflow, inputs);

  if (streaming) {
    // Set up streaming
    workflowExecutor.on('step:started', (event) => {
      if (event.executionId === executionId) {
        server.sendProgress({
          progressToken: executionId,
          message: `Step ${event.stepIndex}/${event.totalSteps}: ${event.stepName}`,
          progress: event.stepIndex / event.totalSteps
        });
      }
    });

    workflowExecutor.on('step:completed', (event) => {
      if (event.executionId === executionId) {
        server.sendProgress({
          progressToken: executionId,
          message: `✓ ${event.stepName} (${event.duration}ms)`,
          progress: (event.stepIndex + 1) / event.totalSteps
        });
      }
    });
  }

  // Wait for completion
  const result = await workflowExecutor.waitForCompletion(executionId);

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(result)
    }]
  };
}

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Workflow Storage Structure

```
workflows/
├── azure-devops/
│   ├── create-work-items.yaml
│   ├── update-work-items.yaml
│   └── safe-operations.yaml
├── git/
│   ├── safe-commit.yaml
│   ├── safe-push.yaml
│   ├── safe-merge.yaml
│   └── repository-setup-validation.yaml
├── validation/
│   ├── wave-coherence-full.yaml
│   ├── wave-coherence-dependencies.yaml
│   ├── architectural-conformance.yaml
│   └── cross-documentation.yaml
├── analysis/
│   ├── ucp-calculation.yaml
│   ├── requirements-coverage.yaml
│   └── velocity-tracking.yaml
└── templates/
    └── workflow-template.yaml
```

### Reference Knowledge as MCP Resources

```typescript
// Register skills that remain as reference knowledge
server.setRequestHandler('resources/list', async () => ({
  resources: [
    {
      uri: 'skill://development-best-practices',
      name: 'Development Best Practices',
      description: 'Core development principles and standards',
      mimeType: 'text/markdown'
    },
    {
      uri: 'skill://git-agentic-branching-strategy',
      name: 'Git Agentic Branching Strategy',
      description: 'Git branching workflow guide',
      mimeType: 'text/markdown'
    }
  ]
}));

server.setRequestHandler('resources/read', async (request) => {
  const uri = request.params.uri;

  if (uri === 'skill://development-best-practices') {
    const content = await fs.readFile('.claude/skills/development-best-practices/SKILL.md', 'utf-8');
    return {
      contents: [{
        uri,
        mimeType: 'text/markdown',
        text: content
      }]
    };
  }

  // ... handle other resources
});
```

---

## Next Steps

### Immediate Actions

1. **Review & Approve This Plan**
   - Validate conversion strategy
   - Approve patterns for each skill
   - Confirm MCP tool naming

2. **Prototype First Workflow**
   - Choose: `ucp-calculation` (simple, uses ClaudeAPINode)
   - Create YAML
   - Test in Workflow Builder
   - Expose via MCP
   - Test from Claude Code

3. **Create Workflow Templates**
   - Template for autonomous workflows
   - Template for tool collections
   - Template for hybrid approaches

### Week 1: Foundation

- Convert 3 high-priority skills
- Validate ClaudeAPINode integration
- Test MCP exposure
- Verify streaming updates

### Weeks 2-4: Full Conversion

- Convert remaining 12 workflows
- Comprehensive testing
- Performance optimization
- User documentation

### Week 5: Production

- Final testing
- Documentation complete
- Release with extension v0.9.0

---

## Conclusion

This plan provides a **clear roadmap** for converting 15 Claude Code skills into executable workflows. By using a **hybrid approach**:

- ✅ Some skills become autonomous workflows (complete tasks independently)
- ✅ Some skills become tool collections (Claude orchestrates)
- ✅ All use **ClaudeAPINode** for reasoning within workflows
- ✅ All exposed via **MCP server** for Claude Code discovery
- ✅ All provide **streaming progress updates**
- ✅ All accessible from **Workflow Builder UI**

**Key Benefits:**
- Users get both explicit control (UI) and implicit automation (Claude discovers tools)
- Claude reasoning stays within workflows (auditable, no context switching)
- Flexible: Claude can run full workflows OR compose custom sequences
- Maintainable: Workflows are declarative YAML
- Extensible: Easy to add new workflows

**Recommendation: Proceed with conversion plan.**

---

**Document Status:** Ready for Review
**Next Action:** Prototype first workflow (ucp-calculation)
**Owner:** Development Team
**Last Updated:** January 25, 2026
