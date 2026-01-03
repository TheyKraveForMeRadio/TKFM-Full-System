#!/usr/bin/env bash
set -euo pipefail

FILE="radio-tv.html"
if [ ! -f "$FILE" ]; then
  echo "❌ $FILE not found (run from v2 root)."
  exit 1
fi

ts="$(date +%Y%m%d_%H%M%S)"
cp "$FILE" "${FILE}.bak_cta_${ts}"

# Inject scripts before </head> if missing
inject_script () {
  local src="$1"
  if grep -q "$src" "$FILE"; then
    echo "ℹ️ $src already present"
    return 0
  fi
  awk -v s="$src" '
    BEGIN{done=0}
    /<\/head>/ && done==0 {
      print "  <script src=\"" s "\"></script>"
      done=1
    }
    {print}
  ' "$FILE" > "${FILE}.tmp" && mv "${FILE}.tmp" "$FILE"
  echo "✅ Injected $src"
}

inject_script "/js/tkfm-quick-checkout.js"
inject_script "/js/tkfm-featured-cta-injector.js"

echo "✅ Done. Backup: ${FILE}.bak_cta_${ts}"
