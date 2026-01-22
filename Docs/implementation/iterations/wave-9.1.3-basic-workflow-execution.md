# Wave 9.1.3: Basic Sequential Workflow Execution

## Wave Overview
- **Wave ID:** Wave-9.1.3
- **Feature:** Feature 9.1 - Workflow Canvas Foundation
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Planning
- **Scope:** Implement sequential workflow execution engine, workflow save/load operations, and IPC handlers
- **Wave Goal:** Enable end-to-end workflow execution: create workflow visually, save to file, load from file, execute with real Python/Claude integration
- **Estimated Hours:** 30 hours

**Wave Philosophy**: This is a scope-based deliverable unit, NOT a time-boxed iteration. Duration is determined by completion of the defined scope, not a fixed calendar period.

## Wave Goals

1. Implement WorkflowExecutor for sequential step execution
2. Integrate PythonExecutor stub (basic execution, full security in Feature 9.2)
3. Integrate AIService for Claude AI nodes
4. Create workflow save/load via FileSystemService
5. Build IPC handlers for workflow operations

## User Stories

### User Story 1: Sequential Workflow Execution Engine

**As a** workflow user
**I want** workflows to execute steps in sequence with data passing between steps
**So that** I can automate multi-step processes

**Acceptance Criteria:**
- [ ] WorkflowExecutor executes steps in dependency order
- [ ] Step outputs accessible to subsequent steps via variable resolution
- [ ] Execution stops on first step failure
- [ ] Execution result includes success/failure, outputs, timing
- [ ] Python scripts receive inputs via stdin (JSON format)
- [ ] Python scripts return outputs via stdout (JSON format)
- [ ] Claude AI nodes use AIService.sendMessage()
- [ ] Execution events logged (workflow start, step start/complete, workflow complete)
- [ ] Unit tests for executor (≥90% coverage)
- [ ] Integration tests validate multi-step workflows
- [ ] Performance: Workflow startup overhead <2s

**Priority:** High

**Estimated Hours:** 14 hours

**Objective UCP:** 15 UUCW (Average complexity: 7 transactions - dependency ordering, step execution, data passing, error handling, Python integration, Claude integration, logging)

---

### User Story 2: Workflow Persistence & File Management

**As a** workflow designer
**I want** workflows automatically saved to and loaded from disk
**So that** my workflows persist across application restarts

**Acceptance Criteria:**
- [ ] Workflows save to `~/Documents/Lighthouse/workflows/` directory
- [ ] Workflow files use `.yaml` extension
- [ ] Save operation validates workflow before writing
- [ ] Save failures show clear error messages
- [ ] Load operation parses and validates YAML
- [ ] Load failures show actionable error messages
- [ ] Path validation prevents directory traversal (ADR-011)
- [ ] WorkflowService manages save/load operations
- [ ] Auto-save every 30 seconds when workflow modified
- [ ] Unit tests for save/load (≥90% coverage)
- [ ] Integration tests validate file operations

**Priority:** High

**Estimated Hours:** 8 hours

**Objective UCP:** 10 UUCW (Average complexity: 5 transactions - save workflow, load workflow, validate path, handle errors, auto-save)

---

### User Story 3: Workflow IPC Integration

**As a** renderer process component
**I want** IPC handlers for workflow operations
**So that** I can trigger workflow operations from the UI

**Acceptance Criteria:**
- [ ] IPC handler: `workflow:load` (loads workflow by ID)
- [ ] IPC handler: `workflow:save` (saves workflow to file)
- [ ] IPC handler: `workflow:execute` (executes workflow with inputs)
- [ ] IPC handler: `workflow:validate` (validates YAML without saving)
- [ ] IPC handler: `workflow:list` (lists all saved workflows)
- [ ] Preload API exposes workflow methods to renderer
- [ ] All handlers validate inputs before processing
- [ ] Execution requires permission prompt (ADR-008)
- [ ] Unit tests for all IPC handlers (≥90% coverage)
- [ ] Integration tests validate IPC communication

**Priority:** High

**Estimated Hours:** 8 hours

**Objective UCP:** 10 UUCW (Average complexity: 6 transactions - 5 IPC handlers, preload API, input validation, permission prompt)

---

## Definition of Done

- [ ] All 3 user stories completed with acceptance criteria met
- [ ] Code coverage ≥90%
- [ ] End-to-end test: Create workflow visually → Save → Load → Execute
- [ ] No TypeScript/linter errors
- [ ] Performance: Workflow execution startup <2s
- [ ] Security scan passed (path validation, no code injection)
- [ ] Code reviewed and approved
- [ ] Documentation updated (IPC API, workflow execution flow)
- [ ] Demo: Complete workflow lifecycle (create, save, load, execute)

## Notes

**Architecture References:**
- ADR-016: Python Script Execution Security Strategy (stub implementation, full security in Feature 9.2)
- ADR-011: Directory Sandboxing Approach (path validation)
- ADR-008: Permission System UX Pattern (execution approval)

**Python Integration (Stub for MVP):**
- Basic `child_process.spawn('python3', [scriptPath])`
- stdin/stdout JSON interface
- No timeout enforcement yet (Feature 9.2)
- No path validation yet (Feature 9.2)
- Basic error handling only

**Security Notes:**
- Python execution stub has minimal security (Feature 9.2 adds full security)
- Path validation for workflow files only (not Python scripts yet)
- Permission prompt shows workflow name and step count
- No sensitive data logged

**Performance Targets:**
- Workflow save: <500ms
- Workflow load: <1s
- Execution startup: <2s
- Step execution: Variable (depends on Python script / Claude response)

---

**Total Stories:** 3
**Total Hours:** 30 hours
**Total Objective UCP:** 35 UUCW
**Wave Status:** Planning
