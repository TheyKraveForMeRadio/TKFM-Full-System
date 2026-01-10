TKFM FIX — STRIPE LOOKUP KEY VERIFY (NO MORE 'got: none')

Problem:
- Setting lookup_key appears to work, but verify returned "none".

Fix:
- Verify lookup_key by fetching the Price directly:
  GET /v1/prices/:id  -> lookup_key

Also:
- Autowire no longer hard-fails if lookup_keys[] search is empty.
  It will fallback to your existing env price ids and still set Netlify env.

Run:
export STRIPE_SECRET_KEY=sk_live_...
./scripts/tkfm-stripe-set-boost-lookup-keys.sh
./scripts/tkfm-boost-autowire-to-netlify.sh
./scripts/tkfm-boost-go-live.sh
