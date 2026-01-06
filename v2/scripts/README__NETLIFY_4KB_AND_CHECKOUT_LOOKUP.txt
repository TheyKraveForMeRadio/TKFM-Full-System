TKFM FIX: Netlify 4KB env limit + Stripe test/live mismatch + price buttons

WHAT THIS PATCH DOES
- Updates netlify/functions/create-checkout-session.js to resolve prices by Stripe lookup_key (plan/feature id),
  so you do NOT need dozens of STRIPE_PRICE_* env vars.
- Adds scripts to:
  1) set STRIPE_SECRET_KEY safely into Netlify production/functions
  2) add lookup_key to your existing Stripe prices (or create cloned prices if lookup_key cannot be updated)
  3) prune STRIPE_PRICE_* env vars so Netlify Functions deploy (no 404)

RUN (GIT BASH)
1) unzip patch into v2, chmod scripts:
   unzip -o ~/Downloads/TKFM_NEXT_POWER_MOVE_FIX_NETLIFY_4KB_AND_PRICE_BUTTONS_LOOKUP_PATCH.zip
   chmod +x scripts/*.sh

2) export your LIVE key:
   export STRIPE_SECRET_KEY=sk_live_...

3) run one command:
   ./scripts/tkfm-fix-netlify-4kb-and-checkout-lookup.sh

If anything prints failed>0 in the lookup step, fix Stripe mode first (make sure your exported key matches the price ids in Netlify).
