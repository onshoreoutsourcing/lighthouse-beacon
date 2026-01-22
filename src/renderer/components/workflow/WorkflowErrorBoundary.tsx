/**
 * WorkflowErrorBoundary Component
 *
 * React error boundary for workflow execution components.
 * Catches errors, displays user-friendly messages, and provides recovery options.
 *
 * Features:
 * - Catches React component errors
 * - Displays user-friendly error messages
 * - Sanitizes sensitive data from error displays
 * - Provides retry and cancel options
 * - Collapsible technical details
 * - Integrates with ErrorLogger
 * - Prevents application crashes
 *
 * Usage:
 * <WorkflowErrorBoundary onRetry={handleRetry} onCancel={handleCancel}>
 *   <WorkflowCanvas />
 * </WorkflowErrorBoundary>
 */

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { logWorkflowError } from '@renderer/utils/ErrorLogger';
import type { SanitizedError } from '@renderer/utils/ErrorLogger';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * WorkflowErrorBoundary Props
 */
export interface WorkflowErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Callback when user clicks retry */
  onRetry?: () => void;
  /** Callback when user clicks cancel */
  onCancel?: () => void;
  /** Optional workflow ID for error context */
  workflowId?: string;
  /** Optional custom error message */
  fallbackMessage?: string;
}

/**
 * WorkflowErrorBoundary State
 */
interface WorkflowErrorBoundaryState {
  /** Has an error been caught */
  hasError: boolean;
  /** Sanitized error information */
  error: SanitizedError | null;
  /** Show technical details */
  showDetails: boolean;
}

/**
 * WorkflowErrorBoundary Component
 *
 * React error boundary that catches errors in workflow components
 * and displays user-friendly error UI with recovery options.
 */
export class WorkflowErrorBoundary extends Component<
  WorkflowErrorBoundaryProps,
  WorkflowErrorBoundaryState
> {
  constructor(props: WorkflowErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false,
    };
  }

  /**
   * Catch errors from child components
   */
  static getDerivedStateFromError(_error: Error): Partial<WorkflowErrorBoundaryState> {
    return {
      hasError: true,
    };
  }

  /**
   * Log error and update state with sanitized error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { workflowId } = this.props;

    // Log error with context
    const loggedError = logWorkflowError(error, {
      workflowId,
      operation: 'workflow-component-render',
      metadata: {
        componentStack: errorInfo.componentStack,
      },
    });

    // Update state with sanitized error
    this.setState({
      error: {
        message: loggedError.message,
        name: loggedError.name,
        stack: loggedError.stack,
      },
    });
  }

  /**
   * Handle retry button click
   */
  handleRetry = (): void => {
    const { onRetry } = this.props;

    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      showDetails: false,
    });

    // Call retry callback
    onRetry?.();
  };

  /**
   * Handle cancel button click
   */
  handleCancel = (): void => {
    const { onCancel } = this.props;

    // Call cancel callback (without resetting error state)
    onCancel?.();
  };

  /**
   * Toggle technical details visibility
   */
  toggleDetails = (): void => {
    this.setState((prev) => ({
      showDetails: !prev.showDetails,
    }));
  };

  /**
   * Render error UI
   */
  renderErrorUI(): ReactNode {
    const { fallbackMessage } = this.props;
    const { error, showDetails } = this.state;

    const errorMessage = error?.message || 'An unexpected error occurred';
    const displayMessage = fallbackMessage || 'Workflow Execution Error';

    return (
      <div
        className="flex items-center justify-center min-h-full p-6 bg-vscode-bg"
        role="alert"
        aria-live="assertive"
      >
        <div className="max-w-2xl w-full bg-vscode-panel border border-vscode-border rounded-lg shadow-lg p-6">
          {/* Error Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0">
              <AlertCircle className="w-12 h-12 text-vscode-error" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-vscode-text mb-2">{displayMessage}</h2>
              <p className="text-sm text-vscode-text-muted">
                The workflow encountered an error and could not complete. You can retry the
                operation or cancel to go back.
              </p>
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-6 p-4 bg-vscode-bg border border-vscode-border rounded">
            <p className="text-sm text-vscode-text font-mono">{errorMessage}</p>
          </div>

          {/* Technical Details Toggle */}
          <div className="mb-6">
            <button
              onClick={this.toggleDetails}
              className="flex items-center gap-2 text-sm text-vscode-accent hover:underline focus:outline-none focus:ring-2 focus:ring-vscode-accent rounded px-2 py-1"
              aria-expanded={showDetails}
              aria-controls="error-details"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  View Details
                </>
              )}
            </button>

            {/* Technical Details */}
            {showDetails && (
              <div
                id="error-details"
                className="mt-4 p-4 bg-vscode-bg border border-vscode-border rounded"
              >
                <h3 className="text-sm font-semibold text-vscode-text mb-2">Technical Details</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-vscode-text-muted">Error Type:</span>
                    <p className="text-xs text-vscode-text font-mono">{error?.name || 'Error'}</p>
                  </div>
                  {error?.stack && (
                    <div>
                      <span className="text-xs text-vscode-text-muted">Stack Trace:</span>
                      <pre className="text-xs text-vscode-text font-mono overflow-x-auto mt-1 p-2 bg-black bg-opacity-20 rounded">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={this.handleCancel}
              className="px-4 py-2 bg-vscode-bg hover:bg-vscode-panel border border-vscode-border text-vscode-text rounded transition-colors focus:outline-none focus:ring-2 focus:ring-vscode-accent"
              aria-label="Cancel workflow"
            >
              Cancel
            </button>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-vscode-accent hover:bg-vscode-accent-hover text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-vscode-accent"
              aria-label="Retry workflow"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render component
   */
  render(): ReactNode {
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) {
      return this.renderErrorUI();
    }

    return children;
  }
}
