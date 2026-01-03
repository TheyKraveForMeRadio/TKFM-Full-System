#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM PATCH: Featured TV Rotator Smart Play + Podcast Lane API params =="

# Backups
ts="$(date +%Y%m%d_%H%M%S)"
mkdir -p backups

if [ -f "js/tkfm-featured-tv-rotator.js" ]; then
  cp -f "js/tkfm-featured-tv-rotator.js" "backups/tkfm-featured-tv-rotator.js.bak_${ts}"
fi

if [ -f "js/tkfm-featured-podcast-lane.js" ]; then
  cp -f "js/tkfm-featured-podcast-lane.js" "backups/tkfm-featured-podcast-lane.js.bak_${ts}"
fi

echo "Backups saved in ./backups"

echo "Checking radio-tv.html for expected player ids..."
if ! grep -q 'id="tvFrame"' radio-tv.html; then
  echo "WARN: radio-tv.html does not contain iframe#tvFrame (podcast lane click target)."
fi

if ! grep -q 'id="featuredTvFrame"' radio-tv.html; then
  echo "WARN: radio-tv.html does not contain iframe#featuredTvFrame (Featured TV top player)."
  echo "      If you didn't apply the Featured TV embed patch yet, apply it first."
fi

echo "Done."
