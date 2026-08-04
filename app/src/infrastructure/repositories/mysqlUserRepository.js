'use strict';

const { createUser } = require('../../../domain/entities/user');
const { getPool } = require('../../database/mysqlPool');

/**
 * MySQL implementation of the UserRepository port.
 *
 * @implements {import('../../../domain/ports/userRepository').UserRepository}
 */
class MysqlUserRepository {
  constructor() {
    this._pool = getPool();
  }

  /**
   * Maps a raw DB row to a domain User entity.
   *
   * @param {Object} row
   * @returns {import('../../../domain/entities/user').User}
   */
  _toEntity(row) {
    return createUser({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      isVerified: Boolean(row.is_verified),
      verificationToken: row.verification_token || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  /**
   * @param {string} id
   * @returns {Promise<import('../../../domain/entities/user').User|null>}
   */
  async findById(id) {
    const [rows] = await this._pool.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows.length ? this._toEntity(rows[0]) : null;
  }

  /**
   * @param {string} email
   * @returns {Promise<import('../../../domain/entities/user').User|null>}
   */
  async findByEmail(email) {
    const [rows] = await this._pool.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );
    return rows.length ? this._toEntity(rows[0]) : null;
  }

  /**
   * @param {string} token
   * @returns {Promise<import('../../../domain/entities/user').User|null>}
   */
  async findByVerificationToken(token) {
    const [rows] = await this._pool.execute(
      'SELECT * FROM users WHERE verification_token = ? LIMIT 1',
      [token]
    );
    return rows.length ? this._toEntity(rows[0]) : null;
  }

  /**
   * @param {import('../../../domain/entities/user').User} user
   * @returns {Promise<import('../../../domain/entities/user').User>}
   */
  async save(user) {
    await this._pool.execute(
      `INSERT INTO users
         (id, email, password_hash, first_name, last_name, is_verified, verification_token, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.firstName,
        user.lastName,
        user.isVerified ? 1 : 0,
        user.verificationToken,
        user.createdAt,
        user.updatedAt,
      ]
    );
    return user;
  }

  /**
   * @param {import('../../../domain/entities/user').User} user
   * @returns {Promise<import('../../../domain/entities/user').User>}
   */
  async update(user) {
    await this._pool.execute(
      `UPDATE users
          SET email              = ?,
              password_hash      = ?,
              first_name         = ?,
              last_name          = ?,
              is_verified        = ?,
              verification_token = ?,
              updated_at         = ?
        WHERE id = ?`,
      [
        user.email,
        user.passwordHash,
        user.firstName,
        user.lastName,
        user.isVerified ? 1 : 0,
        user.verificationToken,
        user.updatedAt,
        user.id,
      ]
    );
    return user;
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteById(id) {
    await this._pool.execute('DELETE FROM users WHERE id = ?', [id]);
  }
}

module.exports = { MysqlUserRepository };
