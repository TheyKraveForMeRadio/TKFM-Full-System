TKFM NEXT POWER MOVE — BOOST GO LIVE (ENV-FIRST)

Problem you hit:
- Scripts were failing because Stripe lookup_key updates are not always allowed on existing prices.
- Your system ALREADY works using Netlify env price IDs (STRIPE_PRICE_ROTATION_BOOST_7D / _30D).

What this patch does:
- Boost go-live verify now accepts ENV price IDs as the source of truth.
- Adds an optional Stripe mode check: if you export STRIPE_SECRET_KEY, it verifies the price IDs match live/test mode.

Run:
./scripts/tkfm-boost-go-live-verify.sh

Optional (strong):
export STRIPE_SECRET_KEY=sk_live_...
./scripts/tkfm-boost-go-live-verify.sh
