#!/usr/bin/env bash
set -euo pipefail

# TKFM: ensure .tkfm_owner_key is gitignored (safe append)
LINE=".tkfm_owner_key"

touch .gitignore

if grep -qxF "$LINE" .gitignore; then
  echo "OK: .gitignore already ignores .tkfm_owner_key"
  exit 0
fi

echo "" >> .gitignore
echo "# TKFM local secrets" >> .gitignore
echo "$LINE" >> .gitignore
echo "OK: added .tkfm_owner_key to .gitignore"
