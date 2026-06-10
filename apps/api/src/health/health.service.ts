import { Injectable } from '@nestjs/common';
import pg from 'pg';

const { Pool } = pg;

export type HealthStatus = 'ok' | 'degraded';
export type DatabaseHealthStatus = 'ok' | 'skipped' | 'missing' | 'error';

export interface ComponentHealth {
  status: string;
  driver?: string;
  message?: string;
}

export interface HealthReport {
  status: HealthStatus;
  service: 'starry-summer-api';
  components: {
    api: ComponentHealth;
    database: ComponentHealth & { status: DatabaseHealthStatus };
  };
}

export interface HealthServiceOptions {
  repositoryDriver?: string;
  databaseUrl?: string;
  pingDatabase?: (databaseUrl: string) => Promise<void>;
}

@Injectable()
export class HealthService {
  private readonly repositoryDriver: string;
  private readonly databaseUrl?: string;
  private readonly pingDatabase: (databaseUrl: string) => Promise<void>;

  constructor(options: HealthServiceOptions = {}) {
    this.repositoryDriver = options.repositoryDriver ?? process.env.CONTENT_REPOSITORY_DRIVER ?? 'memory';
    this.databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
    this.pingDatabase = options.pingDatabase ?? pingPostgres;
  }

  async check(): Promise<HealthReport> {
    const database = await this.checkDatabase();
    const status: HealthStatus = database.status === 'ok' || database.status === 'skipped' ? 'ok' : 'degraded';

    return {
      status,
      service: 'starry-summer-api',
      components: {
        api: { status: 'ok' },
        database,
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
}

async function pingPostgres(databaseUrl: string): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    await pool.query('select 1');
  } finally {
    await pool.end();
  }
}
