import { resolve } from 'node:path';

export interface LocalUploadsStaticConfig {
  directory: string;
  prefix: string;
}

export function resolveLocalUploadsStaticConfig(env: NodeJS.ProcessEnv = process.env): LocalUploadsStaticConfig | null {
  if ((env.STORAGE_DRIVER ?? 'local') !== 'local') {
    return null;
  }

  const publicUrl = env.LOCAL_UPLOAD_PUBLIC_URL ?? '/uploads';

  if (!publicUrl.startsWith('/') || publicUrl.startsWith('//')) {
    return null;
  }

  return {
    directory: env.LOCAL_UPLOAD_DIR ?? resolve('uploads'),
    prefix: `${publicUrl.replace(/\/+$/, '')}/`,
  };
}
