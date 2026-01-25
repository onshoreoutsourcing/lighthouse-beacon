/**
 * WorkflowExplorer Component
 *
 * Visual file browser for managing workflows with search and CRUD operations.
 *
 * Features:
 * - Lists workflows from WorkflowService
 * - Real-time search filtering by name and description
 * - Click to select/open workflow
 * - New workflow creation
 * - Delete workflow with confirmation
 * - Performance optimized (<300ms list load, <200ms search)
 * - Accessible with ARIA labels and keyboard navigation
 *
 * Integration:
 * - Uses workflow:list IPC handler
 * - Integrates with DeleteConfirmationDialog
 * - Triggers workflow:delete via IPC
 * - Updates WorkflowStore on selection
 *
 * Usage:
 * <WorkflowExplorer
 *   onWorkflowSelect={(workflow) => console.log('Selected:', workflow)}
 *   onNewWorkflow={() => console.log('Create new workflow')}
 *   onDeleteWorkflow={(workflow) => console.log('Delete:', workflow)}
 * />
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Trash2, RefreshCw, Clock, Sparkles, X } from 'lucide-react';
import type { WorkflowListItem } from '@main/services/workflow/WorkflowService';
import type { Result } from '@shared/types';
import type { WorkflowTemplate } from '@shared/types/workflow.types';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { TemplateGallery } from './TemplateGallery';
import { TemplateDetailModal } from './TemplateDetailModal';
import { TemplateService } from '../../services/TemplateService';

export interface WorkflowExplorerProps {
  /** Callback when workflow is selected */
  onWorkflowSelect?: (workflow: WorkflowListItem) => void;
  /** Callback when new workflow button is clicked */
  onNewWorkflow?: () => void;
  /** Callback when workflow is deleted */
  onDeleteWorkflow?: (workflow: WorkflowListItem) => void;
  /** Callback when template is selected for use */
  onUseTemplate?: (template: WorkflowTemplate) => void;
  /** Custom className */
  className?: string;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const timestamp = date.getTime();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}

/**
 * Truncate text with ellipsis
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * WorkflowExplorer Component
 */
export const WorkflowExplorer: React.FC<WorkflowExplorerProps> = React.memo(
  ({ onWorkflowSelect, onNewWorkflow, onDeleteWorkflow, onUseTemplate, className = '' }) => {
    // State
    const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
    const [hoveredWorkflowId, setHoveredWorkflowId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [workflowToDelete, setWorkflowToDelete] = useState<WorkflowListItem | null>(null);

    // Template gallery state
    const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
    const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
    const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
    const [templateDetailModalOpen, setTemplateDetailModalOpen] = useState(false);

    /**
     * Load workflows from IPC
     */
    const loadWorkflows = useCallback(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response: Result<{ workflows: WorkflowListItem[] }> =
          await window.electronAPI.workflow.list();

        if (response.success) {
          setWorkflows(response.data.workflows);
        } else {
          setError(
            response.error instanceof Error ? response.error.message : 'Failed to load workflows'
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error loading workflows');
      } finally {
        setIsLoading(false);
      }
    }, []);

    /**
     * Load workflows on mount
     */
    useEffect(() => {
      void loadWorkflows();
    }, [loadWorkflows]);

    /**
     * Filter workflows by search query (name and description)
     */
    const filteredWorkflows = useMemo(() => {
      if (!searchQuery.trim()) return workflows;

      const query = searchQuery.toLowerCase();

      return workflows.filter(
        (workflow) =>
          workflow.name.toLowerCase().includes(query) ||
          workflow.description.toLowerCase().includes(query)
      );
    }, [workflows, searchQuery]);

    /**
     * Handle workflow selection
     */
    const handleSelectWorkflow = useCallback(
      (workflow: WorkflowListItem) => {
        setSelectedWorkflowId(workflow.filePath);
        onWorkflowSelect?.(workflow);
      },
      [onWorkflowSelect]
    );

    /**
     * Handle new workflow
     */
    const handleNewWorkflow = useCallback(() => {
      onNewWorkflow?.();
    }, [onNewWorkflow]);

    /**
     * Load templates
     */
    const loadTemplates = useCallback(async () => {
      setIsTemplatesLoading(true);
      try {
        const loadedTemplates = await TemplateService.getTemplates();
        setTemplates(loadedTemplates);
      } catch (err) {
        console.error('Failed to load templates:', err);
      } finally {
        setIsTemplatesLoading(false);
      }
    }, []);

    /**
     * Handle "New from Template" button click
     */
    const handleNewFromTemplate = useCallback(async () => {
      if (templates.length === 0) {
        await loadTemplates();
      }
      setTemplateGalleryOpen(true);
    }, [templates.length, loadTemplates]);

    /**
     * Handle template selection from gallery
     */
    const handleTemplateSelect = useCallback((template: WorkflowTemplate) => {
      setSelectedTemplate(template);
      setTemplateDetailModalOpen(true);
    }, []);

    /**
     * Handle "Use This Template" from detail modal
     */
    const handleUseTemplate = useCallback(
      (template: WorkflowTemplate) => {
        setTemplateDetailModalOpen(false);
        setTemplateGalleryOpen(false);
        setSelectedTemplate(null);
        onUseTemplate?.(template);
      },
      [onUseTemplate]
    );

    /**
     * Handle template detail modal close
     */
    const handleTemplateDetailClose = useCallback(() => {
      setTemplateDetailModalOpen(false);
      setSelectedTemplate(null);
    }, []);

    /**
     * Handle template gallery close
     */
    const handleTemplateGalleryClose = useCallback(() => {
      setTemplateGalleryOpen(false);
    }, []);

    /**
     * Handle delete workflow (show confirmation dialog)
     */
    const handleDeleteClick = useCallback((workflow: WorkflowListItem) => {
      setWorkflowToDelete(workflow);
      setDeleteDialogOpen(true);
    }, []);

    /**
     * Confirm delete workflow
     */
    const handleConfirmDelete = useCallback(async () => {
      if (!workflowToDelete) return;

      try {
        // Call IPC to delete workflow
        const success: boolean = await window.electronAPI.workflow.delete(
          workflowToDelete.filePath
        );

        if (success) {
          // Remove from list
          setWorkflows((prev) => prev.filter((w) => w.filePath !== workflowToDelete.filePath));

          // Clear selection if deleted
          if (selectedWorkflowId === workflowToDelete.filePath) {
            setSelectedWorkflowId(null);
          }

          // Notify parent
          onDeleteWorkflow?.(workflowToDelete);
        } else {
          setError('Failed to delete workflow');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error deleting workflow');
      } finally {
        setDeleteDialogOpen(false);
        setWorkflowToDelete(null);
      }
    }, [workflowToDelete, selectedWorkflowId, onDeleteWorkflow]);

    /**
     * Cancel delete
     */
    const handleCancelDelete = useCallback(() => {
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    }, []);

    /**
     * Render loading state
     */
    if (isLoading) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-6 text-center"
          role="status"
          aria-live="polite"
        >
          <RefreshCw className="w-8 h-8 animate-spin text-vscode-descriptionForeground mb-3" />
          <p className="text-sm text-vscode-descriptionForeground">Loading workflows...</p>
        </div>
      );
    }

    /**
     * Render error state
     */
    if (error) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-6 text-center"
          role="alert"
        >
          <div className="text-red-500 mb-3">Failed to load workflows</div>
          <p className="text-xs text-vscode-descriptionForeground mb-4">{error}</p>
          <button
            type="button"
            onClick={() => {
              void loadWorkflows();
            }}
            className="px-3 py-1 text-sm text-vscode-button-foreground bg-vscode-button-bg hover:bg-vscode-button-hoverBg rounded transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    /**
     * Render empty state
     */
    if (workflows.length === 0) {
      return (
        <div
          className="flex flex-col items-center justify-center h-full p-6 text-center"
          role="status"
          aria-label="No workflows available"
        >
          <div className="text-vscode-descriptionForeground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">No workflows found</p>
            <p className="text-xs mt-1">Create your first workflow to get started</p>
          </div>
          <button
            type="button"
            onClick={handleNewWorkflow}
            className="mt-4 px-4 py-2 text-sm text-vscode-button-foreground bg-vscode-button-bg hover:bg-vscode-button-hoverBg rounded transition-colors flex items-center gap-2"
            aria-label="Create new workflow"
          >
            <Plus className="w-4 h-4" />
            New Workflow
          </button>
        </div>
      );
    }

    /**
     * Render empty search results
     */
    if (filteredWorkflows.length === 0 && searchQuery) {
      return (
        <div
          className={`flex flex-col h-full bg-vscode-sideBar-bg ${className}`}
          role="region"
          aria-label="Workflow explorer"
        >
          {/* Header */}
          <div className="flex-shrink-0 p-3 border-b border-vscode-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-vscode-foreground">Workflows</h3>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    void loadWorkflows();
                  }}
                  className="p-1 text-vscode-descriptionForeground hover:text-vscode-foreground hover:bg-vscode-hover rounded transition-colors"
                  aria-label="Refresh workflows"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNewWorkflow}
                  className="px-2 py-1 text-xs text-vscode-button-foreground bg-vscode-button-bg hover:bg-vscode-button-hoverBg rounded transition-colors flex items-center gap-1"
                  aria-label="New workflow"
                >
                  <Plus className="w-3 h-3" />
                  New
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-vscode-descriptionForeground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workflows..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-vscode-input-bg text-vscode-input-foreground border border-vscode-input-border rounded focus:outline-none focus:border-vscode-focusBorder"
                role="searchbox"
                aria-label="Search workflows by name or description"
              />
            </div>
          </div>

          {/* Empty search results */}
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div className="text-vscode-descriptionForeground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No workflows match &quot;{searchQuery}&quot;</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs text-vscode-textLink-foreground hover:text-vscode-textLink-activeForeground"
              >
                Clear search
              </button>
            </div>
          </div>
        </div>
      );
    }

    /**
     * Render workflow list
     */
    return (
      <div
        className={`flex flex-col h-full bg-vscode-sideBar-bg ${className}`}
        role="region"
        aria-label="Workflow explorer"
      >
        {/* Header */}
        <div className="flex-shrink-0 p-3 border-b border-vscode-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-vscode-foreground">Workflows</h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  void loadWorkflows();
                }}
                className="p-1 text-vscode-descriptionForeground hover:text-vscode-foreground hover:bg-vscode-hover rounded transition-colors"
                aria-label="Refresh workflows"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleNewFromTemplate();
                }}
                className="px-2 py-1 text-xs text-vscode-button-foreground bg-vscode-button-secondaryBackground hover:bg-vscode-button-secondaryHoverBackground border border-vscode-button-border rounded transition-colors flex items-center gap-1"
                aria-label="New from template"
              >
                <Sparkles className="w-3 h-3" />
                Template
              </button>
              <button
                type="button"
                onClick={handleNewWorkflow}
                className="px-2 py-1 text-xs text-vscode-button-foreground bg-vscode-button-bg hover:bg-vscode-button-hoverBg rounded transition-colors flex items-center gap-1"
                aria-label="New workflow"
              >
                <Plus className="w-3 h-3" />
                New
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-vscode-descriptionForeground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workflows..."
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-vscode-input-bg text-vscode-input-foreground border border-vscode-input-border rounded focus:outline-none focus:border-vscode-focusBorder"
              role="searchbox"
              aria-label="Search workflows by name or description"
            />
          </div>
        </div>

        {/* Workflow list */}
        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-vscode-border" aria-label="Workflow list">
            {filteredWorkflows.map((workflow) => {
              const isSelected = selectedWorkflowId === workflow.filePath;
              const isHovered = hoveredWorkflowId === workflow.filePath;

              return (
                <li
                  key={workflow.filePath}
                  className={`relative ${isSelected ? 'selected bg-vscode-list-activeSelectionBackground' : ''}`}
                  onMouseEnter={() => setHoveredWorkflowId(workflow.filePath)}
                  onMouseLeave={() => setHoveredWorkflowId(null)}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectWorkflow(workflow)}
                    className={`w-full text-left p-3 transition-colors ${
                      isSelected
                        ? 'bg-vscode-list-activeSelectionBackground'
                        : 'hover:bg-vscode-list-hoverBackground'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-medium text-sm truncate ${
                            isSelected
                              ? 'text-vscode-list-activeSelectionForeground'
                              : 'text-vscode-foreground'
                          }`}
                        >
                          {workflow.name}
                        </div>
                        <div className="text-xs text-vscode-descriptionForeground mt-1 line-clamp-2">
                          {truncate(workflow.description, 100)}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-vscode-descriptionForeground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(workflow.lastModified)}
                          </span>
                          {workflow.tags && workflow.tags.length > 0 && (
                            <span className="flex items-center gap-1">
                              {workflow.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-1.5 py-0.5 bg-vscode-badge-background text-vscode-badge-foreground rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Delete button (shown on hover) */}
                  {isHovered && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(workflow);
                      }}
                      className="absolute top-3 right-3 p-1.5 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded transition-colors"
                      aria-label={`Delete workflow ${workflow.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Delete confirmation dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteDialogOpen}
          workflowName={workflowToDelete?.name || ''}
          onConfirm={() => {
            void handleConfirmDelete();
          }}
          onCancel={handleCancelDelete}
        />

        {/* Template Gallery Modal */}
        {templateGalleryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-vscode-editor-bg border border-vscode-panel-border rounded-lg shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-vscode-panel-border">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-vscode-descriptionForeground" />
                  <h2 className="text-lg font-semibold text-vscode-foreground">
                    Workflow Templates
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleTemplateGalleryClose}
                  className="p-1 text-vscode-descriptionForeground hover:text-vscode-foreground hover:bg-vscode-hover rounded transition-colors"
                  aria-label="Close template gallery"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Template Gallery */}
              <div className="flex-1 overflow-hidden">
                <TemplateGallery
                  templates={templates}
                  onSelectTemplate={handleTemplateSelect}
                  isLoading={isTemplatesLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Template Detail Modal */}
        <TemplateDetailModal
          template={selectedTemplate}
          isOpen={templateDetailModalOpen}
          onClose={handleTemplateDetailClose}
          onUseTemplate={handleUseTemplate}
        />
      </div>
    );
  }
);

WorkflowExplorer.displayName = 'WorkflowExplorer';
