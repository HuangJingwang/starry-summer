import { Injectable } from '@nestjs/common';
import pg from 'pg';

const { Pool } = pg;

export type HealthStatus = 'ok' | 'degraded';
export type DatabaseHealthStatus = 'ok' | 'skipped' | 'missing' | 'error';
export type RedisHealthStatus = 'ok' | 'error';

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
  };
}

export interface HealthServiceOptions {
  repositoryDriver?: string;
  databaseUrl?: string;
  pingDatabase?: (databaseUrl: string) => Promise<void>;
  redisUrl?: string;
  pingRedis?: (redisUrl: string) => Promise<void>;
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
  private readonly releaseVersion: string;
  private readonly gitRevision: string;

  constructor(options: HealthServiceOptions = {}) {
    this.repositoryDriver = options.repositoryDriver ?? process.env.CONTENT_REPOSITORY_DRIVER ?? 'memory';
    this.databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
    this.pingDatabase = options.pingDatabase ?? pingPostgres;
    this.redisUrl = options.redisUrl ?? process.env.REDIS_URL;
    this.pingRedis = options.pingRedis ?? pingRedis;
    this.releaseVersion = options.releaseVersion ?? process.env.RELEASE_VERSION ?? 'development';
    this.gitRevision = options.gitRevision ?? process.env.GIT_REVISION ?? 'unknown';
  }

  async check(): Promise<HealthReport> {
    const database = await this.checkDatabase();
    const redis = await this.checkRedis();
    const status: HealthStatus =
      (database.status === 'ok' || database.status === 'skipped') && (!redis || redis.status === 'ok')
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
