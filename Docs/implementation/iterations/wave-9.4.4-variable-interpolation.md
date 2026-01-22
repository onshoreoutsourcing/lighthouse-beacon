# Wave 9.4.4: Variable Interpolation

## Wave Overview
- **Wave ID:** Wave-9.4.4
- **Feature:** Feature 9.4 - Advanced Control Flow
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Planning
- **Scope:** Enhance VariableResolver with `${...}` syntax for dynamic variable resolution
- **Wave Goal:** Enable workflows to reference inputs, step outputs, and environment variables dynamically
- **Estimated Hours:** 18 hours

## Wave Goals

1. Enhance VariableResolver from Wave 9.1.2 with `${...}` syntax
2. Support workflow inputs, step outputs, environment variables
3. Add variable validation (undefined variable errors)
4. Provide variable preview UI (show resolved values before execution)
5. Performance: Variable resolution adds <50ms overhead

## User Stories

### User Story 1: Variable Syntax and Resolution

**As a** workflow designer
**I want** to use `${...}` syntax to reference dynamic variables
**So that** I can create flexible workflows that adapt to inputs and step outputs

**Acceptance Criteria:**
- [ ] VariableResolver supports `${workflow.inputs.x}` (workflow inputs)
- [ ] VariableResolver supports `${steps.foo.outputs.y}` (step outputs)
- [ ] VariableResolver supports `${env.API_KEY}` (environment variables)
- [ ] Nested property access supported (e.g., `${steps.foo.outputs.user.email}`)
- [ ] Undefined variables fail with clear error (e.g., "Variable not found: steps.bar")
- [ ] Performance: Resolution <50ms per workflow
- [ ] Unit tests for 20+ variable scenarios (≥90% coverage)

**Priority:** High

**Estimated Hours:** 10 hours

**Objective UCP:** 15 UUCW (Average complexity: 6 transactions - syntax parsing, workflow inputs resolution, step outputs resolution, environment variables resolution, nested access, error handling)

---

### User Story 2: Variable Validation

**As a** workflow engine
**I want** to validate all variables before workflow execution
**So that** users discover variable errors early (not mid-execution)

**Acceptance Criteria:**
- [ ] Pre-execution validation checks all `${...}` references
- [ ] Validates workflow inputs are provided
- [ ] Validates step outputs exist when referenced
- [ ] Validates environment variables exist when referenced
- [ ] Clear error messages show missing variables with context
- [ ] Validation errors block workflow execution
- [ ] Unit test coverage ≥90%

**Priority:** High

**Estimated Hours:** 6 hours

**Objective UCP:** 10 UUCW (Average complexity: 4 transactions - pre-execution validation, input validation, step output validation, environment variable validation)

---

### User Story 3: Variable Preview UI

**As a** workflow designer
**I want** to preview resolved variable values before execution
**So that** I can verify my variables are configured correctly

**Acceptance Criteria:**
- [ ] Variable preview panel shows all variables used in workflow
- [ ] Preview displays resolved values (e.g., `${workflow.inputs.name}` → "John Doe")
- [ ] Missing variables highlighted in red with error message
- [ ] Preview updates when inputs change
- [ ] Unit test coverage ≥90%

**Priority:** Medium

**Estimated Hours:** 2 hours

**Objective UCP:** 5 UUCW (Simple complexity: 2 transactions - variable extraction, value preview)

---

## Definition of Done

- [ ] All 3 user stories completed with acceptance criteria met
- [ ] Code coverage ≥90%
- [ ] Integration tests validate variable resolution
- [ ] No TypeScript/linter errors
- [ ] Performance: Variable resolution <50ms
- [ ] Pre-execution validation functional
- [ ] Code reviewed and approved
- [ ] Documentation updated (variable syntax reference, examples)
- [ ] Demo: Workflow with variables executes correctly

## Notes

**Architecture References:**
- Wave 9.1.2 VariableResolver (this wave extends it)
- Feature 9.2 WorkflowExecutor for execution integration
- ADR-016 for security considerations (no arbitrary code execution)

**Variable Syntax Examples:**

**Workflow Inputs:**
```yaml
inputs:
  user_name: "John Doe"
  api_key: "sk_test_123"

steps:
  - id: greet_user
    type: python
    script: ./greet.py
    inputs:
      name: ${workflow.inputs.user_name}  # → "John Doe"
```

**Step Outputs:**
```yaml
steps:
  - id: fetch_user
    type: python
    script: ./fetch_user.py
    inputs:
      user_id: "123"

  - id: send_email
    type: python
    script: ./send_email.py
    inputs:
      email: ${steps.fetch_user.outputs.user.email}  # Nested access
      name: ${steps.fetch_user.outputs.user.name}
```

**Environment Variables:**
```yaml
steps:
  - id: api_call
    type: python
    script: ./api_call.py
    inputs:
      api_key: ${env.API_KEY}  # Read from environment
      endpoint: ${env.API_ENDPOINT}
```

**Complex Example:**
```yaml
inputs:
  base_url: "https://api.example.com"
  user_id: "123"

steps:
  - id: fetch_user
    type: python
    script: ./fetch.py
    inputs:
      url: ${workflow.inputs.base_url}/users/${workflow.inputs.user_id}
      # → https://api.example.com/users/123

  - id: send_notification
    type: python
    script: ./notify.py
    inputs:
      message: "Hello ${steps.fetch_user.outputs.name}, your score is ${steps.fetch_user.outputs.score}"
      # → "Hello John Doe, your score is 95"
```

**Variable Resolution Order:**
1. Parse `${...}` syntax
2. Identify variable type (workflow.inputs, steps.X.outputs, env.X)
3. Resolve value from appropriate source
4. Handle nested property access (e.g., user.email)
5. Validate value exists (error if undefined)
6. Replace `${...}` with resolved value

**Performance Optimization:**
- Cache resolved variables during execution
- Lazy evaluation (resolve only when needed)
- Batch resolution for multiple variables

---

**Total Stories:** 3
**Total Hours:** 18 hours
**Total Objective UCP:** 30 UUCW
**Wave Status:** Planning
