#!/usr/bin/env bash
set -euo pipefail

# TKFM: fastest fix for your current mismatch
# You already have a local key (clipboard) but Netlify env differs.
# This pushes your LOCAL key into Netlify env so expected==provided.
#
# Usage:
#   ./scripts/tkfm-set-owner-key.sh --clipboard
#   ./scripts/tkfm-fix-owner-unauthorized-fast.sh
#   (restart netlify dev)
#   ./scripts/tkfm-owner-auth-check.sh http://localhost:8888

ROOT="${1:-.}"
cd "$ROOT"

./scripts/tkfm-netlify-set-owner-key.sh .

echo "STOP and RESTART netlify dev now:"
echo "  netlify dev --port 8888"
