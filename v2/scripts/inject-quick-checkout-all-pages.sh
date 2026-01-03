\
#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Inject /js/tkfm-quick-checkout.js into EVERY HTML page that has checkout buttons =="
echo "This will SKIP backup/broken copies (*.BACKUP.* *.BROKEN.*) and anything under ./backups/ ./dist/ ./node_modules/"
echo

TS="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="backups/inject-quick-checkout-${TS}"
mkdir -p "${BACKUP_DIR}"

# Find candidate HTML files (skip backups + dist + node_modules)
mapfile -t FILES < <(
  find . \
    -type d \( -name node_modules -o -name dist -o -name .git -o -name backups \) -prune -false \
    -o -type f -name "*.html" \
    ! -name "*.BACKUP.*.html" \
    ! -name "*.BROKEN.*.html" \
    -print | sed 's|^\./||'
)

patched=0
checked=0
skipped=0

for f in "${FILES[@]}"; do
  # Only touch pages that actually have checkout buttons/signals
  if ! grep -qiE 'js-checkout|data-plan=|data-feature=|create-checkout-session|checkout' "$f"; then
    continue
  fi

  checked=$((checked+1))

  # Already has the script? skip
  if grep -qi 'tkfm-quick-checkout\.js' "$f"; then
    continue
  fi

  # Backup original
  mkdir -p "${BACKUP_DIR}/$(dirname "$f")"
  cp -a "$f" "${BACKUP_DIR}/$f"

  # Inject in <head> before </head> if possible, otherwise inject after <body>
  if grep -qi '</head>' "$f"; then
    perl -0777 -i -pe 's#</head>#  <script src="/js/tkfm-quick-checkout.js"></script>\n</head>#i' "$f"
    patched=$((patched+1))
    echo "PATCHED: $f (in <head>)"
  elif grep -qi '<body' "$f"; then
    perl -0777 -i -pe 's#(<body\b[^>]*>)#$1\n  <script src="/js/tkfm-quick-checkout.js"></script>#i' "$f"
    patched=$((patched+1))
    echo "PATCHED: $f (after <body>)"
  else
    skipped=$((skipped+1))
    echo "SKIP (no <head>/<body>): $f"
  fi
done

echo
echo "Checked ${checked} checkout pages. Injected script into ${patched} pages. Skipped ${skipped}."
echo "Backups saved to: ${BACKUP_DIR}"
