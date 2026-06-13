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
    expect(dockerignore).toContain('_wechat_project_run_*');
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
    expect(env).toContain('TRUST_PROXY=true');
  });

  test('documents the password hash command consistently with the auth implementation', async () => {
    const compose = await readFile(join(repoRoot, 'docker-compose.yml'), 'utf8');
    const env = await readFile(join(repoRoot, '.env.example'), 'utf8');
    const packageJson = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const deployment = await readFile(join(repoRoot, 'docs/deployment.md'), 'utf8');

    expect(env).toContain('ADMIN_EMAIL=owner@example.com');
    expect(env).toContain('ADMIN_PASSWORD_HASH=replace-with-scrypt-hash');
    expect(compose).toContain('ADMIN_EMAIL: ${ADMIN_EMAIL:-owner@example.com}');
    expect(compose).toContain('ADMIN_PASSWORD_HASH: ${ADMIN_PASSWORD_HASH:-replace-with-scrypt-hash}');
    expect(compose).toContain('GITHUB_CALLBACK_URL: ${GITHUB_CALLBACK_URL:-}');
    expect(packageJson.scripts?.['auth:hash-password']).toBe('npm run hash-password --workspace @starry-summer/api');
    expect(packageJson.scripts?.['auth:secret']).toBe('npm run session-secret --workspace @starry-summer/api');
    expect(packageJson.scripts?.['auth:interaction-secret']).toBe('npm run interaction-secret --workspace @starry-summer/api');
    expect(deployment).toContain('npm run auth:hash-password -- "your strong password"');
    expect(deployment).toContain('npm run auth:secret');
    expect(deployment).toContain('npm run auth:interaction-secret');
  });

  test('provides a local Docker env initializer for first boot', async () => {
    const initEnvScript = await readFile(join(repoRoot, 'scripts/init-env.sh'), 'utf8');
    const initEnvTestScript = await readFile(join(repoRoot, 'scripts/init-env.test.sh'), 'utf8');
    const packageJson = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const readme = await readFile(join(repoRoot, 'README.md'), 'utf8');
    const deployment = await readFile(join(repoRoot, 'docs/deployment.md'), 'utf8');

    expect(packageJson.scripts?.['ops:init-env']).toBe('bash scripts/init-env.sh');
    expect(packageJson.scripts?.['test:ops']).toContain('bash scripts/init-env.test.sh');
    expect(initEnvScript).toContain('INIT_ENV_OVERWRITE=YES');
    expect(initEnvScript).toContain('npm run --silent auth:hash-password');
    expect(initEnvScript).toContain('npm run --silent auth:secret');
    expect(initEnvScript).toContain('npm run --silent auth:interaction-secret');
    expect(initEnvTestScript).toContain('ADMIN_PASSWORD_HASH=scrypt:');
    expect(readme).toContain('npm run ops:init-env -- "your local admin password"');
    expect(deployment).toContain('The initializer copies `.env.example`');
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
    expect(backupScript).toContain('PostgreSQL backup failed.');
    expect(backupScript).toContain('PostgreSQL backup produced an empty dump.');
    expect(backupScript).toContain('Backup volume failed:');
    expect(backupScript).toContain('cleanup_incomplete_backup');
    expect(backupScript).toContain('archive_tmp');
    expect(backupScript).toContain('postgres_sha256=');
    expect(backupScript).toContain('docker run --rm');
    expect(backupScript).toContain('api-uploads');
    expect(restoreScript).toContain('docker compose exec -T postgres psql');
    expect(restoreScript).toContain('docker run --rm');
    expect(restoreScript).toContain('Backup checksum does not match');
    expect(restoreScript).toContain('PostgreSQL dump is empty');
    expect(restoreScript).toContain('Backup manifest not found');
    expect(restoreScript).toContain('Backup manifest does not include compose_project_name.');
    expect(restoreScript).toContain('Backup archive is not a valid tar.gz');
    expect(restoreScript).toContain('RESTORE_ALLOW_PROJECT_MISMATCH=YES');
    expect(deployment).toContain('npm run ops:backup');
    expect(deployment).toContain('`manifest.txt`: timestamp, Compose project name, SHA-256 checksums, and git revision.');
    expect(deployment).toContain('npm run ops:restore -- backups/starry-summer-YYYY-MM-DD');
    expect(deployment).toContain('RESTORE_ALLOW_PROJECT_MISMATCH=YES');
  });

  test('provides a production environment doctor before first boot', async () => {
    const doctorScript = await readFile(join(repoRoot, 'scripts/doctor.sh'), 'utf8');
    const packageJson = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const deployment = await readFile(join(repoRoot, 'docs/deployment.md'), 'utf8');
    const safeEnv = [
      'DOMAIN=blog.starry-summer.dev',
      'PUBLIC_SITE_URL=https://blog.starry-summer.dev',
      'ACME_EMAIL=ops@starry-summer.dev',
      'ADMIN_EMAIL=admin@starry-summer.dev',
      'ADMIN_PASSWORD_HASH=scrypt:32768:8:1:salt:hash',
      'SESSION_SECRET=12345678901234567890123456789012',
      'INTERACTION_HASH_SECRET=abcdefabcdefabcdefabcdefabcdef12',
      'GITHUB_CLIENT_ID=github-client-id',
      'GITHUB_CLIENT_SECRET=github-client-secret',
      'GITHUB_CALLBACK_URL=https://blog.starry-summer.dev/api/auth/github/callback',
      'TRUST_PROXY=true',
      'POSTGRES_PASSWORD=replace-me-with-a-real-password',
      'DATABASE_URL=postgresql://starry:replace-me-with-a-real-password@postgres:5432/starry_summer',
      'CONTENT_REPOSITORY_DRIVER=postgres',
      'S3_ACCESS_KEY=starry-prod-access',
      'S3_SECRET_KEY=starry-prod-secret',
      'S3_PUBLIC_BASE_URL=https://assets.starry-summer.dev/starry-summer',
    ].join('\n');
    const tempDirectory = await mkdtemp(join(tmpdir(), 'starry-summer-env-'));
    const safeEnvPath = join(tempDirectory, '.env');
    const localStorageEnvPath = join(tempDirectory, '.env.local-storage');
    const unsafeLocalUploadUrlPath = join(tempDirectory, '.env.unsafe-local-upload-url');
    const unsafeS3EnvPath = join(tempDirectory, '.env.unsafe-s3');
    const unsafeS3PublicUrlPath = join(tempDirectory, '.env.unsafe-s3-public-url');
    const invalidS3PublicUrlPath = join(tempDirectory, '.env.invalid-s3-public-url');
    const placeholderS3PublicUrlPath = join(tempDirectory, '.env.placeholder-s3-public-url');
    const unsafeS3EndpointPath = join(tempDirectory, '.env.unsafe-s3-endpoint');
    const invalidS3EndpointPath = join(tempDirectory, '.env.invalid-s3-endpoint');
    const mismatchedDatabasePasswordPath = join(tempDirectory, '.env.mismatched-database-password');
    const mismatchedDatabaseUserPath = join(tempDirectory, '.env.mismatched-database-user');
    const mismatchedDatabaseNamePath = join(tempDirectory, '.env.mismatched-database-name');
    const unsafeDatabaseHostPath = join(tempDirectory, '.env.unsafe-database-host');
    const unsafeDatabaseProtocolPath = join(tempDirectory, '.env.unsafe-database-protocol');
    const encodedDatabasePasswordPath = join(tempDirectory, '.env.encoded-database-password');
    const unsafeContentRepositoryPath = join(tempDirectory, '.env.unsafe-content-repository');
    const invalidDomainPath = join(tempDirectory, '.env.invalid-domain');
    const placeholderDomainPath = join(tempDirectory, '.env.placeholder-domain');
    const invalidSiteUrlPath = join(tempDirectory, '.env.invalid-site-url');
    const placeholderSiteUrlPath = join(tempDirectory, '.env.placeholder-site-url');
    const mismatchedSiteUrlPath = join(tempDirectory, '.env.mismatched-site-url');
    const unsafePasswordHashPath = join(tempDirectory, '.env.unsafe-password-hash');
    const sharedSecretPath = join(tempDirectory, '.env.shared-secret');
    const unsafeRedisUrlPath = join(tempDirectory, '.env.unsafe-redis-url');
    const unsafeRedisProtocolPath = join(tempDirectory, '.env.unsafe-redis-protocol');
    const unsafeTrustProxyPath = join(tempDirectory, '.env.unsafe-trust-proxy');
    const placeholderAcmeEmailPath = join(tempDirectory, '.env.placeholder-acme-email');
    const missingAdminAccountPath = join(tempDirectory, '.env.missing-admin-account');

    expect(packageJson.scripts?.['ops:doctor']).toBe('bash scripts/doctor.sh');
    expect(doctorScript).toContain('DOMAIN must be a hostname without a scheme or path.');
    expect(doctorScript).toContain('DOMAIN must not use an example.com placeholder.');
    expect(doctorScript).toContain('PUBLIC_SITE_URL must start with https://');
    expect(doctorScript).toContain('PUBLIC_SITE_URL must be a valid URL.');
    expect(doctorScript).toContain('PUBLIC_SITE_URL must not use an example.com placeholder.');
    expect(doctorScript).toContain('ACME_EMAIL must be a valid email for HTTPS certificates.');
    expect(doctorScript).toContain('ACME_EMAIL must not use an example.com placeholder.');
    expect(doctorScript).toContain('ADMIN_EMAIL must be set to the owner login account.');
    expect(doctorScript).toContain('ADMIN_EMAIL must not use an example.com placeholder.');
    expect(doctorScript).toContain('ADMIN_PASSWORD_HASH is still a placeholder');
    expect(doctorScript).toContain('INTERACTION_HASH_SECRET must be at least 32 characters');
    expect(doctorScript).toContain('INTERACTION_HASH_SECRET must be different from SESSION_SECRET.');
    expect(doctorScript).toContain('GITHUB_CLIENT_ID is required for guestbook GitHub login.');
    expect(doctorScript).toContain('GITHUB_CLIENT_SECRET is required for guestbook GitHub login.');
    expect(doctorScript).toContain('GITHUB_CALLBACK_URL must be set to the GitHub OAuth callback URL.');
    expect(doctorScript).toContain('GITHUB_CALLBACK_URL must equal PUBLIC_SITE_URL plus /api/auth/github/callback.');
    expect(doctorScript).toContain('TRUST_PROXY must be true for the Caddy reverse-proxy deployment.');
    expect(doctorScript).toContain('DATABASE_URL must not use the default starry database password.');
    expect(doctorScript).toContain('DATABASE_URL must start with postgresql:// or postgres://.');
    expect(doctorScript).toContain('DATABASE_URL password must match POSTGRES_PASSWORD.');
    expect(doctorScript).toContain('DATABASE_URL username must match POSTGRES_USER.');
    expect(doctorScript).toContain('DATABASE_URL database name must match POSTGRES_DB.');
    expect(doctorScript).toContain('DATABASE_URL must not point at localhost for production containers.');
    expect(doctorScript).toContain('REDIS_URL must start with redis:// or rediss://.');
    expect(doctorScript).toContain('REDIS_URL must not point at localhost for production containers.');
    expect(doctorScript).toContain('CONTENT_REPOSITORY_DRIVER must be postgres for production.');
    expect(doctorScript).toContain('PUBLIC_SITE_URL host must match DOMAIN.');
    expect(doctorScript).toContain('LOCAL_UPLOAD_PUBLIC_URL must be a root-relative path when STORAGE_DRIVER=local.');
    expect(doctorScript).toContain('S3_PUBLIC_BASE_URL must start with https:// when STORAGE_DRIVER=s3.');
    expect(doctorScript).toContain('S3_PUBLIC_BASE_URL must be a valid URL when STORAGE_DRIVER=s3.');
    expect(doctorScript).toContain('S3_PUBLIC_BASE_URL must not use an example.com placeholder when STORAGE_DRIVER=s3.');
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
        safeEnv.replace('S3_PUBLIC_BASE_URL=https://assets.starry-summer.dev/starry-summer', 'S3_PUBLIC_BASE_URL=http://localhost:9000/starry-summer'),
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
        safeEnv.replace('S3_PUBLIC_BASE_URL=https://assets.starry-summer.dev/starry-summer', 'S3_PUBLIC_BASE_URL=https://'),
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
    await writeFile(mismatchedDatabaseUserPath, [safeEnv, 'POSTGRES_USER=writer'].join('\n'));
    await expect(execFileAsync('bash', ['scripts/doctor.sh', mismatchedDatabaseUserPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('DATABASE_URL username must match POSTGRES_USER.'),
    });
    await writeFile(mismatchedDatabaseNamePath, [safeEnv, 'POSTGRES_DB=archive'].join('\n'));
    await expect(execFileAsync('bash', ['scripts/doctor.sh', mismatchedDatabaseNamePath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('DATABASE_URL database name must match POSTGRES_DB.'),
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
    await writeFile(invalidDomainPath, safeEnv.replace('DOMAIN=blog.starry-summer.dev', 'DOMAIN=https://blog.starry-summer.dev'));
    await expect(execFileAsync('bash', ['scripts/doctor.sh', invalidDomainPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('DOMAIN must be a hostname without a scheme or path.'),
    });
    await writeFile(placeholderDomainPath, safeEnv.replace('DOMAIN=blog.starry-summer.dev', 'DOMAIN=blog.example.com'));
    await expect(execFileAsync('bash', ['scripts/doctor.sh', placeholderDomainPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('DOMAIN must not use an example.com placeholder.'),
    });
    await writeFile(invalidSiteUrlPath, safeEnv.replace('PUBLIC_SITE_URL=https://blog.starry-summer.dev', 'PUBLIC_SITE_URL=https://'));
    await expect(execFileAsync('bash', ['scripts/doctor.sh', invalidSiteUrlPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('PUBLIC_SITE_URL must be a valid URL.'),
    });
    await writeFile(placeholderSiteUrlPath, safeEnv.replace('PUBLIC_SITE_URL=https://blog.starry-summer.dev', 'PUBLIC_SITE_URL=https://blog.example.com'));
    await expect(execFileAsync('bash', ['scripts/doctor.sh', placeholderSiteUrlPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('PUBLIC_SITE_URL must not use an example.com placeholder.'),
    });
    await writeFile(mismatchedSiteUrlPath, safeEnv.replace('PUBLIC_SITE_URL=https://blog.starry-summer.dev', 'PUBLIC_SITE_URL=https://wrong.starry-summer.dev'));
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
    await writeFile(unsafeTrustProxyPath, safeEnv.replace('TRUST_PROXY=true', 'TRUST_PROXY=false'));
    await expect(execFileAsync('bash', ['scripts/doctor.sh', unsafeTrustProxyPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('TRUST_PROXY must be true for the Caddy reverse-proxy deployment.'),
    });
    await writeFile(placeholderAcmeEmailPath, safeEnv.replace('ACME_EMAIL=ops@starry-summer.dev', 'ACME_EMAIL=ops@example.com'));
    await expect(execFileAsync('bash', ['scripts/doctor.sh', placeholderAcmeEmailPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('ACME_EMAIL must not use an example.com placeholder.'),
    });
    await writeFile(missingAdminAccountPath, safeEnv.replace('ADMIN_EMAIL=admin@starry-summer.dev', 'ADMIN_EMAIL='));
    await expect(execFileAsync('bash', ['scripts/doctor.sh', missingAdminAccountPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('ADMIN_EMAIL must be set to the owner login account.'),
    });
    await writeFile(
      placeholderS3PublicUrlPath,
      [
        safeEnv.replace('S3_PUBLIC_BASE_URL=https://assets.starry-summer.dev/starry-summer', 'S3_PUBLIC_BASE_URL=https://assets.example.com/starry-summer'),
        'STORAGE_DRIVER=s3',
      ].join('\n'),
    );
    await expect(execFileAsync('bash', ['scripts/doctor.sh', placeholderS3PublicUrlPath], { cwd: repoRoot })).rejects.toMatchObject({
      code: 1,
      stdout: expect.stringContaining('S3_PUBLIC_BASE_URL must not use an example.com placeholder when STORAGE_DRIVER=s3.'),
    });
    await rm(tempDirectory, { recursive: true, force: true });
  }, 20000);

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
    expect(smokeScript).toContain('upload storage as healthy');
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
    expect(smokeScript).toContain('/api/content?type=post');
    expect(smokeScript).toContain('/api/comments/post/$public_post_id');
    expect(smokeScript).toContain('Comments API endpoint did not return JSON.');
    expect(smokeScript).toContain('/api/likes/post/$public_post_id');
    expect(smokeScript).toContain('Public like endpoint did not accept an anonymous request.');
    expect(smokeScript).toContain('Comment submission endpoint did not require reader login.');
    expect(smokeScript).toContain('Guestbook submission endpoint did not require reader login.');
    expect(smokeScript).toContain('/api/assets/random?usage=background');
    expect(smokeScript).toContain('Random asset API endpoint did not return JSON.');
    expect(smokeScript).toContain('/rss.xml');
    expect(smokeScript).toContain('/sitemap.xml');
    expect(smokeScript).toContain('RSS endpoint did not return an RSS channel.');
    expect(smokeScript).toContain('Sitemap endpoint did not return URL entries.');
    expect(smokeScript).toContain('Checking security headers');
    expect(smokeScript).toContain('Strict-Transport-Security');
    expect(smokeScript).toContain('X-Frame-Options');
    expect(smokeScript).toContain('Missing or invalid security header');
    expect(deployment).toContain('npm run ops:smoke -- https://blog.your-domain.com');
    expect(deployment).not.toContain('npm run ops:smoke -- https://example.com');
  });

  test('provides a Docker preflight check before image builds', async () => {
    const dockerPreflightScript = await readFile(join(repoRoot, 'scripts/docker-preflight.sh'), 'utf8');
    const packageJson = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    const deployment = await readFile(join(repoRoot, 'docs/deployment.md'), 'utf8');
    const readme = await readFile(join(repoRoot, 'README.md'), 'utf8');

    expect(packageJson.scripts?.['ops:docker-preflight']).toBe('bash scripts/docker-preflight.sh');
    expect(packageJson.scripts?.['test:ops']).toContain('bash scripts/docker-preflight.test.sh');
    expect(dockerPreflightScript).toContain('TRUST_PROXY');
    expect(dockerPreflightScript).toContain('docker compose config --quiet');
    expect(dockerPreflightScript).toContain('node:22-alpine');
    expect(dockerPreflightScript).toContain('Docker image is not available');
    expect(dockerPreflightScript).toContain('Check Docker Hub access or configure a registry mirror');
    expect(deployment).toContain('npm run ops:docker-preflight');
    expect(readme).toContain('npm run ops:docker-preflight');
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
    expect(deployScript).toContain('Deploy site URL must start with https://.');
    expect(deployScript).toContain('Deploy site URL must match PUBLIC_SITE_URL in the environment file.');
    expect(deployScript).toContain('Refusing to deploy with uncommitted changes.');
    expect(deployment).toContain('npm run ops:deploy -- https://blog.your-domain.com');
    expect(deployment).not.toContain('npm run ops:deploy -- https://example.com');
    expect(deployment).toContain('ALLOW_DIRTY_DEPLOY=true npm run ops:deploy');
  });

  test('keeps deployment docs aligned with production domain placeholder checks', async () => {
    const deployment = await readFile(join(repoRoot, 'docs/deployment.md'), 'utf8');

    expect(deployment).toContain('`DOMAIN`: your public domain, for example `blog.your-domain.com`.');
    expect(deployment).toContain('`PUBLIC_SITE_URL`: `https://blog.your-domain.com`.');
    expect(deployment).toContain('`TRUST_PROXY=true`: trust Caddy forwarded client IP headers for rate limiting.');
    expect(deployment).toContain('`https://assets.your-domain.com/starry-summer`');
    expect(deployment).not.toContain('`example.com`');
    expect(deployment).not.toContain('https://example.com');
    expect(deployment).not.toContain('assets.example.com');
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
