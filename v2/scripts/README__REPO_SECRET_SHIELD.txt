TKFM NEXT POWER MOVE — REPO SECRET SHIELD (NO MORE KEY LEAKS)

Secret scan is now Node-based (stable, no Bash quote bugs).
It WILL block:
- Stripe keys: sk_live_... / sk_test_...
- STRIPE_SECRET_KEY=sk_...
- TKFM_OWNER_KEY=<long literal>

It will NOT block:
- docs that mention STRIPE_SECRET_KEY= (no real key)
- scripts that reference TKFM_OWNER_KEY placeholders or env expansions

Run:
./scripts/tkfm-secret-scan.sh
./scripts/tkfm-secret-scan.sh --staged

Pre-push hook (uses staged scan):
./scripts/tkfm-install-prepush-hook.sh
