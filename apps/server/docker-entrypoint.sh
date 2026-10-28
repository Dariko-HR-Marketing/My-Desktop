#!/bin/sh
set -eu

if [ "${DATA_STORE:-memory}" = "postgres" ]; then
  echo "Applying database migrations..."
  npx prisma migrate deploy
  echo "Seeding catalog and admin..."
  npx tsx prisma/seed.ts
fi

exec "$@"
