TKFM FIX — price buttons broken + deploy 404 due to env 4KB limit

Symptoms:
- "No such price ... similar object exists in live mode, but a test mode key was used"
- Netlify deploy warns env vars exceed 4KB and functions become 404

One-command fix (LIVE):
  export STRIPE_SECRET_KEY=sk_live_...
  chmod +x scripts/tkfm-fix-all-checkout-live-and-deploy.sh
  ./scripts/tkfm-fix-all-checkout-live-and-deploy.sh

What it does:
1) Forces Netlify production/functions to use LIVE STRIPE_SECRET_KEY
2) Creates Stripe Price lookup_keys for every STRIPE_PRICE_* env id (so checkout can use lookup_key instead of env vars)
3) Empties most STRIPE_PRICE_* / STRIPE_PRODUCT_* env vars to drop under 4KB
4) Deploys prod and verifies functions are not 404

Optional (keep dev using test key):
  export STRIPE_SECRET_KEY=sk_test_...
  ./scripts/tkfm-netlify-set-stripe-secret.sh dev functions
