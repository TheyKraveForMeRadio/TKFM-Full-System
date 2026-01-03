#!/usr/bin/env bash
set -euo pipefail

# Run Netlify Dev from repo root even if user is inside /v2
HERE="$(pwd)"
if [[ "$HERE" == *"/v2" ]]; then
  cd ..
fi

echo "== TKFM: starting netlify dev from $(pwd) =="
netlify dev --port 8888
