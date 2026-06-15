import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url));

const nextConfig: NextConfig = {
  devIndicators: false,
  output: 'standalone',
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
