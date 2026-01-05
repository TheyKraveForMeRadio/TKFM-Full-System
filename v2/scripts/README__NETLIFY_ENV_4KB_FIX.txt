TKFM FIX — Netlify deploy failing: env vars exceed AWS Lambda 4KB limit

Symptoms:
- netlify deploy --prod warns: env vars exceed 4KB
- functions return 404

Fix:
1) checkout function now resolves Stripe Price by lookup_key (planId) first
2) prune dozens of STRIPE_PRICE_* env vars from Netlify

Run:
  chmod +x scripts/tkfm-netlify-env-audit-size.sh scripts/tkfm-netlify-prune-stripe-env.sh
  ./scripts/tkfm-netlify-env-audit-size.sh
  ./scripts/tkfm-netlify-prune-stripe-env.sh
  netlify deploy --prod

Then verify:
  curl -s -o /dev/null -w "create-checkout-session status=%{http_code}\n" https://tkfmradio.com/.netlify/functions/create-checkout-session
