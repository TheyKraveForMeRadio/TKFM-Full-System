\
#!/usr/bin/env bash
set -euo pipefail

# Verify we are NOT blowing the Lambda env limit with dozens of STRIPE_PRICE_ vars.
# Default check: functions + production.

CTX="${1:-production}"
SCOPE="${2:-functions}"

tmp="/tmp/tkfm_netlify_env_stripe_check.txt"

netlify env:list --plain --context "$CTX" --scope "$SCOPE" > "$tmp" || {
  echo "FAIL: netlify env:list failed (try: netlify status && netlify link)" >&2
  exit 1
}

KEEP_RE='^(STRIPE_PRICE_ROTATION_BOOST_(7D|30D)|STRIPE_PRODUCT_ROTATION_BOOST)$'

bad=$(grep -E '^STRIPE_(PRICE|PRODUCT)_' "$tmp" | cut -d= -f1 | grep -Ev "$KEEP_RE" || true)

if [[ -n "$bad" ]]; then
  echo "FAIL: found extra Stripe price/product envs in context=${CTX} scope=${SCOPE}:"
  echo "$bad" | sed 's/^/  /'
  exit 1
fi

echo "OK: no extra Stripe price/product envs in context=${CTX} scope=${SCOPE}"
