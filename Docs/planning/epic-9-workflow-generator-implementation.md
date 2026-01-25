# Epic 9: Visual Workflow Generator - Complete Implementation Plan

**Version:** 1.0 - Consolidated Planning Document
**Date:** January 21, 2026
**Status:** Planning - Comprehensive Integration Plan
**Project:** Lighthouse Chat IDE (Beacon)

---

## Document Purpose

This document consolidates:
1. **Industry research** from workflow-research-and-recommendations.md (37 pages)
2. **Original vision** from Workflow-generator-planing document.md
3. **Technical specifications** from lighthouse-workflow-specification.md
4. **Lighthouse architecture** integration with existing systems

It provides a **complete implementation roadmap** for integrating visual workflow generation into Lighthouse Chat IDE, following established architectural patterns and leveraging existing infrastructure.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature Overview](#feature-overview)
3. [Industry Research Validation](#industry-research-validation)
4. [Architecture Integration](#architecture-integration)
5. [Component Design](#component-design)
6. [Implementation Phases](#implementation-phases)
7. [Integration with Existing Systems](#integration-with-existing-systems)
8. [Testing Strategy](#testing-strategy)
9. [Success Criteria](#success-criteria)
10. [Risk Mitigation](#risk-mitigation)

---

## Executive Summary

### What We're Building

**Visual Workflow Generator** for Lighthouse Chat IDE that enables developers to:
- Create AI-powered automation workflows using a visual node-based editor
- Define workflows in declarative YAML format
- Execute Python scripts and Claude AI operations in sequence
- Manage complex dependencies and conditional logic
- Test and debug workflows step-by-step

**Key Differentiator**: Combines visual editing with Lighthouse's existing AI integration, file operations, and conversational interface.

### Strategic Value

- **Positions Lighthouse as workflow automation platform** (not just chat IDE)
- **Validates multi-provider AI architecture** with workflow use cases
- **Demonstrates enterprise governance** (SOC logging, workflow versioning)
- **Expands addressable market** beyond code editing to automation

### Industry Validation

Research into **n8n** ($2.5B valuation), **React Flow**, **Langflow/Flowise**, **GitHub Actions**, and **Kestra** validates:
- ✅ **Visual workflow editors** are proven pattern (n8n success)
- ✅ **React Flow** is industry standard for node-based UIs
- ✅ **YAML workflow definitions** are best practice (GitHub Actions)
- ✅ **Python stdin/stdout JSON** is validated interface (Kestra)
- ✅ **Workflow automation market** is massive and growing

### Architectural Fit

Workflows fit naturally into Lighthouse's existing architecture:
- **Left Panel**: File Explorer (existing) + Workflow Explorer (new)
- **Center Panel**: AI Chat (existing) + Workflow Canvas (new, tabbed)
- **Right Panel**: Monaco Editor (existing, opens workflow YAML and Python scripts)
- **Main Process**: New WorkflowService integrates with existing FileSystemService, AIService
- **Renderer**: New WorkflowStore, WorkflowCanvas components, integrated with existing Zustand pattern

**No architecture changes needed** - workflows leverage existing patterns.

---

## Feature Overview

### Core Capabilities

#### 1. Visual Workflow Editor

**Node-Based Canvas:**
- Drag-and-drop workflow nodes (Python scripts, Claude AI, conditionals, loops)
- Connect nodes with edges to define execution order
- Real-time validation and error highlighting
- Virtualized rendering for complex workflows (1000+ nodes)

**Node Types:**
- **Python Script Node**: Execute custom Python scripts with stdin/stdout JSON
- **Claude API Node**: Send prompts to Claude, receive AI responses
- **Input Node**: Define workflow inputs (strings, numbers, files)
- **Output Node**: Define workflow outputs
- **Conditional Node**: Branch execution based on conditions
- **Loop Node**: Iterate over collections
- **File Operation Node**: Leverage Lighthouse's existing file tools

**Visual Features:**
- Mini-map for navigation (large workflows)
- Zoom controls and fit-to-view
- Node search and filtering
- Workflow validation panel (errors, warnings)
- Real-time execution visualizer (node status during run)

#### 2. YAML Workflow Definition

**Declarative Format:**
```yaml
workflow:
  name: "Documentation Generator"
  version: "1.0"
  description: "Generate documentation from code repository"

  inputs:
    - repo_url: string
    - output_path: string

  steps:
    - id: fetch_repo
      type: python
      script: ./scripts/fetch_repo_info.py
      inputs:
        repo_url: ${workflow.inputs.repo_url}
      outputs:
        - repo_data

    - id: generate_docs
      type: claude
      model: claude-sonnet-4-5-20250929
      prompt_template: ./prompts/analyze_repo.txt
      inputs:
        repo_data: ${steps.fetch_repo.outputs.repo_data}
      outputs:
        - documentation

    - id: save_docs
      type: file_operation
      operation: write
      inputs:
        file_path: ${workflow.inputs.output_path}
        content: ${steps.generate_docs.outputs.documentation}
```

**Features:**
- Variable interpolation (`${...}` syntax)
- Step dependencies (automatic execution ordering)
- Error handling strategies (retry, fallback, abort)
- Workflow versioning and metadata
- UI layout preservation (node positions, zoom level)

#### 3. Python Script Contract

**Standard Interface:**
```python
#!/usr/bin/env python3
"""
Workflow Script: Fetch Repository Information

Inputs:
  - repo_url: string (required) - GitHub repository URL
  - include_metadata: boolean (optional) - Include commit history

Outputs:
  - repo_data: object - Repository information
  - commit_count: integer - Number of commits
  - file_list: array - List of file paths
"""

import sys
import json
import traceback

def main(inputs: dict) -> dict:
    try:
        repo_url = inputs.get('repo_url')

        if not repo_url:
            return {
                'success': False,
                'error': 'Missing required input: repo_url'
            }

        # Perform work
        repo_data = fetch_repository_info(repo_url)

        return {
            'success': True,
            'repo_data': repo_data,
            'commit_count': 150,
            'file_list': ['src/main.ts', 'src/utils.ts']
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }

if __name__ == '__main__':
    # Read inputs from stdin (JSON)
    input_data = sys.stdin.read()
    inputs = json.loads(input_data) if input_data else {}

    # Execute main function
    outputs = main(inputs)

    # Write outputs to stdout (JSON)
    print(json.dumps(outputs, indent=2))

    # Exit with appropriate code
    exit_code = 0 if outputs.get('success', True) else 1
    sys.exit(exit_code)
```

#### 4. Workflow Execution

**Execution Modes:**
- **Full Run**: Execute entire workflow from start to end
- **Test Mode**: Execute single node with mock inputs
- **Debug Mode**: Step-by-step execution with breakpoints
- **Dry Run**: Validate without executing (check dependencies, inputs)

**Real-Time Visualization:**
- Node status indicators (pending, running, success, error)
- Progress bar for long-running workflows
- Live output streaming for Claude AI nodes
- Execution timeline view

**Error Handling:**
- Automatic retry with exponential backoff (configurable)
- Fallback to alternative nodes on failure
- Error logging with context (inputs, outputs, stack trace)
- Workflow abort on critical errors

#### 5. Workflow Management

**Workflow Library:**
- Browse saved workflows
- Search and filter by tags, name, description
- Duplicate workflows (create templates)
- Import/export workflow definitions
- Version history and comparison

**Template System:**
- Pre-built workflow templates (documentation generation, code review, etc.)
- Template marketplace (future enhancement)
- Custom template creation from existing workflows

---

## Industry Research Validation

### Research Summary (37 Pages Analyzed)

We analyzed **6 leading workflow platforms** to validate our approach:

#### 1. n8n Workflow Automation ($2.5B Valuation)

**Key Insights:**
- **Visual editor is essential** - 400+ integrations, all visually configured
- **Instant execution feedback** - Users see results immediately, drives engagement
- **No-code approachable** - Non-technical users can build complex workflows
- **TypeScript/Node.js architecture** - Aligns with Lighthouse stack

**Lessons Applied:**
- ✅ Visual-first workflow design
- ✅ Real-time execution visualizer
- ✅ Node testing playground (test individual steps)
- ✅ Instant feedback loop

#### 2. React Flow (XyFlow) - Visual Node Editor

**Key Insights:**
- **Industry standard** for node-based UIs (10K+ GitHub stars)
- **Built-in virtualization** - Handles 1000+ nodes efficiently
- **Drag-and-drop API** - Mature patterns for node manipulation
- **TypeScript-first** - Excellent type safety

**Lessons Applied:**
- ✅ **React Flow as foundation** for workflow canvas
- ✅ Virtualization for large workflows
- ✅ Custom node components for Python/Claude nodes
- ✅ Helper lines for visual alignment

**Decision: Use React Flow (@xyflow/react)**

#### 3. Langflow vs Flowise - AI Workflow Builders

**Key Insights:**
- **Langflow** (Python/LangChain): Complex, academic focus, powerful but steep learning curve
- **Flowise** (Node.js): Simpler, better UX, but less flexible
- **Component testing** critical - Must test individual AI prompts before full workflow
- **Visual prompt editing** - Inline editing of prompts in canvas

**Lessons Applied:**
- ✅ **Simpler than Langflow** - Focus on usability, not academic completeness
- ✅ **More powerful than Flowise** - Leverage Lighthouse's existing AI integration
- ✅ **Prompt editor UI** - Visual editing with diff view, autocomplete
- ✅ **Node testing playground** - Test Claude prompts in isolation

#### 4. Kestra - Workflow Orchestration (Python Focus)

**Key Insights:**
- **Process isolation** - Scripts run in isolated processes (container isolation is future enhancement)
- **stdin/stdout JSON** validated as best practice
- **Language-agnostic** - Works with Python, Node.js, Java, etc.
- **No framework lock-in** - Scripts are plain Python, easy to test externally

**Lessons Applied:**
- ✅ **Python stdin/stdout JSON** as script contract
- ✅ Process isolation (scripts run in separate process)
- ✅ Framework leverage factor (0.5x weight for framework calls)
- ✅ Script validator (contract compliance checking)

#### 5. GitHub Actions - YAML Workflow Format

**Key Insights:**
- **YAML is proven** - Millions of workflows in production
- **Variable interpolation pitfalls** - `${{ }}` syntax can be confusing
- **Error handling critical** - Must handle step failures gracefully
- **Workflow visualization** - GitHub shows execution graph

**Lessons Applied:**
- ✅ **YAML format** with enhancements (UI metadata, node colors)
- ✅ **Simpler variable syntax** - `${...}` instead of `${{ }}`
- ✅ **Error handling strategies** - Retry, fallback, abort
- ✅ **Execution visualizer** - Real-time status on canvas

#### 6. Claude Prompt Engineering Best Practices

**Key Insights:**
- **Structured prompts** - ROLE, GOAL, CONSTRAINTS, OUTPUT format
- **XML tags for variables** - `<repo_data>${data}</repo_data>` clearer than text interpolation
- **Visual prompt editors** - Builder.io shows diff view for prompt changes
- **AI-assisted editing** - Claude can suggest prompt improvements

**Lessons Applied:**
- ✅ **Prompt templates** with structured format
- ✅ **XML variable syntax** option for Claude nodes
- ✅ **Visual prompt editor** with syntax highlighting
- ✅ **AI-assisted improvements** - Claude suggests better prompts

### Competitive Positioning

**Lighthouse Workflow Generator vs Competitors:**

| Feature | n8n | Langflow | Flowise | Kestra | **Lighthouse** |
|---------|-----|----------|---------|--------|----------------|
| **Visual Editor** | ✅ Excellent | ✅ Good | ✅ Good | ❌ None | ✅ **React Flow** |
| **AI Integration** | ⚠️ Limited | ✅ LangChain | ✅ LangChain | ❌ None | ✅ **Multi-Provider** |
| **Code Editor** | ❌ None | ⚠️ Basic | ⚠️ Basic | ❌ None | ✅ **Monaco (VS Code)** |
| **File Operations** | ⚠️ Via plugins | ❌ None | ❌ None | ⚠️ Limited | ✅ **Native Tools** |
| **Conversational UI** | ❌ None | ❌ None | ❌ None | ❌ None | ✅ **Claude Chat** |
| **Script Language** | JavaScript | Python | JavaScript | **Python** | ✅ **Python** |
| **SOC Logging** | ❌ None | ❌ None | ❌ None | ⚠️ Basic | ✅ **Built-in** |
| **Desktop App** | ⚠️ Self-hosted | ❌ Web only | ❌ Web only | ❌ Server | ✅ **Electron** |

**Unique Value Proposition:**
- **Only workflow tool with integrated AI chat** - Ask Claude to create/modify workflows
- **Only workflow tool with professional code editor** - Edit Python scripts in Monaco
- **Only workflow tool with native file operations** - Seamless integration with file tools
- **Only workflow tool with SOC traceability** - Enterprise governance built-in

### Technical Recommendations from Research

**Critical MVP Features (Must-Have):**
1. ✅ **Node testing UI** - Execute single nodes in isolation (Langflow/Flowise lesson)
2. ✅ **Execution visualizer** - Real-time status on canvas (n8n lesson)
3. ✅ **AI-assisted prompt editing** - Claude suggests prompt improvements (Builder.io lesson)
4. ✅ **Script validator** - Verify Python contract compliance (Kestra lesson)

**YAML Format Enhancements:**
```yaml
workflow:
  name: "Documentation Generator"
  version: "1.0"
  tags: ["documentation", "ai", "automation"]  # NEW: Searchable tags

  ui_metadata:  # NEW: Preserve visual layout
    canvas:
      zoom: 1.2
      offset: { x: 100, y: 50 }
    nodes:
      - id: fetch_repo
        position: { x: 100, y: 100 }
        color: "#3b82f6"  # blue
        icon: "download"
      - id: generate_docs
        position: { x: 400, y: 100 }
        color: "#10b981"  # green
        icon: "sparkles"

  steps:
    - id: fetch_repo
      type: python
      retry_policy:  # NEW: Error handling
        max_attempts: 3
        backoff: exponential
        initial_delay: 1000  # ms
      timeout: 30000  # NEW: Execution timeout
      # ... rest of step
```

---

## Architecture Integration

### How Workflows Fit into Lighthouse

Workflows integrate into Lighthouse's **existing three-panel layout** with minimal disruption:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Lighthouse Chat IDE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐  ┌─────────────────────────┐  ┌──────────────┐  │
│  │  Left Panel  │  │     Center Panel        │  │ Right Panel  │  │
│  │              │  │                         │  │              │  │
│  │ ┌──────────┐ │  │  ┌────────────────┐   │  │ ┌──────────┐ │  │
│  │ │   File   │ │  │  │   AI Chat      │   │  │ │  Monaco  │ │  │
│  │ │ Explorer │ │  │  │   Interface    │   │  │ │  Editor  │ │  │
│  │ │          │ │  │  │  (existing)    │   │  │ │          │ │  │
│  │ └──────────┘ │  │  └────────────────┘   │  │ │ - Python │ │  │
│  │              │  │          ↕               │  │ │   scripts│ │  │
│  │ ┌──────────┐ │  │  ┌────────────────┐   │  │ │ - Prompts│ │  │
│  │ │ Workflow │ │  │  │   Workflow     │   │  │ │ - YAML   │ │  │
│  │ │ Explorer │ │  │  │   Canvas       │   │  │ │   files  │ │  │
│  │ │  (NEW)   │ │  │  │   (NEW)        │   │  │ └──────────┘ │  │
│  │ └──────────┘ │  │  └────────────────┘   │  │              │  │
│  │              │  │                         │  │              │  │
│  └──────────────┘  └─────────────────────────┘  └──────────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Integration Points:**

1. **Left Panel**: Add `WorkflowExplorerPanel` below `FileExplorerPanel`
2. **Center Panel**: Add `WorkflowCanvas` tab (alongside AI Chat)
3. **Right Panel**: Monaco Editor opens workflow YAML, Python scripts, prompt templates
4. **Main Process**: New `WorkflowService` coordinates execution
5. **Renderer**: New `WorkflowStore` manages workflow state

**Tabbed Center Panel:**
```
┌─────────────────────────────────┐
│ 📝 AI Chat  │  🔀 Workflow     │  ← Tabs
├─────────────────────────────────┤
│                                 │
│   [Active tab content here]     │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### Architectural Layers

Following Lighthouse's existing **three-layer architecture**:

#### Layer 1: Main Process (Node.js)

**New Services:**
```typescript
// src/main/services/WorkflowService.ts
class WorkflowService {
  constructor(
    private fileSystemService: FileSystemService,
    private aiService: AIService,
    private pythonExecutor: PythonExecutor
  ) {}

  async executeWorkflow(workflowPath: string): Promise<WorkflowResult>;
  async executeNode(nodeId: string, inputs: Record<string, any>): Promise<NodeResult>;
  async validateWorkflow(workflow: WorkflowDefinition): Promise<ValidationResult>;
}

// src/main/services/PythonExecutor.ts
class PythonExecutor {
  async executeScript(scriptPath: string, inputs: any): Promise<any>;
  async validateScriptContract(scriptPath: string): Promise<boolean>;
}
```

**IPC Handlers:**
```typescript
// src/main/ipc/workflow-handlers.ts
export function registerWorkflowHandlers(ipcMain: IpcMain) {
  ipcMain.handle('workflow:execute', async (_, workflowPath) => {
    return await workflowService.executeWorkflow(workflowPath);
  });

  ipcMain.handle('workflow:executeNode', async (_, nodeId, inputs) => {
    return await workflowService.executeNode(nodeId, inputs);
  });

  ipcMain.handle('workflow:validate', async (_, workflow) => {
    return await workflowService.validateWorkflow(workflow);
  });
}
```

#### Layer 2: Renderer Process (React)

**New Zustand Store:**
```typescript
// src/renderer/stores/workflow.store.ts
interface WorkflowState {
  workflows: WorkflowDefinition[];
  activeWorkflow: WorkflowDefinition | null;
  nodes: Node[];
  edges: Edge[];
  executionStatus: Map<string, NodeStatus>;

  // Actions
  loadWorkflow: (path: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  addNode: (node: Node) => void;
  removeNode: (nodeId: string) => void;
  connectNodes: (sourceId: string, targetId: string) => void;
  executeWorkflow: () => Promise<void>;
  executeNode: (nodeId: string) => Promise<void>;
  updateNodePosition: (nodeId: string, position: XYPosition) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // Implementation
}));
```

**New React Components:**
```typescript
// src/renderer/components/workflow/WorkflowCanvas.tsx
export const WorkflowCanvas: React.FC = () => {
  const { nodes, edges, addNode, connectNodes } = useWorkflowStore();

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={customNodeTypes}
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
};

// src/renderer/components/workflow/nodes/PythonScriptNode.tsx
export const PythonScriptNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <NodeContainer status={data.status}>
      <NodeHeader icon="python" title={data.label} />
      <NodeInputs inputs={data.inputs} />
      <NodeOutputs outputs={data.outputs} />
      <NodeActions onTest={() => testNode(data.id)} />
    </NodeContainer>
  );
};

// src/renderer/components/workflow/WorkflowExplorer.tsx
export const WorkflowExplorer: React.FC = () => {
  const { workflows, loadWorkflow } = useWorkflowStore();

  return (
    <Panel title="Workflows">
      <WorkflowTree workflows={workflows} onSelect={loadWorkflow} />
      <WorkflowActions onCreate={createWorkflow} />
    </Panel>
  );
};
```

**Integration with Existing Components:**
```typescript
// src/renderer/components/layout/MainLayout.tsx (MODIFIED)
export const MainLayout: React.FC = () => {
  const [centerTab, setCenterTab] = useState<'chat' | 'workflow'>('chat');

  return (
    <div className="flex h-screen">
      {/* Left Panel - Add Workflow Explorer */}
      <ResizablePanel size={panelSizes.left}>
        <FileExplorerPanel />
        <WorkflowExplorerPanel />  {/* NEW */}
      </ResizablePanel>

      {/* Center Panel - Add Workflow Canvas Tab */}
      <ResizablePanel size={panelSizes.center}>
        <TabBar
          tabs={[
            { id: 'chat', label: 'AI Chat', icon: '💬' },
            { id: 'workflow', label: 'Workflow', icon: '🔀' },  {/* NEW */}
          ]}
          activeTab={centerTab}
          onTabChange={setCenterTab}
        />
        {centerTab === 'chat' && <ChatInterface />}
        {centerTab === 'workflow' && <WorkflowCanvas />}  {/* NEW */}
      </ResizablePanel>

      {/* Right Panel - No changes, Monaco opens YAML/Python */}
      <ResizablePanel size={panelSizes.right}>
        <EditorPanel />
      </ResizablePanel>
    </div>
  );
};
```

#### Layer 3: Shared Types

```typescript
// src/shared/types/workflow.types.ts
export interface WorkflowDefinition {
  name: string;
  version: string;
  description?: string;
  tags?: string[];
  inputs: WorkflowInput[];
  outputs?: WorkflowOutput[];
  steps: WorkflowStep[];
  ui_metadata?: UIMetadata;
}

export interface WorkflowStep {
  id: string;
  type: 'python' | 'claude' | 'conditional' | 'loop' | 'file_operation';
  inputs?: Record<string, any>;
  outputs?: string[];
  retry_policy?: RetryPolicy;
  timeout?: number;

  // Type-specific fields
  script?: string;  // For python nodes
  prompt_template?: string;  // For claude nodes
  condition?: string;  // For conditional nodes
  collection?: string;  // For loop nodes
  operation?: string;  // For file_operation nodes
}

export interface Node {
  id: string;
  type: string;
  position: XYPosition;
  data: NodeData;
}

export interface NodeStatus {
  state: 'pending' | 'running' | 'success' | 'error';
  startedAt?: number;
  completedAt?: number;
  error?: string;
  outputs?: Record<string, any>;
}
```

### Integration with Existing Services

**Leverage Existing Lighthouse Infrastructure:**

1. **File Operations:**
   ```typescript
   // Workflow nodes can use existing file operation tools
   const fileOperationNode: WorkflowStep = {
     id: 'save_output',
     type: 'file_operation',
     operation: 'write',
     inputs: {
       file_path: '${workflow.inputs.output_path}',
       content: '${steps.generate_docs.outputs.documentation}'
     }
   };

   // Implemented using existing FileSystemService
   async executeFileOperation(step: WorkflowStep) {
     return await this.fileSystemService.writeFile(
       step.inputs.file_path,
       step.inputs.content
     );
   }
   ```

2. **AI Integration:**
   ```typescript
   // Workflow Claude nodes use existing AIService
   const claudeNode: WorkflowStep = {
     id: 'generate_docs',
     type: 'claude',
     model: 'claude-sonnet-4-5-20250929',
     prompt_template: './prompts/analyze_repo.txt',
     inputs: {
       repo_data: '${steps.fetch_repo.outputs.repo_data}'
     }
   };

   // Implemented using existing AIService
   async executeClaudeNode(step: WorkflowStep) {
     const prompt = await this.loadPromptTemplate(step.prompt_template);
     const interpolated = this.interpolateVariables(prompt, step.inputs);

     return await this.aiService.sendMessage(interpolated);
   }
   ```

3. **SOC Logging:**
   ```typescript
   // Workflows automatically logged to SOC via existing AIChatSDK
   async executeWorkflow(workflow: WorkflowDefinition) {
     // AIChatSDK already logs all operations
     // Workflow execution logged as:
     // - Operation: "workflow.execute"
     // - Metadata: { workflow_name, version, steps }
     // - Trace ID: Unique per execution

     // No additional code needed - leverage existing infrastructure
   }
   ```

4. **Permission System:**
   ```typescript
   // Workflows respect existing permission system
   async executeFileOperation(step: WorkflowStep) {
     // Use existing PermissionService for approval
     if (await this.permissionService.requiresApproval(step.operation)) {
       const approved = await this.permissionService.requestPermission({
         operation: step.operation,
         filePath: step.inputs.file_path,
         preview: step.inputs.content.substring(0, 100)
       });

       if (!approved) {
         throw new Error('Operation denied by user');
       }
     }

     // Proceed with operation
   }
   ```

### No Architecture Changes Required

**Key Point:** Workflows fit into existing architecture without fundamental changes:

✅ **Same IPC patterns** - Just add new channels for workflow operations
✅ **Same Zustand pattern** - WorkflowStore follows FileExplorerStore, EditorStore patterns
✅ **Same component structure** - WorkflowCanvas is another panel component
✅ **Same service layer** - WorkflowService follows FileSystemService, AIService patterns
✅ **Same type system** - Workflow types in `src/shared/types/` like existing types

**Only Additions:**
- New `WorkflowService` (main process)
- New `PythonExecutor` (main process)
- New `WorkflowStore` (renderer)
- New UI components (WorkflowCanvas, WorkflowExplorer, node components)
- New IPC handlers for workflow operations

**Unchanged:**
- FileSystemService (reused by workflows)
- AIService (reused by workflows)
- PermissionService (reused by workflows)
- FileExplorerPanel (coexists with WorkflowExplorer)
- ChatInterface (coexists with WorkflowCanvas via tabs)
- MonacoEditor (opens workflow YAML, Python scripts)

---

## Component Design

### React Flow Integration

**Why React Flow:**
- Industry standard for node-based UIs (validated by research)
- Built-in virtualization (handles 1000+ nodes)
- TypeScript-first with excellent type safety
- Mature drag-and-drop API
- Active development and community

**Custom Node Types:**

```typescript
// src/renderer/components/workflow/nodes/types.ts
export const nodeTypes = {
  python: PythonScriptNode,
  claude: ClaudeAPINode,
  conditional: ConditionalNode,
  loop: LoopNode,
  input: InputNode,
  output: OutputNode,
  file_operation: FileOperationNode,
};
```

**Node Component Structure:**

```typescript
// src/renderer/components/workflow/nodes/PythonScriptNode.tsx
interface PythonScriptNodeData {
  label: string;
  scriptPath: string;
  inputs: Record<string, any>;
  outputs: string[];
  status: NodeStatus;
  error?: string;
}

export const PythonScriptNode: React.FC<NodeProps<PythonScriptNodeData>> = ({ data, id }) => {
  const { executeNode, updateNode } = useWorkflowStore();
  const { openFile } = useEditorStore();  // Existing editor integration

  const handleTest = async () => {
    // Test node in isolation
    const result = await executeNode(id);
    updateNode(id, { ...data, status: result.status, error: result.error });
  };

  const handleEditScript = () => {
    // Open Python script in Monaco editor (right panel)
    openFile(data.scriptPath);
  };

  return (
    <NodeContainer status={data.status}>
      <NodeHeader
        icon={<PythonIcon />}
        title={data.label}
        status={data.status}
      />

      <NodeBody>
        <InputHandles inputs={Object.keys(data.inputs)} />
        <ScriptInfo path={data.scriptPath} />
        <OutputHandles outputs={data.outputs} />
      </NodeBody>

      <NodeFooter>
        <Button onClick={handleTest} size="sm">Test</Button>
        <Button onClick={handleEditScript} size="sm">Edit Script</Button>
      </NodeFooter>

      {data.error && (
        <ErrorTooltip message={data.error} />
      )}
    </NodeContainer>
  );
};
```

**Claude API Node:**

```typescript
// src/renderer/components/workflow/nodes/ClaudeAPINode.tsx
interface ClaudeNodeData {
  label: string;
  model: string;
  promptTemplate: string;
  inputs: Record<string, any>;
  outputs: string[];
  status: NodeStatus;
  response?: string;
}

export const ClaudeAPINode: React.FC<NodeProps<ClaudeNodeData>> = ({ data, id }) => {
  const { executeNode } = useWorkflowStore();
  const { openFile } = useEditorStore();
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  const handleEditPrompt = () => {
    // Open prompt template in Monaco editor
    openFile(data.promptTemplate);
  };

  const handleTest = async () => {
    // Test Claude node with current inputs
    const result = await executeNode(id);
    // Show response in modal
    setShowPromptEditor(true);
  };

  return (
    <NodeContainer status={data.status} color="green">
      <NodeHeader
        icon={<ClaudeIcon />}
        title={data.label}
        status={data.status}
      />

      <NodeBody>
        <InputHandles inputs={Object.keys(data.inputs)} />
        <ModelBadge model={data.model} />
        <PromptPreview template={data.promptTemplate} />
        <OutputHandles outputs={data.outputs} />
      </NodeBody>

      <NodeFooter>
        <Button onClick={handleTest} size="sm">Test</Button>
        <Button onClick={handleEditPrompt} size="sm">Edit Prompt</Button>
      </NodeFooter>

      {data.response && (
        <ResponsePreview response={data.response} />
      )}
    </NodeContainer>
  );
};
```

### Workflow Canvas Features

**Canvas Component:**

```typescript
// src/renderer/components/workflow/WorkflowCanvas.tsx
export const WorkflowCanvas: React.FC = () => {
  const {
    nodes,
    edges,
    addNode,
    removeNode,
    updateNodePosition,
    connectNodes,
    executeWorkflow,
    executionStatus,
  } = useWorkflowStore();

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    // Update Zustand store
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    // Update Zustand store
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    connectNodes(connection.source, connection.target);
  }, [connectNodes]);

  const handleAddNode = (type: string) => {
    const newNode = {
      id: generateId(),
      type,
      position: { x: 100, y: 100 },
      data: createDefaultNodeData(type),
    };
    addNode(newNode);
  };

  return (
    <div className="workflow-canvas h-full w-full">
      {/* Toolbar */}
      <WorkflowToolbar
        onAddNode={handleAddNode}
        onExecute={executeWorkflow}
        onSave={saveWorkflow}
        onValidate={validateWorkflow}
      />

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap />
        <Panel position="top-right">
          <ValidationPanel />
        </Panel>
      </ReactFlow>

      {/* Execution Visualizer */}
      <ExecutionOverlay
        visible={executionStatus.size > 0}
        status={executionStatus}
      />
    </div>
  );
};
```

**Node Palette:**

```typescript
// src/renderer/components/workflow/NodePalette.tsx
export const NodePalette: React.FC = () => {
  const categories = [
    {
      name: 'Data',
      nodes: [
        { type: 'input', label: 'Input', icon: '📥' },
        { type: 'output', label: 'Output', icon: '📤' },
      ],
    },
    {
      name: 'Processing',
      nodes: [
        { type: 'python', label: 'Python Script', icon: '🐍' },
        { type: 'claude', label: 'Claude AI', icon: '✨' },
      ],
    },
    {
      name: 'Control Flow',
      nodes: [
        { type: 'conditional', label: 'Conditional', icon: '🔀' },
        { type: 'loop', label: 'Loop', icon: '🔁' },
      ],
    },
    {
      name: 'File Operations',
      nodes: [
        { type: 'file_operation', label: 'File Operation', icon: '📁' },
      ],
    },
  ];

  return (
    <Palette categories={categories} onDragStart={handleDragStart} />
  );
};
```

**Execution Visualizer:**

```typescript
// src/renderer/components/workflow/ExecutionOverlay.tsx
interface ExecutionOverlayProps {
  visible: boolean;
  status: Map<string, NodeStatus>;
}

export const ExecutionOverlay: React.FC<ExecutionOverlayProps> = ({ visible, status }) => {
  if (!visible) return null;

  const runningNodes = Array.from(status.entries())
    .filter(([_, s]) => s.state === 'running')
    .map(([id, _]) => id);

  const completedNodes = Array.from(status.entries())
    .filter(([_, s]) => s.state === 'success')
    .length;

  const totalNodes = status.size;

  return (
    <div className="execution-overlay">
      <ProgressBar current={completedNodes} total={totalNodes} />
      <RunningNodes nodes={runningNodes} />
      <ExecutionLog entries={executionLog} />
    </div>
  );
};
```

### YAML Editor Integration

**Bidirectional Sync:**

Workflow canvas ↔ YAML file stay synchronized:

```typescript
// src/renderer/services/workflow.service.ts
export class WorkflowEditorService {
  // Canvas → YAML
  async serializeToYAML(nodes: Node[], edges: Edge[]): Promise<string> {
    const workflow: WorkflowDefinition = {
      name: 'Untitled Workflow',
      version: '1.0',
      steps: nodes.map(node => ({
        id: node.id,
        type: node.type,
        inputs: node.data.inputs,
        outputs: node.data.outputs,
        // ... node-specific fields
      })),
      ui_metadata: {
        canvas: {
          zoom: reactFlowInstance.getZoom(),
          offset: reactFlowInstance.getViewport(),
        },
        nodes: nodes.map(node => ({
          id: node.id,
          position: node.position,
          color: node.data.color,
          icon: node.data.icon,
        })),
      },
    };

    return yaml.stringify(workflow);
  }

  // YAML → Canvas
  async deserializeFromYAML(yamlContent: string): Promise<{ nodes: Node[], edges: Edge[] }> {
    const workflow: WorkflowDefinition = yaml.parse(yamlContent);

    const nodes: Node[] = workflow.steps.map(step => {
      const uiMeta = workflow.ui_metadata?.nodes.find(n => n.id === step.id);

      return {
        id: step.id,
        type: step.type,
        position: uiMeta?.position || { x: 0, y: 0 },
        data: {
          ...step,
          color: uiMeta?.color,
          icon: uiMeta?.icon,
          status: { state: 'pending' },
        },
      };
    });

    // Build edges from step dependencies
    const edges: Edge[] = this.buildEdgesFromSteps(workflow.steps);

    return { nodes, edges };
  }
}
```

**Monaco Integration:**

```typescript
// When user clicks "Edit YAML" button
const handleEditYAML = async () => {
  const { nodes, edges } = useWorkflowStore.getState();

  // Serialize canvas to YAML
  const yamlContent = await workflowService.serializeToYAML(nodes, edges);

  // Save to temp file
  const tempPath = '/tmp/workflow.yaml';
  await window.api.writeFile(tempPath, yamlContent);

  // Open in Monaco editor (right panel)
  useEditorStore.getState().openFile(tempPath);

  // Watch for changes
  useEditorStore.getState().onFileSave(tempPath, async (newContent) => {
    // Deserialize YAML back to canvas
    const { nodes: newNodes, edges: newEdges } = await workflowService.deserializeFromYAML(newContent);

    // Update canvas
    useWorkflowStore.getState().setNodes(newNodes);
    useWorkflowStore.getState().setEdges(newEdges);
  });
};
```

### Workflow Explorer Panel

**Tree View:**

```typescript
// src/renderer/components/workflow/WorkflowExplorer.tsx
export const WorkflowExplorer: React.FC = () => {
  const { workflows, loadWorkflow, deleteWorkflow } = useWorkflowStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredWorkflows = workflows.filter(wf =>
    wf.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedTags.length === 0 || wf.tags?.some(t => selectedTags.includes(t)))
  );

  return (
    <Panel title="Workflows" className="workflow-explorer">
      <SearchBar value={searchTerm} onChange={setSearchTerm} />
      <TagFilter tags={allTags} selected={selectedTags} onChange={setSelectedTags} />

      <WorkflowTree>
        {filteredWorkflows.map(workflow => (
          <WorkflowItem
            key={workflow.name}
            workflow={workflow}
            onSelect={() => loadWorkflow(workflow.name)}
            onDelete={() => deleteWorkflow(workflow.name)}
            onDuplicate={() => duplicateWorkflow(workflow)}
          />
        ))}
      </WorkflowTree>

      <WorkflowActions>
        <Button onClick={createNewWorkflow}>New Workflow</Button>
        <Button onClick={importWorkflow}>Import</Button>
      </WorkflowActions>
    </Panel>
  );
};
```

---

## Implementation Phases

### Phase 1: Foundation (MVP - 3-4 weeks)

**Goal**: Basic workflow creation and execution

**Deliverables:**
- ✅ Workflow canvas with React Flow
- ✅ Python Script nodes (create, configure, test)
- ✅ Claude API nodes (create, configure, test)
- ✅ Input/Output nodes
- ✅ YAML serialization/deserialization
- ✅ Python script execution (stdin/stdout JSON)
- ✅ Basic workflow execution (linear, no conditionals)
- ✅ Workflow save/load
- ✅ Node testing UI

**Tasks Breakdown:**

**Wave 1.1: Project Setup & Dependencies (3-5 days)**
- Install React Flow package (`@xyflow/react`)
- Install YAML parser (`js-yaml` or `yaml`)
- Set up workflow directory structure
- Create workflow types in `src/shared/types/workflow.types.ts`
- Configure TypeScript for new types

**Wave 1.2: Workflow Canvas UI (5-7 days)**
- Create `WorkflowCanvas` component
- Integrate React Flow
- Create custom node components (Python, Claude, Input, Output)
- Implement drag-and-drop from node palette
- Add minimap, controls, background
- Test canvas rendering with mock data

**Wave 1.3: Workflow Store & State Management (3-5 days)**
- Create `useWorkflowStore` (Zustand)
- Implement add/remove/update node actions
- Implement edge creation (node connections)
- Implement node position updates
- Test state management thoroughly

**Wave 1.4: Main Process Services (5-7 days)**
- Create `WorkflowService` (main process)
- Create `PythonExecutor` (execute Python scripts)
- Implement stdin/stdout JSON interface
- Add IPC handlers for workflow operations
- Test Python execution with sample scripts

**Wave 1.5: Workflow Execution Engine (7-10 days)**
- Implement linear workflow execution (no conditionals)
- Implement variable interpolation (`${...}`)
- Implement node-to-node data flow
- Add execution status tracking
- Integrate with existing AIService for Claude nodes
- Test full workflow execution end-to-end

**Wave 1.6: YAML Serialization (3-5 days)**
- Implement canvas → YAML serialization
- Implement YAML → canvas deserialization
- Preserve UI metadata (positions, colors)
- Test round-trip (canvas → YAML → canvas)

**Wave 1.7: Workflow Explorer & File Integration (5-7 days)**
- Create `WorkflowExplorer` panel
- Implement workflow save/load via IPC
- Integrate with file explorer (show workflow files)
- Monaco editor opens YAML files
- Test workflow management

**Wave 1.8: Node Testing UI (3-5 days)**
- Add "Test" button to node components
- Implement single-node execution
- Show test results in modal
- Test with mock inputs

**Success Criteria (Phase 1):**
- ✅ User can create workflow with Python and Claude nodes
- ✅ User can connect nodes to define execution order
- ✅ User can test individual nodes in isolation
- ✅ User can execute full workflow
- ✅ User can save workflow to YAML file
- ✅ User can load workflow from YAML file
- ✅ Workflow execution integrates with existing AI service

### Phase 2: Advanced Features (4-5 weeks)

**Goal**: Control flow, error handling, advanced execution

**Deliverables:**
- ✅ Conditional nodes (if/else branching)
- ✅ Loop nodes (iterate over collections)
- ✅ File operation nodes (leverage existing tools)
- ✅ Error handling (retry, fallback)
- ✅ Execution visualizer (real-time status)
- ✅ Workflow validation (dependencies, types)
- ✅ Script contract validator

**Wave 2.1: Conditional Nodes (5-7 days)**
- Create `ConditionalNode` component
- Implement condition evaluation
- Support multiple branches (if/else if/else)
- Test conditional execution

**Wave 2.2: Loop Nodes (5-7 days)**
- Create `LoopNode` component
- Implement iteration over arrays
- Support loop variables
- Test loop execution

**Wave 2.3: File Operation Nodes (3-5 days)**
- Create `FileOperationNode` component
- Integrate with existing FileSystemService
- Support read, write, edit, delete operations
- Test file operations in workflows

**Wave 2.4: Error Handling (5-7 days)**
- Implement retry policies (exponential backoff)
- Implement fallback to alternative nodes
- Add error logging with context
- Test error scenarios

**Wave 2.5: Execution Visualizer (5-7 days)**
- Add real-time status indicators to nodes
- Create progress bar
- Show execution timeline
- Stream Claude responses live

**Wave 2.6: Workflow Validation (5-7 days)**
- Validate node dependencies (no cycles)
- Validate input/output types
- Validate variable references
- Show validation errors in UI

**Wave 2.7: Script Contract Validator (3-5 days)**
- Parse Python script docstrings
- Validate inputs/outputs match contract
- Show validation warnings

**Success Criteria (Phase 2):**
- ✅ User can create workflows with conditional logic
- ✅ User can loop over data collections
- ✅ User can perform file operations in workflows
- ✅ Workflows automatically retry on failure
- ✅ Execution visualizer shows real-time progress
- ✅ Workflow validation prevents invalid configurations

### Phase 3: Polish & Templates (2-3 weeks)

**Goal**: UX improvements, templates, production-ready

**Deliverables:**
- ✅ Workflow templates library
- ✅ AI-assisted prompt editing
- ✅ Improved node styling and icons
- ✅ Keyboard shortcuts
- ✅ Undo/redo support
- ✅ Workflow versioning
- ✅ Export/import workflows
- ✅ Documentation and examples

**Wave 3.1: Workflow Templates (5-7 days)**
- Create template system
- Pre-built templates (documentation, code review, etc.)
- Template preview and instantiation
- Test template usage

**Wave 3.2: AI-Assisted Prompt Editing (5-7 days)**
- Visual prompt editor modal
- Claude suggests prompt improvements
- Diff view for prompt changes
- Test prompt editing workflow

**Wave 3.3: UX Polish (5-7 days)**
- Improve node styling and icons
- Add keyboard shortcuts
- Implement undo/redo
- Improve error messages

**Wave 3.4: Versioning & Export (3-5 days)**
- Workflow version history
- Export workflows to share
- Import workflows from files
- Test import/export

**Wave 3.5: Documentation (3-5 days)**
- User guide for workflow creation
- Python script contract documentation
- Example workflows
- Video tutorials (optional)

**Success Criteria (Phase 3):**
- ✅ User can start from pre-built templates
- ✅ AI helps improve Claude prompts
- ✅ UX is polished and professional
- ✅ User can version and export workflows
- ✅ Comprehensive documentation available

---

## Integration with Existing Systems

### 1. File System Integration

**Workflow files stored alongside project files:**

```
project/
├── src/
├── workflows/           # NEW: Workflow directory
│   ├── doc-generator.yaml
│   ├── code-reviewer.yaml
│   └── scripts/
│       ├── fetch_repo.py
│       └── analyze_code.py
├── prompts/             # NEW: Prompt templates
│   ├── analyze_repo.txt
│   └── review_code.txt
└── package.json
```

**File Explorer shows workflows:**

```typescript
// src/renderer/components/file-explorer/FileExplorer.tsx
// Add support for .yaml workflow files

const getFileIcon = (path: string) => {
  if (path.endsWith('.yaml') && path.includes('/workflows/')) {
    return <WorkflowIcon />;  // Special icon for workflow files
  }
  // ... existing file type detection
};
```

**Monaco editor opens workflows:**

```typescript
// src/renderer/stores/editor.store.ts
// Add YAML syntax highlighting and workflow-specific features

const openFile = async (path: string) => {
  if (path.endsWith('.yaml') && path.includes('/workflows/')) {
    // Load workflow in canvas AND editor
    await useWorkflowStore.getState().loadWorkflow(path);
    // Also open in Monaco for text editing
  }
  // ... existing open file logic
};
```

### 2. AI Service Integration

**Claude nodes use existing AIService:**

```typescript
// src/main/services/WorkflowService.ts
async executeClaudeNode(step: WorkflowStep, context: ExecutionContext): Promise<any> {
  // Load prompt template
  const promptTemplate = await this.fileSystemService.readFile(step.prompt_template);

  // Interpolate variables
  const prompt = this.interpolateVariables(promptTemplate.data, step.inputs);

  // Call existing AIService (already integrated with AIChatSDK)
  const response = await this.aiService.sendMessage(prompt);

  // Extract outputs
  return {
    [step.outputs[0]]: response
  };
}
```

**Streaming support:**

```typescript
// For real-time execution visualizer
async streamClaudeNode(step: WorkflowStep, context: ExecutionContext): AsyncIterator<string> {
  const prompt = // ... prepare prompt

  // Use existing streaming API
  const stream = this.aiService.streamMessage(prompt);

  for await (const chunk of stream) {
    // Send to renderer for real-time display
    this.sendExecutionUpdate({
      nodeId: step.id,
      partialOutput: chunk,
    });

    yield chunk;
  }
}
```

### 3. Permission System Integration

**Workflows respect file operation permissions:**

```typescript
// src/main/services/WorkflowService.ts
async executeFileOperationNode(step: WorkflowStep): Promise<any> {
  // Check if permission required (existing PermissionService)
  if (await this.permissionService.requiresApproval(step.operation)) {
    // Show permission modal (existing pattern from Epic 3)
    const approved = await this.permissionService.requestPermission({
      operation: step.operation,
      filePath: step.inputs.file_path,
      preview: step.inputs.content?.substring(0, 100),
      context: 'workflow',  // NEW: Indicate source is workflow
      workflowName: this.currentWorkflow.name,  // NEW: Show which workflow
    });

    if (!approved) {
      throw new Error('File operation denied by user');
    }
  }

  // Execute using existing FileSystemService
  switch (step.operation) {
    case 'write':
      return await this.fileSystemService.writeFile(
        step.inputs.file_path,
        step.inputs.content
      );
    case 'read':
      return await this.fileSystemService.readFile(step.inputs.file_path);
    // ... other operations
  }
}
```

**Workflow execution permission:**

```typescript
// Before executing entire workflow, ask for batch approval
async executeWorkflow(workflowPath: string): Promise<WorkflowResult> {
  const workflow = await this.loadWorkflow(workflowPath);

  // Analyze workflow for required permissions
  const requiredPermissions = this.analyzePermissions(workflow);

  if (requiredPermissions.length > 0) {
    // Show batch permission request
    const approved = await this.permissionService.requestBatchPermission({
      permissions: requiredPermissions,
      context: `Workflow: ${workflow.name}`,
    });

    if (!approved) {
      return { success: false, error: 'Workflow execution denied' };
    }
  }

  // Execute workflow
  return await this.doExecuteWorkflow(workflow);
}
```

### 4. SOC Logging Integration

**Workflows automatically logged via AIChatSDK:**

```typescript
// src/main/services/WorkflowService.ts
async executeWorkflow(workflowPath: string): Promise<WorkflowResult> {
  const workflow = await this.loadWorkflow(workflowPath);

  // AIChatSDK automatically logs:
  // - Operation: "workflow.execute"
  // - Metadata: { workflow_name, version, step_count }
  // - Trace ID: Unique per execution

  const traceId = generateTraceId();

  // Log workflow start
  logger.info('[Workflow] Starting execution', {
    workflow: workflow.name,
    version: workflow.version,
    traceId,
    stepCount: workflow.steps.length,
  });

  // Execute steps
  for (const step of workflow.steps) {
    logger.info('[Workflow] Executing step', {
      workflow: workflow.name,
      step: step.id,
      type: step.type,
      traceId,
    });

    try {
      const result = await this.executeStep(step, context);

      logger.info('[Workflow] Step completed', {
        workflow: workflow.name,
        step: step.id,
        success: result.success,
        traceId,
      });
    } catch (error) {
      logger.error('[Workflow] Step failed', {
        workflow: workflow.name,
        step: step.id,
        error: error.message,
        traceId,
      });
      throw error;
    }
  }

  // All logs sent to SOC via existing AIChatSDK integration
  // No additional SOC integration code needed
}
```

### 5. Event-Based Visual Updates

**Workflows emit events for visual refresh (existing pattern from ADR-013):**

```typescript
// src/main/services/WorkflowService.ts
async executeStep(step: WorkflowStep, context: ExecutionContext): Promise<any> {
  // Emit event: step started
  this.emitWorkflowEvent({
    type: 'step_started',
    stepId: step.id,
    timestamp: Date.now(),
  });

  // Execute step
  const result = await this.doExecuteStep(step, context);

  // Emit event: step completed
  this.emitWorkflowEvent({
    type: 'step_completed',
    stepId: step.id,
    result,
    timestamp: Date.now(),
  });

  // If step modified files, emit file operation events (existing pattern)
  if (step.type === 'file_operation') {
    this.emitFileOperationEvent({
      operation: step.operation,
      paths: [step.inputs.file_path],
      timestamp: Date.now(),
    });
  }

  return result;
}

// Renderer listens for events
window.api.onWorkflowEvent((event: WorkflowEvent) => {
  const store = useWorkflowStore.getState();

  switch (event.type) {
    case 'step_started':
      store.updateNodeStatus(event.stepId, { state: 'running', startedAt: event.timestamp });
      break;
    case 'step_completed':
      store.updateNodeStatus(event.stepId, {
        state: 'success',
        completedAt: event.timestamp,
        outputs: event.result
      });
      break;
    case 'step_failed':
      store.updateNodeStatus(event.stepId, {
        state: 'error',
        error: event.error
      });
      break;
  }
});
```

### 6. Conversational Workflow Creation

**AI Chat can create/modify workflows:**

User in AI Chat: "Create a workflow that generates documentation for a repository"

Claude response (tool calls):
1. Create workflow YAML file
2. Create Python script for repo analysis
3. Create prompt template for documentation generation
4. Load workflow in canvas

```typescript
// src/main/tools/WorkflowTool.ts
export class CreateWorkflowTool extends BaseTool {
  name = 'create_workflow';
  description = 'Create a new workflow definition from natural language description';

  async execute(params: { description: string }): Promise<ToolResult> {
    // Use Claude to generate workflow definition
    const workflowYAML = await this.aiService.sendMessage(`
      Generate a workflow YAML definition for: ${params.description}

      Use this format:
      <example YAML structure>
    `);

    // Parse and validate
    const workflow = yaml.parse(workflowYAML);
    const validation = validateWorkflow(workflow);

    if (!validation.valid) {
      return { success: false, error: validation.errors };
    }

    // Save workflow file
    const workflowPath = `/workflows/${slugify(workflow.name)}.yaml`;
    await this.fileSystemService.writeFile(workflowPath, workflowYAML);

    // Load in canvas
    await this.workflowService.loadWorkflow(workflowPath);

    return {
      success: true,
      workflow_path: workflowPath,
      message: `Created workflow: ${workflow.name}`,
    };
  }
}
```

---

## Testing Strategy

### Unit Tests

**Services:**
```typescript
// src/main/services/__tests__/WorkflowService.test.ts
describe('WorkflowService', () => {
  it('should execute linear workflow', async () => {
    const workflow = createMockWorkflow([
      { id: 'step1', type: 'python', script: './test_script.py' },
      { id: 'step2', type: 'claude', prompt_template: './test_prompt.txt' },
    ]);

    const result = await workflowService.executeWorkflow(workflow);

    expect(result.success).toBe(true);
    expect(result.outputs).toBeDefined();
  });

  it('should handle step failure with retry', async () => {
    const workflow = createMockWorkflow([
      {
        id: 'step1',
        type: 'python',
        script: './failing_script.py',
        retry_policy: { max_attempts: 3, backoff: 'exponential' }
      },
    ]);

    // Mock script to fail twice, then succeed
    mockPythonExecutor.mockFailThenSucceed(2);

    const result = await workflowService.executeWorkflow(workflow);

    expect(result.success).toBe(true);
    expect(mockPythonExecutor.callCount).toBe(3);
  });
});
```

**Python Executor:**
```typescript
// src/main/services/__tests__/PythonExecutor.test.ts
describe('PythonExecutor', () => {
  it('should execute script with stdin/stdout JSON', async () => {
    const result = await pythonExecutor.executeScript('./test_script.py', {
      input_value: 'test',
    });

    expect(result.success).toBe(true);
    expect(result.output_value).toBeDefined();
  });

  it('should handle script errors', async () => {
    const result = await pythonExecutor.executeScript('./error_script.py', {});

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.traceback).toBeDefined();
  });
});
```

### Integration Tests

**End-to-End Workflow Execution:**
```typescript
// src/main/__tests__/workflow-integration.test.ts
describe('Workflow Integration', () => {
  it('should execute complete workflow with AI and file operations', async () => {
    // Create test workflow
    const workflowPath = await createTestWorkflow({
      steps: [
        { type: 'input', id: 'repo_url' },
        { type: 'python', id: 'fetch', script: './scripts/fetch_repo.py' },
        { type: 'claude', id: 'analyze', prompt_template: './prompts/analyze.txt' },
        { type: 'file_operation', id: 'save', operation: 'write' },
      ],
    });

    // Execute workflow
    const result = await workflowService.executeWorkflow(workflowPath);

    // Verify results
    expect(result.success).toBe(true);
    expect(result.outputs.documentation).toBeDefined();

    // Verify file was created
    const fileExists = await fileSystemService.exists(result.outputs.file_path);
    expect(fileExists).toBe(true);
  });
});
```

### Component Tests

**Workflow Canvas:**
```typescript
// src/renderer/components/workflow/__tests__/WorkflowCanvas.test.tsx
describe('WorkflowCanvas', () => {
  it('should render nodes from store', () => {
    const { getByTestId } = render(<WorkflowCanvas />);

    useWorkflowStore.setState({
      nodes: [
        { id: 'node1', type: 'python', data: { label: 'Test Node' } },
      ],
    });

    expect(getByTestId('node-node1')).toBeInTheDocument();
  });

  it('should add node on drag-drop', () => {
    const { getByTestId } = render(<WorkflowCanvas />);

    const paletteNode = getByTestId('palette-python');
    const canvas = getByTestId('workflow-canvas');

    // Simulate drag-drop
    fireEvent.dragStart(paletteNode);
    fireEvent.drop(canvas, { clientX: 100, clientY: 100 });

    // Verify node added to store
    const nodes = useWorkflowStore.getState().nodes;
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe('python');
  });
});
```

### Python Script Tests

**Sample script testing:**
```python
# scripts/__tests__/test_fetch_repo.py
import pytest
import json
from scripts.fetch_repo import main

def test_fetch_repo_success():
    inputs = {'repo_url': 'https://github.com/test/repo'}
    result = main(inputs)

    assert result['success'] == True
    assert 'repo_data' in result
    assert 'commit_count' in result

def test_fetch_repo_missing_input():
    inputs = {}
    result = main(inputs)

    assert result['success'] == False
    assert 'error' in result
    assert 'repo_url' in result['error']
```

**Contract validation testing:**
```typescript
// src/main/services/__tests__/ScriptValidator.test.ts
describe('ScriptValidator', () => {
  it('should validate script contract from docstring', async () => {
    const script = `
"""
Inputs:
  - repo_url: string (required)

Outputs:
  - repo_data: object
  - commit_count: integer
"""
    `;

    const validation = await scriptValidator.validate(script);

    expect(validation.inputs).toEqual([
      { name: 'repo_url', type: 'string', required: true },
    ]);
    expect(validation.outputs).toEqual([
      { name: 'repo_data', type: 'object' },
      { name: 'commit_count', type: 'integer' },
    ]);
  });
});
```

### Manual Testing Checklist

**Canvas Operations:**
- [ ] Drag Python node from palette to canvas
- [ ] Drag Claude node from palette to canvas
- [ ] Connect two nodes with edge
- [ ] Delete node (removes connected edges)
- [ ] Delete edge
- [ ] Move node position
- [ ] Zoom in/out
- [ ] Pan canvas
- [ ] Use minimap to navigate

**Workflow Execution:**
- [ ] Execute simple workflow (1-2 steps)
- [ ] Execute complex workflow (5+ steps with conditionals)
- [ ] Test individual node
- [ ] View real-time execution status
- [ ] See error when step fails
- [ ] Retry failed step

**File Integration:**
- [ ] Save workflow to YAML
- [ ] Load workflow from YAML
- [ ] Edit YAML in Monaco editor
- [ ] Changes in YAML reflect in canvas
- [ ] Changes in canvas reflect in YAML
- [ ] Open Python script in Monaco
- [ ] Edit Python script, see changes in workflow

**Error Handling:**
- [ ] Python script with syntax error
- [ ] Python script runtime error
- [ ] Missing required input
- [ ] Invalid variable reference
- [ ] Circular dependencies detected
- [ ] Timeout on long-running step

---

## Success Criteria

### MVP Success (Phase 1)

**Functional:**
- ✅ User can create workflow with drag-and-drop nodes
- ✅ User can connect nodes to define execution order
- ✅ User can execute Python scripts with JSON input/output
- ✅ User can execute Claude API calls with prompts
- ✅ User can test individual nodes in isolation
- ✅ User can execute complete workflow end-to-end
- ✅ User can save workflow to YAML file
- ✅ User can load workflow from YAML file
- ✅ Workflow integrates with existing AI service

**Technical:**
- ✅ Workflows follow SOLID principles
- ✅ Code reuses existing Lighthouse services
- ✅ No architecture changes to core systems
- ✅ TypeScript strict mode with no errors
- ✅ 80%+ test coverage on workflow services
- ✅ Performance: Execute 10-step workflow in <5 seconds

**User Experience:**
- ✅ Visual feedback during execution (status indicators)
- ✅ Clear error messages when workflow fails
- ✅ Intuitive drag-and-drop interface
- ✅ Responsive canvas (no lag with 20+ nodes)

### Full Success (Phase 3)

**Functional:**
- ✅ All MVP features plus:
- ✅ Conditional logic (if/else)
- ✅ Loops (iterate over collections)
- ✅ File operations (read, write, delete)
- ✅ Error retry with exponential backoff
- ✅ Real-time execution visualizer
- ✅ Workflow templates library
- ✅ AI-assisted prompt editing
- ✅ Export/import workflows

**Technical:**
- ✅ Script contract validator
- ✅ Workflow version history
- ✅ Comprehensive documentation
- ✅ Video tutorials

**Business:**
- ✅ 10+ pre-built workflow templates
- ✅ Workflow marketplace (future)
- ✅ Enterprise SOC logging validated
- ✅ Production-ready for client demos

---

## Risk Mitigation

### Risk 1: Python Execution Security

**Risk:** Executing arbitrary Python scripts could be security vulnerability

**Mitigation:**
1. **Path validation** (scripts must be in project directory)
2. **Permission prompts** (user approves before execution)
3. **Script review** (Monaco editor shows script before execution)
4. **Timeout limits** (prevent infinite loops)
5. **Process isolation** (Python scripts run in separate process, limited permissions)

**Status:** Medium risk, addressable with implemented security measures

### Risk 2: React Flow Learning Curve

**Risk:** Team unfamiliar with React Flow library

**Mitigation:**
1. **Research validation** (industry standard, mature library)
2. **Excellent documentation** (official React Flow docs are comprehensive)
3. **Active community** (Stack Overflow, GitHub discussions)
4. **Simple MVP first** (basic nodes before complex features)
5. **Prototyping** (build simple proof-of-concept first)

**Status:** Low risk, React Flow is well-documented and stable

### Risk 3: YAML Complexity

**Risk:** YAML format could be confusing for users

**Mitigation:**
1. **Visual-first approach** (users rarely edit YAML directly)
2. **YAML validation** (real-time error checking)
3. **Schema documentation** (clear examples and templates)
4. **Auto-formatting** (pretty-print YAML on save)
5. **Templates** (users start from working examples)

**Status:** Low risk, YAML is proven format (GitHub Actions)

### Risk 4: Claude API Rate Limits

**Risk:** Workflows could hit Claude API rate limits

**Mitigation:**
1. **Rate limit detection** (catch 429 errors)
2. **Exponential backoff** (automatic retry with delays)
3. **User warnings** (show rate limit status)
4. **Caching** (cache repeated Claude calls)
5. **Batch optimization** (combine multiple prompts when possible)

**Status:** Medium risk, mitigated with retry logic

### Risk 5: Variable Interpolation Edge Cases

**Risk:** `${...}` variable syntax could have edge cases

**Mitigation:**
1. **Comprehensive testing** (unit tests for interpolation)
2. **Type validation** (ensure referenced variables exist)
3. **Clear error messages** (show which variable failed)
4. **Validation before execution** (catch errors before workflow runs)
5. **Documentation** (clear examples of variable usage)

**Status:** Low risk, well-defined specification

### Risk 6: Performance with Large Workflows

**Risk:** Canvas could lag with 100+ nodes

**Mitigation:**
1. **React Flow virtualization** (built-in, handles 1000+ nodes)
2. **Lazy loading** (only render visible nodes)
3. **Debounced updates** (batch state changes)
4. **Performance testing** (test with large workflows)
5. **Minimap optimization** (simplified rendering)

**Status:** Low risk, React Flow handles large graphs

---

## Appendix A: Full YAML Specification

*See `lighthouse-workflow-specification.md` for complete specification*

## Appendix B: Python Script Contract

*See `lighthouse-workflow-specification.md` for complete contract definition*

## Appendix C: Research Citations

1. **n8n Guide 2026** - https://hatchworks.com/blog/ai-agents/n8n-guide/
2. **React Flow Documentation** - https://reactflow.dev
3. **Langflow GitHub** - https://github.com/langflow-ai/langflow
4. **Kestra Python Integration** - https://kestra.io/features/code-in-any-language/python
5. **GitHub Actions Workflow Syntax** - https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions
6. **Claude Prompt Engineering** - https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices

---

**Document Status:** Complete - Ready for Review
**Next Steps:** Review, refine, and proceed to Wave 1.1 implementation when approved
**Last Updated:** 2026-01-21
