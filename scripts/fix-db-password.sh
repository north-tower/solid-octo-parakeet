#!/usr/bin/env sh
# Resync the postgres user password with POSTGRES_PASSWORD from .env (default: postgres).
# Works via local socket auth inside the db container — no volume wipe needed.
set -eu

cd "$(dirname "$0")/.."

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

if [ -f .env ]; then
  # shellcheck disable=SC1091
  set -a
  . ./.env
  set +a
  POSTGRES_USER="${POSTGRES_USER:-postgres}"
  POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
fi

echo "Setting password for PostgreSQL user: ${POSTGRES_USER}"

docker compose exec db psql -U "${POSTGRES_USER}" -d postgres -c \
  "ALTER USER \"${POSTGRES_USER}\" WITH PASSWORD '${POSTGRES_PASSWORD}';"

echo "Restarting app..."
docker compose restart app
docker compose logs -f app
