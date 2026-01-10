#!/usr/bin/env bash
set -euo pipefail

# TKFM: AUTO-FIX Owner Unauthorized (local key != Netlify env)
# Strategy (fastest): PUSH your LOCAL key into Netlify env so expected==provided.
#
# Requirements:
#   - netlify CLI installed
#   - netlify login
#   - netlify link (site linked)
#   - local key present via:
#       ./scripts/tkfm-set-owner-key.sh --clipboard
#
# Usage:
#   ./scripts/tkfm-fix-owner-key-mismatch.sh .
#
# After running:
#   RESTART netlify dev:
#     netlify dev --port 8888
#   Then verify:
#     ./scripts/tkfm-owner-auth-check.sh http://localhost:8888

ROOT="${1:-.}"
cd "$ROOT"

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found"
  exit 2
fi

if [ ! -x "./scripts/tkfm-owner-key.sh" ]; then
  echo "FAIL: scripts/tkfm-owner-key.sh missing (install Owner Keyfile patch first)"
  exit 3
fi

KEY="$(./scripts/tkfm-owner-key.sh | tr -d '\r\n' | xargs || true)"
if [ -z "${KEY}" ]; then
  echo "FAIL: local owner key missing. Run:"
  echo "  ./scripts/tkfm-set-owner-key.sh --clipboard"
  exit 4
fi

echo "== NETLIFY STATUS =="
netlify status || true
echo

echo "== SET Netlify env TKFM_OWNER_KEY =="
netlify env:set TKFM_OWNER_KEY "${KEY}" >/dev/null 2>&1 || true

for ctx in production deploy-preview branch-deploy dev; do
  netlify env:set TKFM_OWNER_KEY "${KEY}" --context "$ctx" >/dev/null 2>&1 || true
done

for scope in production deploy-preview branch-deploy; do
  netlify env:set TKFM_OWNER_KEY "${KEY}" --scope "$scope" >/dev/null 2>&1 || true
done

echo "OK: pushed TKFM_OWNER_KEY to Netlify (best-effort across contexts)"
echo "NEXT: restart netlify dev so env reloads:"
echo "  netlify dev --port 8888"
