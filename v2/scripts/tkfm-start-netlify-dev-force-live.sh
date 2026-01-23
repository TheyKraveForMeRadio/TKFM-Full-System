#!/usr/bin/env bash
set -euo pipefail

# TKFM: Force Netlify Dev to run with LIVE Stripe key (override any sk_test)
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Missing .env in $(pwd)"
  exit 1
fi

LIVE_KEY="$(python - <<'PY'
import re, pathlib
txt = pathlib.Path(".env").read_text(encoding="utf-8", errors="ignore").replace("\r","")
m = re.search(r'^STRIPE_SECRET_KEY=(.+)$', txt, flags=re.M)
print((m.group(1).strip() if m else ""))
PY
)"

if [ -z "${LIVE_KEY:-}" ]; then
  echo "Missing STRIPE_SECRET_KEY in .env"
  exit 1
fi

case "$LIVE_KEY" in
  sk_live_*) echo "OK: .env has LIVE Stripe key";;
  *) echo "STOP: .env STRIPE_SECRET_KEY is not LIVE"; exit 1;;
esac

# Force override any existing key in this shell
unset STRIPE_SECRET_KEY
export STRIPE_SECRET_KEY="$LIVE_KEY"

echo "FORCED STRIPE_SECRET_KEY prefix: ${STRIPE_SECRET_KEY:0:12}…"

netlify dev --port 8888
