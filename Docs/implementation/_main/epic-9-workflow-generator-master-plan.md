# Epic 9: Visual Workflow Generator - Master Implementation Plan

**Version:** 1.0
**Date:** January 21, 2026
**Status:** Master Plan - Feature Design Ready
**Project:** Lighthouse Chat IDE (Beacon)
**Epic Owner:** System Architect
**Target Release:** Phase 6

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Strategic Context](#strategic-context)
3. [Feature Breakdown](#feature-breakdown)
4. [Architecture Integration](#architecture-integration)
5. [Technology Stack](#technology-stack)
6. [Implementation Phases](#implementation-phases)
7. [Dependencies and Prerequisites](#dependencies-and-prerequisites)
8. [Success Criteria](#success-criteria)
9. [Risk Management](#risk-management)

---

## Executive Summary

### What We're Building

**Visual Workflow Generator** integrates into Lighthouse Chat IDE, enabling developers to create AI-powered automation workflows through a visual node-based editor. Workflows combine Python scripts, Claude AI operations, and existing file operations into repeatable automation sequences.

**Core Value Proposition:**
- **Visual First**: Drag-and-drop workflow canvas with real-time execution visualization
- **AI-Powered**: Claude AI nodes for intelligent text processing and code generation
- **Developer-Friendly**: Python scripts with stdin/stdout JSON interface
- **Enterprise-Ready**: SOC logging, permission system, workflow versioning

### Strategic Value

This epic positions Lighthouse as:
1. **Workflow Automation Platform** - Beyond chat IDE to enterprise automation
2. **Multi-Provider AI Leader** - Validates AI provider abstraction at scale
3. **Enterprise Governance Standard** - SOC logging, compliance scanning, audit trails
4. **Market Expansion** - Addressable market grows from code editing to automation

### Industry Validation

Research into n8n ($2.5B valuation), React Flow, Langflow/Flowise, GitHub Actions, and Kestra validates:
- ✅ Visual workflow editors proven (n8n success with 400+ integrations)
- ✅ React Flow industry standard for node-based UIs (10K+ stars)
- ✅ YAML workflow definitions best practice (GitHub Actions pattern)
- ✅ Python stdin/stdout JSON validated interface (Kestra architecture)
- ✅ Workflow automation market massive and growing

### Architectural Fit

Workflows integrate seamlessly with existing Lighthouse architecture:
- **Left Panel**: File Explorer + Workflow Explorer (new)
- **Center Panel**: AI Chat + Workflow Canvas (new, tabbed)
- **Right Panel**: Monaco Editor (opens YAML + Python scripts)
- **Main Process**: WorkflowService integrates with FileSystemService, AIService
- **Renderer**: WorkflowStore (Zustand), WorkflowCanvas (React Flow)

**No architecture changes needed** - workflows leverage existing patterns established in ADR-001 through ADR-016.

---

## Strategic Context

### Project Context

#### Product Vision Alignment

From PRODUCT-SUMMARY.md:
> Lighthouse Chat IDE enables natural language interaction with codebases through conversational file operations. Users describe what they want, and the AI performs operations using specialized tools.

Workflow Generator extends this vision:
- **From**: Single-shot conversational operations ("read this file", "edit that function")
- **To**: Multi-step automated workflows ("analyze repo, generate docs, create PRs")

#### Business Requirements

From 03-Business-Requirements.md:
- **FR-1**: Multi-turn conversational AI with file operations ✅ (Epics 1-3 complete)
- **FR-9**: Developer workflow automation ⬅️ **THIS EPIC**
- **NFR-1**: Real-time streaming responses ✅ (Applied to workflow execution)
- **NFR-3**: Security sandboxing ✅ (Applied to Python script execution)

#### Architecture Alignment

From 04-Architecture.md:
- **Service-Oriented Architecture**: WorkflowService follows established pattern
- **Component-Based UI**: WorkflowCanvas React component follows patterns
- **Zustand State Management**: useWorkflowStore follows existing stores
- **IPC Bridge Pattern**: workflow:execute handlers follow IPC conventions
- **SOLID Principles**: Dependency injection, interface-based programming throughout

#### User Experience Alignment

From 05-User-Experience.md:
- **Visual First, Conversational Always**: Workflow canvas provides visual context
- **AI Transparency**: Each node shows AI operations clearly
- **Human-AI Collaboration**: Users design workflows, AI executes steps
- **Familiar IDE Patterns**: Three-panel layout, VS Code conventions maintained
- **Progressive Disclosure**: Basic workflows simple, advanced features accessible

### Competitive Positioning

**Lighthouse vs. Competitors:**

| Feature | n8n | Langflow | Flowise | Kestra | **Lighthouse** |
|---------|-----|----------|---------|--------|----------------|
| Visual Editor | ✅ Excellent | ✅ Good | ✅ Good | ❌ None | ✅ **React Flow** |
| AI Integration | ⚠️ Limited | ✅ LangChain | ✅ LangChain | ❌ None | ✅ **Multi-Provider** |
| Code Editor | ❌ None | ⚠️ Basic | ⚠️ Basic | ❌ None | ✅ **Monaco (VS Code)** |
| File Operations | ⚠️ Plugins | ❌ None | ❌ None | ⚠️ Limited | ✅ **Native Tools** |
| Conversational UI | ❌ None | ❌ None | ❌ None | ❌ None | ✅ **Claude Chat** |
| Desktop App | ⚠️ Self-hosted | ❌ Web | ❌ Web | ❌ Server | ✅ **Electron** |
| SOC Logging | ❌ None | ❌ None | ❌ None | ⚠️ Basic | ✅ **Built-in** |

**Unique Value:** Only workflow tool with integrated AI chat, professional code editor, native file operations, and SOC traceability.

---

## Feature Breakdown

This Epic consists of **5 Features** organized into **3 Phases** (MVP → Advanced → Polish):

### Feature 9.1: Workflow Canvas Foundation
**Phase:** 1 - MVP
**Duration:** 3-4 weeks
**Waves:** 3 waves (1.1-1.3)

**Scope:**
- React Flow integration and custom node components
- Workflow YAML parser and validator
- Basic workflow execution engine (sequential steps only)

**Deliverables:**
- `WorkflowCanvas.tsx` - Visual workflow editor
- `PythonScriptNode.tsx`, `ClaudeAPINode.tsx` - Custom node types
- `workflow-schema.ts` - YAML validation schema
- `WorkflowParser.ts` - YAML → workflow AST
- `WorkflowExecutor.ts` - Basic sequential execution

**Dependencies:**
- ADR-015: React Flow for Visual Workflows ✅
- ADR-016: Python Script Execution Security Strategy ✅
- Existing FileSystemService, AIService from Epics 2-3 ✅

**Success Criteria:**
- Users can create workflows with 3+ nodes visually
- YAML format validates correctly
- Sequential workflows execute end-to-end
- Python scripts receive JSON via stdin, return JSON via stdout
- Claude AI nodes send prompts, receive responses

---

### Feature 9.2: Workflow Execution Engine
**Phase:** 1 - MVP
**Duration:** 3-4 weeks
**Waves:** 3 waves (1.4-1.6)

**Scope:**
- Real-time execution visualization
- Python script security (path validation, timeouts, process isolation)
- Error handling and retry logic
- Workflow execution history

**Deliverables:**
- `PythonExecutor.ts` - Secure Python script execution
- `ExecutionVisualizer.tsx` - Real-time status indicators on canvas
- `ExecutionHistory.tsx` - Past workflow runs with logs
- `ErrorBoundary.tsx` - Graceful error handling

**Dependencies:**
- Feature 9.1: Workflow Canvas Foundation (must complete first)
- ADR-011: Directory Sandboxing (path validation pattern)
- ADR-012: Bash Command Safety (subprocess execution pattern)

**Success Criteria:**
- Python scripts execute with path validation (project directory only)
- 30-second timeout enforced per script
- Execution visualizer shows node status (pending/running/success/error)
- Errors logged with context (inputs, outputs, stack trace)
- Users can view execution history (5 most recent runs per workflow)

---

### Feature 9.3: Workflow Management
**Phase:** 1 - MVP
**Duration:** 2-3 weeks
**Waves:** 2 waves (1.7-1.8)

**Scope:**
- Workflow file explorer (list, search, filter)
- Workflow CRUD operations (create, read, update, delete)
- Import/export workflows
- Basic workflow templates

**Deliverables:**
- `WorkflowExplorer.tsx` - Left panel workflow file list
- `WorkflowService.ts` - Workflow CRUD operations
- `workflow-templates/` - Pre-built workflow examples
- `ImportExportDialog.tsx` - Import/export UI

**Dependencies:**
- Feature 9.1: Workflow Canvas Foundation
- Feature 9.2: Workflow Execution Engine
- Existing FileSystemService (workflow file storage)

**Success Criteria:**
- Users can create new workflows from templates
- Workflows saved to `~/Documents/Lighthouse/workflows/`
- Import/export as `.yaml` files
- Search workflows by name/tags
- 3+ pre-built templates included (documentation generation, code review, batch processing)

**Phase 1 Complete:** MVP achieves basic workflow creation, execution, and management.

---

### Feature 9.4: Advanced Control Flow
**Phase:** 2 - Advanced Features
**Duration:** 4-5 weeks
**Waves:** 7 waves (2.1-2.7)

**Scope:**
- Conditional branching (if/else nodes)
- Loop nodes (iterate over collections)
- Parallel execution (run multiple nodes simultaneously)
- Variable interpolation (`${...}` syntax)
- Advanced error handling (fallback nodes, custom retry policies)
- Workflow step debugging (breakpoints, step-through execution)
- Workflow versioning (git-based history)

**Deliverables:**
- `ConditionalNode.tsx`, `LoopNode.tsx` - Advanced control flow nodes
- `ParallelExecutor.ts` - Parallel step execution
- `VariableResolver.ts` - `${...}` syntax interpolation
- `DebugMode.tsx` - Step-by-step execution UI
- `WorkflowVersioning.ts` - Git integration for workflow history

**Dependencies:**
- Feature 9.1, 9.2, 9.3 (MVP complete)
- Existing git integration patterns from 04-Architecture.md

**Success Criteria:**
- Conditional nodes branch based on step outputs
- Loop nodes iterate over arrays/objects
- Parallel execution runs independent nodes simultaneously
- Variables resolve correctly (`${workflow.inputs.x}`, `${steps.foo.outputs.y}`)
- Users can set breakpoints, step through workflow execution
- Workflow versions tracked in git (diff view for changes)

---

### Feature 9.5: UX Polish & Templates
**Phase:** 3 - Polish & Production-Ready
**Duration:** 2-3 weeks
**Waves:** 5 waves (3.1-3.5)

**Scope:**
- Workflow template marketplace (20+ pre-built templates)
- AI-assisted workflow generation (Claude creates workflows from descriptions)
- Workflow testing UI (mock inputs, dry run mode)
- Prompt template editor (visual editing for Claude nodes)
- Performance optimizations (large workflow handling 1000+ nodes)

**Deliverables:**
- `TemplateMarketplace.tsx` - Browse/install templates
- `AIWorkflowGenerator.tsx` - Claude generates workflows from natural language
- `TestingUI.tsx` - Mock inputs, dry run, test individual nodes
- `PromptEditor.tsx` - Visual prompt editing with syntax highlighting
- Performance improvements (React Flow virtualization, lazy loading)

**Dependencies:**
- Features 9.1-9.4 (all previous features complete)
- Production-ready performance benchmarks

**Success Criteria:**
- 20+ workflow templates available (documentation, testing, deployment, data processing)
- Users can describe workflows to Claude ("Create a workflow that..."), Claude generates YAML
- Test mode executes workflows with mock data (no actual API calls)
- Prompt editor provides autocomplete, variable suggestions
- Canvas handles 1000+ nodes without lag (< 100ms render time)

**Phase 3 Complete:** Production-ready workflow generator with polish and templates.

---

## Architecture Integration

### Component Architecture

#### Main Process Layer (Node.js)

**New Services:**

```typescript
// src/main/services/WorkflowService.ts
export class WorkflowService {
  constructor(
    private fileSystemService: FileSystemService,
    private aiService: AIService,
    private pathValidator: PathValidator
  ) {}

  async executeWorkflow(workflowPath: string, inputs: WorkflowInputs): Promise<WorkflowResult>
  async validateWorkflow(workflowYaml: string): Promise<ValidationResult>
  async listWorkflows(): Promise<WorkflowMetadata[]>
  async saveWorkflow(workflow: Workflow): Promise<void>
  async deleteWorkflow(workflowId: string): Promise<void>
}

// src/main/services/PythonExecutor.ts
export class PythonExecutor {
  constructor(private pathValidator: PathValidator) {}

  async executeScript(
    scriptPath: string,
    inputs: Record<string, any>,
    options: { timeout?: number }
  ): Promise<PythonResult>

  private validateInputPaths(inputs: Record<string, any>): void
  private looksLikeFilePath(value: string): boolean
}
```

**IPC Handlers:**
```typescript
// src/main/ipc/workflow-handlers.ts
ipcMain.handle('workflow:execute', async (event, workflowPath, inputs) => {
  return await workflowService.executeWorkflow(workflowPath, inputs);
});

ipcMain.handle('workflow:validate', async (event, workflowYaml) => {
  return await workflowService.validateWorkflow(workflowYaml);
});

ipcMain.handle('workflow:list', async () => {
  return await workflowService.listWorkflows();
});
```

#### Renderer Process Layer (React)

**New Components:**

```typescript
// src/renderer/components/workflow/WorkflowCanvas.tsx
export const WorkflowCanvas: React.FC = () => {
  const { nodes, edges, workflow } = useWorkflowStore();

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
};

// src/renderer/components/workflow/nodes/PythonScriptNode.tsx
export const PythonScriptNode: React.FC<NodeProps<PythonNodeData>> = ({ data }) => {
  return (
    <div className={`python-node status-${data.status}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-header">
        <PythonIcon />
        <span>{data.label}</span>
      </div>
      <div className="node-body">
        <code>{data.scriptPath}</code>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
```

**State Management:**

```typescript
// src/renderer/stores/workflow.store.ts
export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  activeWorkflow: null,
  nodes: [],
  edges: [],
  executionStatus: 'idle',

  loadWorkflow: async (workflowId: string) => {
    const workflow = await window.electronAPI.workflow.load(workflowId);
    set({ activeWorkflow: workflow, nodes: workflow.nodes, edges: workflow.edges });
  },

  executeWorkflow: async (inputs: WorkflowInputs) => {
    set({ executionStatus: 'running' });
    try {
      const result = await window.electronAPI.workflow.execute(
        get().activeWorkflow.id,
        inputs
      );
      set({ executionStatus: 'success' });
      return result;
    } catch (error) {
      set({ executionStatus: 'error' });
      throw error;
    }
  },

  updateNode: (nodeId: string, updates: Partial<NodeData>) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...updates } } : node
      ),
    }));
  },
}));
```

#### Shared Layer

**Types and Interfaces:**

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

export interface WorkflowStep {
  id: string;
  type: 'python' | 'claude' | 'file_operation' | 'conditional' | 'loop';
  inputs: Record<string, any>;
  outputs: string[];
  retry_policy?: RetryPolicy;
  timeout?: number;
}

export interface PythonStepConfig extends WorkflowStep {
  type: 'python';
  script: string; // Path to Python script
}

export interface ClaudeStepConfig extends WorkflowStep {
  type: 'claude';
  model: string;
  prompt_template: string;
  system_prompt?: string;
}

export interface WorkflowResult {
  success: boolean;
  outputs: Record<string, any>;
  execution_time_ms: number;
  steps_executed: StepResult[];
  error?: string;
}
```

### Integration with Existing Systems

#### FileSystemService Integration

```typescript
// Workflows stored in ~/Documents/Lighthouse/workflows/
class WorkflowService {
  async saveWorkflow(workflow: Workflow): Promise<void> {
    const workflowPath = path.join(
      app.getPath('documents'),
      'Lighthouse',
      'workflows',
      `${workflow.id}.yaml`
    );
    const yamlContent = yaml.dump(workflow);
    await this.fileSystemService.writeFile(workflowPath, yamlContent);
  }

  async loadWorkflow(workflowId: string): Promise<Workflow> {
    const workflowPath = path.join(
      app.getPath('documents'),
      'Lighthouse',
      'workflows',
      `${workflowId}.yaml`
    );
    const yamlContent = await this.fileSystemService.readFile(workflowPath);
    return yaml.load(yamlContent) as Workflow;
  }
}
```

#### AIService Integration

```typescript
// Claude AI nodes use existing AIService
class WorkflowExecutor {
  async executeClaudeStep(step: ClaudeStepConfig, inputs: Record<string, any>): Promise<any> {
    const prompt = this.resolveVariables(step.prompt_template, inputs);

    const response = await this.aiService.sendMessage(prompt, {
      systemPrompt: step.system_prompt,
    });

    return {
      success: true,
      response,
    };
  }
}
```

#### PermissionService Integration

```typescript
// Workflow execution requires user approval
class WorkflowService {
  async executeWorkflow(workflowPath: string, inputs: WorkflowInputs): Promise<WorkflowResult> {
    const workflow = await this.loadWorkflow(workflowPath);

    // Request batch permission for entire workflow
    const approved = await this.permissionService.requestBatchPermission({
      operation: 'workflow.execute',
      context: `Workflow: ${workflow.name}`,
      details: {
        steps: workflow.steps.length,
        pythonScripts: workflow.steps.filter((s) => s.type === 'python').length,
        claudeCalls: workflow.steps.filter((s) => s.type === 'claude').length,
      },
    });

    if (!approved) {
      throw new Error('Workflow execution denied by user');
    }

    return await this.doExecuteWorkflow(workflow, inputs);
  }
}
```

---

## Technology Stack

### Core Technologies (Existing)

- **Desktop Platform:** Electron (ADR-001)
- **UI Framework:** React 18+ with TypeScript (ADR-002)
- **State Management:** Zustand (ADR-003)
- **Code Editor:** Monaco Editor (ADR-004)
- **Build Tool:** Vite (ADR-005)
- **AI Integration:** AIChatSDK (ADR-006)

### New Dependencies (Workflow-Specific)

- **React Flow:** @xyflow/react v12+ (ADR-015)
  - Visual node-based workflow canvas
  - Drag-and-drop, zoom, pan, minimap
  - Built-in virtualization for 1000+ nodes
  - Bundle size: ~300KB (acceptable for desktop)

- **YAML Parser:** js-yaml v4.1+
  - Parse/stringify YAML workflow definitions
  - Schema validation
  - Bundle size: ~20KB

- **Python Runtime:** python3 (external dependency)
  - User must have Python 3.8+ installed
  - Check availability on startup: `python3 --version`
  - Show clear installation instructions if missing

### Security Stack (Leverages Existing ADRs)

- **Path Validation:** PathValidator from ADR-011
- **Process Isolation:** Node.js child_process.spawn (ADR-016)
- **Timeouts:** 30-second default per Python script (ADR-016)
- **Permission System:** PermissionService from ADR-008

---

## Implementation Phases

### Phase 1: MVP (8 Waves, 8-11 Weeks)

**Goal:** Basic workflow creation, execution, and management

**Features:**
- Feature 9.1: Workflow Canvas Foundation (3 waves)
- Feature 9.2: Workflow Execution Engine (3 waves)
- Feature 9.3: Workflow Management (2 waves)

**Deliverables:**
- Visual workflow editor with Python + Claude nodes
- Sequential workflow execution
- YAML workflow format
- Workflow file explorer
- 3+ pre-built templates

**Success Criteria:**
- Users can create workflows with 5+ nodes
- Workflows execute end-to-end without errors
- Python scripts execute securely (path validation, timeouts)
- Claude AI nodes send prompts, receive responses
- Workflows save/load correctly
- Real-time execution visualization shows node status

---

### Phase 2: Advanced Features (7 Waves, 4-5 Weeks)

**Goal:** Advanced control flow and workflow capabilities

**Features:**
- Feature 9.4: Advanced Control Flow (7 waves)

**Deliverables:**
- Conditional branching (if/else nodes)
- Loop nodes (iterate collections)
- Parallel execution (independent nodes)
- Variable interpolation (`${...}` syntax)
- Step-by-step debugging (breakpoints)
- Workflow versioning (git integration)
- Advanced error handling (fallback nodes, custom retry)

**Success Criteria:**
- Conditional workflows branch correctly based on step outputs
- Loop nodes iterate over arrays/objects
- Parallel execution runs independent steps simultaneously
- Variables resolve correctly across workflow
- Users can debug workflows step-by-step
- Workflow history tracked in git

---

### Phase 3: Polish & Production (5 Waves, 2-3 Weeks)

**Goal:** Production-ready polish, templates, performance

**Features:**
- Feature 9.5: UX Polish & Templates (5 waves)

**Deliverables:**
- 20+ workflow templates
- AI-assisted workflow generation (Claude creates workflows from descriptions)
- Workflow testing UI (mock inputs, dry run)
- Prompt template editor (visual editing for Claude nodes)
- Performance optimizations (1000+ node workflows)

**Success Criteria:**
- Template marketplace with 20+ workflows
- Claude generates workflows from natural language ("Create a workflow that...")
- Test mode runs workflows with mock data
- Canvas handles 1000+ nodes smoothly (< 100ms render)
- Production-ready performance benchmarks met

---

## Dependencies and Prerequisites

### External Dependencies

**Required Before Epic Start:**
- ✅ Epic 1: Desktop Foundation (Electron, React, Zustand) - COMPLETE
- ✅ Epic 2: AI Integration (AIService, streaming, multi-provider) - COMPLETE
- ✅ Epic 3: File Operations (FileSystemService, permission system) - COMPLETE
- ✅ ADR-015: React Flow for Visual Workflows - COMPLETE
- ✅ ADR-016: Python Script Execution Security - COMPLETE

**User System Requirements:**
- Python 3.8+ installed and available in PATH
- 8GB+ RAM (for large workflows with many Python scripts)
- Modern CPU (parallel execution feature)

### Internal Dependencies

**Feature Dependencies:**

```
Feature 9.1 (Canvas Foundation)
    ↓
Feature 9.2 (Execution Engine) ← depends on 9.1
    ↓
Feature 9.3 (Management) ← depends on 9.1, 9.2
    ↓
Feature 9.4 (Advanced Control Flow) ← depends on 9.1, 9.2, 9.3
    ↓
Feature 9.5 (Polish & Templates) ← depends on 9.1, 9.2, 9.3, 9.4
```

**No parallel Feature development** - must complete in sequence.

**Within-Feature Dependencies:**

Each Feature contains sequential waves - see individual Feature plans for detailed wave dependencies.

---

## Success Criteria

### MVP Success (Phase 1 Complete)

**Technical Criteria:**
- ✅ Visual workflow editor with 5+ node types
- ✅ YAML workflow format validates correctly
- ✅ Sequential workflow execution (no branching/loops yet)
- ✅ Python script execution with security (path validation, timeouts)
- ✅ Claude AI nodes functional (send prompts, receive responses)
- ✅ Real-time execution visualization
- ✅ Workflow CRUD operations (create, read, update, delete)
- ✅ 3+ pre-built workflow templates

**User Experience Criteria:**
- ✅ User can create workflow in < 5 minutes (visual drag-and-drop)
- ✅ Workflow execution completes in < 30 seconds (typical workflow)
- ✅ Error messages clear and actionable
- ✅ No crashes or data loss

**Performance Criteria:**
- ✅ Canvas render time < 100ms (up to 50 nodes)
- ✅ Workflow execution latency < 2s (startup overhead)
- ✅ Python script execution timeout enforced (30s default)

---

### Full Success (Phase 3 Complete)

**Technical Criteria:**
- ✅ All MVP criteria met
- ✅ Conditional branching and loops functional
- ✅ Parallel execution runs independent nodes simultaneously
- ✅ Variable interpolation works correctly
- ✅ Step-by-step debugging available
- ✅ Workflow versioning integrated with git
- ✅ 20+ workflow templates available
- ✅ AI-assisted workflow generation (Claude creates workflows)
- ✅ Canvas handles 1000+ nodes without lag

**Business Criteria:**
- ✅ 50+ workflows created by users (community adoption)
- ✅ 80% workflow execution success rate (reliability)
- ✅ 5+ enterprise clients using workflows (commercial validation)
- ✅ Workflow feature cited in 30%+ of sales demos

**User Feedback Criteria:**
- ✅ 8+/10 user satisfaction score
- ✅ 70%+ of users create workflows within first week
- ✅ 50%+ of users create custom templates
- ✅ < 5% users report bugs or issues

---

## Risk Management

### Technical Risks

#### Risk 1: React Flow Performance (Medium)

**Description:** React Flow may not handle 1000+ node workflows smoothly on older hardware.

**Impact:** Poor user experience, canvas lag, unresponsive UI.

**Mitigation:**
- Use React Flow's built-in virtualization (renders only visible nodes)
- Lazy load node components (don't render off-screen nodes)
- Performance benchmarks in Wave 3.5 (optimize before release)
- Minimum system requirements documented (8GB RAM, modern CPU)

**Contingency:** If performance inadequate, limit workflows to 500 nodes or implement custom canvas.

---

#### Risk 2: Python Dependency (Medium)

**Description:** Users may not have Python installed, blocking workflow execution.

**Impact:** Workflows fail immediately, poor first-run experience.

**Mitigation:**
- Check Python availability on startup: `python3 --version`
- Show clear installation instructions if missing (link to python.org)
- Document Python requirement prominently in onboarding
- Provide Python installation guide in docs

**Contingency:** Offer "Python-free" workflows using only Claude AI + file operations (no Python scripts).

---

#### Risk 3: Python Script Security (High)

**Description:** Malicious Python scripts could access files outside project directory or execute dangerous commands.

**Impact:** Security vulnerability, potential data loss or system compromise.

**Mitigation:**
- **Path validation** (ADR-011): Scripts only access project directory
- **Process isolation** (ADR-016): Scripts run in separate process, limited permissions
- **Timeout enforcement** (ADR-016): 30-second default, prevents infinite loops
- **Permission prompts** (ADR-008): User approves workflow execution explicitly
- **Script review UI**: Monaco editor shows script contents before execution

**Threat Model:** Protecting against **accidents** (wrong file paths, infinite loops), not malicious users attacking themselves. User is running their own scripts in their own project.

**Contingency:** If security issues arise, add Docker container isolation (Phase 2 future enhancement).

---

#### Risk 4: YAML Parsing Errors (Low)

**Description:** Invalid YAML syntax causes workflow load failures.

**Impact:** Workflows fail to load, frustrating user experience.

**Mitigation:**
- Schema validation with clear error messages (line number, error description)
- Visual YAML editor with syntax highlighting (Monaco)
- Workflow validator runs before save (catches errors early)
- Example workflows follow best practices (users copy correct patterns)

**Contingency:** Provide workflow repair tool (auto-fix common YAML errors).

---

### Operational Risks

#### Risk 5: Workflow Complexity (Medium)

**Description:** Users create overly complex workflows that are hard to debug.

**Impact:** User frustration, support burden, low workflow success rate.

**Mitigation:**
- Limit workflow size in MVP (50 nodes max, removed in Phase 2)
- Provide best practices guide (keep workflows simple, modular)
- Step-by-step debugging (Wave 2.6) helps troubleshoot complex workflows
- Template examples show good patterns (small, focused workflows)

**Contingency:** Offer professional services for complex workflow design (revenue opportunity).

---

#### Risk 6: Template Quality (Low)

**Description:** Pre-built templates don't work correctly or don't meet user needs.

**Impact:** Poor first impression, users abandon feature.

**Mitigation:**
- Templates thoroughly tested before release (automated test suite)
- Community-contributed templates reviewed before inclusion
- Template feedback mechanism (users report issues, suggest improvements)
- Regular template updates (monthly maintenance)

**Contingency:** Open-source template repository, community maintains templates.

---

### Market Risks

#### Risk 7: User Adoption (Medium)

**Description:** Users don't understand workflow value or find UI too complex.

**Impact:** Low feature usage, wasted development effort.

**Mitigation:**
- Onboarding tutorial (5-minute guided workflow creation)
- Video demonstrations (use cases, best practices)
- Pre-built templates (users modify instead of starting from scratch)
- AI-assisted generation (Phase 3: Claude creates workflows from descriptions)

**Contingency:** Offer workflow design workshops, professional services.

---

## Next Steps

### Immediate Actions

1. **Review and Approve Master Plan** - Product Owner review, sign-off
2. **Create Feature Plans** - Use wave-planner to create detailed Feature 9.1-9.5 plans
3. **Validate Architecture** - System architect review, ADR updates if needed
4. **Create Azure DevOps Epic** - Epic work item with Features as children
5. **Begin Wave Planning** - Detailed wave plans for Feature 9.1 (first 3 waves)

### Feature Planning Sequence

```
Epic 9 Master Plan (this document) ✅ COMPLETE
    ↓
Feature 9.1 Plan → Feature 9.2 Plan → Feature 9.3 Plan → Feature 9.4 Plan → Feature 9.5 Plan
    ↓
Wave Plans (detailed implementation for each Feature)
    ↓
Implementation (backend-specialist, frontend-specialist agents)
```

### Sign-Off Requirements

**Required Approvals:**
- [ ] Product Owner (business value, scope, priorities)
- [ ] System Architect (architecture integration, technical approach)
- [ ] Development Team Lead (implementation feasibility, timeline)
- [ ] Security Officer (Python script security, permission model)

**Approval Criteria:**
- Master plan aligns with Product Vision and Business Requirements
- Architecture integration follows established patterns (ADRs)
- Feature breakdown logical, dependencies clear
- Implementation phases realistic, timeline achievable
- Risk mitigation strategies adequate

---

**Master Plan Status:** ✅ Ready for Feature Planning

**Next Document:** `feature-9.1-workflow-canvas-foundation.md`

---

*This master plan consolidates 37 pages of industry research, existing architecture documentation, and Epic 9 original planning into a comprehensive roadmap for Feature planning.*
