#!/usr/bin/env bash
# Resets the local dev Postgres so its password matches .env,
# without needing to touch Docker daemon DNS settings.
set -e

echo "Stopping any running containers for this project..."
docker compose down 2>/dev/null || true

echo "Finding and removing any stray postgres container/volume from old runs..."
OLD_CONTAINER=$(docker ps -aq --filter "name=postgres")
if [ -n "$OLD_CONTAINER" ]; then
  docker stop $OLD_CONTAINER 2>/dev/null || true
  docker rm $OLD_CONTAINER 2>/dev/null || true
fi

OLD_VOLUME=$(docker volume ls -q | grep postgres_data || true)
if [ -n "$OLD_VOLUME" ]; then
  echo "Removing old volume: $OLD_VOLUME"
  docker volume rm $OLD_VOLUME
fi

echo "Starting fresh postgres + redis..."
docker compose up -d postgres redis

echo "Done. Postgres now matches DB_USER/DB_PASSWORD in .env."
echo "Run 'docker compose up -d api' (or npm run start:dev) next."
