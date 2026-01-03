#!/usr/bin/env bash
set -euo pipefail

echo "TKFM: scanning for likely checkout elements missing data-plan/data-feature (heuristic)"
count=0

for f in *.html; do
  if ! grep -qiE "checkout|tkfmCheckout|data-plan|data-feature|create-checkout-session" "$f"; then
    continue
  fi

  while IFS= read -r line; do
    if echo "$line" | grep -qiE "checkout|tkfmCheckout|create-checkout-session" && ! echo "$line" | grep -qiE "data-plan=|data-feature="; then
      echo "MAYBE MISSING in $f: $line"
      count=$((count+1))
    fi
  done < <(grep -nEi "checkout|tkfmCheckout|create-checkout-session" "$f" || true)
done

echo "Heuristic findings: $count"
