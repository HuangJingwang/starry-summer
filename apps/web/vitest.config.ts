import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': `${fileURLToPath(new URL('./src', import.meta.url))}`,
      '@starry-summer/markdown': `${root}/packages/markdown/src/index.ts`,
      '@starry-summer/shared': `${root}/packages/shared/src/index.ts`,
    },
  },
  test: {
    environment: 'node',
    pool: 'forks',
  },
});
