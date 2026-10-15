import { defineConfig } from 'vitest/config';
export default defineConfig({ test: {
  environment: 'node', include: ['src/**/*.test.ts'],
  testTimeout: 15000, hookTimeout: 15000,
  coverage: { provider: 'v8', reporter: ['text', 'lcov', 'html'],
    include: ['src/modules/**/*.ts', 'src/lib/**/*.ts'], exclude: ['**/*.test.ts'],
    thresholds: { lines: 80, functions: 80, statements: 80, branches: 75 },
  },
} });
