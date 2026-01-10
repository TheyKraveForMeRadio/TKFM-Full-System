#!/usr/bin/env bash
set -euo pipefail

[ -f .gitignore ] || { echo "FAIL: missing .gitignore"; exit 2; }
[ -x scripts/tkfm-secret-scan.sh ] || { echo "FAIL: missing scripts/tkfm-secret-scan.sh"; exit 3; }
[ -x scripts/tkfm-install-prepush-hook.sh ] || { echo "FAIL: missing scripts/tkfm-install-prepush-hook.sh"; exit 4; }

grep -q "TKFM: Repo Secret Shield" .gitignore || echo "WARN: .gitignore secret shield block not detected (run ./scripts/tkfm-wire-gitignore-secret-shield.sh .)"

echo "OK"
