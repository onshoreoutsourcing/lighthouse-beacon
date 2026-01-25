/**
 * ImportExportDialog Component
 *
 * Modal dialog for importing and exporting workflows as YAML files.
 *
 * Features:
 * - Import tab: Select YAML file, validate, import workflow
 * - Export tab: Choose location, export workflow to YAML
 * - Validation: Uses YamlParser for validation with error display
 * - Error display: Shows line numbers and actionable suggestions
 * - Success notifications
 * - Loading states during import/export
 * - Keyboard accessible with ARIA labels
 * - ESC to close, backdrop click to cancel
 *
 * Usage:
 * <ImportExportDialog
 *   isOpen={true}
 *   onClose={() => {}}
 *   onImportSuccess={(workflow) => console.log('Imported:', workflow)}
 *   onExportSuccess={(filePath) => console.log('Exported to:', filePath)}
 *   workflow={currentWorkflow} // Optional, required for export
 * />
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Upload, Download, FileText, CheckCircle, AlertCircle, FolderOpen } from 'lucide-react';
import type { Workflow, ValidationError } from '@shared/types';

export interface ImportExportDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when import succeeds */
  onImportSuccess: (workflow: Workflow) => void;
  /** Callback when export succeeds */
  onExportSuccess: (filePath: string) => void;
  /** Current workflow (for export) */
  workflow?: Workflow;
}

type Tab = 'import' | 'export';

/**
 * ImportExportDialog Component
 */
export const ImportExportDialog: React.FC<ImportExportDialogProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  onExportSuccess,
  workflow,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('import');
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [exportFileName, setExportFileName] = useState('');
  const [exportLocation, setExportLocation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);

  /**
   * Reset state when dialog opens
   */
  useEffect(() => {
    if (isOpen) {
      setActiveTab('import');
      setSelectedFilePath(null);
      setExportLocation(null);
      setIsLoading(false);
      setError(null);
      setValidationError(null);
      setSuccessMessage(null);

      // Set default export file name from workflow
      if (workflow?.workflow.name) {
        const fileName = workflow.workflow.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        setExportFileName(`${fileName}.yaml`);
      }
    }
  }, [isOpen, workflow]);

  /**
   * Handle ESC key to close dialog
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setError(null);
    setValidationError(null);
    setSuccessMessage(null);
  }, []);

  /**
   * Handle file selection for import
   */
  const handleSelectFile = useCallback(async () => {
    setError(null);
    setValidationError(null);

    try {
      // Type-safe result handling
      type SelectFileResult =
        | { success: true; data: { filePath: string; cancelled?: false } }
        | { success: true; data: { cancelled: true } }
        | { success: false; error: unknown };
      const result = (await window.electronAPI.fileSystem.selectFile()) as SelectFileResult;

      if (result.success && 'filePath' in result.data) {
        setSelectedFilePath(result.data.filePath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select file');
    }
  }, []);

  /**
   * Handle import workflow
   */
  const handleImport = useCallback(async () => {
    setError(null);
    setValidationError(null);
    setSuccessMessage(null);

    if (!selectedFilePath) {
      setError('Please select a file to import');
      return;
    }

    setIsLoading(true);

    try {
      // Type-safe result handling
      type ImportResult =
        | { success: true; data: { workflow: Workflow } }
        | { success: false; error: unknown };
      const result = (await window.electronAPI.workflow.import(selectedFilePath)) as ImportResult;

      if (result.success) {
        setSuccessMessage('Workflow imported successfully!');
        onImportSuccess(result.data.workflow);

        // Close dialog after brief delay
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        // Handle validation error
        const err = result.error;
        if (err && typeof err === 'object' && 'field' in err && 'message' in err) {
          setValidationError(err as ValidationError);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to import workflow');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error during import');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilePath, onImportSuccess, onClose]);

  /**
   * Handle location selection for export
   */
  const handleChooseLocation = useCallback(async () => {
    setError(null);

    try {
      // Type-safe result handling
      type SaveDialogResult =
        | { success: true; data: { filePath: string; cancelled?: false } }
        | { success: true; data: { cancelled: true } }
        | { success: false; error: unknown };
      const result = (await window.electronAPI.fileSystem.showSaveDialog(
        exportFileName
      )) as SaveDialogResult;

      if (result.success && 'filePath' in result.data) {
        setExportLocation(result.data.filePath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to choose location');
    }
  }, [exportFileName]);

  /**
   * Handle export workflow
   */
  const handleExport = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);

    if (!exportLocation) {
      setError('Please choose a location to export');
      return;
    }

    if (!workflow) {
      setError('No workflow to export');
      return;
    }

    setIsLoading(true);

    try {
      // Type-safe result handling
      type ExportResult =
        | { success: true; data: { filePath: string } }
        | { success: false; error: unknown };
      const result = (await window.electronAPI.workflow.export(
        workflow,
        exportLocation
      )) as ExportResult;

      if (result.success) {
        setSuccessMessage(`Workflow exported to ${result.data.filePath}`);
        onExportSuccess(result.data.filePath);

        // Close dialog after brief delay
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        const err = result.error;
        setError(err instanceof Error ? err.message : 'Failed to export workflow');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error during export');
    } finally {
      setIsLoading(false);
    }
  }, [exportLocation, workflow, onExportSuccess, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-export-dialog-title"
        className="bg-vscode-editor-bg border border-vscode-panel-border rounded-lg shadow-2xl max-w-2xl w-full mx-4"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-vscode-panel-border">
          <h2
            id="import-export-dialog-title"
            className="text-base font-semibold text-vscode-foreground"
          >
            Import/Export Workflow
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-vscode-descriptionForeground hover:text-vscode-foreground hover:bg-vscode-hover rounded transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-vscode-panel-border">
          <div role="tablist" className="flex">
            <button
              role="tab"
              aria-selected={activeTab === 'import'}
              aria-controls="import-panel"
              onClick={() => handleTabChange('import')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'import'
                  ? 'border-vscode-focusBorder text-vscode-foreground'
                  : 'border-transparent text-vscode-descriptionForeground hover:text-vscode-foreground'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </div>
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'export'}
              aria-controls="export-panel"
              onClick={() => handleTabChange('export')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'export'
                  ? 'border-vscode-focusBorder text-vscode-foreground'
                  : 'border-transparent text-vscode-descriptionForeground hover:text-vscode-foreground'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
          {/* Import Tab */}
          {activeTab === 'import' && (
            <div id="import-panel" role="tabpanel" aria-labelledby="import-tab">
              <p className="text-sm text-vscode-descriptionForeground mb-4">
                Select a YAML workflow file to import
              </p>

              {/* File Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      void handleSelectFile();
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm text-vscode-button-foreground bg-vscode-button-bg hover:bg-vscode-button-hoverBg rounded transition-colors flex items-center gap-2 disabled:opacity-50"
                    aria-label="Select file to import"
                  >
                    <FileText className="w-4 h-4" />
                    Select File
                  </button>

                  {selectedFilePath && (
                    <div className="flex-1 px-3 py-2 text-sm bg-vscode-input-bg text-vscode-input-foreground border border-vscode-input-border rounded truncate">
                      {selectedFilePath}
                    </div>
                  )}
                </div>

                {/* Validation Error Display */}
                {validationError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-vscode-foreground">
                          Validation Error
                          {validationError.line && (
                            <span className="ml-2 text-red-500">Line {validationError.line}</span>
                          )}
                        </div>
                        <p className="text-sm text-vscode-foreground mt-1">
                          {validationError.message}
                        </p>
                        {validationError.suggestion && (
                          <p className="text-sm text-vscode-descriptionForeground mt-2 italic">
                            Suggestion: {validationError.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-vscode-foreground">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-vscode-foreground">{successMessage}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div id="export-panel" role="tabpanel" aria-labelledby="export-tab">
              {!workflow ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-vscode-descriptionForeground mb-3 opacity-50" />
                  <p className="text-sm text-vscode-descriptionForeground">
                    No workflow to export. Please create or load a workflow first.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-vscode-descriptionForeground mb-4">
                    Export workflow to YAML file
                  </p>

                  <div className="space-y-4">
                    {/* File Name Input */}
                    <div>
                      <label
                        htmlFor="export-filename"
                        className="block text-sm font-medium text-vscode-foreground mb-2"
                      >
                        File Name
                      </label>
                      <input
                        id="export-filename"
                        type="text"
                        value={exportFileName}
                        onChange={(e) => setExportFileName(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2 text-sm bg-vscode-input-bg text-vscode-input-foreground border border-vscode-input-border rounded focus:outline-none focus:border-vscode-focusBorder disabled:opacity-50"
                        placeholder="workflow.yaml"
                      />
                    </div>

                    {/* Location Selection */}
                    <div>
                      <label className="block text-sm font-medium text-vscode-foreground mb-2">
                        Save Location
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            void handleChooseLocation();
                          }}
                          disabled={isLoading}
                          className="px-4 py-2 text-sm text-vscode-button-foreground bg-vscode-button-bg hover:bg-vscode-button-hoverBg rounded transition-colors flex items-center gap-2 disabled:opacity-50"
                          aria-label="Choose location for export"
                        >
                          <FolderOpen className="w-4 h-4" />
                          Choose Location
                        </button>

                        {exportLocation && (
                          <div className="flex-1 px-3 py-2 text-sm bg-vscode-input-bg text-vscode-input-foreground border border-vscode-input-border rounded truncate">
                            {exportLocation}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-vscode-foreground">{error}</p>
                      </div>
                    )}

                    {/* Success Message */}
                    {successMessage && (
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-vscode-foreground">{successMessage}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-vscode-panel-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-vscode-foreground bg-vscode-button-secondaryBackground hover:bg-vscode-button-secondaryHoverBackground border border-vscode-button-border rounded transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {activeTab === 'import' ? (
            <button
              type="button"
              onClick={() => {
                void handleImport();
              }}
              disabled={isLoading || !selectedFilePath}
              className="px-4 py-2 text-sm text-vscode-button-foreground bg-vscode-button-bg hover:bg-vscode-button-hoverBg rounded transition-colors flex items-center gap-2 disabled:opacity-50"
              aria-label="Import workflow"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                void handleExport();
              }}
              disabled={isLoading || !workflow || !exportLocation}
              className="px-4 py-2 text-sm text-vscode-button-foreground bg-vscode-button-bg hover:bg-vscode-button-hoverBg rounded transition-colors flex items-center gap-2 disabled:opacity-50"
              aria-label="Export workflow"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

ImportExportDialog.displayName = 'ImportExportDialog';
