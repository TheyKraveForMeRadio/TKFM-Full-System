#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Add a link button into label-studio-hub.html if present (safe/idempotent)
F="label-studio-hub.html"
if [ ! -f "$F" ]; then
  echo "SKIP: $F not found"
  exit 0
fi

# Already linked?
if grep -q 'label-studio-my-deliverables.html' "$F"; then
  echo "OK: link already present in $F"
  exit 0
fi

# Insert near first occurrence of label-studio-create or a nav row
awk '
BEGIN{done=0}
{
  print $0
  if(!done && ($0 ~ /label-studio-create/ || $0 ~ /Studio Hub/)){
    print "<div style=\"margin-top:10px\">"
    print "  <a href=\"/label-studio-my-deliverables.html\" class=\"btn ghost\" style=\"text-decoration:none\">My Deliverables</a>"
    print "</div>"
    done=1
  }
}' "$F" > "$F.__tmp__" && mv "$F.__tmp__" "$F"

echo "PATCHED: $F"
