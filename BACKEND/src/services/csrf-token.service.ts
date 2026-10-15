/**
 * csrf-token.service.ts
 *
 * Stateless, session-bound CSRF tokens for US-004 profile updates:
 * token = base64url(HMAC-SHA256(secret, rawSessionToken)). The token is
 * handed out by GET /api/user/profile and must be echoed back in the
 * `X-CSRF-Token` header on PUT /api/user/profile. A token issued for one
 * session is never valid for another.
 */

import crypto from 'crypto';

export interface CsrfTokenService {
  issue(sessionToken: string): string;
  verify(sessionToken: string, candidate: string | undefined): boolean;
}

export class HmacCsrfTokenService implements CsrfTokenService {
  constructor(private readonly secret: string) {}

  issue(sessionToken: string): string {
    return crypto.createHmac('sha256', this.secret).update(sessionToken).digest('base64url');
  }

  verify(sessionToken: string, candidate: string | undefined): boolean {
    if (!candidate) {
      return false;
    }
    const expected = Buffer.from(this.issue(sessionToken));
    const actual = Buffer.from(candidate);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }
}
