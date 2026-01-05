#!/usr/bin/env bash
set -euo pipefail

# TKFM: Wire Boost CTAs into core pages (idempotent)
# Usage: ./scripts/tkfm-wire-boost-cta-pages.sh .

ROOT="${1:-.}"
cd "$ROOT"

node scripts/tkfm-wire-boost-cta-pages.cjs "$ROOT"

echo "OK: boost CTA wiring attempted"
