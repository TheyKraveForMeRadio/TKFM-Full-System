#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify Paid Lane End-to-End files =="

fail=0

need() { [ -f "$1" ] || { echo "FAIL missing $1"; fail=1; }; }

need "js/tkfm-paid-lane-modal.js"
need "netlify/functions/paid-lane-submit.js"
need "netlify/functions/paid-lane-list.js"
need "netlify/functions/paid-lane-update.js"
need "netlify/functions/media-feature-add.js"
need "owner-paid-lane-inbox.html"

# Basic sanity strings
grep -q "paid-lane-submit" js/tkfm-paid-lane-modal.js || { echo "FAIL modal not pointing to paid-lane-submit"; fail=1; }
grep -q "paid_lane_submissions" netlify/functions/paid-lane-submit.js || { echo "FAIL submit store key missing"; fail=1; }
grep -q "featured_media" netlify/functions/paid-lane-update.js || { echo "FAIL featured store write missing"; fail=1; }

echo
if [ "$fail" -eq 0 ]; then
  echo "RESULT OK"
else
  echo "RESULT FAIL=$fail"
  exit 1
fi
