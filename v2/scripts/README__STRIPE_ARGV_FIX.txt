TKFM FIX — STRIPE SCRIPT FALSE FAIL (NODE ARGV)

Symptom:
- Script prints "FAIL: product create failed"
- But the JSON below shows an id like prod_...

Cause:
- When running Node from stdin (node -), process.argv shifts.
- Our parser read the wrong argv index, returning empty strings.

Fix:
- This patch uses process.argv.slice(2) for fp/field args.

Run:
./scripts/tkfm-stripe-ensure-boost-prices-with-lookup.sh
