NEXT POWER MOVE (ONE SHOT)

1) export STRIPE_SECRET_KEY as your LIVE key in your shell (production checkout uses LIVE)
   export STRIPE_SECRET_KEY=sk_live_...

2) Run:
   chmod +x scripts/*.sh
   ./scripts/tkfm-fix-prod-deploy-now.sh

What it does:
- Exports STRIPE_PRICE_* ids from Netlify prod/functions into public/tkfm-price-map.json
- Patches js/tkfm-quick-checkout.js to load that JSON map
- Deletes STRIPE_PRICE_/STRIPE_PRODUCT_ env vars (fix 4KB Lambda env limit)
- Sets STRIPE_SECRET_KEY for prod + functions
- Builds a STATIC multipage dist/ (so all /page.html routes work)
- Deploys prod + verifies key endpoints
