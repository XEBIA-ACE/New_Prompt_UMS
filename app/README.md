# User Management Service

A production-ready **Node.js / Express / PostgreSQL** microservice that handles user registration, OTP verification, authentication, and account deletion. The codebase follows **hexagonal architecture** (ports & adapters) to keep domain logic independent of infrastructure concerns.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Running Tests](#running-tests)
- [Docker](#docker)
- [Project Structure](#project-structure)

---

## Features

- **User registration** with bcrypt password hashing
- **Email OTP** generation and verification
- **JWT authentication** (login)
- **Account deletion** (soft-delete / deactivation)
- **Health check** endpoint
- Hexagonal architecture — domain logic has zero framework dependencies
- Structured JSON logging via Winston
- Input validation via express-validator

---

## Architecture

```
src/
├── domain/           # Pure business logic — no framework imports
│   ├── entities/     # User, Otp
│   └── ports/        # IUserRepository, IOtpRepository, INotificationService
├── application/      # Use-case orchestration
│   ├── use-cases/    # RegisterUser, Login, VerifyOtp, DeleteUser
│   └── errors/       # AppError
├── infrastructure/   # Adapters (PostgreSQL, logger, stub notifications)
│   ├── database/
│   ├── repositories/
│   └── notifications/
└── interfaces/       # HTTP layer (Express routes, controllers, middleware)
    └── http/
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| PostgreSQL | ≥ 14 |

---

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd user-management-service

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# 4. Apply the database schema
psql -U postgres -d user_management -f src/infrastructure/database/migrations/001_initial_schema.sql

# 5. Start the service
npm run dev      # development (nodemon)
npm start        # production
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `3000` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address |
| `LOG_LEVEL` | `info` | Winston log level |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `user_management` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | — | Database password |
| `DB_POOL_MAX` | `10` | Max pool connections |
| `JWT_SECRET` | — | **Required** — JWT signing secret |
| `JWT_EXPIRES_IN` | `1d` | JWT expiry duration |
| `OTP_TTL_MINUTES` | `10` | OTP validity window |

---

## API Reference

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |

**Response 200**
```json
{ "status": "ok", "service": "user-management-service", "timestamp": "..." }
```

---

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/users/register` | — | Register a new user |
| `POST` | `/api/v1/users/verify-otp` | — | Verify an OTP code |
| `DELETE` | `/api/v1/users/:id` | Bearer JWT | Deactivate account |

#### POST `/api/v1/users/register`
```json
{
  "email": "alice@example.com",
  "password": "s3cr3tP@ss",
  "firstName": "Alice",
  "lastName": "Smith"
}
```

#### POST `/api/v1/users/verify-otp`
```json
{
  "userId": "<uuid>",
  "code": "123456",
  "purpose": "email_verification"
}
```

---

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/login` | Authenticate and receive JWT |

#### POST `/api/v1/auth/login`
```json
{ "email": "alice@example.com", "password": "s3cr3tP@ss" }
```

**Response 200**
```json
{ "token": "<jwt>", "user": { ... } }
```

---

## Running Tests

```bash
npm test                # run all tests
npm run test:coverage   # with coverage report
```

Tests use **Jest** + **Supertest** and do not require a live database.

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

The image uses a multi-stage build (builder → runtime) and runs as a non-root user.

---

## Project Structure

```
.
├── src/
│   ├── app.js                          # Express app factory
│   ├── server.js                       # Entry point
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── User.js
│   │   │   └── Otp.js
│   │   └── ports/
│   │       ├── IUserRepository.js
│   │       ├── IOtpRepository.js
│   │       └── INotificationService.js
│   ├── application/
│   │   ├── errors/AppError.js
│   │   └── use-cases/
│   │       ├── RegisterUserUseCase.js
│   │       ├── LoginUserUseCase.js
│   │       ├── VerifyOtpUseCase.js
│   │       └── DeleteUserUseCase.js
│   ├── infrastructure/
│   │   ├── logger.js
│   │   ├── database/
│   │   │   ├── connection.js
│   │   │   └── migrations/001_initial_schema.sql
│   │   ├── repositories/
│   │   │   ├── PgUserRepository.js
│   │   │   └── PgOtpRepository.js
│   │   └── notifications/
│   │       └── StubNotificationService.js
│   └── interfaces/
│       └── http/
│           ├── routes/
│           │   ├── health.routes.js
│           │   ├── user.routes.js
│           │   └── auth.routes.js
│           ├── controllers/
│           │   ├── UserController.js
│           │   └── AuthController.js
│           └── middleware/
│               ├── authenticate.js
│               ├── validate.js
│               ├── errorHandler.js
│               └── notFoundHandler.js
├── tests/
│   ├── health.test.js
│   ├── user.test.js
│   └── domain/
│       ├── User.test.js
│       └── Otp.test.js
├── .env.example
├── .dockerignore
├── Dockerfile
└── package.json
```
