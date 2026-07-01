# User Management Service

## Overview

The **User Management Service** is a RESTful microservice built with **Node.js**, **Express**, and **PostgreSQL**. It follows **hexagonal architecture** (ports and adapters) to keep business logic decoupled from infrastructure concerns.

### Responsibilities

- User registration and profile management
- OTP (One-Time Password) generation and verification
- User authentication (JWT-based)
- Account deletion

---

## Architecture

```
src/
├── index.js                    # Entry point — boots the HTTP server
├── app.js                      # Express app factory
├── config/
│   └── env.js                  # Centralised environment config
├── domain/                     # Core business logic (no framework deps)
│   ├── entities/
│   │   ├── User.js
│   │   └── Otp.js
│   ├── ports/                  # Interfaces (contracts)
│   │   ├── UserRepository.js
│   │   └── OtpRepository.js
│   └── services/               # Use-cases / application services
│       ├── UserService.js
│       └── OtpService.js
├── adapters/
│   ├── inbound/                # HTTP layer (controllers + routes)
│   │   ├── routes/
│   │   │   ├── healthRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   └── authRoutes.js
│   │   └── controllers/
│   │       ├── HealthController.js
│   │       ├── UserController.js
│   │       └── AuthController.js
│   └── outbound/               # Infrastructure (DB, external services)
│       └── postgres/
│           ├── db.js
│           ├── PostgresUserRepository.js
│           └── PostgresOtpRepository.js
└── shared/
    ├── errors/
    │   └── AppError.js
    ├── middleware/
    │   ├── errorHandler.js
    │   ├── authenticate.js
    │   └── validate.js
    └── logger.js
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14
- Docker (optional)

### Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in environment variables
cp .env.example .env

# 3. Run database migrations (see migrations/ folder)
psql -U $DB_USER -d $DB_NAME -f migrations/001_create_users.sql
psql -U $DB_USER -d $DB_NAME -f migrations/002_create_otps.sql

# 4. Start the service
npm run dev
```

### Docker

```bash
docker build -t user-management-service .
docker run --env-file .env -p 3000:3000 user-management-service
```

---

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/health` | Health check | No |
| POST | `/api/v1/auth/register` | Register a new user | No |
| POST | `/api/v1/auth/login` | Login, receive JWT | No |
| GET | `/api/v1/users/:id` | Get user profile | JWT |
| DELETE | `/api/v1/users/:id` | Delete own account | JWT |
| POST | `/api/v1/users/:id/otp/generate` | Generate OTP | JWT |
| POST | `/api/v1/users/:id/otp/verify` | Verify OTP | JWT |
| POST | `/api/v1/auth/login` | Authenticate and receive JWT | No |
| POST | `/api/v1/auth/otp/send` | Send OTP to user | JWT |
| POST | `/api/v1/auth/otp/verify` | Verify OTP | JWT |
| GET | `/api/v1/users/me` | Get current user profile | JWT |
| PUT | `/api/v1/users/me` | Update current user profile | JWT |
| DELETE | `/api/v1/users/me` | Delete account | JWT |

---

## Environment Variables

See [.env.example](.env.example) for the full list.

---

## Testing

```bash
npm test
npm run test:coverage
```

---

## License

MIT
