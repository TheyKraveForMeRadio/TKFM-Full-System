TKFM V2 PATCH — CHECKOUT STABILITY LOCK (REISSUE)

Adds:
- scripts/checkout-dedupe-quick-checkout.sh
  Removes duplicate <script src="/js/tkfm-quick-checkout.js"></script> includes in ROOT html pages.
  Backups: backups/checkout-dedupe-<timestamp>/

- scripts/checkout-smoke-test-pages.sh
  Verifies key pages have:
    - tkfm-quick-checkout.js included
    - at least one js-checkout element
    - at least one data-plan or data-feature attribute
  Also pings local Netlify function if netlify dev is running.

Apply from v2:
unzip -o "<zip>" -d .
chmod +x scripts/checkout-dedupe-quick-checkout.sh scripts/checkout-smoke-test-pages.sh
./scripts/checkout-dedupe-quick-checkout.sh
./scripts/checkout-smoke-test-pages.sh
