#!/usr/bin/env bash
set -euo pipefail
echo "== TKFM: Install Owner Paid-Lane Inbox (owner-only) =="

mkdir -p js netlify/functions backups

# Create backups if files exist
STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/paid-lane-owner-inbox-$STAMP"
mkdir -p "$BK"
for f in owner-paid-lane-inbox.html js/tkfm-paid-lane-inbox.js netlify/functions/paid-lane-submit.js netlify/functions/paid-lane-list.js netlify/functions/paid-lane-update.js netlify/functions/_tkfm_store.js; do
  [ -f "$f" ] && cp -p "$f" "$BK/${f//\//__}"
done

# Install files (already extracted by unzip)
echo "OK: files ready"

# Optional: add link to tkfm-dev-console.html if present
if [ -f "tkfm-dev-console.html" ] && ! grep -qi "owner-paid-lane-inbox.html" "tkfm-dev-console.html"; then
  cp -p "tkfm-dev-console.html" "$BK/tkfm-dev-console.html"
  # Inject a link card near end of body
  awk '
    BEGIN{done=0}
    {
      if (!done && tolower($0) ~ /<\/body>/) {
        print "  <!-- TKFM Owner Tools: Paid Lane Inbox Link -->"
        print "  <div style=\"max-width:1100px;margin:18px auto 0;padding:0 14px;\">"
        print "    <a href=\"/owner-paid-lane-inbox.html\" style=\"display:block;border:1px solid rgba(250,204,21,.30);background:rgba(2,6,23,.55);padding:14px 16px;border-radius:18px;color:#fff7ed;text-decoration:none;font-weight:900;letter-spacing:.10em;text-transform:uppercase;\">"
        print "      Owner Inbox — Paid Lane Submissions"
        print "      <span style=\"display:block;margin-top:6px;color:rgba(226,232,240,.78);font-weight:600;letter-spacing:0;text-transform:none;\">Approve/reject and route submissions into Featured + scheduling.</span>"
        print "    </a>"
        print "  </div>"
        done=1
      }
      print $0
    }
  ' "tkfm-dev-console.html" > "tkfm-dev-console.html.__tmp__"
  mv "tkfm-dev-console.html.__tmp__" "tkfm-dev-console.html"
  echo "PATCHED: tkfm-dev-console.html (added link)"
fi

echo "DONE."
echo "Open: http://localhost:8888/owner-paid-lane-inbox.html"
