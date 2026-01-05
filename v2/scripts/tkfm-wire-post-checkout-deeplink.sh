#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
node scripts/tkfm-wire-post-checkout-deeplink.cjs "$ROOT"
