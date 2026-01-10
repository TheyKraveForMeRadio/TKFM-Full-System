#!/usr/bin/env bash
set -euo pipefail

FILE="video-engine.html"
[ -f "$FILE" ] || { echo "ERROR: $FILE not found (run from v2 root)"; exit 1; }

STAMP="$(date +%Y%m%d_%H%M%S)"
BKDIR="backups/video-engine-css-repair-$STAMP"
mkdir -p "$BKDIR"
cp -p "$FILE" "$BKDIR/$FILE"
echo "== TKFM: Repair video-engine.html CSS + ensure paid-lane modal blocks exist =="
echo "Backup: $BKDIR/$FILE"
echo

# 1) Sanitize/repair the FIRST <style>...</style> block if it contains HTML (<div>, <button>, etc)
#    This is what causes VSCode CSS parser errors and can blank the page if the browser bails early.
awk -v MODE="scan" '
function print_clean_style(){
  print "<style id=\"tkfmVideoEngineTheme\">"
  print "  /* TKFM VIDEO ENGINE — Neon Radio look (safe injected) */"
  print "  :root{--bg:#020617;--cyan:#22d3ee;--pink:#ec4899;--purple:#a855f7;--blue:#3b82f6;--gold:#facc15;}"
  print "  body{margin:0;background:var(--bg);background-image:"
  print "    radial-gradient(circle at 0 0,rgba(34,211,238,0.20),transparent 55%),"
  print "    radial-gradient(circle at 100% 0,rgba(236,72,153,0.26),transparent 55%),"
  print "    radial-gradient(circle at 50% 100%,rgba(168,85,247,0.24),transparent 55%),"
  print "    radial-gradient(circle at 60% 50%,rgba(250,204,21,0.08),transparent 60%);"
  print "    color:#e2e8f0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}"
  print "  .card{background:rgba(2,6,23,.55);border:1px solid rgba(148,163,184,.18);transition:transform .12s ease,border-color .12s ease}"
  print "  .card:hover{border-color:rgba(34,211,238,.35);transform:translateY(-1px)}"
  print "  .pill{font-size:.7rem;letter-spacing:.28em;text-transform:uppercase}"
  print "  .btn{border-radius:999px;font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;font-weight:800;padding:.65rem 1rem;white-space:nowrap}"
  print "  .soft{color:rgba(226,232,240,.82)}"
  print "  .price{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,\"Liberation Mono\",\"Courier New\",monospace}"
  print "  .toast{position:fixed;left:50%;transform:translateX(-50%);bottom:22px;z-index:9999;max-width:92vw}"
  print "</style>"
}
BEGIN{inStyle=0; styleIdx=0; bad=0; buf=""; replaced=0;}
{
  line=$0
  if(!replaced){
    if(!inStyle && line ~ /<style[^>]*>/){
      inStyle=1; styleIdx++
      # Only sanitize the FIRST style block (most likely the broken one)
      if(styleIdx==1){
        buf=line "\n"
        next
      }
    }
    if(inStyle && styleIdx==1){
      buf=buf line "\n"
      # If we see obvious HTML tags inside style, mark as bad
      if(line ~ /<\s*(div|button|section|main|header|footer|h[1-6]|p|a|script|iframe|img)\b/i) bad=1
      if(line ~ /<\/style>/){
        inStyle=0
        if(bad){
          print_clean_style()
          replaced=1
        } else {
          printf "%s", buf
          replaced=1
        }
        buf=""
      }
      next
    }
    if(inStyle && line ~ /<\/style>/) inStyle=0
    print line
    next
  }
  # After we have replaced/printed the first style block, just stream everything else unchanged.
  print line
}
END{
  # If we never encountered a style block, inject clean one before </head>
  if(styleIdx==0){
    # (No-op here; handled by a second pass)
  }
}
' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"

# If there was no style block at all, inject clean one before </head>
if ! grep -qi "<style" "$FILE"; then
  awk '
  BEGIN{done=0}
  { if(!done && tolower($0) ~ /<\/head>/){
      print "<style id=\"tkfmVideoEngineTheme\">"
      print "  :root{--bg:#020617;--cyan:#22d3ee;--pink:#ec4899;--purple:#a855f7;--blue:#3b82f6;--gold:#facc15;}"
      print "  body{margin:0;background:var(--bg);background-image:"
      print "    radial-gradient(circle at 0 0,rgba(34,211,238,0.20),transparent 55%),"
      print "    radial-gradient(circle at 100% 0,rgba(236,72,153,0.26),transparent 55%),"
      print "    radial-gradient(circle at 50% 100%,rgba(168,85,247,0.24),transparent 55%),"
      print "    radial-gradient(circle at 60% 50%,rgba(250,204,21,0.08),transparent 60%);"
      print "    color:#e2e8f0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;}"
      print "</style>"
      done=1
    }
    print
  }' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
fi

# 2) Ensure modal host exists (one div near top of <body>)
if ! grep -qi 'id="tkfmPaidLaneModalHost"' "$FILE"; then
  awk '
  BEGIN{done=0}
  { if(!done && tolower($0) ~ /<body\b/){
      print
      print "  <div id=\"tkfmPaidLaneModalHost\"></div>"
      done=1
      next
    }
    print
  }' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
  echo "OK: added tkfmPaidLaneModalHost"
else
  echo "OK: tkfmPaidLaneModalHost already present"
fi

# 3) Ensure script is included (so buttons open modal)
if ! grep -qi 'tkfm-paid-lane-submit\.js' "$FILE"; then
  awk '
  BEGIN{done=0}
  { if(!done && tolower($0) ~ /<\/body>/){
      print "  <script src=\"/js/tkfm-paid-lane-submit.js\"></script>"
      done=1
    }
    print
  }' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
  echo "OK: added /js/tkfm-paid-lane-submit.js include"
else
  echo "OK: paid-lane script already included"
fi

echo
echo "DONE: video-engine.html repaired."
echo "Next: run the verify script:"
echo "  ./scripts/verify-paid-lane-pages-not-blank.sh"
