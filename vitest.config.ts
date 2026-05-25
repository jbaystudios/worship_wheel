import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // Use the automatic JSX runtime so .tsx files (e.g. PDF render tests) don't
  // need a manual `import React from 'react'`. Matches Next.js's runtime
  // behaviour and tsconfig's jsx:preserve setup at build time.
  esbuild: { jsx: 'automatic' },
  test: {
    globals: true,
    // Unit tests live in src/; Playwright e2e specs in tests/e2e/ are run
    // separately via `npm run test:e2e` and must not be collected here.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'tests/e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
