#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify the specific buttons you listed =="

echo ""
echo "-- Stripe key prefixes by context (safe) --"
for C in production dev deploy-preview branch-deploy; do
  echo "=== $C ==="
  netlify env:get STRIPE_SECRET_KEY --context $C 2>/dev/null | cut -c1-8 || true
done

echo ""
echo "-- Required env vars (production) --"
REQ=(
  STRIPE_PRICE_AI_LABEL_BRAND_PACK
  STRIPE_PRICE_AI_FEATURE_VERSE_KIT
  STRIPE_PRICE_AI_RADIO_INTRO
  STRIPE_PRICE_TAKEOVER_SPONSOR_MONTHLY
  STRIPE_PRICE_CITY_SPONSOR_MONTHLY
  STRIPE_PRICE_STARTER_SPONSOR_MONTHLY
  STRIPE_PRICE_RADIO_INTERVIEW_SLOT
  STRIPE_PRICE_PRESS_RUN_PACK
  STRIPE_PRICE_PLAYLIST_PITCH_PACK
  STRIPE_PRICE_PRIORITY_SUBMISSION_PACK
  STRIPE_PRICE_SOCIAL_STARTER_MONTHLY
  STRIPE_PRICE_SUBMISSIONS_PRIORITY_MONTHLY
  STRIPE_PRICE_SPONSOR_AUTOPILOT_MONTHLY
  STRIPE_PRICE_AI_DJ_AUTOPILOT_MONTHLY
)

MISSING=0
for V in "${REQ[@]}"; do
  VAL="$(netlify env:get "$V" --context production 2>/dev/null || true)"
  if [ -z "$VAL" ]; then
    echo "MISSING (production): $V"
    MISSING=1
  else
    echo "OK: $V"
  fi
done

echo ""
if [ "$MISSING" -eq 1 ]; then
  echo "❌ Add missing vars in Netlify env (production), then re-run this script."
else
  echo "✅ Production env looks good for the broken buttons."
fi

echo ""
echo "-- Scan pricing.html for those plan ids (if present) --"
if [ -f "pricing.html" ]; then
  grep -nE "ai_label_brand_pack|label_brand_pack|ai_feature_verse_kit|feature_verse_kit|ai_radio_intro|radio_intro|takeover_sponsor|city_sponsor|starter_sponsor|radio_interview_slot|press_run_pack|playlist_pitch_pack|priority_submission_pack|social_starter|rotation_boost|submissions_priority_monthly|sponsor_autopilot_monthly|ai_dj_autopilot_monthly" pricing.html || true
else
  echo "pricing.html not found in current folder."
fi
