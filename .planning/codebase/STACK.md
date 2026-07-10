# Technology Stack

**Analysis Date:** 2026-07-10

## Languages

**Primary:**
- TypeScript 5.5.4 - Backend services, type-safe server logic
- JavaScript (ES2020) - Frontend application with React

**Secondary:**
- HTML - Frontend markup (templated by React/Nginx)
- CSS - Styling via Tailwind CSS 4.1.12

## Runtime

**Environment:**
- Node.js 20 (Alpine Linux) - Backend API server and build tooling
- Nginx 1.27 (Alpine Linux) - Frontend static asset serving and reverse proxy

**Package Manager:**
- npm - Primary package manager for both backend and frontend
- pnpm - Workspace management (optional, with pnpm overrides for Vite 6.3.5)

**Lockfile:**
- `package-lock.json` - Present for both BACKEND and FRONTEND

## Frameworks

**Core:**
- Express 4.19.2 - Backend API framework (REST endpoints at `/api/v1/*`)
- React 18.3.1 - Frontend UI framework (peer dependency)
- React Router 7.13.0 - Client-side routing

**UI/Styling:**
- Material-UI (@mui/material 7.3.5, @mui/icons-material 7.3.5) - Component library with Material Design
- Radix UI (multiple v1.1-1.2 packages) - Accessible unstyled components for modals, dialogs, dropdowns
- Tailwind CSS 4.1.12 - Utility-first CSS framework
- Emotion (@emotion/react 11.14.0, @emotion/styled 11.14.1) - CSS-in-JS for dynamic styling

**Form & Input:**
- React Hook Form 7.55.0 - Lightweight form state management
- Recharts 2.15.2 - Chart and data visualization components
- React DnD 16.0.1 - Drag-and-drop functionality with HTML5 backend

**Testing:**
- Jest 29.7.0 - Backend test runner (configured in `jest.config.ts`)
- ts-jest 29.2.3 - TypeScript preset for Jest
- Supertest 7.0.0 - HTTP assertion library for API testing
- fast-check 3.21.0 - Property-based testing framework

**Build/Dev:**
- Vite 6.3.5 - Frontend build tool and dev server (configured in `vite.config.ts`)
- TypeScript Compiler (tsc) - Backend compilation via `npm run build`
- ts-node 10.9.2 - TypeScript execution for migrations and scripts

**Linting & Code Quality:**
- ESLint 9.39.4 - JavaScript/TypeScript linting
- typescript-eslint 8.63.0 - ESLint rules for TypeScript
- @tailwindcss/vite 4.1.12 - Tailwind CSS Vite integration

## Key Dependencies

**Critical:**
- better-sqlite3 11.3.0 - Embedded SQL database for persistence (synchronous, requires native build tools)
- bcrypt 5.1.1 - Password hashing with configurable cost factor (minimum 12)
- uuid 9.0.1 - Unique identifier generation for users, sessions, tokens
- cors 2.8.6 - Cross-Origin Resource Sharing middleware for API
- dotenv 17.4.2 - Environment variable loading from `.env` files

**Infrastructure:**
- ioredis 5.11.1 - Redis client for OTP storage and rate limiting (connection: `redis://localhost:6379` or `REDIS_URL` env var)
- @sendgrid/mail 8.1.3 - SendGrid email delivery SDK for transactional emails
- swagger-ui-express 5.0.1 - OpenAPI/Swagger documentation UI

**Utilities:**
- yamljs 0.3.0 - YAML parsing for OpenAPI spec loading
- clsx 2.1.1 - Utility for managing CSS class names conditionally
- class-variance-authority 0.7.1 - Type-safe component variant management
- date-fns 3.6.0 - Date manipulation and formatting
- motion 12.23.24 - Animation library for React
- canvas-confetti 1.9.4 - Celebratory confetti animations
- input-otp 1.4.2 - OTP input component
- lucide-react 0.487.0 - Icon library
- react-resizable-panels 2.1.7 - Resizable layout panels
- react-responsive-masonry 2.7.1 - Masonry grid layout

## Configuration

**Environment:**
- Configuration is loaded at application startup via `requireEnvString()` and `parsePositiveInt()` helpers
- Fail-fast on missing or invalid required environment variables
- Sensitive values (SENDGRID_API_KEY, OTP_HASH_SECRET, ADMIN_BEARER_TOKEN) are never logged

**Required Environment Variables:**
```
# Application
ACTIVATION_BASE_URL              # Base URL for account activation links
ADMIN_BEARER_TOKEN               # Bearer token for admin endpoints
BCRYPT_COST_FACTOR              # Bcrypt hashing cost (minimum 12, default 12)
TOKEN_EXPIRY_HOURS              # Session token expiry (default 24)

# SendGrid Email Integration
SENDGRID_API_KEY                # API key (NEVER logged)
SENDGRID_TEMPLATE_ID            # Template ID for registration activation email
FROM_EMAIL                      # Verified sender address
FROM_NAME                       # Display name (default: "User Management Service")
PASSWORD_RECOVERY_BASE_URL      # Base URL for password reset links
PASSWORD_RECOVERY_EMAIL_TEMPLATE_ID  # SendGrid template for password recovery
PASSWORD_RECOVERY_TOKEN_EXPIRY_HOURS # Password recovery token expiry (default 1)

# OTP Configuration
OTP_LENGTH                      # OTP code length (default 6)
OTP_TTL_MINUTES                 # OTP time-to-live (default 10)
OTP_MAX_ATTEMPTS_PER_WINDOW     # Max failed attempts (default 5)
OTP_RATE_LIMIT_WINDOW_MINUTES   # Rate limit window (default 15)
OTP_HASH_ALGORITHM              # Hash algorithm (default "sha256")
OTP_HASH_SECRET                 # HMAC secret (NEVER logged)
OTP_EMAIL_TEMPLATE_ID           # SendGrid template for OTP delivery
SMS_PROVIDER_ENABLED            # Gates OTP delivery (default true)

# Account Deletion
ACCOUNT_DELETION_OTP_EXPIRY_MINUTES       # Deletion confirmation OTP expiry (default to OTP_TTL_MINUTES)
ACCOUNT_DELETION_REQUEST_EMAIL_TEMPLATE_ID # SendGrid template for deletion request
ACCOUNT_DELETION_NOTICE_EMAIL_TEMPLATE_ID  # SendGrid template for post-deletion notice

# Infrastructure
DATABASE_PATH                   # SQLite database file location (default "./data/app.db")
REDIS_URL                       # Redis connection URL (default "redis://localhost:6379")
OUTBOX_POLL_INTERVAL_MS         # Email outbox polling interval (default 30_000ms)
OUTBOX_MAX_RETRIES              # Failed email retry count (default 1)
```

**Build:**
- Frontend: `vite.config.ts` with path aliases (`@` → `src/`), React plugin, Tailwind CSS integration
- Backend: `tsconfig.json` with strict mode, ES2020 target, CommonJS modules
- Database migrations: `ts-node` runner for `db/migrations/run-migrations.ts`

## Platform Requirements

**Development:**
- Node.js 20 or later (Alpine-compatible)
- Python 3 + build tools (make, g++) - Required for building native `better-sqlite3` module
- Redis (optional for local OTP testing, default localhost:6379)

**Production:**
- Backend: Node.js 20 Alpine container with data volume for SQLite (`/app/data/`)
- Frontend: Nginx 1.27 Alpine container serving compiled React SPA
- Redis: Dedicated Redis 7-Alpine container for OTP and rate-limiting
- Docker Compose orchestration available in `docker-compose.yml`

**Deployment Target:**
- Docker containers (multi-stage builds in both Dockerfiles)
- GitHub Actions CI/CD pipeline for build and deploy (`workflows/` directory)
- Environment-based configuration via Docker Compose env files and GitHub secrets

---

*Stack analysis: 2026-07-10*
