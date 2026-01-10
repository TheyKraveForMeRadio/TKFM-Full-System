TKFM NEXT POWER MOVE — FIX STRIPE LOOKUP KEYS (rotation_boost_7d / rotation_boost_30d)

Problem:
./scripts/tkfm-boost-autowire-to-netlify.sh fails:
  Stripe lookup key not found: rotation_boost_7d

Cause:
Prices exist, but Stripe Price.lookup_key was never set.

Fix:
1) Make sure STRIPE_SECRET_KEY is exported (live or test):
   export STRIPE_SECRET_KEY=sk_live_...

2) Set lookup keys onto your existing price ids:
   ./scripts/tkfm-stripe-set-boost-lookup-keys.sh

OR pass them directly:
   ./scripts/tkfm-stripe-set-boost-lookup-keys.sh price_... price_...

3) Then run:
   ./scripts/tkfm-boost-autowire-to-netlify.sh
