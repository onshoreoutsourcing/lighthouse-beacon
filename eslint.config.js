import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Base JavaScript recommended rules
  js.configs.recommended,

  // Global ignores
  {
    ignores: ['dist-electron/**', 'node_modules/**', '*.config.js', '*.config.ts'],
  },

  // TypeScript + React configuration
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        NodeJS: 'readonly',
        document: 'readonly',
        window: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs['recommended-requiring-type-checking'].rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // TypeScript-specific rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],

      // React-specific rules
      'react/react-in-jsx-scope': 'off', // Not needed with React 18+
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General code quality rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Electron main process specific rules
  {
    files: ['src/main/**/*.ts'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        require: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
  },

  // Test files specific rules
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      globals: {
        global: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      // Disable rules that are false positives in test files
      '@typescript-eslint/unbound-method': 'off', // Mocked functions are intentionally unbound
      '@typescript-eslint/no-unsafe-assignment': 'off', // Mock types often involve any
      '@typescript-eslint/no-unsafe-call': 'off', // Mock calls are type-safe at runtime
      '@typescript-eslint/no-unsafe-member-access': 'off', // Mock property access is expected
      '@typescript-eslint/no-explicit-any': 'off', // expect.any() is valid test syntax
    },
  },

  // Monaco Editor component - OnMount callback type limitations
  {
    files: ['**/MonacoEditorContainer.tsx'],
    rules: {
      // The 'monaco' parameter from @monaco-editor/react's OnMount callback
      // has incomplete type resolution (verified with monaco-editor@0.55.1).
      // This is a known limitation where monaco.KeyMod and monaco.KeyCode
      // cannot be fully resolved by TypeScript, despite working correctly at runtime.
      // Verified needed by removing and testing (2026-01-21).
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },

  // Prettier config (must be last to override other configs)
  prettierConfig,
];
