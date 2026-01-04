#!/usr/bin/env bash
set -euo pipefail
F="${1:-owner-paid-lane-inbox.html}"
if [ ! -f "$F" ]; then
  echo "MISSING: $F"
  exit 1
fi
if grep -q "owner-featured-manager.html" "$F"; then
  echo "OK: link present in $F"
  exit 0
fi
echo "NOT FOUND: link missing in $F"
exit 2
