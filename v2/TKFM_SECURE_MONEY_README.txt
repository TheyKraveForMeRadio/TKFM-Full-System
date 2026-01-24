TKFM SECURE MONEY (V1)

Adds client token auth for MONEY endpoints.

Functions added:
- /.netlify/functions/client-auth (POST {email, code} -> token)
- /.netlify/functions/client-auth-verify (GET)

Secures:
- /.netlify/functions/statements-client  (Bearer token required; must match email)
- /.netlify/functions/payout-profiles    (Bearer token required for client scope; owner list requires owner key)
- /.netlify/functions/payouts            (Bearer token required for email scope; owner scope requires owner key)

Front-end:
- /js/tkfm-secure-client-auth.js
- Updates /js/tkfm-statements-client.js and /js/tkfm-payout-profile.js to prompt for access code and store token in localStorage.

ENV REQUIRED (to enable auth):
- TKFM_CLIENT_CODE   (shared access code you give customers)
- TKFM_JWT_SECRET    (or ADMIN_JWT_SECRET)

If env is NOT set, endpoints behave like before (dev-friendly).
