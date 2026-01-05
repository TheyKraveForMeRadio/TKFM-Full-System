TKFM FIX — LOOKUP KEY ALREADY USED (LIVE)

If Stripe says:
  "A price (price_...) already uses that lookup key."

That means the lookup_key exists already (maybe created earlier on a different product).
You do NOT need to create another price — you just need to REUSE the existing one.

This patch updates:
- tkfm-stripe-ensure-boost-prices-with-lookup.sh

So it:
1) Resolves existing prices globally using:
   /v1/prices?lookup_keys[]=rotation_boost_7d
2) Only creates prices if the lookup doesn’t exist.
3) If create fails with "already uses", it re-resolves and continues.

Run:
export STRIPE_SECRET_KEY=sk_live_...
./scripts/tkfm-stripe-ensure-boost-prices-with-lookup.sh
./scripts/tkfm-boost-autowire-to-netlify.sh
./scripts/tkfm-boost-go-live-verify.sh
