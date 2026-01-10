#!/usr/bin/env bash
set -euo pipefail

# TKFM: move root clutter files into backups/ so repo stays clean (keeps files locally)
# Safe: does NOT delete; only moves matching patterns that exist.
# Usage: ./scripts/tkfm-move-root-junk-to-backups.sh .

ROOT="${1:-.}"
cd "$ROOT"

STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="backups/_root_junk/${STAMP}"
mkdir -p "$DEST"

moved=0

move_if_exists() {
  local f="$1"
  if [ -e "$f" ]; then
    mv -f "$f" "$DEST/"
    moved=$((moved+1))
  fi
}

move_glob() {
  local pat="$1"
  shopt -s nullglob
  local arr=( $pat )
  shopt -u nullglob
  for f in "${arr[@]}"; do
    move_if_exists "$f"
  done
}

# Common junk patterns seen in TKFM
move_glob "_redirects.BACKUP.*"
move_glob "*.BACKUP.*"
move_glob "*.BROKEN.*"
move_glob "*.tmp"
move_glob "*.bak"
move_glob "*.orig"
move_glob "PATCH_NOTES.txt"
move_glob "README__*.txt"
move_glob "README_AUTOPILOT_NATIVE_FIX.txt"
move_glob "README_POST_CHECKOUT.txt"
move_glob "README__AUTO_POST_CHECKOUT_SUBMIT.txt"
move_glob "README__ENGINE_CTA_*.txt"
move_glob "README__FEATURED_*.txt"
move_glob "README__PAID_LANE_*.txt"
move_glob "README__RADIO_TV_*.txt"
move_glob "README__REMOVE_*.txt"
move_glob "README__TKFM_*.txt"
move_glob "README__VIDEO_*.txt"
move_glob "autopilot-engine.PATCH_SNIPPET.txt"
move_glob "tkfm_checkout.json"
move_glob "nul"

if [ "$moved" -eq 0 ]; then
  echo "OK: nothing to move"
  rmdir "$DEST" 2>/dev/null || true
else
  echo "OK: moved $moved file(s) -> $DEST"
fi

echo "NOTE: backups/ is ignored/locked, so these won't affect deploys."
