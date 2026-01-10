#!/usr/bin/env bash
set -euo pipefail

# TKFM: one-command fix for your current state:
# expected_sha != provided_sha
#
# It pulls TKFM_OWNER_KEY from Netlify env (authoritative) → sets local keyfile → syncs .env
# Then checks auth on localhost.

ROOT="${1:-.}"
cd "$ROOT"

./scripts/tkfm-pull-owner-key-from-netlify.sh .

echo "RESTART netlify dev NOW:"
echo "  (stop) then: netlify dev --port 8888"

echo "WHEN netlify dev is running, run:"
echo "  ./scripts/tkfm-owner-auth-check.sh http://localhost:8888"
