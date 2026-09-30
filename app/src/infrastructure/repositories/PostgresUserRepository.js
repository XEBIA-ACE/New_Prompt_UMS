'use strict';

const UserRepository = require('../../domain/ports/UserRepository');
const User = require('../../domain/entities/User');
const { getPool } = require('../database/connection');

/**
 * PostgreSQL adapter for the UserRepository port.
 */
class PostgresUserRepository extends UserRepository {
  /**
   * @param {import('../database/connection').Pool} [pool]
   */
  constructor(pool) {
    super();
    this.pool = pool || getPool();
  }

  /**
   * @param {import('../../domain/entities/User')} user
   * @returns {Promise<import('../../domain/entities/User')>}
   */
  async create(user) {
    const { rows } = await this.pool.query(
      `INSERT INTO users
         (id, email, password_hash, first_name, last_name, is_verified, otp_code, otp_expires_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.firstName,
        user.lastName,
        user.isVerified,
        user.otpCode,
        user.otpExpiresAt,
        user.createdAt,
        user.updatedAt,
      ]
    );
    return this._toEntity(rows[0]);
  }

  /**
   * @param {string} id
   * @returns {Promise<import('../../domain/entities/User')|null>}
   */
  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows.length ? this._toEntity(rows[0]) : null;
  }

  /**
   * @param {string} email
   * @returns {Promise<import('../../domain/entities/User')|null>}
   */
  async findByEmail(email) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows.length ? this._toEntity(rows[0]) : null;
  }

  /**
   * @param {import('../../domain/entities/User')} user
   * @returns {Promise<import('../../domain/entities/User')>}
   */
  async update(user) {
    const { rows } = await this.pool.query(
      `UPDATE users
       SET email=$2, password_hash=$3, first_name=$4, last_name=$5,
           is_verified=$6, otp_code=$7, otp_expires_at=$8, updated_at=$9
       WHERE id=$1
       RETURNING *`,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.firstName,
        user.lastName,
        user.isVerified,
        user.otpCode,
        user.otpExpiresAt,
        new Date(),
      ]
    );
    return this._toEntity(rows[0]);
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
  }

  /**
   * Map a raw DB row to a User entity.
   * @param {Object} row
   * @returns {import('../../domain/entities/User')}
   */
  _toEntity(row) {
    return new User({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      isVerified: row.is_verified,
      otpCode: row.otp_code,
      otpExpiresAt: row.otp_expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

module.exports = PostgresUserRepository;
