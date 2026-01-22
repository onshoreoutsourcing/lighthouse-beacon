/**
 * Tests for PythonScriptNode Component
 *
 * Comprehensive test coverage for PythonScriptNode custom React Flow node.
 * Target: ≥90% coverage
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PythonScriptNode } from '../PythonScriptNode';
import type { PythonNodeData } from '@renderer/stores/workflow.store';

// Mock the Handle component from @xyflow/react
vi.mock('@xyflow/react', () => ({
  Handle: ({
    type,
    position,
    'aria-label': ariaLabel,
  }: {
    type: string;
    position: string;
    'aria-label': string;
  }) => (
    <div
      data-testid={`handle-${type}-${position}`}
      aria-label={ariaLabel}
      className={`handle-${type}`}
    />
  ),
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right',
  },
}));

describe('PythonScriptNode', () => {
  const defaultData: PythonNodeData = {
    label: 'Python Script',
    status: 'idle',
    scriptPath: '/path/to/script.py',
  };

  const defaultProps = {
    data: defaultData,
    selected: false,
  };

  it('should render with basic data', () => {
    render(<PythonScriptNode {...defaultProps} />);

    expect(screen.getByText('Python Script')).toBeInTheDocument();
    expect(screen.getByText('/path/to/script.py')).toBeInTheDocument();
    expect(screen.getByText('Script')).toBeInTheDocument();
  });

  it('should display arguments when provided', () => {
    const dataWithArgs: PythonNodeData = {
      ...defaultData,
      args: ['--arg1', 'value1', '--arg2'],
    };

    render(<PythonScriptNode data={dataWithArgs} />);

    expect(screen.getByText('Arguments')).toBeInTheDocument();
    expect(screen.getByText('--arg1 value1 --arg2')).toBeInTheDocument();
  });

  it('should not display arguments section when empty', () => {
    render(<PythonScriptNode {...defaultProps} />);

    expect(screen.queryByText('Arguments')).not.toBeInTheDocument();
  });

  it('should show running status', () => {
    const runningData: PythonNodeData = {
      ...defaultData,
      status: 'running',
    };

    render(<PythonScriptNode data={runningData} />);

    const runningIcon = screen.getByLabelText('Running');
    expect(runningIcon).toBeInTheDocument();
    expect(runningIcon).toHaveClass('animate-spin');
  });

  it('should show success status', () => {
    const successData: PythonNodeData = {
      ...defaultData,
      status: 'success',
    };

    render(<PythonScriptNode data={successData} />);

    expect(screen.getByLabelText('Success')).toBeInTheDocument();
  });

  it('should show error status with message', () => {
    const errorData: PythonNodeData = {
      ...defaultData,
      status: 'error',
      error: 'Script execution failed',
    };

    render(<PythonScriptNode data={errorData} />);

    expect(screen.getByLabelText('Error')).toBeInTheDocument();
    expect(screen.getByText('Script execution failed')).toBeInTheDocument();
  });

  it('should not show error message when status is not error', () => {
    const dataWithError: PythonNodeData = {
      ...defaultData,
      status: 'idle',
      error: 'This should not be displayed',
    };

    render(<PythonScriptNode data={dataWithError} />);

    expect(screen.queryByText('This should not be displayed')).not.toBeInTheDocument();
  });

  it('should apply selected border style', () => {
    const { container } = render(<PythonScriptNode data={defaultData} selected={true} />);

    const nodeElement = container.querySelector('.border-vscode-accent');
    expect(nodeElement).toBeInTheDocument();
  });

  it('should apply status-based border colors', () => {
    const { container: idleContainer } = render(<PythonScriptNode data={defaultData} />);
    expect(idleContainer.querySelector('.border-vscode-border')).toBeInTheDocument();

    const { container: runningContainer } = render(
      <PythonScriptNode data={{ ...defaultData, status: 'running' }} />
    );
    expect(runningContainer.querySelector('.border-blue-400')).toBeInTheDocument();

    const { container: successContainer } = render(
      <PythonScriptNode data={{ ...defaultData, status: 'success' }} />
    );
    expect(successContainer.querySelector('.border-green-400')).toBeInTheDocument();

    const { container: errorContainer } = render(
      <PythonScriptNode data={{ ...defaultData, status: 'error' }} />
    );
    expect(errorContainer.querySelector('.border-red-400')).toBeInTheDocument();
  });

  it('should have accessible labels', () => {
    render(<PythonScriptNode {...defaultProps} />);

    expect(screen.getByRole('article')).toHaveAttribute(
      'aria-label',
      'Python script node: Python Script'
    );
    expect(screen.getByLabelText('Input connection')).toBeInTheDocument();
    expect(screen.getByLabelText('Output connection')).toBeInTheDocument();
  });

  it('should truncate long script paths', () => {
    const longPathData: PythonNodeData = {
      ...defaultData,
      scriptPath: '/very/long/path/to/a/deeply/nested/directory/structure/script.py',
    };

    const { container } = render(<PythonScriptNode data={longPathData} />);

    const pathElement = container.querySelector('.truncate');
    expect(pathElement).toBeInTheDocument();
  });
});
