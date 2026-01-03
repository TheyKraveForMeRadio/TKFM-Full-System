#!/usr/bin/env bash
set -euo pipefail

echo "== VERIFY OWNER GATE FILES =="
ls -la js/tkfm-owner-guard.js js/tkfm-owner-gate-no-redirect.js

echo
echo "== VERIFY PAGES HAVE HEAD SCRIPTS + BODY MOUNT =="
for f in autopilot-engine.html ai-dj-engine.html ai-dj-console.html god-view.html owner-dashboard.html owner-ops-dashboard.html tkfm-dev-console.html; do
  if [ -f "$f" ]; then
    echo "-- $f"
    grep -n "/js/tkfm-owner-guard.js" "$f" || true
    grep -n "/js/tkfm-owner-gate-no-redirect.js" "$f" || true
    grep -n "id=\"tkfmOwnerLock\"" "$f" || true
    echo
  fi
done

echo "== DONE =="
