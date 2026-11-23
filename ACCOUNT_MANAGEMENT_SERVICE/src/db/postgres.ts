import { Pool } from 'pg';
import type { DatabaseConfig } from '../config/env';

export type { Pool } from 'pg';

export function createPool(config: DatabaseConfig): Pool {
  const pool = new Pool({
    connectionString: config.connectionString,
    ssl: config.ssl ? { rejectUnauthorized: true } : false,
    max: config.poolMax,
    connectionTimeoutMillis: config.connectionTimeoutMs,
  });
  // Idle-client errors (e.g. server-side disconnects) would otherwise crash the process.
  pool.on('error', (err) => {
    console.error('[postgres] Idle client error:', err.message);
  });
  return pool;
}

export async function isDatabaseReachable(pool: Pick<Pool, 'query'>): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
