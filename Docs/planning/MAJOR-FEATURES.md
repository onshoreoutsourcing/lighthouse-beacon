# Lighthouse Beacon - Major Features Overview

**Last Updated:** January 25, 2026
**Project Status:** Production Ready (Epics 1-4, 7, 10 Complete | Epic 9: 90% Complete)

This document provides a comprehensive overview of all major features implemented in Lighthouse Beacon, an AI-powered development environment with visual workflow automation and retrieval-augmented generation capabilities.

---

## Table of Contents

1. [Core Desktop Foundation](#1-core-desktop-foundation)
2. [AI Chat Integration](#2-ai-chat-integration)
3. [File Operation Tools](#3-file-operation-tools)
4. [Code Editor](#4-code-editor)
5. [Visual Workflow Generator](#5-visual-workflow-generator)
6. [RAG Knowledge Base](#6-rag-knowledge-base)
7. [Logging & Infrastructure](#7-logging--infrastructure)
8. [Permission & Safety System](#8-permission--safety-system)
9. [Settings & Configuration](#9-settings--configuration)
10. [Layout & Navigation](#10-layout--navigation)
11. [Technology Stack](#technology-stack)
12. [Feature Integration Map](#feature-integration-map)
13. [Production Status & Metrics](#production-status--metrics)

---

## 1. Core Desktop Foundation

**Epic:** Epic 1 - Desktop Foundation with Basic UI
**Status:** ✅ Complete (14 waves)
**Documentation:** `/Docs/implementation/archive/epic-1-desktop-foundation.md`

### Purpose
Establish the foundational Electron desktop application with React UI framework, providing the base architecture for all other features.

### Key Components

**Main Process:**
- `WindowManager.ts` - Electron window lifecycle management
- `FileSystemService.ts` - File I/O operations with security
- `MenuService.ts` - Native application menu integration
- `IPCHandlers.ts` - Inter-process communication setup

**Renderer Process:**
- React 18 application with TypeScript
- Vite build system for fast development
- Three-panel layout architecture
- Zustand state management

### Features
- ✅ Electron window with proper lifecycle management
- ✅ React-based UI with TypeScript type safety
- ✅ Hot module replacement (HMR) during development
- ✅ Production build optimization with Vite
- ✅ IPC communication between main and renderer processes
- ✅ Native OS menu integration
- ✅ Window state persistence (size, position)

### Related ADRs
- **ADR-001:** Electron Desktop Architecture
- **ADR-005:** Vite Build System

---

## 2. AI Chat Integration

**Epic:** Epic 2 - AI Integration with AIChatSDK
**Status:** ✅ Complete
**Documentation:** `/Docs/implementation/archive/epic-2-ai-integration-aichatsdk.md`

### Purpose
Enable natural language interaction with multiple AI providers through a unified chat interface with real-time streaming responses.

### Key Components

**UI Components:**
- `ChatInterface.tsx` - Main chat interface with message history
- `MessageInput.tsx` - User message entry with send controls
- `ChatMessage.tsx` - Individual message rendering with role-based styling
- `MarkdownContent.tsx` - Rich markdown rendering with code syntax highlighting
- `StreamingIndicator.tsx` - Visual feedback during AI response streaming

**Services:**
- `AIService.ts` - Multi-provider AI orchestration
- `ConversationStorage.ts` - Persist conversation history to disk
- `StreamingHandler.ts` - Real-time token streaming

**State Management:**
- `chat.store.ts` - Zustand store for chat state, messages, streaming status

### Features
- ✅ Multi-provider AI support:
  - Anthropic Claude (Claude 3.5 Sonnet, Claude 3 Opus)
  - OpenAI GPT (GPT-4, GPT-3.5-turbo)
  - Google Gemini (Gemini Pro)
  - Ollama (Local models: llama2, mistral, etc.)
- ✅ Real-time streaming responses with token-by-token display
- ✅ Conversation persistence across sessions
- ✅ Multi-turn context awareness
- ✅ Markdown rendering with code syntax highlighting
- ✅ Copy code blocks to clipboard
- ✅ Message history with scrollback
- ✅ Error handling and retry logic
- ✅ Provider switching without data loss

### Related ADRs
- **ADR-006:** AIChatSDK Integration Strategy
- **ADR-007:** Conversation Storage Format
- **ADR-009:** Streaming Response Architecture

---

## 3. File Operation Tools

**Epic:** Epic 3 - File Operation Tools
**Status:** ✅ Complete
**Documentation:** `/Docs/implementation/archive/epic-3-file-operation-tools-master-plan.md`

### Purpose
Provide AI-accessible file manipulation capabilities through specialized tools with comprehensive security controls.

### Key Tools

**Core File Tools:**
1. **ReadTool** (`ReadTool.ts`)
   - Read file contents with optional line ranges
   - Binary file detection and handling
   - Large file support with chunking

2. **WriteTool** (`WriteTool.ts`)
   - Create new files or overwrite existing
   - Atomic write operations
   - Backup creation before overwrite

3. **EditTool** (`EditTool.ts`)
   - Find-and-replace file modifications
   - Regex support for complex replacements
   - Multi-occurrence handling

4. **GlobTool** (`GlobTool.ts`)
   - Find files by pattern matching
   - Recursive directory traversal
   - Gitignore-aware filtering

5. **GrepTool** (`GrepTool.ts`)
   - Search file contents with regex
   - Multi-file search
   - Context lines (before/after)

6. **BashTool** (`BashTool.ts`)
   - Execute shell commands securely
   - Timeout enforcement (30 seconds default)
   - Output capture (stdout/stderr)

7. **DeleteTool** (`DeleteTool.ts`)
   - Remove files with confirmation
   - Trash/permanent delete options
   - Directory deletion support

**Services:**
- `ToolRegistry.ts` - Central tool registration and discovery
- `ToolExecutionService.ts` - Execute tools with permission checks
- `PathValidator.ts` - Validate and sanitize file paths
- `ToolPermissionManager.ts` - Permission lifecycle management

### Features
- ✅ Path traversal attack prevention (ADR-011)
- ✅ Directory sandboxing - operations confined to project directory
- ✅ Permission-based access control (ADR-008, ADR-014)
- ✅ Real-time file explorer updates as AI modifies files
- ✅ Tool execution logging for SOC compliance
- ✅ Batch permission approval for workflows
- ✅ Command output truncation for performance
- ✅ Error handling with detailed messages

### Security Features
- 🔒 Path validation prevents `../` traversal
- 🔒 Operations restricted to project root
- 🔒 Bash command whitelisting for dangerous operations
- 🔒 Timeout enforcement prevents infinite loops
- 🔒 User permission prompts for sensitive operations

### Related ADRs
- **ADR-010:** File Operation Tool Architecture
- **ADR-011:** Directory Sandboxing Strategy
- **ADR-012:** Bash Tool Safety Measures
- **ADR-008:** Permission Request UX
- **ADR-014:** Batch Permission Approval

---

## 4. Code Editor

**Epic:** Epic 4 - Enhanced Code Editor Features
**Status:** ✅ Complete
**Documentation:** Integrated with Epic 1 foundation

### Purpose
Professional code editing experience with VS Code-level features powered by Monaco Editor.

### Key Components

**UI Components:**
- `MonacoEditorContainer.tsx` - Editor wrapper with configuration
- `TabBar.tsx` - Multi-tab interface for open files
- `Tab.tsx` - Individual file tab with close button
- `CodeEditorPanel.tsx` - Right panel containing editor

**Services:**
- Monaco Editor integration with full language support
- Tab management service for multiple open files
- File watcher for external changes
- Syntax highlighting service

**State Management:**
- `editor.store.ts` - Editor state (open files, active tab, cursor position, scroll position)

### Features
- ✅ Multiple file tabs with easy switching
- ✅ Syntax highlighting for 50+ languages
- ✅ IntelliSense autocomplete
- ✅ Go-to-definition navigation
- ✅ Find and replace (single file and global)
- ✅ Line numbers and code folding
- ✅ Minimap for large files
- ✅ Diff view for comparing versions
- ✅ Line range selection for AI operations
- ✅ Bracket matching and auto-closing
- ✅ Multi-cursor editing
- ✅ Keyboard shortcuts matching VS Code
- ✅ Theme support (dark/light)

### Integration Points
- File Explorer double-click opens file in editor
- AI chat can open files at specific line numbers
- RAG source citations click-to-navigate to editor
- Workflow execution can open output files

### Related ADRs
- **ADR-004:** Monaco Editor Integration

---

## 5. Visual Workflow Generator

**Epic:** Epic 9 - Visual Workflow Generator
**Status:** ⚠️ Partial (90% Complete - Features 9.1-9.4 Complete, Feature 9.5 Partial)
**Documentation:** `/Docs/implementation/_main/epic-9-workflow-generator-master-plan.md`

### Purpose
Enable visual creation and execution of automation workflows using a drag-and-drop canvas with advanced control flow and AI-assisted generation.

### Feature Breakdown

#### **Feature 9.1: Workflow Canvas Foundation** ✅ Complete

**Components:**
- `WorkflowCanvas.tsx` - React Flow-based visual editor with drag-and-drop
- `WorkflowExplorer.tsx` - Left sidebar for workflow file management
- Custom node types:
  - `PythonScriptNode.tsx` - Execute Python scripts
  - `ClaudeAPINode.tsx` - AI-powered workflow steps
  - `InputNode.tsx` - Define workflow inputs
  - `OutputNode.tsx` - Define workflow outputs
  - `ConditionalNode.tsx` - If/else branching
  - `LoopNode.tsx` - Iterate over collections
  - `FallbackNode.tsx` - Error handling

**Features:**
- Drag-and-drop node creation
- Visual connection between nodes
- Node configuration panels
- Canvas zoom and pan
- Node alignment and layout tools

#### **Feature 9.2: Workflow Execution Engine** ✅ Complete

**Services:**
- `WorkflowExecutor.ts` - Sequential workflow execution orchestration
- `PythonExecutor.ts` - Secure Python script execution with:
  - Path validation (prevents file system escapes)
  - 30-second timeout enforcement
  - Output capture (stdout/stderr)
  - Virtual environment support
- `ExecutionEvents.ts` - Event system for execution tracking

**Components:**
- `ExecutionVisualizer.tsx` - Real-time node status during execution
- `ExecutionHistoryPanel.tsx` - View past workflow runs with logs
- `WorkflowErrorBoundary.tsx` - Graceful error handling

**Features:**
- Step-by-step execution visualization
- Real-time node status indicators (pending, running, success, failed)
- Execution logs with timestamps
- Error reporting with stack traces
- Execution history persistence

#### **Feature 9.3: Workflow Management** ✅ Complete

**Services:**
- `WorkflowService.ts` - CRUD operations for workflow files
- `YamlParser.ts` - Parse and serialize YAML workflow definitions
- `WorkflowValidator.ts` - Schema validation

**Components:**
- `ImportExportDialog.tsx` - Import/export workflows as YAML
- `WorkflowTemplates.tsx` - Pre-built workflow examples
- `WorkflowList.tsx` - Browse saved workflows

**Features:**
- Save/load workflows to disk
- Import/export as YAML
- Workflow templates (3+ examples):
  - Code analysis workflow
  - Documentation generation
  - Testing automation
- Workflow versioning (basic)

#### **Feature 9.4: Advanced Control Flow** ✅ Complete (except Wave 9.4.7)

**Services:**
- `ConditionEvaluator.ts` - Evaluate conditional expressions
- `VariableResolver.ts` - `${variable}` interpolation syntax
- `ParallelExecutor.ts` - Execute independent nodes simultaneously
- `DebugExecutor.ts` - Step-by-step debugging with breakpoints
- `CircuitBreaker.ts` - Prevent cascading failures
- `RetryPolicy.ts` - Configurable retry logic with exponential backoff

**Components:**
- `DebugToolbar.tsx` - Debug controls (step over, continue, pause)
- `VariableInspector.tsx` - Runtime variable inspection
- `BreakpointPanel.tsx` - Manage breakpoints

**Features:**
- ✅ Conditional branching (if/else nodes)
- ✅ Loop nodes (iterate over arrays, ranges)
- ✅ Parallel execution (independent steps run simultaneously)
- ✅ Variable interpolation (`${input.value}`, `${step1.output}`)
- ✅ Advanced error handling with fallback nodes
- ✅ Step-by-step debugging:
  - Set breakpoints on nodes
  - Pause/resume execution
  - Step over nodes
  - Inspect variables at pause point
- ✅ Retry policies with configurable strategies
- ✅ Circuit breaker pattern for external calls
- ❌ Wave 9.4.7: Workflow versioning with git integration (Deferred)

#### **Feature 9.5: UX Polish & Templates** ⚠️ Partial (3 of 5 waves)

**Completed:**
- ✅ Wave 9.5.2: AI-assisted workflow generation
  - `AIWorkflowGenerator.tsx` - UI for natural language workflow creation
  - `AIWorkflowGenerator.ts` - Claude generates workflows from descriptions
  - Support for project type and language hints

- ✅ Wave 9.5.3: Workflow testing UI
  - `WorkflowTestingPanel.tsx` - Test workflows with mock inputs
  - `TestNodeDialog.tsx` - Node-level testing
  - Test case saving and replay

- ✅ Wave 9.5.4: Prompt template editor
  - `PromptEditor.tsx` - Monaco-based prompt editing
  - `PromptEditorDialog.tsx` - Modal for prompt configuration
  - Template variable validation

**Deferred:**
- ❌ Wave 9.5.1: Template marketplace (deferred)
- ⏳ Wave 9.5.5: Performance optimization for 1000+ node workflows (not started)

### State Management
- `workflow.store.ts` - Workflow state, nodes, edges, execution status
- `executionHistory.store.ts` - Execution logs and history

### YAML Workflow Schema

```yaml
name: Example Workflow
description: A sample workflow
version: 1.0.0

inputs:
  - name: input_file
    type: string
    required: true

steps:
  - id: step1
    type: python
    script: |
      print(f"Processing {input_file}")
      result = process(input_file)

  - id: step2
    type: conditional
    condition: "${step1.success}"
    then: step3
    else: error_handler

outputs:
  - name: result
    value: "${step1.result}"
```

### Related ADRs
- **ADR-015:** React Flow for Visual Workflows
- **ADR-016:** Python Script Execution Security Strategy
- **ADR-017:** Workflow YAML Schema Design

---

## 6. RAG Knowledge Base

**Epic:** Epic 10 - RAG Knowledge Base
**Status:** ✅ Complete and Production Ready (12 waves)
**Documentation:** `/Docs/implementation/_main/epic-10-rag-knowledge-base.md`

### Purpose
Enable AI responses augmented with codebase context through vector search, allowing the AI to ground its responses in the actual project files.

### Feature Breakdown

#### **Feature 10.1: Vector Service & Embedding Infrastructure** ✅ Complete

**Services:**
- `VectorService.ts` - Hybrid semantic + keyword vector search
  - Uses **Vectra LocalIndex** (not vector-lite - see ADR-019)
  - Combines semantic search (70%) + keyword search (30%)
  - Top-K retrieval with relevance filtering

- `EmbeddingService.ts` - Local embedding generation
  - **Transformers.js** library for in-process inference
  - **all-MiniLM-L6-v2** model (~22MB download)
  - Generates 384-dimensional embeddings
  - <2 seconds per document
  - Fully offline after initial model download

- `MemoryMonitor.ts` - Real-time memory tracking
  - 500MB budget enforcement
  - Per-document memory accounting
  - Threshold warnings (80% yellow, 95% red)
  - Projection before adding documents

- `IndexPersistence.ts` - Disk persistence
  - Save/load vector index to disk
  - Automatic persistence on shutdown
  - Load previous index on startup

**IPC Handlers:**
- `vector-handlers.ts` - IPC bridge for renderer communication

**Features:**
- ✅ Hybrid search (semantic + keyword)
- ✅ Local embedding generation (privacy-preserving)
- ✅ 500MB memory budget with enforcement
- ✅ Persistent vector index across restarts
- ✅ Real-time memory monitoring

#### **Feature 10.2: Knowledge Base UI** ✅ Complete

**Components:**
- `KnowledgeTab.tsx` - Left sidebar tab (next to File Explorer)
- `DocumentList.tsx` - List of all indexed documents
- `DocumentItem.tsx` - Individual document with metadata:
  - File path and name
  - File size
  - Indexing timestamp
  - Status badge (indexed, indexing, failed)
- `MemoryUsageBar.tsx` - Visual memory budget indicator
  - Progress bar with color coding:
    - Green: <80% (healthy)
    - Yellow: 80-95% (warning)
    - Red: 95-100% (critical)
  - Text: "XXX MB / 500 MB"
  - Tooltip with breakdown
- `IndexingProgress.tsx` - Batch operation progress
  - Files processed count
  - Current file being indexed
  - Estimated time remaining
- `AddFilesDialog.tsx` - File/folder picker
  - Multi-select file picker
  - Directory picker (recursive indexing)
  - File type filtering

**State Management:**
- `knowledge.store.ts` - Zustand store with:
  - `documents` - Array of indexed documents
  - `memoryStatus` - Current memory usage
  - `isIndexing` - Indexing operation status
  - `ragEnabled` - Per-project RAG toggle
  - Actions: `addDocument`, `removeDocument`, `toggleRag`

**Features:**
- ✅ Visual document list with status
- ✅ Add files/folders via UI
- ✅ Remove documents from index
- ✅ Context menu integration ("Add to Knowledge" in File Explorer)
- ✅ Real-time memory usage display
- ✅ Batch indexing with progress
- ✅ Per-project RAG toggle persistence

#### **Feature 10.3: RAG Pipeline & Context Retrieval** ✅ Complete

**Services:**
- `DocumentChunker.ts` - Split documents into searchable chunks
  - Fixed-size: 500 tokens per chunk
  - Overlap: 50 tokens between chunks
  - Line-aware chunking (preserves line boundaries)
  - Metadata tracking (file path, line numbers, chunk index)

- `TokenCounter.ts` - Accurate token counting
  - Character-based estimation:
    - Prose: 4 characters per token
    - Code: 3.5 characters per token
  - Used for chunk sizing and budget enforcement

- `ContextBuilder.ts` - Assemble retrieved context
  - 4000 token budget (default)
  - Greedy assembly (highest relevance first)
  - Stops when budget reached
  - Tracks source attribution

- `RAGService.ts` - Main RAG orchestration
  - `retrieveContext(query, options)` - Main entry point
  - Calls VectorService for search
  - Filters by relevance (min score 0.3)
  - Builds context within token budget
  - Returns structured result with sources

- `PromptBuilder.ts` - Format context for AI
  - Injects context into system prompt
  - Formats with file paths and line numbers
  - Code block formatting for readability

**Features:**
- ✅ Automatic document chunking on indexing
- ✅ Hybrid search (semantic + keyword)
- ✅ Relevance filtering (top-5, min score 0.3)
- ✅ Token budget enforcement (4000 tokens default)
- ✅ Source attribution tracking
- ✅ Graceful fallback when no relevant context
- ✅ SOC compliance logging for all operations
- ✅ Prompt augmentation with retrieved context

#### **Feature 10.4: Chat Integration & Source Citations** ✅ Complete

**Components:**
- `RAGToggle.tsx` (Chat toolbar) - Enable/disable RAG for messages
  - Shows document count: "RAG (42 docs)"
  - Disabled when no documents indexed
  - Active state clearly indicated
  - Synced with knowledge.store

- `RAGStatusIndicator.tsx` - Visual feedback during retrieval
  - Spinner animation
  - "Searching knowledge base..." message
  - ARIA live region for accessibility

- `SourceCitations.tsx` - Collapsible source display
  - Appears below AI responses when RAG used
  - Header: "3 sources" (expandable)
  - Collapsed by default
  - Sources sorted by relevance score

- `SourceCitationItem.tsx` - Individual source with click-to-navigate
  - File path display: `src/services/RAGService.ts:45-67`
  - Relevance score: "85% relevant"
  - Code snippet preview (truncated)
  - Click opens file in Monaco editor at line range

- `RAGFailureWarning.tsx` - Non-blocking error display
  - Yellow warning banner
  - "Could not retrieve knowledge base context"
  - Dismissible with X button
  - Doesn't block chat flow (graceful degradation)

**Hooks:**
- `useChatRAG.ts` - RAG-augmented message flow
  - `sendMessageWithRAG(message, options)` - Automatic retrieval
  - Returns `RetrievedContext` with sources
  - Error handling with state management
  - `isRetrieving` flag for UI feedback

**State Extensions:**
- `chat.store.ts` extended with:
  - `sources?: SourceAttribution[]` - Per-message source tracking
  - `ragFailed?: boolean` - Retrieval failure flag
  - `attachSourcesToMessage(messageId, sources)` - Attach after retrieval
  - `markMessageRAGFailed(messageId)` - Flag retrieval failure

**Integration:**
- Modified `MessageInput.tsx` to retrieve context before sending
- Modified `ChatMessage.tsx` to display sources below responses
- Works with all AI providers (Claude, GPT, Gemini, Ollama)

**Features:**
- ✅ User-controlled RAG toggle in chat toolbar
- ✅ Automatic context retrieval when RAG enabled
- ✅ Real-time "Searching..." indicator during retrieval
- ✅ Source citations below AI responses
- ✅ Click-to-navigate to source files in editor
- ✅ Graceful fallback on retrieval failure
- ✅ Non-blocking error messaging
- ✅ Accessibility (WCAG 2.1 AA compliant)

### Performance Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Vector Search | <100ms | <50ms | ✅ Exceeded |
| Document Chunking | <200ms | <100ms | ✅ Exceeded |
| Context Retrieval | <200ms | 150ms | ✅ Exceeded |
| Full RAG Overhead | <300ms | <200ms | ✅ Met |

### Quality Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Test Coverage | >90% | 92% | ✅ Met |
| Tests Passing | 100% | 100% (392 tests) | ✅ Met |
| Security Score | >85 | 88/100 | ✅ Met |
| Architecture Compliance | >90% | 95% | ✅ Exceeded |
| Accessibility | WCAG 2.1 AA | WCAG 2.1 AA | ✅ Met |

### Security Assessment
- **Vulnerabilities:** 0 Critical, 0 High, 0 Medium, 2 Low
- **Low Findings:**
  - SEC-10.4-001: File path display (2.5 CVSS - acceptable)
  - SEC-10.4-002: Error message details (2.0 CVSS - acceptable)
- **Overall:** Production Ready ✅

### Technology Choices
- **Vector Store:** Vectra LocalIndex (not vector-lite)
  - Rationale: Better persistence, hybrid search, TypeScript support
  - See ADR-019 for detailed comparison
- **Embeddings:** Transformers.js with all-MiniLM-L6-v2
  - Local inference (privacy-preserving)
  - No API calls or external dependencies
  - 384-dimensional embeddings

### Related ADRs
- **ADR-018:** RAG Knowledge Base Architecture (Status: Accepted)
- **ADR-019:** Vectra LocalIndex for Vector Storage (Status: Accepted)

---

## 7. Logging & Infrastructure

**Epic:** Epic 7 - Infrastructure & Operations
**Status:** ✅ Complete
**Documentation:** `/Docs/implementation/archive/feature-7.1-logging-infrastructure.md`

### Purpose
Provide comprehensive logging infrastructure for debugging, monitoring, and SOC compliance traceability.

### Key Components

**Services:**
- `logger.ts` - Central logging service with Winston
  - Configurable log levels (DEBUG, INFO, WARN, ERROR)
  - File rotation (10MB max per file, 5 backup files)
  - JSON formatting for machine parsing
  - Console output for development

**UI Components:**
- `LogViewer.tsx` - Modal for viewing application logs
  - Filterable by level
  - Searchable by keyword
  - Real-time log streaming
  - Export logs to file
- `LogLevelSelector.tsx` - UI for changing log level on-the-fly
- `LogConfigPanel.tsx` - View log configuration and file size

**IPC Handlers:**
- `logs-handlers.ts` - IPC bridge for log operations

### Features
- ✅ Configurable log levels (DEBUG, INFO, WARN, ERROR)
- ✅ File-based logging with rotation
- ✅ SOC traceability logging for compliance
- ✅ Real-time log viewer in UI
- ✅ Log export functionality
- ✅ Performance metrics logging
- ✅ Error tracking with stack traces
- ✅ Service-based categorization (AI, FileSystem, Workflow, Vector, RAG)

### Log Structure
```json
{
  "timestamp": "2026-01-25T20:00:00.000Z",
  "level": "info",
  "service": "RAGService",
  "message": "Context retrieved successfully",
  "metadata": {
    "query": "how does authentication work",
    "chunksRetrieved": 5,
    "tokensUsed": 1847,
    "durationMs": 142
  }
}
```

### SOC Compliance
All sensitive operations logged with:
- User identity (when applicable)
- Operation type
- Timestamp (ISO 8601)
- Success/failure status
- Relevant metadata

---

## 8. Permission & Safety System

**Features:** 3.3 (Permission Request UX), 3.4 (Batch Permissions)
**Status:** ✅ Complete
**Documentation:** Integrated with Epic 3

### Purpose
Control AI access to sensitive operations with user approval, preventing unauthorized or dangerous actions.

### Key Components

**Services:**
- `PermissionService.ts` - Permission request and grant logic
  - Permission levels: VIEW, SAFE, DESTRUCTIVE
  - Session-based permission memory
  - Auto-approval rules for repeated operations

- `PathValidator.ts` - Path security validation
  - Prevents `../` path traversal attacks
  - Validates paths are within project directory
  - Canonicalizes paths before operations

**UI Components:**
- `PermissionModal.tsx` - User approval interface
  - Shows operation details (tool, target, risk level)
  - Options: Allow Once, Allow Always, Deny
  - Batch approval for multiple operations
  - Remember choice checkbox

**State Management:**
- `permission.store.ts` - Permission state and history

### Features
- ✅ Permission prompts for sensitive operations:
  - File writes/edits/deletions
  - Bash command execution
  - Directory traversal operations
- ✅ Risk-based permission levels:
  - VIEW: No confirmation needed (read-only)
  - SAFE: Confirmation recommended (writes)
  - DESTRUCTIVE: Strong confirmation required (deletes, dangerous bash)
- ✅ Batch permission approval for workflows
  - Single prompt for entire workflow
  - Review all operations before approval
- ✅ Session-based permission memory
  - "Allow Always" persists within session
  - Reset on application restart
- ✅ User-controlled access restrictions
- ✅ Directory sandboxing:
  - All operations confined to project root
  - No access to system directories
  - No access to parent directories

### Security Architecture
```
User Request → Tool → Permission Check → Path Validation → Execution
                ↓                              ↓
          Ask User (if needed)          Reject if invalid
```

### Related ADRs
- **ADR-008:** Permission Request UX Design
- **ADR-011:** Directory Sandboxing Strategy
- **ADR-012:** Bash Tool Safety Measures
- **ADR-014:** Batch Permission Approval for Workflows

---

## 9. Settings & Configuration

**Status:** ✅ Complete
**Documentation:** Integrated across epics

### Purpose
Provide user-configurable application settings with persistence across sessions.

### Key Components

**UI Components:**
- `SettingsModal.tsx` - Main settings interface
  - AI provider configuration
  - API key management
  - Log level selection
  - RAG preferences
  - UI preferences
- `LogLevelSelector.tsx` - Log level dropdown

**Services:**
- `SettingsService.ts` - Settings persistence to disk
- Configuration file: `~/.lighthouse-beacon/settings.json`

**State Management:**
- Settings integrated into feature-specific stores
- Global settings in `app.store.ts`

### Settings Categories

**AI Configuration:**
- Provider selection (Claude, GPT, Gemini, Ollama)
- Model selection per provider
- API key management (secure storage)
- Default system prompts

**Logging:**
- Log level (DEBUG, INFO, WARN, ERROR)
- File logging enable/disable
- Console logging enable/disable
- Log retention period

**RAG Preferences:**
- Enable/disable per project (persisted)
- Default retrieval settings (topK, minScore)
- Default token budget (4000 default)
- Auto-indexing on file open

**UI Preferences:**
- Theme (dark/light)
- Font size
- Panel sizes
- Keyboard shortcuts

**Workflow Preferences:**
- Default Python timeout
- Auto-save workflows
- Template directory location

### Features
- ✅ Persistent settings across sessions
- ✅ Per-project settings (RAG toggle)
- ✅ Global application settings
- ✅ Secure API key storage
- ✅ Settings export/import
- ✅ Reset to defaults

---

## 10. Layout & Navigation

**Status:** ✅ Complete
**Documentation:** Integrated with Epic 1

### Purpose
Provide intuitive, resizable multi-panel interface with flexible navigation between features.

### Key Components

**UI Components:**
- `ThreePanelLayout.tsx` - Main application layout
  - Left panel: Resizable (200-600px)
  - Center panel: Resizable (400px minimum)
  - Right panel: Flexible (fills remaining space)

- `ActivityBar.tsx` - Left sidebar with tab buttons
  - File Explorer icon
  - Workflows icon
  - Knowledge Base icon
  - Settings icon
  - Active state highlighting

- `ResizeDivider.tsx` - Draggable panel resize handles
  - Smooth dragging with preview
  - Double-click to reset to default
  - Minimum/maximum panel sizes enforced

- `FileExplorerPanel.tsx` - Left panel file tree
- `AIChatPanel.tsx` - Center panel chat interface
- `CodeEditorPanel.tsx` - Right panel Monaco editor

**State Management:**
- `layout.store.ts` - Panel state, sizes, active tabs
  - `leftPanelSize` - Persisted across sessions
  - `centerPanelSize` - Persisted across sessions
  - `activeLeftTab` - Current left panel tab
  - `leftPanelVisible` - Show/hide left panel

### Features
- ✅ Resizable three-panel layout
- ✅ Tab-based panel navigation:
  - File Explorer tab
  - Workflows tab
  - Knowledge Base tab
- ✅ Draggable resize handles
- ✅ Panel size persistence
- ✅ Keyboard navigation (Ctrl+1/2/3 for tabs)
- ✅ Panel collapse/expand
- ✅ Responsive to window resize
- ✅ Minimum panel sizes enforced
- ✅ Layout state persistence

### Layout Presets
- **Default:** 300px left | 600px center | flexible right
- **Code Focus:** 250px left | 400px center | maximize right
- **Chat Focus:** 250px left | maximize center | 400px right

---

## Technology Stack

### Core Technologies
- **Language:** TypeScript 5.3
- **Desktop Framework:** Electron 28.x
- **UI Framework:** React 18.2
- **Build Tool:** Vite 5.0
- **State Management:** Zustand 4.4

### AI & ML
- **AI SDK:** AIChatSDK (Lighthouse framework)
- **AI Providers:** Anthropic Claude, OpenAI GPT, Google Gemini, Ollama
- **Embeddings:** Transformers.js with all-MiniLM-L6-v2 model
- **Vector Search:** Vectra LocalIndex (hybrid semantic + keyword)

### UI & Visualization
- **Code Editor:** Monaco Editor 0.45
- **Workflow Canvas:** React Flow 11.10
- **Styling:** Tailwind CSS 3.4
- **Icons:** Lucide React 0.263
- **Markdown:** React Markdown 9.0

### Development & Testing
- **Testing Framework:** Vitest 1.0
- **Test Utilities:** React Testing Library 14.0
- **Linting:** ESLint 8.56
- **Formatting:** Prettier 3.1
- **Type Checking:** TypeScript strict mode

### Logging & Monitoring
- **Logger:** Winston 3.11
- **Performance:** Custom metrics collection

### Workflow Execution
- **YAML Parser:** js-yaml 4.1
- **Python Execution:** Child process with timeout enforcement
- **Schema Validation:** Ajv 8.12

---

## Feature Integration Map

This diagram shows how major features interact with each other:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Electron Main Process                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  AI Service  │  │  Vector Svc  │  │  Workflow    │         │
│  │  (Claude,    │  │  (Vectra +   │  │  Executor    │         │
│  │   GPT, etc)  │  │   Embeddings)│  │  (Python)    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│         └──────────┬───────┴──────────────────┘                 │
│                    │                                            │
│         ┌──────────▼──────────┐                                │
│         │   RAG Service       │                                │
│         │  (Context Retrieval)│                                │
│         └──────────┬──────────┘                                │
│                    │                                            │
│  ┌─────────────────▼─────────────────┐                         │
│  │    File System Service            │                         │
│  │  (Read, Write, Edit, PathValidator)│                        │
│  └─────────────────┬─────────────────┘                         │
│                    │                                            │
│  ┌─────────────────▼─────────────────┐                         │
│  │    Tool Registry & Execution      │                         │
│  │  (Permission checks, Safety)      │                         │
│  └─────────────────┬─────────────────┘                         │
│                    │                                            │
└────────────────────┼────────────────────────────────────────────┘
                     │ IPC
┌────────────────────▼────────────────────────────────────────────┐
│                     Electron Renderer Process                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              Three Panel Layout                      │      │
│  │  ┌──────────┬─────────────────┬─────────────────┐   │      │
│  │  │ Activity │   AI Chat       │  Monaco Editor  │   │      │
│  │  │   Bar    │   Panel         │     Panel       │   │      │
│  │  │          │                 │                 │   │      │
│  │  │ ┌──────┐ │ ┌─────────────┐ │ ┌─────────────┐ │   │      │
│  │  │ │ File │ │ │ RAG Toggle  │ │ │ Multi-tab   │ │   │      │
│  │  │ │ Tree │ │ │ Status Ind. │ │ │ Interface   │ │   │      │
│  │  │ └──────┘ │ │ Message List│ │ │ Syntax      │ │   │      │
│  │  │          │ │ Source Cites│ │ │ Highlighting│ │   │      │
│  │  │ ┌──────┐ │ │ Input Field │ │ │             │ │   │      │
│  │  │ │ Work │ │ └─────────────┘ │ └─────────────┘ │   │      │
│  │  │ │ flows│ │                 │                 │   │      │
│  │  │ └──────┘ │                 │                 │   │      │
│  │  │          │                 │                 │   │      │
│  │  │ ┌──────┐ │                 │                 │   │      │
│  │  │ │Knowl │ │                 │                 │   │      │
│  │  │ │ edge │ │                 │                 │   │      │
│  │  │ └──────┘ │                 │                 │   │      │
│  │  └──────────┴─────────────────┴─────────────────┘   │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              State Management (Zustand)              │      │
│  │  chat.store | editor.store | workflow.store         │      │
│  │  knowledge.store | layout.store | permission.store  │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Integration Points

1. **RAG ↔ Chat:**
   - RAG toggle in chat toolbar
   - Automatic context retrieval before AI message
   - Source citations displayed below AI responses
   - Click-to-navigate from citations to editor

2. **RAG ↔ File System:**
   - Knowledge tab shows indexed files
   - File Explorer context menu "Add to Knowledge"
   - Automatic chunking on file add
   - Re-indexing on file modification

3. **Workflows ↔ File System:**
   - Workflow nodes can read/write files
   - Python execution with file access
   - Workflow output can open files in editor

4. **Workflows ↔ AI:**
   - ClaudeAPINode for AI-powered workflow steps
   - AI generates workflows from natural language
   - Workflows can call AI service for dynamic operations

5. **Chat ↔ File System:**
   - AI can use file operation tools
   - Chat can trigger file operations
   - Editor opens files from AI suggestions

6. **Chat ↔ Editor:**
   - AI can open files at specific lines
   - Code snippets from chat can be copied to editor
   - Diff view for AI-suggested changes

---

## Production Status & Metrics

### Epic Completion Status

| Epic | Name | Status | Waves | Test Coverage | Security |
|------|------|--------|-------|---------------|----------|
| 1 | Desktop Foundation | ✅ Complete | 14/14 | 95% | Approved |
| 2 | AI Integration | ✅ Complete | 6/6 | 92% | Approved |
| 3 | File Operations | ✅ Complete | 8/8 | 94% | Approved |
| 4 | Code Editor | ✅ Complete | 4/4 | 89% | Approved |
| 7 | Logging | ✅ Complete | 1/1 | 93% | Approved |
| 9 | Workflows | ⚠️ Partial | 12/13 | 88% | Approved |
| 10 | RAG Knowledge | ✅ Complete | 12/12 | 92% | Approved |

### Overall Statistics
- **Total Waves Completed:** 57/58 (98%)
- **Total Test Suites:** 150+
- **Total Tests:** 1,200+
- **Overall Test Pass Rate:** 100%
- **Average Code Coverage:** 92%
- **Security Audits Completed:** 7
- **Critical Vulnerabilities:** 0
- **Architecture Compliance:** 95%+

### Quality Gates
All production-ready features meet:
- ✅ >90% test coverage
- ✅ 100% test pass rate
- ✅ Zero critical/high security vulnerabilities
- ✅ Architecture compliance >90%
- ✅ WCAG 2.1 AA accessibility (where applicable)
- ✅ Performance benchmarks met or exceeded
- ✅ Documentation complete

### Known Limitations
1. **Wave 9.4.7** (Workflow Versioning) - Deferred to future release
2. **Wave 9.5.1** (Template Marketplace) - Deferred to future release
3. **Wave 9.5.5** (Performance Optimization) - Not started, acceptable for current scale
4. **Monaco Line Highlighting** - Source citations don't highlight lines (future enhancement)

### Next Steps
1. Complete Wave 9.5.5 (Performance optimization) if needed
2. User acceptance testing for Epic 10 (RAG)
3. Production deployment planning
4. User documentation and training materials
5. Consider Epic 11 scope (next major feature area)

---

## Appendices

### A. Related Documentation
- **Architecture Decisions:** `/Docs/architecture/decisions/` (19 ADRs)
- **Implementation Plans:** `/Docs/implementation/_main/` (Epic master plans)
- **Wave Details:** `/Docs/implementation/iterations/` (Individual wave specifications)
- **Quality Reports:** `/Docs/reports/` (Test, security, architecture reviews)
- **Archived Planning:** `/Docs/planning/archive/` (Historical planning documents)

### B. Key Files Reference

**Main Process:**
- `src/main/index.ts` - Main process entry point
- `src/main/services/` - All backend services
- `src/main/ipc/` - IPC handler registration

**Renderer Process:**
- `src/renderer/index.tsx` - Renderer entry point
- `src/renderer/components/` - All React components
- `src/renderer/stores/` - Zustand state management
- `src/renderer/hooks/` - Custom React hooks

**Shared:**
- `src/shared/types/` - TypeScript type definitions
- `src/preload/index.ts` - Preload script (context bridge)

### C. Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run lint            # Run ESLint
npm run format          # Run Prettier

# Testing
npm run test            # Run all tests
npm run test:coverage   # Run with coverage
npm run test:watch      # Watch mode

# Production
npm run dist            # Build distributable
```

---

**Document Version:** 1.0
**Last Updated:** January 25, 2026
**Maintained By:** Development Team
**Next Review:** After Epic 11 Planning
