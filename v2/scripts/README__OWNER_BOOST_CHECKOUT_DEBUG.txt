TKFM NEXT POWER MOVE — OWNER BOOST CHECKOUT DEBUG PAGE

Adds:
- /owner-boost-checkout-debug.html (owner-only UI)
- Wires link into owner pages (dashboard/inbox/analytics/featured manager/verifier)

Use it to confirm:
- create-checkout-session accepts your payload shape
- returns a Stripe Checkout URL
- your env vars are set correctly

Run:
./scripts/tkfm-wire-owner-boost-checkout-debug-link.sh .
./scripts/tkfm-verify-owner-boost-checkout-debug.sh
Then open:
http://localhost:8888/owner-boost-checkout-debug.html
