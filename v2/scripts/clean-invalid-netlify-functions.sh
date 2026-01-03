#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

mkdir -p backups/netlify-functions
shopt -s nullglob

moved=0
for f in netlify/functions/*BACKUP* netlify/functions/*.BACKUP.* netlify/functions/*backup* netlify/functions/*.bak*; do
  bn="$(basename "$f")"
  echo "Moving invalid function file: $f -> backups/netlify-functions/$bn"
  mv -f "$f" "backups/netlify-functions/$bn"
  moved=1
done

if [[ "$moved" -eq 0 ]]; then
  echo "No invalid backup function files found in netlify/functions."
fi
