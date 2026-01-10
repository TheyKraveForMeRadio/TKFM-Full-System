#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify Owner Approve → Featured pipeline =="

fail=0
need(){ [ -f "$1" ] || { echo "FAIL missing $1"; fail=1; }; }

need "netlify/functions/paid-lane-approve.js"
need "scripts/patch-media-feature-get-store-key.sh"
need "scripts/patch-owner-paid-lane-inbox-approve.sh"
need "scripts/install-owner-approve-featured.sh"
need "scripts/verify-owner-approve-featured.sh"

if [ -f "owner-paid-lane-inbox.html" ]; then
  grep -qi "paid-lane-approve" owner-paid-lane-inbox.html || { echo "FAIL inbox missing approve wiring"; fail=1; }
else
  echo "WARN owner-paid-lane-inbox.html not found (install inbox patch first)."
fi

if [ "$fail" -eq 0 ]; then
  echo "RESULT OK"
else
  echo "RESULT FAIL"
  exit 1
fi
