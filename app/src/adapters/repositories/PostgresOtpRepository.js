'use strict';

const IOtpRepository = require('../../../domain/ports/IOtpRepository');
const Otp = require('../../../domain/entities/Otp');
const { getPool } = require('../../infrastructure/database/postgres');

/**
 * PostgresOtpRepository — concrete implementation of IOtpRepository.
 */
class PostgresOtpRepository extends IOtpRepository {
  /**
   * @param {import('../../database/postgres').Pool} [pool]
   */
  constructor(pool) {
    super();
    this.pool = pool || getPool();
  }

  /** @param {Otp} otp @returns {Promise<Otp>} */
  async save(otp) {
    const sql = `
      INSERT INTO otps (id, user_id, code, type, expires_at, used, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [otp.id, otp.userId, otp.code, otp.type, otp.expiresAt, otp.used, otp.createdAt];
    const { rows } = await this.pool.query(sql, values);
    return this._toEntity(rows[0]);
  }

  /** @param {string} userId @param {string} code @param {string} type @returns {Promise<Otp|null>} */
  async findByUserAndCode(userId, code, type) {
    const sql = 'SELECT * FROM otps WHERE user_id=$1 AND code=$2 AND type=$3 ORDER BY created_at DESC LIMIT 1';
    const { rows } = await this.pool.query(sql, [userId, code, type]);
    return rows[0] ? this._toEntity(rows[0]) : null;
  }

  /** @param {Otp} otp @returns {Promise<Otp>} */
  async update(otp) {
    const sql = 'UPDATE otps SET used=$2 WHERE id=$1 RETURNING *';
    const { rows } = await this.pool.query(sql, [otp.id, otp.used]);
    return this._toEntity(rows[0]);
  }

  /** @param {string} userId @returns {Promise<void>} */
  async deleteByUserId(userId) {
    await this.pool.query('DELETE FROM otps WHERE user_id=$1', [userId]);
  }

  /**
   * @param {Object} row
   * @returns {Otp}
   */
  _toEntity(row) {
    return new Otp({
      id: row.id,
      userId: row.user_id,
      code: row.code,
      type: row.type,
      expiresAt: row.expires_at,
      used: row.used,
      createdAt: row.created_at,
    });
  }
}

module.exports = PostgresOtpRepository;
