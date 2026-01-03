#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
ORIG="originals/autopilot-engine.original.html"
WRAP="autopilot-engine.html"
BKDIR="_HOLD/autopilot-native-fix-backups"
mkdir -p "$BKDIR" originals scripts js

if [ ! -f "$ORIG" ]; then
  echo "ERROR: Missing $ORIG"
  echo "Fix: You must have originals/autopilot-engine.original.html present."
  exit 1
fi

TS="$(date +%Y%m%d-%H%M%S)"

cp -f "$ORIG" "$BKDIR/autopilot-engine.original.html.BACKUP.$TS.html"

# Use perl (works in Git Bash) for safe whole-file transforms
perl -0777 -pe '
  my $s = $_;

  # 0) Remove external redirect gate scripts if present
  $s =~ s{<script\b[^>]*\bsrc=["'\''][^"'\'']*(auth-gateway|access-gates)[^"'\'']*["'\''][^>]*>\s*</script>}{}gis;

  # 1) Ensure owner guard + no-redirect gate are in <head> near the top
  if ($s !~ m{/js/tkfm-owner-gate-no-redirect\.js}i) {
    $s =~ s{(<head\b[^>]*>)}{$1\n  <script src=\"/js/tkfm-owner-guard.js\"></script>\n  <script src=\"/js/tkfm-owner-gate-no-redirect.js\"></script>\n}i;
  } else {
    # If gate is present but guard missing, add guard right before it
    if ($s !~ m{/js/tkfm-owner-guard\.js}i) {
      $s =~ s{(<script\b[^>]*\bsrc=["'\'']/js/tkfm-owner-gate-no-redirect\.js["'\''][^>]*>\s*</script>)}{<script src=\"/js/tkfm-owner-guard.js\"></script>\n$1}i;
    }
  }

  # 2) Add tkfmOwnerLock div after <body ...> if missing
  if ($s !~ m{id=["'\'']tkfmOwnerLock["'\'']}i) {
    $s =~ s{(<body\b[^>]*>)}{$1\n<div id=\"tkfmOwnerLock\"></div>\n}i;
  }

  # 3) Neutralize redirect statements to owner-login
  $s =~ s{window\.location\s*=\s*["'\''][^"'\'']*owner-login[^"'\'']*["'\'']}/* stripped owner-login redirect */}gis;
  $s =~ s{location\.href\s*=\s*["'\''][^"'\'']*owner-login[^"'\'']*["'\'']}/* stripped owner-login redirect */}gis;
  $s =~ s{document\.location\s*=\s*["'\''][^"'\'']*owner-login[^"'\'']*["'\'']}/* stripped owner-login redirect */}gis;
  $s =~ s{location\.replace\(\s*["'\''][^"'\'']*owner-login[^"'\'']*["'\'']\s*\)}/* stripped owner-login redirect */}gis;
  $s =~ s{location\.assign\(\s*["'\''][^"'\'']*owner-login[^"'\'']*["'\'']\s*\)}/* stripped owner-login redirect */}gis;

  $_ = $s;
' "$ORIG" > "$ORIG.tmp"

mv -f "$ORIG.tmp" "$ORIG"

echo "✅ Patched: $ORIG"

# OPTIONAL: if current autopilot-engine.html is the Stability Wrapper, replace it with patched original
if [ -f "$WRAP" ]; then
  if grep -qi "Stability Wrapper" "$WRAP"; then
    cp -f "$WRAP" "$BKDIR/autopilot-engine.wrapper.BACKUP.$TS.html"
    cp -f "$WRAP" "originals/autopilot-engine.wrapper.html"
    cp -f "$ORIG" "$WRAP"
    echo "✅ Replaced wrapper with native autopilot-engine.html (wrapper archived to originals/autopilot-engine.wrapper.html)"
  fi
fi

echo "DONE"
