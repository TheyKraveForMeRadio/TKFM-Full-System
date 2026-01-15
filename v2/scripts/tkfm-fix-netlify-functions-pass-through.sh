#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "TKFM: Fix Netlify redirect rules that send /.netlify/functions/* to homepage"
echo

# 1) Ensure _redirects has a pass-through rule at the TOP
RED="_redirects"
RULE='/.netlify/functions/*  /.netlify/functions/:splat  200!'

if [ -f "$RED" ]; then
  if grep -q '/.netlify/functions/*' "$RED"; then
    echo "OK: _redirects already has a functions rule"
  else
    echo "PATCH: prepend functions rule to _redirects"
    tmp="$RED.__tmp__"
    printf "%s\n" "$RULE" > "$tmp"
    cat "$RED" >> "$tmp"
    mv "$tmp" "$RED"
  fi
else
  echo "CREATE: _redirects with functions rule"
  printf "%s\n" "$RULE" > "$RED"
fi

# 2) If netlify.toml exists, ensure a functions redirect block exists BEFORE any catchall
TOML="netlify.toml"
if [ -f "$TOML" ]; then
  if grep -q 'from *= *"/\.netlify/functions/\*"' "$TOML"; then
    echo "OK: netlify.toml already has functions redirect block"
  else
    echo "PATCH: insert functions redirect block into netlify.toml"
    block='[[redirects]]
from = "/.netlify/functions/*"
to = "/.netlify/functions/:splat"
status = 200
force = true

'

    # insert block before first catchall redirect (from = "/*") if present; else append at end
    tmp="$TOML.__tmp__"
    awk -v block="$block" 'BEGIN{done=0}
      {
        if(!done && $0 ~ /from[[:space:]]*=[[:space:]]*"\/\*"/){
          printf "%s", block
          done=1
        }
        print $0
      }
      END{
        if(!done){
          printf "\n%s", block
        }
      }' "$TOML" > "$tmp"
    mv "$tmp" "$TOML"
  fi
else
  echo "NOTE: netlify.toml not found (that is OK). _redirects rule will handle it."
fi

echo
echo "DONE."
echo "Next: redeploy (or netlify dev). Functions should no longer rewrite to index.html."
