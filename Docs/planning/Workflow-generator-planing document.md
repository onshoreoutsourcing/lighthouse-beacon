# Workflow Generator & Runner - Planning Document

**Date:** 2026-01-20
**Status:** Initial Planning - For Discussion
**Project:** Lighthouse Beacon

---

## Overview

We're planning to build a visual workflow system that allows developers to create, edit, and run multi-step workflows that combine Python scripts with AI (Claude) processing. This goes beyond simple automation by providing a visual editor, AI-assisted editing, and integration with the chat interface.

### Core Components

1. **Visual Workflow Editor** - Drag-and-drop interface to design workflows
2. **Workflow Visualizer** - See workflows as node graphs, click to edit
3. **YAML Definition System** - Declarative workflow definitions
4. **Python Script Standard** - Standardized input/output interface for scripts
5. **Workflow Runner** - Execute workflows with context passing
6. **AI Chat Integration** - Edit nodes with AI, use workflow outputs in chat

---

## What We're Building

### Vision

A developer opens Lighthouse Beacon and:
1. Creates a new workflow using visual editor
2. Drags Python script nodes and Claude nodes onto canvas
3. Connects nodes to define execution flow
4. Clicks a node → edits it manually OR asks AI chat to modify it
5. Runs the workflow and sees results
6. Uses workflow outputs in subsequent chat conversations

### Example Workflow

**Documentation Generator:**
```
[Python: fetch_repo_info]
    ↓
[Claude: analyze_and_generate_docs]
    ↓
[Python: save_markdown_file]
    ↓
[Output: documentation saved, summary available in chat]
```

User can:
- Click on "analyze_and_generate_docs" node
- See/edit prompt template
- OR ask AI chat: "Make this prompt focus more on API documentation"
- Run workflow
- Chat with AI about the generated documentation (using workflow output as context)

---

## Key Features to Discuss

### 1. Visual Workflow Editor

**What We Want:**
- Canvas-based editor (like n8n, Retool Workflows)
- Drag nodes from palette onto canvas
- Connect nodes to define execution order
- Node types: Python Script, Claude API, Input, Output, Conditional
- Zoom, pan, auto-layout
- Save workflows as YAML files
- Load existing YAML workflows into visual editor

**Questions:**
- **UI Framework:** What should we use for the node graph editor?
  - react-flow (React flow chart library)
  - xyflow (similar)
  - Custom canvas implementation
  - Other?

- **Node Palette:** What node types do we need for MVP?
  - Python Script (required)
  - Claude API Call (required)
  - Input/Output nodes (required)
  - Conditional/branching (future?)
  - Loop/iteration (future?)
  - Parallel execution (future?)

- **Workflow Storage:** How do we store workflows?
  - YAML files in project directory
  - Database (SQLite)
  - Both (YAML primary, DB for metadata)

### 2. YAML Definition Format

**Current Concept (from IDEAS.md):**
```yaml
workflow:
  name: "Documentation Generator"
  version: "1.0"

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
      model: claude-3-sonnet-20240229
      prompt_template: ./prompts/analyze_repo.txt
      inputs:
        repo_data: ${steps.fetch_repo.outputs.repo_data}
      outputs:
        - documentation

    - id: save_docs
      type: python
      script: ./scripts/save_markdown.py
      inputs:
        content: ${steps.generate_docs.outputs.documentation}
        path: ${workflow.inputs.output_path}
      outputs:
        - file_path

  outputs:
    documentation_path: ${steps.save_docs.outputs.file_path}
```

**Questions:**
- **Variable Syntax:** Use `${steps.step_id.outputs.var}` or something simpler?
- **Validation:** How do we validate YAML before running?
- **Versioning:** Support multiple workflow versions?
- **Conditions:** How do we represent if/else logic in YAML?

### 3. Python Script Standard

**What We Need:**
A standardized interface so Python scripts can be used as workflow nodes.

**Proposed Standard:**

```python
#!/usr/bin/env python3
"""
Workflow Script: Fetch Repository Info

Inputs:
  - repo_url: string (GitHub repository URL)

Outputs:
  - repo_data: dict (repository metadata)
"""

import sys
import json

def main(inputs: dict) -> dict:
    """
    Main entry point for workflow script.

    Args:
        inputs: Dictionary of input variables from workflow

    Returns:
        Dictionary of output variables for next step
    """
    repo_url = inputs.get('repo_url')

    # Do work here
    repo_data = fetch_repo_info(repo_url)

    # Return outputs
    return {
        'repo_data': repo_data,
        'status': 'success'
    }

if __name__ == '__main__':
    # Read inputs from stdin (JSON)
    inputs = json.loads(sys.stdin.read())

    # Execute main function
    outputs = main(inputs)

    # Write outputs to stdout (JSON)
    print(json.dumps(outputs))

    # Exit with success code
    sys.exit(0)
```

**Questions:**
- **Input Method:** stdin (JSON) or command-line args?
- **Output Method:** stdout (JSON) or file?
- **Error Handling:** How should scripts report errors?
  - Exit codes?
  - Error key in output JSON?
  - Both?
- **Dependencies:** How do we handle script dependencies (pip packages)?
  - requirements.txt per script?
  - Virtual environments?
  - Document but don't manage?
- **Validation:** Should scripts have a schema/contract?

### 4. Workflow Visualizer

**What We Want:**
- Display workflows as node graph
- Show execution status (running, completed, failed) per node
- Live updates during execution
- Click node to see:
  - Node configuration
  - Inputs received
  - Outputs produced
  - Logs/errors
  - Edit button → opens editor

**Questions:**
- **Execution View:** Should visualizer show real-time progress?
  - Highlight current executing node
  - Show data flowing between nodes
  - Display partial outputs
- **History:** Should we show past executions?
  - Execution history panel
  - Diff between runs
  - Replay/debug mode

### 5. Node Editing with AI Chat

**What We Want:**

User clicks a Claude node → opens panel showing:
- Node name/description
- Prompt template
- Model configuration
- Manual edit button
- **AI chat button** → opens chat interface

User types in AI chat:
- "Make this prompt focus more on security concerns"
- "Add a section about testing best practices"
- "Simplify the prompt, make it more concise"

AI chat:
- Understands current prompt context
- Generates updated prompt
- Shows diff (old vs new)
- User approves → prompt updated in node

**Questions:**
- **Chat Context:** How does AI know what to edit?
  - Pass node configuration as context
  - AI understands it's editing a workflow node
  - AI can see entire workflow for context
- **Approval Flow:** How does user approve changes?
  - Show diff before applying
  - One-click apply
  - Undo/redo support
- **Edit Scope:** What can AI edit?
  - Prompt templates (definitely)
  - Node configuration (maybe)
  - Entire workflow (future?)
- **Script Editing:** Can AI edit Python scripts too?
  - Edit script code directly
  - Generate new scripts from description
  - Modify script logic

### 6. Workflow Outputs in Chat

**What We Want:**

After running a workflow, outputs are available in chat context:

```
User: "Run the documentation generator workflow"
[Workflow executes...]
System: "Workflow completed successfully. Documentation saved to /docs/API.md"

User: "Can you summarize the documentation that was generated?"
AI: [Uses workflow output as context] "The generated API documentation covers..."

User: "What endpoints did it find?"
AI: [References workflow output] "Based on the generated documentation, I found these endpoints..."
```

**Questions:**
- **Output Storage:** Where do we store workflow outputs?
  - In-memory for current session
  - Persistent storage (database)
  - Both (recent in memory, history in DB)
- **Context Integration:** How does chat access workflow outputs?
  - Automatically inject into chat context
  - User explicitly references workflow
  - AI can query workflow outputs
- **Output Format:** What format should outputs be in?
  - JSON (structured data)
  - Text (for display)
  - Both (JSON for processing, text for chat)
- **Lifetime:** How long should workflow outputs be available?
  - Current session only
  - Until workspace closed
  - Persist across sessions

---

## Architecture Overview

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process                          │
├─────────────────────────────────────────────────────────────┤
│  Workflow Editor (React)                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Canvas (react-flow)                                   │   │
│  │ - Node palette                                        │   │
│  │ - Drag-and-drop nodes                                 │   │
│  │ - Connect nodes                                       │   │
│  │ - Zoom/pan/auto-layout                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Node Editor Panel                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - Node configuration                                  │   │
│  │ - Manual edit mode                                    │   │
│  │ - AI chat edit mode                                   │   │
│  │ - Input/output mapping                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Workflow Visualizer                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - Execution status display                            │   │
│  │ - Real-time progress                                  │   │
│  │ - Node outputs/logs                                   │   │
│  │ - Execution history                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Workflow Store (Zustand)                                    │
│  - Workflows list                                            │
│  - Current workflow state                                    │
│  - Execution state                                           │
│  - Output cache                                              │
└──────────────────┬──────────────────────────────────────────┘
                   │ IPC
┌──────────────────▼──────────────────────────────────────────┐
│                    Main Process                              │
├─────────────────────────────────────────────────────────────┤
│  WorkflowRunner                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - Parse YAML workflow                                 │   │
│  │ - Execute steps sequentially                          │   │
│  │ - Manage context/variables                            │   │
│  │ - Execute Python scripts (child_process)              │   │
│  │ - Call Claude API (via AIService)                     │   │
│  │ - Emit progress events                                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  WorkflowStorage                                             │
│  - Load/save YAML files                                      │
│  - Validate workflow definitions                             │
│  - Manage workflow metadata                                  │
│                                                              │
│  ExecutionManager                                            │
│  - Track running workflows                                   │
│  - Store execution history                                   │
│  - Cache workflow outputs                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Examples

### Creating a Workflow

```
1. User opens Workflow Editor tab
2. User drags "Python Script" node onto canvas
3. User clicks node → Node Editor panel opens
4. User configures node:
   - Script path: ./scripts/fetch_data.py
   - Inputs: { url: "${workflow.inputs.url}" }
   - Outputs: [ "data" ]
5. User drags "Claude API" node onto canvas
6. User connects "Python Script" → "Claude API"
7. User configures Claude node:
   - Prompt template: "Analyze this data: ${steps.fetch_data.outputs.data}"
   - Model: claude-3-sonnet
8. User saves workflow
   → YAML file created: ./workflows/data-analyzer.yaml
   → Workflow added to workflows list
```

### Editing a Node with AI Chat

```
1. User clicks "Claude API" node
2. Node Editor panel opens showing:
   - Current prompt template
   - Model configuration
3. User clicks "Edit with AI" button
4. AI Chat panel opens with context:
   - System message: "You are editing a Claude API node in a workflow..."
   - Current node configuration shown
5. User types: "Make this prompt focus on security vulnerabilities"
6. AI generates updated prompt template
7. AI shows diff (old vs new)
8. User clicks "Apply"
9. Node configuration updated
10. Workflow marked as modified (unsaved changes)
```

### Running a Workflow

```
1. User clicks "Run Workflow" button
2. Renderer sends IPC: workflow:run
3. Main: WorkflowRunner loads workflow YAML
4. Main: Validates workflow definition
5. Main: Prompts user for workflow inputs (if any)
6. Main: Executes step 1 (Python script)
   - Spawns child process
   - Passes inputs via stdin (JSON)
   - Captures stdout (JSON outputs)
   - Emits progress event → Renderer updates visualizer
7. Main: Executes step 2 (Claude API)
   - Interpolates inputs from step 1 outputs
   - Calls AIService.sendMessage()
   - Captures response
   - Emits progress event
8. Main: Executes step 3 (Python script)
   - Passes Claude output as input
   - Captures final output
9. Main: Workflow complete
   - Stores outputs in ExecutionManager
   - Emits completion event
10. Renderer: Shows completion notification
11. Renderer: Workflow outputs available in chat context
```

### Using Workflow Outputs in Chat

```
1. User runs "Documentation Generator" workflow
2. Workflow completes, outputs stored:
   {
     "documentation_path": "/docs/API.md",
     "documentation_summary": "Generated API docs for 15 endpoints...",
     "documentation_content": "[full markdown content]"
   }
3. User switches to Chat tab
4. User types: "What endpoints are documented?"
5. Renderer checks: recent workflow outputs available
6. Renderer augments chat context with workflow outputs
7. AI receives:
   - User message
   - Workflow output metadata
   - (Optional) Full workflow output content
8. AI responds based on workflow outputs
```

---

## Technical Decisions to Make

### 1. Visual Editor Framework

**Options:**
- **react-flow** (most popular, actively maintained)
- **xyflow** (similar to react-flow)
- **Custom canvas** (full control, more work)

**Recommendation:** Start with react-flow - proven, well-documented, extensible

### 2. YAML vs JSON for Workflow Definitions

**YAML Pros:**
- More readable
- Supports comments
- Industry standard for config files

**JSON Pros:**
- Native JavaScript support
- Stricter validation
- Easier to parse

**Recommendation:** YAML for human editing, JSON as internal format

### 3. Python Script Input/Output Method

**Options:**
- **stdin/stdout (JSON)** - Clean, testable, language-agnostic
- **Command-line args** - Simpler for small inputs
- **File-based** - Good for large data

**Recommendation:** stdin/stdout for MVP (supports all data sizes, testable)

### 4. Error Handling Strategy

**Questions:**
- What happens when a Python script fails?
- What happens when Claude API call fails?
- Should workflows auto-retry?
- Should workflows have error recovery steps?

**Proposed Approach:**
- Scripts return error in JSON: `{ "error": "message" }`
- Workflow runner stops on first error
- User notified with clear error message
- Option to resume from failed step (future)

### 5. Workflow Execution Environment

**Questions:**
- Where do Python scripts run?
  - Same machine as Electron app
  - Docker containers (future)
  - Remote execution (future)
- How do we manage Python environments?
  - User's system Python
  - Bundled Python interpreter
  - Virtual environments per workflow

**Recommendation for MVP:** Use system Python, document requirements

---

## MVP Scope

### Must Have (Phase 1)

**Visual Editor:**
- [ ] Canvas with drag-and-drop
- [ ] Node types: Python Script, Claude API, Input, Output
- [ ] Connect nodes to define flow
- [ ] Save/load workflows as YAML

**Node Editing:**
- [ ] Manual edit mode (forms for configuration)
- [ ] AI chat edit mode (for Claude prompts)

**Workflow Runner:**
- [ ] Execute Python scripts (stdin/stdout JSON)
- [ ] Call Claude API
- [ ] Pass context between steps
- [ ] Show execution progress

**Chat Integration:**
- [ ] Workflow outputs available in chat context
- [ ] User can reference workflow results

### Nice to Have (Phase 2)

- [ ] Conditional nodes (if/else branching)
- [ ] Loop nodes (iterate over collections)
- [ ] Parallel execution
- [ ] Execution history and replay
- [ ] Workflow templates library
- [ ] AI-generated workflows from description

### Future Enhancements (Phase 3+)

- [ ] Remote execution (Docker, cloud)
- [ ] Workflow scheduling (cron-like)
- [ ] Workflow marketplace (share workflows)
- [ ] Real-time collaboration
- [ ] Version control integration (git)
- [ ] Workflow testing/debugging tools

---

## User Experience Questions

### 1. Where Does Workflow Editor Live?

**Options:**
- New tab in left sidebar (alongside Explorer, Knowledge)
- Separate window (Electron window)
- Right panel (replace chat when active)
- Full-screen mode (dedicated workflow view)

**Questions:**
- Should workflows be project-specific or global?
- Can users work on workflow and chat simultaneously?

### 2. How Do Users Discover Workflows?

**Options:**
- Workflows tab shows list of .yaml files in project
- Workflows stored in specific directory (.lighthouse/workflows/)
- Recent workflows shown first
- Search/filter workflows

### 3. How Do Users Manage Workflow Versions?

**Options:**
- Git versioning (workflows are just files)
- Built-in versioning (like Google Docs)
- No versioning (rely on git)

### 4. How Do Users Share Workflows?

**Options:**
- Export workflow → share YAML file
- Workflow marketplace/repository
- GitHub gists
- Copy/paste YAML

---

## Open Questions

### Technical

1. **Python Environment:** How do we handle Python dependencies for scripts?
2. **Large Outputs:** What if a script outputs 100MB of data?
3. **Long-Running Workflows:** How do we handle workflows that take hours?
4. **Concurrency:** Can multiple workflows run simultaneously?
5. **Security:** How do we sandbox Python script execution?

### UX

1. **Workflow Discovery:** How do users find and organize workflows?
2. **Node Library:** Do we provide built-in script nodes?
3. **Testing:** How do users test workflows before running?
4. **Debugging:** How do users debug failed workflows?
5. **Mobile:** Do we support workflow viewing on mobile (future)?

### Product

1. **Pricing:** Is this a premium feature?
2. **Target Users:** Developers only, or non-technical users too?
3. **Use Cases:** What are the top 5 use cases we optimize for?
4. **Differentiation:** How is this better than n8n, Zapier, etc.?

---

## Success Criteria

### MVP is Successful When:

- [ ] Users can create a simple workflow (3 nodes) in <5 minutes
- [ ] Users can run workflows and see results
- [ ] Python scripts can be integrated without modifying them
- [ ] AI chat can edit Claude prompts in workflows
- [ ] Workflow outputs are usable in chat conversations
- [ ] Workflows can be saved, loaded, and shared (YAML files)
- [ ] System is stable (no crashes during execution)

---

## Next Steps

1. **Review this document** - Discuss approach, answer questions
2. **Define MVP scope precisely** - What's in, what's out
3. **Make technical decisions** - Pick editor framework, standards
4. **Create Python script standard** - Finalize interface contract
5. **Design YAML format** - Complete workflow definition schema
6. **Build proof of concept** - Simple runner + 2-3 node workflow
7. **Iterate on UX** - Test with real workflows, refine editor

---

## Related Documents

- `/Docs/planning/IDEAS.md` - Original workflow concept
- Epic 2 documentation - AI chat integration (for node editing)
- Epic 3 documentation - File operations (for script management)

---

**Status:** Initial Planning - Awaiting Discussion
**Next Review:** TBD
**Owner:** TBD