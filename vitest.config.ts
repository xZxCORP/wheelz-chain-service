import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['**/*.spec.ts'],
    exclude: ['dist', 'node_modules'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
