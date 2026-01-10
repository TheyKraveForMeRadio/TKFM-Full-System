#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Emergency restore for engine pages (from latest backups) =="
echo "This restores full page content if a previous patch accidentally wiped markup."
echo

FILES=(
  "video-engine.html"
  "podcast-engine.html"
  "press-engine.html"
  "social-engine.html"
  "pricing.html"
)

found_any=0

latest_backup_for () {
  local name="$1"
  local best=""
  # 1) any backups/*/**/NAME (our scripts usually copy originals here)
  if [ -d "backups" ]; then
    best="$(find backups -type f -name "$name" -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n1 | awk '{print $2}')"
  fi
  if [ -n "${best:-}" ] && [ -f "$best" ]; then
    echo "$best"
    return 0
  fi

  # 2) root legacy copies like NAME.BACKUP.* or NAME.BROKEN.* (if they exist)
  best="$(find . -maxdepth 1 -type f -name "${name}.BACKUP.*" -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n1 | awk '{print $2}')"
  if [ -n "${best:-}" ] && [ -f "$best" ]; then
    echo "$best"
    return 0
  fi
  best="$(find . -maxdepth 1 -type f -name "${name}.BROKEN.*" -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n1 | awk '{print $2}')"
  if [ -n "${best:-}" ] && [ -f "$best" ]; then
    echo "$best"
    return 0
  fi

  return 1
}

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/emergency-restore-$STAMP"
mkdir -p "$BK"

for f in "${FILES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "SKIP (missing file): $f"
    continue
  fi

  src="$(latest_backup_for "$f" || true)"
  if [ -z "${src:-}" ]; then
    echo "WARN: No backup found for $f (leaving as-is)"
    continue
  fi

  cp -p "$f" "$BK/$f"
  cp -p "$src" "$f"
  echo "RESTORED: $f  <=  $src"
  found_any=1
done

echo
if [ "$found_any" -eq 1 ]; then
  echo "✅ Restore complete."
  echo "Backup of your CURRENT (possibly broken) files saved in: $BK"
else
  echo "⚠️ No restores performed (no backups found)."
  echo "If this repo is git-tracked, you can also restore with:"
  echo "  git checkout -- video-engine.html podcast-engine.html press-engine.html social-engine.html pricing.html"
fi
