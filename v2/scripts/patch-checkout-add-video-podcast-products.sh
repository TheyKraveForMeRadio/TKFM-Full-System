#!/usr/bin/env bash
set -euo pipefail

F="netlify/functions/create-checkout-session.js"
if [ ! -f "$F" ]; then
  echo "❌ $F not found. (Run from v2 root; ensure Netlify functions exist.)"
  exit 1
fi

ts="$(date +%Y%m%d_%H%M%S)"
mkdir -p backups
cp "$F" "backups/create-checkout-session.js.bak_${ts}"

# Insert mappings into PRICE_MAP if missing
add_line () {
  local key="$1"
  local env="$2"
  if grep -q "${key}:" "$F"; then
    echo "ℹ️ PRICE_MAP already has ${key}"
    return 0
  fi
  # Add after opening of PRICE_MAP object
  perl -0777 -i -pe "s/(const\\s+PRICE_MAP\\s*=\\s*\\{)/\\1\\n  ${key}: process.env.${env},/s" "$F"
  echo "✅ Added PRICE_MAP ${key} -> ${env}"
}

add_line "video_creator_pass_monthly" "STRIPE_PRICE_VIDEO_CREATOR_PASS_MONTHLY"
add_line "video_monthly_visuals" "STRIPE_PRICE_VIDEO_MONTHLY_VISUALS"
add_line "podcast_interview" "STRIPE_PRICE_PODCAST_INTERVIEW"

# Optional: podcaster monthly (if you add it later)
if ! grep -q "podcast_creator_pass_monthly:" "$F"; then
  perl -0777 -i -pe "s/(const\\s+PRICE_MAP\\s*=\\s*\\{)/\\1\\n  podcast_creator_pass_monthly: process.env.STRIPE_PRICE_PODCAST_CREATOR_PASS_MONTHLY,\\n/s" "$F"
  echo "✅ Added optional PRICE_MAP podcast_creator_pass_monthly -> STRIPE_PRICE_PODCAST_CREATOR_PASS_MONTHLY (set env if you use it)"
fi

echo "✅ Done. Backup: backups/create-checkout-session.js.bak_${ts}"
