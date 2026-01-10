#!/usr/bin/env bash
set -euo pipefail
F="video-engine.html"
[ -f "$F" ] || { echo "FAIL: $F not found"; exit 1; }

echo "== TKFM: Verify no nested <style> inside tkfmVideoEngineTheme =="
# show the first 40 lines so you can visually confirm the fix
nl -ba "$F" | sed -n '1,45p'

# Check: the tkfmVideoEngineTheme block should not contain "<style"
awk '
  BEGIN{in_theme=0; bad=0}
  {
    if (tolower($0) ~ /<style[^>]*id="tkfmvideoenginetheme"/) in_theme=1
    else if (in_theme==1 && tolower($0) ~ /<\/style>/) in_theme=0
    else if (in_theme==1 && tolower($0) ~ /<style\b/) bad=1
  }
  END{
    if (bad==1) { print "FAIL: nested <style> found inside tkfmVideoEngineTheme"; exit 1 }
    print "OK: no nested style tags inside theme"
  }
' "$F"

opens=$(grep -i "<style" "$F" | wc -l | tr -d " ")
closes=$(grep -i "</style>" "$F" | wc -l | tr -d " ")
echo "style_open=$opens style_close=$closes"
[ "$opens" = "$closes" ] || { echo "FAIL: style tags unbalanced"; exit 1; }

echo "OK"
