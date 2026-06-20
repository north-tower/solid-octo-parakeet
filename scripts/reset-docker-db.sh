#!/usr/bin/env sh
# Nuclear option: delete the Postgres volume and recreate from scratch.
# All database data will be lost.
set -eu

cd "$(dirname "$0")/.."

echo "Stopping containers and removing volumes..."
docker compose down -v --remove-orphans

echo "Checking for leftover postgres volumes..."
docker volume ls | grep -E 'postgres|solid-octo-parakeet' || true

echo "Starting fresh stack..."
docker compose up --build -d

echo "Waiting for app startup..."
sleep 5
docker compose logs app --tail 40
