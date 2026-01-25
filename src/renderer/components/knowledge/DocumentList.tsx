/**
 * DocumentList Component
 * Wave 10.2.1 - Knowledge Tab & Document List
 *
 * Displays list of indexed documents with:
 * - Scrollable list container
 * - Empty state when no documents
 * - Passes remove handler to DocumentItem components
 */

import React from 'react';
import { Database } from 'lucide-react';
import { DocumentItem } from './DocumentItem';
import type { IndexedDocument } from '@renderer/stores/knowledge.store';

interface DocumentListProps {
  documents: IndexedDocument[];
  onRemove: (id: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, onRemove }) => {
  // Empty state
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-vscode-text-muted px-4">
        <Database className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-sm">No documents indexed. Add files to get started.</p>
      </div>
    );
  }

  return (
    <ul
      className="overflow-y-auto h-full"
      role="list"
      aria-label="Indexed documents"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#4a4a4a #2d2d2d',
      }}
    >
      {documents.map((doc) => (
        <DocumentItem key={doc.id} document={doc} onRemove={onRemove} />
      ))}
    </ul>
  );
};
