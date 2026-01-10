#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/paid-lane-modal-singleton-$STAMP"
mkdir -p "$BK"

echo "== TKFM: Install GLOBAL Paid Lane Modal Singleton sitewide =="
echo "Backup dir: $BK"
echo

NEED_JS="/js/tkfm-paid-lane-modal.js"

# patch only top-level html pages (v2 root)
files=()
while IFS= read -r -d '' f; do files+=("$f"); done < <(find . -maxdepth 1 -type f -name "*.html" -print0)

patched=0
for f in "${files[@]}"; do
  # pages likely to need it
  if ! grep -qiE 'data-plan=|js-checkout|tkfm-quick-checkout|data-open-paid-lane|open-paid-lane' "$f"; then
    continue
  fi

  cp -p "$f" "$BK/$(basename "$f")"

  if ! grep -qiE 'tkfm-paid-lane-modal\.js' "$f"; then
    awk -v INS="  <script src=\"${NEED_JS}\" defer></script>" '
      BEGIN{added=0}
      {
        if (!added && tolower($0) ~ /<\/head>/) { print INS; added=1; }
        print $0;
      }
    ' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"
    echo "PATCHED: $(basename "$f")"
    patched=$((patched+1))
  fi
done

echo
echo "DONE: injected modal script into $patched pages."
echo
echo "Trigger anywhere:"
echo "  <button data-open-paid-lane=\"1\" data-plan=\"video_monthly_visuals\">Submit Now</button>"
echo
echo "Auto-open URL:"
echo "  /video-engine.html?submit=1&lane=video_monthly_visuals"
