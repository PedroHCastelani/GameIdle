import { defineConfig } from 'vitest/config';
export default defineConfig({ test: {
  environment: 'jsdom', include: ['**/*.test.ts', '**/*.test.tsx'],
  coverage: { provider: 'v8', reporter: ['text', 'lcov'], include: ['services/**/*.ts', 'app/**/*.tsx'], exclude: ['**/*.test.tsx', 'app/layout.tsx'], thresholds: { lines: 80, statements: 80, functions: 80, branches: 75 } },
}, esbuild: { jsx: 'automatic' } });
