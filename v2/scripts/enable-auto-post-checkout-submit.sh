#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Auto-route buyers to submission modal after checkout (no manual button work) =="

# 1) Ensure quick checkout script exists in /js (this patch provides it)
if [ ! -f "js/tkfm-quick-checkout.js" ]; then
  echo "FAIL: js/tkfm-quick-checkout.js missing (unzip patch into /v2 root)"
  exit 1
fi

# 2) Ensure post-checkout exists
if [ ! -f "post-checkout.html" ]; then
  echo "FAIL: post-checkout.html missing (unzip patch into /v2 root)"
  exit 1
fi

# 3) Inject quick-checkout script into pages that have checkout buttons but may not include it.
STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/auto-post-checkout-$STAMP"
mkdir -p "$BK"

patched=0
checked=0

shopt -s nullglob
for f in *.html label-*.html dj-*.html ai-*.html radio-*.html feature-*.html sponsors*.html; do
  [ -f "$f" ] || continue
  # only pages with any checkout markers
  if grep -qiE 'data-plan=|data-feature=|js-checkout' "$f"; then
    checked=$((checked+1))
    if ! grep -qiE '/js/tkfm-quick-checkout\.js' "$f"; then
      cp -p "$f" "$BK/$f"
      # insert before </body> if present, else before </html>
      if grep -qi '</body>' "$f"; then
        awk 'BEGIN{IGNORECASE=1}
          /<\/body>/{print "  <script src=\"/js/tkfm-quick-checkout.js\" defer></script>"; print; next}
          {print}
        ' "$BK/$f" > "$f"
      else
        awk 'BEGIN{IGNORECASE=1}
          /<\/html>/{print "  <script src=\"/js/tkfm-quick-checkout.js\" defer></script>"; print; next}
          {print}
        ' "$BK/$f" > "$f"
      fi
      echo "INJECTED: $f"
      patched=$((patched+1))
    fi
  fi
done

echo
echo "Checked $checked pages. Injected script into $patched pages."
echo "Backups: $BK"
echo
echo "DONE. Now ANY checkout click stores planId and post-checkout auto-routes to the right engine and opens the submit modal."
