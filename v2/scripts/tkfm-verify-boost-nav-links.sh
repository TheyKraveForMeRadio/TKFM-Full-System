#!/usr/bin/env bash
set -euo pipefail

# TKFM: Verify Rotation Boost link present across key pages
# Usage: ./scripts/tkfm-verify-boost-nav-links.sh

FILES=(index.html pricing.html radio-hub.html feature-engine.html social-engine.html dj-mixtape-hosting.html label-home.html label-hub.html dashboard.html)

OKC=0
MISS=0

for f in "${FILES[@]}"; do
  if [ -f "$f" ]; then
    if grep -q 'href="/rotation-boost.html"' "$f"; then
      echo "OK: $f"
      OKC=$((OKC+1))
    else
      echo "FAIL: missing link in $f"
      MISS=$((MISS+1))
    fi
  else
    echo "WARN: missing file $f (skipping)"
  fi
done

if [ "$MISS" -gt 0 ]; then
  echo "FAIL: $MISS files missing boost link"
  exit 2
fi

echo "DONE: $OKC files OK"
