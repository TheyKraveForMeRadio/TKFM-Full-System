#!/usr/bin/env bash
set -euo pipefail
echo "== TKFM: Hard repair video-engine.html (head/body/style rebuild) =="
node scripts/fix-video-engine-hard-repair.mjs
