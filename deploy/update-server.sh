#!/usr/bin/env bash
# Update the running server to the latest main. Run ON the server, from the repository checkout:
#   bash deploy/update-server.sh
# Migrations are applied by the api container on start (prisma migrate deploy); secrets stay in deploy/.env.
set -euo pipefail

cd "$(dirname "$0")/.."
DOMAIN="${DOMAIN:-my-desk.tajriba24.uz}"

echo "== Fetching main =="
git fetch origin main
git checkout main
git pull --ff-only origin main
echo "Now at $(git rev-parse --short HEAD): $(git log -1 --pretty=%s)"

echo "== Rebuilding api =="
cd deploy
test -f .env || { echo "deploy/.env is missing — create it first (see .env.example)"; exit 1; }
docker compose --env-file .env up -d --build api

echo "== Waiting for health =="
for i in $(seq 1 30); do
  if docker compose --env-file .env exec -T api node -e "fetch('http://127.0.0.1:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
    echo "api is healthy"; break
  fi
  [ "$i" = 30 ] && { echo "api did not become healthy"; docker compose --env-file .env logs --tail=80 api; exit 1; }
  sleep 4
done

echo "== Applied migrations =="
docker compose --env-file .env exec -T postgres psql -U ishmaydoni -d ishmaydoni -Atc 'select migration_name from _prisma_migrations order by started_at' || true

echo "== Public check =="
curl -fsS "https://$DOMAIN/health" && echo
docker image prune -f >/dev/null
echo "Done."
