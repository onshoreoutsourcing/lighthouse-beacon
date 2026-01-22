# Wave 9.5.2: AI-Assisted Workflow Generation

## Wave Overview
- **Wave ID:** Wave-9.5.2
- **Feature:** Feature 9.5 - UX Polish & Templates
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Planning
- **Scope:** Add AI-assisted workflow generation using Claude to create workflows from natural language descriptions
- **Wave Goal:** Enable users to generate workflows by describing what they want in plain English
- **Estimated Hours:** 20 hours

## Wave Goals

1. Create AIWorkflowGenerator component for natural language input
2. Implement Claude integration for workflow generation
3. Parse and validate Claude's YAML output
4. Handle generation errors gracefully
5. Achieve 80%+ success rate for valid workflow generation

## User Stories

### User Story 1: AI Workflow Generation UI

**As a** workflow user
**I want** to describe my workflow in plain English
**So that** Claude can generate the workflow for me automatically

**Acceptance Criteria:**
- [ ] AIWorkflowGenerator component displays text input area
- [ ] Input area accepts multi-line natural language descriptions
- [ ] "Generate Workflow" button triggers Claude API call
- [ ] Loading indicator shows while Claude generates workflow
- [ ] Generated workflow preview shown before saving
- [ ] Option to regenerate if result unsatisfactory
- [ ] Unit test coverage ≥90%

**Priority:** High

**Estimated Hours:** 6 hours

**Objective UCP:** 10 UUCW (Average complexity: 4 transactions - input UI, API trigger, loading state, preview display)

---

### User Story 2: Claude-Powered Workflow Generation

**As a** workflow generator service
**I want** to convert natural language descriptions into valid YAML workflows
**So that** users can create complex workflows without manual YAML editing

**Acceptance Criteria:**
- [ ] AIWorkflowGenerator service integrates with AIService (Claude API)
- [ ] Prompt engineering optimized for workflow generation (include examples, schema)
- [ ] Claude generates valid YAML following Lighthouse workflow schema
- [ ] Generated workflows include: steps, inputs, UI metadata (node positions)
- [ ] Success rate ≥80% for common use cases (documentation, testing, deployment)
- [ ] Performance: Generation completes in <10 seconds
- [ ] Unit tests for prompt construction (≥90% coverage)
- [ ] Integration tests validate end-to-end generation

**Priority:** High

**Estimated Hours:** 12 hours

**Objective UCP:** 15 UUCW (Average complexity: 7 transactions - Claude API integration, prompt construction, YAML parsing, schema validation, success rate measurement, performance optimization, error handling)

---

### User Story 3: Generation Error Handling

**As a** workflow user
**I want** clear feedback when AI generation fails
**So that** I understand what went wrong and can try again

**Acceptance Criteria:**
- [ ] YAML parsing errors show line number and error message
- [ ] Schema validation errors highlight invalid fields
- [ ] Claude API errors handled gracefully (rate limits, timeout)
- [ ] "Try Again" button allows regeneration with same input
- [ ] "Edit Manually" option allows fixing generated YAML
- [ ] Error messages actionable (e.g., "Add missing 'inputs' field")
- [ ] Unit test coverage ≥90%

**Priority:** Medium

**Estimated Hours:** 2 hours

**Objective UCP:** 5 UUCW (Simple complexity: 3 transactions - error parsing, error display, retry logic)

---

## Definition of Done

- [ ] All 3 user stories completed with acceptance criteria met
- [ ] Code coverage ≥90%
- [ ] Integration tests validate AI generation
- [ ] No TypeScript/linter errors
- [ ] Success rate ≥80% for common use cases
- [ ] Performance: Generation <10 seconds
- [ ] Code reviewed and approved
- [ ] Documentation updated (AI generation guide, prompt engineering notes)
- [ ] Demo: Generate workflow from description successfully

## Notes

**Architecture References:**
- Feature 2.1 AIService for Claude API integration
- Feature 9.1 YAML parser for validation
- Wave 9.1.2 VariableResolver for variable validation

**Claude Prompt for Workflow Generation:**

```
You are a workflow generation assistant for Lighthouse Chat IDE. Generate a YAML workflow definition based on the user's description.

USER DESCRIPTION:
{userDescription}

CONTEXT:
- Project Type: {projectType}
- Programming Language: {language}

WORKFLOW SCHEMA:
A valid workflow must include:
1. name: string (workflow name)
2. description: string (workflow purpose)
3. inputs: object (workflow input parameters)
4. steps: array (ordered list of workflow steps)
5. ui_metadata: object (node positions for canvas)

AVAILABLE NODE TYPES:
- python: Execute Python script (requires script path)
- claude: Call Claude API with prompt
- file_operation: Read/write files (requires operation: read/write)
- conditional: Branch based on condition (if/else)
- loop: Iterate over collection

STEP FORMAT:
- id: unique_step_id
  type: [python|claude|file_operation|conditional|loop]
  inputs: (optional) inputs for this step
  script: (for python) path to script (./scripts/...)
  prompt: (for claude) prompt template with variables

VARIABLE SYNTAX:
- Workflow inputs: ${workflow.inputs.parameter_name}
- Step outputs: ${steps.step_id.outputs.field_name}
- Environment variables: ${env.VARIABLE_NAME}

REQUIREMENTS:
1. Generate valid YAML following schema above
2. Use realistic script paths (./scripts/descriptive_name.py)
3. Include descriptive labels for each node
4. Add UI metadata (position nodes in readable layout, x: 100*index, y: 100)
5. Provide brief reasoning for your design choices at the end

EXAMPLE OUTPUT:
```yaml
name: Documentation Generator
description: Analyzes codebase and generates documentation
inputs:
  repository_path:
    type: string
    required: true
steps:
  - id: analyze_code
    type: python
    script: ./scripts/analyze_codebase.py
    inputs:
      repo_path: ${workflow.inputs.repository_path}
  - id: generate_docs
    type: claude
    prompt: |
      Generate documentation for this codebase:
      ${steps.analyze_code.outputs.structure}
  - id: save_docs
    type: file_operation
    operation: write
    inputs:
      path: ./docs/README.md
      content: ${steps.generate_docs.outputs.documentation}
ui_metadata:
  nodes:
    - id: analyze_code
      position: { x: 100, y: 100 }
    - id: generate_docs
      position: { x: 200, y: 100 }
    - id: save_docs
      position: { x: 300, y: 100 }
```

REASONING:
This workflow analyzes a codebase using Python, generates documentation with Claude, and saves the result. It follows a simple linear flow.

---

Now generate a valid YAML workflow for the user's description. Start with "name:" and output only YAML (no markdown code blocks).
```

**Example Interactions:**

**Input 1:**
```
"Create a workflow that reviews a pull request, identifies issues, and posts comments."
```

**Claude Output:**
```yaml
name: Pull Request Code Review
description: Automatically reviews pull requests and posts feedback
inputs:
  pr_number:
    type: string
    required: true
  github_token:
    type: string
    required: true
steps:
  - id: fetch_pr_diff
    type: python
    script: ./scripts/fetch_pr_diff.py
    inputs:
      pr_number: ${workflow.inputs.pr_number}
      token: ${workflow.inputs.github_token}
  - id: review_code
    type: claude
    prompt: |
      Review this pull request diff and identify issues:
      ${steps.fetch_pr_diff.outputs.diff}

      Focus on:
      - Code quality
      - Security vulnerabilities
      - Best practices
      - Performance issues
  - id: post_comments
    type: python
    script: ./scripts/post_pr_comments.py
    inputs:
      pr_number: ${workflow.inputs.pr_number}
      token: ${workflow.inputs.github_token}
      comments: ${steps.review_code.outputs.feedback}
ui_metadata:
  nodes:
    - id: fetch_pr_diff
      position: { x: 100, y: 100 }
    - id: review_code
      position: { x: 200, y: 100 }
    - id: post_comments
      position: { x: 300, y: 100 }
```

**Input 2:**
```
"Build a workflow that processes CSV files: validate data, transform records, and output JSON."
```

**Claude Output:**
```yaml
name: CSV to JSON Processor
description: Validates CSV data, transforms records, outputs JSON
inputs:
  input_csv_path:
    type: string
    required: true
  output_json_path:
    type: string
    required: true
steps:
  - id: validate_csv
    type: python
    script: ./scripts/validate_csv.py
    inputs:
      csv_path: ${workflow.inputs.input_csv_path}
  - id: check_validation
    type: conditional
    condition: ${steps.validate_csv.outputs.valid == true}
    on_false:
      - id: report_errors
        type: python
        script: ./scripts/report_validation_errors.py
        inputs:
          errors: ${steps.validate_csv.outputs.errors}
  - id: transform_records
    type: loop
    iterate_over: ${steps.validate_csv.outputs.records}
    steps:
      - id: transform_single
        type: python
        script: ./scripts/transform_record.py
        inputs:
          record: ${loop.item}
  - id: save_json
    type: file_operation
    operation: write
    inputs:
      path: ${workflow.inputs.output_json_path}
      content: ${steps.transform_records.outputs.json}
ui_metadata:
  nodes:
    - id: validate_csv
      position: { x: 100, y: 100 }
    - id: check_validation
      position: { x: 200, y: 100 }
    - id: transform_records
      position: { x: 300, y: 100 }
    - id: save_json
      position: { x: 400, y: 100 }
```

**Validation After Generation:**

1. Parse YAML (check syntax)
2. Validate schema (required fields present)
3. Validate step types (only allowed types used)
4. Validate variable references (${...} syntax correct)
5. Validate script paths (relative, safe)
6. Validate UI metadata (node positions valid)

**Error Handling:**

| Error Type | User Message | Recovery |
|------------|-------------|----------|
| YAML Parse Error | "Invalid YAML syntax on line X: ..." | Show error, allow manual edit |
| Missing Required Field | "Missing required field: 'inputs'" | Show error, allow regeneration |
| Invalid Step Type | "Unknown step type: 'bash'" | Show error, suggest valid types |
| Invalid Variable | "Variable not found: ${steps.foo}" | Show error, list available variables |
| Claude API Error | "Generation failed: Rate limit exceeded. Try again in X seconds." | Show retry countdown |

---

**Total Stories:** 3
**Total Hours:** 20 hours
**Total Objective UCP:** 30 UUCW
**Wave Status:** Planning
