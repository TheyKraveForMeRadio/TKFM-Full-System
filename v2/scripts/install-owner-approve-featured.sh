#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Install Owner Approve → Featured pipeline =="

# 1) Patch media-feature-get store key (safe)
./scripts/patch-media-feature-get-store-key.sh

# 2) Patch owner inbox UI
./scripts/patch-owner-paid-lane-inbox-approve.sh

echo
echo "DONE."
echo "Owner inbox:"
echo "  /owner-paid-lane-inbox.html?key=YOUR_TKFM_OWNER_KEY"
