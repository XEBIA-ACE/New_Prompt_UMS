'use strict';

const { getPool } = require('./connection');
const logger = require('../logger');

const MIGRATIONS = [
  {
    name: '001_create_users_table',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id            UUID PRIMARY KEY,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name    VARCHAR(100) NOT NULL,
        last_name     VARCHAR(100) NOT NULL,
        is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
        otp_code      VARCHAR(10),
        otp_expires_at TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '002_create_migrations_table',
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
];

async function migrate() {
  const pool = getPool();

  // Ensure migrations tracking table exists first
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  for (const migration of MIGRATIONS) {
    const { rows } = await pool.query(
      'SELECT name FROM schema_migrations WHERE name = $1',
      [migration.name]
    );

    if (rows.length === 0) {
      await pool.query(migration.sql);
      await pool.query(
        'INSERT INTO schema_migrations (name) VALUES ($1)',
        [migration.name]
      );
      logger.info(`Applied migration: ${migration.name}`);
    } else {
      logger.info(`Skipping migration (already applied): ${migration.name}`);
    }
  }
}

// Allow running directly: node src/infrastructure/database/migrate.js
if (require.main === module) {
  const { connectDatabase, closeDatabase } = require('./connection');
  connectDatabase()
    .then(migrate)
    .then(() => {
      logger.info('All migrations applied');
      return closeDatabase();
    })
    .catch((err) => {
      logger.error('Migration failed', { error: err.message });
      process.exit(1);
    });
}

module.exports = { migrate };
