TKFM FIX — Healthcheck missing script includes

Fixes:
1) Owner pages missing /js/tkfm-quick-checkout.js
   - owner-boost-analytics.html
   - owner-boost-dashboard.html
   - owner-paid-lane-inbox.html

2) post-checkout.html missing /js/tkfm-post-checkout-deeplink.js

Run:
  chmod +x scripts/tkfm-wire-quick-checkout-owner-pages.sh scripts/tkfm-wire-post-checkout-deeplink.sh scripts/tkfm-verify-healthcheck-fixes.sh
  ./scripts/tkfm-wire-quick-checkout-owner-pages.sh .
  ./scripts/tkfm-wire-post-checkout-deeplink.sh .
  ./scripts/tkfm-verify-healthcheck-fixes.sh .
  ./scripts/tkfm-site-healthcheck.sh
