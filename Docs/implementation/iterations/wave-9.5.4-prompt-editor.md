# Wave 9.5.4: Prompt Template Editor

## Wave Overview
- **Wave ID:** Wave-9.5.4
- **Feature:** Feature 9.5 - UX Polish & Templates
- **Epic:** Epic 9 - Visual Workflow Generator
- **Status:** Planning
- **Scope:** Add Monaco-based prompt template editor with syntax highlighting and variable autocomplete
- **Wave Goal:** Provide rich editing experience for Claude prompts with variable suggestions and preview
- **Estimated Hours:** 16 hours

## Wave Goals

1. Create PromptEditor component (Monaco Editor integration)
2. Add syntax highlighting for prompt templates
3. Implement variable autocomplete (`${...}` suggestions)
4. Provide prompt preview with resolved variables
5. Include prompt template library for common patterns

## User Stories

### User Story 1: Monaco-Based Prompt Editor

**As a** workflow designer
**I want** a rich text editor for Claude prompts
**So that** I can write complex prompts with syntax highlighting and formatting

**Acceptance Criteria:**
- [ ] PromptEditor component integrates Monaco Editor
- [ ] Editor configured for prompt template language (markdown-like)
- [ ] Syntax highlighting for: text, variables (`${...}`), markdown formatting
- [ ] Line numbers displayed
- [ ] Word wrap enabled for readability
- [ ] Dark/light theme support
- [ ] Unit test coverage ≥90%

**Priority:** High

**Estimated Hours:** 6 hours

**Objective UCP:** 10 UUCW (Average complexity: 4 transactions - Monaco integration, syntax highlighting, theme support, formatting)

---

### User Story 2: Variable Autocomplete

**As a** workflow designer
**I want** autocomplete suggestions for workflow variables
**So that** I can easily reference variables without memorizing syntax

**Acceptance Criteria:**
- [ ] Typing `${` triggers autocomplete dropdown
- [ ] Autocomplete suggests: `workflow.inputs.*`, `steps.*.outputs.*`, `env.*`, `loop.*`
- [ ] Suggestions filtered by typed text
- [ ] Suggestions include type information and descriptions
- [ ] Tab or Enter inserts selected suggestion
- [ ] Performance: Autocomplete appears <50ms
- [ ] Unit test coverage ≥90%

**Priority:** High

**Estimated Hours:** 8 hours

**Objective UCP:** 15 UUCW (Average complexity: 5 transactions - autocomplete provider, suggestion filtering, type info display, insertion logic, performance optimization)

---

### User Story 3: Prompt Preview with Variable Resolution

**As a** workflow designer
**I want** to preview my prompt with variables resolved
**So that** I can verify the final prompt Claude will receive

**Acceptance Criteria:**
- [ ] "Preview" button shows prompt with variables resolved
- [ ] Preview uses mock data if workflow not executed
- [ ] Preview uses actual data if workflow executed previously
- [ ] Variables highlighted with different color in preview
- [ ] Undefined variables shown in red with error message
- [ ] Unit test coverage ≥90%

**Priority:** Medium

**Estimated Hours:** 2 hours

**Objective UCP:** 5 UUCW (Simple complexity: 3 transactions - preview generation, variable resolution, error highlighting)

---

## Definition of Done

- [ ] All 3 user stories completed with acceptance criteria met
- [ ] Code coverage ≥90%
- [ ] Integration tests validate prompt editor
- [ ] No TypeScript/linter errors
- [ ] Autocomplete responsive (<50ms)
- [ ] Code reviewed and approved
- [ ] Documentation updated (prompt editor guide, variable reference)
- [ ] Demo: Edit prompt, use autocomplete, preview result

## Notes

**Architecture References:**
- Epic 1 Monaco Editor integration patterns
- Wave 9.4.4 VariableResolver for variable suggestions
- Feature 2.1 AIService for prompt templates

**Monaco Editor Configuration:**

```typescript
import * as monaco from 'monaco-editor';

// Register custom language for prompt templates
monaco.languages.register({ id: 'prompt-template' });

// Define syntax highlighting rules
monaco.languages.setMonarchTokensProvider('prompt-template', {
  tokenizer: {
    root: [
      // Variables: ${...}
      [/\$\{[^}]+\}/, 'variable'],
      // Markdown headings
      [/^#+\s.*/, 'header'],
      // Bold text
      [/\*\*[^*]+\*\*/, 'strong'],
      // Italic text
      [/\*[^*]+\*/, 'emphasis'],
      // Code blocks
      [/```[\s\S]*?```/, 'code-block'],
    ]
  }
});

// Define theme colors
monaco.editor.defineTheme('prompt-theme', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'variable', foreground: '569CD6', fontStyle: 'bold' },
    { token: 'header', foreground: 'C586C0', fontStyle: 'bold' },
    { token: 'strong', fontStyle: 'bold' },
    { token: 'emphasis', fontStyle: 'italic' },
    { token: 'code-block', foreground: 'D4D4D4', background: '1E1E1E' }
  ],
  colors: {}
});
```

**Variable Autocomplete Implementation:**

```typescript
monaco.languages.registerCompletionItemProvider('prompt-template', {
  triggerCharacters: ['{'],
  provideCompletionItems: (model, position) => {
    const word = model.getWordUntilPosition(position);
    const textBeforeCursor = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    });

    // Check if we're inside ${...}
    if (!textBeforeCursor.endsWith('${')) {
      return { suggestions: [] };
    }

    const suggestions: monaco.languages.CompletionItem[] = [];

    // Workflow inputs
    for (const [name, input] of Object.entries(workflow.inputs)) {
      suggestions.push({
        label: `workflow.inputs.${name}`,
        kind: monaco.languages.CompletionItemKind.Variable,
        detail: input.type,
        documentation: input.description,
        insertText: `workflow.inputs.${name}}`,
        range: new monaco.Range(
          position.lineNumber,
          position.column - 2, // Remove ${
          position.lineNumber,
          position.column
        )
      });
    }

    // Step outputs
    for (const step of workflow.steps) {
      suggestions.push({
        label: `steps.${step.id}.outputs`,
        kind: monaco.languages.CompletionItemKind.Variable,
        detail: 'object',
        documentation: `Outputs from step: ${step.id}`,
        insertText: `steps.${step.id}.outputs.}`,
        range: new monaco.Range(
          position.lineNumber,
          position.column - 2,
          position.lineNumber,
          position.column
        )
      });
    }

    // Environment variables
    for (const envVar of ['API_KEY', 'API_ENDPOINT', 'LOG_LEVEL']) {
      suggestions.push({
        label: `env.${envVar}`,
        kind: monaco.languages.CompletionItemKind.Variable,
        detail: 'string',
        documentation: `Environment variable: ${envVar}`,
        insertText: `env.${envVar}}`,
        range: new monaco.Range(
          position.lineNumber,
          position.column - 2,
          position.lineNumber,
          position.column
        )
      });
    }

    // Loop variables (if inside loop)
    if (isInsideLoop(currentNode)) {
      suggestions.push(
        {
          label: 'loop.item',
          kind: monaco.languages.CompletionItemKind.Variable,
          detail: 'any',
          documentation: 'Current item in loop iteration',
          insertText: 'loop.item}',
          range: new monaco.Range(
            position.lineNumber,
            position.column - 2,
            position.lineNumber,
            position.column
          )
        },
        {
          label: 'loop.index',
          kind: monaco.languages.CompletionItemKind.Variable,
          detail: 'number',
          documentation: '0-based index in loop iteration',
          insertText: 'loop.index}',
          range: new monaco.Range(
            position.lineNumber,
            position.column - 2,
            position.lineNumber,
            position.column
          )
        }
      );
    }

    return { suggestions };
  }
});
```

**Prompt Preview UI:**

```
┌────────────────────────────────────────────────────┐
│ Prompt Editor                          [Preview ▶] │
├────────────────────────────────────────────────────┤
│ 1 │ Analyze the following codebase structure:      │
│ 2 │                                                 │
│ 3 │ Repository: ${workflow.inputs.repository_path} │
│ 4 │ Files: ${steps.analyze_code.outputs.file_count}│
│ 5 │                                                 │
│ 6 │ Generate comprehensive documentation including: │
│ 7 │ - Project overview                             │
│ 8 │ - Architecture explanation                     │
│ 9 │ - API reference                                │
└────────────────────────────────────────────────────┘

[Show Preview]

┌────────────────────────────────────────────────────┐
│ Preview (Variables Resolved)                       │
├────────────────────────────────────────────────────┤
│ Analyze the following codebase structure:          │
│                                                    │
│ Repository: /Users/john/my-project                 │
│ Files: 42                                          │
│                                                    │
│ Generate comprehensive documentation including:    │
│ - Project overview                                 │
│ - Architecture explanation                         │
│ - API reference                                    │
└────────────────────────────────────────────────────┘
```

**Autocomplete Dropdown:**

```
┌────────────────────────────────────────────────────┐
│ 3 │ Repository: ${wor▊                             │
│   │              ┌────────────────────────────────┐│
│   │              │ workflow.inputs.repository_path││
│   │              │   Type: string                 ││
│   │              │   Path to the code repository  ││
│   │              ├────────────────────────────────┤│
│   │              │ workflow.inputs.output_path    ││
│   │              │   Type: string                 ││
│   │              │   Path for output file         ││
│   │              └────────────────────────────────┘│
└────────────────────────────────────────────────────┘
```

**Prompt Template Library:**

Common prompt patterns provided as snippets:

**1. Code Review Template:**
```
Review the following code and identify issues:

Code:
${steps.fetch_code.outputs.code}

Focus on:
- Code quality
- Security vulnerabilities
- Best practices
- Performance issues
```

**2. Documentation Generation Template:**
```
Generate comprehensive documentation for this codebase:

Structure:
${steps.analyze_codebase.outputs.structure}

Requirements:
- Project overview
- Architecture explanation
- API reference with examples
- Setup instructions
```

**3. Data Analysis Template:**
```
Analyze this dataset and provide insights:

Data:
${steps.load_data.outputs.data}

Analysis Requirements:
- Summary statistics
- Patterns and trends
- Anomalies or outliers
- Recommendations
```

**4. Test Case Generation Template:**
```
Generate test cases for this function:

Function:
${steps.extract_function.outputs.function_code}

Generate:
- Unit tests for happy path
- Edge case tests
- Error handling tests
```

**Validation:**
- Check `${...}` syntax valid (balanced braces)
- Warn about undefined variables
- Suggest fixes for typos (Levenshtein distance)

---

**Total Stories:** 3
**Total Hours:** 16 hours
**Total Objective UCP:** 30 UUCW
**Wave Status:** Planning
