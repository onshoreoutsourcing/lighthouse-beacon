# Workflow Generator Research & Recommendations

**Date:** January 21, 2026
**Status:** Research Analysis
**Documents Analyzed:**
- `Workflow-generator-planing document.md`
- `lighthouse-workflow-specification.md`

---

## Executive Summary

This research analyzes Lighthouse's proposed workflow generator feature against industry implementations (n8n, Langflow, Flowise, GitHub Actions) to provide concrete recommendations for architecture, technical decisions, and implementation approach.

**Key Finding:** The planning documents are comprehensive and well-structured. The proposed YAML-based approach with Python script integration aligns with industry best practices, but there are critical implementation details we can learn from existing platforms.

---

## Document Analysis

### Planning Document Strengths

1. **Clear Vision** - Excellent user experience framing with concrete examples
2. **Comprehensive Scope** - Covers MVP, Phase 2, and Phase 3+ enhancements
3. **Technical Depth** - Addresses Python script contracts, YAML formats, error handling
4. **Open Questions** - Honestly identifies unknowns and decisions needed

### Specification Document Strengths

1. **Complete YAML Format** - Detailed schema with validation rules
2. **Python Contract** - Comprehensive stdin/stdout JSON interface with error handling
3. **Variable Interpolation** - Clear syntax for `${...}` references
4. **Real-World Examples** - Three complete workflow examples showing practical usage

### Gaps Identified in Planning

1. **No discussion of workflow execution isolation** (containers, sandboxing)
2. **Limited error recovery strategies** beyond "stop on first error"
3. **No guidance on large data handling** (>10MB outputs between steps)
4. **Missing real-time collaboration** considerations (concurrent editing)
5. **No version migration strategy** for workflow format changes

---

## Industry Implementation Analysis

### 1. n8n - Visual Workflow Editor

**Source:** [n8n Guide 2026](https://hatchworks.com/blog/ai-agents/n8n-guide/), [n8n GitHub](https://github.com/n8n-io/n8n)

#### Architecture Highlights

- **Built with:** TypeScript and Node.js
- **Visual Editor:** Drag-and-drop interface with instant result preview
- **Node System:** Each node = API call, data transformation, event trigger, or flow control
- **Execution:** Schedules, webhooks, or manual triggers
- **Scale:** 400+ pre-built integrations

#### Key Features Lighthouse Should Adopt

1. **Fast Iteration Loop** - "See results instantly" approach
   - **Recommendation:** Add "Test Step" button on each node to execute in isolation
   - Shows output preview without running entire workflow
   - Critical for debugging multi-step workflows

2. **Explicit Architecture with Guardrails**
   - n8n emphasizes "mix AI, code, and human steps in a reliable way"
   - **Recommendation:** Add validation checks before workflow execution:
     - Check all scripts exist and are executable
     - Validate Claude API key is configured
     - Warn about expensive operations (large loops, many API calls)

3. **Self-Hosting Option**
   - n8n offers cloud and self-hosted deployment
   - **Recommendation:** Lighthouse's Electron app is already "self-hosted"
   - Document this as a privacy/security advantage over cloud-only tools

#### Lessons from n8n's $2.5B Valuation (2025)

- **Fair-code license** (open source with restrictions for cloud providers)
- **Native AI capabilities** built into the platform
- **400+ integrations** - breadth of connectivity matters

**Lighthouse Opportunity:** Position as "n8n for developers" - deeper Python integration, Claude-native, desktop-first

---

### 2. React Flow - Visual Editor Implementation

**Source:** [React Flow Docs](https://reactflow.dev), [React Flow Guide](https://www.bacancytechnology.com/blog/react-flow-tutorial)

#### Technical Implementation Details

**Core Capabilities:**
- Built-in node dragging, zooming, panning, multi-select
- Virtualization for rendering only visible nodes (handles 1000+ nodes)
- Rebranded as **XyFlow** with enhancements

#### Drag-and-Drop Best Practices

**From React Flow Examples:**

1. **External Drag Sources**
   - Use native HTML Drag and Drop API for palette → canvas
   - React Flow handles node → node connections internally
   - **Lighthouse Implementation:**
     ```typescript
     // Drag from palette
     onDragStart={(event, nodeType) => {
       event.dataTransfer.setData('application/reactflow', nodeType);
     }}

     // Drop on canvas
     onDrop={(event) => {
       const type = event.dataTransfer.getData('application/reactflow');
       addNode({ type, position: projectCoordinates(event) });
     }}
     ```

2. **DragHandle for Complex Nodes**
   - Important for form-style nodes with inputs
   - Prevents accidental dragging when interacting with form fields
   - **Recommendation:** Use `<DragHandle>` wrapper on node title bar only

3. **Helper Lines for Alignment**
   - Visual guides when aligning nodes horizontally/vertically
   - Automatic snapping to grid or other nodes
   - **Lighthouse Priority:** Medium (nice UX enhancement for Phase 2)

4. **Performance Optimization**
   - Virtualization automatically renders only visible nodes
   - Critical for workflows with 100+ steps
   - **Recommendation:** Enable by default, no custom work needed

#### Recommended UI Components

```typescript
import ReactFlow, {
  Controls,      // Zoom buttons, fit view
  MiniMap,       // Workflow overview
  Background     // Dot/grid background
} from 'reactflow';

// Lighthouse Editor Layout
<ReactFlow nodes={nodes} edges={edges}>
  <Background variant="dots" />
  <Controls />
  <MiniMap />
</ReactFlow>
```

**Decision:** Use React Flow (XyFlow) as recommended in planning document ✅

---

### 3. Langflow & Flowise - AI Workflow Builders

**Source:** [Langflow vs Flowise Comparison](https://www.leanware.co/insights/compare-langflow-vs-flowise), [Langflow GitHub](https://github.com/langflow-ai/langflow)

#### Architecture Comparison

| Feature | Langflow | Flowise | **Lighthouse** |
|---------|----------|---------|----------------|
| **Language** | Python | Node.js | TypeScript (Electron) + Python scripts |
| **AI Focus** | LangChain integration | OpenAI/LLM workflows | Claude-native |
| **Deployment** | Cloud + Self-hosted | Cloud + Docker | Desktop (self-hosted) |
| **Target Users** | Python developers | JavaScript developers | Technical teams |
| **Source Access** | Full Python source for components | Limited customization | Python scripts (full control) |

#### Key Insights for Lighthouse

**1. Python Integration (from Langflow)**

> "You can access and modify the Python source code of any component, giving full transparency and control, though this requires Python knowledge."

- **Lighthouse Advantage:** Users write their own Python scripts from scratch
- No framework lock-in - just stdin/stdout JSON contract
- Scripts are portable outside of Lighthouse

**2. Visual Builders (from Flowise)**

Flowise offers 3 visual builders:
- **Assistant** - Beginner-friendly chat assistant creation
- **Chatflow** - Single-agent systems and chatbots
- **Agentflow** - Multi-agent orchestration

**Lighthouse Opportunity:**
- Start with single workflow builder (MVP)
- Add "AI Assistant Builder" in Phase 2 (create chat assistants from workflows)
- Add "Multi-Workflow Orchestration" in Phase 3 (workflows calling workflows)

**3. Component Testing (from Langflow)**

> "The playground allows testing components individually for isolated debugging."

- **Critical Feature for Lighthouse MVP**
- Add "Test Node" button to run single step with mock inputs
- Shows output preview without running full workflow
- Saves development time during workflow creation

**Decision:** Implement isolated node testing in MVP ✅

---

### 4. Workflow Orchestration Patterns

**Source:** [Python Workflow Frameworks](https://www.advsyscon.com/blog/workload-orchestration-tools-python/), [Kestra Python Integration](https://kestra.io/features/code-in-any-language/python)

#### Industry Standards

**Popular Python Orchestration Tools:**

1. **Prefect** - "Workflow orchestration framework for building resilient data pipelines"
   - Python-native with scheduling, caching, retries, logging
   - Event-based orchestration
   - Built-in observability

2. **Apache Airflow** - DAG-based (Directed Acyclic Graphs)
   - Most mature, widely adopted
   - Strong for scheduled/batch workflows
   - Heavier runtime than Prefect

3. **Kestra** - Container-focused
   - **Key Feature:** "Integrates seamlessly with existing Python scripts without requiring changes"
   - "Simply allowing you to call your scripts as you have developed them"
   - Containerized execution for isolation

#### Recommendations for Lighthouse

**MVP Execution Model:**
- ✅ Use system Python (as planned)
- ✅ Child process execution (Node.js `child_process`)
- ✅ stdin/stdout JSON interface (proven pattern)

**Phase 2 Enhancement:**
- Add **Docker container execution** for isolation
- Follow Kestra's model: Each workflow step runs in isolated container
- Benefits:
  - Consistent Python environment
  - Isolated dependencies (no conflicts)
  - Reproducible execution
  - Scalable to remote execution

**Container Workflow:**
```yaml
steps:
  - id: fetch_data
    type: python
    script: ./scripts/fetch_data.py
    docker:                          # Optional - Phase 2
      image: python:3.11-slim
      volumes:
        - ./scripts:/workspace
    inputs:
      url: ${workflow.inputs.url}
```

**Decision:** System Python for MVP, add container option in Phase 2 ✅

---

### 5. YAML Format & Variable Interpolation

**Source:** [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions), [GitHub Actions Best Practices](https://www.integralist.co.uk/posts/github-actions/)

#### Variable Interpolation Best Practices

**GitHub Actions Lessons:**

1. **Avoid Nested Expressions**
   ```yaml
   # ❌ This doesn't work in GitHub Actions
   ${{ hashFiles('${{ env.WORKFLOWS_PATH }}/file.yml') }}

   # ✅ Use format() function instead
   ${{ hashFiles(format('{0}/file.yml', env.WORKFLOWS_PATH)) }}
   ```

   **Lighthouse Decision:**
   - Simpler syntax: `${steps.step_id.outputs.variable}`
   - No nesting: `${${...}}` is invalid
   - Use string concatenation if needed:
     ```yaml
     prompt: "Analyze: ${steps.fetch.outputs.code} for ${workflow.inputs.language}"
     ```

2. **Expression Syntax Requirements**
   - GitHub Actions requires `${{ }}` wrapper in most contexts
   - **Lighthouse Advantage:** Always use `${...}` - simpler, consistent

3. **Reserved Characters**
   - GitHub Actions: `!` is reserved in YAML
   - **Lighthouse:** Document reserved characters in spec:
     - `$` (variable prefix)
     - `|` (default value separator: `${var || default}`)
     - `{}` (expression delimiters)

#### Error Handling Patterns

**GitHub Actions Best Practices:**

1. **Step-level Conditionals**
   ```yaml
   - name: Backup on failure
     if: ${{ failure() }}
     run: ./backup.sh
   ```

   **Lighthouse Application:**
   ```yaml
   # Phase 2: Error recovery steps
   steps:
     - id: risky_operation
       type: python
       script: ./fetch_data.py
       on_error:
         action: continue  # or: stop, retry
         retry_count: 3
         retry_delay: 5
   ```

2. **Multiple Run Steps for Clarity**
   > "I would tend towards using separate run steps rather than one long multi-line run because it's harder to handle errors (or know where an error occurred)."

   **Lighthouse Implication:**
   - Encourage small, focused Python scripts
   - One script = one responsibility
   - Better error isolation
   - Easier debugging

**Decision:** Keep proposed `${...}` syntax, add conditional execution in Phase 2 ✅

---

### 6. AI-Assisted Prompt Editing

**Source:** [Claude Prompt Engineering Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices), [Builder.io Claude Integration](https://www.builder.io/blog/claude-code)

#### Visual Prompt Editing Interfaces

**Builder.io Approach:**
- Visual interface for Claude Code with live preview
- Normal chat interface for editing
- Figma-style design mode for visual edits
- Non-technical users can submit PRs

**Cursor Editor:**
- AI-first code editor with integrated agent
- Alternative to terminal-based approaches

**Lighthouse Opportunity:**
- Build similar visual interface for workflow editing
- AI chat can edit node prompts inline
- Preview changes before applying (diff view)

#### Claude Prompt Template Best Practices (2026)

**From Official Claude Docs:**

1. **Structure Like a Contract**
   - Explicit role definition
   - Clear goal
   - Constraints
   - Uncertainty handling
   - Output format specification

   **Lighthouse Node Prompt Template:**
   ```yaml
   system_prompt: |
     You are a [ROLE: e.g., security expert].

     Your task: [GOAL: e.g., analyze code for vulnerabilities]

     Focus on:
     - [CONSTRAINT 1]
     - [CONSTRAINT 2]

     If uncertain, [UNCERTAINTY HANDLING: e.g., flag as "needs review"]

     Output format: [FORMAT: e.g., JSON with {issues, severity, recommendations}]

   prompt: |
     Analyze this code:

     ${steps.fetch_code.outputs.code}

     Language: ${workflow.inputs.language}
   ```

2. **Separate Context from Instructions**
   - Don't mix in one paragraph
   - Use clear sections: INSTRUCTIONS, CONTEXT, TASK, OUTPUT FORMAT

   **Lighthouse Recommendation:**
   - Provide prompt template generator
   - Pre-structured with ROLE, GOAL, CONSTRAINTS, OUTPUT sections
   - Users fill in blanks, AI can help refine

3. **Variable Demarcation with XML Tags**
   ```xml
   <code>
   ${steps.fetch_code.outputs.code}
   </code>

   <language>
   ${workflow.inputs.language}
   </language>
   ```

   **Lighthouse Decision:**
   - Recommend XML tags for complex variables in documentation
   - Show examples in workflow templates
   - Not required, but best practice

#### AI-Assisted Node Editing Implementation

**Proposed Flow:**

1. **User clicks "Edit with AI" on Claude node**
   ```
   [Node Editor Panel]
   ┌─────────────────────────────────────┐
   │ Node: analyze_code                  │
   │                                     │
   │ [Manual Edit] [Edit with AI] ✨    │
   │                                     │
   │ Current Prompt:                     │
   │ ┌─────────────────────────────────┐ │
   │ │ Analyze this code for security  │ │
   │ │ vulnerabilities...              │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘
   ```

2. **AI Chat opens with context**
   ```
   [AI Chat Panel]
   System: You are editing the "analyze_code" node in the
   "Code Review Workflow". Current prompt focuses on
   security vulnerabilities.

   User: Make this prompt also check for performance issues

   AI: I'll update the prompt to include performance analysis...

   [Proposed Changes]
   - Added performance analysis section
   - Included time/space complexity checks
   - Added optimization recommendations

   [Show Diff] [Apply] [Cancel]
   ```

3. **Diff View Before Apply**
   ```diff
   - Analyze this code for security vulnerabilities
   + Analyze this code for security vulnerabilities and performance issues

   + Additionally, evaluate:
   + - Time complexity (Big O notation)
   + - Space complexity
   + - Optimization opportunities
   ```

**Decision:** Implement AI-assisted editing in MVP ✅

---

## Technical Recommendations

### 1. Visual Editor Framework ✅

**Decision: Use React Flow (XyFlow)**

**Rationale:**
- Industry standard (used by n8n alternatives)
- Built-in virtualization (1000+ nodes)
- TypeScript support
- Active community
- Handles drag-drop, zoom, pan out of the box

**Implementation:**
```typescript
import ReactFlow, { Controls, MiniMap, Background } from 'reactflow';

const WorkflowEditor: React.FC = () => {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
    >
      <Background variant="dots" gap={16} />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
};
```

---

### 2. Python Script Interface ✅

**Decision: Keep stdin/stdout JSON as specified**

**Rationale:**
- Kestra validation: "Integrates seamlessly without requiring changes"
- Language-agnostic (future: Node.js, Rust, Go scripts)
- Testable in isolation: `echo '{"input":"value"}' | python script.py`
- Industry standard for CLI tools

**Enhancement: Add Script Validator**

```python
# lighthouse-script-validator (CLI tool)
# Usage: lighthouse-validate-script script.py

def validate_script(script_path: str) -> dict:
    """
    Validates Python script adheres to Lighthouse contract.

    Checks:
    - Has docstring with Input/Output documentation
    - Reads from stdin
    - Writes to stdout
    - Returns JSON
    - Has error handling
    """
    issues = []

    # Parse script AST
    # Check for json.loads(sys.stdin.read())
    # Check for print(json.dumps(outputs))
    # Validate docstring format

    return {
        'valid': len(issues) == 0,
        'issues': issues,
        'suggestions': [...]
    }
```

**Decision:** Add script validator to MVP ✅

---

### 3. YAML Format ✅

**Decision: Keep proposed format with minor enhancements**

**Enhancement 1: Add Metadata for UI**

```yaml
workflow:
  name: "Documentation Generator"
  version: "1.0.0"

  # UI-specific metadata (optional)
  ui:
    layout:
      step1: { x: 100, y: 100 }
      step2: { x: 300, y: 100 }
    zoom: 1.0
    viewport: { x: 0, y: 0 }
```

**Rationale:**
- Preserves visual layout when reopening workflow
- Separates UI state from workflow logic
- Optional - doesn't affect execution

**Enhancement 2: Add Node Colors/Icons**

```yaml
steps:
  - id: fetch_data
    name: "Fetch Repository Data"
    type: python
    ui:
      color: "#3B82F6"        # Blue
      icon: "database"         # Icon identifier
    # ... rest of config
```

**Enhancement 3: Add Workflow Tags**

```yaml
workflow:
  tags:
    - automation
    - documentation
    - security
  category: "Code Analysis"
  difficulty: "intermediate"  # beginner, intermediate, advanced
```

**Rationale:** Helps with workflow discovery and organization

**Decision:** Add UI metadata in Phase 1, tags in Phase 2 ✅

---

### 4. Error Handling Strategy

**Current Spec:** "Workflow stops on first error"

**Recommended Enhancement (Phase 2):**

```yaml
workflow:
  error_handling:
    default: stop           # stop, continue, retry
    max_retries: 0
    retry_delay: 5          # seconds

steps:
  - id: fetch_data
    type: python
    script: ./fetch_data.py
    on_error:
      action: retry         # Override default
      max_retries: 3
      retry_delay: 10
      backoff: exponential  # exponential, linear, constant
```

**Retry Logic:**
- Attempt 1: immediate
- Attempt 2: wait 10s
- Attempt 3: wait 20s (exponential)
- Attempt 4: wait 40s
- Give up after max_retries

**Decision:** Stop-on-error for MVP, add retry in Phase 2 ✅

---

### 5. Large Data Handling

**Missing from Planning:** What if step output is 100MB JSON?

**Industry Pattern: Reference by File**

```yaml
steps:
  - id: fetch_large_dataset
    type: python
    script: ./fetch_data.py
    outputs:
      - data:
          type: file          # Store as file, not in context
          path: /tmp/workflow-123-step1-data.json
      - record_count: 150000  # Small metadata in context

  - id: process_data
    type: python
    script: ./process.py
    inputs:
      data_file: ${steps.fetch_large_dataset.outputs.data.path}
      # Script reads from file instead of stdin
```

**Implementation:**
1. If output >10MB, write to temp file
2. Store file path in context, not content
3. Next step receives file path as input
4. Cleanup temp files after workflow completes

**Decision:** Add large data handling in Phase 2 ✅

---

### 6. Workflow Versioning

**Missing from Planning:** How do workflows evolve over time?

**Recommended Strategy:**

```yaml
workflow:
  name: "Documentation Generator"
  version: "2.0.0"

  # Migration support
  migrations:
    from_version: "1.0.0"
    breaking_changes:
      - "Renamed output 'docs' to 'documentation'"
      - "Added required input 'language'"
    migration_script: ./migrations/1.0-to-2.0.py
```

**Lighthouse Version Compatibility:**
- App version: `1.5.0`
- Workflow spec version: `1.0` (from spec document)
- Individual workflow version: `2.0.0` (user's workflow)

**Validation:**
```typescript
function validateWorkflow(yaml: WorkflowYAML): ValidationResult {
  if (yaml.workflow.spec_version !== SUPPORTED_SPEC_VERSION) {
    return {
      valid: false,
      error: `Workflow requires spec version ${yaml.workflow.spec_version}, ` +
             `but app supports ${SUPPORTED_SPEC_VERSION}`
    };
  }
  // ... more validation
}
```

**Decision:** Add workflow versioning in MVP, migrations in Phase 2 ✅

---

## UX Recommendations

### 1. Workflow Discovery

**Inspired by:** VS Code File Explorer, n8n workflow list

**Recommended UI:**

```
[Workflows Tab]
┌─────────────────────────────────────────────┐
│ Workflows                          [+ New]  │
├─────────────────────────────────────────────┤
│ 📁 My Workflows (5)                         │
│   📄 Documentation Generator      v1.0.0    │
│   📄 Code Review Workflow         v2.1.0    │
│   📄 Data Analysis Pipeline       v1.0.0    │
│                                             │
│ 📁 Templates (10)                           │
│   📄 API Documentation Generator            │
│   📄 Security Audit Workflow                │
│   📄 Database Migration Helper              │
│                                             │
│ 📁 Recent (3)                               │
│   📄 Documentation Generator      v1.0.0    │
│   📄 Code Review Workflow         v2.1.0    │
│                                             │
│ [Search workflows...]                       │
│ Filter: [All] [My Workflows] [Templates]   │
└─────────────────────────────────────────────┘
```

**Features:**
- Hierarchical organization
- Version display
- Search and filter
- Templates library
- Recent workflows
- Create from template

---

### 2. Node Testing UI

**Critical Feature from Langflow:**

```
[Node Editor Panel]
┌─────────────────────────────────────────────┐
│ Node: fetch_repo_data                       │
│                                             │
│ Script: ./scripts/fetch_repo.py            │
│                                             │
│ Test Inputs:                                │
│ ┌─────────────────────────────────────────┐ │
│ │ {                                       │ │
│ │   "repo_url": "https://github.com/...", │ │
│ │   "include_metadata": true              │ │
│ │ }                                       │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Test Node]                                 │
│                                             │
│ ✅ Test Passed (1.2s)                       │
│ Outputs:                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ {                                       │ │
│ │   "repo_data": {...},                   │ │
│ │   "commit_count": 150,                  │ │
│ │   "file_list": [...]                    │ │
│ │ }                                       │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Implementation:**
1. User provides mock inputs JSON
2. Click "Test Node"
3. Runs script in isolation
4. Shows outputs + execution time
5. Displays errors clearly

**Decision:** Add node testing in MVP ✅

---

### 3. Execution Visualizer

**Inspired by:** n8n execution view

```
[Workflow Running]
┌─────────────────────────────────────────────┐
│ Documentation Generator - Running...         │
│ Started: 10:30:45 AM                        │
│                                             │
│  ✅ fetch_repo (1.2s)                       │
│      ├─ Input: repo_url                     │
│      └─ Output: repo_data, commit_count     │
│                                             │
│  ⏳ generate_docs (in progress...)          │
│      ├─ Input: repo_data                    │
│      └─ Waiting for Claude...               │
│                                             │
│  ⏸️ save_docs (pending)                     │
│                                             │
│ [View Logs] [Cancel]                        │
└─────────────────────────────────────────────┘
```

**Status Indicators:**
- ✅ Completed
- ⏳ Running
- ⏸️ Pending
- ❌ Failed
- ⚠️ Warning

**Decision:** Add execution visualizer in MVP ✅

---

## Implementation Priority

### Phase 1: MVP (Weeks 1-6)

**Week 1-2: Visual Editor**
- [ ] Set up React Flow canvas
- [ ] Implement node palette (Python, Claude nodes)
- [ ] Drag-and-drop from palette to canvas
- [ ] Connect nodes (edges)
- [ ] Save/load workflow (YAML)

**Week 3-4: Workflow Execution**
- [ ] YAML parser
- [ ] Variable interpolation engine
- [ ] Python script executor (child_process)
- [ ] Claude API integration (via existing AIService)
- [ ] Context management (steps.step_id.outputs)

**Week 5: Node Editing**
- [ ] Manual edit mode (forms)
- [ ] AI chat edit mode (for Claude prompts)
- [ ] Diff view before applying changes
- [ ] Node testing (isolated execution)

**Week 6: Integration & Polish**
- [ ] Chat integration (workflow outputs available)
- [ ] Execution visualizer (real-time status)
- [ ] Error display (clear messages)
- [ ] Documentation (user guide)

**MVP Success Criteria:**
- Users can create 3-node workflow in <5 minutes
- Python scripts execute with stdin/stdout JSON
- AI chat can edit Claude prompts
- Workflow outputs available in chat

---

### Phase 2: Enhanced Features (Weeks 7-10)

**Error Recovery:**
- [ ] Retry with backoff
- [ ] Continue on error
- [ ] Error recovery steps

**Advanced Nodes:**
- [ ] Conditional nodes (if/else)
- [ ] Loop nodes (iterate over arrays)
- [ ] Input nodes (runtime prompts)
- [ ] Output nodes (display results)

**Execution Improvements:**
- [ ] Docker container execution
- [ ] Large data handling (file references)
- [ ] Parallel step execution

**UX Enhancements:**
- [ ] Workflow templates library
- [ ] Execution history
- [ ] Workflow diff/comparison
- [ ] Export/share workflows

---

### Phase 3: Advanced Features (Weeks 11+)

**Collaboration:**
- [ ] Real-time collaborative editing
- [ ] Workflow comments/annotations
- [ ] Team workflow sharing

**Scheduling:**
- [ ] Cron-like workflow scheduling
- [ ] Event-triggered workflows
- [ ] Webhook triggers

**Monitoring:**
- [ ] Workflow analytics (execution times, success rates)
- [ ] Performance profiling
- [ ] Alert on failures

**Marketplace:**
- [ ] Public workflow repository
- [ ] Template marketplace
- [ ] Community workflows

---

## Risk Mitigation

### Risk 1: Python Environment Complexity

**Issue:** Users may have different Python versions, missing packages

**Mitigation:**
- **MVP:** Document required Python version (3.10+)
- **Phase 2:** Add Docker execution (isolated environments)
- **User Guide:** Show how to create virtual environment per workflow
- **Future:** Bundle Python interpreter with Electron app

---

### Risk 2: Large Data Performance

**Issue:** 100MB JSON in context → memory issues

**Mitigation:**
- **MVP:** Warn if output >10MB, suggest file-based approach
- **Phase 2:** Automatic file reference for large outputs
- **Documentation:** Best practices for large datasets

---

### Risk 3: Claude API Costs

**Issue:** Complex workflows with many Claude calls = expensive

**Mitigation:**
- **Show cost estimate** before running workflow
- **Token usage tracking** per step
- **Warning**: "This workflow uses 3 Claude API calls (~$0.15 per run)"
- **User setting**: Max cost per workflow run (blocks execution if exceeded)

---

### Risk 4: Workflow Versioning Confusion

**Issue:** User updates workflow, breaks old executions

**Mitigation:**
- **Workflow spec version**: `1.0` (Lighthouse platform)
- **Workflow version**: `2.0.0` (user's workflow)
- **Validation**: Check compatibility before loading
- **Migration scripts**: Help users upgrade workflows

---

## Competitive Positioning

### Lighthouse vs n8n

| Feature | n8n | Lighthouse |
|---------|-----|------------|
| **Deployment** | Cloud + Self-hosted | Desktop (self-hosted) |
| **Target Users** | Business users + Developers | Developers |
| **AI Integration** | Generic LLM nodes | Claude-native |
| **Script Language** | JavaScript | Python |
| **Integration Count** | 400+ | Focused (File ops, Claude, Python) |
| **Visual Editor** | Web-based | Desktop app |
| **Pricing** | Freemium + Enterprise | TBD (likely desktop = free?) |

**Lighthouse Positioning:** "n8n for developers" - deeper Python integration, Claude-native workflows, desktop privacy

---

### Lighthouse vs Langflow

| Feature | Langflow | Lighthouse |
|---------|----------|------------|
| **AI Framework** | LangChain | Claude API (direct) |
| **Language** | Python | TypeScript + Python scripts |
| **Customization** | Edit component Python | Write your own scripts |
| **Lock-in** | LangChain framework | None (portable scripts) |
| **Use Case** | LLM app development | Developer automation |

**Lighthouse Advantage:** No framework lock-in, scripts portable, Claude expertise

---

### Lighthouse vs GitHub Actions

| Feature | GitHub Actions | Lighthouse |
|---------|----------------|------------|
| **Scope** | CI/CD automation | General automation |
| **Execution** | Cloud runners | Local desktop |
| **Visual Editor** | No (YAML only) | Yes (drag-drop) |
| **AI Integration** | None | Claude-native |
| **Cost** | Free (with limits) | Desktop (self-hosted) |

**Lighthouse Advantage:** Visual editor, AI integration, local execution, general-purpose

---

## Open Questions for Discussion

### 1. Workflow Storage Location

**Options:**
- A. Project-specific: `.lighthouse/workflows/` (like `.github/workflows/`)
- B. Global: `~/Library/Application Support/lighthouse-beacon/workflows/`
- C. Both: Global templates + project-specific workflows

**Recommendation:** Option C
- Templates in global location
- User workflows in project `.lighthouse/workflows/`
- Clear separation, both visible in workflows list

---

### 2. Script Dependency Management

**Question:** How do users handle Python package dependencies?

**Options:**
- A. Don't manage (user's responsibility)
- B. Per-script `requirements.txt`
- C. Per-workflow virtual environment
- D. Docker containers (Phase 2)

**Recommendation:** Start with A (document best practices), add C in Phase 2

---

### 3. Workflow Sharing

**Question:** How do users share workflows?

**Options:**
- A. Export YAML file → share manually
- B. GitHub gists integration
- C. Built-in workflow marketplace
- D. Team workspace (cloud sync)

**Recommendation:**
- MVP: Option A (export YAML)
- Phase 2: Option B (gist integration)
- Phase 3: Option C (marketplace)

---

### 4. Real-time Collaboration

**Question:** Can multiple users edit same workflow simultaneously?

**Complexity:** High (requires operational transformation or CRDT)

**Recommendation:**
- MVP: No (single-user editing)
- Phase 3: Add collaborative editing (like Figma)
- Alternative: Git-based workflow (commit, merge, PR)

---

## Conclusion

The Lighthouse workflow generator planning is **comprehensive and well-designed**. The research validates the core technical decisions (React Flow, YAML, Python stdin/stdout) and identifies several enhancements from industry leaders:

**Must-Have Additions to MVP:**
1. ✅ Node testing (isolated step execution)
2. ✅ Execution visualizer (real-time status)
3. ✅ AI-assisted prompt editing with diff view
4. ✅ Script validator (checks contract compliance)

**Recommended Phase 2 Enhancements:**
1. Docker container execution (from Kestra)
2. Error retry with backoff (from GitHub Actions)
3. Large data file references (performance)
4. Workflow templates library (from Langflow/Flowise)

**Competitive Differentiation:**
- **vs n8n:** Developer-focused, Claude-native, desktop privacy
- **vs Langflow:** No framework lock-in, portable scripts
- **vs GitHub Actions:** Visual editor, AI integration, general-purpose

The planning documents provide a solid foundation. This research adds concrete implementation guidance from proven platforms to accelerate development and avoid common pitfalls.

---

## Sources

### Visual Workflow Editors
- [n8n Guide 2026: Features & Workflow Automation Deep Dive](https://hatchworks.com/blog/ai-agents/n8n-guide/)
- [n8n: The Future of Workflow Automation in 2026](https://kalashvasaniya.medium.com/n8n-the-future-of-workflow-automation-1d548616c307)
- [GitHub - n8n-io/n8n](https://github.com/n8n-io/n8n)

### React Flow Implementation
- [React Flow - Node-Based UIs in React](https://reactflow.dev)
- [React Flow: Everything you need to know](https://www.synergycodes.com/blog/react-flow-everything-you-need-to-know)
- [React Flow Guide Workflow Automation for Scalable Apps](https://www.bacancytechnology.com/blog/react-flow-tutorial)
- [Workflow Editor - React Flow](https://reactflow.dev/ui/templates/workflow-editor)

### AI Workflow Builders
- [LangFlow vs Flowise | Choose the Right AI Workflow Builder](https://www.leanware.co/insights/compare-langflow-vs-flowise)
- [GitHub - langflow-ai/langflow](https://github.com/langflow-ai/langflow)
- [Flowise vs Langflow (2025): Which Visual AI Builder Should You Choose?](https://www.houseoffoss.com/post/flowise-vs-langflow-2025-which-visual-ai-builder-should-you-choose)

### Workflow Orchestration
- [Python Workflow Framework: 4 Orchestration Tools to Know](https://www.advsyscon.com/blog/workload-orchestration-tools-python/)
- [GitHub - PrefectHQ/prefect](https://github.com/PrefectHQ/prefect)
- [Orchestrate your Python Scripts with Kestra](https://kestra.io/features/code-in-any-language/python)

### YAML & Variable Interpolation
- [Workflow syntax for GitHub Actions](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [GitHub Actions Best Practices](https://www.integralist.co.uk/posts/github-actions/)
- [Error Handling - YAML Workflow Engine](https://orieg.github.io/yaml-workflow/guide/error-handling/)

### AI Integration
- [Prompting best practices - Claude Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices)
- [Claude Prompt Engineering Best Practices (2026)](https://promptbuilder.cc/blog/claude-prompt-engineering-best-practices-2026)
- [How I use Claude Code (+ my best tips)](https://www.builder.io/blog/claude-code)

---

**Next Steps:**
1. Review recommendations with team
2. Finalize MVP scope decisions
3. Update planning documents with accepted enhancements
4. Create technical architecture document
5. Begin Phase 1 implementation
