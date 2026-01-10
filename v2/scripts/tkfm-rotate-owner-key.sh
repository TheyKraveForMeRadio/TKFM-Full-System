#!/usr/bin/env bash
set -euo pipefail

# TKFM: rotate owner key safely (local + Netlify env + .env)
# Generates a new key, stores it locally, pushes to Netlify env, syncs .env.
#
# Requires netlify CLI logged in + linked site.
#
# Usage:
#   ./scripts/tkfm-rotate-owner-key.sh
#
# After:
#   restart netlify dev
#   open owner-login and paste new key (or it will already be in localStorage from owner pages if you paste once)

ROOT="${1:-.}"
cd "$ROOT"

NEWKEY="$(./scripts/tkfm-gen-owner-key.sh | tr -d '\r\n' | xargs)"
if [ -z "${NEWKEY}" ]; then
  echo "FAIL: could not generate key"
  exit 2
fi

printf "%s" "${NEWKEY}" > .tkfm_owner_key
echo "OK: wrote ./.tkfm_owner_key"

# Sync .env (local dev)
if [ -x ./scripts/tkfm-sync-owner-key-to-dotenv.sh ]; then
  ./scripts/tkfm-sync-owner-key-to-dotenv.sh .
fi

# Push to Netlify env
./scripts/tkfm-netlify-set-owner-key.sh .

echo "DONE: owner key rotated."
echo "RESTART netlify dev:"
echo "  netlify dev --port 8888"
