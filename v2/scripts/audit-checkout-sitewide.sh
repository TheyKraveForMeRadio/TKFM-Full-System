#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

TS="$(date +%Y%m%d_%H%M%S)"
echo "== TKFM: Sitewide checkout audit ($TS) =="

# Files to scan: all html excluding obvious backups/broken
mapfile -t FILES < <(find . -maxdepth 1 -type f -name "*.html" \
  ! -name "*.BACKUP.*.html" ! -name "*.BROKEN.*.html" ! -name "*._backup.html" 2>/dev/null | sed 's|^\./||' | sort)

echo ""
echo "-- Pages with checkout buttons but missing tkfm-quick-checkout.js --"
missing=0
for f in "${FILES[@]}"; do
  if grep -qiE 'class="[^"]*js-checkout[^"]*"|data-plan=|data-feature=' "$f"; then
    if ! grep -qi 'tkfm-quick-checkout\.js' "$f"; then
      echo "MISSING SCRIPT: $f"
      missing=$((missing+1))
    fi
  fi
done
[ "$missing" -eq 0 ] && echo "OK: none"

echo ""
echo "-- Buttons with js-checkout but no data-plan / data-feature / plan in href --"
bad=0
while IFS= read -r line; do
  file="${line%%:*}"
  rest="${line#*:}"
  lineno="${rest%%:*}"
  html="$(sed -n "${lineno}p" "$file")"

  # skip if has data-plan/data-feature
  if echo "$html" | grep -qiE 'data-plan=|data-feature='; then
    continue
  fi

  # allow if href contains planId/plan/feature query
  if echo "$html" | grep -qiE 'href="[^"]*(\?|\&)(planId|plan|feature|id|lookup_key)='; then
    continue
  fi

  echo "NO PLANID => $file:$lineno:$html"
  bad=$((bad+1))
done < <(grep -RIn --include="*.html" 'class="[^"]*js-checkout[^"]*"' . \
          | grep -vE '\.BACKUP\.|\.BROKEN\.' \
          | sed 's|^\./||' | sort)

[ "$bad" -eq 0 ] && echo "OK: none"

echo ""
echo "-- Summary --"
echo "Missing script pages: $missing"
echo "Buttons missing planId: $bad"

echo ""
echo "NEXT ACTIONS:"
echo "1) If missing script pages > 0: run ./scripts/fix-checkout-sitewide.sh"
echo "2) If buttons missing planId > 0: those need data-plan or data-feature added (we can auto-fix if they have href params)."
