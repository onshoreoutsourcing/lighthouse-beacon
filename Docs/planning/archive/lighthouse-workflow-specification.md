# Lighthouse Workflow Specification v1.0

**Document Version:** 1.0
**Date:** 2026-01-20
**Status:** Draft - For Review

---

## Table of Contents

1. [Overview](#overview)
2. [YAML Workflow Format](#yaml-workflow-format)
3. [Python Script Contract](#python-script-contract)
4. [Node Types](#node-types)
5. [Data Types & Variables](#data-types--variables)
6. [Execution Model](#execution-model)
7. [Error Handling](#error-handling)
8. [Complete Examples](#complete-examples)
9. [Validation Rules](#validation-rules)

---

## Overview

### Purpose

This specification defines the standard for creating, editing, and executing workflows in Lighthouse Beacon. Workflows are declarative definitions that chain Python scripts and Claude API calls to automate multi-step processes.

### Design Principles

1. **Declarative** - Workflows describe what to do, not how
2. **Composable** - Steps are independent and reusable
3. **Transparent** - Clear inputs, outputs, and data flow
4. **Testable** - Components can be tested in isolation
5. **Version-controllable** - YAML files work with git

### Terminology

- **Workflow** - A complete multi-step automation defined in YAML
- **Step** - A single node in the workflow (Python script or Claude API call)
- **Node** - Visual representation of a step in the editor
- **Context** - The data environment available during workflow execution
- **Input** - Data required by a step to execute
- **Output** - Data produced by a step for subsequent steps

---

## YAML Workflow Format

### Basic Structure

```yaml
workflow:
  # Metadata
  name: string          # Required: Workflow display name
  version: string       # Required: Semantic version (e.g., "1.0.0")
  description: string   # Optional: Brief description
  author: string        # Optional: Creator name
  created: string       # Optional: ISO 8601 date
  tags: [string]        # Optional: Categorization tags

  # Workflow inputs
  inputs:
    - name: type        # Required: Input parameters
    - name:
        type: string
        description: string
        default: any
        required: boolean

  # Execution steps
  steps:
    - id: string        # Required: Unique step identifier
      name: string      # Optional: Display name
      type: string      # Required: "python" or "claude"
      # ... type-specific configuration ...

  # Workflow outputs
  outputs:
    output_name: value_reference  # Map output names to step outputs
```

### Metadata Section

```yaml
workflow:
  name: "Documentation Generator"
  version: "1.0.0"
  description: "Generates API documentation from repository analysis"
  author: "John Doe"
  created: "2026-01-20T10:00:00Z"
  tags:
    - documentation
    - automation
    - api
```

**Rules:**
- `name` is required and must be unique within project
- `version` must follow semantic versioning (major.minor.patch)
- All metadata fields are optional except `name` and `version`

### Inputs Section

**Simple Input:**
```yaml
inputs:
  - repo_url: string
  - output_path: string
  - enable_logging: boolean
```

**Detailed Input:**
```yaml
inputs:
  - repo_url:
      type: string
      description: "GitHub repository URL"
      required: true
  - output_path:
      type: string
      description: "Where to save generated documentation"
      default: "./docs/API.md"
      required: false
  - max_depth:
      type: integer
      description: "Maximum recursion depth"
      default: 5
      required: false
```

**Supported Types:**
- `string` - Text value
- `integer` - Whole number
- `number` - Decimal number
- `boolean` - true/false
- `array` - List of values
- `object` - JSON object

**Rules:**
- All workflow inputs must be declared in this section
- Inputs without `required` field default to `required: true`
- Inputs with `default` value automatically become `required: false`

### Steps Section

Steps define the execution sequence of the workflow.

#### Python Script Step

```yaml
steps:
  - id: fetch_repo_data
    name: "Fetch Repository Information"
    type: python
    script: ./scripts/fetch_repo.py
    inputs:
      repo_url: ${workflow.inputs.repo_url}
      include_metadata: true
    outputs:
      - repo_data
      - commit_count
      - file_list
```

**Fields:**
- `id` (required) - Unique identifier for this step
- `name` (optional) - Human-readable name
- `type` (required) - Must be "python"
- `script` (required) - Path to Python script (relative to workflow file)
- `inputs` (optional) - Key-value map of inputs
- `outputs` (required) - List of output variable names

#### Claude API Step

```yaml
steps:
  - id: analyze_code
    name: "Analyze Code Quality"
    type: claude
    model: claude-3-sonnet-20240229
    max_tokens: 4096
    temperature: 0.7
    system_prompt: |
      You are a code quality expert. Analyze the provided code and identify:
      1. Security vulnerabilities
      2. Performance issues
      3. Code smell patterns
    prompt: |
      Analyze this repository:

      Files: ${steps.fetch_repo_data.outputs.file_list}
      Commits: ${steps.fetch_repo_data.outputs.commit_count}

      ${steps.fetch_repo_data.outputs.repo_data}
    inputs:
      repo_data: ${steps.fetch_repo_data.outputs.repo_data}
    outputs:
      - analysis
      - recommendations
      - severity_score
```

**Fields:**
- `id` (required) - Unique identifier
- `name` (optional) - Human-readable name
- `type` (required) - Must be "claude"
- `model` (required) - Claude model identifier
- `max_tokens` (optional) - Default: 4096
- `temperature` (optional) - Default: 1.0
- `system_prompt` (optional) - System message for Claude
- `prompt` (required) - User prompt (supports variable interpolation)
- `inputs` (optional) - Explicit input mapping for clarity
- `outputs` (required) - List of output variable names

**Supported Models:**
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`
- `claude-3-5-sonnet-20241022`

### Outputs Section

Maps workflow-level output names to step outputs:

```yaml
outputs:
  documentation: ${steps.generate_docs.outputs.documentation}
  file_path: ${steps.save_file.outputs.path}
  summary: ${steps.analyze_code.outputs.analysis}
  metadata:
    commit_count: ${steps.fetch_repo_data.outputs.commit_count}
    analysis_score: ${steps.analyze_code.outputs.severity_score}
```

**Rules:**
- Workflow outputs are available to chat context after execution
- Outputs can reference any step's outputs
- Outputs support nested structures (objects)

---

## Python Script Contract

### Interface Requirements

All Python scripts used in workflows MUST adhere to this contract:

#### 1. Input via stdin (JSON)

Scripts receive inputs as a JSON object via standard input:

```python
import sys
import json

# Read inputs from stdin
inputs = json.loads(sys.stdin.read())

# Access input values
repo_url = inputs.get('repo_url')
include_metadata = inputs.get('include_metadata', False)
```

#### 2. Output via stdout (JSON)

Scripts MUST return outputs as a JSON object via standard output:

```python
import json

# Prepare outputs
outputs = {
    'repo_data': repo_data,
    'commit_count': 150,
    'file_list': ['src/main.ts', 'src/utils.ts']
}

# Write outputs to stdout
print(json.dumps(outputs))
```

#### 3. Exit Codes

- **0** - Success (workflow continues)
- **Non-zero** - Error (workflow stops)

#### 4. Error Reporting

Scripts should include error information in output JSON:

```python
outputs = {
    'success': False,
    'error': 'Failed to connect to GitHub API',
    'error_code': 'GITHUB_API_ERROR'
}
print(json.dumps(outputs))
sys.exit(1)
```

### Complete Script Template

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
  - error: string (on failure) - Error message

Exit Codes:
  - 0: Success
  - 1: Error
"""

import sys
import json
import traceback


def fetch_repository_info(repo_url: str, include_metadata: bool = False) -> dict:
    """
    Fetch repository information from GitHub.

    Args:
        repo_url: GitHub repository URL
        include_metadata: Whether to include commit history

    Returns:
        Dictionary containing repository data
    """
    # Implementation here
    return {
        'name': 'example-repo',
        'description': 'Example repository',
        'stars': 100,
        # ... more data
    }


def main(inputs: dict) -> dict:
    """
    Main entry point for workflow script.

    Args:
        inputs: Dictionary of input variables from workflow

    Returns:
        Dictionary of output variables for next step
    """
    try:
        # Extract inputs
        repo_url = inputs.get('repo_url')
        include_metadata = inputs.get('include_metadata', False)

        # Validate required inputs
        if not repo_url:
            return {
                'success': False,
                'error': 'Missing required input: repo_url'
            }

        # Perform work
        repo_data = fetch_repository_info(repo_url, include_metadata)

        # Return outputs
        return {
            'success': True,
            'repo_data': repo_data,
            'commit_count': 150,
            'file_list': ['src/main.ts', 'src/utils.ts']
        }

    except Exception as e:
        # Return error information
        return {
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__,
            'traceback': traceback.format_exc()
        }


if __name__ == '__main__':
    try:
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

    except json.JSONDecodeError as e:
        # Handle JSON parsing error
        error_output = {
            'success': False,
            'error': f'Invalid JSON input: {e}'
        }
        print(json.dumps(error_output))
        sys.exit(1)

    except Exception as e:
        # Handle unexpected errors
        error_output = {
            'success': False,
            'error': f'Unexpected error: {e}',
            'traceback': traceback.format_exc()
        }
        print(json.dumps(error_output))
        sys.exit(1)
```

### Script Metadata (Recommended)

Add metadata as docstring comments:

```python
"""
Workflow Script: <Name>

Description: <What this script does>

Inputs:
  - input_name: type (required/optional) - Description
  - another_input: type (optional, default: value) - Description

Outputs:
  - output_name: type - Description
  - another_output: type - Description
  - error: string (on failure) - Error message

Dependencies:
  - requests>=2.28.0
  - beautifulsoup4>=4.11.0

Exit Codes:
  - 0: Success
  - 1: Error

Example:
  echo '{"url": "https://api.github.com/repos/owner/repo"}' | python script.py
"""
```

### Best Practices

1. **Always validate inputs** - Check required fields exist
2. **Use type hints** - Makes code self-documenting
3. **Handle errors gracefully** - Return error info in JSON
4. **Log to stderr** - Don't pollute stdout (reserved for JSON output)
5. **Keep it focused** - One script = one responsibility
6. **Make it testable** - Separate logic from I/O
7. **Document thoroughly** - Include metadata docstring

---

## Node Types

### Python Script Node

**Purpose:** Execute a Python script with input data and capture output

**Configuration:**
```yaml
type: python
script: string          # Path to Python script (required)
python_path: string     # Path to Python interpreter (optional)
working_dir: string     # Working directory (optional, default: workflow dir)
timeout: integer        # Timeout in seconds (optional, default: 300)
env: object            # Environment variables (optional)
inputs: object          # Input data (optional)
outputs: [string]       # Output variable names (required)
```

**Execution:**
1. Resolve script path relative to workflow file
2. Spawn Python process: `python script.py`
3. Pass inputs as JSON via stdin
4. Capture stdout as JSON outputs
5. Check exit code (0 = success)

### Claude API Node

**Purpose:** Call Claude API with a prompt and capture response

**Configuration:**
```yaml
type: claude
model: string           # Claude model (required)
prompt: string          # User prompt with variables (required)
system_prompt: string   # System message (optional)
max_tokens: integer     # Max response tokens (optional, default: 4096)
temperature: number     # Sampling temperature (optional, default: 1.0)
stop_sequences: [string] # Stop sequences (optional)
inputs: object          # Explicit input mapping (optional)
outputs: [string]       # Output variable names (required)
```

**Execution:**
1. Interpolate variables in prompt and system_prompt
2. Call Claude API with configuration
3. Capture response text
4. Parse outputs (by default, response becomes first output)

**Output Parsing:**

By default, Claude response becomes the first output variable:
```yaml
outputs:
  - analysis  # Full Claude response
```

To parse structured outputs, Claude must return JSON:
```yaml
prompt: |
  Analyze this code and return JSON:
  {
    "security_issues": [...],
    "performance_score": 0-100,
    "recommendations": [...]
  }
outputs:
  - security_issues
  - performance_score
  - recommendations
```

### Input Node (Future)

**Purpose:** Prompt user for runtime input

```yaml
type: input
prompt: string          # Prompt message (required)
input_type: string      # text, number, boolean, file (required)
default: any           # Default value (optional)
validation: string      # Validation regex (optional)
outputs: [string]       # Output variable names (required)
```

### Output Node (Future)

**Purpose:** Display results to user

```yaml
type: output
display: string         # Display format: text, json, markdown (required)
content: string         # Content to display with variables (required)
```

### Conditional Node (Future)

**Purpose:** Branch execution based on condition

```yaml
type: conditional
condition: string       # Boolean expression (required)
then: [step]           # Steps if true (required)
else: [step]           # Steps if false (optional)
```

### Loop Node (Future)

**Purpose:** Iterate over a collection

```yaml
type: loop
items: string          # Variable reference to array (required)
item_var: string       # Variable name for current item (required)
steps: [step]          # Steps to execute per iteration (required)
```

---

## Data Types & Variables

### Variable Reference Syntax

Use `${...}` syntax to reference variables:

**Workflow Inputs:**
```yaml
${workflow.inputs.repo_url}
${workflow.inputs.enable_logging}
```

**Step Outputs:**
```yaml
${steps.step_id.outputs.variable_name}
${steps.fetch_repo.outputs.repo_data}
${steps.analyze_code.outputs.security_issues}
```

**Environment Variables:**
```yaml
${env.HOME}
${env.GITHUB_TOKEN}
```

### Nested Access

Access nested object properties with dot notation:

```yaml
${steps.fetch_repo.outputs.repo_data.name}
${steps.fetch_repo.outputs.repo_data.owner.login}
```

### Array Access

Access array elements by index:

```yaml
${steps.fetch_files.outputs.file_list[0]}
${steps.analyze.outputs.issues[2].severity}
```

### Type Coercion

Variables are coerced based on context:

```yaml
# String interpolation in prompts
prompt: "Analyze repository: ${steps.fetch.outputs.repo_data}"
# → Converts object to JSON string

# Direct value passing in inputs
inputs:
  data: ${steps.fetch.outputs.repo_data}
# → Passes object as-is
```

### Default Values

Provide defaults with `||` operator:

```yaml
${workflow.inputs.max_depth || 5}
${steps.fetch.outputs.description || "No description"}
```

---

## Execution Model

### Sequential Execution

Steps execute in the order defined:

```yaml
steps:
  - id: step1       # Executes first
  - id: step2       # Executes second (after step1 completes)
  - id: step3       # Executes third (after step2 completes)
```

### Context Management

The workflow runner maintains a context dictionary:

```javascript
context = {
  workflow: {
    inputs: { /* user-provided inputs */ },
    outputs: { /* final outputs */ }
  },
  steps: {
    step1: { outputs: { /* step1 outputs */ } },
    step2: { outputs: { /* step2 outputs */ } },
    // ...
  },
  env: { /* environment variables */ }
}
```

### Variable Interpolation

Before executing each step:
1. Parse step configuration for `${...}` references
2. Look up values in context
3. Replace references with actual values
4. Pass resolved values to step

**Example:**
```yaml
steps:
  - id: analyze
    type: claude
    prompt: "Analyze: ${steps.fetch.outputs.code}"
```

Before execution, becomes:
```javascript
{
  id: 'analyze',
  type: 'claude',
  prompt: 'Analyze: function main() { /* actual code */ }'
}
```

### Step Execution Lifecycle

For each step:

```
1. PRE-EXECUTION
   - Resolve all variable references
   - Validate required inputs present
   - Emit "step-started" event

2. EXECUTION
   a. Python Script:
      - Spawn child process
      - Write inputs to stdin (JSON)
      - Read outputs from stdout (JSON)
      - Wait for process exit

   b. Claude API:
      - Construct API request
      - Call Claude API
      - Receive response
      - Parse outputs

3. POST-EXECUTION
   - Validate outputs match declared names
   - Store outputs in context
   - Emit "step-completed" event

4. ON ERROR
   - Capture error details
   - Emit "step-failed" event
   - Stop workflow execution
```

---

## Error Handling

### Error Types

**1. Validation Errors** (Pre-execution)
- Invalid YAML syntax
- Missing required fields
- Unknown node types
- Circular dependencies
- Invalid variable references

**2. Execution Errors** (During execution)
- Python script crashes (non-zero exit)
- Python script timeout
- Claude API errors (rate limit, invalid model, etc.)
- Network errors
- Invalid output format (not valid JSON)

**3. Runtime Errors** (During execution)
- Missing variable in context
- Type mismatch
- Null reference

### Error Response Format

When a step fails, the error object contains:

```json
{
  "step_id": "fetch_repo",
  "error_type": "ExecutionError",
  "message": "Script exited with code 1",
  "details": {
    "exit_code": 1,
    "stdout": "...",
    "stderr": "Error: Failed to connect...",
    "script_error": {
      "error": "Failed to connect to GitHub API",
      "error_code": "GITHUB_API_ERROR"
    }
  },
  "timestamp": "2026-01-20T10:30:00Z"
}
```

### Error Handling Behavior

**Current (MVP):**
- Workflow stops on first error
- User notified with error details
- Workflow marked as "failed"
- No automatic retry

**Future Enhancements:**
- Retry with backoff (configurable per step)
- Error recovery steps (fallback logic)
- Continue on error (mark step as failed but continue)
- Rollback on failure

---

## Complete Examples

### Example 1: Simple Documentation Generator

```yaml
workflow:
  name: "Documentation Generator"
  version: "1.0.0"
  description: "Generates API documentation from codebase"

  inputs:
    - repo_path: string
    - output_file: string

  steps:
    - id: scan_code
      type: python
      script: ./scripts/scan_codebase.py
      inputs:
        path: ${workflow.inputs.repo_path}
        extensions: [".ts", ".js"]
      outputs:
        - files
        - api_endpoints

    - id: generate_docs
      type: claude
      model: claude-3-sonnet-20240229
      system_prompt: "You are a technical documentation expert."
      prompt: |
        Generate comprehensive API documentation for these endpoints:

        ${steps.scan_code.outputs.api_endpoints}

        Include:
        - Endpoint description
        - Parameters
        - Response format
        - Example usage
      outputs:
        - documentation

    - id: save_docs
      type: python
      script: ./scripts/save_file.py
      inputs:
        content: ${steps.generate_docs.outputs.documentation}
        filepath: ${workflow.inputs.output_file}
      outputs:
        - saved_path
        - file_size

  outputs:
    documentation: ${steps.generate_docs.outputs.documentation}
    saved_to: ${steps.save_docs.outputs.saved_path}
```

### Example 2: Code Review Workflow

```yaml
workflow:
  name: "Automated Code Review"
  version: "1.0.0"

  inputs:
    - pr_number:
        type: integer
        description: "Pull request number"
        required: true
    - github_token:
        type: string
        description: "GitHub API token"
        required: true

  steps:
    - id: fetch_pr_diff
      type: python
      script: ./scripts/get_pr_diff.py
      inputs:
        pr_number: ${workflow.inputs.pr_number}
        token: ${workflow.inputs.github_token}
      outputs:
        - diff
        - files_changed
        - author

    - id: security_analysis
      type: claude
      model: claude-3-5-sonnet-20241022
      system_prompt: |
        You are a security expert. Analyze code for vulnerabilities:
        - SQL injection
        - XSS attacks
        - Authentication issues
        - Data exposure
      prompt: |
        Review this pull request for security issues:

        Files changed: ${steps.fetch_pr_diff.outputs.files_changed}

        Diff:
        ${steps.fetch_pr_diff.outputs.diff}

        Return JSON: {
          "security_issues": [...],
          "severity": "low|medium|high|critical",
          "recommendations": [...]
        }
      outputs:
        - security_issues
        - severity
        - recommendations

    - id: code_quality_analysis
      type: claude
      model: claude-3-sonnet-20240229
      prompt: |
        Review code quality:
        ${steps.fetch_pr_diff.outputs.diff}

        Focus on:
        - Code clarity
        - Error handling
        - Test coverage
        - Documentation
      outputs:
        - quality_score
        - improvements

    - id: generate_review
      type: claude
      model: claude-3-sonnet-20240229
      prompt: |
        Generate a comprehensive code review comment:

        Security: ${steps.security_analysis.outputs.severity} severity
        Issues: ${steps.security_analysis.outputs.security_issues}

        Quality Score: ${steps.code_quality_analysis.outputs.quality_score}
        Improvements: ${steps.code_quality_analysis.outputs.improvements}

        Format as GitHub markdown comment.
      outputs:
        - review_comment

    - id: post_comment
      type: python
      script: ./scripts/post_github_comment.py
      inputs:
        pr_number: ${workflow.inputs.pr_number}
        token: ${workflow.inputs.github_token}
        comment: ${steps.generate_review.outputs.review_comment}
      outputs:
        - comment_url

  outputs:
    review_posted: ${steps.post_comment.outputs.comment_url}
    security_severity: ${steps.security_analysis.outputs.severity}
    quality_score: ${steps.code_quality_analysis.outputs.quality_score}
```

### Example 3: Data Analysis Pipeline

```yaml
workflow:
  name: "Sales Data Analysis"
  version: "1.0.0"

  inputs:
    - data_source: string
    - date_range: string

  steps:
    - id: extract_data
      type: python
      script: ./scripts/extract_sales_data.py
      inputs:
        source: ${workflow.inputs.data_source}
        date_range: ${workflow.inputs.date_range}
      outputs:
        - sales_data
        - record_count

    - id: analyze_trends
      type: claude
      model: claude-3-opus-20240229
      prompt: |
        Analyze sales data and identify trends:
        ${steps.extract_data.outputs.sales_data}

        Provide:
        1. Key trends
        2. Anomalies
        3. Predictions for next quarter

        Return JSON with structured analysis.
      outputs:
        - trends
        - anomalies
        - predictions

    - id: generate_charts
      type: python
      script: ./scripts/create_visualizations.py
      inputs:
        data: ${steps.extract_data.outputs.sales_data}
        trends: ${steps.analyze_trends.outputs.trends}
      outputs:
        - chart_files

    - id: write_executive_summary
      type: claude
      model: claude-3-sonnet-20240229
      system_prompt: "You are an executive business analyst."
      prompt: |
        Write an executive summary for:

        Period: ${workflow.inputs.date_range}
        Records analyzed: ${steps.extract_data.outputs.record_count}

        Trends: ${steps.analyze_trends.outputs.trends}
        Anomalies: ${steps.analyze_trends.outputs.anomalies}
        Predictions: ${steps.analyze_trends.outputs.predictions}

        Keep it concise (2-3 paragraphs).
      outputs:
        - summary

    - id: send_report
      type: python
      script: ./scripts/send_email_report.py
      inputs:
        summary: ${steps.write_executive_summary.outputs.summary}
        charts: ${steps.generate_charts.outputs.chart_files}
        recipients: ["executives@company.com"]
      outputs:
        - email_sent
        - recipients_count

  outputs:
    summary: ${steps.write_executive_summary.outputs.summary}
    report_sent: ${steps.send_report.outputs.email_sent}
```

---

## Validation Rules

### Workflow-Level Validation

1. **Required Fields**
   - `workflow.name` must be present
   - `workflow.version` must be present and valid semver
   - `workflow.steps` must have at least one step

2. **Uniqueness**
   - All step `id` values must be unique
   - All workflow input names must be unique
   - All workflow output names must be unique

3. **References**
   - All variable references must be resolvable
   - Output references must point to declared outputs
   - Input references must point to declared inputs

### Step-Level Validation

**Python Script Steps:**
- `script` path must exist or be resolvable
- All `outputs` must be non-empty strings
- `inputs` values must be valid variable references or literals

**Claude API Steps:**
- `model` must be a valid Claude model identifier
- `prompt` must be non-empty
- `max_tokens` must be 1-8192
- `temperature` must be 0.0-1.0

### Data Type Validation

- Workflow inputs types must be valid types
- Variable references must resolve to compatible types
- Output mappings must reference valid step outputs

---

## Appendix

### Supported Python Versions

- Python 3.8+
- Python 3.9+
- Python 3.10+
- Python 3.11+ (recommended)
- Python 3.12+

### Claude Model Details

| Model | Context Window | Max Output | Best For |
|-------|----------------|------------|----------|
| claude-3-opus-20240229 | 200K tokens | 4096 tokens | Complex analysis, high accuracy |
| claude-3-sonnet-20240229 | 200K tokens | 4096 tokens | Balanced performance/cost |
| claude-3-haiku-20240307 | 200K tokens | 4096 tokens | Fast, simple tasks |
| claude-3-5-sonnet-20241022 | 200K tokens | 8192 tokens | Latest, best performance |

### Reserved Keywords

The following variable names are reserved:
- `workflow`
- `steps`
- `env`
- `error`
- `success`
- `metadata`

### File Structure Conventions

Recommended project structure:

```
my-project/
├── .lighthouse/
│   └── workflows/
│       ├── my-workflow.yaml
│       ├── another-workflow.yaml
│       └── README.md
├── scripts/
│   ├── fetch_data.py
│   ├── process_data.py
│   └── requirements.txt
└── prompts/
    ├── analyze.txt
    └── generate_docs.txt
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-20
**Next Review:** TBD
**Status:** Draft - For Review
