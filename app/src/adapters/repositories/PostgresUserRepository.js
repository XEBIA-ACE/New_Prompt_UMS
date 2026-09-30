'use strict';

const IUserRepository = require('../../../domain/ports/IUserRepository');
const User = require('../../../domain/entities/User');
const { getPool } = require('../../infrastructure/database/postgres');

/**
 * PostgresUserRepository — concrete implementation of IUserRepository.
 */
class PostgresUserRepository extends IUserRepository {
  /**
   * @param {import('../../database/postgres').Pool} [pool]
   */
  constructor(pool) {
    super();
    this.pool = pool || getPool();
  }

  /** @param {User} user @returns {Promise<User>} */
  async save(user) {
    const sql = `
      INSERT INTO users (id, email, password_hash, first_name, last_name, is_verified, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      user.id, user.email, user.passwordHash,
      user.firstName, user.lastName,
      user.isVerified, user.isActive,
      user.createdAt, user.updatedAt,
    ];
    const { rows } = await this.pool.query(sql, values);
    return this._toEntity(rows[0]);
  }

  /** @param {string} id @returns {Promise<User|null>} */
  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ? this._toEntity(rows[0]) : null;
  }

  /** @param {string} email @returns {Promise<User|null>} */
  async findByEmail(email) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] ? this._toEntity(rows[0]) : null;
  }

  /** @param {User} user @returns {Promise<User>} */
  async update(user) {
    const sql = `
      UPDATE users
      SET email=$2, password_hash=$3, first_name=$4, last_name=$5,
          is_verified=$6, is_active=$7, updated_at=$8
      WHERE id=$1
      RETURNING *
    `;
    const values = [
      user.id, user.email, user.passwordHash,
      user.firstName, user.lastName,
      user.isVerified, user.isActive, user.updatedAt,
    ];
    const { rows } = await this.pool.query(sql, values);
    return this._toEntity(rows[0]);
  }

  /** @param {string} id @returns {Promise<void>} */
  async delete(id) {
    await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
  }

  /**
   * Map a DB row to a User entity.
   * @param {Object} row
   * @returns {User}
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
