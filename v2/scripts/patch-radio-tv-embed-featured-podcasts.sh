#!/usr/bin/env bash
set -euo pipefail

FILE="radio-tv.html"

if [ ! -f "$FILE" ]; then
  echo "❌ $FILE not found. Run this from your /v2 folder."
  exit 1
fi

echo "✅ Patching $FILE to embed Featured Podcast Lane at the top..."

cp -f "$FILE" "${FILE}.bak"

# 1) Ensure the featured lane script is loaded (once)
if ! grep -q "tkfm-featured-podcast-lane.js" "$FILE"; then
  echo " - Injecting <script src=\"/js/tkfm-featured-podcast-lane.js\"></script> into <head>..."
  tmp="$(mktemp)"
  awk '
    BEGIN{done=0}
    /<\/head>/ && done==0 {
      print "  <script src=\"/js/tkfm-featured-podcast-lane.js\"></script>"
      done=1
    }
    {print}
  ' "$FILE" > "$tmp"
  mv -f "$tmp" "$FILE"
else
  echo " - Script tag already present."
fi

# 2) Inject Featured Podcast Lane markup right after the opening <body ...> tag (once)
if ! grep -q "id=\"tkfmFeaturedPodcastLane\"" "$FILE"; then
  echo " - Injecting Featured Podcast Lane markup at top of <body>..."
  tmp="$(mktemp)"
  awk '
    BEGIN{inserted=0}
    {
      print
      if (inserted==0 && $0 ~ /<body[^>]*>/) {
        print ""
        print "  <!-- TKFM Featured Podcast Lane (embedded at top of TV screen) -->"
        print "  <section id=\"tkfmFeaturedPodcastLane\">"
        print "    <div class=\"tkfmFeaturedPodcastLane__head\">"
        print "      <div class=\"tkfmFeaturedPodcastLane__title\">Featured Podcasts</div>"
        print "      <div class=\"tkfmFeaturedPodcastLane__sub\">Pinned on TKFM TV — tap a show to play instantly</div>"
        print "    </div>"
        print "    <div id=\"tkfmFeaturedPodcastRail\" class=\"tkfmFeaturedPodcastLane__rail\"></div>"
        print "  </section>"
        print ""
        inserted=1
      }
    }
  ' "$FILE" > "$tmp"
  mv -f "$tmp" "$FILE"
else
  echo " - Featured Podcast Lane markup already present."
fi

echo "✅ Done. Backup saved as ${FILE}.bak"
echo "Next: start Netlify dev and open /radio-tv.html to confirm the lane renders and clicks load into your TV player."
