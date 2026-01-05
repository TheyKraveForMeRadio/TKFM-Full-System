#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"
node scripts/tkfm-wire-owner-boost-analytics-link.cjs "$ROOT"
