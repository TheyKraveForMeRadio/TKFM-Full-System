#!/usr/bin/env bash
set -euo pipefail

# TKFM SINGLE DEPLOY BUNDLE (manual dist deploy friendly)
# Goal: run ALL injectors + build once.
# You run this locally, then deploy ONCE.

cd "$(dirname "$0")/.."

echo "== TKFM: Single Deploy Bundle =="

echo "1) Ensure scripts executable..."
chmod +x scripts/*.sh 2>/dev/null || true

echo "2) Run injectors if present..."
[ -f scripts/tkfm-inject-create-studio-cta.sh ] && scripts/tkfm-inject-create-studio-cta.sh || true
[ -f scripts/tkfm-inject-pro-mix-lane.sh ] && scripts/tkfm-inject-pro-mix-lane.sh || true
[ -f scripts/tkfm-inject-rush-upsell.sh ] && scripts/tkfm-inject-rush-upsell.sh || true
[ -f scripts/tkfm-inject-addons.sh ] && scripts/tkfm-inject-addons.sh || true
[ -f scripts/tkfm-inject-prefill.sh ] && scripts/tkfm-inject-prefill.sh || true
[ -f scripts/tkfm-inject-deliverables-link.sh ] && scripts/tkfm-inject-deliverables-link.sh || true
[ -f scripts/tkfm-inject-profile-link.sh ] && scripts/tkfm-inject-profile-link.sh || true
[ -f scripts/tkfm-inject-quickstart-link.sh ] && scripts/tkfm-inject-quickstart-link.sh || true

echo "3) Build once..."
npm run build

echo "4) Verify key pages in dist..."
ls -la dist/label-studio-create-ultimate.html 2>/dev/null || true
ls -la dist/label-studio-my-deliverables.html 2>/dev/null || true
ls -la dist/label-studio-profile.html 2>/dev/null || true
ls -la dist/label-studio-quickstart.html 2>/dev/null || true
ls -la dist/owner-mix-lab-ops.html dist/owner-deliver-request.html 2>/dev/null || true

echo "DONE. Now deploy ONCE using your manual dist deploy command."
