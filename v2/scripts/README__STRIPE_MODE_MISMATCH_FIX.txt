TKFM FIX — price buttons broken with:
  No such price ... similar object exists in live mode, but a test mode key was used

Cause:
- Netlify production/functions STRIPE_SECRET_KEY is set to a TEST key
- Your pages are sending LIVE price ids (or live lookup keys), so Stripe rejects.

Fix:
1) Export your LIVE key in Git Bash:
   export STRIPE_SECRET_KEY=sk_live_...

2) One-command fix:
   ./scripts/tkfm-fix-stripe-mode-mismatch.sh

If you want DEV to use test key separately:
- export STRIPE_SECRET_KEY=sk_test_...
- ./scripts/tkfm-netlify-set-stripe-secret.sh dev functions
