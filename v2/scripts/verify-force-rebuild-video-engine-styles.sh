#!/usr/bin/env bash
set -euo pipefail
F="video-engine.html"
[ -f "$F" ] || { echo "FAIL: $F not found"; exit 1; }

echo "== TKFM: Verify video-engine style blocks =="
opens=$(grep -i "<style" "$F" | wc -l | tr -d " ")
closes=$(grep -i "</style>" "$F" | wc -l | tr -d " ")
echo "style_open=$opens style_close=$closes"
[ "$opens" = "$closes" ] || { echo "FAIL: style tags unbalanced"; exit 1; }

grep -qi 'id="tkfmVideoEngineTheme"' "$F" && echo "OK: tkfmVideoEngineTheme present" || { echo "FAIL: theme style missing"; exit 1; }
grep -qi 'id="tkfmPaidLaneModalStyles"' "$F" && echo "OK: tkfmPaidLaneModalStyles present" || { echo "FAIL: modal style missing"; exit 1; }

# Ensure no raw selector lines are visible outside style/script by checking the HTML without style blocks
awk '
  BEGIN{sd=0; bad=0}
  {
    if (tolower($0) ~ /<style\b/) { sd++; next }
    if (tolower($0) ~ /<\/style>/) { if (sd>0) sd--; next }
    if (sd==0) {
      if ($0 ~ /^\\s*#tkfmPaidLaneModal/ || $0 ~ /^\\s*\\.tkfmPLField/ || index($0,"background:#020617; background-image: radial-gradient")>0) bad=1
    }
  }
  END{ if (bad) { print "FAIL: stray CSS-like text still present outside <style>"; exit 1 } else print "OK: no stray CSS text outside style" }
' "$F"

echo
echo "Top of head (first 40 lines):"
nl -ba "$F" | sed -n '1,45p'
echo
echo "OK"
