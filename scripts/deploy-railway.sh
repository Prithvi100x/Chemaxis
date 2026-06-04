#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${RAILWAY_TOKEN:-}" ]]; then
  cat >&2 <<'MSG'
RAILWAY_TOKEN is required.
Create a Railway project token for the target environment, then export it before running this script.
MSG
  exit 1
fi

if ! command -v railway >/dev/null 2>&1; then
  echo "Railway CLI was not found; installing with the official installer..."
  curl -fsSL https://railway.com/install.sh | sh
  export PATH="$HOME/.railway/bin:$PATH"
fi

args=(up --ci)

if [[ -n "${RAILWAY_PROJECT_ID:-}" ]]; then
  args+=(--project "$RAILWAY_PROJECT_ID")
fi

if [[ -n "${RAILWAY_ENVIRONMENT:-}" ]]; then
  args+=(--environment "$RAILWAY_ENVIRONMENT")
fi

if [[ -n "${RAILWAY_SERVICE:-}" ]]; then
  args+=(--service "$RAILWAY_SERVICE")
fi

echo "Deploying ChemAxis to Railway..."
railway "${args[@]}"
