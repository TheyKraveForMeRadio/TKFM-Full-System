#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Patch media-feature-get to use shared store key env var (safe) =="

# Candidate filenames
CAND=(
  "netlify/functions/media-feature-get.js"
  "netlify/functions/media-feature-get.mjs"
  "netlify/functions/media-feature-get.ts"
)

found=""
for f in "${CAND[@]}"; do
  if [ -f "$f" ]; then found="$f"; break; fi
done

if [ -z "$found" ]; then
  echo "SKIP: media-feature-get not found (no file patched)."
  exit 0
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/media-feature-get-storekey-$STAMP"
mkdir -p "$BK"
cp -p "$found" "$BK/$(basename "$found")"

echo "FOUND: $found"
echo "BACKUP: $BK/$(basename "$found")"

# Try to replace any hardcoded getStore('something') key with env-based key.
# We only patch if file contains getStore('...') with a simple string literal.

perl -0777 -i -pe '
  # introduce featuredKey if missing
  if ($_ !~ /TKFM_MEDIA_FEATURE_STORE_KEY/) {
    s/(const\s+)([A-Za-z_][A-Za-z0-9_]*)\s*=\s*await\s+getStore\(\s*[\"\x27][^\"\x27]+[\"\x27]\s*\)/const featuredKey = process.env.TKFM_MEDIA_FEATURE_STORE_KEY || \x27media_featured\x27;\n$1$2 = await getStore(featuredKey)/s
      or
    s/(await\s+getStore)\(\s*[\"\x27][^\"\x27]+[\"\x27]\s*\)/$1(featuredKey)/s;
  }
' "$found" || true

echo "DONE: patched store key reference (best effort)."
