# Codebase Concerns

**Analysis Date:** 2026-07-10

## Tech Debt

**Frontend Session Storage Security:**
- Issue: Authentication tokens stored in `localStorage` without XSS protection mechanisms
- Files: `FRONTEND/src/app/lib/session.ts`
- Impact: Tokens are vulnerable to XSS attacks and are persistent across browser restarts without secure HttpOnly flag consideration
- Fix approach: Consider migrating to secure session storage patterns (e.g., in-memory with server-side session management, or HttpOnly cookies for API-driven auth)

**CORS Configuration Too Permissive by Default:**
- Issue: CORS defaults to `true` (allow all origins) when `FRONTEND_ORIGIN` is not set
- Files: `BACKEND/src/app.ts:178`
- Impact: In development environments, any origin can access the API, allowing CSRF attacks if cookies were used; while Bearer token auth mitigates this, the permissive default is a security anti-pattern
- Fix approach: Require explicit `FRONTEND_ORIGIN` configuration; fail startup if unset in production

**Redis Disconnection Not Handled Gracefully:**
- Issue: No reconnection logic or error recovery for Redis connection failures in rate limiting
- Files: `BACKEND/src/services/rate-limit.guard.ts`, `BACKEND/src/server.ts:19`
- Impact: A Redis connection drop silently fails `allow()` call, potentially allowing unlimited OTP attempts until a restart
- Fix approach: Add retry logic to `RedisRateLimitGuard`, implement circuit breaker pattern, or fall back to in-memory rate limiting during Redis outages

**Outbox Worker Unhandled Promise Rejections:**
- Issue: Worker polling uses `void this.processQueuedRecords()` which silently swallows unhandled rejections
- Files: `BACKEND/src/workers/outbox.worker.ts:49`, `BACKEND/src/workers/account-deletion-notification.worker.ts:51`
- Impact: If email delivery fails with an unhandled error, no observability; polling continues but errors are invisible
- Fix approach: Wrap polling in try/catch; log all exceptions; consider per-record error budgets

**Environment Variable Validation Incomplete:**
- Issue: Some optional env vars (e.g., `FROM_NAME`, `OTP_HASH_ALGORITHM`) lack validation; `REDIS_URL` defaults to localhost without warning
- Files: `BACKEND/src/config/app.config.ts`, `BACKEND/src/config/otp.config.ts:75`
- Impact: Silent misconfigurations in production (e.g., incorrect hash algorithm, development Redis endpoint in prod)
- Fix approach: Validate all env vars at startup; require explicit values for production; log all config at server start

## Known Bugs

**Race Condition in Password Recovery Token Reset:**
- Symptoms: If two concurrent password reset requests are made with the same token, both may succeed (timing window between lookup and expiry check)
- Files: `BACKEND/src/services/password-recovery.service.ts:101-111`, `BACKEND/src/db/with-transaction.ts`
- Trigger: Fast consecutive POST requests to `/api/v1/auth/password-reset` with the same token
- Workaround: Use transaction isolation level to prevent concurrent reads of the same token record

**Frontend useCurrentUser Hook Doesn't Handle 401 Errors:**
- Symptoms: When session expires mid-request, `getCurrentUser()` returns an error but `useCurrentUser` doesn't redirect to login or clear session
- Files: `FRONTEND/src/app/lib/useCurrentUser.ts:19-22`
- Trigger: Session expires after page load but before profile fetch completes
- Workaround: Manually check session expiry in calling component or implement global 401 error handler

## Security Considerations

**Authentication Token in URL Query String (Password Recovery & Activation):**
- Risk: Token values appear in password recovery links sent via email as `?token={token}`. Browser history, email forwarding, and logs may expose tokens
- Files: `BACKEND/src/services/password-recovery.service.ts:87`, `BACKEND/src/workers/outbox.worker.ts:86`
- Current mitigation: Tokens are time-limited (24-hour default) and single-use; sent only via email to registered address
- Recommendations: Consider POST-based token redemption instead of URL params; implement token binding to IP/user agent; add token rotation after single use

**Email Addresses Not Validated Against Allowlist:**
- Risk: Any email address can register; no domain whitelist enforcement for organizational deployments
- Files: `BACKEND/src/controllers/registration.controller.ts`
- Current mitigation: OTP verification confirms email ownership; account activation required
- Recommendations: Add optional `ALLOWED_EMAIL_DOMAINS` config; validate during registration

**Admin Bearer Token in Environment Variable:**
- Risk: `ADMIN_BEARER_TOKEN` stored in plaintext env var, visible in logs or process listings
- Files: `BACKEND/src/config/app.config.ts:84`, `BACKEND/src/middleware/admin-auth.middleware.ts`
- Current mitigation: Config warns "never log" but no code prevents log leakage
- Recommendations: Use a dedicated secrets manager (Vault/Secrets Manager); never log token values; implement token rotation

**Missing Rate Limiting on Password Reset Attempts:**
- Risk: No rate limiting on `/api/v1/auth/password-reset` endpoint; attacker can brute-force valid tokens
- Files: `BACKEND/src/routes/password.routes.ts`
- Current mitigation: Tokens expire after 1 hour and are single-use
- Recommendations: Add per-user rate limiting (e.g., 5 attempts per 5 minutes); lock account after N failed attempts

## Performance Bottlenecks

**Outbox Worker Linear Processing:**
- Problem: Worker processes all queued emails sequentially in a single loop; one slow email blocks all others
- Files: `BACKEND/src/workers/outbox.worker.ts:70-106`
- Cause: No parallel email dispatch; no concurrency limit
- Improvement path: Implement batch processing with configurable concurrency (e.g., Promise.all with semaphore); add per-record timeout

**Database Query N+1 in Outbox Worker:**
- Problem: For each email record, worker queries token and user separately (3 queries per record)
- Files: `BACKEND/src/workers/outbox.worker.ts:73-74`
- Cause: Repository methods fetch one record at a time; no join/batch optimization
- Improvement path: Batch fetch all tokens and users upfront; pre-join in repository method

**Redis EXPIRE Race Condition:**
- Problem: `incr` followed by `expire` is not atomic; if expire fails, TTL is never set
- Files: `BACKEND/src/services/rate-limit.guard.ts:46-50`
- Cause: ioredis doesn't use Lua scripting for atomic multi-step operations
- Improvement path: Use `SET key 1 EX windowSeconds NX` with fallback INCR, or Lua script for atomicity

**No Connection Pooling on better-sqlite3:**
- Problem: Single shared SQLite connection; under high concurrency, writes serialize
- Files: `BACKEND/src/db/connection.ts`, `BACKEND/src/server.ts:16`
- Cause: SQLite WAL mode helps but is not a full solution; no prepared statement caching
- Improvement path: Implement statement caching; consider WAL mode tuning; benchmark under load

## Fragile Areas

**Account Deletion Transaction Complexity:**
- Files: `BACKEND/src/services/account-deletion.service.ts`
- Why fragile: Atomic transaction updates users, deletion_requests, sessions, and notification_records; any partial failure leaves inconsistent state despite transaction wrapping
- Safe modification: Add pre-transaction checks (user exists, request is pending); wrap all repo calls in transaction; test rollback scenarios with property-based tests
- Test coverage: Integration tests cover happy path but not concurrent deletion requests or Redis/DB connectivity loss during transaction

**Session Validation Middleware Global Scope:**
- Files: `BACKEND/src/middleware/session-validation.middleware.ts`
- Why fragile: Attaches `userId` to Request object; typos in attached property names break downstream code silently
- Safe modification: Use strict TypeScript interfaces; consider wrapper class instead of property mutation
- Test coverage: Only unit-tested in isolation; no integration tests verify middleware integration with all route handlers

**Password Policy Evaluator Shared Across Features:**
- Files: `BACKEND/src/validators/password-policy.evaluator.ts` (referenced by F-01, F-03, F-04)
- Why fragile: Changes to password rules affect registration, password reset, and account management; no feature isolation
- Safe modification: Add feature-specific overrides; document all features using this validator; add integration tests across all consuming routes
- Test coverage: Property-based tests exist but don't verify consistency across all consumer flows

**Email Delivery Adapter Error Handling:**
- Files: `BACKEND/src/adapters/sendgrid-email.adapter.ts`, `BACKEND/src/adapters/email-otp-delivery.adapter.ts`
- Why fragile: SendGrid API failures are caught and logged but don't bubble up; callers may assume success on network timeouts
- Safe modification: Distinguish between transient (retry) and permanent (fail) errors; return structured result objects consistently
- Test coverage: No integration tests with real SendGrid API; mocks may not reflect actual error scenarios

## Scaling Limits

**SQLite Single-Writer Limitation:**
- Current capacity: ~100 concurrent users with sequential writes; WAL mode mitigates but doesn't eliminate contention
- Limit: Write throughput maxes out under ~50 simultaneous registration/login requests
- Scaling path: Migrate to PostgreSQL; implement read replicas; add connection pooling

**Redis Single-Node Rate Limiting:**
- Current capacity: ~1000 OTP requests/second on a single Redis instance
- Limit: No cluster/sentinel setup; single point of failure for rate limiting
- Scaling path: Implement Redis Cluster or Sentinel; use client-side rate limiting fallback; consider distributed rate limiting library

**Email Dispatch Queue No Batching:**
- Current capacity: Outbox worker processes ~10 emails/second; polling every 30s means max 300 emails/minute
- Limit: Spike in registration will queue emails; no SLA enforcement
- Scaling path: Increase polling frequency; implement batch dispatch; use message queue (RabbitMQ/SQS) instead of database polling

**In-Memory Session Store (default):**
- Current capacity: Sessions stored only in SQLite; no distributed caching
- Limit: Multi-server deployment requires shared session store
- Scaling path: Implement Redis session storage; add session replication

## Dependencies at Risk

**yamljs (0.3.0) - Unmaintained:**
- Risk: No updates since 2016; potential security vulnerabilities in YAML parsing
- Impact: Swagger UI generation could be compromised if YAML is user-controlled
- Migration plan: Use safer YAML parser (e.g., js-yaml) or generate Swagger JSON directly from code (e.g., OpenAPI decorators)

**bcrypt (5.1.1) - Pinned Version:**
- Risk: Pinned to exact version; no automatic updates for security patches
- Impact: If vulnerability found in bcrypt, requires manual update
- Migration plan: Use semver range (^5.1.1); implement automated dependency scanning (Dependabot)

**Express (4.19.2) - Minor Security Issues:**
- Risk: Several low-severity advisories; routing edge cases in older versions
- Impact: Unlikely to affect this service but should monitor
- Migration plan: Use Express 5.x when stable; enable security update notifications

**better-sqlite3 (^11.3.0) - Platform-Specific Binding:**
- Risk: Native module requires build tools on deployment; version mismatches can cause runtime failures
- Impact: Docker builds fail if Node version doesn't match build environment
- Migration plan: Use multi-stage Docker build with build tools; pin Node version; test in CI

## Missing Critical Features

**No Audit Logging:**
- Problem: Security events (login failures, password resets, deletions) not logged to immutable audit trail
- Blocks: Compliance with SOC 2 / regulatory requirements
- Current state: Events logged to stdout via console.error; no centralized logging

**No Rate Limiting on Login Attempts:**
- Problem: No brute-force protection; attackers can enumerate valid emails via timing attacks
- Blocks: Protection against credential stuffing
- Current state: Account lockout exists but rate limit applies only at HTTP layer (none configured)

**No Session Expiration Refresh:**
- Problem: Sessions expire after fixed duration; no refresh token mechanism to extend sessions
- Blocks: Long-lived user sessions without re-authentication
- Current state: Sessions expire hardcoded in SessionService; no refresh endpoint

**No Multi-Factor Authentication:**
- Problem: Single factor (password/email) for authentication
- Blocks: High-security deployments
- Current state: OTP implemented for registration/deletion confirmation but not for login

## Test Coverage Gaps

**API Error Response Handling:**
- What's not tested: Edge cases where API returns 5xx errors or network timeouts
- Files: `FRONTEND/src/app/lib/api-client.ts`
- Risk: Frontend gracefully ignores network errors; no retry logic
- Priority: Medium

**Session Expiration During Active Use:**
- What's not tested: Session expires while user is on authenticated page (profile, deletion)
- Files: `FRONTEND/src/app/lib/useCurrentUser.ts`, `BACKEND/src/middleware/session-validation.middleware.ts`
- Risk: Stale session tokens cause silent 401 responses; no user redirect
- Priority: High

**Redis Connection Loss During Rate Limiting:**
- What's not tested: `RedisRateLimitGuard.allow()` when Redis is unreachable
- Files: `BACKEND/src/services/rate-limit.guard.ts`
- Risk: Rate limiting silently fails; OTP dispatch becomes unlimited
- Priority: High

**Concurrent Password Reset Requests:**
- What's not tested: Two requests with same token complete simultaneously
- Files: `BACKEND/src/services/password-recovery.service.ts`
- Risk: Second request succeeds despite token already consumed
- Priority: High

**Email Delivery Retry Exhaustion:**
- What's not tested: Behavior after outbox worker marks email as permanently failed
- Files: `BACKEND/src/workers/outbox.worker.ts`
- Risk: Failed emails are silently dropped; no notification or manual recovery path
- Priority: Medium

**Admin Endpoint Authentication:**
- What's not tested: Admin endpoints with missing or invalid bearer token
- Files: `BACKEND/src/middleware/admin-auth.middleware.ts`, `BACKEND/src/routes/admin.routes.ts`
- Risk: No integration tests verify admin auth is enforced on all routes
- Priority: Medium

---

*Concerns audit: 2026-07-10*
