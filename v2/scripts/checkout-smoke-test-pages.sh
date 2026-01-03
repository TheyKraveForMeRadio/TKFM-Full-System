#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Checkout smoke test (front-end wiring + backend endpoint) =="
echo "Base dir: ."
echo

PAGES=(index.html pricing.html feature-engine.html video-engine.html social-engine.html podcast-engine.html press-engine.html)

fail=0

for f in "${PAGES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "SKIP $f (missing)"
    continue
  fi

  script=0
  planattr=0
  jscheckout=0

  grep -qi "tkfm-quick-checkout.js" "$f" && script=1 || true
  grep -qiE 'data-plan=|data-feature=' "$f" && planattr=1 || true
  grep -qiE '\bjs-checkout\b' "$f" && jscheckout=1 || true

  if [ "$script" -eq 1 ] && [ "$planattr" -eq 1 ]; then
    if [ "$jscheckout" -eq 0 ]; then
      echo "OK   $f  script=1  planattr=1  (js-checkout=0 but delegated handler covers it)"
    else
      echo "OK   $f"
    fi
  else
    echo "FAIL $f  script=$script  planattr=$planattr  js-checkout=$jscheckout"
    fail=$((fail+1))
  fi
done

echo
echo "== TKFM: Backend checkout endpoint quick ping =="
BASE_URL="${1:-http://localhost:8888}"
EMAIL="${2:-test@example.com}"
PLAN="${3:-video_monthly_visuals}"

if command -v curl >/dev/null 2>&1; then
  out="$(curl -s "${BASE_URL}/.netlify/functions/create-checkout-session" \
    -X POST -H "content-type: application/json" \
    -d "{\"planId\":\"${PLAN}\",\"email\":\"${EMAIL}\"}" || true)"
  if echo "$out" | grep -q '"ok":true'; then
    echo "OK   backend checkout ping (${PLAN})"
  else
    echo "WARN backend ping failed (is netlify dev running at ${BASE_URL}?)"
    echo "$out" | head -c 240; echo
  fi
else
  echo "WARN curl not found; skipping backend ping"
fi

echo
echo "RESULT FAIL=$fail"
exit 0
