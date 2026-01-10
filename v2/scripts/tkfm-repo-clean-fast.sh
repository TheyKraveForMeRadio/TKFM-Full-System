#!/usr/bin/env bash
set -euo pipefail

# TKFM: one-shot repo clean (ignore wiring + move junk + untrack node_modules if needed)
# Usage: ./scripts/tkfm-repo-clean-fast.sh .

ROOT="${1:-.}"
cd "$ROOT"

chmod +x scripts/tkfm-wire-repo-clean-gitignore.sh scripts/tkfm-move-root-junk-to-backups.sh scripts/tkfm-untrack-node_modules.sh 2>/dev/null || true

./scripts/tkfm-wire-repo-clean-gitignore.sh .
./scripts/tkfm-move-root-junk-to-backups.sh .
./scripts/tkfm-untrack-node_modules.sh

echo "DONE: repo hygiene applied"
echo "NEXT:"
echo "  git status"
echo "  git add .gitignore"
echo "  git commit -m \"Repo clean: ignore junk + quarantine backups + untrack node_modules\" || true"
echo "  git push || true"
