#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

TS="$(date +%Y%m%d_%H%M%S)"
BKDIR="backups/checkout-sitewide-fix-$TS"
mkdir -p "$BKDIR"

echo "== TKFM: Fix checkout sitewide ($TS) =="

# 1) Move legacy backup/broken html out of root so scans stop getting polluted
mkdir -p backups/legacy-html
for f in *.BACKUP.*.html *.BROKEN.*.html 2>/dev/null; do
  [ -f "$f" ] || continue
  echo "MOVE LEGACY: $f -> backups/legacy-html/"
  mv -f "$f" "backups/legacy-html/$f"
done

# 2) Inject tkfm-quick-checkout.js into all html pages that have checkout buttons
patched=0
checked=0

for f in *.html; do
  [ -f "$f" ] || continue

  # skip moved legacy files if any remain
  if [[ "$f" == *".BACKUP."*".html" ]] || [[ "$f" == *".BROKEN."*".html" ]]; then
    continue
  fi

  if grep -qiE 'class="[^"]*js-checkout[^"]*"|data-plan=|data-feature=' "$f"; then
    checked=$((checked+1))
    if ! grep -qi 'tkfm-quick-checkout\.js' "$f"; then
      cp -f "$f" "$BKDIR/$f"
      # insert before </head>
      perl -0777 -i -pe 's#</head>#  <script src="/js/tkfm-quick-checkout.js"></script>\n</head>#i' "$f"
      echo "PATCHED SCRIPT: $f"
      patched=$((patched+1))
    fi
  fi
done

echo ""
echo "Checked $checked pages with checkout signals. Injected script into $patched pages."
echo "Backups at: $BKDIR"

# 3) Best-effort auto-fix: if a js-checkout element has href with ?planId= or ?plan= or ?feature=, add data-plan
echo ""
echo "-- Best-effort: Add data-plan from href query params (only when available) --"
auto=0
for f in *.html; do
  [ -f "$f" ] || continue
  if [[ "$f" == *".BACKUP."*".html" ]] || [[ "$f" == *".BROKEN."*".html" ]]; then
    continue
  fi

  # only if file contains js-checkout and href with plan params
  if grep -qi 'js-checkout' "$f" && grep -qiE 'href="[^"]*(\?|\&)(planId|plan|feature|id|lookup_key)=' "$f"; then
    cp -f "$f" "$BKDIR/$f.hreffix" 2>/dev/null || true
    # Add data-plan="<value>" when missing data-plan/data-feature and href has planId/plan/feature
    perl -i -pe '
      if (m/class="[^"]*js-checkout[^"]*"/i && !m/data-(plan|feature)=/i && m/href="[^"]*([?&](planId|plan|feature|id|lookup_key)=)([^"&]+)[^"]*"/i) {
        my $v = $3;
        s/<(a|button)\b/<$1 data-plan="$v"/i;
      }
    ' "$f"
    auto=$((auto+1))
  fi
done
echo "Auto-href-fixed (attempted) on $auto files (only where href params existed)."

echo ""
echo "DONE. Now run: ./scripts/audit-checkout-sitewide.sh"
