TKFM FIX — netlify env:list JSON parsing failed

Use Netlify's --plain output instead (no JSON/node).

Run:
  chmod +x scripts/tkfm-netlify-env-audit-size.sh scripts/tkfm-netlify-prune-stripe-env.sh
  ./scripts/tkfm-netlify-env-audit-size.sh
  ./scripts/tkfm-netlify-prune-stripe-env.sh
  ./scripts/tkfm-netlify-env-audit-size.sh
  netlify deploy --prod

Verify functions:
  curl -s -o /dev/null -w "create-checkout-session status=%{http_code}\n" https://tkfmradio.com/.netlify/functions/create-checkout-session
  curl -s -o /dev/null -w "featured-media-track status=%{http_code}\n" https://tkfmradio.com/.netlify/functions/featured-media-track
Expect 400/405 (NOT 404).
