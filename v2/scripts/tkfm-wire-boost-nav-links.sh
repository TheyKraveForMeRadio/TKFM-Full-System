#!/usr/bin/env bash
set -euo pipefail

# TKFM: Wire Rotation Boost nav link across key pages (idempotent)
# Usage: ./scripts/tkfm-wire-boost-nav-links.sh .

ROOT="${1:-.}"
cd "$ROOT"
node scripts/tkfm-wire-boost-nav-links.cjs "$ROOT"
echo "OK: boost nav link wiring attempted"
