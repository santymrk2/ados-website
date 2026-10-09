#!/usr/bin/env bash
# Demo mode: a throwaway local Postgres with invented data + the dev server.
# No Supabase and no real data involved. Needs Postgres binaries: brew install postgresql@18
# Usage: bun run demo          (start; first run creates and seeds the database)
#        bun run demo:reset    (wipe the demo database and start from scratch)
set -euo pipefail
cd "$(dirname "$0")/.."

DB_PORT="${DEMO_DB_PORT:-55440}"
DB_NAME="ados_demo"
DATA_DIR=".demo/pgdata"
DB_URL="postgresql://demo@127.0.0.1:${DB_PORT}/${DB_NAME}"

for bin in initdb pg_ctl psql pg_isready; do
  command -v "$bin" >/dev/null || {
    echo "Falta '$bin'. Instalá Postgres con: brew install postgresql@18" >&2
    exit 1
  }
done

started_db=false
stop_db() {
  if [ "$started_db" = true ]; then
    echo "Apagando la base demo..."
    pg_ctl -D "$DATA_DIR" stop -m fast >/dev/null 2>&1 || true
  fi
}
trap stop_db EXIT

if [ "${1:-}" = "--reset" ]; then
  pg_ctl -D "$DATA_DIR" stop -m fast >/dev/null 2>&1 || true
  rm -rf .demo
  echo "Base demo borrada."
fi

fresh=false
if [ ! -d "$DATA_DIR" ]; then
  mkdir -p .demo
  initdb -D "$DATA_DIR" -U demo --auth=trust -E UTF8 >/dev/null
  fresh=true
fi

if ! pg_isready -h 127.0.0.1 -p "$DB_PORT" >/dev/null 2>&1; then
  pg_ctl -D "$DATA_DIR" -l .demo/postgres.log -w \
    -o "-p ${DB_PORT} -c listen_addresses=127.0.0.1 -c unix_socket_directories=/tmp" start >/dev/null
  started_db=true
fi

if [ "$fresh" = true ]; then
  echo "Creando base demo con datos de prueba..."
  psql "postgresql://demo@127.0.0.1:${DB_PORT}/postgres" -v ON_ERROR_STOP=1 -qc "create database ${DB_NAME}"
  DATABASE_URL="$DB_URL" bunx drizzle-kit push --force >/dev/null
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f scripts/demo-seed.sql >/dev/null
fi

# Valid throwaway push keys so the notifications screen can be previewed (nothing is ever sent)
if [ ! -f .demo/vapid.env ]; then
  bun -e 'const k = require("web-push").generateVAPIDKeys(); console.log(`VAPID_PUBLIC_KEY=${k.publicKey}\nVAPID_PRIVATE_KEY=${k.privateKey}`)' > .demo/vapid.env
fi
set -a
# shellcheck disable=SC1091
source .demo/vapid.env
set +a

cat <<EOF

  Modo demo (datos inventados, sin Supabase)
  Admin:  contraseña admin-demo
  Viewer: contraseña viewer-demo

EOF

# Process env wins over .env files, so the real database is never touched
DATABASE_URL="$DB_URL" \
AUTH_SECRET="demo-secret-demo-secret-demo-secret-1234" \
ADMIN_PASSWORD="admin-demo" \
VIEWER_PASSWORD="viewer-demo" \
bun run dev
