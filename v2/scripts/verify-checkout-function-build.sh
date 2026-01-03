#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== TKFM: Verify create-checkout-session.js parses =="
node --check netlify/functions/create-checkout-session.js

echo "== TKFM: Quick local ping (optional) =="
echo "If netlify dev is running on :8888 this should return ok:true or a mapping error:"
curl -s "http://localhost:8888/.netlify/functions/create-checkout-session" \
  -X POST -H "content-type: application/json" \
  -d '{"planId":"video_monthly_visuals","email":"test@example.com"}' | head -c 240; echo
