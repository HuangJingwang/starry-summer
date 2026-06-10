import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { describe, expect, test } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('deployment configuration', () => {
  test('documents every Docker Compose environment variable in the env example', async () => {
    const compose = await readFile(join(repoRoot, 'docker-compose.yml'), 'utf8');
    const env = await readFile(join(repoRoot, '.env.example'), 'utf8');
    const composeVariables = [...compose.matchAll(/\$\{([A-Z0-9_]+)(?::-[^}]*)?\}/g)].map((match) => match[1]);
    const documentedVariables = new Set(
      env
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => line.split('=')[0]),
    );

    expect([...new Set(composeVariables)].filter((variable) => !documentedVariables.has(variable))).toEqual([]);
  });

  test('runs database migrations before the API starts in Docker Compose', async () => {
    const compose = await readFile(join(repoRoot, 'docker-compose.yml'), 'utf8');

    expect(compose).toContain('migrate:');
    expect(compose).toContain('dockerfile: packages/database/Dockerfile');
    expect(compose).toContain('condition: service_completed_successfully');
  });

  test('waits for web and API health checks before routing traffic', async () => {
    const compose = await readFile(join(repoRoot, 'docker-compose.yml'), 'utf8');
    const deployment = await readFile(join(repoRoot, 'docs/deployment.md'), 'utf8');

    expect(compose).toContain('http://127.0.0.1:3000/health');
    expect(compose).toContain('http://127.0.0.1:4000/health');
    expect(compose).toContain('web:\n        condition: service_healthy');
    expect(compose).toContain('api:\n        condition: service_healthy');
    expect(deployment).toContain('`https://$DOMAIN/health` returns Web health through Caddy.');
  });

  test('uses container network hosts in the production env example', async () => {
    const env = await readFile(join(repoRoot, '.env.example'), 'utf8');

    expect(env).toContain('DATABASE_URL=postgresql://starry:starry@postgres:5432/starry_summer');
    expect(env).toContain('CONTENT_REPOSITORY_DRIVER=postgres');
    expect(env).toContain('REDIS_URL=redis://redis:6379');
  });

  test('documents the password hash command consistently with the auth implementation', async () => {
    const env = await readFile(join(repoRoot, '.env.example'), 'utf8');
    const packageJson = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const deployment = await readFile(join(repoRoot, 'docs/deployment.md'), 'utf8');

    expect(env).toContain('ADMIN_PASSWORD_HASH=replace-with-scrypt-hash');
    expect(packageJson.scripts?.['auth:hash-password']).toBe('npm run hash-password --workspace @starry-summer/api');
    expect(packageJson.scripts?.['auth:secret']).toBe('npm run session-secret --workspace @starry-summer/api');
    expect(deployment).toContain('npm run auth:hash-password -- "your strong password"');
    expect(deployment).toContain('npm run auth:secret');
  });

  test('persists and exposes local uploads in Docker Compose', async () => {
    const compose = await readFile(join(repoRoot, 'docker-compose.yml'), 'utf8');
    const env = await readFile(join(repoRoot, '.env.example'), 'utf8');
    const caddy = await readFile(join(repoRoot, 'infra/caddy/Caddyfile'), 'utf8');
    const deployment = await readFile(join(repoRoot, 'docs/deployment.md'), 'utf8');

    expect(compose).toContain('LOCAL_UPLOAD_DIR: ${LOCAL_UPLOAD_DIR:-/app/uploads}');
    expect(compose).toContain('LOCAL_UPLOAD_PUBLIC_URL: ${LOCAL_UPLOAD_PUBLIC_URL:-/uploads}');
    expect(compose).toContain('- api-uploads:/app/uploads');
    expect(compose).toContain('api-uploads:');
    expect(caddy).toContain('handle /uploads/*');
    expect(env).toContain('LOCAL_UPLOAD_DIR=/app/uploads');
    expect(env).toContain('LOCAL_UPLOAD_PUBLIC_URL=/uploads');
    expect(deployment).toContain('`api-uploads.tar.gz`: uploaded files when using local uploads.');
  });

  test('passes S3 public URL and path style settings through deployment config', async () => {
    const compose = await readFile(join(repoRoot, 'docker-compose.yml'), 'utf8');
    const env = await readFile(join(repoRoot, '.env.example'), 'utf8');
    const deployment = await readFile(join(repoRoot, 'docs/deployment.md'), 'utf8');

    expect(env).toContain('S3_PUBLIC_BASE_URL=http://localhost:9000/starry-summer');
    expect(env).toContain('S3_FORCE_PATH_STYLE=true');
    expect(compose).toContain('S3_PUBLIC_BASE_URL: ${S3_PUBLIC_BASE_URL:-http://localhost:9000/starry-summer}');
    expect(compose).toContain('S3_FORCE_PATH_STYLE: ${S3_FORCE_PATH_STYLE:-true}');
    expect(deployment).toContain('S3_FORCE_PATH_STYLE');
  });

  test('provides repeatable backup and restore scripts for cloud operations', async () => {
    const backupScript = await readFile(join(repoRoot, 'scripts/backup.sh'), 'utf8');
    const restoreScript = await readFile(join(repoRoot, 'scripts/restore.sh'), 'utf8');
    const packageJson = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const deployment = await readFile(join(repoRoot, 'docs/deployment.md'), 'utf8');

    expect(packageJson.scripts?.['ops:backup']).toBe('bash scripts/backup.sh');
    expect(packageJson.scripts?.['ops:restore']).toBe('bash scripts/restore.sh');
    expect(backupScript).toContain('docker compose exec -T postgres pg_dump');
    expect(backupScript).toContain('docker run --rm');
    expect(backupScript).toContain('api-uploads');
    expect(restoreScript).toContain('docker compose exec -T postgres psql');
    expect(restoreScript).toContain('docker run --rm');
    expect(deployment).toContain('npm run ops:backup');
    expect(deployment).toContain('npm run ops:restore -- backups/starry-summer-YYYY-MM-DD');
  });

  test('sets baseline security headers at the reverse proxy', async () => {
    const caddy = await readFile(join(repoRoot, 'infra/caddy/Caddyfile'), 'utf8');

    expect(caddy).toContain('Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"');
    expect(caddy).toContain('X-Content-Type-Options "nosniff"');
    expect(caddy).toContain('X-Frame-Options "DENY"');
    expect(caddy).toContain('Referrer-Policy "strict-origin-when-cross-origin"');
    expect(caddy).toContain('Permissions-Policy "camera=(), microphone=(), geolocation=()"');
  });
});
