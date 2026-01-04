#!/usr/bin/env bash
set -euo pipefail

# TKFM: wire paid lane modal script into ROOT html pages (never touch backups/ or dist/)
# Adds: <script src="/js/tkfm-paid-lane-modal.js"></script> before </body> if missing

ROOT="${1:-.}"
SCRIPT_TAG='<script src="/js/tkfm-paid-lane-modal.js"></script>'

cd "$ROOT"

shopt -s nullglob
for f in *.html; do
  [ -f "$f" ] || continue

  # skip obvious generated pages if user keeps them in root
  case "$f" in
    */* ) continue ;;
  esac

  if grep -qF "$SCRIPT_TAG" "$f"; then
    continue
  fi

  # insert before </body>, else append at end
  if grep -qi '</body>' "$f"; then
    perl -0777 -i -pe "s#</body>#$SCRIPT_TAG\n</body>#i" "$f"
  else
    printf "\n%s\n" "$SCRIPT_TAG" >> "$f"
  fi
done

echo "OK: wired tkfm-paid-lane-modal.js into root *.html"
