#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"
node scripts/tkfm-wire-post-checkout-boost.cjs "$ROOT"
echo "OK: post-checkout boost wiring checked"
