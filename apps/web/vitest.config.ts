import { defineConfig } from 'vitest/config';
export default defineConfig({ test: {
  environment: 'jsdom', include: ['**/*.test.ts', '**/*.test.tsx'],
  coverage: { provider: 'v8', reporter: ['text', 'lcov'], include: ['services/**/*.ts', 'app/**/*.tsx'], exclude: ['**/*.test.tsx', 'app/layout.tsx'] },
}, esbuild: { jsx: 'automatic' } });
