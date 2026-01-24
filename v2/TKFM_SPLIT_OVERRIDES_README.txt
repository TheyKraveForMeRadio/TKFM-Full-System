TKFM SPLIT OVERRIDES (V1)

Adds:
- Per-release split override fields on distribution requests:
  artist_split (0-100)
  tkfm_split (auto 100-artist_split)
  admin_fee (flat USD amount per statement period import)
- Owner Distribution Ops UI: set split + fee per release.
- Statements import honors per-release overrides:
  - Applies percent split first
  - Applies admin_fee by subtracting from artist amount (capped) and adding to TKFM amount
- Payout ledger records admin_fee_applied in payout items.

Apply:
- Run: node scripts/tkfm-split-overrides-apply.mjs
