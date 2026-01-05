#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
node scripts/tkfm-wire-quick-checkout-owner-pages.cjs "$ROOT"
