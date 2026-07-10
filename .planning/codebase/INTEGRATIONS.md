# External Integrations

**Analysis Date:** 2026-07-10

## APIs & External Services

**Email Delivery:**
- SendGrid - Transactional email service for account activation, OTP delivery, password recovery, account deletion
  - SDK/Client: `@sendgrid/mail` 8.1.3
  - Auth: `SENDGRID_API_KEY` (environment variable, never logged)
  - Implementation: `src/adapters/sendgrid-email.adapter.ts` implements `EmailDeliveryPort` interface
  - Configuration: API key loaded at adapter construction, never exposed in logs
  - Features:
    - Dynamic template support for email customization
    - Verified Single Sender validation required
    - All errors caught and returned as `{ success: false, error: message }` (no throws)

## Data Storage

**Databases:**
- SQLite (better-sqlite3 11.3.0) - Primary relational database
  - Location: `./data/app.db` (configurable via `DATABASE_PATH` env var)
  - Connection: `src/db/connection.ts` uses synchronous better-sqlite3 API
  - Features:
    - Write-Ahead Logging (WAL) mode enabled for concurrency
    - Foreign key constraints enabled
    - Auto-creates `/data/` directory on startup
  - Tables:
    - users - User accounts with email, password hash, status
    - sessions - Active user sessions with tokens
    - otp_delivery_records - OTP request history and attempt tracking
    - deletion_requests - Account deletion requests with confirmation status
    - email_records - Outbox of pending/sent emails for reliability

**Caching & Rate-Limiting:**
- Redis (ioredis 5.11.1) - In-memory data store for OTP and session management
  - Connection: `REDIS_URL` env var (default `redis://localhost:6379`)
  - Configuration: `src/config/otp.config.ts` loads connection URL
  - Uses:
    - OTP code storage with TTL (Time-To-Live) expiry
    - Rate-limiting counters for failed OTP attempts
    - Session invalidation tracking
  - Container: Redis 7-Alpine in docker-compose.yml with volume persistence

**File Storage:**
- Local filesystem only - SQLite database files stored in `/app/data/` volume (mounted in Docker)
- No cloud object storage (S3, GCS, etc.)

## Authentication & Identity

**Auth Provider:**
- Custom implementation (no external auth provider)
  - Implementation: `src/services/auth.service.ts` handles registration, login, logout
  - Token type: Bearer tokens issued on successful authentication
  - Token expiry: `TOKEN_EXPIRY_HOURS` (default 24 hours)
  - Storage: Client stores token in browser state, sent via `Authorization: Bearer <token>` header
  - Endpoints:
    - `POST /api/v1/users/register` - Registration with email/password
    - `POST /api/v1/auth/login` - Login with email/password
    - `POST /api/v1/auth/logout` - Logout and session invalidation
    - `GET /api/v1/users/me` - Retrieve authenticated user profile

**Password Security:**
- bcrypt 5.1.1 - Password hashing with configurable cost factor
  - Cost factor: `BCRYPT_COST_FACTOR` env var (minimum 12, default 12)
  - Configuration: `src/config/app.config.ts` enforces minimum >= 12
  - Implementation: `src/services/auth.service.ts` for hashing and verification

**Session Management:**
- Bearer token-based (stateless JWT-style tokens)
- Session state stored in database (`sessions` table)
- Logout invalidates session record via `src/repositories/session.repository.ts`

## Monitoring & Observability

**Error Tracking:**
- None detected - No integration with Sentry, DataDog, or similar

**Logs:**
- Console logging (console.error, console.log)
- Structured error logging in adapters (e.g., SendGrid adapter logs failed deliveries)
- Sensitive values (API keys, secrets) are intentionally never logged

## CI/CD & Deployment

**Hosting:**
- Docker containers - Multi-stage builds for both backend and frontend
- GitHub Actions CI/CD pipeline for automated build and deployment
- Health check integration via `HEALTH_CHECK_URL` environment variable

**CI Pipeline:**
- `.github/workflows/ci-build-reusable.yml` - Builds Docker images for BACKEND and FRONTEND services
- `.github/workflows/ci-build.yml` - Triggers reusable CI build on pull requests and main branch pushes
- `.github/workflows/cd-deploy-reusable.yml` - Reusable deployment workflow with health check validation
- `.github/workflows/cd-deploy.yml` - Triggers deployment on successful CI build completion

**Build Process:**
- Node.js 20 Alpine container as base
- Backend: Compiles TypeScript to JavaScript, installs production-only dependencies
- Frontend: Vite build produces optimized SPA assets, passed to Nginx
- Dockerfiles:
  - `BACKEND/Dockerfile` - Multi-stage: deps → build → prod-deps → runtime
  - `FRONTEND/Dockerfile` - Multi-stage: build → Nginx runtime

## Environment Configuration

**Required env vars:**
- `SENDGRID_API_KEY` - SendGrid API authentication (secrets manager)
- `OTP_HASH_SECRET` - HMAC secret for OTP validation (secrets manager)
- `ADMIN_BEARER_TOKEN` - Admin endpoint access (secrets manager)
- `ACTIVATION_BASE_URL` - User activation link base URL
- `PASSWORD_RECOVERY_BASE_URL` - Password reset link base URL
- `FROM_EMAIL` - Verified SendGrid sender address
- All template IDs (registration, OTP, password recovery, deletion emails)

**Secrets location:**
- `.env` files (loaded via `dotenv` 17.4.2) in BACKEND directory
- GitHub Secrets for CI/CD (inherited by reusable workflows)
- Docker Compose loads from `./BACKEND/.env` file
- Sensitive values:
  - `SENDGRID_API_KEY` - Never logged, only used at module load
  - `OTP_HASH_SECRET` - HMAC secret, never logged
  - `ADMIN_BEARER_TOKEN` - Loaded but not logged

## Webhooks & Callbacks

**Incoming:**
- None - No webhook endpoints to receive external service callbacks

**Outgoing:**
- SendGrid Integration Points:
  - Email delivery via `src/adapters/sendgrid-email.adapter.ts`
  - Transactional sends, not event-driven webhooks
  - Retry logic via outbox worker (`src/workers/outbox.worker.ts`)
  - No SendGrid event webhooks configured (fire-and-forget with local retries)

**Outbox Pattern (Reliability):**
- `src/workers/outbox.worker.ts` - Polls database for pending email records
- `src/repositories/email-record.repository.ts` - Manages email outbox table
- Configuration:
  - Poll interval: `OUTBOX_POLL_INTERVAL_MS` (default 30 seconds)
  - Max retries: `OUTBOX_MAX_RETRIES` (default 1)
- Ensures email delivery attempts persist even if SendGrid is temporarily unavailable

**Account Deletion Notifications:**
- `src/workers/account-deletion-notification.worker.ts` - Async notification worker
- Sends deletion request confirmation and post-deletion notices via SendGrid
- Uses same outbox reliability pattern as OTP and registration emails

## Frontend-to-Backend Communication

**API Base URL:**
- Configured via `VITE_API_BASE_URL` environment variable (default `http://localhost:3000`)
- Built into frontend at compile time via Vite's `import.meta.env`
- Client: `src/app/lib/api-client.ts` - Type-safe fetch wrapper with TypeScript types
- Endpoints:
  - `POST /api/v1/users/register` - New user registration
  - `POST /api/v1/otp/verify` - OTP verification
  - `POST /api/v1/otp/resend` - Resend OTP
  - `POST /api/v1/auth/login` - User login
  - `POST /api/v1/auth/logout` - User logout
  - `POST /api/v1/users/deletion-requests` - Request account deletion
  - `DELETE /api/v1/users/deletion-requests` - Cancel deletion request
  - `POST /api/v1/users/deletion-requests/confirm` - Confirm deletion with code
  - `GET /api/v1/users/me` - Get current user profile

---

*Integration audit: 2026-07-10*
