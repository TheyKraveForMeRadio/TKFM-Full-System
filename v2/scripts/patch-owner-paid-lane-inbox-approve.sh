#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Add APPROVE TO FEATURED buttons to owner-paid-lane-inbox.html =="
F="owner-paid-lane-inbox.html"
if [ ! -f "$F" ]; then
  echo "FAIL: $F not found. (Did you install the inbox patch?)"
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/owner-inbox-approve-$STAMP"
mkdir -p "$BK"
cp -p "$F" "$BK/$F"

# 1) Ensure approve function exists
if ! grep -qi "paid-lane-approve" "$F"; then
  # Insert approve helper near load() area (after esc() function ideally)
  awk '
    BEGIN{inserted=0}
    {
      print $0
      if (!inserted && $0 ~ /function esc\(s\)/) {
        # wait until esc function ends (a line with ^\s*}\s*$ after esc) - but keep simple: insert after first return mapping line
      }
      if (!inserted && $0 ~ /function esc\(s\)/) {
        esc_seen=1
      }
      if (!inserted && esc_seen && $0 ~ /}\s*$/) {
        print ""
        print "  async function approve(id, featuredType){"
        print "    if (!key) return;"
        print "    status.textContent = \"Approving…\";"
        print "    status.style.color = \"rgba(34,211,238,.9)\";"
        print "    try{"
        print "      const res = await fetch(\"/.netlify/functions/paid-lane-approve?key=\" + encodeURIComponent(key), {"
        print "        method:\"POST\","
        print "        headers:{\"content-type\":\"application/json\"},"
        print "        body: JSON.stringify({ id, featuredType })"
        print "      });"
        print "      const data = await res.json();"
        print "      if (!res.ok || !data.ok) throw new Error(data.error || \"approve_failed\");"
        print "      status.textContent = \"Approved → Featured (\" + (data.featuredType||\"\") + \")\";"
        print "      status.style.color = \"rgba(34,211,238,.9)\";"
        print "      await load();"
        print "    } catch(e){"
        print "      status.textContent = \"Approve failed\";"
        print "      status.style.color = \"rgba(236,72,153,.95)\";"
        print "    }"
        print "  }"
        inserted=1
      }
    }
  ' "$F" > "$F.__tmp__" && mv "$F.__tmp__" "$F"
fi

# 2) Add buttons to card template
# If card already has Approve buttons, skip
if ! grep -qi "Approve to Featured" "$F"; then
  perl -0777 -i -pe '
    s@(\$\{it\.page \? `<div class="mt-2 muted text-xs">Page: \${esc\(it\.page\)} </div>` : ``\}\s*)@
$1
        <div class="mt-3 flex gap-2 flex-wrap">
          <button class="btn btnHot" onclick="approve(\x27\${esc(it.id)}\x27, \x27\${esc(it.lane||\x27\x27)}\x27)">Approve to Featured (Auto)</button>
          <button class="btn" onclick="approve(\x27\${esc(it.id)}\x27, \x27tv\x27)">Feature as TV</button>
          <button class="btn" onclick="approve(\x27\${esc(it.id)}\x27, \x27podcast\x27)">Feature as Podcast</button>
        </div>
@
@gs;
  ' "$F" || true
fi

echo "DONE: owner inbox patched."
echo "Backup: $BK/$F"
