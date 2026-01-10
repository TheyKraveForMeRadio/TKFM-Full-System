#!/usr/bin/env bash
set -euo pipefail

# TKFM: set Netlify env TKFM_OWNER_KEY from your local keyfile/env
# This fixes your mismatch where Netlify Dev injects site env and overrides .env.
#
# Requires:
#   netlify login
#   netlify link (site linked)
#
# Usage:
#   ./scripts/tkfm-set-owner-key.sh --clipboard     # or paste key
#   ./scripts/tkfm-netlify-set-owner-key.sh
#
# After setting, RESTART netlify dev:
#   netlify dev --port 8888

ROOT="${1:-.}"
cd "$ROOT"

KEY="$(./scripts/tkfm-owner-key.sh | tr -d '\r\n' | xargs || true)"
if [ -z "${KEY}" ]; then
  echo "FAIL: missing owner key. Set it first:"
  echo "  ./scripts/tkfm-set-owner-key.sh --clipboard"
  exit 2
fi

# Try common CLI variants (ignore failures where flags differ)
echo "== netlify env:set TKFM_OWNER_KEY (default) =="
netlify env:set TKFM_OWNER_KEY "${KEY}" >/dev/null 2>&1 && echo "OK" || echo "WARN: default env:set failed (trying contexts)"

echo "== netlify env:set TKFM_OWNER_KEY --context production =="
netlify env:set TKFM_OWNER_KEY "${KEY}" --context production >/dev/null 2>&1 && echo "OK" || true
echo "== netlify env:set TKFM_OWNER_KEY --context deploy-preview =="
netlify env:set TKFM_OWNER_KEY "${KEY}" --context deploy-preview >/dev/null 2>&1 && echo "OK" || true
echo "== netlify env:set TKFM_OWNER_KEY --context branch-deploy =="
netlify env:set TKFM_OWNER_KEY "${KEY}" --context branch-deploy >/dev/null 2>&1 && echo "OK" || true
echo "== netlify env:set TKFM_OWNER_KEY --context dev =="
netlify env:set TKFM_OWNER_KEY "${KEY}" --context dev >/dev/null 2>&1 && echo "OK" || true

# Some CLIs use --scope instead of --context
echo "== netlify env:set TKFM_OWNER_KEY --scope production =="
netlify env:set TKFM_OWNER_KEY "${KEY}" --scope production >/dev/null 2>&1 && echo "OK" || true
echo "== netlify env:set TKFM_OWNER_KEY --scope deploy-preview =="
netlify env:set TKFM_OWNER_KEY "${KEY}" --scope deploy-preview >/dev/null 2>&1 && echo "OK" || true
echo "== netlify env:set TKFM_OWNER_KEY --scope branch-deploy =="
netlify env:set TKFM_OWNER_KEY "${KEY}" --scope branch-deploy >/dev/null 2>&1 && echo "OK" || true

echo "OK: attempted to set Netlify env TKFM_OWNER_KEY from local key"
echo "NEXT: restart netlify dev (env loads on start)"
