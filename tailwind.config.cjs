/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
    './src/renderer/index.html',
  ],
  theme: {
    extend: {
      colors: {
        // VS Code Dark+ theme colors
        'vscode-bg': '#1e1e1e',
        'vscode-bg-secondary': '#252526',
        'vscode-panel': '#252526',
        'vscode-border': '#3e3e42',
        'vscode-accent': '#007acc',
        'vscode-text': '#d4d4d4',
        'vscode-text-muted': '#858585',
        'vscode-success': '#4ec9b0',
        'vscode-warning': '#dcdcaa',
        'vscode-error': '#f48771',
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};
