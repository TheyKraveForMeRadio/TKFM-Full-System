#!/usr/bin/env bash
set -euo pipefail

FILE="radio-tv.html"
JS="js/tkfm-featured-tv-rotator.js"

if [ ! -f "$FILE" ]; then
  echo "❌ $FILE not found. Run this from your /v2 folder."
  exit 1
fi

mkdir -p js

# Backup radio-tv.html
cp -f "$FILE" "$FILE.bak_featured_tv_$(date +%Y%m%d_%H%M%S)"

# Ensure JS file exists (from patch unzip)
if [ ! -f "$JS" ]; then
  echo "❌ Missing $JS (did the ZIP unzip correctly?)"
  exit 1
fi

# 1) Inject script tag into <head> (before </head>)
if ! grep -q "tkfm-featured-tv-rotator.js" "$FILE"; then
  # insert before </head>
  awk '
    BEGIN{added=0}
    {
      if (!added && $0 ~ /<\/head>/) {
        print "  <script src=\"/js/tkfm-featured-tv-rotator.js\"></script>"
        added=1
      }
      print $0
    }
  ' "$FILE" > "$FILE.__tmp__" && mv "$FILE.__tmp__" "$FILE"
  echo "✅ Added /js/tkfm-featured-tv-rotator.js to <head>"
else
  echo "✅ Script tag already present"
fi

# 2) Inject Featured TV top section right after <body...>
if ! grep -q "id=\"tkfmFeaturedTV\"" "$FILE"; then
  awk '
    BEGIN{inserted=0}
    {
      print $0
      if (!inserted && $0 ~ /<body[^>]*>/) {
        inserted=1
        print ""
        print "  <!-- TKFM Featured TV (auto-rotating pinned media) -->"
        print "  <section id=\"tkfmFeaturedTV\" class=\"w-full max-w-6xl mx-auto px-4 pt-6\">"
        print "    <div class=\"rounded-2xl border border-cyan-400/30 bg-slate-950/60 shadow-xl overflow-hidden\">"
        print "      <div class=\"flex items-center justify-between gap-3 px-4 py-3 border-b border-cyan-400/20\">"
        print "        <div>"
        print "          <div class=\"text-sm uppercase tracking-widest text-cyan-300\">Featured TV</div>"
        print "          <div class=\"text-xs text-slate-300 opacity-80\">Pinned media rotates automatically — listeners see it instantly.</div>"
        print "        </div>"
        print "        <div class=\"flex items-center gap-2\">"
        print "          <button id=\"featuredTvNext\" class=\"px-3 py-2 rounded-xl border border-purple-400/30 bg-slate-900/60 text-slate-100 hover:bg-slate-900\">Next</button>"
        print "          <button id=\"featuredTvToggle\" class=\"px-3 py-2 rounded-xl border border-pink-400/30 bg-slate-900/60 text-slate-100 hover:bg-slate-900\">Pause Rotation</button>"
        print "          <button id=\"featuredTvOpen\" class=\"px-3 py-2 rounded-xl border border-cyan-400/30 bg-slate-900/60 text-slate-100 hover:bg-slate-900\">Open</button>"
        print "        </div>"
        print "      </div>"
        print ""
        print "      <div class=\"aspect-video w-full bg-black\">"
        print "        <iframe id=\"featuredTvFrame\" class=\"w-full h-full\" src=\"\" title=\"TKFM Featured TV\" frameborder=\"0\" allow=\"autoplay; fullscreen; picture-in-picture\" allowfullscreen></iframe>"
        print "      </div>"
        print ""
        print "      <div id=\"featuredTvMeta\" class=\"px-4 py-3 text-slate-100\"></div>"
        print "    </div>"
        print "  </section>"
        print ""
      }
    }
  ' "$FILE" > "$FILE.__tmp__" && mv "$FILE.__tmp__" "$FILE"
  echo "✅ Embedded Featured TV section at top of radio-tv.html"
else
  echo "✅ Featured TV section already present"
fi

echo "✅ Done. Backups created: $FILE.bak_featured_tv_*"
