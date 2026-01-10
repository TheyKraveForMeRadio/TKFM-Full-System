#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/paid-lane-e2e-feature-$STAMP"
mkdir -p "$BK" js netlify/functions

echo "== TKFM: Paid Lane End-to-End (Modal -> Inbox -> Featured TV) =="
echo "Backup dir: $BK"
echo

# Backup existing files if present
for f in \
  js/tkfm-paid-lane-modal.js \
  netlify/functions/paid-lane-submit.js \
  netlify/functions/paid-lane-list.js \
  netlify/functions/paid-lane-update.js \
  netlify/functions/media-feature-add.js \
  owner-paid-lane-inbox.html
do
  if [ -f "$f" ]; then
    mkdir -p "$BK/$(dirname "$f")"
    cp -p "$f" "$BK/$f"
  fi
done

echo "OK: backups done"

echo
echo "NOTE:"
echo "- This patch replaces js/tkfm-paid-lane-modal.js with a safe singleton modal (no page wipes)."
echo "- Submits to /.netlify/functions/paid-lane-submit"
echo "- Owner inbox uses /.netlify/functions/paid-lane-list and /paid-lane-update"
echo "- FEATURE action writes into featured store keys used by your TV rotator (featured_media/media_featured/featured_tv)"
echo
echo "DONE."
