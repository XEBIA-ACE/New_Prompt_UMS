import { Pool } from 'pg';
import { createPool, isDatabaseReachable } from './postgres';

describe('createPool', () => {
  it('builds a pg Pool from the database config', async () => {
    const pool = createPool({
      connectionString: 'postgres://user:pw@localhost:5432/accounts',
      ssl: false,
      poolMax: 7,
      connectionTimeoutMs: 1234,
    });
    expect(pool).toBeInstanceOf(Pool);
    expect(pool.options.max).toBe(7);
    expect(pool.options.connectionTimeoutMillis).toBe(1234);
    await pool.end();
  });

  it('handles idle client errors instead of crashing', async () => {
    const pool = createPool({
      connectionString: 'postgres://user:pw@localhost:5432/accounts',
      ssl: false,
      poolMax: 1,
      connectionTimeoutMs: 1000,
    });
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(pool.listenerCount('error')).toBe(1);
    expect(() => pool.emit('error', new Error('terminated'), {} as never)).not.toThrow();
    spy.mockRestore();
    await pool.end();
  });
});

describe('isDatabaseReachable', () => {
  it('returns true when SELECT 1 succeeds', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] });
    await expect(isDatabaseReachable({ query } as never)).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });

  it('returns false when the query fails', async () => {
    const query = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(isDatabaseReachable({ query } as never)).resolves.toBe(false);
  });
});
