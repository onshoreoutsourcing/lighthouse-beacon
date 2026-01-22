# Wave 9.4.2: Loop Nodes

## Wave Overview
- **Wave ID:** Wave-9.4.2
- **Feature:** Feature 9.4 - Advanced Control Flow
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Planning
- **Scope:** Add loop nodes to iterate over collections (arrays, objects, ranges)
- **Wave Goal:** Enable workflows to process multiple items systematically with loop constructs
- **Estimated Hours:** 20 hours

## Wave Goals

1. Create LoopNode component for React Flow canvas
2. Implement LoopExecutor service (iterate over arrays/objects/ranges)
3. Add loop termination safety (max iterations enforced)
4. Provide loop progress visualization during execution
5. Support loop context variables (`${loop.item}`, `${loop.index}`)

## User Stories

### User Story 1: Loop Node UI

**As a** workflow designer
**I want** to add loop nodes to my workflow canvas
**So that** I can process collections of items systematically

**Acceptance Criteria:**
- [ ] LoopNode component displays on canvas with distinct visual style
- [ ] Node configuration panel allows selecting iteration source (e.g., `${workflow.inputs.file_list}`)
- [ ] Max iterations configurable (default: 100, max: 1000)
- [ ] Loop body accepts child steps (nested workflow)
- [ ] Loop context variables documented (`${loop.item}`, `${loop.index}`)
- [ ] Unit test coverage ≥90%

**Priority:** High

**Estimated Hours:** 8 hours

**Objective UCP:** 10 UUCW (Average complexity: 5 transactions - node render, config panel, iteration source selection, nested steps, context variable UI)

---

### User Story 2: Loop Execution Engine

**As a** workflow engine
**I want** to iterate over collections safely with guaranteed termination
**So that** infinite loops cannot hang the system

**Acceptance Criteria:**
- [ ] LoopExecutor iterates over arrays, objects, and number ranges
- [ ] Loop context provides `${loop.item}` (current item) and `${loop.index}` (0-based index)
- [ ] Max iterations enforced (default: 100, configurable per loop)
- [ ] Loop exceeding max iterations fails workflow with clear error
- [ ] Break condition supported (early termination)
- [ ] Performance: Loop overhead <5ms per iteration
- [ ] Unit tests for 15+ loop scenarios (≥90% coverage)

**Priority:** High

**Estimated Hours:** 10 hours

**Objective UCP:** 15 UUCW (Average complexity: 6 transactions - array iteration, object iteration, range iteration, context management, max iterations enforcement, break condition)

---

### User Story 3: Loop Visualization and Progress Tracking

**As a** workflow user
**I want** to see loop progress during execution
**So that** I understand how far along the loop processing is

**Acceptance Criteria:**
- [ ] Loop node shows progress during execution (e.g., "Item 5 of 20")
- [ ] Execution visualization highlights current loop iteration
- [ ] ExecutionHistory records loop iterations for debugging
- [ ] Loop failures show which iteration failed
- [ ] Performance: Progress updates <50ms
- [ ] Unit test coverage ≥90%

**Priority:** Medium

**Estimated Hours:** 2 hours

**Objective UCP:** 5 UUCW (Simple complexity: 2 transactions - progress calculation, progress display)

---

## Definition of Done

- [ ] All 3 user stories completed with acceptance criteria met
- [ ] Code coverage ≥90%
- [ ] Integration tests validate loop execution
- [ ] No TypeScript/linter errors
- [ ] Performance: Loop overhead <5ms per iteration
- [ ] Max iterations enforced (safety verified)
- [ ] Code reviewed and approved
- [ ] Documentation updated (loop node guide, iteration syntax reference)
- [ ] Demo: Workflow with loop processing multiple items

## Notes

**Architecture References:**
- Feature 9.2 WorkflowExecutor for execution integration
- Wave 9.4.1 ConditionEvaluator for break conditions
- Feature 9.4 VariableResolver for loop context variables

**Loop YAML Examples:**

**Array Iteration:**
```yaml
- id: process_files
  type: loop
  iterate_over: ${workflow.inputs.file_list}
  max_iterations: 100
  steps:
    - id: process_file
      type: python
      script: ./scripts/process_file.py
      inputs:
        file_path: ${loop.item}
        index: ${loop.index}
```

**Object Iteration:**
```yaml
- id: process_config
  type: loop
  iterate_over: ${workflow.inputs.config}
  max_iterations: 50
  steps:
    - id: validate_entry
      type: python
      script: ./scripts/validate.py
      inputs:
        key: ${loop.key}
        value: ${loop.value}
```

**Range Iteration:**
```yaml
- id: batch_processing
  type: loop
  iterate_over: range(0, 10)  # 0 to 9
  max_iterations: 10
  steps:
    - id: process_batch
      type: python
      script: ./scripts/batch.py
      inputs:
        batch_number: ${loop.index}
```

**Loop Safety:**
- Max iterations enforced to prevent infinite loops
- Timeout per iteration (30s default)
- Break condition support for early termination

**Visual Design:**
- Loop node: Rounded rectangle with loop icon
- Progress indicator: "Item X of Y" badge
- During execution: Highlight current iteration

---

**Total Stories:** 3
**Total Hours:** 20 hours
**Total Objective UCP:** 30 UUCW
**Wave Status:** Planning
