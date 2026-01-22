# Wave 9.1.2: YAML Parser & Workflow Validation

## Wave Overview
- **Wave ID:** Wave-9.1.2
- **Feature:** Feature 9.1 - Workflow Canvas Foundation
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Planning
- **Scope:** Implement YAML workflow parser, schema validator, and variable resolution engine
- **Wave Goal:** Enable workflows to be defined in YAML format (GitHub Actions pattern) with comprehensive validation and variable interpolation
- **Estimated Hours:** 24 hours

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Define TypeScript workflow schema matching YAML structure
2. Implement YAML-to-AST parser using js-yaml
3. Create semantic workflow validator with actionable error messages
4. Build variable resolution engine for `${...}` syntax
5. Ensure YAML round-trip fidelity (YAML → AST → YAML)

## User Stories

### User Story 1: YAML Workflow Schema & Parser

**As a** workflow designer
**I want** to define workflows in YAML format following GitHub Actions conventions
**So that** I can leverage familiar syntax and human-readable workflow definitions

**Acceptance Criteria:**
- [ ] TypeScript interfaces defined for Workflow, WorkflowStep, WorkflowInput
- [ ] YAML parser converts workflow files to internal AST
- [ ] Parser handles all step types (python, claude, file_operation, input, output)
- [ ] Parser preserves UI metadata (node positions, zoom level)
- [ ] YAML serializer converts AST back to YAML
- [ ] Round-trip conversion maintains semantic equivalence
- [ ] Unit tests for parser (≥90% coverage)
- [ ] Integration tests validate against sample workflows
- [ ] Performance: Parse 10-20 node workflow <200ms

**Priority:** High

**Estimated Hours:** 10 hours

**Objective UCP:** 10 UUCW (Average complexity: 5 transactions - schema definition, YAML load, AST transform, YAML serialize, round-trip validation)

---

### User Story 2: Workflow Semantic Validation

**As a** workflow designer
**I want** clear validation errors with line numbers when my workflow is invalid
**So that** I can quickly identify and fix issues in my workflow definitions

**Acceptance Criteria:**
- [ ] Validator checks step ID uniqueness
- [ ] Validator verifies `depends_on` references valid step IDs
- [ ] Validator ensures no circular dependencies
- [ ] Validator checks required fields present (id, type, inputs)
- [ ] Validation errors include line numbers and column positions
- [ ] Validation errors provide actionable fix suggestions
- [ ] JSON Schema validation for structure
- [ ] Custom semantic validation for workflow logic
- [ ] Unit tests for all validation rules (≥90% coverage)
- [ ] Integration tests validate against known good/bad workflows

**Priority:** High

**Estimated Hours:** 8 hours

**Objective UCP:** 10 UUCW (Average complexity: 6 transactions - ID validation, dependency validation, circular detection, required fields, error formatting, schema validation)

---

### User Story 3: Variable Resolution Engine

**As a** workflow designer
**I want** variable interpolation using `${workflow.inputs.x}` and `${steps.foo.outputs.y}` syntax
**So that** I can pass data between workflow steps dynamically

**Acceptance Criteria:**
- [ ] Variable resolver supports `${workflow.inputs.name}` syntax
- [ ] Variable resolver supports `${steps.stepId.outputs.name}` syntax
- [ ] Resolver validates referenced variables exist
- [ ] Resolver detects undefined variable references
- [ ] Resolver handles nested variable references
- [ ] Variable resolution errors show exact location in YAML
- [ ] Unit tests for all variable patterns (≥90% coverage)
- [ ] Integration tests validate complex variable chains

**Priority:** High

**Estimated Hours:** 6 hours

**Objective UCP:** 5 UUCW (Simple complexity: 3 transactions - workflow.inputs resolution, steps.outputs resolution, validation)

---

## Definition of Done

- [ ] All 3 user stories completed with acceptance criteria met
- [ ] Code coverage ≥90%
- [ ] Integration tests validate YAML → AST → YAML round-trip
- [ ] No TypeScript/linter errors
- [ ] Performance: YAML parsing <200ms for typical workflows
- [ ] Security scan passed (no YAML injection vulnerabilities)
- [ ] Code reviewed and approved
- [ ] Documentation updated (YAML schema reference, variable syntax guide)
- [ ] Demo: Load complex workflow YAML, validate, show errors

## Notes

**Architecture References:**
- ADR-017: Workflow YAML Schema Design
- ADR-011: Directory Sandboxing Approach (path validation)

**External Dependencies:**
- js-yaml v4.1+ (~20KB bundle) - YAML parsing and serialization
- JSON Schema library for structural validation

**YAML Security:**
- Use js-yaml safe mode (no arbitrary code execution)
- Sanitize all variable references
- Validate file paths against allowed directories
- No `!!python/object` or similar dangerous tags

**Variable Interpolation Patterns:**
```yaml
${workflow.inputs.repo_path}           # Workflow input
${steps.analyze_repo.outputs.structure} # Step output
${loop.item}                            # Loop iteration (Phase 2)
${loop.index}                           # Loop index (Phase 2)
```

---

**Total Stories:** 3
**Total Hours:** 24 hours
**Total Objective UCP:** 25 UUCW
**Wave Status:** Planning
