#!/usr/bin/env bash
# AC-1 evidence: build the service, start it with environment-based
# configuration only, and assert GET /health responds 200.
# Requires DATABASE_URL in the environment (or .env). Set
# EXPECT_DATABASE_UP=true to also require a reachable PostgreSQL.
set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"
export PORT

npm run build >/dev/null

node dist/server.js &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  if BODY="$(curl -fsS "http://127.0.0.1:${PORT}/health" 2>/dev/null)"; then
    echo "GET /health -> 200 ${BODY}"
    if [[ "${EXPECT_DATABASE_UP:-false}" == "true" && "$BODY" != *'"database":"up"'* ]]; then
      echo "AC-1 FAILED: database not reachable" >&2
      exit 1
    fi
    echo "AC-1 PASSED"
    exit 0
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "AC-1 FAILED: service exited during startup" >&2
    exit 1
  fi
  sleep 1
done

echo "AC-1 FAILED: /health did not respond" >&2
exit 1
