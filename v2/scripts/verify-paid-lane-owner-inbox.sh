#!/usr/bin/env bash
set -euo pipefail
echo "== TKFM: Verify Paid-Lane Owner Inbox install =="

req=(
  "owner-paid-lane-inbox.html"
  "js/tkfm-paid-lane-inbox.js"
  "netlify/functions/_tkfm_store.js"
  "netlify/functions/paid-lane-submit.js"
  "netlify/functions/paid-lane-list.js"
  "netlify/functions/paid-lane-update.js"
)

fail=0
for f in "${req[@]}"; do
  if [ -f "$f" ]; then
    echo "OK   $f"
  else
    echo "FAIL missing $f"
    fail=1
  fi
done

if [ "$fail" -eq 0 ]; then
  echo "RESULT OK"
else
  exit 1
fi
