# Integration Plan: Adding Workflows & RAG to Lighthouse_Cursor_Extension

**Status:** Planning / Under Review
**Created:** January 25, 2026
**Last Updated:** January 25, 2026
**Target Extension:** Lighthouse_Cursor_Extension (v0.8.1)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Extension Analysis](#current-extension-analysis)
3. [Integration Architecture](#integration-architecture)
4. [What We're Adding](#what-were-adding)
5. [Code Integration Strategy](#code-integration-strategy)
6. [Service Layer Integration](#service-layer-integration)
7. [UI Integration](#ui-integration)
8. [MCP Server Integration](#mcp-server-integration)
9. [Migration Path](#migration-path)
10. [File Structure](#file-structure)
11. [Implementation Phases](#implementation-phases)
12. [Benefits of This Approach](#benefits-of-this-approach)
13. [Risks & Mitigation](#risks--mitigation)

---

## Executive Summary

### The Opportunity

We have **two major assets**:
1. **Lighthouse_Cursor_Extension** - Mature VS Code extension with monitoring, compliance, and 17 AI agents
2. **Lighthouse-Beacon** - Comprehensive workflow execution and RAG knowledge base implementation

### The Integration Plan

**Add to Lighthouse_Cursor_Extension:**
- ⚡ **Workflow Builder** - Visual workflow creation and execution (new Activity Bar panel)
- 🧠 **Knowledge Base** - RAG-powered code context (new Activity Bar panel)
- 🔌 **MCP Server** - Expose workflows and RAG to Claude Code

### What This Gives Users

```
Lighthouse AI Assistant Extension becomes:

├─ 📊 Activity Monitor (existing)
├─ 🏥 Service Health (existing)
├─ ⚡ Workflow Builder (NEW - from lighthouse-beacon)
├─ 🧠 Knowledge Base (NEW - from lighthouse-beacon)
└─ 🔌 MCP Tools (NEW - workflows + RAG tools for Claude Code)

One extension with:
✓ Claude Code monitoring & compliance
✓ 17 AI agents + 14 commands + 13 skills
✓ Visual workflow builder
✓ RAG knowledge base
✓ MCP integration for Claude Code automation
```

---

## Current Extension Analysis

### Existing Architecture (Lighthouse_Cursor_Extension)

**Current Components:**

```
Lighthouse_Cursor_Extension/
├── src/
│   ├── extension.ts                  # Extension entry point
│   ├── services/                     # 36 service files
│   │   ├── AuthManager.ts           # Azure AD SSO
│   │   ├── SessionManager.ts        # Claude session tracking
│   │   ├── TranscriptMonitorService.ts
│   │   ├── EventStreamer.ts         # AI-SOC streaming
│   │   ├── FileWatcherService.ts
│   │   ├── ProjectInitService.ts    # Deploy agents/commands
│   │   ├── GlobalServices.ts        # Service container
│   │   └── init/                    # 13 installation services
│   │       ├── AgentInstallationService.ts
│   │       ├── CommandInstallationService.ts
│   │       ├── SkillsInstallationService.ts
│   │       └── TemplateInstallationService.ts
│   ├── handlers/                    # Command handlers
│   ├── ui/                          # Tree views
│   ├── utils/                       # Utilities
│   └── models/                      # TypeScript models
└── package.json
```

**Current Activity Bar (from package.json):**

```json
"viewsContainers": {
  "activitybar": [
    {
      "id": "lighthouse-explorer",
      "title": "Lighthouse AI",
      "icon": "$(lighthouse)"
    }
  ]
},
"views": {
  "lighthouse-explorer": [
    {
      "id": "lighthouse.activityView",
      "name": "Activity Monitor"
    },
    {
      "id": "lighthouse.healthView",
      "name": "Service Health"
    }
  ]
}
```

**Key Capabilities:**
- ✅ Session-centric monitoring (Epic 101)
- ✅ Azure AD authentication
- ✅ AI-SOC event streaming
- ✅ 17 specialized AI agents
- ✅ 14+ Lighthouse commands
- ✅ 13 production skills
- ✅ Template system
- ✅ Mature service architecture

### What's Missing (That We're Adding)

❌ Visual workflow builder
❌ Workflow execution engine
❌ RAG knowledge base
❌ Vector search service
❌ Document chunking & indexing
❌ MCP server for Claude Code integration

---

## Integration Architecture

### High-Level Architecture After Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│              Lighthouse AI Assistant Extension                      │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Activity Bar                                │ │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐           │ │
│  │  │  📊  │  │  🏥  │  │  ⚡  │  │  🧠  │  │ ...  │           │ │
│  │  │Activity│ │Health│ │Workflow│ │ KB  │  │      │           │ │
│  │  │Monitor │ │      │ │Builder │ │     │  │      │           │ │
│  │  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘  └──────┘           │ │
│  │     │         │         │         │                           │ │
│  │  EXISTING     EXISTING  NEW       NEW                         │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              Extension Host (Node.js)                          │ │
│  │                                                                │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │  Existing Services (Keep As-Is)                          │  │ │
│  │  │  - AuthManager                                            │  │ │
│  │  │  - SessionManager                                         │  │ │
│  │  │  - EventStreamer                                          │  │ │
│  │  │  - FileWatcherService                                     │  │ │
│  │  │  - ProjectInitService                                     │  │ │
│  │  │  - Agent/Command/Skills Installation                      │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │  New Services (From lighthouse-beacon)                   │  │ │
│  │  │  - VectorService.ts                                       │  │ │
│  │  │  - WorkflowExecutor.ts                                    │  │ │
│  │  │  - RAGService.ts                                          │  │ │
│  │  │  - DocumentChunker.ts                                     │  │ │
│  │  │  - EmbeddingService.ts                                    │  │ │
│  │  │  - PythonExecutor.ts                                      │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │  New Webview Providers                                   │  │ │
│  │  │  - WorkflowWebviewProvider.ts                             │  │ │
│  │  │  - KnowledgeWebviewProvider.ts                            │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │  New MCP Server (Bundled)                                │  │ │
│  │  │  - Exposes workflow tools                                │  │ │
│  │  │  - Exposes RAG tools                                      │  │ │
│  │  │  - Uses new services                                      │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              Webview Panels (React)                            │ │
│  │                                                                │ │
│  │  ┌─────────────────────────┐   ┌─────────────────────────┐   │ │
│  │  │  Workflow Builder UI    │   │  Knowledge Base UI      │   │ │
│  │  │  (From lighthouse-beacon)│   │  (From lighthouse-beacon)│   │ │
│  │  │  - React Flow canvas    │   │  - DocumentList         │   │ │
│  │  │  - Node components      │   │  - MemoryUsageBar       │   │ │
│  │  │  - Execution visualizer │   │  - RAGToggle            │   │ │
│  │  └─────────────────────────┘   └─────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │     Claude Code CLI            │
                    │  Discovers MCP Server via:     │
                    │  - Auto-configuration          │
                    │                                │
                    │  New Tools Available:          │
                    │  - list_workflows              │
                    │  - execute_workflow            │
                    │  - search_knowledge_base       │
                    │  - index_document              │
                    └────────────────────────────────┘
```

### Integration Strategy

**Keep Existing:**
- ✅ All current monitoring and compliance features
- ✅ All 17 AI agents
- ✅ All 14+ commands
- ✅ All 13 skills
- ✅ Existing Activity Bar views
- ✅ Existing service architecture

**Add New:**
- ➕ Two new Activity Bar panels (Workflows, Knowledge Base)
- ➕ Services from lighthouse-beacon (VectorService, WorkflowExecutor, RAGService, etc.)
- ➕ Webview providers for new panels
- ➕ MCP server for Claude Code integration
- ➕ React UI components from lighthouse-beacon

**Minimal Changes to Existing:**
- Update package.json (add new views, dependencies)
- Update extension.ts (register new providers, spawn MCP server)
- Update GlobalServices (add new services to container)
- Add new commands for workflows and knowledge base

---

## What We're Adding

### Feature 1: Workflow Builder

**What Users Get:**
- ⚡ New "Workflow Builder" panel in Activity Bar
- Visual workflow creation with React Flow
- Drag-and-drop workflow editing
- Execute workflows from UI
- Real-time execution visualization

**Services Needed (from lighthouse-beacon):**
- `WorkflowExecutor.ts` - Execute workflows
- `PythonExecutor.ts` - Run Python scripts securely
- `WorkflowValidator.ts` - Validate workflow definitions
- `YamlParser.ts` - Parse YAML workflows

**UI Components Needed:**
- `WorkflowCanvas.tsx` - React Flow canvas
- `PythonScriptNode.tsx`, `ConditionalNode.tsx`, etc. - Node components
- `ExecutionVisualizer.tsx` - Real-time execution display
- `WorkflowToolbar.tsx` - Save, execute, test buttons

**MCP Tools Exposed:**
```typescript
- list_workflows() → WorkflowMetadata[]
- execute_workflow(name, inputs) → WorkflowExecutionResult
- validate_workflow(workflow) → ValidationResult
- get_workflow_status(workflowId) → ExecutionStatus
```

### Feature 2: RAG Knowledge Base

**What Users Get:**
- 🧠 New "Knowledge Base" panel in Activity Bar
- Document indexing and management
- Memory usage tracking (500MB budget)
- RAG toggle for enabling/disabling
- Source citations in responses

**Services Needed (from lighthouse-beacon):**
- `VectorService.ts` - Vector search with Vectra
- `RAGService.ts` - RAG orchestration
- `EmbeddingService.ts` - Transformers.js embeddings
- `DocumentChunker.ts` - Fixed-size chunking
- `TokenCounter.ts` - Token counting
- `ContextBuilder.ts` - Context assembly
- `MemoryMonitor.ts` - Memory tracking

**UI Components Needed:**
- `DocumentList.tsx` - List of indexed documents
- `MemoryUsageBar.tsx` - Visual memory indicator
- `RAGToggle.tsx` - Enable/disable RAG
- `AddFilesDialog.tsx` - Add files/folders
- `IndexingProgress.tsx` - Progress display

**MCP Tools Exposed:**
```typescript
- search_knowledge_base(query, topK) → SearchResult[]
- index_document(filePath) → IndexResult
- remove_document(documentId) → void
- get_kb_stats() → VectorIndexStats
- clear_knowledge_base() → void
```

### Feature 3: MCP Server Integration

**What Claude Code Gets:**
- Automatic tool discovery
- Workflow execution capabilities
- RAG context retrieval
- Seamless integration with existing commands/agents

**Architecture:**
- MCP server spawned by extension host
- Stdio transport communication
- Shares services with extension
- Auto-configured for Claude Code

---

## Code Integration Strategy

### Phase 1: Copy Services (No Changes to Existing)

**From lighthouse-beacon to Lighthouse_Cursor_Extension:**

```bash
# Copy service files
lighthouse-beacon/src/main/services/vector/
  → Lighthouse_Cursor_Extension/src/services/vector/

lighthouse-beacon/src/main/services/workflow/
  → Lighthouse_Cursor_Extension/src/services/workflow/

lighthouse-beacon/src/main/services/rag/
  → Lighthouse_Cursor_Extension/src/services/rag/
```

**Files to Copy:**

**Vector Services:**
- `VectorService.ts`
- `EmbeddingService.ts`
- `MemoryMonitor.ts`
- `IndexPersistence.ts`

**Workflow Services:**
- `WorkflowExecutor.ts`
- `PythonExecutor.ts`
- `WorkflowValidator.ts`
- `YamlParser.ts`
- `ConditionEvaluator.ts`
- `VariableResolver.ts`

**RAG Services:**
- `RAGService.ts`
- `DocumentChunker.ts`
- `TokenCounter.ts`
- `ContextBuilder.ts`
- `PromptBuilder.ts`

**Shared Types:**
- `workflow.types.ts`
- `vector.types.ts`
- `rag.types.ts`

### Phase 2: Add Webview Providers

**New Files to Create:**

```
Lighthouse_Cursor_Extension/src/webviews/
├── BaseWebviewProvider.ts       # Base class (reusable)
├── WorkflowWebviewProvider.ts   # Workflow panel
└── KnowledgeWebviewProvider.ts  # Knowledge panel
```

**Pattern to Follow:**
- Extend existing patterns from `src/ui/` if any
- Use VS Code webview best practices
- Handle postMessage communication
- Manage webview lifecycle

### Phase 3: Add MCP Server

**New Files to Create:**

```
Lighthouse_Cursor_Extension/src/mcp/
├── index.ts                     # MCP server entry
├── tools/
│   ├── workflow-tools.ts       # Workflow MCP tools
│   ├── knowledge-tools.ts      # RAG MCP tools
│   └── index.ts
└── resources/
    └── index.ts                # MCP resources
```

**Integration:**
- Spawn from extension.ts on activation
- Use stdio transport
- Share services with extension
- Handle process lifecycle

### Phase 4: Add React UI Components

**Copy from lighthouse-beacon:**

```bash
lighthouse-beacon/src/renderer/components/workflow/
  → Lighthouse_Cursor_Extension/webview-ui/workflow/

lighthouse-beacon/src/renderer/components/knowledge/
  → Lighthouse_Cursor_Extension/webview-ui/knowledge/
```

**Adapt for VS Code:**
- Change `window.electronAPI` to `acquireVsCodeApi()`
- Update IPC calls to use postMessage
- Otherwise keep components identical

---

## Service Layer Integration

### GlobalServices Extension

**Current GlobalServices.ts:**

```typescript
export class GlobalServices {
  private static instance: GlobalServices;

  public readonly logger: vscode.LogOutputChannel;
  public readonly authManager: AuthManager;
  public readonly aiSocClient: AISocServiceClient;

  private constructor(context: vscode.ExtensionContext) {
    this.logger = vscode.window.createOutputChannel('Lighthouse AI', { log: true });
    this.authManager = new AuthManager(context, this.logger);
    this.aiSocClient = new AISocServiceClient(this.logger);
  }

  static initialize(context: vscode.ExtensionContext): GlobalServices {
    // ...
  }
}
```

**Extended GlobalServices.ts:**

```typescript
export class GlobalServices {
  private static instance: GlobalServices;

  // Existing services
  public readonly logger: vscode.LogOutputChannel;
  public readonly authManager: AuthManager;
  public readonly aiSocClient: AISocServiceClient;

  // NEW: Workflow & RAG services
  public readonly vectorService: VectorService;
  public readonly workflowExecutor: WorkflowExecutor;
  public readonly ragService: RAGService;
  public readonly embeddingService: EmbeddingService;

  private constructor(context: vscode.ExtensionContext) {
    this.logger = vscode.window.createOutputChannel('Lighthouse AI', { log: true });
    this.authManager = new AuthManager(context, this.logger);
    this.aiSocClient = new AISocServiceClient(this.logger);

    // NEW: Initialize workflow and RAG services
    this.embeddingService = new EmbeddingService(this.logger);
    this.vectorService = new VectorService(this.embeddingService, this.logger);
    this.workflowExecutor = new WorkflowExecutor(this.logger);
    this.ragService = new RAGService(this.vectorService, this.logger);
  }

  static initialize(context: vscode.ExtensionContext): GlobalServices {
    // ...
  }
}
```

**Benefits:**
- ✅ Reuses existing service container pattern
- ✅ Single logger for all services
- ✅ Easy access from anywhere: `GlobalServices.getInstance().vectorService`
- ✅ Minimal changes to existing architecture

---

## UI Integration

### Update package.json

**Add New Views:**

```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "lighthouse-explorer",
          "title": "Lighthouse AI",
          "icon": "$(lighthouse)"
        }
      ]
    },
    "views": {
      "lighthouse-explorer": [
        {
          "id": "lighthouse.activityView",
          "name": "Activity Monitor"
        },
        {
          "id": "lighthouse.healthView",
          "name": "Service Health"
        },
        {
          "type": "webview",
          "id": "lighthouse.workflowBuilder",
          "name": "Workflow Builder"
        },
        {
          "type": "webview",
          "id": "lighthouse.knowledgeBase",
          "name": "Knowledge Base"
        }
      ]
    },
    "commands": [
      // ... existing commands ...
      {
        "command": "lighthouse.workflows.new",
        "title": "New Workflow",
        "category": "Lighthouse"
      },
      {
        "command": "lighthouse.workflows.execute",
        "title": "Execute Workflow",
        "category": "Lighthouse"
      },
      {
        "command": "lighthouse.knowledge.addFile",
        "title": "Add File to Knowledge Base",
        "category": "Lighthouse"
      },
      {
        "command": "lighthouse.knowledge.addFolder",
        "title": "Add Folder to Knowledge Base",
        "category": "Lighthouse"
      }
    ]
  }
}
```

**Add New Dependencies:**

```json
{
  "dependencies": {
    "axios": "^1.5.0",
    "ws": "^8.13.0",
    // NEW dependencies
    "reactflow": "^11.10.0",
    "vectra": "^0.4.0",
    "@xenova/transformers": "^2.10.0",
    "@modelcontextprotocol/sdk": "^0.5.0",
    "js-yaml": "^4.1.0"
  }
}
```

### Update extension.ts

**Add Webview Registration:**

```typescript
// extension.ts
import { WorkflowWebviewProvider } from './webviews/WorkflowWebviewProvider';
import { KnowledgeWebviewProvider } from './webviews/KnowledgeWebviewProvider';
import { startMCPServer } from './mcp';

export async function activate(context: vscode.ExtensionContext) {
  // Existing activation code...
  const globalServices = GlobalServices.initialize(context);

  // NEW: Register workflow and knowledge base webviews
  const workflowProvider = new WorkflowWebviewProvider(
    context.extensionUri,
    globalServices.workflowExecutor
  );
  const knowledgeProvider = new KnowledgeWebviewProvider(
    context.extensionUri,
    globalServices.vectorService,
    globalServices.ragService
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'lighthouse.workflowBuilder',
      workflowProvider
    ),
    vscode.window.registerWebviewViewProvider(
      'lighthouse.knowledgeBase',
      knowledgeProvider
    )
  );

  // NEW: Register workflow and knowledge commands
  registerWorkflowCommands(context, globalServices);
  registerKnowledgeCommands(context, globalServices);

  // NEW: Start MCP server
  const mcpServer = await startMCPServer(context, globalServices);
  context.subscriptions.push({
    dispose: () => mcpServer.kill()
  });

  // Existing code continues...
}

function registerWorkflowCommands(
  context: vscode.ExtensionContext,
  services: GlobalServices
) {
  context.subscriptions.push(
    vscode.commands.registerCommand('lighthouse.workflows.new', async () => {
      // Implementation
    }),
    vscode.commands.registerCommand('lighthouse.workflows.execute', async (name) => {
      const result = await services.workflowExecutor.execute(name);
      // Show results
    })
  );
}

function registerKnowledgeCommands(
  context: vscode.ExtensionContext,
  services: GlobalServices
) {
  context.subscriptions.push(
    vscode.commands.registerCommand('lighthouse.knowledge.addFile', async (uri) => {
      await services.vectorService.indexDocument(uri.fsPath);
      vscode.window.showInformationMessage('Document indexed successfully');
    }),
    vscode.commands.registerCommand('lighthouse.knowledge.addFolder', async (uri) => {
      // Implementation
    })
  );
}
```

---

## MCP Server Integration

### MCP Server Implementation

**New File: `src/mcp/index.ts`**

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GlobalServices } from '../services/GlobalServices';
import { registerWorkflowTools } from './tools/workflow-tools';
import { registerKnowledgeTools } from './tools/knowledge-tools';

export async function startMCPServer(
  context: vscode.ExtensionContext,
  services: GlobalServices
): Promise<ChildProcess> {
  // Spawn MCP server as separate process
  const serverPath = vscode.Uri.joinPath(
    context.extensionUri,
    'dist',
    'mcp-server.js'
  ).fsPath;

  const process = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      LIGHTHOUSE_CONTEXT: context.globalStorageUri.fsPath
    }
  });

  // Auto-configure for Claude Code
  await configureMCPForClaudeCode(context);

  return process;
}

async function configureMCPForClaudeCode(context: vscode.ExtensionContext) {
  // Write .mcp.json configuration
  const mcpConfig = {
    "lighthouse-ai": {
      "transport": "stdio",
      "command": "node",
      "args": [/* server path */],
      "metadata": {
        "description": "Lighthouse workflows and RAG knowledge base"
      }
    }
  };

  // Write to workspace .mcp.json
  // Claude Code will auto-discover
}
```

**MCP Server Entry: `src/mcp/server.ts`**

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Import services (these run in MCP server process)
import { VectorService } from '../services/vector/VectorService';
import { WorkflowExecutor } from '../services/workflow/WorkflowExecutor';
import { RAGService } from '../services/rag/RAGService';

const server = new Server({
  name: 'lighthouse-ai',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {},
    resources: {}
  }
});

// Initialize services
const vectorService = new VectorService(/* ... */);
const workflowExecutor = new WorkflowExecutor(/* ... */);
const ragService = new RAGService(vectorService);

// Register tools
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'list_workflows',
      description: 'List all available automation workflows',
      inputSchema: { type: 'object', properties: {} }
    },
    {
      name: 'execute_workflow',
      description: 'Execute an automation workflow by name',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          inputs: { type: 'object' }
        },
        required: ['name']
      }
    },
    {
      name: 'search_knowledge_base',
      description: 'Search RAG knowledge base',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          topK: { type: 'number', default: 5 }
        },
        required: ['query']
      }
    },
    // ... more tools
  ]
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'list_workflows':
      return { content: [{ type: 'text', text: JSON.stringify(workflowExecutor.list()) }] };

    case 'execute_workflow':
      const result = await workflowExecutor.execute(args.name, args.inputs);
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };

    case 'search_knowledge_base':
      const results = await ragService.search(args.query, args.topK);
      return { content: [{ type: 'text', text: JSON.stringify(results) }] };
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## Migration Path

### Step-by-Step Integration

#### Week 1: Foundation

**Day 1-2: Copy Services**
- Copy all vector, workflow, and RAG services from lighthouse-beacon
- Update imports to match Lighthouse_Cursor_Extension structure
- Add to GlobalServices container
- Run tests to verify services work

**Day 3-4: Add Webview Scaffolding**
- Create WorkflowWebviewProvider and KnowledgeWebviewProvider
- Register in package.json
- Create empty webviews (placeholder HTML)
- Verify panels appear in Activity Bar

**Day 5: MCP Server Scaffold**
- Create MCP server structure
- Implement one test tool (list_workflows)
- Test from command line
- Verify Claude Code can discover it

#### Week 2: Workflow Builder

**Day 1-2: Copy React Components**
- Copy workflow UI components from lighthouse-beacon
- Set up vite build for webviews
- Adapt components for VS Code (postMessage instead of IPC)

**Day 3-4: Connect UI to Services**
- Wire up WorkflowWebviewProvider to WorkflowExecutor
- Implement message handlers
- Test workflow creation and saving

**Day 5: MCP Workflow Tools**
- Implement all workflow MCP tools
- Test with Claude Code CLI
- Verify workflows execute from Claude

#### Week 3: Knowledge Base

**Day 1-2: Copy RAG UI Components**
- Copy knowledge base components from lighthouse-beacon
- Set up vite build
- Adapt for VS Code

**Day 3-4: Connect UI to Services**
- Wire up KnowledgeWebviewProvider to VectorService/RAGService
- Implement document indexing flow
- Test memory monitoring

**Day 5: MCP RAG Tools**
- Implement all RAG MCP tools
- Test knowledge base search from Claude
- Verify source citations work

#### Week 4: Polish & Testing

**Day 1-2: Integration Testing**
- Test all features together
- Verify existing features still work
- Performance testing

**Day 3-4: Documentation**
- Update README
- User documentation
- Developer documentation

**Day 5: Release Preparation**
- Version bump (0.8.1 → 0.9.0)
- Package extension
- Prepare for deployment

---

## File Structure

### After Integration

```
Lighthouse_Cursor_Extension/
├── package.json                    # Updated with new views, commands, deps
├── src/
│   ├── extension.ts               # Updated to register new features
│   │
│   ├── services/                  # Existing + new services
│   │   ├── AuthManager.ts        # Existing
│   │   ├── SessionManager.ts     # Existing
│   │   ├── EventStreamer.ts      # Existing
│   │   ├── GlobalServices.ts     # UPDATED (add new services)
│   │   │
│   │   ├── vector/               # NEW (from lighthouse-beacon)
│   │   │   ├── VectorService.ts
│   │   │   ├── EmbeddingService.ts
│   │   │   ├── MemoryMonitor.ts
│   │   │   └── IndexPersistence.ts
│   │   │
│   │   ├── workflow/             # NEW (from lighthouse-beacon)
│   │   │   ├── WorkflowExecutor.ts
│   │   │   ├── PythonExecutor.ts
│   │   │   ├── WorkflowValidator.ts
│   │   │   └── YamlParser.ts
│   │   │
│   │   └── rag/                  # NEW (from lighthouse-beacon)
│   │       ├── RAGService.ts
│   │       ├── DocumentChunker.ts
│   │       ├── TokenCounter.ts
│   │       └── ContextBuilder.ts
│   │
│   ├── webviews/                  # NEW
│   │   ├── BaseWebviewProvider.ts
│   │   ├── WorkflowWebviewProvider.ts
│   │   └── KnowledgeWebviewProvider.ts
│   │
│   ├── mcp/                       # NEW
│   │   ├── index.ts              # MCP server spawn/management
│   │   ├── server.ts             # MCP server entry point
│   │   └── tools/
│   │       ├── workflow-tools.ts
│   │       └── knowledge-tools.ts
│   │
│   ├── handlers/                  # Existing + new command handlers
│   │   ├── ...existing...
│   │   ├── workflow-handlers.ts  # NEW
│   │   └── knowledge-handlers.ts # NEW
│   │
│   └── models/                    # Existing + new types
│       ├── ...existing...
│       ├── workflow.types.ts     # NEW
│       ├── vector.types.ts       # NEW
│       └── rag.types.ts          # NEW
│
├── webview-ui/                    # NEW (React apps)
│   ├── workflow/
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── WorkflowBuilder.tsx
│   │   │   └── components/       # From lighthouse-beacon
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   └── knowledge/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── KnowledgeBase.tsx
│       │   └── components/       # From lighthouse-beacon
│       ├── index.html
│       └── vite.config.ts
│
├── dist/                          # Build output
│   ├── extension.js              # Existing
│   ├── mcp-server.js             # NEW
│   ├── workflow-webview/         # NEW
│   │   ├── index.js
│   │   └── index.css
│   └── knowledge-webview/        # NEW
│       ├── index.js
│       └── index.css
│
└── webpack.config.js              # Updated for multiple entries
```

---

## Implementation Phases

### Phase 1: Services Integration (Week 1)

**Goal:** Get all backend services working in Lighthouse_Cursor_Extension

**Tasks:**
1. Copy service files from lighthouse-beacon
2. Update imports and paths
3. Add to GlobalServices
4. Write integration tests
5. Verify services work independently

**Acceptance Criteria:**
- ✅ All services compile
- ✅ Unit tests pass
- ✅ No conflicts with existing services
- ✅ Services accessible via GlobalServices

### Phase 2: Webview UI (Week 2)

**Goal:** Get React UIs displaying in new Activity Bar panels

**Tasks:**
1. Create webview providers
2. Set up vite build for React apps
3. Copy React components from lighthouse-beacon
4. Adapt components for VS Code (postMessage)
5. Implement message handlers in providers
6. Connect UI to services

**Acceptance Criteria:**
- ✅ Workflow Builder panel displays
- ✅ Knowledge Base panel displays
- ✅ Can create workflows visually
- ✅ Can add documents to knowledge base
- ✅ UI updates reflect service state

### Phase 3: MCP Server (Week 3)

**Goal:** Claude Code can use workflows and RAG via MCP

**Tasks:**
1. Create MCP server entry point
2. Implement workflow tools
3. Implement RAG tools
4. Set up stdio transport
5. Auto-configure for Claude Code
6. Test integration with Claude Code CLI

**Acceptance Criteria:**
- ✅ MCP server spawns on extension activation
- ✅ Claude Code discovers tools
- ✅ Can execute workflows from Claude
- ✅ Can search knowledge base from Claude
- ✅ Tools return correct results

### Phase 4: Polish & Release (Week 4)

**Goal:** Production-ready release

**Tasks:**
1. Integration testing
2. Performance testing
3. Update documentation
4. Version bump (0.8.1 → 0.9.0)
5. Package extension
6. Create release notes

**Acceptance Criteria:**
- ✅ All features working together
- ✅ No regressions in existing features
- ✅ Performance within targets
- ✅ Documentation complete
- ✅ Extension packaged and tested

---

## Benefits of This Approach

### 1. Leverage Existing Infrastructure

✅ **Reuse Mature Extension:**
- Already published and used
- Established user base
- Proven service architecture
- Existing monitoring and compliance features

✅ **Minimal Disruption:**
- Existing features continue working
- No changes to core architecture
- Additive, not replacement

### 2. Unified User Experience

✅ **One Extension:**
- Users install one extension, get everything
- Consistent UI/UX
- Single configuration
- Unified Activity Bar

✅ **Integrated Features:**
- Workflows can use existing agents/commands
- RAG enhances existing Claude monitoring
- MCP tools available alongside existing functionality

### 3. Code Reuse

✅ **90% of Lighthouse-Beacon Services:**
- Copy services as-is
- Minimal adaptation needed
- Proven, tested code

✅ **React Components:**
- Copy UI components
- Only need postMessage adapter
- Visual workflow builder intact

### 4. Faster Time to Market

✅ **3-4 Weeks vs 8-12 Weeks:**
- Extension scaffold already exists
- Service patterns established
- Build system in place
- Testing infrastructure ready

### 5. Better for Users

✅ **No Decision Paralysis:**
- One extension, not two
- Clear value proposition
- All features integrated

✅ **Consistent Experience:**
- Same configuration system
- Same authentication
- Same logging/monitoring

---

## Risks & Mitigation

### Risk 1: Extension Size Bloat

**Risk:** Adding workflows + RAG could make extension too large

**Mitigation:**
- Lazy load webviews (only when panels opened)
- Bundle MCP server separately
- Use tree-shaking for unused code
- Current extension is 1.2 MB, target <5 MB total

### Risk 2: Complexity Increase

**Risk:** Extension becomes too complex to maintain

**Mitigation:**
- Keep services isolated
- Clear separation of concerns
- Existing services untouched
- Comprehensive documentation

### Risk 3: Performance Impact

**Risk:** New features slow down extension

**Mitigation:**
- Services run in separate threads where possible
- MCP server in separate process
- Webviews sandboxed
- Memory budget enforcement (RAG)

### Risk 4: Breaking Existing Features

**Risk:** Integration breaks current functionality

**Mitigation:**
- Extensive integration testing
- Keep existing code paths unchanged
- Feature flags for new features
- Gradual rollout (beta release first)

### Risk 5: Build Complexity

**Risk:** Build system becomes too complex

**Mitigation:**
- Use existing webpack config
- Add vite for webviews only
- Separate build commands
- Clear build documentation

---

## Next Steps

### Immediate (This Week)

1. **Review & Approve This Plan**
   - Stakeholder review
   - Technical review
   - Go/no-go decision

2. **Set Up Development Environment**
   - Clone both repositories
   - Install dependencies
   - Verify builds work

3. **Create Feature Branch**
   - Branch from Lighthouse_Cursor_Extension main
   - Name: `feature/workflows-and-rag`

### Week 1: Foundation

1. Copy services from lighthouse-beacon
2. Extend GlobalServices
3. Run tests
4. Create webview providers (empty)
5. MCP server scaffold

### Week 2-3: Implementation

1. Build workflow UI
2. Build knowledge base UI
3. Implement MCP tools
4. Integration testing

### Week 4: Release

1. Polish and bug fixes
2. Documentation
3. Package extension
4. Beta release
5. Production release (0.9.0)

---

## Conclusion

This integration plan provides a **clear path** to adding workflows and RAG to the existing Lighthouse_Cursor_Extension. By building on the mature foundation already in place, we can deliver these features in **3-4 weeks** instead of starting from scratch.

**Key Success Factors:**
- ✅ Minimal changes to existing code
- ✅ Reuse 90% of lighthouse-beacon services
- ✅ Clear separation of concerns
- ✅ Additive, not disruptive
- ✅ Unified user experience

**Recommendation: Proceed with integration plan.**

---

**Document Status:** Ready for Review
**Next Action:** Stakeholder approval to begin implementation
**Owner:** Development Team
**Last Updated:** January 25, 2026
