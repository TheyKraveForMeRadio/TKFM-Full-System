#!/usr/bin/env bash
set -euo pipefail
echo "== TKFM: Fix some buttons still failing (dynamic env mapping + inject checkout script) =="
BACKUP_DIR="backups/fix-buttons-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR/netlify/functions" "$BACKUP_DIR/js"
[ -f "netlify/functions/create-checkout-session.js" ] && cp "netlify/functions/create-checkout-session.js" "$BACKUP_DIR/netlify/functions/create-checkout-session.js"
[ -f "js/tkfm-quick-checkout.js" ] && cp "js/tkfm-quick-checkout.js" "$BACKUP_DIR/js/tkfm-quick-checkout.js"
echo "✅ Backups saved to $BACKUP_DIR"
echo "✅ Patch files are in place. Next:"
echo "   chmod +x scripts/inject-quick-checkout-all-pages.sh scripts/test-checkout-planids.sh"
echo "   ./scripts/inject-quick-checkout-all-pages.sh"
echo "   (restart netlify dev)"
