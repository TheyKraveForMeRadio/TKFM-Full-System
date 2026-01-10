#!/usr/bin/env bash
set -euo pipefail
echo "== TKFM: Force rebuild ALL <style> blocks in video-engine.html (fix CSS parser errors) =="
node scripts/force-rebuild-video-engine-styles.mjs
