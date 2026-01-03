#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"

mkdir -p backups

stamp="$(date +%Y%m%d_%H%M%S)"
backup_file() {
  local f="$1"
  if [ -f "$f" ]; then
    cp -f "$f" "backups/$(basename "$f").bak_owner_gate_${stamp}"
  fi
}

inject_head_scripts() {
  local f="$1"
  # ensure head exists
  grep -qi "<head" "$f" || return 0

  # insert scripts right after <head ...>
  if ! grep -q "/js/tkfm-owner-guard.js" "$f"; then
    perl -0777 -i -pe 's|<head([^>]*)>|<head$1>\n  <script src="/js/tkfm-owner-guard.js"></script>\n  <script src="/js/tkfm-owner-gate-no-redirect.js"></script>|i' "$f"
  fi
  if ! grep -q "/js/tkfm-owner-gate-no-redirect.js" "$f"; then
    # if guard exists but gate doesn't
    perl -0777 -i -pe 's|(<script src="/js/tkfm-owner-guard\.js"></script>)|$1\n  <script src="/js/tkfm-owner-gate-no-redirect.js"></script>|i' "$f"
  fi
}

inject_body_mount() {
  local f="$1"
  # add lock mount near top of body
  if ! grep -q 'id="tkfmOwnerLock"' "$f"; then
    perl -0777 -i -pe 's|<body([^>]*)>|<body$1>\n  <div id="tkfmOwnerLock"></div>|i' "$f"
  fi
}

strip_owner_login_redirects() {
  local f="$1"
  # remove lines that hard-redirect to owner-login
  # (conservative: only lines containing owner-login and a location/redirect pattern)
  perl -i -ne '
    if ($_ =~ /(owner-login\.html)/i && $_ =~ /(location\.href|location\.replace|window\.location|document\.location|location\s*=)/i) { next; }
    print;
  ' "$f"
}

patch_file() {
  local f="$1"
  [ -f "$f" ] || return 0
  echo "PATCH -> $f"
  backup_file "$f"
  inject_head_scripts "$f"
  inject_body_mount "$f"
  strip_owner_login_redirects "$f"
}

echo "== TKFM OWNER NO-REDIRECT GATE: patching owner-only engines =="

# Include common owner-only pages; if a file doesn't exist it will be skipped.
TARGETS=(
  "autopilot-engine.html"
  "ai-dj-engine.html"
  "ai-dj-console.html"
  "god-view.html"
  "owner-dashboard.html"
  "owner-ops-dashboard.html"
  "tkfm-dev-console.html"
  "feature-revenue.html"
  "sponsor-rotator.html"
  "sponsors.html"
  "label-revenue-console.html"
  "label-sponsor-engine.html"
  "label-social-engine.html"
)

for f in "${TARGETS[@]}"; do
  patch_file "$f"
done

# Also patch originals if present
if [ -d "originals" ]; then
  for f in "originals/"*.html; do
    [ -f "$f" ] || continue
    case "$f" in
      *owner-login* ) continue ;;
      *register* ) continue ;;
    esac
    patch_file "$f"
  done
fi

echo "== DONE =="
echo "Backups saved in: backups/"
echo "Verify a page contains:"
echo "  /js/tkfm-owner-guard.js"
echo "  /js/tkfm-owner-gate-no-redirect.js"
echo "  <div id=\"tkfmOwnerLock\"></div>"
