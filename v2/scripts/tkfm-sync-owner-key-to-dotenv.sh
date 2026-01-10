#!/usr/bin/env bash
set -euo pipefail

# TKFM: ensure local .env has TKFM_OWNER_KEY matching your local keyfile
# Fixes localhost Unauthorized when functions check process.env.TKFM_OWNER_KEY
#
# Usage:
#   ./scripts/tkfm-set-owner-key.sh --clipboard
#   ./scripts/tkfm-sync-owner-key-to-dotenv.sh
#
# Safe: updates/creates only TKFM_OWNER_KEY line in .env (keeps everything else)

ROOT="${1:-.}"
cd "$ROOT"

KEY="$(./scripts/tkfm-owner-key.sh | tr -d '\r\n' | xargs || true)"
if [ -z "${KEY}" ]; then
  echo "FAIL: missing owner key (set with ./scripts/tkfm-set-owner-key.sh --clipboard)"
  exit 2
fi

touch .env

if grep -qE '^TKFM_OWNER_KEY=' .env; then
  perl -0777 -pe "s/^TKFM_OWNER_KEY=.*$/TKFM_OWNER_KEY=${KEY}/m" -i .env
else
  echo "" >> .env
  echo "TKFM_OWNER_KEY=${KEY}" >> .env
fi

echo "OK: .env synced (TKFM_OWNER_KEY)"
