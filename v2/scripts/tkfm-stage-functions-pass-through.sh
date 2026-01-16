#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Stage-only fix: ensure functions path is NOT caught by SPA redirect when you DO deploy.
RED="_redirects"
RULE='/.netlify/functions/*  /.netlify/functions/:splat  200!'

if [ -f "$RED" ]; then
  if grep -q '/.netlify/functions/*' "$RED"; then
    echo "OK: _redirects already has functions rule"
  else
    tmp="$RED.__tmp__"
    printf "%s\n" "$RULE" > "$tmp"
    cat "$RED" >> "$tmp"
    mv "$tmp" "$RED"
    echo "PATCHED: _redirects (prepended functions rule)"
  fi
else
  printf "%s\n" "$RULE" > "$RED"
  echo "CREATED: _redirects"
fi

echo "DONE (staged). No deploy performed."
