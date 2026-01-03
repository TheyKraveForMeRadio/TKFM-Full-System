#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/checkout-markup-fix-$STAMP"
mkdir -p "$BK"

echo "== TKFM: Audit + Fix checkout markup sitewide =="
echo "Backup dir: $BK"
echo

# Move confusing legacy copies out of root (keep them, just relocate)
mkdir -p backups/legacy-html
find . -maxdepth 1 -type f \( -name "*.BACKUP.*.html" -o -name "*.BROKEN.*.html" \) -print0 | while IFS= read -r -d '' f; do
  cp -p "$f" "$BK/$(basename "$f")"
  mv "$f" "backups/legacy-html/$(basename "$f")"
  echo "MOVED legacy: $(basename "$f") -> backups/legacy-html/"
done
echo

# Helper: patch file with backup
patch_file() {
  local f="$1"
  cp -p "$f" "$BK/$(basename "$f")"

  # 1) normalize attribute variants
  perl -0777 -i -pe 's/\bdata-plan-id=/data-plan=/gi; s/\bdata-planId=/data-plan=/gi; s/\bdata-feature-id=/data-feature=/gi; s/\bdata-featureId=/data-feature=/gi;' "$f"

  # 2) ensure tkfm-quick-checkout.js is loaded if page has checkout signals
  if grep -qiE 'js-checkout|data-plan=|data-feature=' "$f"; then
    if ! grep -qi 'tkfm-quick-checkout\.js' "$f"; then
      perl -0777 -i -pe 's#</head>#  <script src="/js/tkfm-quick-checkout.js"></script>\n</head>#i' "$f"
      echo "INJECTED script: $f"
    fi
  fi

  # 3) ensure elements with data-plan/data-feature have js-checkout class
  # add js-checkout into class="..." when missing
  perl -0777 -i -pe '
    s{(<(button|a)\b[^>]*\bdata-(plan|feature)=["][^"]+["][^>]*\bclass=["])([^"]*)(["][^>]*>)}{
      my ($pre,$tag,$which,$cls,$post)=($1,$2,$3,$4,$5);
      if ($cls !~ /\bjs-checkout\b/i) { $cls .= " js-checkout"; }
      $pre.$cls.$post;
    }gexi
  ' "$f"

  # 4) if js-checkout exists but no data-plan/feature, leave it (audit will report)
}

# Patch all html (excluding backups already moved)
COUNT=0
while IFS= read -r f; do
  patch_file "$f"
  COUNT=$((COUNT+1))
done < <(find . -maxdepth 1 -type f -name "*.html" ! -name "*.BACKUP.*.html" ! -name "*.BROKEN.*.html" | sort)

echo
echo "Patched $COUNT HTML files (with backups)."
echo

echo "== AUDIT: checkout elements missing planId =="
grep -RIn --include="*.html" 'class="[^"]*\bjs-checkout\b[^"]*"' . \
| while IFS=: read -r file line rest; do
  html="$(sed -n "${line}p" "$file")"
  echo "$html" | grep -qiE 'data-plan=|data-feature=' || echo "NO PLANID => $file:$line:$html"
done

echo
echo "DONE."
