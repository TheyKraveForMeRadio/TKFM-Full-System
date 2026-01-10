TKFM FIX — NETLIFY ENV 4KB LIMIT (CONTEXT + SCOPE SAFE)

Problem:
- Netlify deploy fails creating functions with:
  "Your environment variables exceed the 4KB limit imposed by AWS Lambda"
- That makes functions 404 on prod.

Fix:
1) Audit env bytes for FUNCTIONS + PRODUCTION:
   ./scripts/tkfm-netlify-env-audit-size.sh --context production --scope functions

2) Hard prune all STRIPE_PRICE_* and STRIPE_PRODUCT_* except Boost vars, across ALL contexts/scopes:
   ./scripts/tkfm-netlify-prune-stripe-env-hard.sh

3) Verify Stripe spam is gone from FUNCTIONS + PRODUCTION:
   ./scripts/tkfm-netlify-verify-no-stripe-price-envs.sh production functions

4) Redeploy:
   netlify deploy --prod

5) Confirm functions are alive (400/405 is fine; 404 is bad):
   curl -s -o /dev/null -w "create-checkout-session status=%{http_code}
" https://tkfmradio.com/.netlify/functions/create-checkout-session
   curl -s -o /dev/null -w "featured-media-track status=%{http_code}
" https://tkfmradio.com/.netlify/functions/featured-media-track
