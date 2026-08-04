# User Management Service

## Overview

The **User Management Service** is a RESTful microservice responsible for:

- Registering new users with email uniqueness enforcement and secure password hashing
- Authenticating users and issuing JWT access tokens
- Managing user sessions (login / logout)
- Email verification workflows

Built with **Node.js + Express**, backed by **MySQL (AWS RDS)**, and structured following **hexagonal architecture** (ports and adapters).

---

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express 4 |
| Auth | JSON Web Tokens (JWT) |
| Database | MySQL 8 / AWS RDS |
| Password hashing | bcryptjs |
| Logging | Winston |
| Testing | Jest + Supertest |

---

## Architecture

```
src/
├── index.js                  # Entry point — boots the HTTP server
├── app.js                    # Express app factory (no side-effects)
├── config/
│   └── index.js              # Centralised env-var config
├── domain/                   # Pure business logic (no I/O)
│   ├── entities/
│   │   └── user.js           # User entity / value objects
│   ├── ports/
│   │   ├── userRepository.js # Repository port (interface contract)
│   │   └── tokenService.js   # Token service port
│   └── usecases/
│       ├── registerUser.js
│       ├── loginUser.js
│       ├── logoutUser.js
│       └── verifyEmail.js
├── adapters/
│   ├── inbound/
│   │   └── http/
│   │       ├── routes/
│   │       │   ├── health.js
│   │       │   └── auth.js
│   │       └── middleware/
│   │           ├── errorHandler.js
│   │           └── authenticate.js
│   └── outbound/
│       ├── mysql/
│       │   ├── connection.js
│       │   └── mysqlUserRepository.js
│       └── jwt/
│           └── jwtTokenService.js
└── infrastructure/
    └── logger.js
```

Hexagonal architecture keeps the **domain** layer free of framework and I/O concerns. Inbound adapters (HTTP routes) call use-cases through ports; outbound adapters (MySQL, JWT) implement those ports.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MySQL 8 instance (local or AWS RDS)
- Docker (optional)

### Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials and secrets

# 3. Start the service
npm run dev
```

### Docker

```bash
# Build production image
docker build --target production -t user-management-service .

# Run
docker run --env-file .env -p 3000:3000 user-management-service
```

---

## API Endpoints

| Method | Path                        | Auth   | Description              |
|--------|-----------------------------|--------|--------------------------|
| GET    | `/health`                   | None   | Liveness check           |
| POST   | `/api/v1/auth/register`     | None   | Register a new user      |
| POST   | `/api/v1/auth/login`        | None   | Login and receive tokens |
| POST   | `/api/v1/auth/logout`       | Bearer | Logout                   |
| GET    | `/api/v1/auth/verify-email` | None   | Verify email via token   |

---

## Database Migration

```bash
mysql -u <user> -p < src/infrastructure/database/migrations/001_create_users.sql
```

---

## Testing

```bash
# Run all tests
npm test

# With coverage report
npm run test:coverage
```

Tests cover:

- `GET /health` integration test
- User entity unit tests
- `registerUser` use-case unit tests
- `loginUser` use-case unit tests
- `JwtTokenService` unit tests

---

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable         | Description                 | Default           |
|------------------|-----------------------------|-------------------|
| `PORT`           | HTTP port                   | `3000`            |
| `DB_HOST`        | MySQL host                  | `localhost`       |
| `DB_NAME`        | Database name               | `user_management` |
| `JWT_SECRET`     | Access token signing secret | *(required)*      |
| `JWT_EXPIRES_IN` | Access token TTL            | `1h`              |
| `BCRYPT_ROUNDS`  | bcrypt cost factor          | `12`              |

---

## License

MIT

---

## Environment Variables

See [.env.example](.env.example) for the full list.

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default `3000`) |
| `NODE_ENV` | `development` / `production` / `test` |
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port (default `3306`) |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | Token TTL (e.g. `1h`) |
| `BCRYPT_ROUNDS` | bcrypt cost factor (default `12`) |

---

## API Endpoints

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness probe |

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Authenticate and receive JWT |
| `POST` | `/api/v1/auth/logout` | Invalidate session |
| `GET` | `/api/v1/auth/verify-email` | Verify email via token |

---

## Running Tests

```bash
npm test
# with coverage
npm run test:coverage
```

---

## License

MIT
