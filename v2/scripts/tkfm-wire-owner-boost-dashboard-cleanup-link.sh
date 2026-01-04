#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"
node scripts/tkfm-wire-owner-boost-dashboard-cleanup-link.cjs "$ROOT"
