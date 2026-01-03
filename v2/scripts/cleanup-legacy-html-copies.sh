\
#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Move .BACKUP/.BROKEN HTML copies out of root so they don't confuse scans/builds =="

TS="$(date +%Y%m%d_%H%M%S)"
DEST="backups/legacy-html-${TS}"
mkdir -p "${DEST}"

moved=0

# Move backup/broken html files in project root (and immediate subfolders) into backups
# Keep original relative folder structure.
while IFS= read -r f; do
  rel="${f#./}"
  mkdir -p "${DEST}/$(dirname "$rel")"
  mv "$f" "${DEST}/$rel"
  moved=$((moved+1))
  echo "MOVED: ${rel}"
done < <(
  find . \
    -type d \( -name node_modules -o -name dist -o -name .git -o -name backups \) -prune -false \
    -o -type f \( -name "*.BACKUP.*.html" -o -name "*.BROKEN.*.html" \) -print
)

echo
echo "Moved ${moved} files into: ${DEST}"
