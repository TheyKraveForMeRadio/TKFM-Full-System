#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/paid-lane-singleton-install-$STAMP"
mkdir -p "$BK"

echo "== TKFM: Install Paid Lane Singleton + Submit + Owner Inbox =="

# 1) Purge legacy injected blocks first (keeps pages clean)
./scripts/purge-legacy-paid-lane-injections.sh

# 2) Inject singleton + submit scripts on pages with plans/buttons
NEED_MODAL="/js/tkfm-paid-lane-modal.js"
NEED_SUBMIT="/js/tkfm-paid-lane-submit.js"

files=()
while IFS= read -r -d '' f; do files+=("$f"); done < <(find . -maxdepth 1 -type f -name "*.html" -print0)

patched=0
for f in "${files[@]}"; do
  if ! grep -qiE 'data-plan=|js-checkout|tkfm-quick-checkout|data-open-paid-lane' "$f"; then
    continue
  fi

  cp -p "$f" "$BK/$(basename "$f")"

  # add modal script if missing
  if ! grep -qiE 'tkfm-paid-lane-modal\.js' "$f"; then
    awk -v INS="  <script src=\"${NEED_MODAL}\" defer></script>" '
      BEGIN{added=0}
      {
        if (!added && tolower($0) ~ /<\/head>/) { print INS; added=1; }
        print $0;
      }
    ' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"
    patched=$((patched+1))
  fi

  # add submit script if missing (so modal submit goes to Netlify function)
  if ! grep -qiE 'tkfm-paid-lane-submit\.js' "$f"; then
    awk -v INS="  <script src=\"${NEED_SUBMIT}\" defer></script>" '
      BEGIN{added=0}
      {
        if (!added && tolower($0) ~ /<\/head>/) { print INS; added=1; }
        print $0;
      }
    ' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"
    patched=$((patched+1))
  fi
done

echo "DONE: injected scripts where needed (ops=$patched)."
echo "Owner inbox: /owner-paid-lane-inbox.html?key=YOUR_TKFM_OWNER_KEY"
