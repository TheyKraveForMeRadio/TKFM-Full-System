#!/usr/bin/env bash
set -euo pipefail

CTX="production"
SCOPE="functions"
while [ $# -gt 0 ]; do
  case "$1" in
    --context) CTX="$2"; shift 2;;
    --scope) SCOPE="$2"; shift 2;;
    *) shift;;
  esac
done

if ! command -v netlify >/dev/null 2>&1; then
  echo "FAIL: netlify CLI not found"
  exit 2
fi

TMP="${TMPDIR:-/tmp}/tkfm_netlify_env_plain.txt"
rm -f "$TMP" 2>/dev/null || true

(netlify env:list --plain --context "$CTX" --scope "$SCOPE" 2>/dev/null || true) | tr -d '\r' > "$TMP" || true
if [ ! -s "$TMP" ]; then
  echo "FAIL: netlify env:list produced no output (are you linked?)"
  echo "Run: netlify status && netlify link"
  exit 3
fi

echo "== TKFM NETLIFY ENV AUDIT (plain) =="
echo "Filter: context=$CTX scope=$SCOPE"
echo "Source: $TMP"
TOTAL="$(awk -F= 'NF>=2 && $1 ~ /^[A-Z0-9_]+$/ { line=$0; gsub(/\r/,"",line); total+=length(line);} END{print total+0}' "$TMP")"
echo "TOTAL_BYTES=$TOTAL"
echo
echo "TOP40_BYTES KEY"
awk -F= 'NF>=2 && $1 ~ /^[A-Z0-9_]+$/ { line=$0; gsub(/\r/,"",line); printf("%6d %s\n", length(line), $1); }' "$TMP" | sort -nr | head -n 40
echo
echo "HINT: If TOTAL_BYTES is > 4096 (functions+production), Lambda deploy can fail."
