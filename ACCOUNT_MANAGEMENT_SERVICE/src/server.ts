import 'dotenv/config';
import { loadConfig } from './config/env';
import { createPool, isDatabaseReachable } from './db/postgres';
import { createApp } from './app';

const config = loadConfig();
const pool = createPool(config.database);
const app = createApp({ checkDatabase: () => isDatabaseReachable(pool) });

const server = app.listen(config.port, () => {
  console.log(`Account Management Service listening on port ${config.port}`);
});

function shutdown(): void {
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
