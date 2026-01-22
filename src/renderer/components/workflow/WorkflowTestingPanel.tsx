/**
 * WorkflowTestingPanel Component
 * Wave 9.5.3: Workflow Testing UI
 *
 * Provides testing interface for workflows with:
 * - Mock input editor with JSON support
 * - Dry run execution mode
 * - Input validation
 * - Example inputs for quick testing
 * - Mock input persistence
 *
 * User Story 1: Mock Input Editor
 * User Story 2: Dry Run Execution (Frontend)
 */

import React, { useState, useEffect } from 'react';
import { Play, Loader, CheckCircle, AlertCircle, RotateCcw, FileJson } from 'lucide-react';
import type { Workflow, WorkflowExecutionResult } from '@shared/types';

/**
 * Mock input configuration for a single workflow input
 */
interface MockInputConfig {
  id: string;
  value: unknown;
  isValid: boolean;
  validationError?: string;
}

/**
 * Props for WorkflowTestingPanel
 */
interface WorkflowTestingPanelProps {
  /** Workflow to test */
  workflow: Workflow;
  /** Callback when test execution completes */
  onTestComplete?: (result: WorkflowExecutionResult) => void;
  /** Optional default mock inputs */
  defaultMockInputs?: Record<string, unknown>;
}

/**
 * WorkflowTestingPanel Component
 *
 * Provides testing UI with mock input editor and dry run execution.
 */
export const WorkflowTestingPanel: React.FC<WorkflowTestingPanelProps> = ({
  workflow,
  onTestComplete,
  defaultMockInputs,
}) => {
  const [mockInputs, setMockInputs] = useState<Record<string, MockInputConfig>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<WorkflowExecutionResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [jsonEditorMode, setJsonEditorMode] = useState(false);
  const [jsonEditorValue, setJsonEditorValue] = useState('{}');
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);

  // Initialize mock inputs from workflow inputs
  useEffect(() => {
    const initialMockInputs: Record<string, MockInputConfig> = {};

    workflow.inputs.forEach((input) => {
      const defaultValue =
        defaultMockInputs?.[input.id] || generateDefaultValue(input.type, input.id);

      initialMockInputs[input.id] = {
        id: input.id,
        value: defaultValue,
        isValid: true,
      };
    });

    setMockInputs(initialMockInputs);

    // Initialize JSON editor
    const jsonInputs: Record<string, unknown> = {};
    Object.entries(initialMockInputs).forEach(([id, config]) => {
      jsonInputs[id] = config.value;
    });
    setJsonEditorValue(JSON.stringify(jsonInputs, null, 2));
  }, [workflow.inputs, defaultMockInputs]);

  /**
   * Generate default value for an input based on type
   */
  function generateDefaultValue(type: string, name: string): unknown {
    const nameLower = name.toLowerCase();

    // Name-based heuristics
    if (nameLower.includes('email')) return 'test@example.com';
    if (nameLower.includes('url')) return 'https://example.com';
    if (nameLower.includes('path')) return '/mock/path';
    if (nameLower.includes('count') || nameLower.includes('number')) return 1;
    if (nameLower.includes('name')) return 'Test Name';

    // Type-based defaults
    switch (type.toLowerCase()) {
      case 'string':
        return 'mock_value';
      case 'number':
      case 'integer':
        return 42;
      case 'boolean':
        return true;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return '';
    }
  }

  /**
   * Update a single mock input value
   */
  const updateMockInput = (inputId: string, value: unknown) => {
    setMockInputs((prev) => ({
      ...prev,
      [inputId]: {
        ...prev[inputId],
        value,
        isValid: validateInputValue(value, getInputType(inputId)),
        validationError: undefined,
      },
    }));

    // Update JSON editor
    const updatedInputs: Record<string, unknown> = {};
    Object.entries(mockInputs).forEach(([id, config]) => {
      updatedInputs[id] = id === inputId ? value : config.value;
    });
    setJsonEditorValue(JSON.stringify(updatedInputs, null, 2));
  };

  /**
   * Get input type from workflow definition
   */
  const getInputType = (inputId: string): string => {
    const input = workflow.inputs.find((i) => i.id === inputId);
    return input?.type || 'string';
  };

  /**
   * Validate input value against expected type
   */
  const validateInputValue = (value: unknown, expectedType: string): boolean => {
    if (value === null || value === undefined) return false;

    switch (expectedType.toLowerCase()) {
      case 'string':
        return typeof value === 'string';
      case 'number':
      case 'integer':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value);
      default:
        return true;
    }
  };

  /**
   * Load example inputs (generates smart mock data)
   */
  const loadExampleInputs = () => {
    const exampleInputs: Record<string, MockInputConfig> = {};

    workflow.inputs.forEach((input) => {
      const exampleValue = generateSmartExample(input.type, input.id, input.label);

      exampleInputs[input.id] = {
        id: input.id,
        value: exampleValue,
        isValid: true,
      };
    });

    setMockInputs(exampleInputs);

    // Update JSON editor
    const jsonInputs: Record<string, unknown> = {};
    Object.entries(exampleInputs).forEach(([id, config]) => {
      jsonInputs[id] = config.value;
    });
    setJsonEditorValue(JSON.stringify(jsonInputs, null, 2));
  };

  /**
   * Generate smart example based on context
   */
  function generateSmartExample(type: string, id: string, label?: string): unknown {
    const context = `${id} ${label || ''}`.toLowerCase();

    // Context-based examples
    if (context.includes('repository') || context.includes('repo')) {
      return '/path/to/repository';
    }
    if (context.includes('api') && context.includes('key')) {
      return 'sk_test_mock_api_key_1234567890';
    }
    if (context.includes('output')) {
      return '/output/result.md';
    }
    if (context.includes('file')) {
      return './example/file.txt';
    }

    // Type-based examples
    switch (type.toLowerCase()) {
      case 'string':
        return 'example_string';
      case 'number':
      case 'integer':
        return 100;
      case 'boolean':
        return true;
      case 'array':
        return ['item1', 'item2', 'item3'];
      case 'object':
        return { key: 'value', nested: { data: 'example' } };
      default:
        return 'example';
    }
  }

  /**
   * Toggle JSON editor mode
   */
  const toggleJsonEditor = () => {
    if (!jsonEditorMode) {
      // Switching TO JSON editor - update JSON from current inputs
      const jsonInputs: Record<string, unknown> = {};
      Object.entries(mockInputs).forEach(([id, config]) => {
        jsonInputs[id] = config.value;
      });
      setJsonEditorValue(JSON.stringify(jsonInputs, null, 2));
    }
    setJsonEditorMode(!jsonEditorMode);
    setJsonParseError(null);
  };

  /**
   * Update JSON editor value and parse to inputs
   */
  const updateJsonEditor = (newJson: string) => {
    setJsonEditorValue(newJson);

    try {
      const parsed = JSON.parse(newJson) as Record<string, unknown>;
      setJsonParseError(null);

      // Update mock inputs from parsed JSON
      const updatedInputs = { ...mockInputs };
      Object.entries(parsed).forEach(([id, value]) => {
        if (updatedInputs[id]) {
          updatedInputs[id] = {
            id,
            value,
            isValid: validateInputValue(value, getInputType(id)),
          };
        }
      });
      setMockInputs(updatedInputs);
    } catch (error) {
      setJsonParseError(error instanceof Error ? error.message : 'Invalid JSON');
    }
  };

  /**
   * Validate all inputs before execution
   */
  const validateAllInputs = (): boolean => {
    let allValid = true;

    workflow.inputs.forEach((input) => {
      const mockInput = mockInputs[input.id];
      if (!mockInput) {
        allValid = false;
        return;
      }

      // Check required
      if (
        input.required &&
        (mockInput.value === null || mockInput.value === undefined || mockInput.value === '')
      ) {
        allValid = false;
        setMockInputs((prev) => ({
          ...prev,
          [input.id]: {
            ...prev[input.id],
            isValid: false,
            validationError: 'This field is required',
          },
        }));
      }

      // Check type
      if (!mockInput.isValid) {
        allValid = false;
      }
    });

    return allValid;
  };

  /**
   * Execute workflow in dry run mode
   */
  const executeDryRun = async () => {
    // Validate all inputs first
    if (!validateAllInputs()) {
      setExecutionError('Please fix validation errors before executing');
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResult(null);

    try {
      // Prepare inputs
      const inputs: Record<string, unknown> = {};
      Object.entries(mockInputs).forEach(([id, config]) => {
        inputs[id] = config.value;
      });

      // Execute workflow with dry run flag
      const result = await window.electronAPI.workflow.execute({
        workflow,
        inputs,
        workflowId: `test-${workflow.workflow.name}-${Date.now()}`,
        dryRun: true, // Always use dry run mode in testing panel
      });

      if (result.success) {
        setExecutionResult(result.data);
        onTestComplete?.(result.data);
      } else {
        // Handle error from Result type
        const errorMessage =
          result.error instanceof Error
            ? result.error.message
            : String(result.error || 'Execution failed');
        setExecutionError(errorMessage);
      }
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * Clear test results
   */
  const clearResults = () => {
    setExecutionResult(null);
    setExecutionError(null);
  };

  // Check if all inputs are valid
  const allInputsValid = Object.values(mockInputs).every((input) => input.isValid);
  const hasRequiredInputs = workflow.inputs.length > 0;

  return (
    <div className="flex flex-col h-full bg-vscode-bg border-l border-vscode-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-vscode-border bg-vscode-panel">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-vscode-text">Workflow Testing</h3>
          <span className="px-2 py-0.5 text-xs bg-yellow-900/30 text-yellow-400 rounded border border-yellow-400/30">
            🧪 DRY RUN
          </span>
        </div>
        <button
          onClick={toggleJsonEditor}
          className="flex items-center gap-1.5 px-2 py-1 text-xs bg-vscode-bg hover:bg-vscode-hover rounded text-vscode-text transition-colors"
          title={jsonEditorMode ? 'Switch to form editor' : 'Switch to JSON editor'}
        >
          <FileJson className="w-3.5 h-3.5" />
          {jsonEditorMode ? 'Form' : 'JSON'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Warning Banner */}
        <div className="bg-yellow-900/20 border border-yellow-400/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-vscode-text">
                <strong>Dry Run Mode:</strong> No real operations will be performed. Python scripts,
                API calls, and file operations are mocked.
              </p>
            </div>
          </div>
        </div>

        {/* Mock Inputs Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-vscode-text">Mock Inputs</label>
            <button
              onClick={loadExampleInputs}
              className="flex items-center gap-1.5 px-2 py-1 text-xs bg-vscode-bg hover:bg-vscode-hover rounded text-vscode-text transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Load Examples
            </button>
          </div>

          {!hasRequiredInputs ? (
            <div className="bg-vscode-panel border border-vscode-border rounded-lg p-4 text-center">
              <p className="text-sm text-vscode-text-muted">
                This workflow has no input parameters.
              </p>
            </div>
          ) : jsonEditorMode ? (
            /* JSON Editor Mode */
            <div>
              <textarea
                value={jsonEditorValue}
                onChange={(e) => updateJsonEditor(e.target.value)}
                className="w-full h-64 px-3 py-2 bg-vscode-panel border border-vscode-border rounded font-mono text-xs text-vscode-text resize-none focus:outline-none focus:ring-2 focus:ring-vscode-accent"
                spellCheck={false}
                placeholder='{\n  "input_name": "value"\n}'
              />
              {jsonParseError && <p className="mt-1 text-xs text-red-400">⚠️ {jsonParseError}</p>}
            </div>
          ) : (
            /* Form Editor Mode */
            <div className="space-y-3">
              {workflow.inputs.map((input) => {
                const mockInput = mockInputs[input.id];
                if (!mockInput) return null;

                return (
                  <div key={input.id}>
                    <label className="block text-xs font-medium text-vscode-text mb-1">
                      {input.label || input.id}
                      {input.required && <span className="text-red-400 ml-1">*</span>}
                      <span className="ml-2 text-vscode-text-muted">({input.type})</span>
                    </label>

                    {input.type === 'boolean' ? (
                      <select
                        value={String(mockInput.value)}
                        onChange={(e) => updateMockInput(input.id, e.target.value === 'true')}
                        className="w-full px-3 py-2 bg-vscode-panel border border-vscode-border rounded text-sm text-vscode-text focus:outline-none focus:ring-2 focus:ring-vscode-accent"
                      >
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : input.type === 'number' || input.type === 'integer' ? (
                      <input
                        type="number"
                        value={String(mockInput.value)}
                        onChange={(e) => updateMockInput(input.id, Number(e.target.value))}
                        className="w-full px-3 py-2 bg-vscode-panel border border-vscode-border rounded text-sm text-vscode-text focus:outline-none focus:ring-2 focus:ring-vscode-accent"
                      />
                    ) : (
                      <input
                        type="text"
                        value={String(mockInput.value)}
                        onChange={(e) => updateMockInput(input.id, e.target.value)}
                        className="w-full px-3 py-2 bg-vscode-panel border border-vscode-border rounded text-sm text-vscode-text focus:outline-none focus:ring-2 focus:ring-vscode-accent"
                        placeholder={`Enter ${input.type} value`}
                      />
                    )}

                    {mockInput.validationError && (
                      <p className="mt-1 text-xs text-red-400">⚠️ {mockInput.validationError}</p>
                    )}

                    {input.description && (
                      <p className="mt-1 text-xs text-vscode-text-muted">{input.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Execution Results */}
        {executionResult && (
          <div className="bg-vscode-panel border border-vscode-border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <h4 className="text-sm font-semibold text-vscode-text">Test Execution Complete</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-vscode-text-muted">Duration:</span>
                <span className="text-vscode-text">
                  {(executionResult.totalDuration / 1000).toFixed(2)}s
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-vscode-text-muted">Steps Completed:</span>
                <span className="text-vscode-text">
                  {executionResult.successCount} /{' '}
                  {executionResult.successCount + executionResult.failureCount}
                </span>
              </div>
              {executionResult.failureCount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-vscode-text-muted">Failed Steps:</span>
                  <span className="text-red-400">{executionResult.failureCount}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Execution Error */}
        {executionError && (
          <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-red-400 mb-1">Execution Failed</p>
                <p className="text-xs text-vscode-text">{executionError}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-vscode-border bg-vscode-panel">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-vscode-text-muted">
            {!allInputsValid && 'Fix validation errors to execute'}
            {allInputsValid && !hasRequiredInputs && 'No inputs required'}
            {allInputsValid && hasRequiredInputs && 'Ready to test'}
          </div>
          <div className="flex items-center gap-2">
            {(executionResult || executionError) && (
              <button
                onClick={clearResults}
                className="px-3 py-1.5 text-xs bg-vscode-bg hover:bg-vscode-hover rounded text-vscode-text transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => void executeDryRun()}
              disabled={isExecuting || !allInputsValid}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded transition-colors ${
                isExecuting || !allInputsValid
                  ? 'bg-vscode-bg text-vscode-text-muted cursor-not-allowed'
                  : 'bg-vscode-accent hover:bg-vscode-accent-hover text-white'
              }`}
            >
              {isExecuting ? (
                <>
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Run Dry Run Test
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
