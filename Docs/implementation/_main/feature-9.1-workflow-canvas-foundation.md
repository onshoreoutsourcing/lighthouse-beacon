# Feature 9.1: Workflow Canvas Foundation

## Feature Overview
- **Feature ID:** Feature-9.1
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Complete
- **Duration:** 3 waves, 3-4 weeks
- **Priority:** High (MVP Foundation)

## Implementation Scope

Feature 9.1 establishes the foundational visual workflow editing infrastructure for Lighthouse Chat IDE. It delivers a React Flow-based canvas where users can drag-and-drop workflow nodes, define workflows in YAML format, and execute basic sequential workflows.

**Objectives:**
- Integrate React Flow as the visual workflow canvas foundation
- Implement custom node components (Python scripts, Claude AI)
- Create YAML workflow parser and validator
- Build basic sequential workflow execution engine
- Enable workflow creation through visual drag-and-drop interface

## Technical Requirements

### Functional Requirements
- **FR-9.1.1**: Visual canvas supports drag-and-drop workflow node placement
- **FR-9.1.2**: Custom node types (Python, Claude AI, Input, Output) render correctly
- **FR-9.1.3**: YAML workflow format validates against schema
- **FR-9.1.4**: Workflows parse from YAML to internal AST representation
- **FR-9.1.5**: Sequential workflow execution (no branching/loops)
- **FR-9.1.6**: Canvas includes minimap, zoom controls, background grid
- **FR-9.1.7**: Workflows save/load to `~/Documents/Lighthouse/workflows/`
- **FR-9.1.8**: Node connections visualize execution order
- **FR-9.1.9**: Basic workflow validation (missing connections, invalid config)

### Non-Functional Requirements
- **Performance:**
  - Canvas render time < 100ms for up to 50 nodes
  - Drag-and-drop latency < 50ms
  - YAML parsing < 200ms for typical workflow (10-20 nodes)
  - Workflow execution latency < 2s (startup overhead)

- **Security:**
  - YAML parser sanitized (no code injection via YAML)
  - Workflow files validated before parsing
  - No sensitive data logged (API keys, credentials)
  - Python scripts subject to path validation (ADR-011)
  - Workflow execution requires permission prompt (ADR-008)

- **Scalability:**
  - Support workflows up to 50 nodes (MVP limit, removed in Phase 2)
  - Canvas handle 1000+ node workflows in Phase 3 (virtualization)

- **Reliability:**
  - Workflow save failures show clear error messages
  - Invalid YAML shows line number and error description
  - Canvas crash recovery (auto-save every 30 seconds)

### Technical Constraints
- React Flow v12+ required (ADR-015)
- YAML format must preserve UI metadata (node positions, zoom level)
- Workflows stored as plain-text YAML (no binary formats)
- Python 3.8+ required on user's system (checked on startup)

## Dependencies

**Prerequisites (must complete before this Feature):**
- ✅ Epic 1: Desktop Foundation (Electron, React, Zustand) - COMPLETE
- ✅ Epic 2: AI Integration (AIService, streaming, multi-provider) - COMPLETE
- ✅ Epic 3: File Operations (FileSystemService) - COMPLETE
- ✅ ADR-015: React Flow for Visual Workflows - COMPLETE
- ✅ ADR-016: Python Script Execution Security Strategy - COMPLETE

**Enables (this Feature enables):**
- Feature 9.2: Workflow Execution Engine (builds on canvas + parser)
- Feature 9.3: Workflow Management (requires canvas for editing)

**External Dependencies:**
- React Flow (@xyflow/react) v12+ (~300KB bundle)
- js-yaml v4.1+ (~20KB bundle)
- Python 3.8+ (user's system)

## Logical Unit Tests

Unit tests validate workflow creation, YAML parsing, and canvas operations through API calls and data verification.

**Test Cases:**

1. **Test Case: Create Workflow Programmatically**
   - Create workflow with 3 nodes (Input → Python → Output)
   - Validate workflow structure
   - Verify nodes have unique IDs
   - Verify edges connect nodes correctly
   - Assert: workflow.steps.length === 3

2. **Test Case: Parse YAML to Workflow AST**
   - Load sample YAML workflow file
   - Parse to internal AST
   - Validate all nodes parsed correctly
   - Validate variable references resolved
   - Assert: AST structure matches expected schema

3. **Test Case: Validate Invalid YAML**
   - Parse YAML with syntax errors
   - Verify parser returns validation errors
   - Check error includes line number
   - Check error message actionable
   - Assert: validationErrors.length > 0

4. **Test Case: Workflow Round-Trip (YAML → AST → YAML)**
   - Load YAML workflow
   - Parse to AST
   - Serialize back to YAML
   - Compare original vs. serialized YAML
   - Assert: semantic equivalence (UI metadata may differ)

5. **Test Case: Execute Simple Sequential Workflow**
   - Create workflow: Input → Python (echo) → Output
   - Execute workflow with mock inputs
   - Verify Python script receives inputs via stdin
   - Verify Python script returns outputs via stdout
   - Assert: executionResult.success === true

6. **Test Case: Canvas Node Drag-and-Drop**
   - Render WorkflowCanvas component
   - Drag Python node from palette
   - Drop on canvas at position (100, 100)
   - Verify node added to useWorkflowStore
   - Assert: nodes.length === 1, nodes[0].position === {x: 100, y: 100}

## Testing Strategy and Acceptance Criteria

### Testing Strategy

- **Unit Tests:**
  - Test WorkflowParser YAML → AST conversion (10+ test cases)
  - Test WorkflowValidator schema validation (5+ test cases)
  - Test WorkflowExecutor sequential execution (8+ test cases)
  - Test useWorkflowStore Zustand store actions (12+ test cases)
  - Mock FileSystemService, AIService dependencies

- **Integration Tests:**
  - Test WorkflowCanvas renders with React Flow
  - Test node drag-and-drop updates store
  - Test workflow save/load via FileSystemService
  - Test workflow execution via IPC (main process)
  - Test Python script execution via PythonExecutor stub (no actual Python yet)

- **End-to-End Tests:**
  - Create workflow from scratch (drag-and-drop 3 nodes)
  - Connect nodes with edges
  - Save workflow to file
  - Load workflow from file
  - Execute workflow (mock Python execution)
  - Verify workflow completes successfully

- **Performance Tests:**
  - Measure canvas render time (up to 50 nodes)
  - Measure drag-and-drop latency
  - Measure YAML parsing time (10-20 node workflows)
  - All metrics must meet NFR targets

### Acceptance Criteria

- [ ] WorkflowCanvas component renders with React Flow
- [ ] Custom node components (PythonScriptNode, ClaudeAPINode) render correctly
- [ ] Drag-and-drop adds nodes to canvas at correct positions
- [ ] Node connections create edges in React Flow
- [ ] YAML workflows parse to internal AST
- [ ] YAML validation shows line numbers and error descriptions
- [ ] Sequential workflows execute (Python scripts receive/return JSON)
- [ ] Workflows save to `~/Documents/Lighthouse/workflows/` as YAML
- [ ] Workflows load from YAML, restore canvas state (node positions, zoom)
- [ ] Canvas includes minimap, zoom controls, background grid
- [ ] All unit tests passing (coverage ≥ 90%)
- [ ] All integration tests passing
- [ ] Performance tests meet NFR targets
- [ ] Security scan passed (no YAML injection vulnerabilities)
- [ ] Documentation updated (architecture, API specs)

## Integration Points

### Integration with Other Features (Epic 9)

- **Feature 9.2: Workflow Execution Engine**
  - Provides: Basic WorkflowExecutor foundation
  - Feature 9.2 extends with Python security, real-time visualization, error handling

- **Feature 9.3: Workflow Management**
  - Provides: Workflow save/load infrastructure
  - Feature 9.3 extends with workflow CRUD, import/export, templates

### Integration with Other Epics

- **Epic 1: Desktop Foundation**
  - Uses: Electron IPC patterns for workflow:execute handlers
  - Uses: React component architecture for WorkflowCanvas
  - Uses: Zustand patterns for useWorkflowStore

- **Epic 2: AI Integration**
  - Uses: AIService.sendMessage() for Claude AI nodes
  - Provides: Workflow context for AI operations

- **Epic 3: File Operations**
  - Uses: FileSystemService.writeFile() to save workflows
  - Uses: FileSystemService.readFile() to load workflows
  - Uses: PathValidator to validate workflow file paths

### External Integrations

- **React Flow (@xyflow/react):**
  - Canvas rendering and interaction
  - Node drag-and-drop API
  - Edge connection management
  - Minimap, controls, background components

- **js-yaml:**
  - YAML parsing (yaml.load())
  - YAML serialization (yaml.dump())
  - Schema validation

- **Python 3.8+ (user's system):**
  - Python script execution (via Node.js child_process.spawn)
  - stdin/stdout JSON interface

## Implementation Phases

### Wave 9.1.1: React Flow Integration & Canvas Setup
- Install React Flow dependency (@xyflow/react)
- Create WorkflowCanvas.tsx component
- Integrate React Flow with Zustand (useWorkflowStore)
- Implement custom node components (PythonScriptNode, ClaudeAPINode, InputNode, OutputNode)
- Add minimap, controls, background
- Test drag-and-drop functionality

**Deliverables:**
- `src/renderer/components/workflow/WorkflowCanvas.tsx`
- `src/renderer/components/workflow/nodes/PythonScriptNode.tsx`
- `src/renderer/components/workflow/nodes/ClaudeAPINode.tsx`
- `src/renderer/components/workflow/nodes/InputNode.tsx`
- `src/renderer/components/workflow/nodes/OutputNode.tsx`
- `src/renderer/stores/workflow.store.ts` (Zustand store)

### Wave 9.1.2: YAML Parser & Workflow Validation
- Define YAML schema (workflow-schema.ts)
- Implement WorkflowParser (YAML → AST)
- Implement WorkflowValidator (schema validation)
- Add variable resolution (${...} syntax)
- Create error reporting (line numbers, actionable messages)
- Unit tests for parser and validator (15+ tests)

**Deliverables:**
- `src/shared/types/workflow-schema.ts`
- `src/main/services/WorkflowParser.ts`
- `src/main/services/WorkflowValidator.ts`
- `src/main/services/VariableResolver.ts`
- Unit tests: `src/main/__tests__/workflow-parser.test.ts`

### Wave 9.1.3: Basic Sequential Workflow Execution
- Implement WorkflowExecutor (sequential execution only)
- Integrate PythonExecutor stub (no actual security yet, Feature 9.2)
- Integrate AIService for Claude nodes
- Add workflow:execute IPC handler
- Create workflow save/load via FileSystemService
- End-to-end test: create, save, load, execute workflow

**Deliverables:**
- `src/main/services/WorkflowExecutor.ts`
- `src/main/services/PythonExecutorStub.ts` (replaced in Feature 9.2)
- `src/main/services/WorkflowService.ts` (save/load operations)
- `src/main/ipc/workflow-handlers.ts` (IPC handlers)
- End-to-end tests: `src/__tests__/workflow-e2e.test.ts`

## Architecture and Design

### Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Renderer Process (React)                                │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ WorkflowCanvas.tsx (React Flow)                  │   │
│  │  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │ PythonNode   │  │ ClaudeNode   │  ...        │   │
│  │  └──────────────┘  └──────────────┘             │   │
│  │                                                  │   │
│  │  Components: MiniMap, Controls, Background      │   │
│  └──────────────────────────────────────────────────┘   │
│                      ↕ (uses)                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │ useWorkflowStore (Zustand)                       │   │
│  │  - nodes: Node[]                                 │   │
│  │  - edges: Edge[]                                 │   │
│  │  - activeWorkflow: Workflow | null               │   │
│  │  - loadWorkflow(id)                              │   │
│  │  - saveWorkflow(workflow)                        │   │
│  │  - executeWorkflow(inputs)                       │   │
│  └──────────────────────────────────────────────────┘   │
│                      ↕ (IPC)                             │
└─────────────────────────────────────────────────────────┘
                       ↕
┌─────────────────────────────────────────────────────────┐
│ Main Process (Node.js)                                  │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ WorkflowService                                  │   │
│  │  - loadWorkflow(id): Workflow                    │   │
│  │  - saveWorkflow(workflow): void                  │   │
│  │  - executeWorkflow(id, inputs): WorkflowResult   │   │
│  │  - validateWorkflow(yaml): ValidationResult      │   │
│  └──────────────────────────────────────────────────┘   │
│           ↕                    ↕                         │
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │ WorkflowParser  │  │ WorkflowExecutor            │   │
│  │  - parse(yaml)  │  │  - execute(workflow, inputs)│   │
│  │  - serialize()  │  │  - executeStep(step)        │   │
│  └─────────────────┘  └─────────────────────────────┘   │
│           ↕                    ↕                         │
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │ WorkflowValidator│  │ PythonExecutorStub (→9.2)   │   │
│  │  - validate()   │  │  - executeScript()          │   │
│  └─────────────────┘  └─────────────────────────────┘   │
│                              ↕                           │
│                       ┌─────────────────┐                │
│                       │ AIService       │                │
│                       │  - sendMessage()│                │
│                       └─────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

### Data Model

**Workflow Definition (YAML → TypeScript Types):**

```typescript
// src/shared/types/workflow.types.ts

export interface Workflow {
  id: string;
  name: string;
  version: string;
  description?: string;
  tags?: string[];
  inputs: WorkflowInput[];
  steps: WorkflowStep[];
  ui_metadata?: UIMetadata;
}

export interface WorkflowInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file';
  required: boolean;
  default?: any;
  description?: string;
}

export interface WorkflowStep {
  id: string;
  type: 'python' | 'claude' | 'file_operation' | 'input' | 'output';
  label?: string;
  inputs: Record<string, any>;
  outputs: string[];
  depends_on?: string[]; // Step IDs this step depends on
}

export interface PythonStep extends WorkflowStep {
  type: 'python';
  script: string; // Path to Python script
  timeout?: number; // Milliseconds
}

export interface ClaudeStep extends WorkflowStep {
  type: 'claude';
  model: string;
  prompt_template: string;
  system_prompt?: string;
}

export interface UIMetadata {
  canvas: {
    zoom: number;
    offset: { x: number; y: number };
  };
  nodes: NodeMetadata[];
}

export interface NodeMetadata {
  id: string;
  position: { x: number; y: number };
  color?: string;
  icon?: string;
}

export interface WorkflowResult {
  success: boolean;
  outputs: Record<string, any>;
  execution_time_ms: number;
  steps_executed: StepResult[];
  error?: string;
}

export interface StepResult {
  step_id: string;
  success: boolean;
  outputs: Record<string, any>;
  execution_time_ms: number;
  error?: string;
}
```

**YAML Example:**

```yaml
workflow:
  id: "doc-generator-v1"
  name: "Documentation Generator"
  version: "1.0"
  description: "Generate documentation from code repository"
  tags: ["documentation", "automation"]

  inputs:
    - name: repo_url
      type: string
      required: true
      description: "GitHub repository URL"
    - name: output_path
      type: file
      required: true
      description: "Path to save generated documentation"

  steps:
    - id: fetch_repo
      type: python
      label: "Fetch Repository Info"
      script: ./scripts/fetch_repo_info.py
      inputs:
        repo_url: ${workflow.inputs.repo_url}
      outputs:
        - repo_data
        - commit_count

    - id: generate_docs
      type: claude
      label: "Generate Documentation"
      model: claude-sonnet-4-5-20250929
      prompt_template: |
        Generate comprehensive documentation for this repository.

        <repo_data>${steps.fetch_repo.outputs.repo_data}</repo_data>
      outputs:
        - documentation

    - id: save_docs
      type: file_operation
      label: "Save Documentation"
      operation: write
      inputs:
        file_path: ${workflow.inputs.output_path}
        content: ${steps.generate_docs.outputs.documentation}
      outputs:
        - saved_path

  ui_metadata:
    canvas:
      zoom: 1.0
      offset: { x: 0, y: 0 }
    nodes:
      - id: fetch_repo
        position: { x: 100, y: 100 }
        color: "#3b82f6"
        icon: "download"
      - id: generate_docs
        position: { x: 400, y: 100 }
        color: "#10b981"
        icon: "sparkles"
      - id: save_docs
        position: { x: 700, y: 100 }
        color: "#8b5cf6"
        icon: "save"
```

### API Design

**IPC Handlers (Main ↔ Renderer Communication):**

```typescript
// src/main/ipc/workflow-handlers.ts

ipcMain.handle('workflow:load', async (event, workflowId: string) => {
  return await workflowService.loadWorkflow(workflowId);
});

ipcMain.handle('workflow:save', async (event, workflow: Workflow) => {
  return await workflowService.saveWorkflow(workflow);
});

ipcMain.handle('workflow:execute', async (event, workflowId: string, inputs: WorkflowInputs) => {
  return await workflowService.executeWorkflow(workflowId, inputs);
});

ipcMain.handle('workflow:validate', async (event, yamlContent: string) => {
  return await workflowService.validateWorkflow(yamlContent);
});

ipcMain.handle('workflow:list', async () => {
  return await workflowService.listWorkflows();
});
```

**Preload API:**

```typescript
// src/preload/index.ts

contextBridge.exposeInMainWorld('electronAPI', {
  workflow: {
    load: (workflowId: string) => ipcRenderer.invoke('workflow:load', workflowId),
    save: (workflow: Workflow) => ipcRenderer.invoke('workflow:save', workflow),
    execute: (workflowId: string, inputs: WorkflowInputs) =>
      ipcRenderer.invoke('workflow:execute', workflowId, inputs),
    validate: (yamlContent: string) => ipcRenderer.invoke('workflow:validate', yamlContent),
    list: () => ipcRenderer.invoke('workflow:list'),
  },
});
```

**Renderer Usage:**

```typescript
// src/renderer/components/workflow/WorkflowCanvas.tsx

const workflow = await window.electronAPI.workflow.load('doc-generator-v1');
const result = await window.electronAPI.workflow.execute('doc-generator-v1', {
  repo_url: 'https://github.com/user/repo',
  output_path: './docs/README.md',
});
```

## Security Considerations

- **YAML Injection Prevention:**
  - Use js-yaml safe mode (yaml.load() with schema validation)
  - Sanitize all user inputs before YAML serialization
  - No arbitrary code execution via YAML (no !!python/object tags)

- **Path Validation:**
  - All workflow file paths validated via PathValidator (ADR-011)
  - Python script paths must be within project directory
  - Workflow save/load paths must be within `~/Documents/Lighthouse/workflows/`

- **Permission Prompts:**
  - Workflow execution requires user approval (ADR-008)
  - Batch permission for entire workflow (not per-step)
  - Permission modal shows workflow name, step count, script paths

- **Data Sanitization:**
  - No sensitive data logged (API keys, credentials)
  - Workflow execution logs sanitized (redact secrets)
  - Python script inputs/outputs validated (no code injection)

- **IPC Security:**
  - All IPC handlers validate inputs
  - No untrusted data passed to main process
  - Electron contextIsolation enabled

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| React Flow performance poor on older hardware | Medium | Low | Use built-in virtualization, lazy load nodes, test on older machines |
| YAML parsing errors confuse users | Medium | Medium | Clear error messages with line numbers, syntax highlighting in Monaco |
| Python scripts fail due to missing dependencies | High | Medium | Check Python availability on startup, show installation guide |
| Workflow save failures lose user work | High | Low | Auto-save every 30 seconds, show save status indicator |
| Canvas crashes lose workflow state | Medium | Low | Crash recovery with auto-save, localStorage backup |

## Definition of Done

- [ ] WorkflowCanvas component implemented with React Flow
- [ ] Custom node components (Python, Claude, Input, Output) render correctly
- [ ] YAML parser converts workflows to AST
- [ ] YAML validator shows line numbers and error descriptions
- [ ] Sequential workflow execution works (Python stubs, Claude AI)
- [ ] Workflows save/load to `~/Documents/Lighthouse/workflows/`
- [ ] Canvas includes minimap, zoom, background
- [ ] Unit tests written and passing (coverage ≥ 90%)
- [ ] Integration tests written and passing
- [ ] End-to-end test: create, save, load, execute workflow
- [ ] Performance tests meet NFR targets
- [ ] Code reviewed and approved
- [ ] Security scan passed (no YAML injection vulnerabilities)
- [ ] Documentation updated (architecture diagrams, API specs)
- [ ] Feature deployed to staging environment
- [ ] User acceptance testing completed

## Related Documentation

- Epic Plan: Docs/implementation/_main/epic-9-workflow-generator-master-plan.md
- Product Requirements: Docs/architecture/_main/03-Business-Requirements.md
- Architecture: Docs/architecture/_main/04-Architecture.md
- User Experience: Docs/architecture/_main/05-User-Experience.md

## Architecture Decision Records (ADRs)

- [ADR-015: React Flow for Visual Workflows](../../architecture/decisions/ADR-015-react-flow-for-visual-workflows.md)
- [ADR-016: Python Script Execution Security Strategy](../../architecture/decisions/ADR-016-python-script-execution-security.md)
- [ADR-017: Workflow YAML Schema Design](../../architecture/decisions/ADR-017-workflow-yaml-schema-design.md)
- [ADR-011: Directory Sandboxing Approach](../../architecture/decisions/ADR-011-directory-sandboxing-approach.md)
- [ADR-008: Permission System UX Pattern](../../architecture/decisions/ADR-008-permission-system-ux-pattern.md)

---

**Feature Plan Version:** 1.0
**Last Updated:** January 21, 2026
**Status:** Ready for Wave Planning
