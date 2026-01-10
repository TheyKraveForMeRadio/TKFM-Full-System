TKFM NEXT POWER MOVE — STRIPE BOOST AUTOWIRE (LOOKUP KEY → NETLIFY ENV)

1) VERIFY STRIPE PRICES BY LOOKUP KEY (must exist + active + correct amounts)
export STRIPE_SECRET_KEY=sk_live_...
./scripts/tkfm-stripe-verify-boost-setup.sh

2) AUTO-SET NETLIFY ENV FROM THOSE PRICE IDS (no dashboard copy/paste)
# Use eval to pull vars printed by verify script:
eval "$(./scripts/tkfm-stripe-verify-boost-setup.sh | grep '^STRIPE_PRICE_ROTATION_BOOST_')"
./scripts/tkfm-netlify-set-boost-price-env.sh "$STRIPE_PRICE_ROTATION_BOOST_7D" "$STRIPE_PRICE_ROTATION_BOOST_30D"

3) REDEPLOY OR RESTART LOCAL DEV
netlify dev --port 8888

4) QUICK WIRING CHECK (files + ids)
./scripts/tkfm-boost-revenue-healthcheck.sh
