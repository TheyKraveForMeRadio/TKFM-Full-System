#!/usr/bin/env bash
set -euo pipefail

# TKFM: wire post-checkout autosubmit script into post-checkout.html only.
# Adds:
#   <script src="/js/tkfm-post-checkout-autosubmit.js"></script>
# before </body> if missing.

ROOT="${1:-.}"
cd "$ROOT"

TARGET="post-checkout.html"
TAG='<script src="/js/tkfm-post-checkout-autosubmit.js"></script>'

if [ ! -f "$TARGET" ]; then
  echo "SKIP: $TARGET not found in root."
  exit 0
fi

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
