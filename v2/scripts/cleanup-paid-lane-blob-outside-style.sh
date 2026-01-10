#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Remove stray Paid Lane blob OUTSIDE <style>/<script> =="

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/cleanup-paid-lane-outside-$STAMP"
mkdir -p "$BK"

PAGES=(video-engine.html podcast-engine.html press-engine.html social-engine.html pricing.html)

for f in "${PAGES[@]}"; do
  [ -f "$f" ] || continue
  cp -p "$f" "$BK/$f"

  awk '
    BEGIN{in_style=0; in_script=0}
    {
      line=$0
      low=line
      # track style/script blocks (case-insensitive)
      if (low ~ /<style[^>]*>/i) in_style=1
      if (low ~ /<\/style>/i) in_style=0
      if (low ~ /<script[^>]*>/i) in_script=1
      if (low ~ /<\/script>/i) in_script=0

      if (in_style || in_script) { print; next }

      # remove the pasted CSS line if it appears as raw text
      if (index(line, "#tkfmPaidLaneModal[data-open")>0) next
      if (index(line, "background:#020617; background-image: radial-gradient")>0) next

      # remove standalone raw labels
      if (line ~ /^TKFM\s*$/) next
      if (line ~ /^Paid Lane Submission\s*$/) next
      if (line ~ /^Submit instantly after purchase/) next
      if (line ~ /^Lane:\s*\(not set\)/) next
      if (line ~ /^Close\s*$/) next
      if (line ~ /^Title\s*$/) next
      if (line ~ /^Project \/ Track \/ Campaign title\s*$/) next
      if (line ~ /^Link\s*$/) next
      if (line ~ /^https:\/\/ \(YouTube, SoundCloud, Drive, Dropbox, Press link\.\.\.\)/) next
      if (line ~ /^Contact\s*$/) next
      if (line ~ /^Email \/ IG \/ Phone/) next
      if (line ~ /^Notes\s*$/) next
      if (line ~ /^Any details you want TKFM/) next
      if (line ~ /^Next step: Go to your lane\s*$/) next
      if (line ~ /^Submit Now\s*$/) next

      print
    }
  ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"

  echo "CLEANED: $f"
done

echo "Backups: $BK"
