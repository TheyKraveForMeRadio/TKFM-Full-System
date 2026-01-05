#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

node scripts/tkfm-wire-owner-boost-checkout-debug-link.cjs "$ROOT"
echo "OK: wired owner debug link (best-effort)"
