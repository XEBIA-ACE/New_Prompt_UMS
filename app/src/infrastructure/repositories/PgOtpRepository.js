'use strict';

const { IOtpRepository } = require('../../domain/ports/IOtpRepository');
const { Otp } = require('../../domain/entities/Otp');
const { getPool } = require('../database/connection');

/**
 * PostgreSQL adapter for IOtpRepository.
 */
class PgOtpRepository extends IOtpRepository {
  /**
   * @param {import('pg').Pool} [pool]
   */
  constructor(pool) {
    super();
    this.pool = pool || getPool();
  }

  /**
   * @param {Otp} otp
   * @returns {Promise<Otp>}
   */
  async save(otp) {
    const sql = `
      INSERT INTO otps (id, user_id, code, purpose, expires_at, used, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [otp.id, otp.userId, otp.code, otp.purpose, otp.expiresAt, otp.used, otp.createdAt];
    const { rows } = await this.pool.query(sql, values);
    return this._toEntity(rows[0]);
  }

  /**
   * @param {string} userId
   * @param {string} purpose
   * @returns {Promise<Otp|null>}
   */
  async findLatest(userId, purpose) {
    const sql = `
      SELECT * FROM otps
      WHERE user_id = $1 AND purpose = $2 AND used = FALSE
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const { rows } = await this.pool.query(sql, [userId, purpose]);
    return rows[0] ? this._toEntity(rows[0]) : null;
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async markUsed(id) {
    await this.pool.query('UPDATE otps SET used = TRUE WHERE id = $1', [id]);
  }

  /**
   * Map a raw DB row to an Otp entity.
   * @param {Object} row
   * @returns {Otp}
   */
  _toEntity(row) {
    return new Otp({
      id: row.id,
      userId: row.user_id,
      code: row.code,
      purpose: row.purpose,
      expiresAt: row.expires_at,
      used: row.used,
      createdAt: row.created_at,
    });
  }
}

module.exports = { PgOtpRepository };
