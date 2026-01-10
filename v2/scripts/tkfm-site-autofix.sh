#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-.}"
STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/site-autofix-$STAMP"
mkdir -p "$BK"

echo "== TKFM: SITE AUTOFIX (safe, no page wipes) =="
echo "What this fixes:"
echo " 1) Injects /js/tkfm-quick-checkout.js into any ROOT html page that has checkout attrs but is missing the script"
echo " 2) Removes visible debug 'Fix applied' lines if present"
echo " 3) Attempts to remove a pasted CSS blob that appears OUTSIDE <style> blocks (common blank-page cause)"
echo
echo "Backup dir: $BK"
echo

# Helper: inject quick checkout before </body>
inject_quick () {
  local f="$1"
  if grep -qiE 'data-plan=|data-feature=|js-checkout' "$f" && ! grep -qiE 'tkfm-quick-checkout\.js' "$f"; then
    cp -p "$f" "$BK/$(basename "$f")"
    awk '
      BEGIN{done=0}
      {
        if(!done && tolower($0) ~ /<\/body>/){
          print "  <script src=\\"/js/tkfm-quick-checkout.js\\" defer></script>"
          done=1
        }
        print
      }
    ' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"
    echo "INJECTED quick-checkout: $(basename "$f")"
  fi
}

# Helper: remove "Fix applied" debug blocks/lines
remove_fix_applied () {
  local f="$1"
  if grep -q "Fix applied" "$f"; then
    cp -p "$f" "$BK/$(basename "$f")"
    grep -vE 'Fix applied|Button lookup key:|Prices render on the page' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"
    echo "REMOVED debug text: $(basename "$f")"
  fi
}

# Helper: remove pasted CSS blob OUTSIDE style tags
remove_visible_css_blob () {
  local f="$1"
  if ! grep -q '\.card{background:rgba(2,6,23' "$f"; then return 0; fi
  cp -p "$f" "$BK/$(basename "$f")"
  awk '
    BEGIN{inStyle=0}
    tolower($0) ~ /<style/{inStyle=1}
    {
      if(inStyle==0){
        if($0 ~ /\.card\{background:rgba\(2,6,23/){ next }
        if($0 ~ /background-image: radial-gradient/){ next }
        if($0 ~ /position:relative; width:min\(720px/){ next }
        if($0 ~ /width:44px; height:44px/){ next }
        if($0 ~ /font-size:12px; opacity:\.9; padding:6px 10px/){ next }
      }
      print
    }
    tolower($0) ~ /<\/style>/{inStyle=0}
  ' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"
  echo "CLEANED visible css blob (heuristic): $(basename "$f")"
}

for f in "$BASE"/*.html; do
  [ -f "$f" ] || continue
  inject_quick "$f"
  remove_fix_applied "$f"
  remove_visible_css_blob "$f"
done

echo
echo "DONE."
echo "Backups: $BK"
echo "Next run:"
echo "  ./scripts/tkfm-site-healthcheck.sh"
