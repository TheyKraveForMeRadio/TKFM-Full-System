#!/usr/bin/env bash
set -euo pipefail

# TKFM: store owner key locally in ./.tkfm_owner_key (gitignored)
# Usage:
#   ./scripts/tkfm-set-owner-key.sh "PASTE_KEY"
#   ./scripts/tkfm-set-owner-key.sh --clipboard   (Windows Git Bash: reads clipboard via powershell)
#
# After this, all owner scripts can run WITHOUT exporting TKFM_OWNER_KEY.

ROOT="${1:-}"
if [ "${ROOT}" = "--clipboard" ]; then
  # Windows Git Bash clipboard read
  KEY="$(powershell.exe -NoProfile -Command "Get-Clipboard" 2>/dev/null | tr -d '\r' | head -n 1 | xargs || true)"
else
  KEY="$(printf "%s" "${ROOT}" | tr -d '\r\n' | xargs)"
fi

if [ -z "${KEY}" ]; then
  echo "FAIL: missing key. Use:"
  echo "  ./scripts/tkfm-set-owner-key.sh \"PASTE_KEY\""
  echo "  ./scripts/tkfm-set-owner-key.sh --clipboard"
  exit 2
fi

printf "%s" "${KEY}" > .tkfm_owner_key
echo "OK: saved ./.tkfm_owner_key (local only)"
