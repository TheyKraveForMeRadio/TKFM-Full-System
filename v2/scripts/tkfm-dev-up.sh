#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Auto-load local env (DO NOT COMMIT)
if [ -f .env.local ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ""|\#*) continue ;;
    esac
    key="${line%%=*}"
    val="${line#*=}"
    key="$(echo "$key" | tr -d '[:space:]')"
    if [ -n "$key" ]; then
      export "$key=$val"
    fi
  done < .env.local
fi

node scripts/tkfm-dev-up.mjs
