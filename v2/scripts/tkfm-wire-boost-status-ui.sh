#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"
node scripts/tkfm-wire-boost-status-ui.cjs "$ROOT"
echo "OK: boost status UI wired (best-effort)"
