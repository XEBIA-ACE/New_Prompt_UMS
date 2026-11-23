export interface DatabaseConfig {
  /** Never log or expose this value: it may contain credentials. */
  connectionString: string;
  ssl: boolean;
  poolMax: number;
  connectionTimeoutMs: number;
}

export interface ServiceConfig {
  port: number;
  nodeEnv: string;
  database: DatabaseConfig;
}

type Env = Record<string, string | undefined>;

export class ConfigError extends Error {
  constructor(message: string) {
    super(`Configuration error: ${message}`);
    this.name = 'ConfigError';
  }
}

function readString(env: Env, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function requireString(env: Env, key: string): string {
  const value = readString(env, key);
  if (value === undefined) {
    throw new ConfigError(`required environment variable '${key}' is absent or empty.`);
  }
  return value;
}

function readPositiveInt(env: Env, key: string, defaultValue: number): number {
  const raw = readString(env, key);
  if (raw === undefined) {
    return defaultValue;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ConfigError(`'${key}' must be a positive integer, got '${raw}'.`);
  }
  return parsed;
}

function readBoolean(env: Env, key: string, defaultValue: boolean): boolean {
  const raw = readString(env, key)?.toLowerCase();
  if (raw === undefined) {
    return defaultValue;
  }
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  throw new ConfigError(`'${key}' must be 'true' or 'false', got '${raw}'.`);
}

export function loadConfig(env: Env = process.env): ServiceConfig {
  return {
    port: readPositiveInt(env, 'PORT', 3000),
    nodeEnv: readString(env, 'NODE_ENV') ?? 'development',
    database: {
      connectionString: requireString(env, 'DATABASE_URL'),
      ssl: readBoolean(env, 'DATABASE_SSL', false),
      poolMax: readPositiveInt(env, 'DATABASE_POOL_MAX', 10),
      connectionTimeoutMs: readPositiveInt(env, 'DATABASE_CONNECTION_TIMEOUT_MS', 5000),
    },
  };
}
