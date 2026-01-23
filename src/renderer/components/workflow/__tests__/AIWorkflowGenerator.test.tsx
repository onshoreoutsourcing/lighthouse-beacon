/**
 * AIWorkflowGenerator Component Tests
 * Wave 9.5.2: AI-Assisted Workflow Generation
 *
 * Tests frontend component functionality:
 * - Component rendering and UI elements
 * - User input handling
 * - Generate workflow functionality
 * - Loading states
 * - Error display and suggestions
 * - Success workflow preview
 * - Regenerate functionality
 * - Edit mode toggling
 * - Workflow acceptance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIWorkflowGenerator } from '../AIWorkflowGenerator';
import type { Workflow } from '@shared/types';

// Mock window.electronAPI globally
const mockGenerate = vi.fn();

(global as unknown as { window: { electronAPI: unknown } }).window = {
  electronAPI: {
    workflow: {
      generate: mockGenerate,
    },
  },
} as unknown as Window & typeof globalThis;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AIWorkflowGenerator Component', () => {
  describe('Component Rendering', () => {
    it('should render with all initial UI elements', () => {
      const onWorkflowGenerated = vi.fn();

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      // Header
      expect(screen.getByText('AI Workflow Generator')).toBeInTheDocument();
      expect(screen.getByText('Describe your workflow in plain English')).toBeInTheDocument();

      // Input elements
      expect(screen.getByRole('textbox', { name: /workflow description/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/project type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/language/i)).toBeInTheDocument();

      // Generate button
      expect(screen.getByRole('button', { name: /generate workflow/i })).toBeInTheDocument();
    });

    it('should render cancel button when onCancel provided', () => {
      const onWorkflowGenerated = vi.fn();
      const onCancel = vi.fn();

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} onCancel={onCancel} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should use default project type and language', () => {
      const onWorkflowGenerated = vi.fn();

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const projectTypeSelect = screen.getByLabelText(/project type/i);
      const languageSelect = screen.getByLabelText(/language/i);

      expect(projectTypeSelect.value).toBe('General');
      expect(languageSelect.value).toBe('Python');
    });

    it('should use custom default project type and language', () => {
      const onWorkflowGenerated = vi.fn();

      render(
        <AIWorkflowGenerator
          onWorkflowGenerated={onWorkflowGenerated}
          defaultProjectType="Web"
          defaultLanguage="TypeScript"
        />
      );

      const projectTypeSelect = screen.getByLabelText(/project type/i);
      const languageSelect = screen.getByLabelText(/language/i);

      expect(projectTypeSelect.value).toBe('Web');
      expect(languageSelect.value).toBe('TypeScript');
    });
  });

  describe('User Input Handling', () => {
    it('should update description when user types', () => {
      const onWorkflowGenerated = vi.fn();

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const textarea = screen.getByRole('textbox', {
        name: /workflow description/i,
      });

      fireEvent.change(textarea, {
        target: { value: 'Create a workflow that processes data' },
      });

      expect(textarea.value).toBe('Create a workflow that processes data');
    });

    it('should update project type when selected', () => {
      const onWorkflowGenerated = vi.fn();

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const select = screen.getByLabelText(/project type/i);

      fireEvent.change(select, { target: { value: 'Web' } });

      expect(select.value).toBe('Web');
    });

    it('should update language when selected', () => {
      const onWorkflowGenerated = vi.fn();

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const select = screen.getByLabelText(/language/i);

      fireEvent.change(select, { target: { value: 'TypeScript' } });

      expect(select.value).toBe('TypeScript');
    });

    it('should disable generate button with short description', () => {
      const onWorkflowGenerated = vi.fn();

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const button = screen.getByRole('button', { name: /generate workflow/i });

      expect(button).toBeDisabled();
    });

    it('should enable generate button with sufficient description', () => {
      const onWorkflowGenerated = vi.fn();

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const textarea = screen.getByRole('textbox', { name: /workflow description/i });
      const button = screen.getByRole('button', { name: /generate workflow/i });

      fireEvent.change(textarea, {
        target: { value: 'Create a workflow that processes data files' },
      });

      expect(button).not.toBeDisabled();
    });
  });

  describe('Workflow Generation', () => {
    it('should call generate API with correct parameters', async () => {
      const onWorkflowGenerated = vi.fn();
      const mockWorkflow: Workflow = {
        workflow: {
          name: 'Test Workflow',
          version: '1.0.0',
          description: 'Test',
        },
        inputs: [],
        steps: [],
        ui_metadata: { nodes: [] },
      };

      mockGenerate.mockResolvedValue({
        success: true,
        workflow: mockWorkflow,
        yaml: 'workflow:\n  name: "Test Workflow"',
      });

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const textarea = screen.getByRole('textbox', { name: /workflow description/i });
      const button = screen.getByRole('button', { name: /generate workflow/i });

      fireEvent.change(textarea, {
        target: { value: 'Create a test workflow' },
      });

      fireEvent.click(button);

      await waitFor(() => {
        expect(mockGenerate).toHaveBeenCalledWith({
          description: 'Create a test workflow',
          projectType: 'General',
          language: 'Python',
        });
      });
    });

    it('should show loading state during generation', async () => {
      const onWorkflowGenerated = vi.fn();

      mockGenerate.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const textarea = screen.getByRole('textbox', { name: /workflow description/i });
      const button = screen.getByRole('button', { name: /generate workflow/i });

      fireEvent.change(textarea, {
        target: { value: 'Create a test workflow' },
      });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/generating workflow with ai/i)).toBeInTheDocument();
      });
    });

    it('should display workflow preview on success', async () => {
      const onWorkflowGenerated = vi.fn();
      const mockWorkflow: Workflow = {
        workflow: {
          name: 'Test Workflow',
          version: '1.0.0',
          description: 'A test workflow',
        },
        inputs: [],
        steps: [
          {
            id: 'step1',
            type: 'python',
            label: 'Test Step',
            script: './test.py',
          },
        ],
        ui_metadata: { nodes: [] },
      };

      mockGenerate.mockResolvedValue({
        success: true,
        workflow: mockWorkflow,
        yaml: 'workflow:\n  name: "Test Workflow"',
        metadata: {
          modelUsed: 'claude-sonnet-4-5-20250929',
          durationMs: 1500,
        },
      });

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const textarea = screen.getByRole('textbox', { name: /workflow description/i });
      const button = screen.getByRole('button', { name: /generate workflow/i });

      fireEvent.change(textarea, {
        target: { value: 'Create a test workflow' },
      });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Workflow Generated')).toBeInTheDocument();
        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // step count
      });
    });
  });

  describe('Error Handling', () => {
    it('should display Claude API error with suggestions', async () => {
      const onWorkflowGenerated = vi.fn();

      mockGenerate.mockResolvedValue({
        success: false,
        error: {
          type: 'claude_api',
          message: 'API rate limit exceeded',
        },
      });

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const textarea = screen.getByRole('textbox', { name: /workflow description/i });
      const button = screen.getByRole('button', { name: /generate workflow/i });

      fireEvent.change(textarea, {
        target: { value: 'Create a test workflow' },
      });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Claude API Error')).toBeInTheDocument();
        expect(screen.getByText(/API rate limit exceeded/i)).toBeInTheDocument();
        expect(screen.getByText(/Check your API key in settings/i)).toBeInTheDocument();
      });
    });

    it('should display YAML parse error with suggestions', async () => {
      const onWorkflowGenerated = vi.fn();

      mockGenerate.mockResolvedValue({
        success: false,
        error: {
          type: 'yaml_parse',
          message: 'Invalid YAML syntax',
          details: 'Line 5: unexpected token',
        },
      });

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const textarea = screen.getByRole('textbox', { name: /workflow description/i });
      const button = screen.getByRole('button', { name: /generate workflow/i });

      fireEvent.change(textarea, {
        target: { value: 'Create a test workflow' },
      });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('YAML Parsing Error')).toBeInTheDocument();
        expect(screen.getByText(/Invalid YAML syntax/i)).toBeInTheDocument();
        expect(screen.getByText(/Try regenerating the workflow/i)).toBeInTheDocument();
      });
    });

    it('should display validation errors', async () => {
      const onWorkflowGenerated = vi.fn();

      mockGenerate.mockResolvedValue({
        success: false,
        error: {
          type: 'schema_validation',
          message: 'Validation failed',
          validationErrors: [
            {
              field: 'steps[0].script',
              message: 'Missing required script field',
              severity: 'error' as const,
            },
          ],
        },
      });

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const textarea = screen.getByRole('textbox', { name: /workflow description/i });
      const button = screen.getByRole('button', { name: /generate workflow/i });

      fireEvent.change(textarea, {
        target: { value: 'Create a test workflow' },
      });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Schema Validation Error')).toBeInTheDocument();
        expect(screen.getByText(/Validation Errors/i)).toBeInTheDocument();
        expect(screen.getByText(/steps\[0\]\.script/)).toBeInTheDocument();
        expect(screen.getByText(/Missing required script field/)).toBeInTheDocument();
      });
    });

    it('should show try again button on error', async () => {
      const onWorkflowGenerated = vi.fn();

      mockGenerate.mockResolvedValue({
        success: false,
        error: {
          type: 'unknown',
          message: 'Something went wrong',
        },
      });

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const textarea = screen.getByRole('textbox', { name: /workflow description/i });
      const button = screen.getByRole('button', { name: /generate workflow/i });

      fireEvent.change(textarea, {
        target: { value: 'Create a test workflow' },
      });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });
  });

  describe('Regenerate Functionality', () => {
    it('should regenerate workflow with same description', async () => {
      const onWorkflowGenerated = vi.fn();
      const mockWorkflow: Workflow = {
        workflow: {
          name: 'Test Workflow',
          version: '1.0.0',
          description: 'Test',
        },
        inputs: [],
        steps: [],
        ui_metadata: { nodes: [] },
      };

      mockGenerate.mockResolvedValue({
        success: true,
        workflow: mockWorkflow,
        yaml: 'workflow:\n  name: "Test Workflow"',
      });

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const textarea = screen.getByRole('textbox', { name: /workflow description/i });
      const generateButton = screen.getByRole('button', { name: /generate workflow/i });

      fireEvent.change(textarea, {
        target: { value: 'Create a test workflow' },
      });

      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Workflow Generated')).toBeInTheDocument();
      });

      const regenerateButton = screen.getByRole('button', { name: /regenerate/i });
      fireEvent.click(regenerateButton);

      await waitFor(() => {
        expect(mockGenerate).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Edit Mode', () => {
    it('should toggle edit mode', async () => {
      const onWorkflowGenerated = vi.fn();
      const mockWorkflow: Workflow = {
        workflow: {
          name: 'Test Workflow',
          version: '1.0.0',
          description: 'Test',
        },
        inputs: [],
        steps: [],
        ui_metadata: { nodes: [] },
      };

      mockGenerate.mockResolvedValue({
        success: true,
        workflow: mockWorkflow,
        yaml: 'workflow:\n  name: "Test Workflow"',
      });

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const textarea = screen.getByRole('textbox', { name: /workflow description/i });
      const button = screen.getByRole('button', { name: /generate workflow/i });

      fireEvent.change(textarea, {
        target: { value: 'Create a test workflow' },
      });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Workflow Generated')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /edit yaml/i });
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText(/edit yaml/i)).toBeInTheDocument();
      });
    });
  });

  describe('Workflow Acceptance', () => {
    it('should call onWorkflowGenerated when accepted', async () => {
      const onWorkflowGenerated = vi.fn();
      const mockWorkflow: Workflow = {
        workflow: {
          name: 'Test Workflow',
          version: '1.0.0',
          description: 'Test',
        },
        inputs: [],
        steps: [],
        ui_metadata: { nodes: [] },
      };
      const mockYaml = 'workflow:\n  name: "Test Workflow"';

      mockGenerate.mockResolvedValue({
        success: true,
        workflow: mockWorkflow,
        yaml: mockYaml,
      });

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} />);

      const textarea = screen.getByRole('textbox', { name: /workflow description/i });
      const generateButton = screen.getByRole('button', { name: /generate workflow/i });

      fireEvent.change(textarea, {
        target: { value: 'Create a test workflow' },
      });

      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Workflow Generated')).toBeInTheDocument();
      });

      const acceptButton = screen.getByRole('button', { name: /use this workflow/i });
      fireEvent.click(acceptButton);

      expect(onWorkflowGenerated).toHaveBeenCalledWith(mockWorkflow, mockYaml);
    });

    it('should call onCancel when cancel button clicked', () => {
      const onWorkflowGenerated = vi.fn();
      const onCancel = vi.fn();

      render(<AIWorkflowGenerator onWorkflowGenerated={onWorkflowGenerated} onCancel={onCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });
});
