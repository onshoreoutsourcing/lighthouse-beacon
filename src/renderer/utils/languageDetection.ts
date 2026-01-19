/**
 * Language Detection Utility
 *
 * Maps file extensions to Monaco Editor language identifiers.
 * Supports 20+ programming languages and markup formats.
 */

/**
 * Detect Monaco Editor language from file extension
 * @param filename - Name of file including extension
 * @returns Monaco language identifier
 */
export function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    // JavaScript family
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';

    // TypeScript family
    case 'ts':
    case 'tsx':
    case 'mts':
    case 'cts':
      return 'typescript';

    // Python
    case 'py':
    case 'pyw':
    case 'pyi':
      return 'python';

    // Web languages
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return 'css';

    // Data formats
    case 'json':
    case 'jsonc':
    case 'json5':
      return 'json';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'xml':
      return 'xml';

    // Markdown
    case 'md':
    case 'markdown':
    case 'mdx':
      return 'markdown';

    // Systems programming
    case 'c':
    case 'h':
      return 'c';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
    case 'hxx':
      return 'cpp';
    case 'rs':
      return 'rust';
    case 'go':
      return 'go';
    case 'java':
      return 'java';
    case 'cs':
      return 'csharp';

    // Other languages
    case 'php':
      return 'php';
    case 'rb':
      return 'ruby';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'shell';
    case 'sql':
      return 'sql';

    // Fallback to plain text
    default:
      return 'plaintext';
  }
}
