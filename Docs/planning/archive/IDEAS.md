# Agentic Workflow System - Concept Document

**Date:** January 2026
**Status:** Ideation Phase

---

## The Problem

Currently building workflows that chain Python scripts with Claude API calls requires:
- Manual wiring of script outputs to API inputs
- Hardcoded Claude client logic in every project
- Repetitive boilerplate for context passing
- No standardized way to define multi-step workflows
- Difficult to reuse components across projects

**Example:** Project-Docs-Automation has `discovery.py` → `claude_client.py` → `generator.py`, but this pattern is manually constructed each time.

---

## What We Want

A simple, plug-and-play system for creating agentic workflows where:

1. **Scripts do work** - Python scripts perform discrete tasks (fetch data, process files, call APIs, etc.)
2. **Claude provides intelligence** - LLM analyzes, generates, decides based on script outputs
3. **Easy chaining** - Chain scripts → Claude → scripts → Claude without manual wiring
4. **Declarative configuration** - Define workflows in simple config files (YAML/JSON)
5. **Reusable components** - Scripts and prompts can be mixed and matched across workflows

**Inspiration:** Like n8n, Zapier, Prefect, but specifically designed for Claude agentic patterns.

---

## Core Concepts

### 1. Workflow Steps

A workflow is a sequence of steps. Each step is one of:

**Python Script Step**
- Executes a Python script
- Receives input (from previous steps or user)
- Returns output (JSON) for next step

**Claude API Step**
- Calls Claude with a prompt template
- Prompt can reference previous step outputs
- Returns Claude's response for next step

**Steps can chain in any order:**
```
Script → Claude → Script → Claude → Script
Script → Script → Claude → Script
Claude → Script → Claude → Script
```

### 2. Context Passing

Each step has access to:
- **Previous step outputs** - Results from any prior step
- **User input variables** - Provided when workflow starts
- **Environment variables** - API keys, config, etc.

Context flows automatically through the workflow.

### 3. Simple Script Interface

Scripts follow a minimal contract:
- Receive input via command-line args (JSON)
- Return output via stdout (JSON)
- No knowledge of workflow system required
- Testable in isolation

### 4. Prompt Templates

Claude prompts stored as templates:
- Separate from code
- Can reference context variables
- Reusable across workflows

---

## High-Level Architecture

### Components

**1. Workflow Definition (YAML/JSON)**
- Lists steps in order
- Specifies step type (python or claude)
- Defines input/output mappings
- Configures Claude parameters

**2. Workflow Runner (Engine)**
- Loads workflow definition
- Executes steps in sequence
- Manages context between steps
- Handles errors and logging

**3. Step Scripts (Python)**
- Standalone Python scripts
- Input via args, output via stdout
- Follow simple contract

**4. Prompt Templates**
- Text files with variable placeholders
- Template language for dynamic content
- Separate from workflow logic

### Execution Flow

```
1. Load workflow YAML
2. Parse user input variables
3. For each step in workflow:
   a. Interpolate inputs from context
   b. Execute step (script or Claude)
   c. Capture output
   d. Store in context for next step
4. Return final result
```

---

## Example Use Cases

### Use Case 1: Documentation Generation
```
1. [Script] Fetch repo info from GitHub
2. [Claude] Analyze documentation and generate sales doc
3. [Script] Save markdown file
```

### Use Case 2: Code Review Workflow
```
1. [Script] Get diff from git
2. [Claude] Review code changes, identify issues
3. [Script] Format as GitHub comment
4. [Claude] Generate suggested fixes
5. [Script] Post comment to PR
```

### Use Case 3: Data Analysis Pipeline
```
1. [Script] Extract data from database
2. [Claude] Identify patterns and anomalies
3. [Script] Generate visualizations
4. [Claude] Write executive summary
5. [Script] Email report to stakeholders
```

### Use Case 4: CRM Research (from our earlier work)
```
1. [Script] Search for CRM articles
2. [Claude] Analyze and extract insights
3. [Script] Format as markdown
4. [Claude] Review and improve
5. [Script] Save to research folder
```

---

## Key Design Principles

### 1. Simplicity First
- Minimal boilerplate
- Easy to understand workflow files
- Scripts are just scripts (no framework lock-in)

### 2. Composability
- Steps are independent
- Mix and match in different workflows
- Build library of reusable scripts

### 3. Transparency
- Clear what each step does
- Easy to debug (inspect outputs)
- No hidden magic

### 4. Flexibility
- Support various step types
- Extensible for future needs
- Not opinionated about script structure

### 5. Developer-Friendly
- Works with existing Python code
- Version control friendly (YAML configs)
- Standard tools and patterns

---

## Approach Overview

### Workflow Definition (YAML)
Define workflow declaratively:
- Step name, type, and configuration
- Input/output variable mapping
- Claude model and parameters
- Conditional logic (future)

### Runner Implementation
Core engine that:
- Parses YAML configuration
- Executes Python scripts via subprocess
- Calls Claude API with Anthropic SDK
- Manages context dictionary
- Interpolates variables (${path.to.value})
- Handles errors and retries

### Script Contract
Minimal requirements:
- Accept JSON args
- Return JSON output
- Exit codes for success/failure
- No coupling to runner

### Template System
Simple variable substitution:
- Reference context variables
- Support basic iteration/conditionals
- Keep prompts readable

---

## What Makes This Different

### vs Manual Scripting
- No boilerplate for Claude client
- Automatic context passing
- Declarative workflow definition

### vs n8n/Zapier
- Designed specifically for Claude workflows
- Python scripts (not visual nodes)
- Developer-focused (version control, testing)

### vs Langchain/LlamaIndex
- Simpler, less abstraction
- Focus on workflows, not agents
- Scripts remain independent

### vs Custom Code
- Reusable components
- Standardized patterns
- Less maintenance

---

## Success Criteria

A successful implementation would:

1. **Reduce setup time** - New workflows in minutes, not hours
2. **Improve reusability** - Share scripts across projects
3. **Simplify maintenance** - Change workflow without touching code
4. **Enable experimentation** - Try different Claude prompts easily
5. **Stay out of the way** - Scripts work with or without runner

---

## Open Questions

1. **Conditional logic** - How to handle if/else branching in workflows?
2. **Loops** - Support iterating over collections?
3. **Error handling** - Retry logic, fallbacks, notifications?
4. **Parallel execution** - Run independent steps concurrently?
5. **State management** - Persist workflow state for long-running processes?
6. **Monitoring** - Logging, metrics, observability?
7. **Template language** - Use existing (Jinja2) or custom simple one?

---

## Next Steps (When Ready)

1. **Define minimal spec** - Exactly what YAML format looks like
2. **Build proof of concept** - Simple runner with 2-3 steps
3. **Test with real use case** - Port Project-Docs-Automation workflow
4. **Iterate on design** - Learn what works, what doesn't
5. **Add features incrementally** - Start minimal, grow as needed

---

## Related Ideas

### Integration with Claude Code CLI
Could this work with our existing agent setup?
- Workflows could call Claude Code agents
- Agents could trigger workflows
- Shared context between systems

### Workflow Templates
Pre-built workflows for common patterns:
- Documentation generation
- Code review
- Data analysis
- Research synthesis

### GUI Builder (Future)
Visual workflow editor (like n8n):
- Drag-and-drop steps
- Live execution view
- Debug mode

---

**Status:** Concept phase - no implementation yet
**Next:** Define exact requirements when ready to build
