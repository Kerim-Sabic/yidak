import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, './test/setup.ts')],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['packages/*/src/**', 'apps/*/src/**'],
      exclude: ['**/*.test.*', '**/types/**', '**/*.d.ts'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web/src'),
      '@yidak/types': path.resolve(__dirname, './packages/types/src'),
      '@yidak/db': path.resolve(__dirname, './packages/db/src'),
      '@yidak/utils': path.resolve(__dirname, './packages/utils/src'),
      '@yidak/api': path.resolve(__dirname, './apps/api/src')
    }
  }
});
