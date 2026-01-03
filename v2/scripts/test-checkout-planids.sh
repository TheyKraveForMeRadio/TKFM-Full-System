#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8888}"
EMAIL="${2:-test@example.com}"

echo "== TKFM: Test checkout for common planIds on $BASE_URL =="

PLAN_IDS=(
  "ai_dj_autopilot_monthly"
  "sponsor_autopilot_monthly"
  "submissions_priority_monthly"
  "rotation_boost_campaign"
  "social_starter_monthly"
  "priority_submission_pack"
  "playlist_pitch_pack"
  "press_run_pack"
  "radio_interview_slot"
  "starter_sponsor_monthly"
  "city_sponsor_monthly"
  "takeover_sponsor_monthly"
  "ai_radio_intro"
  "ai_feature_verse_kit"
  "ai_label_brand_pack"
)

ok=0
fail=0

for PID in "${PLAN_IDS[@]}"; do
  RES="$(curl -s "$BASE_URL/.netlify/functions/create-checkout-session" -X POST -H "content-type: application/json" -d "{\"planId\":\"$PID\",\"email\":\"$EMAIL\"}")"
  if echo "$RES" | grep -q '"ok":true'; then
    ok=$((ok+1))
    echo "OK   $PID"
  else
    fail=$((fail+1))
    echo "FAIL $PID  ->  $(echo "$RES" | tr '\n' ' ' | cut -c1-220)"
  fi
done

echo
echo "RESULT: OK=$ok FAIL=$fail"
if [ "$fail" -gt 0 ]; then
  echo "Next step: copy/paste the FAIL lines so we add missing env aliases."
fi
