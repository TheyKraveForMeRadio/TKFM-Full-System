#!/usr/bin/env bash
set -euo pipefail

# TKFM: one-command flow:
# 1) Save local key from clipboard
# 2) Push it to Netlify env (fix mismatch)
# 3) Sync .env for local dev
# 4) Print verify command (run after restarting netlify dev)

ROOT="${1:-.}"
cd "$ROOT"

chmod +x scripts/tkfm-set-owner-key.sh scripts/tkfm-owner-key.sh scripts/tkfm-sync-owner-key-to-dotenv.sh scripts/tkfm-owner-auth-check.sh scripts/tkfm-fix-owner-key-mismatch.sh 2>/dev/null || true

./scripts/tkfm-set-owner-key.sh --clipboard
./scripts/tkfm-sync-owner-key-to-dotenv.sh .
./scripts/tkfm-fix-owner-key-mismatch.sh .

echo "STOP and RESTART netlify dev now:"
echo "  netlify dev --port 8888"
echo "THEN VERIFY:"
echo "  ./scripts/tkfm-owner-auth-check.sh http://localhost:8888"
