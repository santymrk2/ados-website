#!/usr/bin/env bash
# Runs scripts/test-concurrency.ts against a disposable Postgres container.
set -euo pipefail
NAME=ados-concurrency-pg
PORT=${TEST_DB_PORT:-55439}
export TEST_DATABASE_URL="postgres://postgres:pw@localhost:${PORT}/ados"
docker run -d --rm --name "$NAME" -e POSTGRES_PASSWORD=pw -e POSTGRES_DB=ados -p "${PORT}:5432" postgres:16-alpine >/dev/null
trap 'docker stop "$NAME" >/dev/null' EXIT
until docker exec "$NAME" pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
sleep 1
DATABASE_URL="$TEST_DATABASE_URL" bunx drizzle-kit push --force >/dev/null
bun run scripts/test-concurrency.ts
