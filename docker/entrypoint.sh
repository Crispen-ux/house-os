#!/bin/sh
set -e

# -----------------------------------------------------------
# House OS API — Container Entrypoint
#
# 1. Wait for PostgreSQL to accept connections
# 2. Run Prisma migrations (schema → database)
# 3. Start the API server
# -----------------------------------------------------------

echo "[HouseOS] Waiting for database..."

MAX_RETRIES=30
RETRY=0

# Check database reachability using Node's built-in net module.
# Parses DATABASE_URL to extract host:port — zero external packages.
until node -e "
  const url = new URL(process.env.DATABASE_URL);
  require('net').createConnection(
    parseInt(url.port) || 5432,
    url.hostname
  ).on('connect', () => process.exit(0))
   .on('error',  () => process.exit(1));
" 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "[HouseOS] ERROR: Database not ready after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "[HouseOS] Database not ready (attempt $RETRY/$MAX_RETRIES), retrying in 3s..."
  sleep 3
done

echo "[HouseOS] Database is ready. Running Prisma migrations..."

npx prisma db push --skip-generate \
  --schema=/app/packages/database/prisma/schema.prisma \
  2>&1 || echo "[HouseOS] Migration warning (may be no changes needed)"

echo "[HouseOS] Starting API server..."
exec node dist/index.js
