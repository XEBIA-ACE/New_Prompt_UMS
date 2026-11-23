import { ConfigError, loadConfig } from './env';

describe('loadConfig', () => {
  const DATABASE_URL = 'postgres://user:secret@db.internal:5432/accounts';

  it('applies defaults when only DATABASE_URL is set', () => {
    expect(loadConfig({ DATABASE_URL })).toEqual({
      port: 3000,
      nodeEnv: 'development',
      database: {
        connectionString: DATABASE_URL,
        ssl: false,
        poolMax: 10,
        connectionTimeoutMs: 5000,
        queryTimeoutMs: 5000,
      },
    });
  });

  it('reads every value from the environment', () => {
    const config = loadConfig({
      DATABASE_URL,
      PORT: '8080',
      NODE_ENV: 'production',
      DATABASE_SSL: 'true',
      DATABASE_POOL_MAX: '20',
      DATABASE_CONNECTION_TIMEOUT_MS: '1000',
      DATABASE_QUERY_TIMEOUT_MS: '2000',
    });
    expect(config.port).toBe(8080);
    expect(config.nodeEnv).toBe('production');
    expect(config.database).toEqual({
      connectionString: DATABASE_URL,
      ssl: true,
      poolMax: 20,
      connectionTimeoutMs: 1000,
      queryTimeoutMs: 2000,
    });
  });

  it('fails fast when DATABASE_URL is missing, without echoing values', () => {
    expect(() => loadConfig({})).toThrow(ConfigError);
    expect(() => loadConfig({ DATABASE_URL: '  ' })).toThrow(/DATABASE_URL/);
  });

  it.each([
    ['PORT', 'abc'],
    ['PORT', '0'],
    ['DATABASE_POOL_MAX', '-1'],
    ['DATABASE_SSL', 'yes'],
  ])('rejects invalid %s=%s', (key, value) => {
    expect(() => loadConfig({ DATABASE_URL, [key]: value })).toThrow(ConfigError);
  });

  it.each([
    'not a url',
    'postgres://user:secret@db.internal:abc/accounts',
    'mysql://user:secret@db.internal:3306/accounts',
  ])('rejects malformed DATABASE_URL %s without echoing it', (value) => {
    expect(() => loadConfig({ DATABASE_URL: value })).toThrow(ConfigError);
    try {
      loadConfig({ DATABASE_URL: value });
    } catch (err) {
      expect((err as Error).message).not.toContain('secret');
    }
  });

  it.each([
    'postgresql://user:secret@db.internal:5432/accounts',
    'postgres://user:secret@/accounts?host=/var/run/postgresql',
    'socket:/var/run/postgresql?db=accounts',
  ])('accepts valid DATABASE_URL %s', (url) => {
    expect(loadConfig({ DATABASE_URL: url }).database.connectionString).toBe(url);
  });

  it('never includes the connection string in error messages', () => {
    try {
      loadConfig({ DATABASE_URL, PORT: 'bad' });
    } catch (err) {
      expect((err as Error).message).not.toContain('secret');
    }
  });
});
