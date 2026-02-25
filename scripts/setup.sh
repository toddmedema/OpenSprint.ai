#!/usr/bin/env bash
# One-time setup: install npm dependencies.
# Run from repo root: npm run setup
# Idempotent; safe to run again.

set -e

echo "==> OpenSprint setup"

npm install

echo "==> Setup complete. Run: npm run dev"
