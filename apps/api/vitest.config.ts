import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@starry-summer/shared': `${root}/packages/shared/src/index.ts`,
      '@starry-summer/markdown': `${root}/packages/markdown/src/index.ts`,
    },
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    pool: 'forks',
  },
});
