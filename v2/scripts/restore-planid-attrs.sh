#!/usr/bin/env bash
set -euo pipefail

echo "TKFM: Restoring planId attributes across root HTML (safe normalization)"
mkdir -p backups
stamp="$(date +%Y%m%d_%H%M%S)"

if ! ls *.html >/dev/null 2>&1; then
  echo "No .html files found at repo root. Run this from /v2."
  exit 1
fi

for f in *.html; do
  cp -f "$f" "backups/${f}.bak_planid_${stamp}"
  perl -0777 -i -pe '
    s/\bdata-plan-id\s*=/data-plan=/g;
    s/\bdata-planId\s*=/data-plan=/g;
    s/\bdata-planid\s*=/data-plan=/g;

    s/\bdata-feature-id\s*=/data-feature=/g;
    s/\bdata-featureId\s*=/data-feature=/g;
    s/\bdata-featureid\s*=/data-feature=/g;
  ' "$f"
done

echo "Done. Backups in: backups/*.bak_planid_${stamp}"
