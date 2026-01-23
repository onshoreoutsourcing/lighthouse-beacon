# ADR-017: Workflow YAML Schema Design

**Status**: Accepted
**Date**: 2026-01-21
**Deciders**: Lighthouse Development Team
**Related**: Epic 9 (Workflow Generator), Feature 9.1, ADR-015 (React Flow)

---

## Context

Epic 9 introduces visual workflow automation to Lighthouse Chat IDE. Workflows need a declarative format for defining:
- Workflow metadata (name, version, description, tags)
- Input parameters with types and validation
- Execution steps (Python scripts, Claude AI operations, conditionals, loops)
- Variable interpolation between steps (passing outputs to inputs)
- UI metadata (node positions, zoom level) for visual canvas persistence

**Requirements:**
- Human-readable and easy to edit manually
- Machine-parseable for validation and execution
- Support comments for inline documentation
- Familiar to developers (reduce learning curve)
- Support complex structures (nested steps, conditional branches, loops)
- Version control friendly (textual diff, merge-friendly)
- IDE support (syntax highlighting, validation)

**Constraints:**
- Must integrate with React Flow visual canvas (ADR-015)
- Must support workflow sharing (import/export as files)
- Must work cross-platform (Windows, macOS, Linux)
- Must be forward-compatible (extend schema without breaking old workflows)
- Bundle size should be reasonable for desktop application

**Research Validation:**
- **GitHub Actions**: YAML workflows proven at scale (millions of developers)
- **Kestra**: Data pipeline tool uses YAML for workflow definitions
- **n8n**: Workflow automation ($2.5B valuation) uses JSON but users request YAML support
- **Ansible**: Configuration management uses YAML extensively (familiarity factor)

---

## Considered Options

- **Option 1: YAML (GitHub Actions Pattern)** - Declarative YAML following GitHub Actions conventions
- **Option 2: JSON** - Structured JSON with JSON Schema validation
- **Option 3: TOML** - Configuration-focused format
- **Option 4: Custom DSL** - Domain-specific language for workflows
- **Option 5: JavaScript/TypeScript Config** - Programmatic workflow definition

---

## Decision

**We have decided to use YAML following GitHub Actions pattern for workflow definitions.**

### Why This Choice

**GitHub Actions Pattern:**
- Familiar to 90% of professional developers (GitHub Actions widely adopted)
- Proven pattern for CI/CD workflows (similar problem domain: multi-step automation)
- Clear hierarchical structure (workflow → inputs → steps)
- Supports comments for documentation (unlike JSON)

**YAML Format Benefits:**
1. **Readability**: More human-readable than JSON (no braces, optional quotes)
2. **Comments**: Supports inline documentation (`# comment syntax`)
3. **Industry Standard**: Used by Kubernetes, Docker Compose, Ansible, GitHub Actions
4. **Tooling**: Excellent IDE support (Monaco Editor YAML extension)
5. **Mature Library**: js-yaml (20KB, 10M+ weekly downloads, 10+ years maintained)

**Schema Structure (GitHub Actions Inspired):**

```yaml
workflow:
  name: "Documentation Generator"
  version: "1.0.0"
  description: "Analyzes codebase and generates documentation"
  tags: ["documentation", "automation"]

inputs:
  - id: repo_path
    type: file
    label: "Repository Path"
    required: true
    description: "Path to the repository to document"

  - id: output_format
    type: string
    label: "Output Format"
    default: "markdown"
    options: ["markdown", "html", "pdf"]

steps:
  # Step 1: Analyze repository structure
  - id: analyze_repo
    type: python
    label: "Analyze Repository"
    script: ./scripts/analyze_repo.py
    inputs:
      repo_path: ${workflow.inputs.repo_path}
    outputs:
      - structure
      - file_count
      - language

  # Step 2: Generate documentation with Claude
  - id: generate_docs
    type: claude
    label: "Generate Documentation"
    model: "claude-sonnet-4"
    prompt_template: |
      Analyze this repository structure and generate documentation:

      Structure: ${steps.analyze_repo.outputs.structure}
      Language: ${steps.analyze_repo.outputs.language}

      Format the documentation in ${workflow.inputs.output_format} format.
    system_prompt: "You are a technical documentation expert."
    outputs:
      - documentation

  # Step 3: Save documentation to file
  - id: save_docs
    type: file_operation
    label: "Save Documentation"
    operation: write
    inputs:
      file_path: ./docs/README.${workflow.inputs.output_format}
      content: ${steps.generate_docs.outputs.documentation}

ui_metadata:
  nodes:
    - id: analyze_repo
      position: { x: 100, y: 100 }
      width: 200
      height: 80
    - id: generate_docs
      position: { x: 400, y: 100 }
      width: 200
      height: 80
    - id: save_docs
      position: { x: 700, y: 100 }
      width: 200
      height: 80
  viewport:
    zoom: 1.0
    x: 0
    y: 0
```

**Variable Interpolation Syntax (GitHub Actions Pattern):**
- `${workflow.inputs.x}` - Access workflow input parameters
- `${steps.foo.outputs.y}` - Access step output values
- `${loop.item}` - Access current loop iteration item (Phase 2)
- `${loop.index}` - Access current loop iteration index (Phase 2)

**Validation Approach:**

1. **Schema Validation** (json-schema library):
   - Validates structure (required fields, types)
   - Catches syntax errors (invalid YAML)
   - Fast initial validation (< 10ms)

2. **Semantic Validation** (custom validator):
   - Step IDs unique
   - `depends_on` references valid step IDs
   - Variable references valid (no undefined variables)
   - File paths pass PathValidator (ADR-011)
   - Clear error messages with line numbers

```typescript
// Example: Custom semantic validation
export class WorkflowValidator {
  validate(workflow: Workflow): ValidationResult {
    const errors: ValidationError[] = [];

    // Check step ID uniqueness
    const stepIds = new Set<string>();
    for (const step of workflow.steps) {
      if (stepIds.has(step.id)) {
        errors.push({
          line: this.findLineNumber(step.id),
          field: `steps.${step.id}`,
          message: `Duplicate step ID: ${step.id}`,
          severity: 'error'
        });
      }
      stepIds.add(step.id);
    }

    // Validate variable references
    for (const step of workflow.steps) {
      const refs = this.extractVariableReferences(step.inputs);
      for (const ref of refs) {
        if (!this.isValidReference(ref, workflow, stepIds)) {
          errors.push({
            line: this.findLineNumber(step.id),
            field: `steps.${step.id}.inputs`,
            message: `Invalid variable reference: ${ref}`,
            severity: 'error'
          });
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
```

**Forward Compatibility Strategy:**
- Schema versioning: `workflow.version: "1.0.0"`
- Semantic versioning: major.minor.patch
- Validator handles multiple schema versions
- New fields added as optional (backward compatible)
- Deprecated fields marked in docs, removed in next major version

**Why we rejected alternatives:**

- **JSON**:
  - More verbose (requires quotes around keys, no trailing commas)
  - No comment support (can't document workflows inline)
  - Less human-readable (deeply nested braces)
  - Harder to edit manually (indentation less forgiving)

- **TOML**:
  - Less familiar to developers (smaller ecosystem)
  - Limited nesting support (flat structure preference)
  - No industry precedent for workflow automation

- **Custom DSL**:
  - High implementation cost (parser, validator, IDE support)
  - Steeper learning curve (unfamiliar syntax)
  - No ecosystem benefits (tooling, editor support)
  - Risk of over-engineering

- **JavaScript/TypeScript**:
  - Code not declarative (harder to analyze statically)
  - Security concerns (arbitrary code execution)
  - Harder to validate (must execute to validate)
  - Not suitable for visual editing (canvas generates code)

---

## Consequences

### Positive

- **Familiarity**: 90% of developers already know GitHub Actions YAML syntax
  - Minimal learning curve (1-2 hours to proficiency)
  - Examples from GitHub Actions directly transferable
  - Community knowledge base vast (Stack Overflow, GitHub discussions)

- **Readability**: YAML more readable than JSON for human editing
  - Less visual noise (no braces, fewer quotes)
  - Comments support inline documentation
  - Hierarchical structure clear at a glance

- **Tooling**: Excellent IDE support
  - Monaco Editor YAML extension (syntax highlighting, validation)
  - VS Code YAML extension (auto-completion, schema validation)
  - Many YAML linters and formatters available

- **Ecosystem**: Mature library and tooling
  - js-yaml: 10M+ weekly downloads, 10+ years maintained
  - JSON Schema validation well-supported
  - YAML diff tools for version control

- **Version Control**: Text-based format merge-friendly
  - Git diffs show meaningful changes
  - Merge conflicts easier to resolve than JSON
  - Comments preserved in version history

- **Portability**: Cross-platform, no special requirements
  - Works on Windows, macOS, Linux
  - No external dependencies (js-yaml bundled)
  - Human-editable in any text editor

### Negative

- **YAML Quirks**: Indentation-sensitive, can be error-prone
  - **Mitigation**: Monaco YAML extension catches indentation errors in real-time
  - **Mitigation**: Schema validator provides clear error messages with line numbers
  - **Mitigation**: Visual canvas is primary interface (YAML for advanced users only)
  - **Risk Level**: Low (developer audience familiar with indentation-sensitive formats)

- **Parsing Overhead**: +20KB for js-yaml library
  - **Mitigation**: Acceptable for desktop Electron app (not bandwidth-constrained)
  - **Mitigation**: One-time parse on workflow load, cached in memory
  - **Mitigation**: YAML parsing fast (< 10ms for typical workflows)
  - **Trade-off**: 20KB vs hours of implementing custom parser

- **Complex Structures**: YAML can be hard to read for deeply nested workflows
  - **Mitigation**: Limit nesting depth (3 levels max recommended in docs)
  - **Mitigation**: Visual canvas is primary interface (YAML reflects visual structure)
  - **Mitigation**: Workflow templates show best practices (flat structure preferred)
  - **Guideline**: If YAML becomes unreadable, workflow likely too complex (refactor)

- **Type Safety**: YAML not strongly typed (runtime validation only)
  - **Mitigation**: TypeScript interfaces for parsed workflows
  - **Mitigation**: Schema validation catches type errors at load time
  - **Mitigation**: Clear error messages guide users to fix type issues
  - **Acceptable**: Declarative configs typically validated at runtime (industry norm)

### Mitigation Strategies

**For YAML indentation errors:**
- Monaco Editor YAML extension provides real-time syntax highlighting
- Schema validator shows line numbers and column positions
- Example workflows demonstrate correct indentation patterns
- Workflow generator (Claude) produces correctly indented YAML

**For parsing overhead:**
- js-yaml loaded lazily (only when workflow feature used)
- YAML parsing result cached in memory (no re-parse on canvas updates)
- Performance benchmarks: 10ms parse time for 100-node workflows

**For complex nested structures:**
- Documentation recommends flat workflow structures (3 levels max)
- Visual canvas primary interface (YAML auto-generated)
- Workflow refactoring tool (Phase 2) simplifies complex workflows
- Template marketplace (Phase 3) provides well-structured examples

**For type safety:**
- TypeScript interfaces strongly typed (compile-time errors)
- Schema validation at runtime (json-schema library)
- Custom semantic validation for workflow-specific rules
- Clear error messages guide users to fix validation issues

---

## References

- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
  - Industry-proven pattern for workflow automation YAML
  - Syntax conventions: inputs, steps, outputs, variable interpolation

- [js-yaml Library](https://github.com/nodeca/js-yaml)
  - Mature YAML parser for JavaScript/TypeScript
  - 10M+ weekly downloads, MIT license
  - YAML 1.2 specification compliant

- [YAML Specification 1.2](https://yaml.org/spec/1.2.2/)
  - Official YAML specification
  - Syntax rules, data types, schema validation

- [Kestra Workflow YAML](https://kestra.io/docs/workflow-components)
  - Data pipeline tool using YAML workflow definitions
  - Validates pattern for technical workflows

- Feature 9.1: Workflow Canvas Foundation
  - `/Docs/implementation/_main/feature-9.1-workflow-canvas-foundation.md`
  - Implementation details for YAML parser and validator

- Epic 9: Visual Workflow Generator
  - `/Docs/planning/epic-9-workflow-generator-implementation.md`
  - Original research validating YAML approach

- Related ADRs:
  - [ADR-015: React Flow for Visual Workflows](./ADR-015-react-flow-for-visual-workflows.md)
    - Visual canvas generates YAML, YAML loads into canvas (bidirectional)
  - [ADR-002: React + TypeScript for UI](./ADR-002-react-typescript-for-ui.md)
    - TypeScript interfaces for parsed workflow objects

---

**Last Updated**: 2026-01-21
