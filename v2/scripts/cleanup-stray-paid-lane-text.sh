#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: FIX stray pasted modal CSS/text shown on page =="

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/cleanup-stray-paid-lane-$STAMP"
mkdir -p "$BK"

PAGES=(video-engine.html podcast-engine.html press-engine.html social-engine.html pricing.html)

for f in "${PAGES[@]}"; do
  [ -f "$f" ] || continue
  cp -p "$f" "$BK/$f"

  awk '
    BEGIN{skip=0}
    {
      line=$0

      if (index(line, "#tkfmPaidLaneModal[data-open")>0) { skip=1 }
      if (index(line, "background:#020617; background-image: radial-gradient")>0) { skip=1 }

      if (skip==1) {
        if (index(line, "max-width:92vw")>0 || index(line, ".toast{")>0 || line ~ /}\s*$/) { skip=0 }
        next
      }

      if (line ~ /^TKFM\s*$/) next
      if (line ~ /^Paid Lane Submission\s*$/) next
      if (line ~ /^Submit instantly after purchase/) next
      if (line ~ /^Lane:\s*\(not set\)/) next
      if (line ~ /^Close\s*$/) next
      if (line ~ /^Title\s*$/) next
      if (line ~ /^Project \/ Track \/ Campaign title\s*$/) next
      if (line ~ /^Link\s*$/) next
      if (line ~ /^https:\/\/ \(YouTube, SoundCloud, Drive, Dropbox, Press link\.\.\.\)\s*$/) next
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
