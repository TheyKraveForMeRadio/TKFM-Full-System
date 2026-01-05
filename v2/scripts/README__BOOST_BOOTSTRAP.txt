TKFM NEXT POWER MOVE — FIX "lookup key not found"

Run:
./scripts/tkfm-boost-bootstrap.sh

It will:
- create the Stripe prices if missing (rotation_boost_7d / rotation_boost_30d)
- set Netlify env STRIPE_PRICE_ROTATION_BOOST_7D / 30D
- tell you to restart netlify dev
