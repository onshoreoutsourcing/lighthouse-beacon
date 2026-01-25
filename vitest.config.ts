import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom', // Changed to support renderer tests
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
    exclude: ['node_modules', 'dist', 'dist-electron'],
    setupFiles: ['./src/renderer/__tests__/setup.ts'], // Test setup file
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/main/logger.ts',
        'src/main/utils/diskSpace.ts',
        'src/main/services/workflow/PythonExecutor.ts',
        'src/main/services/vector/VectorService.ts',
      ],
      exclude: [
        'src/main/**/__tests__/**',
        'src/main/**/*.test.ts',
        'node_modules/**',
        'dist/**',
        'dist-electron/**',
      ],
      thresholds: {
        lines: 80,
        functions: 75,
        branches: 80,
        statements: 80,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@main': path.resolve(__dirname, './src/main'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
    },
  },
});
