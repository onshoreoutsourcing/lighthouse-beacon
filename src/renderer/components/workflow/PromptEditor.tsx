/**
 * PromptEditor Component
 * Wave 9.5.4: Prompt Template Editor
 *
 * Monaco-based editor for Claude prompt templates with:
 * - Syntax highlighting for variables (${...}) and markdown
 * - Variable autocomplete (workflow inputs, step outputs, env vars, loop vars)
 * - Prompt preview with resolved variables
 * - Prompt template library
 *
 * User Stories:
 * 1. Monaco-Based Prompt Editor
 * 2. Variable Autocomplete
 * 3. Prompt Preview with Variable Resolution
 */

import React, { useRef, useState, useCallback } from 'react';
import Editor, { type OnMount, type Monaco } from '@monaco-editor/react';
import type { editor, languages, IRange } from 'monaco-editor';
import { Eye, EyeOff, BookOpen } from 'lucide-react';
import type { Workflow, WorkflowInput, WorkflowStep } from '@shared/types';

/**
 * Props for PromptEditor component
 */
interface PromptEditorProps {
  /** Current prompt template value */
  value: string;
  /** Callback when prompt changes */
  onChange: (value: string) => void;
  /** Workflow context for variable autocomplete */
  workflow?: Workflow;
  /** Available step outputs for preview (from previous execution) */
  availableOutputs?: Record<string, Record<string, unknown>>;
  /** Height of editor */
  height?: string | number;
  /** Whether editor is read-only */
  readOnly?: boolean;
}

/**
 * Prompt template snippets
 */
const PROMPT_TEMPLATES = {
  'code-review': `Review the following code and identify issues:

Code:
\${steps.fetch_code.outputs.code}

Focus on:
- Code quality
- Security vulnerabilities
- Best practices
- Performance issues`,

  documentation: `Generate comprehensive documentation for this codebase:

Structure:
\${steps.analyze_codebase.outputs.structure}

Requirements:
- Project overview
- Architecture explanation
- API reference with examples
- Setup instructions`,

  'data-analysis': `Analyze this dataset and provide insights:

Data:
\${steps.load_data.outputs.data}

Analysis Requirements:
- Summary statistics
- Patterns and trends
- Anomalies or outliers
- Recommendations`,

  'test-generation': `Generate test cases for this function:

Function:
\${steps.extract_function.outputs.function_code}

Generate:
- Unit tests for happy path
- Edge case tests
- Error handling tests`,
};

/**
 * Register custom language for prompt templates
 */
function registerPromptTemplateLanguage(monaco: Monaco): void {
  // Register language
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  monaco.languages.register({ id: 'prompt-template' });

  // Define syntax highlighting rules
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  monaco.languages.setMonarchTokensProvider('prompt-template', {
    tokenizer: {
      root: [
        // Variables: ${...}
        [/\$\{[^}]+\}/, 'variable'],
        // Markdown headings
        [/^#+\s.*$/, 'header'],
        // Bold text
        [/\*\*[^*]+\*\*/, 'strong'],
        // Italic text
        [/\*[^*]+\*/, 'emphasis'],
        // Code blocks
        [/```[\s\S]*?```/, 'code-block'],
        // Inline code
        [/`[^`]+`/, 'inline-code'],
      ],
    },
  });

  // Define theme colors
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  monaco.editor.defineTheme('prompt-theme-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'variable', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'header', foreground: 'C586C0', fontStyle: 'bold' },
      { token: 'strong', fontStyle: 'bold' },
      { token: 'emphasis', fontStyle: 'italic' },
      { token: 'code-block', foreground: 'D4D4D4', background: '1E1E1E' },
      { token: 'inline-code', foreground: 'CE9178' },
    ],
    colors: {},
  });
}

/**
 * Register variable autocomplete provider
 */
function registerAutocompleteProvider(
  monaco: Monaco,
  workflow?: Workflow
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
): languages.IDisposable | null {
  if (!workflow) return null;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return monaco.languages.registerCompletionItemProvider('prompt-template', {
    triggerCharacters: ['{'],
    provideCompletionItems: (model, position) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const textBeforeCursor = model.getValueInRange({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        startLineNumber: position.lineNumber,
        startColumn: 1,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        endLineNumber: position.lineNumber,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        endColumn: position.column,
      });

      // Check if we're typing after ${
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (!textBeforeCursor.endsWith('${')) {
        return { suggestions: [] };
      }

      const suggestions: languages.CompletionItem[] = [];
      const range: IRange = {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        startLineNumber: position.lineNumber,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        startColumn: position.column - 2, // Remove ${
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        endLineNumber: position.lineNumber,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        endColumn: position.column,
      };

      // Workflow inputs
      if (workflow.inputs) {
        workflow.inputs.forEach((input: WorkflowInput) => {
          suggestions.push({
            label: `workflow.inputs.${input.id}`,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            kind: monaco.languages.CompletionItemKind.Variable,
            detail: input.type,
            documentation: input.description || `Workflow input: ${input.label}`,
            insertText: `workflow.inputs.${input.id}}`,
            range,
          });
        });
      }

      // Step outputs
      workflow.steps.forEach((step: WorkflowStep) => {
        suggestions.push({
          label: `steps.${step.id}.outputs`,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          kind: monaco.languages.CompletionItemKind.Variable,
          detail: 'object',
          documentation: `Outputs from step: ${step.label || step.id}`,
          insertText: `steps.${step.id}.outputs.}`,
          range,
        });
      });

      // Environment variables (common ones)
      const envVars = ['API_KEY', 'API_ENDPOINT', 'LOG_LEVEL', 'DEBUG'];
      envVars.forEach((envVar) => {
        suggestions.push({
          label: `env.${envVar}`,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          kind: monaco.languages.CompletionItemKind.Variable,
          detail: 'string',
          documentation: `Environment variable: ${envVar}`,
          insertText: `env.${envVar}}`,
          range,
        });
      });

      // Loop variables (always available)
      suggestions.push(
        {
          label: 'loop.item',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          kind: monaco.languages.CompletionItemKind.Variable,
          detail: 'any',
          documentation: 'Current item in loop iteration',
          insertText: 'loop.item}',
          range,
        },
        {
          label: 'loop.index',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          kind: monaco.languages.CompletionItemKind.Variable,
          detail: 'number',
          documentation: '0-based index in loop iteration',
          insertText: 'loop.index}',
          range,
        }
      );

      return { suggestions };
    },
  });
}

/**
 * Resolve variables in prompt template
 */
function resolveVariables(
  template: string,
  workflow?: Workflow,
  outputs?: Record<string, Record<string, unknown>>
): { resolved: string; errors: string[] } {
  const errors: string[] = [];
  let resolved = template;

  // Find all variable references
  const varMatches = template.match(/\$\{([^}]+)\}/g);
  if (!varMatches) {
    return { resolved, errors };
  }

  varMatches.forEach((match) => {
    const varPath = match.slice(2, -1); // Remove ${ and }
    let value: unknown = undefined;

    // Parse variable path
    if (varPath.startsWith('workflow.inputs.')) {
      const inputId = varPath.substring('workflow.inputs.'.length);
      const input = workflow?.inputs?.find((i) => i.id === inputId);
      if (input?.default !== undefined) {
        value = input.default;
      } else {
        value = `<mock: ${inputId}>`;
      }
    } else if (varPath.startsWith('steps.')) {
      const parts = varPath.split('.');
      if (parts.length >= 3 && parts[2] === 'outputs' && outputs) {
        const stepId = parts[1];
        if (outputs[stepId]) {
          if (parts.length > 3) {
            const outputKey = parts.slice(3).join('.');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            value = outputs[stepId][outputKey];
          } else {
            value = JSON.stringify(outputs[stepId], null, 2);
          }
        }
      }
      if (value === undefined) {
        value = `<mock: ${varPath}>`;
      }
    } else if (varPath.startsWith('env.')) {
      value = `<mock: ${varPath}>`;
    } else if (varPath.startsWith('loop.')) {
      value = `<mock: ${varPath}>`;
    } else {
      errors.push(`Unknown variable: ${varPath}`);
      value = `<ERROR: ${varPath}>`;
    }

    resolved = resolved.replace(match, String(value));
  });

  return { resolved, errors };
}

/**
 * PromptEditor Component
 */
export const PromptEditor: React.FC<PromptEditorProps> = ({
  value,
  onChange,
  workflow,
  availableOutputs,
  height = '400px',
  readOnly = false,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  const monacoRef = useRef<Monaco | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);

  /**
   * Handle editor mount
   */
  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      monacoRef.current = monaco;

      // Register custom language if not already registered
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      if (!monaco.languages.getLanguages().some((lang) => lang.id === 'prompt-template')) {
        registerPromptTemplateLanguage(monaco);
      }

      // Register autocomplete provider
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const disposable = registerAutocompleteProvider(monaco, workflow);

      // Focus editor
      editor.focus();

      // Cleanup
      return () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        disposable?.dispose();
      };
    },
    [workflow]
  );

  /**
   * Handle content change
   */
  const handleChange = useCallback(
    (newValue: string | undefined) => {
      onChange(newValue || '');
    },
    [onChange]
  );

  /**
   * Generate preview
   */
  const generatePreview = useCallback(() => {
    const { resolved, errors } = resolveVariables(value, workflow, availableOutputs);
    setPreviewContent(resolved);
    setPreviewErrors(errors);
    setShowPreview(true);
  }, [value, workflow, availableOutputs]);

  /**
   * Insert template
   */
  const insertTemplate = useCallback(
    (templateKey: keyof typeof PROMPT_TEMPLATES) => {
      const template = PROMPT_TEMPLATES[templateKey];
      onChange(template);
      setShowTemplates(false);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-vscode-bg border-b border-vscode-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-vscode-text">Prompt Template</span>
          <span className="text-xs text-vscode-text-muted">
            Use <code className="px-1 bg-vscode-panel rounded">$&#123;...&#125;</code> for variables
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="px-3 py-1 text-xs text-vscode-text hover:bg-vscode-hover rounded transition-colors flex items-center gap-1"
            title="Template library"
          >
            <BookOpen className="w-3 h-3" />
            Templates
          </button>
          <button
            onClick={generatePreview}
            className="px-3 py-1 text-xs text-vscode-text hover:bg-vscode-hover rounded transition-colors flex items-center gap-1"
            title={showPreview ? 'Hide preview' : 'Show preview'}
          >
            {showPreview ? (
              <>
                <EyeOff className="w-3 h-3" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                Preview
              </>
            )}
          </button>
        </div>
      </div>

      {/* Template Library */}
      {showTemplates && (
        <div className="p-4 bg-vscode-bg border-b border-vscode-border">
          <h3 className="text-sm font-semibold text-vscode-text mb-2">Template Library</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PROMPT_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => insertTemplate(key as keyof typeof PROMPT_TEMPLATES)}
                className="px-3 py-2 text-xs text-left text-vscode-text bg-vscode-panel hover:bg-vscode-hover rounded transition-colors border border-vscode-border"
              >
                <div className="font-semibold mb-1">
                  {key
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </div>
                <div className="text-vscode-text-muted line-clamp-2">{template.split('\n')[0]}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1" style={{ height: showPreview ? '50%' : height }}>
        <Editor
          height="100%"
          language="prompt-template"
          value={value}
          theme="prompt-theme-dark"
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="text-vscode-text-muted">Loading editor...</div>
            </div>
          }
          options={{
            fontSize: 14,
            lineNumbers: 'on',
            minimap: { enabled: false },
            automaticLayout: true,
            readOnly,
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            tabSize: 2,
            wordWrap: 'on',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            folding: false,
            bracketPairColorization: {
              enabled: true,
            },
            suggestOnTriggerCharacters: true,
            quickSuggestions: {
              other: true,
              comments: false,
              strings: true,
            },
          }}
          onChange={handleChange}
          onMount={handleEditorMount}
        />
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <div className="flex-1 border-t border-vscode-border overflow-hidden flex flex-col">
          <div className="px-4 py-2 bg-vscode-bg border-b border-vscode-border">
            <span className="text-sm font-semibold text-vscode-text">
              Preview (Variables Resolved)
            </span>
            {previewErrors.length > 0 && (
              <div className="mt-1 text-xs text-red-400">
                {previewErrors.map((error, i) => (
                  <div key={i}>⚠ {error}</div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-auto px-4 py-3 bg-vscode-panel">
            <pre className="text-sm text-vscode-text whitespace-pre-wrap">{previewContent}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
