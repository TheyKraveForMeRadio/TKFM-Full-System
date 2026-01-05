#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"
node scripts/tkfm-wire-dashboard-pill-links.cjs "$ROOT"
echo "OK: dashboard pill wiring attempted"
