TKFM FIX — your eval+grep swallowed the Stripe error output.

Use ONE command instead (no eval):

./scripts/tkfm-boost-autowire-to-netlify.sh

If it says missing STRIPE_SECRET_KEY:
- export STRIPE_SECRET_KEY=sk_live_...
OR put STRIPE_SECRET_KEY=sk_live_... in .env
