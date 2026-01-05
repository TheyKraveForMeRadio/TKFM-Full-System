#!/usr/bin/env bash
set -euo pipefail

# TKFM: Push local owner key to Netlify env (so Netlify matches your local key)
# Reads from ./.tkfm_owner_key or TKFM_OWNER_KEY in .env
#
# Usage:
#   ./scripts/tkfm-owner-key-push-to-netlify.sh .
#
ROOT="${1:-.}"
cd "$ROOT"

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found. Install: npm i -g netlify-cli"
  exit 2
fi

KEY=""
if [ -f ./.tkfm_owner_key ]; then
  KEY="$(cat ./.tkfm_owner_key | tr -d '\r\n')"
fi

if [ -z "$KEY" ] && [ -f .env ]; then
  KEY="$(grep -E '^TKFM_OWNER_KEY=' .env | head -n 1 | cut -d= -f2- | tr -d '\r\n')"
fi

if [ -z "$KEY" ]; then
  echo "FAIL: no local key found. Create ./.tkfm_owner_key or set TKFM_OWNER_KEY in .env"
  exit 3
fi

netlify env:set TKFM_OWNER_KEY "$KEY" >/dev/null
echo "OK: Netlify env set TKFM_OWNER_KEY"
echo "NEXT: restart dev: netlify dev --port 8888"
