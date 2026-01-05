#!/usr/bin/env bash
set -euo pipefail

# TKFM: prune Stripe env vars in Netlify to get under AWS Lambda 4KB limit
# Keeps ONLY:
#   STRIPE_SECRET_KEY (do NOT touch)
#   STRIPE_PRODUCT_ROTATION_BOOST
#   STRIPE_PRICE_ROTATION_BOOST_7D
#   STRIPE_PRICE_ROTATION_BOOST_30D
#
# Removes:
#   STRIPE_PRICE_* (except boost)
#   STRIPE_PRODUCT_* (except rotation boost)
#
# Requires: netlify env:list --json

KEEP_KEYS=(
  "STRIPE_PRODUCT_ROTATION_BOOST"
  "STRIPE_PRICE_ROTATION_BOOST_7D"
  "STRIPE_PRICE_ROTATION_BOOST_30D"
)

is_keep () {
  local k="$1"
  for kk in "${KEEP_KEYS[@]}"; do
    if [ "$k" = "$kk" ]; then return 0; fi
  done
  return 1
}

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found"
  exit 2
fi

J="$(netlify env:list --json 2>/dev/null || true)"
if [ -z "$J" ]; then
  echo "FAIL: netlify env:list --json returned empty (update netlify-cli)"
  exit 3
fi

KEYS="$(node --input-type=module - <<'NODE' <<< "$J"
let txt='';
process.stdin.setEncoding('utf8');
for await (const c of process.stdin) txt += c;
let arr;
try{ arr = JSON.parse(txt); }catch(e){ process.exit(1); }
const items = Array.isArray(arr) ? arr : (arr?.env || []);
for (const it of items){
  const k = String(it.key || it.name || '');
  if (k) console.log(k);
}
NODE
)"

REMOVED=0
for k in $KEYS; do
  if [[ "$k" == STRIPE_PRICE_* || "$k" == STRIPE_PRODUCT_* ]]; then
    if is_keep "$k"; then
      echo "KEEP: $k"
    else
      netlify env:unset "$k" --context all >/dev/null 2>&1 || true
      echo "UNSET: $k"
      REMOVED=$((REMOVED+1))
    fi
  fi
done

echo "OK: pruned Stripe env vars removed=$REMOVED"
echo "NEXT: deploy again: netlify deploy --prod"
