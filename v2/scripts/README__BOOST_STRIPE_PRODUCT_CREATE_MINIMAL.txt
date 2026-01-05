TKFM FIX — Stripe rejected product create parameters.

This patch switches to ASCII-only + minimal product create params.

Run:
export STRIPE_SECRET_KEY=sk_live_...
./scripts/tkfm-boost-bootstrap.sh
