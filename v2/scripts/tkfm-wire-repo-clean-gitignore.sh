#!/usr/bin/env bash
set -euo pipefail

# TKFM: add repo hygiene ignores (idempotent)
# Usage: ./scripts/tkfm-wire-repo-clean-gitignore.sh .

ROOT="${1:-.}"
cd "$ROOT"

touch .gitignore

add_line() {
  local line="$1"
  grep -qxF "$line" .gitignore 2>/dev/null || echo "$line" >> .gitignore
}

# Core
add_line ""
add_line "# TKFM: repo hygiene (generated)"
add_line "node_modules/"
add_line "dist/"
add_line ".netlify/"
add_line ".vite/"
add_line ".DS_Store"
add_line "Thumbs.db"

# Local secrets / keys
add_line ".tkfm_owner_key"
add_line ".env.local"
add_line ".env.*.local"

# Backups + artifacts
add_line "backups/"
add_line "*BACKUP*"
add_line "*.BACKUP.*"
add_line "*.BROKEN.*"
add_line "*.tmp"
add_line "*.bak"
add_line "*.orig"
add_line "*.swp"

# Windows junk
add_line "nul"

echo "OK: .gitignore wired"
