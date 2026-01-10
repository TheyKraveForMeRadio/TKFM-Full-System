#!/usr/bin/env bash
set -euo pipefail
echo "== TKFM: Emergency restore v2 (prefers backups with <body> intact) =="
STAMP="$(date +%Y%m%d_%H%M%S)"
OUTBK="backups/emergency-restore-v2-$STAMP"
mkdir -p "$OUTBK"

PAGES=(video-engine.html podcast-engine.html press-engine.html social-engine.html pricing.html)

pick_backup() {
  local page="$1"
  # newest backups first (by path sort using ls -t)
  local candidate
  candidate="$(ls -t backups/**/"$page" 2>/dev/null | head -n 50 || true)"
  if [ -z "$candidate" ]; then
    echo ""
    return 0
  fi

  # choose first that has body + /body
  while IFS= read -r f; do
    if grep -qi '<body' "$f" && grep -qi '</body>' "$f"; then
      echo "$f"
      return 0
    fi
  done <<< "$candidate"

  # else just return newest
  echo "$(echo "$candidate" | head -n 1)"
}

restore_from_git() {
  local page="$1"
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if git show "HEAD:$page" >/dev/null 2>&1; then
      cp -p "$page" "$OUTBK/$page.current" 2>/dev/null || true
      git show "HEAD:$page" > "$page"
      echo "RESTORED: $page <= git HEAD"
      return 0
    fi
  fi
  return 1
}

for page in "${PAGES[@]}"; do
  [ -f "$page" ] || continue
  cp -p "$page" "$OUTBK/$page.current"

  b="$(pick_backup "$page")"
  if [ -n "$b" ] && [ -f "$b" ]; then
    cp -p "$b" "$page"
    echo "RESTORED: $page <= $b"
  else
    if restore_from_git "$page"; then
      : 
    else
      echo "SKIP: $page (no backups found and git fallback unavailable)"
    fi
  fi
done

echo "Backup of pre-restore files: $OUTBK"
