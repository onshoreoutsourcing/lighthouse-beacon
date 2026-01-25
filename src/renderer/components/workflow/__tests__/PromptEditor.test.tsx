/**
 * Unit tests for PromptEditor component
 * Wave 9.5.4: Prompt Template Editor
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PromptEditor } from '../PromptEditor';
import type { Workflow } from '@shared/types';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('PromptEditor', () => {
  const mockOnChange = vi.fn();

  const mockWorkflow: Workflow = {
    workflow: {
      name: 'Test Workflow',
      version: '1.0.0',
      description: 'Test',
    },
    inputs: [
      {
        id: 'repo_path',
        type: 'string',
        label: 'Repository Path',
        required: true,
        description: 'Path to repository',
      },
    ],
    steps: [
      {
        id: 'analyze',
        type: 'python' as const,
        label: 'Analyze Code',
        script: 'analyze.py',
      },
    ],
  };

  it('should render prompt editor', () => {
    render(<PromptEditor value="Test prompt" onChange={mockOnChange} />);

    expect(screen.getByText('Prompt Template')).toBeInTheDocument();
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('should call onChange when prompt changes', () => {
    render(<PromptEditor value="Test prompt" onChange={mockOnChange} />);

    const editor = screen.getByTestId('monaco-editor');
    fireEvent.change(editor, { target: { value: 'New prompt' } });

    expect(mockOnChange).toHaveBeenCalledWith('New prompt');
  });

  it('should show preview button', () => {
    render(<PromptEditor value="Test ${workflow.inputs.repo_path}" onChange={mockOnChange} />);

    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('should toggle preview panel', () => {
    render(
      <PromptEditor
        value="Test ${workflow.inputs.repo_path}"
        onChange={mockOnChange}
        workflow={mockWorkflow}
      />
    );

    const previewButton = screen.getByText('Preview');
    fireEvent.click(previewButton);

    expect(screen.getByText('Preview (Variables Resolved)')).toBeInTheDocument();
  });

  it('should show template library button', () => {
    render(<PromptEditor value="Test prompt" onChange={mockOnChange} />);

    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  it('should toggle template library', () => {
    render(<PromptEditor value="" onChange={mockOnChange} />);

    const templatesButton = screen.getByText('Templates');
    fireEvent.click(templatesButton);

    expect(screen.getByText('Template Library')).toBeInTheDocument();
  });

  it('should render read-only editor when readOnly is true', () => {
    render(<PromptEditor value="Test prompt" onChange={mockOnChange} readOnly={true} />);

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeInTheDocument();
  });

  it('should display variable syntax help text', () => {
    render(<PromptEditor value="Test prompt" onChange={mockOnChange} />);

    expect(screen.getByText(/Use.*for variables/)).toBeInTheDocument();
  });

  it('should resolve variables in preview', () => {
    render(
      <PromptEditor
        value="Path: ${workflow.inputs.repo_path}"
        onChange={mockOnChange}
        workflow={mockWorkflow}
      />
    );

    const previewButton = screen.getByText('Preview');
    fireEvent.click(previewButton);

    // Should show resolved preview content
    expect(screen.getByText('Preview (Variables Resolved)')).toBeInTheDocument();
  });

  it('should show all template options', () => {
    render(<PromptEditor value="" onChange={mockOnChange} />);

    const templatesButton = screen.getByText('Templates');
    fireEvent.click(templatesButton);

    expect(screen.getByText('Code Review')).toBeInTheDocument();
    expect(screen.getByText('Documentation')).toBeInTheDocument();
    expect(screen.getByText('Data Analysis')).toBeInTheDocument();
    expect(screen.getByText('Test Generation')).toBeInTheDocument();
  });

  it('should insert template when clicked', () => {
    const onChange = vi.fn();
    render(<PromptEditor value="" onChange={onChange} />);

    const templatesButton = screen.getByText('Templates');
    fireEvent.click(templatesButton);

    const codeReviewButton = screen.getByText('Code Review');
    fireEvent.click(codeReviewButton);

    expect(onChange).toHaveBeenCalled();
    const call = onChange.mock.calls[0][0];
    expect(call).toContain('Review the following code');
  });
});
