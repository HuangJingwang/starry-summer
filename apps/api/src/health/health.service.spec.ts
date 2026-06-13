import { describe, expect, test } from 'vitest';

import { HealthService } from './health.service';

const defaultRelease = {
  release: {
    version: 'development',
    revision: 'unknown',
  },
};

describe('HealthService', () => {
  test('reports ok when the API uses in-memory repositories', async () => {
    const service = new HealthService({
      repositoryDriver: 'memory',
    });

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      service: 'starry-summer-api',
      ...defaultRelease,
      components: {
        api: { status: 'ok' },
        database: {
          status: 'skipped',
          driver: 'memory',
        },
      },
    });
  });

  test('includes release metadata for deployment diagnostics', async () => {
    const service = new HealthService({
      repositoryDriver: 'memory',
      releaseVersion: '2026.06.11',
      gitRevision: 'abc1234',
    });

    await expect(service.check()).resolves.toMatchObject({
      release: {
        version: '2026.06.11',
        revision: 'abc1234',
      },
    });
  });

  test('reports degraded when PostgreSQL is selected without a database URL', async () => {
    const service = new HealthService({
      repositoryDriver: 'postgres',
    });

    await expect(service.check()).resolves.toEqual({
      status: 'degraded',
      service: 'starry-summer-api',
      ...defaultRelease,
      components: {
        api: { status: 'ok' },
        database: {
          status: 'missing',
          driver: 'postgres',
          message: 'DATABASE_URL is required when CONTENT_REPOSITORY_DRIVER=postgres',
        },
      },
    });
  });

  test('pings PostgreSQL when database configuration is present', async () => {
    const service = new HealthService({
      repositoryDriver: 'postgres',
      databaseUrl: 'postgresql://user:pass@localhost:5432/starry',
      pingDatabase: async () => undefined,
    });

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      service: 'starry-summer-api',
      ...defaultRelease,
      components: {
        api: { status: 'ok' },
        database: {
          status: 'ok',
          driver: 'postgres',
        },
      },
    });
  });

  test('reports degraded when PostgreSQL ping fails', async () => {
    const service = new HealthService({
      repositoryDriver: 'postgres',
      databaseUrl: 'postgresql://user:pass@localhost:5432/starry',
      pingDatabase: async () => {
        throw new Error('connection refused');
      },
    });

    await expect(service.check()).resolves.toEqual({
      status: 'degraded',
      service: 'starry-summer-api',
      ...defaultRelease,
      components: {
        api: { status: 'ok' },
        database: {
          status: 'error',
          driver: 'postgres',
          message: 'connection refused',
        },
      },
    });
  });

  test('reports degraded when Redis ping fails', async () => {
    const service = new HealthService({
      repositoryDriver: 'memory',
      redisUrl: 'redis://localhost:6379',
      pingRedis: async () => {
        throw new Error('redis unavailable');
      },
    });

    await expect(service.check()).resolves.toEqual({
      status: 'degraded',
      service: 'starry-summer-api',
      ...defaultRelease,
      components: {
        api: { status: 'ok' },
        database: {
          status: 'skipped',
          driver: 'memory',
        },
        redis: {
          status: 'error',
          driver: 'redis',
          message: 'redis unavailable',
        },
      },
    });
  });

  test('reports ok when local upload storage is writable', async () => {
    const service = new HealthService({
      repositoryDriver: 'memory',
      storageDriver: 'local',
      localUploadDir: '/app/uploads',
      pingLocalUploadDir: async () => undefined,
    });

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      service: 'starry-summer-api',
      ...defaultRelease,
      components: {
        api: { status: 'ok' },
        database: {
          status: 'skipped',
          driver: 'memory',
        },
        storage: {
          status: 'ok',
          driver: 'local',
        },
      },
    });
  });

  test('reports degraded when local upload storage is not writable', async () => {
    const service = new HealthService({
      repositoryDriver: 'memory',
      storageDriver: 'local',
      localUploadDir: '/app/uploads',
      pingLocalUploadDir: async () => {
        throw new Error('permission denied');
      },
    });

    await expect(service.check()).resolves.toMatchObject({
      status: 'degraded',
      components: {
        storage: {
          status: 'error',
          driver: 'local',
          message: 'permission denied',
        },
      },
    });
  });

  test('reports ok when S3-compatible storage is reachable', async () => {
    const service = new HealthService({
      repositoryDriver: 'memory',
      storageDriver: 's3',
      s3Bucket: 'starry-summer',
      pingS3Bucket: async () => undefined,
    });

    await expect(service.check()).resolves.toMatchObject({
      status: 'ok',
      components: {
        storage: {
          status: 'ok',
          driver: 's3',
        },
      },
    });
  });

  test('reports degraded when S3-compatible storage is missing a bucket', async () => {
    const service = new HealthService({
      repositoryDriver: 'memory',
      storageDriver: 's3',
    });

    await expect(service.check()).resolves.toMatchObject({
      status: 'degraded',
      components: {
        storage: {
          status: 'missing',
          driver: 's3',
          message: 'S3_BUCKET is required when STORAGE_DRIVER=s3',
        },
      },
    });
  });

  test('reports degraded when S3-compatible storage is unreachable', async () => {
    const service = new HealthService({
      repositoryDriver: 'memory',
      storageDriver: 's3',
      s3Bucket: 'starry-summer',
      pingS3Bucket: async () => {
        throw new Error('bucket unavailable');
      },
    });

    await expect(service.check()).resolves.toMatchObject({
      status: 'degraded',
      components: {
        storage: {
          status: 'error',
          driver: 's3',
          message: 'bucket unavailable',
        },
      },
    });
  });

  test('reports ok when Redis ping succeeds', async () => {
    const service = new HealthService({
      repositoryDriver: 'memory',
      redisUrl: 'redis://localhost:6379',
      pingRedis: async () => undefined,
    });

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      service: 'starry-summer-api',
      ...defaultRelease,
      components: {
        api: { status: 'ok' },
        database: {
          status: 'skipped',
          driver: 'memory',
        },
        redis: {
          status: 'ok',
          driver: 'redis',
        },
      },
    });
  });
});
