import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useEditorStore } from '@renderer/stores/editor.store';

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
 */
const FilePath: React.FC<{ path: string }> = ({ path }) => {
  const { openFile } = useEditorStore();
  const [error, setError] = React.useState<string | null>(null);

  // Remove quotes if present
  const cleanPath = path.replace(/^"|"$/g, '');

  const handleClick = () => {
    setError(null);
    void openFile(cleanPath).catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to open file');
    });
  };

  return (
    <span className="inline-flex items-center">
      <button
        onClick={handleClick}
        className="text-blue-400 hover:text-blue-300 underline cursor-pointer font-mono text-sm"
        title="Click to open file"
      >
        {cleanPath}
      </button>
      {error && <span className="text-red-500 text-xs ml-2">({error})</span>}
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
 * processTextWithFilePaths
 * Detects file paths in text and wraps them with FilePath components
 */
const processTextWithFilePaths = (text: string): (string | React.ReactElement)[] => {
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;

  // Reset regex
  FILE_PATH_REGEX.lastIndex = 0;

  while ((match = FILE_PATH_REGEX.exec(text)) !== null) {
    const matchStart = match.index;
    const matchedText = match[1] as string;

    // Add text before match
    if (matchStart > lastIndex) {
      parts.push(text.substring(lastIndex, matchStart));
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
