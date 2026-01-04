#!/usr/bin/env bash
set -euo pipefail

# TKFM: wire radio-tv.html to read featured items from the new store-backed endpoint:
#   /.netlify/functions/featured-media-get
#
# This makes "Approve + Feature" in owner inbox go LIVE on radio-tv.
#
# It only does safe string replacement if radio-tv.html exists.

ROOT="${1:-.}"
cd "$ROOT"

TARGET="radio-tv.html"
[ -f "$TARGET" ] || { echo "SKIP: $TARGET not found in root."; exit 0; }

# Replace any prior endpoint strings
perl -i -pe '
  s#/\.\s*netlify\s*/\s*functions\s*/\s*media-feature-get#/.netlify/functions/featured-media-get#g;
  s#\.netlify/functions/media-feature-get#/.netlify/functions/featured-media-get#g;
  s#media-feature-get#featured-media-get#g;
' "$TARGET" || true

echo "OK: wired $TARGET to featured-media-get (store-backed)."
