TKFM NEXT POWER MOVE — MAKE BOOST CHECKOUT UNBREAKABLE

Adds:
- netlify/functions/create-boost-checkout-session.js  (dedicated endpoint)
- js/tkfm-boost-checkout.js  (capture-phase interceptor for boost buttons)
- wiring scripts to inject interceptor into key pages

Why:
You have a big multi-plan create-checkout-session. This makes Boost independent so it can never break other plans,
and Boost buttons always work.

Run:
./scripts/tkfm-wire-boost-checkout-interceptor.sh .
./scripts/tkfm-verify-boost-checkout-interceptor.sh
Restart dev: netlify dev --port 8888
