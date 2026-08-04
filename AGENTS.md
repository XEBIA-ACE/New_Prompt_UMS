# AGENTS.md — User Management Service

## 1. Stack

| Technology | Role |
|---|---|
| **Node.js 20 LTS** | Runtime environment |
| **Express 4.x** | HTTP server and routing framework |
| **jsonwebtoken** | JWT creation, signing, and verification |
| **bcryptjs** | Password hashing and comparison |
| **mysql2** | MySQL driver with promise support |
| **AWS RDS (MySQL 8.x)** | Managed relational database |
| **Sequelize 6.x** | ORM for schema management and queries |
| **express-validator** | Request body and param validation |
| **helmet** | HTTP security headers middleware |
| **cors** | Cross-origin resource sharing middleware |
| **dotenv** | Environment variable loading |
| **winston** | Structured logging |
| **Jest** | Unit and integration test runner |
| **Supertest** | HTTP integration testing against Express app |
| **nodemon** | Dev-mode auto-restart |
| **ESLint + Prettier** | Code linting and formatting |

---

## 2. Project Structure

```
user-management-service/
├── src/
│   ├── config/
│   │   ├── database.js          # Sequelize instance, RDS connection config
│   │   ├── jwt.js               # JWT secret, expiry constants
│   │   └── logger.js            # Winston logger configuration
│   ├── controllers/
│   │   └── auth.controller.js   # Route handlers: register, login, logout, verify
│   ├── middleware/
│   │   ├── authenticate.js      # JWT verification middleware
│   │   ├── errorHandler.js      # Centralised Express error handler
│   │   ├── rateLimiter.js       # express-rate-limit config for auth routes
│   │   └── validate.js          # express-validator result checker middleware
│   ├── models/
│   │   ├── index.js             # Sequelize model registry and associations
│   │   └── user.model.js        # User schema: id, email, passwordHash, verified, createdAt
│   ├── routes/
│   │   ├── index.js             # Root router — mounts all sub-routers
│   │   └── auth.routes.js       # POST /register, POST /login, POST /logout, GET /verify
│   ├── services/
│   │   ├── auth.service.js      # Business logic: hash password, issue token, validate credentials
│   │   └── user.service.js      # DB operations: findByEmail, createUser, updateVerified
│   ├── validators/
│   │   └── auth.validators.js   # express-validator chains for each endpoint
│   ├── utils/
│   │   ├── apiResponse.js       # Standardised success/error response helpers
│   │   └── tokenBlacklist.js    # In-memory or Redis-backed JWT blacklist for logout
│   └── app.js                   # Express app factory (no listen call — testable)
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── auth.service.test.js
│   │   │   └── user.service.test.js
│   │   ├── middleware/
│   │   │   └── authenticate.test.js
│   │   └── utils/
│   │       └── apiResponse.test.js
│   ├── integration/
│   │   └── auth.routes.test.js  # Full route tests via Supertest + test DB
│   └── helpers/
│       ├── dbSetup.js           # Spin up/tear down test DB state
│       └── fixtures.js          # Reusable test data factories
├── migrations/
│   └── 20240101000000-create-users.js  # Sequelize CLI migration for users table
├── seeders/
│   └── 20240101000001-demo-user.js     # Optional dev seed data
├── .env.example                 # All required env vars documented, no real values
├── .env                         # Gitignored — real secrets
├── .eslintrc.js                 # ESLint rules (airbnb-base + prettier)
├── .prettierrc                  # Prettier formatting rules
├── .gitignore
├── jest.config.js               # Jest config: coverage thresholds, test paths
├── nodemon.json                 # Nodemon watch config
├── package.json
├── Dockerfile
├── docker-compose.yml
├── docker-compose.test.yml
└── .github/
    └── workflows/
        └── ci.yml
```

---

## 3. Required Workflow

The agent **must** follow these steps in order. Do not skip or reorder.

### Step 1 — Read and Understand Specs
- Read all story-level spec documents provided in the task context.
- Identify every endpoint, field constraint, business rule, and error case.
- Note all environment variables that will be required.

### Step 2 — Create `tasks.md`
- Create `tasks.md` at the project root before writing any code.
- Break the implementation into discrete, checkable tasks grouped by layer (config → models → services → middleware → controllers → routes → tests → Docker → CI).
- Each task must have a checkbox: `- [ ] Task description`.
- Update checkboxes to `- [x]` as each task is completed.

### Step 3 — Scaffold the Project
- Run `npm init -y` and install all dependencies listed in Section 1.
- Create every file and directory listed in Section 2, even if initially empty.
- Populate `.env.example` with all required keys before writing any code that reads `process.env`.

### Step 4 — Implement in Layer Order
Follow this strict implementation sequence:
1. `src/config/` — database, JWT constants, logger
2. `migrations/` — create users table migration, run `sequelize db:migrate`
3. `src/models/` — User model
4. `src/utils/` — apiResponse helpers, tokenBlacklist
5. `src/services/` — user.service, auth.service
6. `src/validators/` — auth.validators
7. `src/middleware/` — validate, authenticate, rateLimiter, errorHandler
8. `src/controllers/` — auth.controller
9. `src/routes/` — auth.routes, index
10. `src/app.js` — assemble Express app
11. `server.js` (root) — call `app.listen` here only

### Step 5 — Write Tests
- Write unit tests for every service function and utility before marking implementation complete.
- Write integration tests for every route covering happy path and all documented error paths.
- Run `npm test` and confirm all tests pass before proceeding.

### Step 6 — Validate
- Run `npm run lint` — zero errors allowed.
- Run `npm test -- --coverage` — confirm 90% coverage thresholds are met.
- Run `docker-compose up --build` — confirm the service starts and `/health` returns `200`.
- Tick all `tasks.md` checkboxes and add a `## Completion Notes` section at the bottom.

---

## 4. Coding Conventions

### General
- Use **ES Modules** (`"type": "module"` in `package.json`) or CommonJS consistently — pick CommonJS for maximum Sequelize CLI compatibility.
- All async route handlers and service functions must use `async/await`. No raw Promise chains.
- Never use `var`. Use `const` by default; `let` only when reassignment is required.
- Maximum function length: **30 lines**. Extract helpers if exceeded.

### Naming
| Construct | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `auth.service.js` |
| Classes / Models | `PascalCase` | `User` |
| Functions / variables | `camelCase` | `hashPassword` |
| Constants | `UPPER_SNAKE_CASE` | `JWT_EXPIRY` |
| DB columns | `snake_case` | `password_hash` |
| JS model fields | `camelCase` mapped via Sequelize `field` option | `passwordHash` |
| Environment variables | `UPPER_SNAKE_CASE` | `DB_HOST` |

### Architecture Patterns
- **Controller → Service → Model**: controllers handle HTTP concerns only; all business logic lives in services; models are pure data access.
- Controllers must not import models directly — always go through a service.
- Services must not import `req` or `res` — they are framework-agnostic.
- All responses must use `apiResponse.success()` or `apiResponse.error()` helpers to ensure consistent shape:
  ```json
  { "success": true, "data": {}, "message": "string" }
  { "success": false, "error": "string", "code": "ERROR_CODE" }
  ```
- Passwords must **never** appear in logs or API responses.
- JWTs must be signed with `HS256` minimum; store the secret in `JWT_SECRET` env var (min 32 chars).
- Refresh tokens (if implemented) must be stored in `httpOnly` cookies, not response bodies.

### Error Handling
- All errors must be thrown as instances of a custom `AppError` class with `statusCode` and `errorCode` properties.
- The centralised `errorHandler` middleware is the only place that writes error responses.
- Unhandled promise rejections must be caught — wrap all async handlers with a `catchAsync` utility wrapper.

### Security
- Passwords hashed with `bcryptjs` at **salt rounds = 12**.
- Rate-limit `/register` and `/login` to **10 requests per 15 minutes** per IP.
- Validate and sanitise all inputs with `express-validator` before they reach the controller.
- Never log JWT tokens or password hashes.

---

## 5. Testing

### Framework Setup
```js
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageThresholds: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  setupFilesAfterFramework: ['./tests/helpers/dbSetup.js'],
};
```

### Unit Tests (`tests/unit/`)
- Mock all external dependencies (Sequelize models, `bcryptjs`, `jsonwebtoken`) using `jest.mock()`.
- Each service function needs tests for: happy path, invalid input, DB error propagation.
- Each middleware function needs tests for: passing case, rejection case, edge cases.
- Test file must mirror the source path: `src/services/auth.service.js` → `tests/unit/services/auth.service.test.js`.

### Integration Tests (`tests/integration/`)
- Use a **separate test database** configured via `TEST_DB_NAME` env var.
- Use `Supertest` to fire real HTTP requests against the Express app.
- `dbSetup.js` must run `sequelize.sync({ force: true })` before the test suite and `sequelize.close()` after.
- Cover per route:
  - `POST /auth/register` — success 201, duplicate email 409, invalid body 422, weak password 422.
  - `POST /auth/login` — success 200 with token, wrong password 401, unknown email 401.
  - `POST /auth/logout` — success 200, missing/invalid token 401.
  - `GET /auth/verify` — valid token 200, expired token 401, blacklisted token 401.

### Running Tests
```bash
# All tests
npm test

# With coverage report
npm test -- --coverage

# Watch mode (dev)
npm run test:watch

# Integration only
npm test -- --testPathPattern=integration
```

### Required `package.json` Scripts
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "jest --forceExit",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage --forceExit",
  "lint": "eslint src/ tests/",
  "lint:fix": "eslint src/ tests/ --fix",
  "migrate": "sequelize-cli db:migrate",
  "migrate:undo": "sequelize-cli db:migrate:undo"
}
```

---

## 6. Docker & CI

### Dockerfile
```dockerfile
# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Production Stage ----
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./src/
COPY migrations/ ./migrations/
COPY server.js ./

USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
```

### docker-compose.yml (Development)
```yaml
version: '3.9'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./src:/app/src   # hot-reload in dev only

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

### docker-compose.test.yml (CI Testing)
```yaml
version: '3.9'
services:
  test:
    build: .
    command: npm test -- --coverage --forceExit
    env_file: .env.test
    environment:
      NODE_ENV: test
      DB_HOST: test_db
    depends_on:
      test_db:
        condition: service_healthy

  test_db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: testroot
      MYSQL_DATABASE: ums_test
      MYSQL_USER: testuser
      MYSQL_PASSWORD: testpass
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 3s
      retries: 10
```

### `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Run tests with coverage
        run: docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from test

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

      - name: Enforce coverage thresholds
        run: npm test -- --coverage --coverageReporters=text-summary

  build-image:
    runs-on: ubuntu-latest
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t user-management-