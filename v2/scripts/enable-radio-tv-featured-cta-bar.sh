#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: RADIO-TV 'Get Featured' CTA bar (Buy & Submit) =="

F="radio-tv.html"
if [ ! -f "$F" ]; then
  echo "FAIL: radio-tv.html not found in this folder."
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/radio-tv-cta-$STAMP"
mkdir -p "$BK"
cp -p "$F" "$BK/$F"

# Ensure required scripts in <head>
add_head_script () {
  local src="$1"
  if ! grep -qiE "$(printf '%s' "$src" | sed 's/[.[\*^$(){}+?|]/\\&/g')" "$F"; then
    awk -v INS="  <script src=\"$src\" defer></script>" '
      BEGIN{done=0}
      {
        if (!done && tolower($0) ~ /<\/head>/) { print INS; done=1; }
        print $0;
      }
    ' "$F" > "$F.__tmp__" && mv "$F.__tmp__" "$F"
    echo "OK: added $src"
  else
    echo "OK: already has $src"
  fi
}

add_head_script "/js/tkfm-quick-checkout.js"
add_head_script "/js/tkfm-paid-lane-submit.js"
add_head_script "/js/tkfm-radio-tv-cta-bar.js"

# Ensure CTA host exists BEFORE Featured Rail host if present
if ! grep -qiE 'id="tkfmRadioTvCtaHost"' "$F"; then
  if grep -qiE 'id="tkfmFeaturedRailHost"' "$F"; then
    awk '
      BEGIN{done=0}
      {
        if (!done && $0 ~ /id="tkfmFeaturedRailHost"/) {
          print "  <!-- TKFM Radio TV: Get Featured CTA bar -->"
          print "  <div id=\"tkfmRadioTvCtaHost\"></div>"
          print ""
          done=1
        }
        print $0
      }
    ' "$F" > "$F.__tmp__" && mv "$F.__tmp__" "$F"
    echo "OK: inserted #tkfmRadioTvCtaHost above Featured rail"
  else
    awk '
      BEGIN{inserted=0}
      {
        print $0
        if (!inserted && tolower($0) ~ /<body[^>]*>/) {
          print ""
          print "  <!-- TKFM Radio TV: Get Featured CTA bar -->"
          print "  <div id=\"tkfmRadioTvCtaHost\"></div>"
          print ""
          inserted=1
        }
      }
    ' "$F" > "$F.__tmp__" && mv "$F.__tmp__" "$F"
    echo "OK: inserted #tkfmRadioTvCtaHost at top of body"
  fi
else
  echo "OK: CTA host already present"
fi

echo "DONE: patched radio-tv.html"
echo "Backup: $BK/$F"
