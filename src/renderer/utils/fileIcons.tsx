/**
 * File Type Icon Utility
 *
 * Provides file type-specific icons using lucide-react.
 * Supports common programming languages and file types with distinct colors.
 */

import React from 'react';
import { FileCode, FileJson, FileText, File as FileIcon, Folder, FolderOpen } from 'lucide-react';

/**
 * Returns the appropriate icon component for a file or folder
 *
 * @param name - File or folder name
 * @param isDirectory - Whether the entry is a directory
 * @param isExpanded - Whether the folder is expanded (only applies to directories)
 * @returns React element with appropriate icon and color
 */
export function getFileIcon(
  name: string,
  isDirectory: boolean,
  isExpanded?: boolean
): React.ReactElement {
  // Folder icons
  if (isDirectory) {
    return isExpanded ? (
      <FolderOpen className="w-4 h-4 flex-shrink-0 text-blue-400" />
    ) : (
      <Folder className="w-4 h-4 flex-shrink-0 text-blue-400" />
    );
  }

  // File icons - extract extension
  const ext = name.split('.').pop()?.toLowerCase();

  switch (ext) {
    // JavaScript
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return <FileCode className="w-4 h-4 flex-shrink-0 text-yellow-400" />;

    // TypeScript
    case 'ts':
    case 'tsx':
    case 'mts':
    case 'cts':
      return <FileCode className="w-4 h-4 flex-shrink-0 text-blue-500" />;

    // Python
    case 'py':
    case 'pyw':
    case 'pyi':
      return <FileCode className="w-4 h-4 flex-shrink-0 text-green-400" />;

    // Java
    case 'java':
    case 'class':
    case 'jar':
      return <FileCode className="w-4 h-4 flex-shrink-0 text-orange-500" />;

    // Go
    case 'go':
      return <FileCode className="w-4 h-4 flex-shrink-0 text-cyan-400" />;

    // Rust
    case 'rs':
    case 'toml':
      return <FileCode className="w-4 h-4 flex-shrink-0 text-orange-600" />;

    // JSON
    case 'json':
    case 'jsonc':
    case 'json5':
      return <FileJson className="w-4 h-4 flex-shrink-0 text-yellow-500" />;

    // Markdown
    case 'md':
    case 'mdx':
    case 'markdown':
      return <FileText className="w-4 h-4 flex-shrink-0 text-blue-300" />;

    // HTML
    case 'html':
    case 'htm':
    case 'xhtml':
      return <FileCode className="w-4 h-4 flex-shrink-0 text-orange-400" />;

    // CSS
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return <FileCode className="w-4 h-4 flex-shrink-0 text-purple-400" />;

    // C/C++
    case 'c':
    case 'h':
    case 'cpp':
    case 'hpp':
    case 'cc':
      return <FileCode className="w-4 h-4 flex-shrink-0 text-blue-600" />;

    // C#
    case 'cs':
    case 'csx':
      return <FileCode className="w-4 h-4 flex-shrink-0 text-green-500" />;

    // PHP
    case 'php':
    case 'phtml':
      return <FileCode className="w-4 h-4 flex-shrink-0 text-indigo-400" />;

    // Ruby
    case 'rb':
    case 'erb':
      return <FileCode className="w-4 h-4 flex-shrink-0 text-red-400" />;

    // Shell
    case 'sh':
    case 'bash':
    case 'zsh':
      return <FileCode className="w-4 h-4 flex-shrink-0 text-green-300" />;

    // YAML
    case 'yaml':
    case 'yml':
      return <FileText className="w-4 h-4 flex-shrink-0 text-purple-300" />;

    // XML
    case 'xml':
    case 'svg':
      return <FileCode className="w-4 h-4 flex-shrink-0 text-orange-300" />;

    // Generic file icon
    default:
      return <FileIcon className="w-4 h-4 flex-shrink-0 text-gray-400" />;
  }
}
