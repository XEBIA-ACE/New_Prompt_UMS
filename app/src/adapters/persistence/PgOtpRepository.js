'use strict';

const OtpRepository = require('../../domain/ports/OtpRepository');
const Otp = require('../../domain/entities/Otp');
const db = require('../../infrastructure/db/pool');

/**
 * PostgreSQL implementation of OtpRepository.
 */
class PgOtpRepository extends OtpRepository {
  /**
   * @param {import('../../domain/entities/Otp')} otp
   * @returns {Promise<import('../../domain/entities/Otp')>}
   */
  async create(otp) {
    const { rows } = await db.query(
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
   * @returns {Promise<import('../../domain/entities/Otp')|null>}
   */
  async findValidByUserAndCode(userId, code) {
    const { rows } = await db.query(
      `SELECT * FROM otps
       WHERE user_id = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [userId, code]
    );
    return rows.length ? this._toEntity(rows[0]) : null;
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async markUsed(id) {
    await db.query(`UPDATE otps SET used = TRUE WHERE id = $1`, [id]);
  }

  /**
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async deleteByUserId(userId) {
    await db.query(`DELETE FROM otps WHERE user_id = $1`, [userId]);
  }

  /** @private */
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

module.exports = PgOtpRepository;
