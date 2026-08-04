'use strict';

/**
 * LogoutUser use-case.
 *
 * In a stateless JWT setup, logout is handled client-side by discarding tokens.
 * For a stateful approach, a token blacklist / refresh-token revocation table
 * would be maintained here.
 *
 * TODO: implement refresh-token revocation when a token store is added.
 *
 * @returns {function(): Promise<void>}
 */
function makeLogoutUser() {
  /**
   * @returns {Promise<void>}
   */
  return async function logoutUser() {
    // Stateless JWT: no server-side action required.
    // Extend here to revoke refresh tokens from a DB/Redis store.
  };
}

module.exports = { makeLogoutUser };
