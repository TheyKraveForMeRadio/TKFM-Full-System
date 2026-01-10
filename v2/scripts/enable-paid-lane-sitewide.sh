#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/paid-lane-sitewide-$STAMP"
mkdir -p "$BK"

echo "== TKFM: Enable PAID LANE modal sitewide (no page wipes) =="
echo "Backup dir: $BK"
echo

NEED_JS="/js/tkfm-paid-lane-modal.js"

# Only patch real pages (ignore backups folder)
files=()
while IFS= read -r -d '' f; do files+=("$f"); done < <(find . -maxdepth 1 -type f -name "*.html" -print0)

patched=0
for f in "${files[@]}"; do
  # patch only pages that have plans / checkout CTAs / or submission CTAs
  if ! grep -qiE 'data-plan=|js-checkout|tkfm-quick-checkout|open-paid-lane|data-open-paid-lane' "$f"; then
    continue
  fi

  cp -p "$f" "$BK/$(basename "$f")"

  if ! grep -qiE 'tkfm-paid-lane-modal\.js' "$f"; then
    # inject before </head>
    awk -v INS="  <script src=\"/js/tkfm-paid-lane-modal.js\" defer></script>" '
      BEGIN{added=0}
      {
        if (!added && tolower($0) ~ /<\/head>/) { print INS; added=1; }
        print $0;
      }
      END{}
    ' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"
    echo "PATCHED: $(basename "$f") (added modal script)"
    patched=$((patched+1))
  fi
done

echo
echo "DONE. Patched $patched pages."
echo "If a page needs a trigger button, use:"
echo "  <button data-open-paid-lane=\"1\" data-plan=\"video_monthly_visuals\">Submit Now</button>"
