\
#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM NETLIFY: HARD PRUNE STRIPE PRICE/PRODUCT ENVS (ALL contexts/scopes) =="

netlify status >/dev/null 2>&1 || true

TMP_ALL="/tmp/tkfm_netlify_env_all_plain.txt"
netlify env:list --plain > "$TMP_ALL" || {
  echo "FAIL: couldn't list env vars. Run: netlify status && netlify link" >&2
  exit 1
}

KEEP_RE='^(STRIPE_PRICE_ROTATION_BOOST_(7D|30D)|STRIPE_PRODUCT_ROTATION_BOOST)$'

mapfile -t KEYS < <(grep -E '^STRIPE_(PRICE|PRODUCT)_' "$TMP_ALL" | cut -d= -f1 | grep -Ev "$KEEP_RE" | sort -u)

if [[ "${#KEYS[@]}" -eq 0 ]]; then
  echo "OK: nothing to prune"
  exit 0
fi

contexts=("production" "deploy-preview" "branch-deploy" "dev")
scopes=("functions" "builds" "runtime" "post-processing" "any")

unset_one() {
  local key="$1"
  for ctx in "${contexts[@]}"; do
    for sc in "${scopes[@]}"; do
      netlify env:unset "$key" --context "$ctx" --scope "$sc" --force >/dev/null 2>&1 || true
    done
    netlify env:unset "$key" --context "$ctx" --force >/dev/null 2>&1 || true
  done
  for sc in "${scopes[@]}"; do
    netlify env:unset "$key" --scope "$sc" --force >/dev/null 2>&1 || true
  done
  netlify env:unset "$key" --force >/dev/null 2>&1 || true
}

for k in "${KEYS[@]}"; do
  echo "PRUNE: $k"
  unset_one "$k"
done

echo "OK: prune attempted for ${#KEYS[@]} key(s)"
echo
echo "VERIFY (functions+production):"
if netlify env:list --plain --context production --scope functions | grep -E '^STRIPE_(PRICE|PRODUCT)_' | cut -d= -f1 | grep -Ev "$KEEP_RE" >/dev/null 2>&1; then
  echo "WARN: some Stripe price/product envs still present in functions+production."
  echo "Run:"
  echo "  netlify env:list --plain --context production --scope functions | grep '^STRIPE_'"
  echo "Then manually unset any leftovers:"
  echo "  netlify env:unset KEY --context production --scope functions --force"
else
  echo "OK: functions+production clean (only Boost kept)"
fi

echo
echo "NEXT:"
echo "  ./scripts/tkfm-netlify-env-audit-size.sh --context production --scope functions"
echo "  netlify deploy --prod"
