#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

F="label-studio-hub.html"
if [ ! -f "$F" ]; then
  echo "SKIP: $F not found"
  exit 0
fi

if grep -q 'label-studio-quickstart.html' "$F"; then
  echo "OK: already linked"
  exit 0
fi

awk '
BEGIN{done=0}
{
  print $0
  if(!done && ($0 ~ /Studio Hub/ || $0 ~ /label-studio-create/)){
    print "<div style=\"margin-top:10px\">"
    print "  <a href=\"/label-studio-quickstart.html\" class=\"btn ghost\" style=\"text-decoration:none\">Studio Quick Start</a>"
    print "</div>"
    done=1
  }
}' "$F" > "$F.__tmp__" && mv "$F.__tmp__" "$F"

echo "PATCHED: $F"
