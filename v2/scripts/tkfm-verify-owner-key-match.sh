#!/usr/bin/env bash
set -euo pipefail

# TKFM: Verify local vs Netlify owner key match (prints short SHA)
#
# Usage:
#   ./scripts/tkfm-verify-owner-key-match.sh .
#
ROOT="${1:-.}"
cd "$ROOT"

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found. Install: npm i -g netlify-cli"
  exit 2
fi

NET="$(netlify env:get TKFM_OWNER_KEY 2>/dev/null || true)"
NET="$(printf "%s" "$NET" | tr -d '\r\n')"

LOC=""
if [ -f ./.tkfm_owner_key ]; then
  LOC="$(cat ./.tkfm_owner_key | tr -d '\r\n')"
fi
if [ -z "$LOC" ] && [ -f .env ]; then
  LOC="$(grep -E '^TKFM_OWNER_KEY=' .env | head -n 1 | cut -d= -f2- | tr -d '\r\n')"
fi

sha12 () {
  node - <<'NODE'
import crypto from 'node:crypto';
import fs from 'node:fs';
const s = process.env.S || '';
process.stdout.write(crypto.createHash('sha256').update(String(s)).digest('hex').slice(0,12));
NODE
}

if [ -z "$NET" ]; then
  echo "FAIL: Netlify env TKFM_OWNER_KEY missing"
  exit 3
fi
if [ -z "$LOC" ]; then
  echo "FAIL: local key missing (.tkfm_owner_key or .env)"
  exit 4
fi

export S="$NET"
NETSHA="$(sha12)"
export S="$LOC"
LOCSHA="$(sha12)"

echo "NET_SHA=$NETSHA"
echo "LOC_SHA=$LOCSHA"

if [ "$NET" = "$LOC" ]; then
  echo "OK: keys match"
else
  echo "FAIL: keys differ"
  echo "Fix option A (recommended): ./scripts/tkfm-owner-key-sync-from-netlify.sh ."
  echo "Fix option B: ./scripts/tkfm-owner-key-push-to-netlify.sh ."
  exit 5
fi
