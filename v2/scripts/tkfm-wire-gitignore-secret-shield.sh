#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"
node scripts/tkfm-wire-gitignore-secret-shield.cjs "$ROOT"
echo "OK: .gitignore updated with secret shield block"
