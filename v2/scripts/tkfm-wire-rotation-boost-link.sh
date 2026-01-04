#!/usr/bin/env bash
set -euo pipefail

# TKFM: wire Rotation Boost link into radio-hub.html (CJS-safe)

ROOT="${1:-.}"
cd "$ROOT"

node scripts/tkfm-wire-rotation-boost-link.cjs radio-hub.html || true
