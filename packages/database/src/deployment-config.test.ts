import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { describe, expect, test } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const execFileAsync = promisify(execFile);

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

  test('keeps local-only data out of Docker build contexts', async () => {
    const dockerignore = await readFile(join(repoRoot, '.dockerignore'), 'utf8');

    expect(dockerignore).toContain('node_modules');
    expect(dockerignore).toContain('.env');
    expect(dockerignore).toContain('.next');
    expect(dockerignore).toContain('dist');
    expect(dockerignore).toContain('backups');
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
    expect(deployment).toContain('API health also verifies PostgreSQL and Redis when production drivers are configured.');
  });

  test('shares the admin session secret with web and API containers', async () => {
    const compose = await readFile(join(repoRoot, 'docker-compose.yml'), 'utf8');

    expect(compose).toContain('web:\n    build:');
    expect(compose).toContain('api:\n    build:');
    expect(compose.match(/SESSION_SECRET: \$\{SESSION_SECRET:-change-me-before-production\}/g)).toHaveLength(2);
  });

  test('passes release metadata into web and API health checks', async () => {
    const compose = await readFile(join(repoRoot, 'docker-compose.yml'), 'utf8');
    const env = await readFile(join(repoRoot, '.env.example'), 'utf8');
    const deployment = await readFile(join(repoRoot, 'docs/deployment.md'), 'utf8');

    expect(compose.match(/RELEASE_VERSION: \$\{RELEASE_VERSION:-development\}/g)).toHaveLength(2);
    expect(compose.match(/GIT_REVISION: \$\{GIT_REVISION:-unknown\}/g)).toHaveLength(2);
    expect(env).toContain('RELEASE_VERSION=development');
    expect(env).toContain('GIT_REVISION=unknown');
    expect(deployment).toContain('RELEASE_VERSION and GIT_REVISION are returned by `/health` and `/api/health`');
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
    expect(restoreScript).toContain('Backup manifest not found');
    expect(deployment).toContain('npm run ops:backup');
    expect(deployment).toContain('npm run ops:restore -- backups/starry-summer-YYYY-MM-DD');
  });

  test('provides a production environment doctor before first boot', async () => {
    const doctorScript = await readFile(join(repoRoot, 'scripts/doctor.sh'), 'utf8');
    const packageJson = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const deployment = await readFile(join(repoRoot, 'docs/deployment.md'), 'utf8');
    const safeEnv = [
      'DOMAIN=blog.example.com',
      'PUBLIC_SITE_URL=https://blog.example.com',
      'ACME_EMAIL=ops@example.com',
      'ADMIN_EMAIL=owner@example.com',
      'ADMIN_PASSWORD_HASH=scrypt:32768:8:1:salt:hash',
      'SESSION_SECRET=12345678901234567890123456789012',
      'INTERACTION_HASH_SECRET=abcdefabcdefabcdefabcdefabcdef12',
      'POSTGRES_PASSWORD=replace-me-with-a-real-password',
      'DATABASE_URL=postgresql://starry:replace-me-with-a-real-password@postgres:5432/starry_summer',
      'CONTENT_REPOSITORY_DRIVER=postgres',
      'S3_ACCESS_KEY=starry-prod-access',
      'S3_SECRET_KEY=starry-prod-secret',
      'S3_PUBLIC_BASE_URL=https://assets.example.com/starry-summer',
    ].join('\n');
    const tempDirectory = await mkdtemp(join(tmpdir(), 'starry-summer-env-'));
    const safeEnvPath = join(tempDirectory, '.env');
    const localStorageEnvPath = join(tempDirectory, '.env.local-storage');
    const unsafeLocalUploadUrlPath = join(tempDirectory, '.env.unsafe-local-upload-url');
    const unsafeS3EnvPath = join(tempDirectory, '.env.unsafe-s3');
    const unsafeS3PublicUrlPath = join(tempDirectory, '.env.unsafe-s3-public-url');
    const invalidS3PublicUrlPath = join(tempDirectory, '.env.invalid-s3-public-url');
    const unsafeS3EndpointPath = join(tempDirectory, '.env.unsafe-s3-endpoint');
    const invalidS3EndpointPath = join(tempDirectory, '.env.invalid-s3-endpoint');
    const mismatchedDatabasePasswordPath = join(tempDirectory, '.env.mismatched-database-password');
    const unsafeDatabaseHostPath = join(tempDirectory, '.env.unsafe-database-host');
    const unsafeDatabaseProtocolPath = join(tempDirectory, '.env.unsafe-database-protocol');
    const encodedDatabasePasswordPath = join(tempDirectory, '.env.encoded-database-password');
    const unsafeContentRepositoryPath = join(tempDirectory, '.env.unsafe-content-repository');
    const invalidDomainPath = join(tempDirectory, '.env.invalid-domain');
    const invalidSiteUrlPath = join(tempDirectory, '.env.invalid-site-url');
    const mismatchedSiteUrlPath = join(tempDirectory, '.env.mismatched-site-url');
    const unsafePasswordHashPath = join(tempDirectory, '.env.unsafe-password-hash');
    const sharedSecretPath = join(tempDirectory, '.env.shared-secret');
    const unsafeRedisUrlPath = join(tempDirectory, '.env.unsafe-redis-url');
    const unsafeRedisProtocolPath = join(tempDirectory, '.env.unsafe-redis-protocol');

    expect(packageJson.scripts?.['ops:doctor']).toBe('bash scripts/doctor.sh');
    expect(doctorScript).toContain('DOMAIN must be a hostname without a scheme or path.');
    expect(doctorScript).toContain('PUBLIC_SITE_URL must start with https://');
    expect(doctorScript).toContain('PUBLIC_SITE_URL must be a valid URL.');
    expect(doctorScript).toContain('ACME_EMAIL must be a valid email for HTTPS certificates.');
    expect(doctorScript).toContain('ADMIN_PASSWORD_HASH is still a placeholder');
    expect(doctorScript).toContain('INTERACTION_HASH_SECRET must be at least 32 characters');
    expect(doctorScript).toContain('INTERACTION_HASH_SECRET must be different from SESSION_SECRET.');
    expect(doctorScript).toContain('DATABASE_URL must not use the default starry database password.');
    expect(doctorScript).toContain('DATABASE_URL must start with postgresql:// or postgres://.');
    expect(doctorScript).toContain('DATABASE_URL password must match POSTGRES_PASSWORD.');
    expect(doctorScript).toContain('DATABASE_URL must not point at localhost for production containers.');
    expect(doctorScript).toContain('REDIS_URL must start with redis:// or rediss://.');
    expect(doctorScript).toContain('REDIS_URL must not point at localhost for production containers.');
    expect(doctorScript).toContain('CONTENT_REPOSITORY_DRIVER must be postgres for production.');
    expect(doctorScript).toContain('PUBLIC_SITE_URL host must match DOMAIN.');
    expect(doctorScript).toContain('LOCAL_UPLOAD_PUBLIC_URL must be a root-relative path when STORAGE_DRIVER=local.');
    expect(doctorScript).toContain('S3_PUBLIC_BASE_URL must start with https:// when STORAGE_DRIVER=s3.');
    expect(doctorScript).toContain('S3_PUBLIC_BASE_URL must be a valid URL when STORAGE_DRIVER=s3.');
    expect(doctorScript).toContain('S3_ENDPOINT must be a valid URL when STORAGE_DRIVER=s3.');
    expect(doctorScript).toContain('S3_ENDPOINT must not point at localhost when STORAGE_DRIVER=s3.');
    expect(deployment).toContain('npm run ops:doctor');

    await expect(execFileAsync('bash', ['scripts/doctor.sh', '.env.example'], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
    });
    await writeFile(safeEnvPath, safeEnv);
    await expect(execFileAsync('bash', ['scripts/doctor.sh', safeEnvPath], { cwd: repoRoot })).resolves.toMatchObject({
      stdout: expect.stringContaining('Deployment environment looks ready.'),
    });
    await writeFile(
      localStorageEnvPath,
      [
        safeEnv,
        'STORAGE_DRIVER=local',
        'S3_ACCESS_KEY=minioadmin',
        'S3_SECRET_KEY=minioadmin',
      ].join('\n'),
    );
    await expect(execFileAsync('bash', ['scripts/doctor.sh', localStorageEnvPath], { cwd: repoRoot })).resolves.toMatchObject({
      stdout: expect.stringContaining('Deployment environment looks ready.'),
    });
    await writeFile(
      unsafeLocalUploadUrlPath,
      [
        safeEnv,
        'STORAGE_DRIVER=local',
        'LOCAL_UPLOAD_PUBLIC_URL=https://assets.example.com/uploads',
      ].join('\n'),
    );
    await expect(execFileAsync('bash', ['scripts/doctor.sh', unsafeLocalUploadUrlPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('LOCAL_UPLOAD_PUBLIC_URL must be a root-relative path when STORAGE_DRIVER=local.'),
    });
    await writeFile(
      unsafeS3EnvPath,
      [
        safeEnv,
        'STORAGE_DRIVER=s3',
        'S3_ACCESS_KEY=minioadmin',
        'S3_SECRET_KEY=minioadmin',
      ].join('\n'),
    );
    await expect(execFileAsync('bash', ['scripts/doctor.sh', unsafeS3EnvPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('S3_ACCESS_KEY must not use a default or placeholder value when STORAGE_DRIVER=s3.'),
    });
    await writeFile(
      unsafeS3PublicUrlPath,
      [
        safeEnv.replace('S3_PUBLIC_BASE_URL=https://assets.example.com/starry-summer', 'S3_PUBLIC_BASE_URL=http://localhost:9000/starry-summer'),
        'STORAGE_DRIVER=s3',
      ].join('\n'),
    );
    await expect(execFileAsync('bash', ['scripts/doctor.sh', unsafeS3PublicUrlPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('S3_PUBLIC_BASE_URL must start with https:// when STORAGE_DRIVER=s3.'),
    });
    await writeFile(
      invalidS3PublicUrlPath,
      [
        safeEnv.replace('S3_PUBLIC_BASE_URL=https://assets.example.com/starry-summer', 'S3_PUBLIC_BASE_URL=https://'),
        'STORAGE_DRIVER=s3',
      ].join('\n'),
    );
    await expect(execFileAsync('bash', ['scripts/doctor.sh', invalidS3PublicUrlPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('S3_PUBLIC_BASE_URL must be a valid URL when STORAGE_DRIVER=s3.'),
    });
    await writeFile(
      unsafeS3EndpointPath,
      [
        safeEnv,
        'STORAGE_DRIVER=s3',
        'S3_ENDPOINT=http://localhost:9000',
      ].join('\n'),
    );
    await expect(execFileAsync('bash', ['scripts/doctor.sh', unsafeS3EndpointPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('S3_ENDPOINT must not point at localhost when STORAGE_DRIVER=s3.'),
    });
    await writeFile(
      invalidS3EndpointPath,
      [
        safeEnv,
        'STORAGE_DRIVER=s3',
        'S3_ENDPOINT=https://',
      ].join('\n'),
    );
    await expect(execFileAsync('bash', ['scripts/doctor.sh', invalidS3EndpointPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('S3_ENDPOINT must be a valid URL when STORAGE_DRIVER=s3.'),
    });
    await writeFile(
      mismatchedDatabasePasswordPath,
      safeEnv.replace(
        'DATABASE_URL=postgresql://starry:replace-me-with-a-real-password@postgres:5432/starry_summer',
        'DATABASE_URL=postgresql://starry:another-real-password@postgres:5432/starry_summer',
      ),
    );
    await expect(execFileAsync('bash', ['scripts/doctor.sh', mismatchedDatabasePasswordPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('DATABASE_URL password must match POSTGRES_PASSWORD.'),
    });
    await writeFile(
      unsafeDatabaseHostPath,
      safeEnv.replace(
        'DATABASE_URL=postgresql://starry:replace-me-with-a-real-password@postgres:5432/starry_summer',
        'DATABASE_URL=postgresql://starry:replace-me-with-a-real-password@localhost:5432/starry_summer',
      ),
    );
    await expect(execFileAsync('bash', ['scripts/doctor.sh', unsafeDatabaseHostPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('DATABASE_URL must not point at localhost for production containers.'),
    });
    await writeFile(
      unsafeDatabaseProtocolPath,
      safeEnv.replace(
        'DATABASE_URL=postgresql://starry:replace-me-with-a-real-password@postgres:5432/starry_summer',
        'DATABASE_URL=mysql://starry:replace-me-with-a-real-password@postgres:3306/starry_summer',
      ),
    );
    await expect(execFileAsync('bash', ['scripts/doctor.sh', unsafeDatabaseProtocolPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('DATABASE_URL must start with postgresql:// or postgres://.'),
    });
    await writeFile(
      encodedDatabasePasswordPath,
      safeEnv
        .replace('POSTGRES_PASSWORD=replace-me-with-a-real-password', 'POSTGRES_PASSWORD=replace-me-with-a-real-@-password')
        .replace(
          'DATABASE_URL=postgresql://starry:replace-me-with-a-real-password@postgres:5432/starry_summer',
          'DATABASE_URL=postgresql://starry:replace-me-with-a-real-%40-password@postgres:5432/starry_summer',
        ),
    );
    await expect(execFileAsync('bash', ['scripts/doctor.sh', encodedDatabasePasswordPath], { cwd: repoRoot })).resolves.toMatchObject({
      stdout: expect.stringContaining('Deployment environment looks ready.'),
    });
    await writeFile(
      unsafeContentRepositoryPath,
      safeEnv.replace('CONTENT_REPOSITORY_DRIVER=postgres', 'CONTENT_REPOSITORY_DRIVER=memory'),
    );
    await expect(execFileAsync('bash', ['scripts/doctor.sh', unsafeContentRepositoryPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('CONTENT_REPOSITORY_DRIVER must be postgres for production.'),
    });
    await writeFile(invalidDomainPath, safeEnv.replace('DOMAIN=blog.example.com', 'DOMAIN=https://blog.example.com'));
    await expect(execFileAsync('bash', ['scripts/doctor.sh', invalidDomainPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('DOMAIN must be a hostname without a scheme or path.'),
    });
    await writeFile(invalidSiteUrlPath, safeEnv.replace('PUBLIC_SITE_URL=https://blog.example.com', 'PUBLIC_SITE_URL=https://'));
    await expect(execFileAsync('bash', ['scripts/doctor.sh', invalidSiteUrlPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('PUBLIC_SITE_URL must be a valid URL.'),
    });
    await writeFile(mismatchedSiteUrlPath, safeEnv.replace('PUBLIC_SITE_URL=https://blog.example.com', 'PUBLIC_SITE_URL=https://wrong.example.com'));
    await expect(execFileAsync('bash', ['scripts/doctor.sh', mismatchedSiteUrlPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('PUBLIC_SITE_URL host must match DOMAIN.'),
    });
    await writeFile(unsafePasswordHashPath, safeEnv.replace('ADMIN_PASSWORD_HASH=scrypt:32768:8:1:salt:hash', 'ADMIN_PASSWORD_HASH=plain-password'));
    await expect(execFileAsync('bash', ['scripts/doctor.sh', unsafePasswordHashPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('ADMIN_PASSWORD_HASH must be generated by npm run auth:hash-password.'),
    });
    await writeFile(
      sharedSecretPath,
      safeEnv.replace('INTERACTION_HASH_SECRET=abcdefabcdefabcdefabcdefabcdef12', 'INTERACTION_HASH_SECRET=12345678901234567890123456789012'),
    );
    await expect(execFileAsync('bash', ['scripts/doctor.sh', sharedSecretPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('INTERACTION_HASH_SECRET must be different from SESSION_SECRET.'),
    });
    await writeFile(unsafeRedisUrlPath, [safeEnv, 'REDIS_URL=redis://localhost:6379'].join('\n'));
    await expect(execFileAsync('bash', ['scripts/doctor.sh', unsafeRedisUrlPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('REDIS_URL must not point at localhost for production containers.'),
    });
    await writeFile(unsafeRedisProtocolPath, [safeEnv, 'REDIS_URL=http://redis:6379'].join('\n'));
    await expect(execFileAsync('bash', ['scripts/doctor.sh', unsafeRedisProtocolPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('REDIS_URL must start with redis:// or rediss://.'),
    });
    await rm(tempDirectory, { recursive: true, force: true });
  }, 10000);

  test('provides a deployment smoke test for public endpoints', async () => {
    const smokeScript = await readFile(join(repoRoot, 'scripts/smoke.sh'), 'utf8');
    const packageJson = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const deployment = await readFile(join(repoRoot, 'docs/deployment.md'), 'utf8');

    expect(packageJson.scripts?.['ops:smoke']).toBe('bash scripts/smoke.sh');
    expect(smokeScript).toContain('SITE_URL');
    expect(smokeScript).toContain('curl --fail');
    expect(smokeScript).toContain('/health');
    expect(smokeScript).toContain('/api/health');
    expect(smokeScript).toContain('PostgreSQL as healthy');
    expect(smokeScript).toContain('Redis as healthy');
    expect(smokeScript).toContain('/admin/login');
    expect(smokeScript).toContain('/admin/content');
    expect(smokeScript).toContain('admin protected redirect');
    expect(smokeScript).toContain('Location header did not point to /admin/login.');
    expect(smokeScript).toContain('/api/admin/content');
    expect(smokeScript).toContain('Admin API endpoint did not reject unauthenticated access.');
    expect(smokeScript).toContain('/api/settings');
    expect(smokeScript).toContain('Settings API endpoint did not return JSON.');
    expect(smokeScript).toContain('/api/content?q=starry');
    expect(smokeScript).toContain('Content search API endpoint did not return JSON.');
    expect(smokeScript).toContain('/api/guestbook');
    expect(smokeScript).toContain('Guestbook API endpoint did not return JSON.');
    expect(smokeScript).toContain('/rss.xml');
    expect(smokeScript).toContain('/sitemap.xml');
    expect(smokeScript).toContain('RSS endpoint did not return an RSS channel.');
    expect(smokeScript).toContain('Sitemap endpoint did not return URL entries.');
    expect(smokeScript).toContain('Checking security headers');
    expect(smokeScript).toContain('Strict-Transport-Security');
    expect(smokeScript).toContain('X-Frame-Options');
    expect(smokeScript).toContain('Missing or invalid security header');
    expect(deployment).toContain('npm run ops:smoke -- https://example.com');
  });

  test('provides a repeatable production deployment script', async () => {
    const deployScript = await readFile(join(repoRoot, 'scripts/deploy.sh'), 'utf8');
    const packageJson = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const deployment = await readFile(join(repoRoot, 'docs/deployment.md'), 'utf8');

    expect(packageJson.scripts?.['ops:deploy']).toBe('bash scripts/deploy.sh');
    expect(packageJson.scripts?.['test:ops']).toContain('bash scripts/deploy.test.sh');
    expect(deployScript).toContain('npm run ops:doctor -- "$env_file"');
    expect(deployScript).toContain('export RELEASE_VERSION="${RELEASE_VERSION:-$release_version}"');
    expect(deployScript).toContain('export GIT_REVISION="${GIT_REVISION:-$git_revision}"');
    expect(deployScript).toContain('docker compose --env-file "$env_file" config --quiet');
    expect(deployScript).toContain('docker compose --env-file "$env_file" build');
    expect(deployScript).toContain('docker compose --env-file "$env_file" run --rm migrate');
    expect(deployScript).toContain('docker compose --env-file "$env_file" up -d');
    expect(deployScript).toContain('npm run ops:smoke -- "$site_url"');
    expect(deployScript).toContain('ALLOW_DIRTY_DEPLOY');
    expect(deployScript).toContain('git status --porcelain --untracked-files=all');
    expect(deployScript).toContain('Refusing to deploy with uncommitted changes.');
    expect(deployment).toContain('npm run ops:deploy -- https://example.com');
    expect(deployment).toContain('ALLOW_DIRTY_DEPLOY=true npm run ops:deploy');
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
