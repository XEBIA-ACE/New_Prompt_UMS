# User Management Service

A production-ready **Node.js / Express.js** microservice that handles user registration, email verification via OTP, authentication (JWT), and account deletion. Built with **hexagonal architecture** (ports & adapters) and backed by **PostgreSQL**.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Running Tests](#running-tests)
- [Docker](#docker)

---

## Features

- **User registration** with hashed passwords (bcrypt)
- **Email verification** via 6-digit OTP (10-minute TTL)
- **JWT authentication** (Bearer token)
- **Account deletion** with full data cleanup
- Health-check endpoint
- Structured JSON logging (Winston)
- Input validation (express-validator)

---

## Architecture

The project follows **hexagonal architecture** (ports & adapters):

```
src/
├── domain/               # Core business logic — no framework dependencies
│   ├── entities/         # Domain models (User)
│   ├── ports/            # Interfaces (UserRepository, EmailService)
│   ├── errors/           # Domain error types
│   └── utils/            # Pure helpers (crypto, jwt)
├── application/
│   └── services/         # Use-case orchestration (AuthService, UserService)
├── infrastructure/       # Adapters — DB, email, logger, DI container
│   ├── database/         # PostgreSQL pool + migrations
│   ├── repositories/     # PostgresUserRepository
│   └── email/            # NodemailerEmailService
└── interfaces/
    └── http/             # Express routes, controllers, middleware
```

---

## Tech Stack

| Layer        | Technology                  |
|--------------|-----------------------------|
| Runtime      | Node.js ≥ 18                |
| Framework    | Express.js 4                |
| Database     | PostgreSQL 15               |
| Auth         | JSON Web Tokens (jsonwebtoken) |
| Password     | bcryptjs                    |
| Email        | Nodemailer                  |
| Validation   | express-validator           |
| Logging      | Winston                     |
| Testing      | Jest + Supertest            |
| Container    | Docker                      |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL 15
- (Optional) Docker & Docker Compose

### Local setup

```bash
# 1. Clone and install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials and secrets

# 3. Run database migrations
npm run migrate

# 4. Start the service
npm run dev
```

The service will be available at `http://localhost:3000`.

---

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable        | Description                          | Default              |
|-----------------|--------------------------------------|----------------------|
| `PORT`          | HTTP port                            | `3000`               |
| `DB_HOST`       | PostgreSQL host                      | `localhost`          |
| `DB_NAME`       | Database name                        | `user_management`    |
| `JWT_SECRET`    | Secret for signing JWTs              | *(must be changed)*  |
| `JWT_EXPIRES_IN`| Token expiry                         | `1d`                 |
| `SMTP_HOST`     | SMTP server host                     | `smtp.mailtrap.io`   |

---

## API Reference

### Health

| Method | Path      | Auth | Description        |
|--------|-----------|------|--------------------|
| GET    | `/health` | —    | Liveness check     |

### Authentication

| Method | Path                       | Auth | Description                  |
|--------|----------------------------|------|------------------------------|
| POST   | `/api/v1/auth/register`    | —    | Register a new user          |
| POST   | `/api/v1/auth/verify-email`| —    | Verify email with OTP        |
| POST   | `/api/v1/auth/login`       | —    | Login and receive JWT        |

### Users

| Method | Path               | Auth   | Description              |
|--------|--------------------|--------|--------------------------|
| GET    | `/api/v1/users/me` | Bearer | Get own profile          |
| DELETE | `/api/v1/users/me` | Bearer | Delete own account       |

#### Register — `POST /api/v1/auth/register`

```json
{
  "email": "alice@example.com",
  "password": "securepassword",
  "firstName": "Alice",
  "lastName": "Smith"
}
```

#### Verify Email — `POST /api/v1/auth/verify-email`

```json
{
  "email": "alice@example.com",
  "otp": "123456"
}
```

#### Login — `POST /api/v1/auth/login`

```json
{
  "email": "alice@example.com",
  "password": "securepassword"
}
```

Response:
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "email": "...", "firstName": "...", ... }
}
```

---

## Running Tests

```bash
# All tests
npm test

# With coverage report
npm run test:coverage
```

---

## Docker

### Build & run

```bash
docker build -t user-management-service .
docker run -p 3000:3000 --env-file .env user-management-service
```

### Docker Compose (with PostgreSQL)

```bash
docker compose up
```

---

## License

MIT
