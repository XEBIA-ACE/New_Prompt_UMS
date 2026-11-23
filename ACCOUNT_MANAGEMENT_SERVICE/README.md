# Account Management Service (SCAFFOLD-SVC-001)

Scaffold for the Account Management Service: Node.js + Express + PostgreSQL.
It is the starting point for future work on user authentication and authorization,
account registration and management, OAuth 2.0 flow management, and token
generation/validation. **None of that logic is implemented here** — this story
(AC-1) only covers the skeleton.

| Task                              | Where                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| T001 Project skeleton             | `package.json`, `src/server.ts` (entrypoint), `eslint.config.mjs`, `.prettierrc.json`, `tsconfig.json` |
| T002 Env-based configuration      | `src/config/env.ts`, `.env.example`                                                                    |
| T003 Health-check endpoint        | `src/routes/health.routes.ts` (`GET /health`)                                                          |
| T004 PostgreSQL connection helper | `src/db/postgres.ts`                                                                                   |
| T005 Verify AC-1                  | `npm test`, `npm run verify:ac1` (`scripts/verify-ac1.sh`)                                             |

## Configuration

All configuration comes from environment variables (optionally via a local `.env`, never committed).
See `.env.example`.

| Variable                         | Required | Default       |
| -------------------------------- | -------- | ------------- |
| `DATABASE_URL`                   | yes      | —             |
| `PORT`                           | no       | `3000`        |
| `NODE_ENV`                       | no       | `development` |
| `DATABASE_SSL`                   | no       | `false`       |
| `DATABASE_POOL_MAX`              | no       | `10`          |
| `DATABASE_CONNECTION_TIMEOUT_MS` | no       | `5000`        |
| `DATABASE_QUERY_TIMEOUT_MS`      | no       | `5000`        |

The service fails fast at startup if `DATABASE_URL` is missing or a value is invalid.
Configuration values are never logged.

## Run

```bash
npm install
cp .env.example .env   # set DATABASE_URL
npm run build && npm start
curl http://localhost:3000/health
# {"status":"ok","service":"account-management-service","database":"up"}
```

`GET /health` is unauthenticated and always returns `200` while the process is serving.
`database` is `up` or `down` (result of `SELECT 1`); no connection details are exposed.

## Checks

```bash
npm run lint
npm run format:check
npm test
DATABASE_URL=postgres://... npm run verify:ac1          # starts the service and probes /health
DATABASE_URL=postgres://... EXPECT_DATABASE_UP=true npm run verify:ac1   # also requires a reachable DB
```

## Known gaps

- The C3/C4 diagrams and API spec referenced by AC-1 ("on file in Architecture") were not
  available during implementation. No API endpoints or internal module boundaries beyond the
  health check were added; align the structure with those artifacts once accessible.
- OAuth 2.0, JWT, Redis, password hashing and email libraries are intentionally not added yet —
  they belong to follow-up stories.
- This service is not yet wired into `docker-compose.yml`, `k8s/` or CI workflows, which
  currently cover `BACKEND` and `FRONTEND` only.
