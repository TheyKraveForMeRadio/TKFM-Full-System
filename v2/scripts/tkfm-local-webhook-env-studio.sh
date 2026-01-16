#!/usr/bin/env bash
# Local-only helper: simulate Studio webhook awards while keeping your normal LIVE key env.
export TKFM_WEBHOOK_INSECURE_LOCAL=1
export TKFM_WEBHOOK_LOCAL_DEFAULT_STUDIO_LOOKUP_KEY=label_studio_credits_25

# Try to pick a known customerId from sponsor credits as a convenient default
CUS=$(ls -1 .tkfm_store/sponsor/credits/cus_*.json 2>/dev/null | head -n 1 | sed 's/.*\/\(cus_[^\/]*\)\.json/\1/' || true)
if [ -n "${CUS:-}" ]; then
  export TKFM_WEBHOOK_LOCAL_DEFAULT_CUSTOMER_ID="$CUS"
fi

echo "TKFM Studio local webhook env set:"
echo "  TKFM_WEBHOOK_INSECURE_LOCAL=$TKFM_WEBHOOK_INSECURE_LOCAL"
echo "  TKFM_WEBHOOK_LOCAL_DEFAULT_STUDIO_LOOKUP_KEY=$TKFM_WEBHOOK_LOCAL_DEFAULT_STUDIO_LOOKUP_KEY"
echo "  TKFM_WEBHOOK_LOCAL_DEFAULT_CUSTOMER_ID=${TKFM_WEBHOOK_LOCAL_DEFAULT_CUSTOMER_ID:-"(missing)"}"
