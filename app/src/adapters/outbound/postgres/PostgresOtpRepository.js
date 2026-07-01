'use strict';

const IOtpRepository = require('../../../domain/ports/IOtpRepository');
const Otp = require('../../../domain/entities/Otp');
const { pool } = require('./db');

/**
 * PostgreSQL implementation of IOtpRepository.
 */
class PostgresOtpRepository extends IOtpRepository {
  /**
   * @param {import('../../../domain/entities/Otp')} otp
   * @returns {Promise<import('../../../domain/entities/Otp')>}
   */
  async create(otp) {
    const { rows } = await pool.query(
      `INSERT INTO otps (id, user_id, code, expires_at, used, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [otp.id, otp.userId, otp.code, otp.expiresAt, otp.used, otp.createdAt]
    );
    return this._toEntity(rows[0]);
  }

  /**
   * @param {string} userId
   * @param {string} code
   * @returns {Promise<import('../../../domain/entities/Otp')|null>}
   */
  async findByUserIdAndCode(userId, code) {
    const { rows } = await pool.query(
      'SELECT * FROM otps WHERE user_id = $1 AND code = $2 ORDER BY created_at DESC LIMIT 1',
      [userId, code]
    );
    return rows[0] ? this._toEntity(rows[0]) : null;
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async markUsed(id) {
    await pool.query('UPDATE otps SET used = true WHERE id = $1', [id]);
  }

  /**
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async deleteByUserId(userId) {
    await pool.query('DELETE FROM otps WHERE user_id = $1', [userId]);
  }

  /**
   * @private
   */
  _toEntity(row) {
    return new Otp({
      id: row.id,
      userId: row.user_id,
      code: row.code,
      expiresAt: row.expires_at,
      used: row.used,
      createdAt: row.created_at,
    });
  }
}

module.exports = PostgresOtpRepository;
