TKFM PAYOUT PROFILE (V1)

Adds:
- /payout-profile.html (client sets PayPal/ACH)
- /owner-payout-profiles.html (owner view)
- /.netlify/functions/payout-profiles (GET/POST)
- Updates /.netlify/functions/payouts to include payout_profile per payout item

Storage:
- v2/.tkfm/payout-profiles.json (file-backed, falls back to memory)

Note:
- MVP uses email as the identifier (no auth). Upgrade later with auth/token.
