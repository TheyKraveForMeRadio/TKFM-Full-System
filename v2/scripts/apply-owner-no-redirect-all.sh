#!/usr/bin/env bash
set -euo pipefail

BKDIR="_HOLD/owner-no-redirect-backups"
mkdir -p "$BKDIR" scripts js

TS="$(date +%Y%m%d-%H%M%S)"

# Edit this list anytime
TARGETS=(
  "autopilot-engine.html"
  "ai-dj-engine.html"
  "god-view.html"
  "tkfm-dev-console.html"
  "owner-ops-dashboard.html"
  "owner-dashboard.html"
  "owner-mixtape-orders.html"
  "label-contract-lab.html"
  "label-contract-output.html"
)

patch_file () {
  local f="$1"
  if [ ! -f "$f" ]; then
    echo "SKIP (missing): $f"
    return 0
  fi

  cp -f "$f" "$BKDIR/$(basename "$f").BACKUP.$TS.html"

  perl -0777 -pe '
    my $s = $_;

    # Remove external redirect gate scripts if present
    $s =~ s{<script\b[^>]*\bsrc=["'\''][^"'\'']*(auth-gateway|access-gates)[^"'\'']*["'\''][^>]*>\s*</script>}{}gis;

    # Ensure owner guard + no-redirect gate in <head> (before other scripts)
    if ($s !~ m{/js/tkfm-owner-gate-no-redirect\.js}i) {
      $s =~ s{(<head\b[^>]*>)}{$1\n  <script src=\"/js/tkfm-owner-guard.js\"></script>\n  <script src=\"/js/tkfm-owner-gate-no-redirect.js\"></script>\n}i;
    } else {
      if ($s !~ m{/js/tkfm-owner-guard\.js}i) {
        $s =~ s{(<script\b[^>]*\bsrc=["'\'']/js/tkfm-owner-gate-no-redirect\.js["'\''][^>]*>\s*</script>)}{<script src=\"/js/tkfm-owner-guard.js\"></script>\n$1}i;
      }
    }

    # Add tkfmOwnerLock div after <body ...> if missing
    if ($s !~ m{id=["'\'']tkfmOwnerLock["'\'']}i) {
      $s =~ s{(<body\b[^>]*>)}{$1\n<div id=\"tkfmOwnerLock\"></div>\n}i;
    }

    # Neutralize redirect statements to owner-login
    $s =~ s{window\.location\s*=\s*["'\''][^"'\'']*owner-login[^"'\'']*["'\'']}/* stripped owner-login redirect */}gis;
    $s =~ s{location\.href\s*=\s*["'\''][^"'\'']*owner-login[^"'\'']*["'\'']}/* stripped owner-login redirect */}gis;
    $s =~ s{document\.location\s*=\s*["'\''][^"'\'']*owner-login[^"'\'']*["'\'']}/* stripped owner-login redirect */}gis;
    $s =~ s{location\.replace\(\s*["'\''][^"'\'']*owner-login[^"'\'']*["'\'']\s*\)}/* stripped owner-login redirect */}gis;
    $s =~ s{location\.assign\(\s*["'\''][^"'\'']*owner-login[^"'\'']*["'\'']\s*\)}/* stripped owner-login redirect */}gis;

    $_ = $s;
  ' "$f" > "$f.tmp"

  mv -f "$f.tmp" "$f"
  echo "PATCHED: $f"
}

echo "== TKFM OWNER NO-REDIRECT PATCH ALL =="
for f in "${TARGETS[@]}"; do
  patch_file "$f"
done

echo "DONE. Backups in: $BKDIR"
