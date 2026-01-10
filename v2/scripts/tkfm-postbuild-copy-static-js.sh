#!/usr/bin/env bash
set -euo pipefail

mkdir -p dist/js

copy_one () {
  local src="$1"
  local dst="$2"
  if [ -f "$src" ]; then
    cp -f "$src" "$dst"
  fi
}

# Owner guard scripts
copy_one public/js/tkfm-owner-guard.js dist/js/tkfm-owner-guard.js
copy_one public/js/tkfm-owner-gate-no-redirect.js dist/js/tkfm-owner-gate-no-redirect.js
copy_one js/tkfm-owner-guard.js dist/js/tkfm-owner-guard.js
copy_one js/tkfm-owner-gate-no-redirect.js dist/js/tkfm-owner-gate-no-redirect.js

# Paid lane scripts
copy_one public/js/tkfm-paid-lane-modal.js dist/js/tkfm-paid-lane-modal.js
copy_one public/js/tkfm-paid-lane-submit.js dist/js/tkfm-paid-lane-submit.js
copy_one js/tkfm-paid-lane-modal.js dist/js/tkfm-paid-lane-modal.js
copy_one js/tkfm-paid-lane-submit.js dist/js/tkfm-paid-lane-submit.js

# Quick checkout (if present)
copy_one public/js/tkfm-quick-checkout.js dist/js/tkfm-quick-checkout.js
copy_one js/tkfm-quick-checkout.js dist/js/tkfm-quick-checkout.js

echo "OK: postbuild copied critical static js into dist/js"
ls -la dist/js | sed -n '1,60p'
