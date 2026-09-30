# User Management Service

A production-ready **User Management Service** built with **Node.js**, **Express.js**, **PostgreSQL**, and **JWT**. It follows **hexagonal architecture** (ports and adapters) to keep domain logic decoupled from infrastructure concerns.

---

## Features

| Feature | Description |
|---|---|
| User Registration | Create an account with email + password |
| Email Verification | OTP-based email verification flow |
| Authentication | JWT-based login / token refresh |
| Account Deletion | Soft-delete with full data cleanup |
| Health Check | `GET /health` — liveness probe |

---

## Architecture

```
src/
├── domain/               # Pure business logic — no framework dependencies
│   ├── entities/         # User, OTP value objects
│   ├── ports/            # Interfaces (repository, mailer, token)
│   └── usecases/         # Application use-cases
├── adapters/
│   ├── http/             # Express controllers & routers (primary adapter)
│   ├── db/               # PostgreSQL repository implementations (secondary)
│   └── mail/             # Nodemailer mailer implementation (secondary)
├── infrastructure/
│   ├── db/               # DB connection pool & migrations
│   ├── config/           # Environment config loader
│   └── logger/           # Winston logger
└── index.js              # Entry point
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14
- (Optional) Docker & Docker Compose

### 1. Clone & install

```bash
git clone <repo-url>
cd user-management-service
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run database migrations

```bash
psql -U $DB_USER -d $DB_NAME -f src/infrastructure/db/migrations/001_create_users.sql
psql -U $DB_USER -d $DB_NAME -f src/infrastructure/db/migrations/002_create_otps.sql
```

### 4. Start the service

```bash
# Development (hot-reload)
npm run dev

# Production
npm start
```

---

## Docker

```bash
# Build image
docker build -t user-management-service .

# Run container
docker run --env-file .env -p 3000:3000 user-management-service
```

Or with Docker Compose:

```bash
docker compose up --build
```

---

## API Reference

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness probe |

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/verify-email` | Verify email with OTP |
| POST | `/api/v1/auth/login` | Login and receive JWT |
| POST | `/api/v1/auth/resend-otp` | Resend verification OTP |

### Users

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/users/me` | Get current user profile |
| DELETE | `/api/v1/users/me` | Delete account |

---

## Environment Variables

See [.env.example](.env.example) for the full list.

---

## Testing

```bash
npm test              # Run all tests
npm run test:coverage # With coverage report
```

---

## License

MIT
