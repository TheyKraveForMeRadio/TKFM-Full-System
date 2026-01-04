#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
cd "$ROOT"

node scripts/tkfm-wire-owner-auto-maintenance.cjs "$ROOT"
