#!/usr/bin/env bash
set -euo pipefail

# TKFM: Add "Tracking Test" link to owner pages (safe best-effort)

ROOT="${1:-.}"
cd "$ROOT"

INSERT=$(cat <<'HTML'
<a href="/owner-tracking-test.html" style="text-decoration:none">
  <button class="btn" type="button">Tracking Test</button>
</a>
HTML
)

patch_file () {
  local F="$1"
  [ -f "$F" ] || { echo "SKIP: $F not found"; return 0; }
  if grep -q "owner-tracking-test.html" "$F"; then
    echo "OK: link already present in $F"
    return 0
  fi

  python - <<'PY'
import os, re
f = os.environ["F"]
ins = os.environ["INS"]
s = open(f, "r", encoding="utf-8", errors="ignore").read()

if "owner-tracking-test.html" in s:
  print("OK")
  raise SystemExit

# insert after Boost Dashboard if present, else append into top button row
m = re.search(r'(<a[^>]*owner-boost-dashboard\.html[^>]*>[\s\S]*?</a>)', s, re.I)
if m:
  s = s[:m.end()] + "\n" + ins + s[m.end():]
else:
  m2 = re.search(r'(<div[^>]*style="[^"]*justify-content:flex-end[^"]*"[^>]*>)', s, re.I)
  if m2:
    s = s[:m2.end()] + "\n" + ins + s[m2.end():]
  else:
    s = re.sub(r'</body>', ins + "\n</body>", s, flags=re.I)

open(f, "w", encoding="utf-8").write(s)
print("OK")
PY
}

export INS="$INSERT"

export F="owner-boost-dashboard.html"; patch_file "$F"
export F="owner-featured-manager.html"; patch_file "$F"
export F="owner-paid-lane-inbox.html"; patch_file "$F"
