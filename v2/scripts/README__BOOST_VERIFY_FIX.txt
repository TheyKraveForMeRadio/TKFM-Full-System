TKFM FIX — Your env vars are empty because Stripe verify couldn't run.

Run in Git Bash:

export STRIPE_SECRET_KEY=sk_live_...
# or put STRIPE_SECRET_KEY=sk_live_... in .env

eval "$(./scripts/tkfm-stripe-verify-boost-setup.sh | grep '^STRIPE_PRICE_ROTATION_BOOST_')"
./scripts/tkfm-netlify-set-boost-price-env.sh "$STRIPE_PRICE_ROTATION_BOOST_7D" "$STRIPE_PRICE_ROTATION_BOOST_30D"
