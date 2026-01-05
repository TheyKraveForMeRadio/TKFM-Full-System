TKFM NEXT POWER MOVE — POST CHECKOUT AUTO-UNLOCK (BOOST)

Adds:
- netlify/functions/verify-boost-session.js  (server verifies Stripe checkout session is PAID)
- js/tkfm-post-checkout-boost.js            (client unlocks + redirects)
- post-checkout.html                        (if you don't already have one)

How it works:
Stripe success_url already includes:
  /post-checkout.html?plan=...&session_id={CHECKOUT_SESSION_ID}

This page:
1) calls verify-boost-session
2) writes localStorage:
   - tkfm_user_features[rotation_boost_*] = true
   - tkfm_boost_entitlements[rotation_boost_*].expires_at = ...
3) redirects to /rotation-boost.html?unlocked=...

Run:
./scripts/tkfm-wire-post-checkout-boost.sh .
./scripts/tkfm-verify-post-checkout-boost.sh
Restart dev: netlify dev --port 8888
