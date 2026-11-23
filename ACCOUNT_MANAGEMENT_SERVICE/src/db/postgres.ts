import { Pool } from 'pg';
import type { DatabaseConfig } from '../config/env';

export type { Pool } from 'pg';

export function createPool(config: DatabaseConfig): Pool {
  return new Pool({
    connectionString: config.connectionString,
    ssl: config.ssl ? { rejectUnauthorized: true } : false,
    max: config.poolMax,
    connectionTimeoutMillis: config.connectionTimeoutMs,
  });
}

export async function isDatabaseReachable(pool: Pick<Pool, 'query'>): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
