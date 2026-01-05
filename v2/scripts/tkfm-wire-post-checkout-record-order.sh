#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"
node scripts/tkfm-wire-post-checkout-record-order.cjs "$ROOT"
echo "OK: post-checkout now records boost order server-side (best-effort)"
