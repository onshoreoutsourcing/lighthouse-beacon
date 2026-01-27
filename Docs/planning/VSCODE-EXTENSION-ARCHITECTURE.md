# Lighthouse Beacon - VS Code Extension Architecture Plan

**Status:** Planning / Under Review
**Created:** January 25, 2026
**Last Updated:** January 25, 2026
**Architecture Decision:** Pivot from standalone Electron app to VS Code extension with bundled MCP server

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architectural Vision](#architectural-vision)
3. [Why VS Code Extension Over Standalone Electron](#why-vs-code-extension-over-standalone-electron)
4. [Technical Architecture](#technical-architecture)
5. [Component Breakdown](#component-breakdown)
6. [Code Reuse Analysis](#code-reuse-analysis)
7. [Migration Plan](#migration-plan)
8. [Implementation Phases](#implementation-phases)
9. [User Experience Flow](#user-experience-flow)
10. [Technical Requirements](#technical-requirements)
11. [Trade-offs & Considerations](#trade-offs--considerations)
12. [Open Questions](#open-questions)
13. [References](#references)

---

## Executive Summary

### The Pivot

We are pivoting from a **standalone Electron application** to a **VS Code extension** that:
- Adds custom Activity Bar panels for visual workflow building and RAG management
- Bundles an MCP server that exposes tools to Claude Code CLI
- Reuses 90% of existing services and React components
- Provides seamless integration with Claude Code's ecosystem

### Key Benefits

1. **Visual UI + Claude Integration:** Users get both a visual interface AND Claude Code can use the tools
2. **Single Installation:** One extension provides everything (UI + MCP server)
3. **Familiar Environment:** Works within VS Code where developers already are
4. **Code Reuse:** Services, components, and business logic remain largely unchanged
5. **Ecosystem Access:** Users get Lighthouse + all other VS Code extensions + Claude Code features

### What Users Get

```
Install "Lighthouse Beacon" Extension:

1. Visual Interface:
   ⚡ Workflows panel in Activity Bar
   🧠 Knowledge Base panel in Activity Bar

2. MCP Tools for Claude Code:
   - list_workflows
   - execute_workflow
   - search_knowledge_base
   - index_document

3. Combined Workflow:
   - Build workflows visually in Workflows panel
   - Claude Code can execute them via MCP
   - RAG automatically augments Claude's responses
   - All within VS Code
```

---

## Architectural Vision

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VS Code Application                         │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    Activity Bar                             │   │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │   │
│  │  │Files │  │Search│  │Source│  │  ⚡  │  │  🧠  │        │   │
│  │  │      │  │      │  │Ctrl  │  │Workflow│  │ KB  │        │   │
│  │  └──────┘  └──────┘  └──────┘  └──┬───┘  └──┬───┘        │   │
│  └────────────────────────────────────┼─────────┼─────────────┘   │
│                                        │         │                 │
│  ┌────────────────────────────────────▼─────────▼──────────────┐  │
│  │            Lighthouse Extension Host (Node.js)              │  │
│  │                                                              │  │
│  │  ┌───────────────────────┐    ┌───────────────────────┐    │  │
│  │  │ WorkflowWebviewProvider│    │KnowledgeWebviewProvider│    │  │
│  │  │                        │    │                        │    │  │
│  │  │  Manages:              │    │  Manages:              │    │  │
│  │  │  - Webview lifecycle   │    │  - Webview lifecycle   │    │  │
│  │  │  - Message passing     │    │  - Message passing     │    │  │
│  │  │  - State sync          │    │  - State sync          │    │  │
│  │  └───────────┬────────────┘    └───────────┬────────────┘    │  │
│  │              │                              │                 │  │
│  │  ┌───────────▼──────────────────────────────▼──────────────┐ │  │
│  │  │              Extension Backend Logic                     │ │  │
│  │  │  - Command handlers                                      │ │  │
│  │  │  - Configuration management                              │ │  │
│  │  │  - VS Code API integration                               │ │  │
│  │  └───────────┬──────────────────────────────────────────────┘ │  │
│  │              │ spawn/manage                                   │  │
│  │  ┌───────────▼──────────────────────────────────────────────┐ │  │
│  │  │         Bundled MCP Server (stdio process)               │ │  │
│  │  │                                                           │ │  │
│  │  │  ┌─────────────────────────────────────────────────┐    │ │  │
│  │  │  │  MCP Server Tools (exposed to Claude Code)      │    │ │  │
│  │  │  │  - list_workflows()                              │    │ │  │
│  │  │  │  - execute_workflow(name, params)                │    │ │  │
│  │  │  │  - search_knowledge_base(query)                  │    │ │  │
│  │  │  │  - index_document(filePath)                      │    │ │  │
│  │  │  │  - get_workflow_status(workflowId)               │    │ │  │
│  │  │  └─────────────────────────────────────────────────┘    │ │  │
│  │  │                                                           │ │  │
│  │  │  ┌─────────────────────────────────────────────────┐    │ │  │
│  │  │  │  Service Layer (Reused from Electron)           │    │ │  │
│  │  │  │  - VectorService.ts                              │    │ │  │
│  │  │  │  - WorkflowExecutor.ts                           │    │ │  │
│  │  │  │  - RAGService.ts                                 │    │ │  │
│  │  │  │  - DocumentChunker.ts                            │    │ │  │
│  │  │  │  - EmbeddingService.ts                           │    │ │  │
│  │  │  └─────────────────────────────────────────────────┘    │ │  │
│  │  └───────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Webview Panels (Sandboxed Browser)              │  │
│  │                                                               │  │
│  │  ┌─────────────────────────┐   ┌─────────────────────────┐  │  │
│  │  │  Workflow Builder UI    │   │  Knowledge Base UI      │  │  │
│  │  │  (React + Vite)         │   │  (React + Vite)         │  │  │
│  │  │                         │   │                         │  │  │
│  │  │  - React Flow canvas    │   │  - DocumentList         │  │  │
│  │  │  - WorkflowCanvas       │   │  - MemoryUsageBar       │  │  │
│  │  │  - Custom node types    │   │  - RAGToggle            │  │  │
│  │  │  - Execution visualizer │   │  - AddFilesDialog       │  │  │
│  │  │  - Node editor          │   │  - IndexingProgress     │  │  │
│  │  │                         │   │                         │  │  │
│  │  │  ↕ postMessage IPC      │   │  ↕ postMessage IPC      │  │  │
│  │  └─────────────────────────┘   └─────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │     Claude Code CLI            │
                    │  Discovers MCP Server via:     │
                    │  - .vscode/mcp.json            │
                    │  - Auto-configuration          │
                    │                                │
                    │  Uses Tools:                   │
                    │  - list_workflows              │
                    │  - execute_workflow            │
                    │  - search_knowledge_base       │
                    └────────────────────────────────┘
```

### Key Components

1. **VS Code Extension Host (Node.js)**
   - Runs in VS Code's extension host process
   - Registers Activity Bar views
   - Spawns and manages MCP server
   - Handles webview lifecycle

2. **Webview Panels (Browser Context)**
   - Sandboxed browser environment
   - React applications with full UI
   - Communication via postMessage API
   - Reuses existing React components

3. **MCP Server (stdio process)**
   - Spawned by extension host
   - Exposes tools to Claude Code
   - Uses existing service layer
   - Stateful (maintains workflow/vector state)

4. **Service Layer (Shared)**
   - Same services from Electron app
   - Platform-agnostic business logic
   - Reusable across extension and MCP server

---

## Why VS Code Extension Over Standalone Electron

### Comparison Matrix

| Aspect | Standalone Electron | VS Code Extension + MCP |
|--------|---------------------|-------------------------|
| **User Installation** | Separate app download | Single extension install |
| **Claude Code Integration** | None (isolated) | Seamless via MCP |
| **Development Environment** | New app to learn | Users already in VS Code |
| **Context Management** | Must build from scratch | Claude Code handles it |
| **Permission System** | Must implement | Built into Claude Code |
| **File Operations** | Must implement | VS Code APIs available |
| **Distribution** | Custom installer/DMG | VS Code Marketplace |
| **Updates** | Manual update process | Auto-update via marketplace |
| **Ecosystem Access** | Isolated | Access to all VS Code extensions |
| **Code Reuse** | 60-70% of current code | 90% of current code |
| **Maintenance Burden** | High (full app) | Medium (extension only) |
| **User Onboarding** | Learn new app | Familiar VS Code environment |

### Decision Factors

#### ✅ Reasons FOR VS Code Extension

1. **Claude Code Integration is Key**
   - The whole point is to enhance Claude Code, not compete with it
   - MCP provides seamless integration
   - Users want "Claude Code + visual workflow builder" not "separate app"

2. **Reduced Development Scope**
   - Don't need to rebuild: chat UI, file explorer, editor, permissions, etc.
   - Focus on unique value: visual workflows and RAG management
   - 90% code reuse from Electron codebase

3. **Better User Experience**
   - Users already work in VS Code
   - No context switching between apps
   - Workflows and RAG integrate with existing workflow
   - Single source of truth (VS Code workspace)

4. **Distribution & Updates**
   - VS Code Marketplace handles distribution
   - Auto-updates built in
   - Easier for enterprise adoption (IT can deploy extensions)

5. **Ecosystem Benefits**
   - Works alongside other extensions (Copilot, GitLens, etc.)
   - Access to VS Code APIs (SCM, debugging, tasks, etc.)
   - Future: could integrate with VS Code testing, tasks, etc.

#### ❌ Reasons AGAINST Standalone Electron

1. **Competes with Claude Code**
   - Users must choose between Lighthouse OR Claude Code
   - Fragments the ecosystem
   - Duplicate functionality (chat, file ops, etc.)

2. **More Work to Build**
   - Must rebuild all infrastructure Claude Code already has
   - Permission system, safety, context management, etc.
   - Longer time to market

3. **Harder Distribution**
   - Custom installers for Mac/Windows/Linux
   - Code signing certificates
   - Update mechanism
   - User trust (unknown app vs extension)

4. **Isolated Ecosystem**
   - Can't leverage VS Code extensions
   - Can't leverage Claude Code features
   - Users maintain two separate tools

### The Deciding Factor

**We want to enhance Claude Code, not compete with it.**

Users don't need another standalone IDE. They need:
- Visual workflow builder (Claude Code doesn't have this)
- RAG knowledge management UI (Claude Code doesn't have this)
- These features integrated INTO their existing Claude Code workflow

VS Code Extension + MCP Server achieves this perfectly.

---

## Technical Architecture

### Extension Structure

```
lighthouse-beacon-extension/
├── package.json                    # Extension manifest
├── tsconfig.json                   # TypeScript config
├── webpack.config.js               # Extension host build
├── vite.config.ts                  # Webview builds
│
├── src/
│   ├── extension.ts               # Extension entry point
│   │
│   ├── webviews/                  # Webview providers
│   │   ├── WorkflowWebviewProvider.ts
│   │   ├── KnowledgeWebviewProvider.ts
│   │   └── BaseWebviewProvider.ts
│   │
│   ├── commands/                  # VS Code commands
│   │   ├── workflow-commands.ts
│   │   ├── knowledge-commands.ts
│   │   └── index.ts
│   │
│   ├── mcp-server/                # Bundled MCP server
│   │   ├── index.ts              # MCP server entry
│   │   ├── tools/                # Tool implementations
│   │   │   ├── workflow-tools.ts
│   │   │   ├── knowledge-tools.ts
│   │   │   └── index.ts
│   │   └── resources/            # MCP resources
│   │       └── index.ts
│   │
│   └── config/                    # Configuration
│       ├── mcp-config.ts
│       └── extension-config.ts
│
├── webview-ui/                    # React webview apps
│   ├── workflow/                  # Workflow builder UI
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── WorkflowBuilder.tsx
│   │   │   ├── components/       # Reused from Electron!
│   │   │   │   ├── WorkflowCanvas.tsx
│   │   │   │   ├── nodes/
│   │   │   │   │   ├── PythonScriptNode.tsx
│   │   │   │   │   ├── ConditionalNode.tsx
│   │   │   │   │   └── ...
│   │   │   │   └── ExecutionVisualizer.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useVSCodeMessage.ts
│   │   │   └── index.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── knowledge/                 # Knowledge base UI
│       ├── src/
│       │   ├── App.tsx
│       │   ├── KnowledgeBase.tsx
│       │   ├── components/       # Reused from Electron!
│       │   │   ├── DocumentList.tsx
│       │   │   ├── MemoryUsageBar.tsx
│       │   │   ├── RAGToggle.tsx
│       │   │   └── AddFilesDialog.tsx
│       │   ├── hooks/
│       │   │   └── useVSCodeMessage.ts
│       │   └── index.tsx
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
│
├── services/                      # Shared services (from Electron)
│   ├── vector/
│   │   ├── VectorService.ts
│   │   ├── EmbeddingService.ts
│   │   ├── MemoryMonitor.ts
│   │   └── IndexPersistence.ts
│   ├── workflow/
│   │   ├── WorkflowExecutor.ts
│   │   ├── WorkflowValidator.ts
│   │   ├── PythonExecutor.ts
│   │   └── YamlParser.ts
│   ├── rag/
│   │   ├── RAGService.ts
│   │   ├── DocumentChunker.ts
│   │   ├── TokenCounter.ts
│   │   ├── ContextBuilder.ts
│   │   └── PromptBuilder.ts
│   └── shared/
│       └── types.ts
│
├── resources/                     # Extension resources
│   ├── icons/
│   │   ├── workflow-icon.svg
│   │   ├── workflow-icon-dark.svg
│   │   ├── brain-icon.svg
│   │   └── brain-icon-dark.svg
│   └── templates/
│       └── workflow-templates/
│
└── dist/                          # Build output
    ├── extension.js              # Extension host bundle
    ├── mcp-server.js             # MCP server bundle
    ├── workflow-webview/         # Workflow UI bundle
    │   ├── index.js
    │   └── index.css
    └── knowledge-webview/        # Knowledge UI bundle
        ├── index.js
        └── index.css
```

### Build Configuration

#### Extension Host Build (webpack)

```javascript
// webpack.config.js
module.exports = {
  target: 'node',
  entry: {
    extension: './src/extension.ts',
    'mcp-server': './src/mcp-server/index.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};
```

#### Webview Build (Vite)

```typescript
// webview-ui/workflow/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../../dist/workflow-webview',
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        assetFileNames: 'index.[ext]'
      }
    }
  },
  define: {
    'process.env': {}
  }
});
```

### Extension Manifest (package.json)

```json
{
  "name": "lighthouse-beacon",
  "displayName": "Lighthouse Beacon",
  "description": "Visual workflows and RAG knowledge base for Claude Code",
  "version": "1.0.0",
  "publisher": "lighthouse",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["AI", "Automation", "Other"],
  "keywords": ["claude", "mcp", "workflows", "rag", "ai"],
  "icon": "resources/icon.png",
  "galleryBanner": {
    "color": "#1e1e1e",
    "theme": "dark"
  },

  "activationEvents": [
    "onStartupFinished"
  ],

  "main": "./dist/extension.js",

  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "lighthouse-workflows",
          "title": "Lighthouse Workflows",
          "icon": "resources/icons/workflow-icon.svg"
        },
        {
          "id": "lighthouse-knowledge",
          "title": "Lighthouse Knowledge",
          "icon": "resources/icons/brain-icon.svg"
        }
      ]
    },

    "views": {
      "lighthouse-workflows": [
        {
          "type": "webview",
          "id": "lighthouse.workflowBuilder",
          "name": "Builder",
          "contextualTitle": "Visual Workflow Editor",
          "when": "workspaceFolderCount > 0"
        },
        {
          "type": "tree",
          "id": "lighthouse.workflowList",
          "name": "Workflows",
          "contextualTitle": "Saved Workflows"
        }
      ],
      "lighthouse-knowledge": [
        {
          "type": "webview",
          "id": "lighthouse.knowledgeBase",
          "name": "Documents",
          "contextualTitle": "RAG Knowledge Base",
          "when": "workspaceFolderCount > 0"
        },
        {
          "type": "tree",
          "id": "lighthouse.documentList",
          "name": "Indexed Files",
          "contextualTitle": "Indexed Documents"
        }
      ]
    },

    "commands": [
      {
        "command": "lighthouse.workflows.new",
        "title": "New Workflow",
        "category": "Lighthouse",
        "icon": "$(add)"
      },
      {
        "command": "lighthouse.workflows.execute",
        "title": "Execute Workflow",
        "category": "Lighthouse",
        "icon": "$(play)"
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
      },
      {
        "command": "lighthouse.knowledge.clear",
        "title": "Clear Knowledge Base",
        "category": "Lighthouse"
      }
    ],

    "menus": {
      "explorer/context": [
        {
          "command": "lighthouse.knowledge.addFile",
          "when": "!explorerResourceIsFolder",
          "group": "lighthouse@1"
        },
        {
          "command": "lighthouse.knowledge.addFolder",
          "when": "explorerResourceIsFolder",
          "group": "lighthouse@1"
        }
      ],
      "view/title": [
        {
          "command": "lighthouse.workflows.new",
          "when": "view == lighthouse.workflowBuilder",
          "group": "navigation"
        }
      ]
    },

    "configuration": {
      "title": "Lighthouse Beacon",
      "properties": {
        "lighthouse.rag.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable RAG context retrieval for Claude Code"
        },
        "lighthouse.rag.autoIndex": {
          "type": "boolean",
          "default": false,
          "description": "Automatically index files when opened"
        },
        "lighthouse.rag.memoryBudget": {
          "type": "number",
          "default": 500,
          "description": "Memory budget in MB for vector index"
        },
        "lighthouse.workflows.autoSave": {
          "type": "boolean",
          "default": true,
          "description": "Automatically save workflows on change"
        },
        "lighthouse.workflows.pythonTimeout": {
          "type": "number",
          "default": 30,
          "description": "Timeout in seconds for Python script execution"
        }
      }
    }
  },

  "scripts": {
    "vscode:prepublish": "npm run build",
    "build": "npm run build:extension && npm run build:webviews",
    "build:extension": "webpack --mode production",
    "build:webviews": "npm run build:workflow-ui && npm run build:knowledge-ui",
    "build:workflow-ui": "cd webview-ui/workflow && vite build",
    "build:knowledge-ui": "cd webview-ui/knowledge && vite build",
    "watch": "concurrently \"webpack --mode development --watch\" \"npm run watch:webviews\"",
    "watch:webviews": "concurrently \"cd webview-ui/workflow && vite\" \"cd webview-ui/knowledge && vite\"",
    "package": "vsce package",
    "publish": "vsce publish"
  },

  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.4",
    "ts-loader": "^9.5.1",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "concurrently": "^8.2.0",
    "@vscode/vsce": "^2.22.0"
  },

  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "reactflow": "^11.10.0",
    "vectra": "^0.4.0",
    "@xenova/transformers": "^2.10.0"
  }
}
```

---

## Component Breakdown

### 1. Extension Host Components

#### Extension Entry Point (`src/extension.ts`)

**Responsibilities:**
- Activate extension on VS Code startup
- Spawn and manage MCP server process
- Register webview providers
- Register commands
- Configure Claude Code to use MCP server

**Key Code:**

```typescript
export async function activate(context: vscode.ExtensionContext) {
  // 1. Start MCP server
  const mcpServer = await startMCPServer(context);

  // 2. Register webview providers
  registerWebviews(context);

  // 3. Register commands
  registerCommands(context);

  // 4. Auto-configure Claude Code
  await configureMCPForClaudeCode(context, mcpServer);
}
```

#### Webview Providers

**WorkflowWebviewProvider:**
- Manages workflow builder webview lifecycle
- Handles messages from React UI (save, execute, etc.)
- Provides workflow data to webview
- Syncs workflow state with file system

**KnowledgeWebviewProvider:**
- Manages knowledge base webview lifecycle
- Handles messages from React UI (add, remove, toggle RAG)
- Provides document list and memory status
- Triggers indexing operations

### 2. MCP Server Components

#### Server Entry (`src/mcp-server/index.ts`)

**Responsibilities:**
- Initialize MCP server with stdio transport
- Register tools and resources
- Handle tool execution requests
- Manage service lifecycle

**Tools Exposed:**

```typescript
// Workflow tools
- list_workflows() → WorkflowMetadata[]
- execute_workflow(name, inputs) → WorkflowExecutionResult
- validate_workflow(workflow) → ValidationResult
- get_workflow_status(workflowId) → ExecutionStatus

// Knowledge base tools
- search_knowledge_base(query, topK) → SearchResult[]
- index_document(filePath) → IndexResult
- remove_document(documentId) → void
- get_kb_stats() → VectorIndexStats
- clear_knowledge_base() → void
```

**Resources Exposed:**

```typescript
// Workflow resources
workflow://workflow-name → Workflow definition

// Knowledge base resources
knowledge://document-id → Document content
```

### 3. Webview UI Components

#### Workflow Builder UI (`webview-ui/workflow/`)

**Components (Reused from Electron):**
- `WorkflowCanvas.tsx` - React Flow canvas
- `nodes/PythonScriptNode.tsx`
- `nodes/ConditionalNode.tsx`
- `nodes/LoopNode.tsx`
- `nodes/ClaudeAPINode.tsx`
- `ExecutionVisualizer.tsx` - Real-time execution display
- `NodeEditor.tsx` - Edit node properties
- `WorkflowToolbar.tsx` - Save, execute, test buttons

**New Components:**
- `VSCodeWorkflowBuilder.tsx` - Wrapper for VS Code context
- `hooks/useVSCodeMessage.ts` - VS Code postMessage hook

#### Knowledge Base UI (`webview-ui/knowledge/`)

**Components (Reused from Electron):**
- `DocumentList.tsx`
- `DocumentItem.tsx`
- `MemoryUsageBar.tsx`
- `RAGToggle.tsx`
- `IndexingProgress.tsx`
- `AddFilesDialog.tsx`

**New Components:**
- `VSCodeKnowledgeBase.tsx` - Wrapper for VS Code context
- `hooks/useVSCodeMessage.ts` - VS Code postMessage hook

### 4. Service Layer (100% Reused)

All services from the Electron app remain unchanged:
- `VectorService.ts`
- `WorkflowExecutor.ts`
- `RAGService.ts`
- `DocumentChunker.ts`
- `TokenCounter.ts`
- `EmbeddingService.ts`
- `MemoryMonitor.ts`
- `IndexPersistence.ts`
- `PythonExecutor.ts`
- `YamlParser.ts`
- etc.

---

## Code Reuse Analysis

### What Can Be Reused (90%)

#### ✅ 100% Reusable (No Changes)

**Services Layer:**
- All vector/RAG services
- All workflow services
- All utilities (chunking, token counting, etc.)
- Business logic remains identical

**React Components (with minor wrapper changes):**
- All workflow node components
- All knowledge base UI components
- React Flow integration
- Monaco editor integration (if used)

**Types & Interfaces:**
- All TypeScript types/interfaces
- Workflow schema definitions
- Vector search types
- RAG types

**Assets:**
- Icons, images
- Workflow templates
- Sample data

#### ✅ 90% Reusable (Minor Changes)

**State Management:**
- Zustand stores need adapter for VS Code state persistence
- Core logic stays the same
- Only storage backend changes

**UI Components:**
- Need `acquireVsCodeApi()` instead of `window.electronAPI`
- Change IPC from Electron to VS Code postMessage
- Otherwise identical

### What Needs to Be Built New (10%)

#### ❌ New Code Required

**Extension Host:**
- `extension.ts` activation logic
- Webview provider classes
- VS Code command handlers
- MCP server spawn/management
- VS Code configuration integration

**MCP Server Wrapper:**
- MCP SDK integration
- Tool registration
- Request handling
- Resource providers

**Webview Adapters:**
- `useVSCodeMessage` hook
- VS Code-specific wrappers
- Theme integration
- Context handling

### Migration Effort Estimate

| Component | Effort | Status |
|-----------|--------|--------|
| Extension scaffold | 2-3 days | New |
| Webview providers | 1-2 days | New |
| MCP server wrapper | 2-3 days | New |
| Service layer migration | 1 day | Copy + minor updates |
| React component adaptation | 2-3 days | Wrapper changes |
| Build configuration | 1-2 days | New (webpack + vite) |
| Testing & debugging | 3-5 days | Integration testing |
| **Total** | **12-19 days** | **~3 weeks** |

---

## Migration Plan

### Phase 1: Extension Scaffold (Week 1)

**Goal:** Get basic extension running with one webview

**Tasks:**
1. Create extension project structure
2. Set up webpack config for extension host
3. Set up vite config for webviews
4. Implement basic extension activation
5. Create one webview provider (workflow builder)
6. Test webview displays in VS Code

**Deliverable:** Extension loads and shows empty workflow builder panel

### Phase 2: MCP Server Integration (Week 1-2)

**Goal:** Spawn MCP server and expose first tool

**Tasks:**
1. Copy service layer from Electron app
2. Create MCP server entry point
3. Implement stdio transport
4. Register one workflow tool (list_workflows)
5. Test tool from command line
6. Auto-configure Claude Code to use server

**Deliverable:** Claude Code can call `list_workflows` tool

### Phase 3: Workflow UI Migration (Week 2)

**Goal:** Full workflow builder working in webview

**Tasks:**
1. Copy React components from Electron app
2. Create `useVSCodeMessage` hook
3. Implement workflow webview provider
4. Connect UI to MCP server via extension backend
5. Test workflow creation and saving
6. Implement all workflow MCP tools

**Deliverable:** Can create workflows visually, Claude can execute them

### Phase 4: Knowledge Base UI Migration (Week 2-3)

**Goal:** Full knowledge base working in webview

**Tasks:**
1. Copy knowledge base components from Electron app
2. Create knowledge webview provider
3. Implement all RAG MCP tools
4. Test document indexing
5. Test RAG search from Claude Code
6. Implement memory monitoring

**Deliverable:** Can manage knowledge base visually, Claude uses RAG

### Phase 5: Polish & Testing (Week 3)

**Goal:** Production-ready extension

**Tasks:**
1. Add all commands and menus
2. Implement configuration settings
3. Add icons and branding
4. Write documentation
5. Integration testing
6. Performance optimization
7. Error handling improvements

**Deliverable:** Extension ready for marketplace

---

## Implementation Phases

### Phase 1: Proof of Concept (1 week)

**Scope:**
- Basic extension with one webview (workflow builder)
- MCP server with one tool (list_workflows)
- Minimal UI showing it works

**Success Criteria:**
- Extension installs in VS Code
- Workflow panel appears in Activity Bar
- Claude Code can call one MCP tool
- Webview renders React component

### Phase 2: Core Features (2 weeks)

**Scope:**
- Complete workflow builder UI
- Complete knowledge base UI
- All MCP tools implemented
- Basic state management

**Success Criteria:**
- Can create workflows visually
- Can manage knowledge base
- Claude Code can use all tools
- Data persists across sessions

### Phase 3: Production Ready (1 week)

**Scope:**
- Polish UI/UX
- Comprehensive testing
- Documentation
- Marketplace preparation

**Success Criteria:**
- All features working reliably
- No critical bugs
- User documentation complete
- Extension passes marketplace review

---

## User Experience Flow

### Installation & Setup

```
User Journey:

1. Open VS Code
2. Go to Extensions
3. Search "Lighthouse Beacon"
4. Click Install
5. Extension activates automatically
6. Two new icons appear in Activity Bar:
   - ⚡ Workflows
   - 🧠 Knowledge Base
7. MCP server starts in background
8. If Claude Code installed, auto-configured
9. Ready to use!
```

### Creating a Workflow

```
User Journey:

1. Click ⚡ Workflows icon
2. See workflow builder panel open
3. Drag nodes from palette onto canvas
4. Connect nodes with edges
5. Click node to edit properties
6. Click "Save" button
7. Workflow saved to workspace

Claude can now:
- List this workflow with list_workflows
- Execute it with execute_workflow
```

### Using RAG

```
User Journey:

1. Click 🧠 Knowledge Base icon
2. See knowledge base panel
3. Right-click file in Explorer
4. Select "Add to Knowledge Base"
5. See file appear in document list
6. See memory usage bar update
7. Toggle "RAG Enabled" switch

Claude now:
- Searches knowledge base automatically
- Includes relevant code in context
- Cites sources in responses
```

### Claude Code Integration

```
User Interaction:

User types in Claude Code CLI:
> "What workflows are available?"

Claude Code:
1. Sees list_workflows tool
2. Calls it automatically
3. Gets list from MCP server
4. Responds with formatted list

User types:
> "Run the test-automation workflow"

Claude Code:
1. Sees execute_workflow tool
2. Calls it with name="test-automation"
3. Shows real-time progress
4. Reports results
```

---

## Technical Requirements

### Development Environment

**Required:**
- Node.js 20+
- VS Code 1.85+
- TypeScript 5.3+
- Git

**Recommended:**
- Claude Code CLI installed
- Familiarity with VS Code extension development
- React development experience

### Dependencies

**Extension Host:**
```json
{
  "@types/vscode": "^1.85.0",
  "@modelcontextprotocol/sdk": "^0.5.0",
  "typescript": "^5.3.0",
  "webpack": "^5.89.0"
}
```

**Webview UI:**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "reactflow": "^11.10.0",
  "vite": "^5.0.0"
}
```

**Services:**
```json
{
  "vectra": "^0.4.0",
  "@xenova/transformers": "^2.10.0",
  "js-yaml": "^4.1.0"
}
```

### VS Code API Usage

**APIs Required:**
- `vscode.window.registerWebviewViewProvider` - Register webviews
- `vscode.workspace.workspaceFolders` - Get workspace path
- `vscode.workspace.fs` - File system operations
- `vscode.commands.registerCommand` - Register commands
- `vscode.window.showInformationMessage` - User notifications
- `vscode.workspace.getConfiguration` - Read settings

**APIs Optional:**
- `vscode.tasks` - Future: integrate with VS Code tasks
- `vscode.debug` - Future: debugging integration
- `vscode.scm` - Future: git integration

### Platform Support

**Supported Platforms:**
- ✅ macOS (Intel + Apple Silicon)
- ✅ Windows 10/11
- ✅ Linux (Ubuntu, Fedora, etc.)
- ✅ VS Code Web (with limitations)

**Note on VS Code Web:**
- Webviews work fully
- MCP server requires stdio (won't work in browser)
- Could provide fallback HTTP MCP server for web

---

## Trade-offs & Considerations

### Pros of This Approach

✅ **Seamless Claude Code Integration**
- Users get visual UI + Claude automation in one package
- MCP ensures Claude can use workflows/RAG automatically
- No manual configuration needed

✅ **Reduced Scope**
- Don't rebuild: chat, file explorer, editor, permissions
- Focus on unique value: workflows and RAG
- 90% code reuse from Electron

✅ **Better Distribution**
- VS Code Marketplace handles everything
- Auto-updates built in
- Easier enterprise adoption

✅ **Familiar Environment**
- Users already in VS Code
- No context switching
- Works with other extensions

✅ **Future Flexibility**
- Could still build standalone Electron app later if needed
- Services are platform-agnostic
- MCP server could be used by other clients

### Cons of This Approach

❌ **VS Code Dependency**
- Requires VS Code (or VS Code compatible editor)
- Can't target users who don't use VS Code
- Limited by VS Code's extension capabilities

❌ **Webview Limitations**
- Sandboxed environment
- Can't directly access Node.js APIs
- Must communicate via postMessage (adds complexity)
- Performance overhead vs native

❌ **MCP Server Complexity**
- Stdio process management can be tricky
- Debugging is harder (two processes)
- Must handle process crashes gracefully

❌ **Distribution Control**
- Must follow VS Code Marketplace rules
- Can't customize installation experience
- Limited monetization options (marketplace restrictions)

### Risk Mitigation

**Risk: MCP server crashes**
- Mitigation: Auto-restart on crash
- Monitoring: Log all crashes
- Fallback: Graceful degradation (UI still works)

**Risk: Webview performance issues**
- Mitigation: Virtual scrolling for large lists
- Optimization: Lazy load components
- Monitoring: Performance profiling

**Risk: VS Code API changes**
- Mitigation: Use stable APIs only
- Testing: Test on multiple VS Code versions
- Updates: Monitor VS Code release notes

**Risk: User doesn't have Claude Code**
- Mitigation: Extension works standalone
- Detection: Check if Claude Code installed
- Guidance: Show setup instructions if missing

---

## Open Questions

### Technical Questions

1. **MCP Server State Persistence**
   - Q: Where should MCP server store vector index and workflow data?
   - Options:
     - A: Workspace `.lighthouse/` directory (project-specific)
     - B: Global `~/.lighthouse/` directory (cross-project)
     - C: VS Code global storage (extension API)
   - **Recommendation:** Option A (workspace-specific) for isolation

2. **Webview Performance**
   - Q: How do we handle large workflow graphs (100+ nodes)?
   - Options:
     - A: Virtual rendering (only render visible nodes)
     - B: Pagination/chunking
     - C: Separate "large workflow" mode
   - **Recommendation:** Option A (React Flow handles this well)

3. **Claude Code Discovery**
   - Q: How does extension know if Claude Code is installed?
   - Options:
     - A: Check for `claude` CLI in PATH
     - B: Check for `.mcp.json` in workspace
     - C: Don't check, just provide MCP server
   - **Recommendation:** Option C (always provide, Claude finds it)

4. **Multi-Root Workspaces**
   - Q: How do we handle VS Code multi-root workspaces?
   - Options:
     - A: One knowledge base per root
     - B: Single shared knowledge base
     - C: Let user choose
   - **Recommendation:** Option A (isolated per root)

### Product Questions

1. **Standalone Electron App**
   - Q: Should we still build standalone Electron app for non-VS Code users?
   - Consideration: Market size, development effort
   - **Recommendation:** Defer until after extension launch, evaluate demand

2. **Pricing/Monetization**
   - Q: Free vs paid extension?
   - Options:
     - A: Completely free/open source
     - B: Free tier + paid features
     - C: Paid extension
   - **Recommendation:** Start free, evaluate later

3. **Open Source**
   - Q: Should the extension be open source?
   - Pros: Community contributions, transparency, trust
   - Cons: Less control, competitors can fork
   - **Recommendation:** Open source (aligns with Claude Code's ethos)

### User Experience Questions

1. **Onboarding**
   - Q: How do we teach users about workflows and RAG?
   - Options:
     - A: Interactive tutorial on first launch
     - B: Sample workflows pre-loaded
     - C: Documentation only
   - **Recommendation:** Option B + brief welcome message

2. **Theme Support**
   - Q: How do we handle VS Code themes in webviews?
   - Options:
     - A: Detect theme and inject CSS variables
     - B: Use VS Code Webview UI Toolkit
     - C: Fixed theme (light/dark only)
   - **Recommendation:** Option A (better integration)

3. **Keyboard Shortcuts**
   - Q: What keyboard shortcuts should we provide?
   - Must avoid: Conflicts with VS Code defaults
   - **Recommendation:**
     - `Ctrl+Shift+W` - Toggle workflows panel
     - `Ctrl+Shift+K` - Toggle knowledge panel
     - `Ctrl+Shift+E` - Execute workflow

---

## References

### Documentation & Resources

**VS Code Extension Development:**
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Webview API Guide](https://code.visualstudio.com/api/extension-guides/webview)
- [Activity Bar Guide](https://code.visualstudio.com/api/ux-guidelines/activity-bar)
- [Views API](https://code.visualstudio.com/api/ux-guidelines/views)
- [Building VS Code Extensions in 2026](https://abdulkadersafi.com/blog/building-vs-code-extensions-in-2026-the-complete-modern-guide)

**React in VS Code:**
- [Using React in VS Code Webviews](https://www.kenmuse.com/blog/using-react-in-vs-code-webviews/)
- [React Webview UI Toolkit](https://githubnext.com/projects/react-webview-ui-toolkit/)
- [react-vscode-webview-ipc Library](https://github.com/hbmartin/react-vscode-webview-ipc)

**MCP Integration:**
- [MCP Developer Guide](https://code.visualstudio.com/api/extension-guides/ai/mcp)
- [Bundle MCP Server into Extension](https://dev.to/formulahendry/bundle-mcp-server-into-vs-code-extension-3lii)
- [MCP SDK Documentation](https://modelcontextprotocol.io/)

**Claude Code:**
- [Claude Code Documentation](https://code.claude.com/docs)
- [Claude Code MCP Guide](https://code.claude.com/docs/en/mcp.md)
- [Claude Code Skills](https://code.claude.com/docs/en/skills.md)

### Example Extensions

- [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot) - AI integration example
- [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) - Webview example
- [Draw.io Integration](https://marketplace.visualstudio.com/items?itemName=hediet.vscode-drawio) - Visual editor in webview

---

## Next Steps

### Immediate Actions (This Week)

1. **Review & Approve This Document**
   - Stakeholder review
   - Technical review
   - Decision on open questions

2. **Create Extension Scaffold**
   - Set up project structure
   - Configure build system
   - Basic extension activation

3. **Proof of Concept**
   - One webview working
   - One MCP tool working
   - End-to-end demo

### Short Term (Next 2 Weeks)

1. **Migrate Core Services**
   - Copy from Electron app
   - Adapt for VS Code environment
   - Test independently

2. **Implement Workflow Builder**
   - Webview UI
   - MCP tools
   - Integration testing

3. **Implement Knowledge Base**
   - Webview UI
   - MCP tools
   - RAG testing

### Medium Term (Weeks 3-4)

1. **Polish & Testing**
   - UI/UX improvements
   - Bug fixes
   - Performance optimization

2. **Documentation**
   - User guide
   - Developer docs
   - MCP tool documentation

3. **Marketplace Preparation**
   - Icon and branding
   - Marketplace listing
   - Screenshots/videos

### Long Term (Post-Launch)

1. **Community Feedback**
   - Gather user feedback
   - Prioritize feature requests
   - Fix reported issues

2. **Future Features**
   - VS Code task integration
   - Debugging integration
   - Template marketplace
   - Collaborative workflows

3. **Evaluate Standalone App**
   - Assess demand for non-VS Code version
   - Decide if worth building
   - Plan if proceeding

---

## Conclusion

This architecture represents a **strategic pivot** that:
- ✅ Aligns with Claude Code's ecosystem
- ✅ Reduces development scope by 40-50%
- ✅ Improves user experience (stay in VS Code)
- ✅ Enables seamless Claude integration via MCP
- ✅ Reuses 90% of existing codebase
- ✅ Delivers faster time to market

The VS Code extension approach is the **right architecture** for Lighthouse Beacon because:
1. We enhance Claude Code, not compete with it
2. Users get visual tools + automation in one package
3. MCP provides seamless integration
4. We focus on our unique value: workflows and RAG

**Recommendation: Proceed with VS Code Extension + MCP Server architecture.**

---

**Document Status:** Draft for Review
**Next Review:** After stakeholder feedback
**Owner:** Development Team
**Last Updated:** January 25, 2026
