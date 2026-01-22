/**
 * AIWorkflowGenerator Component
 * Wave 9.5.2: AI-Assisted Workflow Generation
 *
 * Allows users to generate workflows from natural language descriptions.
 * Integrates with AIWorkflowGenerator backend service via IPC.
 *
 * Features:
 * - Multi-line text input for workflow description
 * - Generate button with loading state
 * - Workflow preview with YAML display
 * - Error handling with retry option
 * - Regenerate capability
 * - Edit generated YAML option
 *
 * User Story 1: AI Workflow Generation UI
 * User Story 3: Generation Error Handling
 */

import React, { useState } from 'react';
import { Loader, Sparkles, RefreshCw, AlertCircle, CheckCircle, Edit } from 'lucide-react';
import type { Workflow, ValidationError } from '@shared/types';

/**
 * Generation state
 */
type GenerationState = 'idle' | 'generating' | 'success' | 'error';

/**
 * Generation error details
 */
interface GenerationError {
  type: 'claude_api' | 'yaml_parse' | 'schema_validation' | 'unknown';
  message: string;
  details?: string;
  validationErrors?: ValidationError[];
}

/**
 * Generation result from IPC
 */
interface GenerationResult {
  success: boolean;
  workflow?: Workflow;
  yaml?: string;
  error?: GenerationError;
  metadata?: {
    modelUsed: string;
    tokensUsed?: number;
    durationMs: number;
  };
}

/**
 * Props for AIWorkflowGenerator
 */
interface AIWorkflowGeneratorProps {
  /** Callback when workflow is successfully generated and accepted */
  onWorkflowGenerated: (workflow: Workflow, yaml: string) => void;
  /** Optional callback when workflow generation is cancelled */
  onCancel?: () => void;
  /** Optional default project type */
  defaultProjectType?: string;
  /** Optional default language */
  defaultLanguage?: string;
}

/**
 * AIWorkflowGenerator Component
 */
export const AIWorkflowGenerator: React.FC<AIWorkflowGeneratorProps> = ({
  onWorkflowGenerated,
  onCancel,
  defaultProjectType = 'General',
  defaultLanguage = 'Python',
}) => {
  // State
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState(defaultProjectType);
  const [language, setLanguage] = useState(defaultLanguage);
  const [state, setState] = useState<GenerationState>('idle');
  const [generatedWorkflow, setGeneratedWorkflow] = useState<Workflow | null>(null);
  const [generatedYaml, setGeneratedYaml] = useState<string>('');
  const [error, setError] = useState<GenerationError | null>(null);
  const [metadata, setMetadata] = useState<GenerationResult['metadata'] | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedYaml, setEditedYaml] = useState('');

  /**
   * Generate workflow from description
   */
  const handleGenerate = async () => {
    if (!description.trim()) {
      return;
    }

    setState('generating');
    setError(null);
    setGeneratedWorkflow(null);
    setGeneratedYaml('');

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const result = (await window.electron.workflow.generate({
        description: description.trim(),
        projectType,
        language,
      })) as GenerationResult;

      if (result.success && result.workflow && result.yaml) {
        setState('success');
        setGeneratedWorkflow(result.workflow);
        setGeneratedYaml(result.yaml);
        setEditedYaml(result.yaml);
        setMetadata(result.metadata || null);
      } else {
        setState('error');
        setError(result.error || { type: 'unknown', message: 'Unknown error occurred' });
      }
    } catch (err) {
      setState('error');
      setError({
        type: 'unknown',
        message: err instanceof Error ? err.message : 'Unknown error occurred',
      });
    }
  };

  /**
   * Regenerate workflow with same description
   */
  const handleRegenerate = () => {
    setEditMode(false);
    void handleGenerate();
  };

  /**
   * Accept generated workflow
   */
  const handleAccept = () => {
    if (generatedWorkflow && generatedYaml) {
      onWorkflowGenerated(generatedWorkflow, editMode ? editedYaml : generatedYaml);
    }
  };

  /**
   * Toggle edit mode for generated YAML
   */
  const handleToggleEdit = () => {
    if (!editMode) {
      setEditedYaml(generatedYaml);
    }
    setEditMode(!editMode);
  };

  /**
   * Render error details
   */
  const renderError = () => {
    if (!error) return null;

    let errorTitle = 'Generation Failed';
    let errorDescription = error.message;
    let suggestions: string[] = [];

    switch (error.type) {
      case 'claude_api':
        errorTitle = 'Claude API Error';
        suggestions = [
          'Check your API key in settings',
          'Verify internet connection',
          'Try again in a few moments',
        ];
        break;
      case 'yaml_parse':
        errorTitle = 'YAML Parsing Error';
        errorDescription = `${error.message}${error.details ? `: ${error.details}` : ''}`;
        suggestions = ['Try regenerating the workflow', 'Edit the YAML manually'];
        break;
      case 'schema_validation':
        errorTitle = 'Schema Validation Error';
        errorDescription = error.details || error.message;
        suggestions = [
          'Review validation errors below',
          'Try regenerating with clearer description',
        ];
        break;
      default:
        suggestions = ['Try again', 'Check your description'];
    }

    return (
      <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-400 mb-1">{errorTitle}</h3>
            <p className="text-sm text-vscode-text mb-2">{errorDescription}</p>

            {suggestions.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-vscode-text-muted mb-1">Suggestions:</p>
                <ul className="list-disc list-inside text-xs text-vscode-text space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {error.validationErrors && error.validationErrors.length > 0 && (
              <div className="mt-3 border-t border-red-400/20 pt-3">
                <p className="text-xs text-vscode-text-muted mb-2">Validation Errors:</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {error.validationErrors.map((err, index) => (
                    <div key={index} className="text-xs bg-vscode-bg p-2 rounded">
                      <span className="text-red-400 font-mono">{err.field || 'Unknown'}</span>
                      <span className="text-vscode-text">: {err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render workflow preview
   */
  const renderPreview = () => {
    if (!generatedWorkflow || !generatedYaml) return null;

    return (
      <div className="bg-vscode-panel border border-vscode-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-semibold text-vscode-text">Workflow Generated</h3>
          </div>
          <button
            onClick={handleToggleEdit}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-vscode-bg hover:bg-vscode-hover rounded text-vscode-text transition-colors"
            aria-label={editMode ? 'View mode' : 'Edit mode'}
          >
            <Edit className="w-3.5 h-3.5" />
            {editMode ? 'View' : 'Edit YAML'}
          </button>
        </div>

        {/* Workflow Info */}
        <div className="mb-3 space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-vscode-text-muted">Name:</span>
            <span className="text-vscode-text font-medium">{generatedWorkflow.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-vscode-text-muted">Steps:</span>
            <span className="text-vscode-text">{generatedWorkflow.steps?.length || 0}</span>
          </div>
          {generatedWorkflow.description && (
            <div className="flex gap-2 text-sm">
              <span className="text-vscode-text-muted">Description:</span>
              <span className="text-vscode-text">{generatedWorkflow.description}</span>
            </div>
          )}
        </div>

        {/* YAML Preview/Edit */}
        <div className="border border-vscode-border rounded overflow-hidden">
          <div className="bg-vscode-bg px-3 py-2 border-b border-vscode-border">
            <span className="text-xs text-vscode-text-muted font-mono">
              {editMode ? 'Edit YAML' : 'Generated YAML'}
            </span>
          </div>
          {editMode ? (
            <textarea
              value={editedYaml}
              onChange={(e) => setEditedYaml(e.target.value)}
              className="w-full h-64 px-3 py-2 bg-vscode-bg text-vscode-text font-mono text-xs resize-none focus:outline-none"
              spellCheck={false}
            />
          ) : (
            <pre className="px-3 py-2 bg-vscode-bg text-vscode-text font-mono text-xs overflow-auto max-h-64">
              {generatedYaml}
            </pre>
          )}
        </div>

        {/* Metadata */}
        {metadata && (
          <div className="mt-3 flex items-center gap-4 text-xs text-vscode-text-muted">
            <span>Model: {metadata.modelUsed}</span>
            <span>Duration: {(metadata.durationMs / 1000).toFixed(2)}s</span>
          </div>
        )}
      </div>
    );
  };

  const canGenerate = description.trim().length >= 10 && state !== 'generating';

  return (
    <div className="flex flex-col h-full bg-vscode-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-vscode-border">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-vscode-accent" />
          <div>
            <h2 className="text-lg font-semibold text-vscode-text">AI Workflow Generator</h2>
            <p className="text-sm text-vscode-text-muted">
              Describe your workflow in plain English
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-vscode-bg hover:bg-vscode-hover rounded text-vscode-text transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Input Section */}
        {state !== 'success' && (
          <div className="space-y-4">
            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium text-vscode-text mb-2">
                Workflow Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you want your workflow to do. For example: 'Create a workflow that reviews pull requests, identifies issues, and posts comments.'"
                className="w-full h-32 px-3 py-2 bg-vscode-panel border border-vscode-border rounded text-vscode-text placeholder:text-vscode-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-vscode-accent"
                disabled={state === 'generating'}
              />
              <p className="mt-1 text-xs text-vscode-text-muted">
                {description.length} characters (minimum 10)
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-vscode-text mb-2">
                  Project Type
                </label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-3 py-2 bg-vscode-panel border border-vscode-border rounded text-vscode-text focus:outline-none focus:ring-2 focus:ring-vscode-accent"
                  disabled={state === 'generating'}
                >
                  <option value="General">General</option>
                  <option value="Web">Web Application</option>
                  <option value="CLI">Command Line Tool</option>
                  <option value="API">API/Backend</option>
                  <option value="Data">Data Processing</option>
                  <option value="DevOps">DevOps/CI/CD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-vscode-text mb-2">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-vscode-panel border border-vscode-border rounded text-vscode-text focus:outline-none focus:ring-2 focus:ring-vscode-accent"
                  disabled={state === 'generating'}
                >
                  <option value="Python">Python</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="Go">Go</option>
                  <option value="Rust">Rust</option>
                  <option value="Java">Java</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {state === 'error' && renderError()}

        {/* Preview Display */}
        {state === 'success' && renderPreview()}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-vscode-border bg-vscode-panel">
        {state === 'idle' || state === 'error' ? (
          <div className="flex items-center justify-between">
            <div className="text-xs text-vscode-text-muted">
              {state === 'error' ? 'Fix the issues and try again' : 'Ready to generate'}
            </div>
            <div className="flex items-center gap-3">
              {state === 'error' && (
                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-vscode-bg hover:bg-vscode-hover rounded text-vscode-text transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              )}
              <button
                onClick={() => void handleGenerate()}
                disabled={!canGenerate}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors ${
                  canGenerate
                    ? 'bg-vscode-accent hover:bg-vscode-accent-hover text-white'
                    : 'bg-vscode-bg text-vscode-text-muted cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Generate Workflow
              </button>
            </div>
          </div>
        ) : state === 'generating' ? (
          <div className="flex items-center justify-center gap-3 text-vscode-text">
            <Loader className="w-5 h-5 animate-spin" />
            <span className="text-sm">Generating workflow with AI...</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={handleRegenerate}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-vscode-bg hover:bg-vscode-hover rounded text-vscode-text transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
            <button
              onClick={handleAccept}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-vscode-accent hover:bg-vscode-accent-hover rounded text-white transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Use This Workflow
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
