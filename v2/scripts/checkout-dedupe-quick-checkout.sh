#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/checkout-dedupe-$STAMP"
mkdir -p "$BK"

echo "== TKFM: Dedupe tkfm-quick-checkout.js includes (root HTML only) =="
echo "Backup dir: $BK"
echo

# Only patch real root-level HTML files (skip backups / legacy copies)
for f in ./*.html; do
  [ -f "$f" ] || continue

  bn="$(basename "$f")"
  if [[ "$bn" == *.BACKUP.*.html || "$bn" == *.BROKEN.*.html ]]; then
    continue
  fi

  # Count occurrences
  cnt="$(grep -oi 'tkfm-quick-checkout\.js' "$f" | wc -l | tr -d ' ')"
  if [ "$cnt" -le 1 ]; then
    continue
  fi

  cp -p "$f" "$BK/$bn"

  # Remove duplicate <script ... tkfm-quick-checkout.js ...></script> tags, keep first
  perl -0777 -i -pe '
    my $seen = 0;
    s{
      \n?[ \t]*<script\b[^>]*tkfm-quick-checkout\.js[^>]*>\s*</script>\s*
    }{
      if ($seen) { "" } else { $seen=1; $& }
    }gexis;
  ' "$f"

  echo "DEDUPED: $bn (had $cnt includes)"
done

echo
echo "DONE."
