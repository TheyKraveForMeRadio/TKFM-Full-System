#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

node scripts/tkfm-wire-boost-checkout-interceptor.cjs "$ROOT"
echo "OK: wired boost checkout interceptor (best-effort)"
