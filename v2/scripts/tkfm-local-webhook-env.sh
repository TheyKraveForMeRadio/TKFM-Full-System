#!/usr/bin/env bash
# Local-only helper: sets env so Stripe CLI triggers can simulate awards while staying LIVE.

export TKFM_WEBHOOK_INSECURE_LOCAL=1
export TKFM_WEBHOOK_LOCAL_DEFAULT_SPONSOR_LOOKUP_KEY=sponsor_read_5pack
export TKFM_WEBHOOK_LOCAL_DEFAULT_DROPS_LOOKUP_KEY=drop_pack_10

# Auto-pick an existing customerId from sponsor credits folder (if any)
CUS=$(ls -1 .tkfm_store/sponsor/credits/cus_*.json 2>/dev/null | head -n 1 | sed 's/.*\/\(cus_[^\/]*\)\.json/\1/' || true)
if [ -n "${CUS:-}" ]; then
  export TKFM_WEBHOOK_LOCAL_DEFAULT_CUSTOMER_ID="$CUS"
fi

echo "TKFM local webhook env set:"
echo "  TKFM_WEBHOOK_INSECURE_LOCAL=$TKFM_WEBHOOK_INSECURE_LOCAL"
echo "  TKFM_WEBHOOK_LOCAL_DEFAULT_CUSTOMER_ID=${TKFM_WEBHOOK_LOCAL_DEFAULT_CUSTOMER_ID:-"(missing)"}"
echo "  TKFM_WEBHOOK_LOCAL_DEFAULT_SPONSOR_LOOKUP_KEY=$TKFM_WEBHOOK_LOCAL_DEFAULT_SPONSOR_LOOKUP_KEY"
echo "  TKFM_WEBHOOK_LOCAL_DEFAULT_DROPS_LOOKUP_KEY=$TKFM_WEBHOOK_LOCAL_DEFAULT_DROPS_LOOKUP_KEY"
