#!/usr/bin/env bash
set -euo pipefail

# TKFM: Clean netlify.toml redirects that start with "/.netlify" (Netlify Dev rejects them)
# Safe/idempotent: removes only [[redirects]] blocks that contain "/.netlify" in from/to.

cd "$(dirname "$0")/.."

if [ ! -f netlify.toml ]; then
  echo "Missing netlify.toml"
  exit 1
fi

python - <<'PY'
from pathlib import Path

p = Path("netlify.toml")
txt = p.read_text(encoding="utf-8", errors="ignore")
lines = txt.splitlines(True)

out = []
i = 0

def is_redirect_header(line):
    return line.strip() == "[[redirects]]"

def block_contains_netlify(block_lines):
    blob = "".join(block_lines)
    return "/.netlify" in blob or ".netlify/functions" in blob

while i < len(lines):
    if is_redirect_header(lines[i]):
        # capture block until next [[redirects]] or EOF
        start = i
        block = [lines[i]]
        i += 1
        while i < len(lines) and not is_redirect_header(lines[i]):
            block.append(lines[i])
            i += 1
        # keep only if it does NOT reference /.netlify
        if not block_contains_netlify(block):
            out.extend(block)
        # else drop block
        continue
    else:
        out.append(lines[i])
        i += 1

p.write_text("".join(out), encoding="utf-8")
print("OK: removed invalid /.netlify redirects from netlify.toml (if any)")
PY

# confirm none remain
grep -n '\.netlify/functions\|/\.netlify' netlify.toml || echo "OK: netlify.toml clean"
