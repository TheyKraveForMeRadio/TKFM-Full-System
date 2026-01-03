#!/usr/bin/env bash
set -euo pipefail

echo "=== TKFM RESTORE: planId + checkout robustness ==="

chmod +x scripts/restore-planid-attrs.sh scripts/patch-create-checkout-session-fallback.sh scripts/verify-planid-buttons.sh

./scripts/restore-planid-attrs.sh
./scripts/patch-create-checkout-session-fallback.sh

echo ""
echo "NOTE: Ensure pages that use checkout have this in <head>:"
echo "  <script src=\"/js/tkfm-quick-checkout.js\"></script>"
echo ""
./scripts/verify-planid-buttons.sh
echo "=== DONE ==="
