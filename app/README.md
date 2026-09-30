# User Management Service

A production-ready **Node.js / Express.js** microservice that handles user registration, email verification via OTP, authentication, and account management. Built following **hexagonal architecture** (ports & adapters).

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database](#database)
- [Docker](#docker)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

## Features

- **User Registration** — create an account and receive an OTP verification email
- **Email Verification** — verify account with a 6-digit OTP (10-minute expiry)
- **Login** — authenticate with email/password and receive a JWT access token
- **Profile** — retrieve the authenticated user's profile
- **Account Deletion** — hard-delete account and all associated data
- **Health Check** — liveness endpoint for container orchestration

---

## Architecture

The service follows **hexagonal architecture** (also known as ports & adapters):

```
src/
├── domain/               # Core business logic — no framework dependencies
│   ├── entities/         # User, Otp
│   ├── errors/           # Domain-specific error types
│   └── ports/            # Interfaces: IUserRepository, IOtpRepository,
│                         #             IEmailService, ITokenService
│
├── application/          # Use-cases (orchestrate domain + ports)
│   └── use-cases/        # RegisterUser, VerifyEmail, LoginUser, DeleteAccount
│
├── adapters/             # Concrete implementations of ports
│   ├── http/             # Express routes, controllers, middleware
│   ├── repositories/     # PostgreSQL implementations of repository ports
│   └── services/         # Nodemailer (email), JWT (token)
│
└── infrastructure/       # Cross-cutting concerns
    ├── database/         # pg Pool, migrations
    ├── config.js         # Env-var configuration
    ├── container.js      # Dependency injection wiring
    └── logger.js         # Winston logger
```

---

## Tech Stack

| Concern        | Technology          |
|----------------|---------------------|
| Runtime        | Node.js ≥ 18        |
| Framework      | Express.js 4        |
| Database       | PostgreSQL 15+      |
| Auth           | JSON Web Tokens     |
| Password hash  | bcryptjs            |
| Email          | Nodemailer          |
| Logging        | Winston             |
| Testing        | Jest + Supertest    |
| Containerisation | Docker (multi-stage) |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL 15+
- (Optional) Docker & Docker Compose

### Local setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd user-management-service

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials, JWT secret, and SMTP settings

# 4. Run database migrations
psql -U <user> -d <database> -f src/infrastructure/database/migrations/001_initial_schema.sql

# 5. Start the service
npm run dev        # development (nodemon)
npm start          # production
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

| Variable        | Description                              | Default                  |
|-----------------|------------------------------------------|--------------------------|
| `NODE_ENV`      | Runtime environment                      | `development`            |
| `PORT`          | HTTP port                                | `3000`                   |
| `DB_HOST`       | PostgreSQL host                          | `localhost`              |
| `DB_PORT`       | PostgreSQL port                          | `5432`                   |
| `DB_NAME`       | Database name                            | `user_management`        |
| `DB_USER`       | Database user                            | `postgres`               |
| `DB_PASSWORD`   | Database password                        | —                        |
| `DB_POOL_MAX`   | Max pool connections                     | `10`                     |
| `JWT_SECRET`    | Secret for signing JWTs                  | *(must be set)*          |
| `JWT_EXPIRES_IN`| JWT expiry duration                      | `1h`                     |
| `SMTP_HOST`     | SMTP server host                         | —                        |
| `SMTP_PORT`     | SMTP server port                         | `587`                    |
| `SMTP_SECURE`   | Use TLS (`true`/`false`)                 | `false`                  |
| `SMTP_USER`     | SMTP username                            | —                        |
| `SMTP_PASS`     | SMTP password                            | —                        |
| `EMAIL_FROM`    | Sender address                           | `no-reply@example.com`   |
| `LOG_LEVEL`     | Winston log level                        | `info`                   |

---

## API Reference

### Health

| Method | Path      | Auth | Description          |
|--------|-----------|------|----------------------|
| GET    | `/health` | —    | Service liveness check |

**Response `200`**
```json
{
  "status": "ok",
  "service": "user-management-service",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### Auth

| Method | Path                        | Auth | Description              |
|--------|-----------------------------|------|--------------------------|
| POST   | `/api/v1/auth/register`     | —    | Register a new user      |
| POST   | `/api/v1/auth/verify-email` | —    | Verify email with OTP    |
| POST   | `/api/v1/auth/login`        | —    | Login and get JWT        |

#### POST `/api/v1/auth/register`

```json
// Request body
{
  "email": "alice@example.com",
  "password": "Str0ngP@ssword",
  "firstName": "Alice",
  "lastName": "Smith"
}

// Response 201
{
  "message": "Registration successful. Please verify your email.",
  "user": { "id": "...", "email": "alice@example.com", ... }
}
```

#### POST `/api/v1/auth/verify-email`

```json
// Request body
{ "email": "alice@example.com", "code": "123456" }

// Response 200
{ "message": "Email verified successfully.", "user": { ... } }
```

#### POST `/api/v1/auth/login`

```json
// Request body
{ "email": "alice@example.com", "password": "Str0ngP@ssword" }

// Response 200
{ "accessToken": "<jwt>", "user": { ... } }
```

---

### Users

All routes require `Authorization: Bearer <token>`.

| Method | Path               | Description              |
|--------|--------------------|--------------------------|
| GET    | `/api/v1/users/me` | Get current user profile |
| DELETE | `/api/v1/users/me` | Delete current account   |

---

## Database

Run the migration script before first use:

```bash
psql -U postgres -d user_management \
  -f src/infrastructure/database/migrations/001_initial_schema.sql
```

Tables created: `users`, `otps`.

---

## Docker

```bash
# Build image
docker build -t user-management-service .

# Run container
docker run -p 3000:3000 \
  --env-file .env \
  user-management-service
```

### Docker Compose (example)

```yaml
version: "3.9"
services:
  api:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: user_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## Testing

```bash
npm test              # run all tests
npm run test:coverage # with coverage report
```

Tests live in `tests/` and use **Jest** + **Supertest**.

---

## License

MIT
