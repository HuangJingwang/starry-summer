import { Injectable } from '@nestjs/common';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import pg from 'pg';

const { Pool } = pg;

export type HealthStatus = 'ok' | 'degraded';
export type DatabaseHealthStatus = 'ok' | 'skipped' | 'missing' | 'error';
export type RedisHealthStatus = 'ok' | 'error';
export type StorageHealthStatus = 'ok' | 'skipped' | 'missing' | 'error';

export interface ComponentHealth {
  status: string;
  driver?: string;
  message?: string;
}

export interface HealthReport {
  status: HealthStatus;
  service: 'starry-summer-api';
  release: {
    version: string;
    revision: string;
  };
  components: {
    api: ComponentHealth;
    database: ComponentHealth & { status: DatabaseHealthStatus };
    redis?: ComponentHealth & { status: RedisHealthStatus };
    storage?: ComponentHealth & { status: StorageHealthStatus };
  };
}

export interface HealthServiceOptions {
  repositoryDriver?: string;
  databaseUrl?: string;
  pingDatabase?: (databaseUrl: string) => Promise<void>;
  redisUrl?: string;
  pingRedis?: (redisUrl: string) => Promise<void>;
  storageDriver?: string;
  localUploadDir?: string;
  pingLocalUploadDir?: (uploadDir: string) => Promise<void>;
  s3Bucket?: string;
  s3Endpoint?: string;
  s3Region?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
  s3ForcePathStyle?: string;
  pingS3Bucket?: (bucket: string) => Promise<void>;
  releaseVersion?: string;
  gitRevision?: string;
}

@Injectable()
export class HealthService {
  private readonly repositoryDriver: string;
  private readonly databaseUrl?: string;
  private readonly pingDatabase: (databaseUrl: string) => Promise<void>;
  private readonly redisUrl?: string;
  private readonly pingRedis: (redisUrl: string) => Promise<void>;
  private readonly storageDriver?: string;
  private readonly localUploadDir?: string;
  private readonly pingLocalUploadDir: (uploadDir: string) => Promise<void>;
  private readonly s3Bucket?: string;
  private readonly pingS3Bucket: (bucket: string) => Promise<void>;
  private readonly releaseVersion: string;
  private readonly gitRevision: string;

  constructor(options: HealthServiceOptions = {}) {
    this.repositoryDriver = options.repositoryDriver ?? process.env.CONTENT_REPOSITORY_DRIVER ?? 'memory';
    this.databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
    this.pingDatabase = options.pingDatabase ?? pingPostgres;
    this.redisUrl = options.redisUrl ?? process.env.REDIS_URL;
    this.pingRedis = options.pingRedis ?? pingRedis;
    this.storageDriver = options.storageDriver ?? process.env.STORAGE_DRIVER;
    this.localUploadDir = options.localUploadDir ?? process.env.LOCAL_UPLOAD_DIR;
    this.pingLocalUploadDir = options.pingLocalUploadDir ?? pingLocalUploadDir;
    this.s3Bucket = options.s3Bucket ?? process.env.S3_BUCKET;
    this.pingS3Bucket =
      options.pingS3Bucket ??
      createS3BucketPing({
        endpoint: options.s3Endpoint ?? process.env.S3_ENDPOINT,
        region: options.s3Region ?? process.env.S3_REGION,
        accessKeyId: options.s3AccessKey ?? process.env.S3_ACCESS_KEY,
        secretAccessKey: options.s3SecretKey ?? process.env.S3_SECRET_KEY,
        forcePathStyle: parseBoolean(options.s3ForcePathStyle ?? process.env.S3_FORCE_PATH_STYLE),
      });
    this.releaseVersion = options.releaseVersion ?? process.env.RELEASE_VERSION ?? 'development';
    this.gitRevision = options.gitRevision ?? process.env.GIT_REVISION ?? 'unknown';
  }

  async check(): Promise<HealthReport> {
    const database = await this.checkDatabase();
    const redis = await this.checkRedis();
    const storage = await this.checkStorage();
    const status: HealthStatus =
      (database.status === 'ok' || database.status === 'skipped') &&
      (!redis || redis.status === 'ok') &&
      (!storage || storage.status === 'ok' || storage.status === 'skipped')
        ? 'ok'
        : 'degraded';

    return {
      status,
      service: 'starry-summer-api',
      release: {
        version: this.releaseVersion,
        revision: this.gitRevision,
      },
      components: {
        api: { status: 'ok' },
        database,
        ...(redis ? { redis } : {}),
        ...(storage ? { storage } : {}),
      },
    };
  }

  private async checkDatabase(): Promise<HealthReport['components']['database']> {
    if (this.repositoryDriver !== 'postgres') {
      return {
        status: 'skipped',
        driver: this.repositoryDriver,
      };
    }

    if (!this.databaseUrl) {
      return {
        status: 'missing',
        driver: 'postgres',
        message: 'DATABASE_URL is required when CONTENT_REPOSITORY_DRIVER=postgres',
      };
    }

    try {
      await this.pingDatabase(this.databaseUrl);

      return {
        status: 'ok',
        driver: 'postgres',
      };
    } catch (error) {
      return {
        status: 'error',
        driver: 'postgres',
        message: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  private async checkRedis(): Promise<HealthReport['components']['redis'] | undefined> {
    if (!this.redisUrl) {
      return undefined;
    }

    try {
      await this.pingRedis(this.redisUrl);

      return {
        status: 'ok',
        driver: 'redis',
      };
    } catch (error) {
      return {
        status: 'error',
        driver: 'redis',
        message: error instanceof Error ? error.message : 'Unknown Redis error',
      };
    }
  }

  private async checkStorage(): Promise<HealthReport['components']['storage'] | undefined> {
    if (!this.storageDriver) {
      return undefined;
    }

    if (this.storageDriver === 's3') {
      return this.checkS3Storage();
    }

    if (this.storageDriver !== 'local') {
      return {
        status: 'skipped',
        driver: this.storageDriver,
      };
    }

    if (!this.localUploadDir) {
      return {
        status: 'missing',
        driver: 'local',
        message: 'LOCAL_UPLOAD_DIR is required when STORAGE_DRIVER=local',
      };
    }

    try {
      await this.pingLocalUploadDir(this.localUploadDir);

      return {
        status: 'ok',
        driver: 'local',
      };
    } catch (error) {
      return {
        status: 'error',
        driver: 'local',
        message: error instanceof Error ? error.message : 'Unknown local upload storage error',
      };
    }
  }

  private async checkS3Storage(): Promise<HealthReport['components']['storage']> {
    if (!this.s3Bucket) {
      return {
        status: 'missing',
        driver: 's3',
        message: 'S3_BUCKET is required when STORAGE_DRIVER=s3',
      };
    }

    try {
      await this.pingS3Bucket(this.s3Bucket);

      return {
        status: 'ok',
        driver: 's3',
      };
    } catch (error) {
      return {
        status: 'error',
        driver: 's3',
        message: error instanceof Error ? error.message : 'Unknown S3 storage error',
      };
    }
  }
}

async function pingPostgres(databaseUrl: string): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    await pool.query('select 1');
  } finally {
    await pool.end();
  }
}

async function pingRedis(redisUrl: string): Promise<void> {
  const { createClient } = await import('redis');
  const client = createClient({ url: redisUrl });

  client.on('error', () => {
    // The awaited ping/connect call reports the failure to the health check.
  });

  try {
    await client.connect();
    await client.ping();
  } finally {
    if (client.isOpen) {
      await client.quit();
    }
  }
}

async function pingLocalUploadDir(uploadDir: string): Promise<void> {
  await mkdir(uploadDir, { recursive: true });

  const probePath = join(uploadDir, `.health-${randomUUID()}`);

  try {
    await writeFile(probePath, 'ok');
  } finally {
    await rm(probePath, { force: true });
  }
}

function createS3BucketPing(options: {
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
}): (bucket: string) => Promise<void> {
  const client = new S3Client({
    endpoint: options.endpoint,
    region: options.region ?? 'us-east-1',
    forcePathStyle: options.forcePathStyle ?? true,
    credentials:
      options.accessKeyId && options.secretAccessKey
        ? {
            accessKeyId: options.accessKeyId,
            secretAccessKey: options.secretAccessKey,
          }
        : undefined,
  });

  return async (bucket: string) => {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
  };
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  return value.toLowerCase() === 'true';
}
