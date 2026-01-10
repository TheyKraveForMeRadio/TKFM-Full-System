#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify Paid Lane Singleton + Inbox =="

fail=0
need(){ [ -f "$1" ] || { echo "FAIL missing $1"; fail=1; }; }

need "js/tkfm-paid-lane-modal.js"
need "js/tkfm-paid-lane-submit.js"
need "netlify/functions/paid-lane-submit.js"
need "netlify/functions/paid-lane-list.js"
need "owner-paid-lane-inbox.html"

# ensure no pages still contain injected modal HTML
hits=$(grep -RIn --include="*.html" 'id="tkfmPaidLaneModal"' . | wc -l | tr -d " ")
echo "INFO legacy modal HTML hits: $hits (should be 0 or near 0)"
if [ "$hits" -gt 0 ]; then
  echo "WARN: some pages still contain legacy modal HTML. Run purge again:"
  echo "  ./scripts/purge-legacy-paid-lane-injections.sh"
fi

if [ "$fail" -eq 0 ]; then
  echo "RESULT OK"
else
  echo "RESULT FAIL"
  exit 1
fi
