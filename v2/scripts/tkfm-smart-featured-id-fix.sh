#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

node scripts/tkfm-smart-featured-id-fix.cjs "$ROOT"
