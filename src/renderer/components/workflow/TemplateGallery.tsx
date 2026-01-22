/**
 * TemplateGallery Component
 *
 * Grid layout gallery for workflow templates with search and filtering.
 *
 * Features:
 * - Grid layout with template cards
 * - Each card: name, description (truncated), tags, complexity badge, preview image
 * - Search bar filters by name/tags (case-insensitive)
 * - Click card to view template details
 * - Loading and empty states
 * - Accessible with ARIA labels and keyboard navigation
 *
 * Usage:
 * <TemplateGallery
 *   templates={templates}
 *   onSelectTemplate={(template) => console.log('Selected:', template)}
 *   isLoading={false}
 * />
 */

import React, { useState, useMemo } from 'react';
import { Search, Tag, Layers } from 'lucide-react';
import type { WorkflowTemplate } from '@shared/types/workflow.types';

export interface TemplateGalleryProps {
  /** Array of workflow templates */
  templates: WorkflowTemplate[];
  /** Callback when template is selected */
  onSelectTemplate: (template: WorkflowTemplate) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Truncate text with ellipsis
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Get complexity badge color classes
 */
function getComplexityColorClasses(complexity: 'Beginner' | 'Intermediate' | 'Advanced'): string {
  switch (complexity) {
    case 'Beginner':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'Intermediate':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'Advanced':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/**
 * TemplateGallery Component
 */
export const TemplateGallery: React.FC<TemplateGalleryProps> = React.memo(
  ({ templates, onSelectTemplate, isLoading = false, className = '' }) => {
    const [searchQuery, setSearchQuery] = useState('');

    /**
     * Filter templates by search query (name, description, tags)
     */
    const filteredTemplates = useMemo(() => {
      if (!searchQuery.trim()) return templates;

      const query = searchQuery.toLowerCase();

      return templates.filter(
        (template) =>
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }, [templates, searchQuery]);

    /**
     * Handle template card click
     */
    const handleTemplateClick = (template: WorkflowTemplate) => {
      onSelectTemplate(template);
    };

    /**
     * Handle template card keyboard interaction
     */
    const handleTemplateKeyDown = (event: React.KeyboardEvent, template: WorkflowTemplate) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelectTemplate(template);
      }
    };

    /**
     * Render loading state
     */
    if (isLoading) {
      return (
        <div
          className={`flex flex-col h-full ${className}`}
          role="region"
          aria-label="Template gallery"
        >
          <div
            className="flex-1 flex items-center justify-center p-6"
            role="status"
            aria-live="polite"
          >
            <div className="text-center">
              <Layers className="w-12 h-12 mx-auto mb-3 text-vscode-descriptionForeground animate-pulse" />
              <p className="text-sm text-vscode-descriptionForeground">Loading templates...</p>
            </div>
          </div>
        </div>
      );
    }

    /**
     * Render empty state
     */
    if (templates.length === 0) {
      return (
        <div
          className={`flex flex-col h-full ${className}`}
          role="region"
          aria-label="Template gallery"
        >
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <Layers className="w-12 h-12 mx-auto mb-3 text-vscode-descriptionForeground opacity-50" />
              <p className="text-sm font-medium text-vscode-foreground">No templates available</p>
              <p className="text-xs text-vscode-descriptionForeground mt-1">
                Templates will appear here once they are loaded
              </p>
            </div>
          </div>
        </div>
      );
    }

    /**
     * Render empty search results
     */
    if (filteredTemplates.length === 0 && searchQuery) {
      return (
        <div
          className={`flex flex-col h-full ${className}`}
          role="region"
          aria-label="Template gallery"
        >
          {/* Search Bar */}
          <div className="flex-shrink-0 p-4 border-b border-vscode-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vscode-descriptionForeground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates by name or tags..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-vscode-input-bg text-vscode-input-foreground border border-vscode-input-border rounded focus:outline-none focus:border-vscode-focusBorder"
                role="searchbox"
                aria-label="Search templates by name, description, or tags"
              />
            </div>
          </div>

          {/* Empty Search Results */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <Search className="w-12 h-12 mx-auto mb-3 text-vscode-descriptionForeground opacity-50" />
              <p className="text-sm font-medium text-vscode-foreground">
                No templates match &quot;{searchQuery}&quot;
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs text-vscode-textLink-foreground hover:text-vscode-textLink-activeForeground underline"
              >
                Clear search
              </button>
            </div>
          </div>
        </div>
      );
    }

    /**
     * Render template gallery
     */
    return (
      <div
        className={`flex flex-col h-full bg-vscode-editor-bg ${className}`}
        role="region"
        aria-label="Template gallery"
      >
        {/* Search Bar */}
        <div className="flex-shrink-0 p-4 border-b border-vscode-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vscode-descriptionForeground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by name or tags..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-vscode-input-bg text-vscode-input-foreground border border-vscode-input-border rounded focus:outline-none focus:border-vscode-focusBorder"
              role="searchbox"
              aria-label="Search templates by name, description, or tags"
            />
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateClick(template)}
                onKeyDown={(e) => handleTemplateKeyDown(e, template)}
                className="group text-left bg-vscode-sideBar-bg border border-vscode-border rounded-lg overflow-hidden hover:border-vscode-focusBorder hover:shadow-lg transition-all duration-200 focus:outline-none focus:border-vscode-focusBorder focus:ring-2 focus:ring-vscode-focusBorder/50"
                aria-label={`Select template: ${template.name}`}
              >
                {/* Preview Image */}
                {template.previewImage && (
                  <div className="aspect-video bg-vscode-editor-bg overflow-hidden">
                    <img
                      src={template.previewImage}
                      alt={`${template.name} preview`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Template Info */}
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-semibold text-vscode-foreground line-clamp-1">
                      {template.name}
                    </h3>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium border rounded ${getComplexityColorClasses(template.complexity)}`}
                    >
                      {template.complexity}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-vscode-descriptionForeground line-clamp-2 mb-3">
                    {truncate(template.description, 120)}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between gap-3 text-xs text-vscode-descriptionForeground">
                    {/* Tags */}
                    <div className="flex items-center gap-1 flex-wrap min-w-0">
                      <Tag className="w-3 h-3 flex-shrink-0" />
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-vscode-badge-background text-vscode-badge-foreground rounded truncate"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="text-vscode-descriptionForeground">
                          +{template.tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Steps count */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Layers className="w-3 h-3" />
                      <span>{template.steps} steps</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

TemplateGallery.displayName = 'TemplateGallery';
