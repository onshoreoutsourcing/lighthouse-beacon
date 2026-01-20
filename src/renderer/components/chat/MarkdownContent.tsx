import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useEditorStore } from '@renderer/stores/editor.store';
import OperationIndicator, { type OperationType } from './OperationIndicator';

/**
 * MarkdownContent Component Props
 */
interface MarkdownContentProps {
  content: string;
}

/**
 * File path regex pattern
 * Matches:
 * - Absolute paths: /Users/..., C:\..., /home/...
 * - Relative paths: ./src/..., ../lib/...
 * - Paths with spaces: "/path/with spaces/file.ts"
 */
const FILE_PATH_REGEX =
  /(?:^|\s)([./~]?[\w.-]+(?:\/[\w.-]+)+\.[\w]+|"[^"]+\.[\w]+"|\w:\\(?:[\w.-]+\\)*[\w.-]+\.[\w]+)/g;

/**
 * FilePath Component
 * Renders a clickable file path that opens the file in the editor
 *
 * Wave 3.4.2 enhancements:
 * - Keyboard navigation (Tab/Enter) for accessibility
 * - Proper ARIA labels for screen readers
 * - Focus indicators
 * - Error handling for non-existent files
 * - Security checks for path traversal
 */
const FilePath: React.FC<{ path: string }> = ({ path }) => {
  const { openFile } = useEditorStore();
  const [error, setError] = React.useState<string | null>(null);

  // Remove quotes if present
  const cleanPath = path.replace(/^"|"$/g, '').trim();

  // Security: Detect obvious path traversal attempts
  const isSuspiciousPath = cleanPath.includes('../..') || cleanPath.startsWith('/etc');

  const handleClick = async () => {
    if (isSuspiciousPath) {
      setError('Suspicious path detected');
      return;
    }

    setError(null);

    try {
      await openFile(cleanPath);
    } catch (err) {
      // User-friendly error messages (Wave 3.4.2 - User Story 4)
      let errorMessage = 'Failed to open file';

      if (err instanceof Error) {
        if (err.message.includes('not found') || err.message.includes('ENOENT')) {
          errorMessage = 'File not found';
        } else if (err.message.includes('permission') || err.message.includes('EACCES')) {
          errorMessage = 'Permission denied';
        } else if (err.message.includes('binary')) {
          errorMessage = 'Cannot display binary file';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Wave 3.4.2 - User Story 2: Enter key activates link
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      void handleClick();
    }
  };

  return (
    <span className="inline-flex items-center">
      <button
        onClick={() => void handleClick()}
        onKeyDown={handleKeyDown}
        className="text-blue-400 hover:text-blue-300 underline cursor-pointer font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-vscode-bg rounded px-1"
        title={`Click to open file: ${cleanPath}`}
        aria-label={`Open file ${cleanPath} in editor`}
        tabIndex={0}
      >
        {cleanPath}
      </button>
      {error && (
        <span className="text-red-500 text-xs ml-2" role="alert" aria-live="polite">
          ({error})
        </span>
      )}
    </span>
  );
};

/**
 * CodeBlock Component
 * Renders code blocks with syntax highlighting and copy button
 */
const CodeBlock: React.FC<{
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}> = ({ inline, className, children }) => {
  const [copied, setCopied] = React.useState(false);

  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const code = Array.isArray(children)
    ? children.join('')
    : typeof children === 'string'
      ? children
      : '';
  const codeText = code.replace(/\n$/, '');

  const handleCopy = () => {
    void window.navigator.clipboard.writeText(codeText).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  if (inline) {
    return (
      <code className="bg-vscode-bg-tertiary text-vscode-accent px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-3">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-vscode-bg-secondary hover:bg-vscode-bg-tertiary rounded opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy code"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-vscode-text-muted" />
        )}
      </button>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language || 'text'}
        PreTag="div"
        className="rounded text-sm"
        customStyle={{
          margin: 0,
          padding: '1rem',
          backgroundColor: 'var(--vscode-bg-tertiary)',
        }}
      >
        {codeText}
      </SyntaxHighlighter>
    </div>
  );
};

/**
 * detectOperationType
 * Detects operation type from text context
 *
 * Wave 3.4.2 - User Story 3:
 * Analyzes text for keywords to determine operation type
 */
const detectOperationType = (text: string): OperationType | null => {
  const lowerText = text.toLowerCase();

  // Check for operation keywords (order matters - more specific first)
  if (
    lowerText.includes('created') ||
    lowerText.includes('creating') ||
    lowerText.includes('added')
  ) {
    return 'create';
  }
  if (
    lowerText.includes('edited') ||
    lowerText.includes('editing') ||
    lowerText.includes('modified') ||
    lowerText.includes('updated')
  ) {
    return 'edit';
  }
  if (
    lowerText.includes('deleted') ||
    lowerText.includes('deleting') ||
    lowerText.includes('removed')
  ) {
    return 'delete';
  }
  if (
    lowerText.includes('searched') ||
    lowerText.includes('searching') ||
    lowerText.includes('found')
  ) {
    return 'search';
  }
  if (
    lowerText.includes('executed') ||
    lowerText.includes('running') ||
    lowerText.includes('command')
  ) {
    return 'bash';
  }
  if (lowerText.includes('reading') || lowerText.includes('read')) {
    return 'read';
  }

  return null;
};

/**
 * processTextWithFilePaths
 * Detects file paths in text and wraps them with FilePath components
 * Also detects operation types and adds visual indicators
 *
 * Wave 3.4.2 enhancements:
 * - Operation type detection and visual indicators
 * - Enhanced file path parsing
 */
const processTextWithFilePaths = (text: string): (string | React.ReactElement)[] => {
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;

  // Detect operation type for this text segment
  const operationType = detectOperationType(text);

  // Reset regex
  FILE_PATH_REGEX.lastIndex = 0;

  while ((match = FILE_PATH_REGEX.exec(text)) !== null) {
    const matchStart = match.index;
    const matchedText = match[1] as string;

    // Add text before match
    if (matchStart > lastIndex) {
      const beforeText = text.substring(lastIndex, matchStart);
      parts.push(beforeText);

      // Add operation indicator if detected and this is first path in text
      if (operationType && parts.length === 1 && beforeText.trim()) {
        parts.push(
          <OperationIndicator
            key={`op-${matchStart}`}
            operation={operationType}
            className="ml-2 mr-1"
          />
        );
      }
    }

    // Add FilePath component
    parts.push(<FilePath key={`path-${matchStart}`} path={matchedText} />);

    lastIndex = matchStart + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};

/**
 * MarkdownContent Component
 *
 * Renders markdown content with:
 * - GitHub Flavored Markdown support
 * - Syntax highlighting for code blocks
 * - Clickable file paths that open in editor
 * - Copy button for code blocks
 * - Secure rendering (XSS protection via react-markdown)
 *
 * Features:
 * - Headers (h1-h6) with proper hierarchy
 * - Lists (ordered and unordered)
 * - Text emphasis (bold, italic, strikethrough)
 * - Tables with proper alignment
 * - Links (clickable anchors)
 * - Code blocks with language detection
 * - Inline code with monospace styling
 * - File path detection and navigation
 */
const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  // Memoize markdown processing for performance
  const processedContent = useMemo(() => content, [content]);

  return (
    <div className="markdown-content prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks with syntax highlighting
          code: CodeBlock,

          // Custom paragraph rendering with file path detection
          p: ({ children }) => {
            const processedChildren = React.Children.map(children, (child) => {
              if (typeof child === 'string') {
                return processTextWithFilePaths(child);
              }
              return child;
            });
            return <p className="mb-3 last:mb-0">{processedChildren}</p>;
          },

          // Headers
          h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold mt-3 mb-1">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-bold mt-2 mb-1">{children}</h4>,
          h5: ({ children }) => <h5 className="text-sm font-semibold mt-2 mb-1">{children}</h5>,
          h6: ({ children }) => <h6 className="text-xs font-semibold mt-2 mb-1">{children}</h6>,

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="ml-2">{children}</li>,

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-400 hover:text-blue-300 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),

          // Tables
          table: ({ children }) => (
            <table className="border-collapse border border-vscode-border my-3 w-full">
              {children}
            </table>
          ),
          thead: ({ children }) => <thead className="bg-vscode-bg-tertiary">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-vscode-border">{children}</tr>,
          th: ({ children }) => (
            <th className="border border-vscode-border px-3 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-vscode-border px-3 py-2">{children}</td>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-vscode-accent pl-4 italic my-3 text-vscode-text-muted">
              {children}
            </blockquote>
          ),

          // Horizontal rules
          hr: () => <hr className="border-t border-vscode-border my-4" />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
