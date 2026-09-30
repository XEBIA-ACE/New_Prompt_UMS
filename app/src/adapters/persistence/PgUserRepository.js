'use strict';

const UserRepository = require('../../domain/ports/UserRepository');
const User = require('../../domain/entities/User');
const db = require('../../infrastructure/db/pool');

/**
 * PostgreSQL implementation of UserRepository.
 */
class PgUserRepository extends UserRepository {
  /**
   * @param {import('../../domain/entities/User')} user
   * @returns {Promise<import('../../domain/entities/User')>}
   */
  async create(user) {
    const { rows } = await db.query(
      `INSERT INTO users (id, email, password_hash, is_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user.id, user.email, user.passwordHash, user.isVerified, user.createdAt, user.updatedAt]
    );
    return this._toEntity(rows[0]);
  }

  /**
   * @param {string} email
   * @returns {Promise<import('../../domain/entities/User')|null>}
   */
  async findByEmail(email) {
    const { rows } = await db.query(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [email.toLowerCase().trim()]
    );
    return rows.length ? this._toEntity(rows[0]) : null;
  }

  /**
   * @param {string} id
   * @returns {Promise<import('../../domain/entities/User')|null>}
   */
  async findById(id) {
    const { rows } = await db.query(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return rows.length ? this._toEntity(rows[0]) : null;
  }

  /**
   * @param {string} id
   * @returns {Promise<import('../../domain/entities/User')>}
   */
  async markVerified(id) {
    const { rows } = await db.query(
      `UPDATE users SET is_verified = TRUE, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return this._toEntity(rows[0]);
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async softDelete(id) {
    await db.query(
      `UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  /** @private */
  _toEntity(row) {
    return new User({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      isVerified: row.is_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at || null,
    });
  }
}

module.exports = PgUserRepository;
