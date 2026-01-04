#!/usr/bin/env bash
set -euo pipefail

# TKFM: wire featured loader script into radio-tv.html only (safe insert).
# Adds:
#   <script src="/js/tkfm-radio-tv-featured.js"></script>
# before </body> if missing.

ROOT="${1:-.}"
cd "$ROOT"

TARGET="radio-tv.html"
TAG='<script src="/js/tkfm-radio-tv-featured.js"></script>'

[ -f "$TARGET" ] || { echo "SKIP: $TARGET not found in root."; exit 0; }

if grep -qF "$TAG" "$TARGET"; then
  echo "OK: already wired: $TARGET"
  exit 0
fi

if grep -qi '</body>' "$TARGET"; then
  perl -0777 -i -pe "s#</body>#$TAG\n</body>#i" "$TARGET"
else
  printf "\n%s\n" "$TAG" >> "$TARGET"
fi

echo "OK: wired $TAG into $TARGET"
