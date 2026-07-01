'use strict';

const IUserRepository = require('../../../domain/ports/IUserRepository');
const User = require('../../../domain/entities/User');
const { pool } = require('./db');

/**
 * PostgreSQL implementation of IUserRepository.
 */
class PostgresUserRepository extends IUserRepository {
  /**
   * @param {import('../../../domain/entities/User')} user
   * @returns {Promise<import('../../../domain/entities/User')>}
   */
  async create(user) {
    const { rows } = await pool.query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, is_verified, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.firstName,
        user.lastName,
        user.isVerified,
        user.isActive,
        user.createdAt,
        user.updatedAt,
      ]
    );
    return this._toEntity(rows[0]);
  }

  /**
   * @param {string} id
   * @returns {Promise<import('../../../domain/entities/User')|null>}
   */
  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ? this._toEntity(rows[0]) : null;
  }

  /**
   * @param {string} email
   * @returns {Promise<import('../../../domain/entities/User')|null>}
   */
  async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] ? this._toEntity(rows[0]) : null;
  }

  /**
   * @param {string} id
   * @param {Partial<import('../../../domain/entities/User')>} updates
   * @returns {Promise<import('../../../domain/entities/User')>}
   */
  async update(id, updates) {
    const fields = [];
    const values = [];
    let idx = 1;

    const columnMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      isVerified: 'is_verified',
      isActive: 'is_active',
      passwordHash: 'password_hash',
    };

    for (const [key, col] of Object.entries(columnMap)) {
      if (key in updates) {
        fields.push(`${col} = $${idx++}`);
        values.push(updates[key]);
      }
    }

    fields.push(`updated_at = $${idx++}`);
    values.push(new Date());
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return this._toEntity(rows[0]);
  }

  /**
   * Soft-delete by setting is_active = false.
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await pool.query(
      'UPDATE users SET is_active = false, updated_at = $1 WHERE id = $2',
      [new Date(), id]
    );
  }

  /**
   * @private
   */
  _toEntity(row) {
    return new User({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      isVerified: row.is_verified,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

module.exports = PostgresUserRepository;

  /**
   * @private
   * @param {Object} row
   * @returns {import('../../../domain/entities/User')}
   */
  _toEntity(row) {
    return new User({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      isVerified: row.is_verified,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

module.exports = PostgresUserRepository;
