TKFM FIX — env still > 4KB after earlier prune because unsets were failing silently.

Use HARD PRUNE (tries multiple contexts + verifies removal).

Run:
  chmod +x scripts/tkfm-netlify-prune-stripe-env-hard.sh scripts/tkfm-netlify-verify-no-stripe-price-envs.sh scripts/tkfm-netlify-env-audit-size.sh
  ./scripts/tkfm-netlify-prune-stripe-env-hard.sh
  ./scripts/tkfm-netlify-env-audit-size.sh
  ./scripts/tkfm-netlify-verify-no-stripe-price-envs.sh || true
  netlify deploy --prod

Verify functions not 404:
  curl -s -o /dev/null -w "create-checkout-session status=%{http_code}\n" https://tkfmradio.com/.netlify/functions/create-checkout-session
  curl -s -o /dev/null -w "featured-media-track status=%{http_code}\n" https://tkfmradio.com/.netlify/functions/featured-media-track
