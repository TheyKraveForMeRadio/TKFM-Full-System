#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"
node scripts/tkfm-wire-boost-orders-into-analytics.cjs "$ROOT"
echo "OK: wired boost orders panel into owner-boost-analytics.html (best-effort)"
