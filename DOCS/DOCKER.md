# Running the User Management Service with Docker

This is an alternative to `DOCS/RUN_APPLICATION.md` — instead of running the backend, frontend, and Redis manually in separate terminals, `docker compose` builds and runs all three together.

```
UMS/
  BACKEND/Dockerfile          - multi-stage build: compiles TypeScript, ships a slim runtime image
  BACKEND/.dockerignore
  FRONTEND/Dockerfile         - multi-stage build: vite build, served by nginx
  FRONTEND/nginx.conf         - SPA fallback routing for the React Router app
  FRONTEND/.dockerignore
  docker-compose.yml          - wires up redis + backend + frontend
```


## Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)
- A `BACKEND/.env` file (copy from `BACKEND/.env.example` and fill in real secrets for SendGrid/OTP/Admin — the compose setup reads this file directly via `env_file`)

## What `docker-compose.yml` runs

| Service    | Built from            | Exposed on | Notes |
|------------|------------------------|------------|-------|
| `redis`    | `redis:7-alpine`       | (internal) | Persists to a named volume (`redis-data`); backend waits on its healthcheck before starting |
| `backend`  | `./BACKEND/Dockerfile` | `localhost:3000` | Loads `BACKEND/.env`, but `REDIS_URL` and `DATABASE_PATH` are overridden to point at the `redis` service and a container volume (`backend-data`) so they don't need to match your local dev values |
| `frontend` | `./FRONTEND/Dockerfile`| `localhost:5173` | Built with `VITE_API_BASE_URL=http://localhost:3000` baked in at build time (browser calls the backend directly on the host-mapped port, not through the Docker network) |

Migrations run automatically on backend container startup, same as local dev (`src/db/migrate.ts` — see `RUN_APPLICATION.md`'s startup-order section) — no separate migration step is needed.

## Starting everything

```powershell
cd UMS
docker compose up --build
```

First run builds both images (the backend stage installs `python3 make g++` to compile the `better-sqlite3` native module — this is normal and only happens once per image build). Subsequent runs reuse cached layers unless `package.json`/source files changed.

Expected startup log (backend):
```
User Management Service listening on port 3000
```

Run in the background instead: `docker compose up --build -d`, then follow logs with `docker compose logs -f backend`.

## Verifying it's running

```powershell
curl http://localhost:3000/health
# {"status":"ok","db_reachable":true}
```

Open `http://localhost:5173` in a browser for the frontend.

## Stopping / cleaning up

```powershell
docker compose down            # stop containers, keep volumes (SQLite data + Redis data survive)
docker compose down -v         # also remove volumes — wipes the SQLite database and Redis data
```

## Rebuilding after code changes

```powershell
docker compose up --build backend    # rebuild + restart just the backend
docker compose up --build frontend   # rebuild + restart just the frontend
```

## Data persistence

The SQLite database file lives inside the `backend-data` named volume at `/app/data/app.db` inside the container (mapped from `DATABASE_PATH`). It is **not** the same file as `BACKEND/data/app.db` used by local (non-Docker) dev — the two setups don't share data. To inspect the containerized database file directly:

```powershell
docker compose exec backend sh -c "ls -la /app/data"
```

## Differences from local (non-Docker) dev

- Redis is provided by the `redis` container — no separate local Redis install needed.
- The backend's build stage compiles TypeScript inside the image (`npm run build`); you don't need Node installed on the host to run this way.
- `FRONTEND_ORIGIN` (in `BACKEND/.env`) still controls CORS the same way as local dev — set it to `http://localhost:5173` to lock it down, or leave empty to allow any origin.
- Changing `VITE_API_BASE_URL` requires rebuilding the frontend image (`docker compose up --build frontend`) since Vite inlines env vars at build time, not runtime.

See `DOCS/RUN_APPLICATION.md` for the non-Docker workflow, and `DOCS/API_REFERENCE.md` for the full endpoint list.
