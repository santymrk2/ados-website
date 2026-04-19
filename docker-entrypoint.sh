#!/bin/bash
set -e

echo "Waiting for database to be ready..."
until pg_isready -Uados -dados; do
    echo "Database is unavailable - sleeping"
    sleep 2
done

echo "Database is ready!"

echo "Running migrations..."
# Run SQL to create tables if they don't exist
psql -Uados -dados -f /app/init.sql || true

echo "Starting Next.js..."
exec "$@"