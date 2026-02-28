#!/usr/bin/env bash
# One-time setup: install npm dependencies, ensure ~/.opensprint exists,
# start Docker Postgres, write default databaseUrl to global-settings if missing.
# Run from repo root: npm run setup
# Idempotent; safe to run again.

set -e

echo "==> OpenSprint setup"

npm install

# Ensure ~/.opensprint exists and global-settings has default databaseUrl if missing
npx tsx scripts/ensure-global-settings.ts

# Start Docker Postgres (if docker compose is available)
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo "==> Starting Docker Postgres..."
  if docker compose up -d 2>/dev/null; then
    echo "==> Docker Postgres started (or already running)"
  else
    echo "==> Could not start Docker Postgres. If you use a remote Postgres, configure databaseUrl in ~/.opensprint/global-settings.json"
  fi
else
  echo "==> Docker not found. To use local Postgres, install Docker and run: docker compose up -d"
  echo "    Or configure a remote databaseUrl in ~/.opensprint/global-settings.json"
fi

echo "==> Setup complete. Run: npm run dev"
