'use strict';

/**
 * UserRepository port — defines the interface that any persistence adapter must implement.
 *
 * Concrete implementations live in src/adapters/outbound/mysql/mysqlUserRepository.js
 *
 * @interface UserRepository
 */

/**
 * @typedef {Object} UserRepository
 *
 * @property {function(string): Promise<import('../entities/user').User|null>} findById
 *   Find a user by their UUID.
 *
 * @property {function(string): Promise<import('../entities/user').User|null>} findByEmail
 *   Find a user by email address (case-insensitive).
 *
 * @property {function(string): Promise<import('../entities/user').User|null>} findByVerificationToken
 *   Find a user by their email-verification token.
 *
 * @property {function(import('../entities/user').User): Promise<import('../entities/user').User>} save
 *   Persist a new user and return the saved entity.
 *
 * @property {function(import('../entities/user').User): Promise<import('../entities/user').User>} update
 *   Update an existing user and return the updated entity.
 *
 * @property {function(string): Promise<void>} deleteById
 *   Hard-delete a user by UUID.
 */

// This file documents the port contract; no runtime code is needed.
module.exports = {};
