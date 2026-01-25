/**
 * TestNodeDialog Component
 * Wave 9.5.3: Workflow Testing UI - User Story 3
 *
 * Provides testing interface for individual workflow nodes with:
 * - Mock input editor for node inputs
 * - Dry run execution for single node
 * - Result visualization
 * - Quick testing without full workflow execution
 *
 * User Story 3: Individual Node Testing
 */

import React, { useState, useEffect } from 'react';
import { X, Play, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { StepType } from '@shared/types';
import type {
  WorkflowStep,
  PythonStep as _PythonStep,
  ClaudeStep as _ClaudeStep,
} from '@shared/types';

/**
 * Node test result from dry run
 */
interface NodeTestResult {
  success: boolean;
  outputs: Record<string, unknown>;
  duration: number;
  error?: string;
}

/**
 * Props for TestNodeDialog
 */
interface TestNodeDialogProps {
  /** Workflow step to test */
  step: WorkflowStep;
  /** Available inputs from previous steps (for context) */
  availableInputs?: Record<string, unknown>;
  /** Callback when dialog is closed */
  onClose: () => void;
}

/**
 * TestNodeDialog Component
 *
 * Modal dialog for testing individual workflow nodes in isolation.
 */
export const TestNodeDialog: React.FC<TestNodeDialogProps> = ({
  step,
  availableInputs = {},
  onClose,
}) => {
  const [mockInputs, setMockInputs] = useState<Record<string, unknown>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [testResult, setTestResult] = useState<NodeTestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Initialize mock inputs with smart defaults
  useEffect(() => {
    const initialInputs: Record<string, unknown> = {};

    // For Python nodes, extract inputs from step configuration
    if (step.type === StepType.PYTHON) {
      const pythonStep = step;

      // Check if step has inputs defined
      if (pythonStep.inputs) {
        Object.entries(pythonStep.inputs).forEach(([key, value]) => {
          // If value is a variable reference, use available input or generate default
          if (typeof value === 'string' && value.startsWith('${')) {
            const varName = value.slice(2, -1);
            initialInputs[key] = availableInputs[varName] || generateDefaultValue(key);
          } else {
            initialInputs[key] = value;
          }
        });
      } else {
        // Generate some default inputs based on common patterns
        initialInputs.data = 'test_data';
        initialInputs.input = 'test_input';
      }
    }

    // For Claude nodes, extract prompt template variables
    if (step.type === StepType.CLAUDE) {
      const claudeStep = step;

      if (claudeStep.prompt_template) {
        // Extract variable references from prompt template
        const varMatches = claudeStep.prompt_template.match(/\$\{([^}]+)\}/g);
        if (varMatches) {
          varMatches.forEach((match) => {
            const varName = match.slice(2, -1);
            initialInputs[varName] = availableInputs[varName] || generateDefaultValue(varName);
          });
        }
      }

      // If no variables found, provide a generic input
      if (Object.keys(initialInputs).length === 0) {
        initialInputs.prompt_context = 'Test context for Claude API';
      }
    }

    setMockInputs(initialInputs);
  }, [step, availableInputs]);

  /**
   * Generate default value based on input name
   */
  function generateDefaultValue(name: string): unknown {
    const nameLower = name.toLowerCase();

    if (nameLower.includes('email')) return 'test@example.com';
    if (nameLower.includes('url')) return 'https://example.com';
    if (nameLower.includes('path') || nameLower.includes('file')) return '/mock/path/to/file.txt';
    if (nameLower.includes('count') || nameLower.includes('number')) return 42;
    if (nameLower.includes('name') || nameLower.includes('title')) return 'Test Name';
    if (nameLower.includes('enabled') || nameLower.includes('active')) return true;
    if (nameLower.includes('data') || nameLower.includes('content')) return 'test_data';

    return 'test_value';
  }

  /**
   * Update mock input value
   */
  const updateInput = (key: string, value: string) => {
    setMockInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * Execute node in dry run mode
   */
  const executeNodeTest = async () => {
    setIsExecuting(true);
    setTestError(null);
    setTestResult(null);

    try {
      // Create a minimal workflow with just this node
      const testWorkflow = {
        workflow: {
          name: `Test: ${step.label || step.id}`,
          version: '1.0.0',
          description: 'Single node test',
        },
        inputs: [],
        steps: [step],
        ui_metadata: { nodes: [] },
      };

      // Execute with dry run flag
      const result = await window.electronAPI.workflow.execute({
        workflow: testWorkflow,
        inputs: mockInputs,
        workflowId: `test-node-${step.id}-${Date.now()}`,
        dryRun: true,
      });

      if (result.success && result.data) {
        // Extract outputs for this specific step
        const stepOutputs = result.data.outputs[step.id] || {};

        setTestResult({
          success: true,
          outputs: stepOutputs,
          duration: result.data.totalDuration,
        });
      } else {
        const err: unknown = result.error;
        let errorMessage = 'Node test failed';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        setTestError(errorMessage);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setTestError(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  /**
   * Get node type icon and color
   */
  const getNodeTypeInfo = () => {
    switch (step.type) {
      case StepType.PYTHON:
        return { icon: '🐍', color: 'text-blue-400', label: 'Python Script' };
      case StepType.CLAUDE:
        return { icon: '🤖', color: 'text-purple-400', label: 'Claude AI' };
      case StepType.CONDITIONAL:
        return { icon: '🔀', color: 'text-yellow-400', label: 'Conditional' };
      case StepType.LOOP:
        return { icon: '🔁', color: 'text-green-400', label: 'Loop' };
      default:
        return { icon: '📦', color: 'text-gray-400', label: 'Node' };
    }
  };

  const nodeInfo = getNodeTypeInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-vscode-panel border border-vscode-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-vscode-border bg-vscode-bg">
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${nodeInfo.color}`}>{nodeInfo.icon}</span>
            <div>
              <h2 className="text-lg font-semibold text-vscode-text">
                Test Node: {step.label || step.id}
              </h2>
              <p className="text-sm text-vscode-text-muted">{nodeInfo.label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-vscode-hover rounded transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-vscode-text-muted" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="px-6 py-3 bg-yellow-900 bg-opacity-20 border-b border-yellow-700">
          <p className="text-sm text-yellow-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Dry Run Mode - This will mock the node execution without real operations
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Mock Inputs Section */}
          <div>
            <h3 className="text-sm font-semibold text-vscode-text mb-3">Mock Inputs</h3>
            <div className="space-y-3">
              {Object.keys(mockInputs).length === 0 ? (
                <p className="text-sm text-vscode-text-muted italic">
                  This node has no inputs. Click &quot;Run Test&quot; to execute.
                </p>
              ) : (
                Object.entries(mockInputs).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm text-vscode-text-muted mb-1">{key}</label>
                    <input
                      type="text"
                      value={String(value)}
                      onChange={(e) => updateInput(key, e.target.value)}
                      className="w-full px-3 py-2 bg-vscode-bg border border-vscode-border rounded text-vscode-text text-sm focus:outline-none focus:ring-2 focus:ring-vscode-accent"
                      placeholder={`Enter ${key}`}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Test Result Section */}
          {(testResult || testError) && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-vscode-text mb-3">Test Result</h3>

              {testResult && (
                <div className="bg-green-900 bg-opacity-20 border border-green-700 rounded p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-semibold text-green-300">Test Passed</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-vscode-text-muted">Duration:</span>
                      <span className="text-vscode-text">
                        {(testResult.duration / 1000).toFixed(2)}s
                      </span>
                    </div>

                    {Object.keys(testResult.outputs).length > 0 && (
                      <div className="mt-3">
                        <p className="text-vscode-text-muted mb-2">Outputs:</p>
                        <pre className="bg-vscode-bg border border-vscode-border rounded p-3 text-xs text-vscode-text overflow-x-auto">
                          {JSON.stringify(testResult.outputs, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {testError && (
                <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-sm font-semibold text-red-300">Test Failed</span>
                  </div>
                  <p className="text-sm text-red-200">{testError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-vscode-border bg-vscode-bg flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm text-vscode-text hover:bg-vscode-hover transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => void executeNodeTest()}
            disabled={isExecuting}
            className="px-4 py-2 bg-vscode-accent text-white rounded text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExecuting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Test
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
