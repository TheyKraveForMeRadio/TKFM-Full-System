#!/usr/bin/env bash
set -euo pipefail

F="video-engine.html"
[ -f "$F" ] || { echo "FAIL: $F not found"; exit 1; }

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/video-engine-pro-copy-$STAMP"
mkdir -p "$BK"
cp -p "$F" "$BK/$F"

# Remove any previous pro-copy block (by markers) if it exists
perl -0777 -i -pe 's/<!--\s*TKFM_VIDEO_PRO_COPY_START\s*-->[\s\S]*?<!--\s*TKFM_VIDEO_PRO_COPY_END\s*-->\s*//gis' "$F"

# Insert new pro copy right after <body ...> opening tag
perl -0777 -i -pe 's/(<body\b[^>]*>\s*)/$1<!-- TKFM_VIDEO_PRO_COPY_START -->\n<section id="tkfmVideoProCopy" class="card" style="padding:18px 18px; margin: 14px auto 18px; max-width:1100px;">\n  <div class="pill" style="color: rgba(34,211,238,.85);">TKFM VIDEO ENGINE • PAID VISUALS LANE</div>\n  <h2 style="margin:10px 0 8px; font-weight:900; letter-spacing:.2px;">\n    Get your visuals placed — Featured, scheduled, and pushed through the TKFM machine.\n  </h2>\n  <p class="soft" style="margin:0 0 10px;">\n    This is not a free upload page. This is the paid lane for artists, DJs, and creators who want real visibility.\n    Choose a package, complete checkout, then submit your link so we can route it into <strong>Review → Scheduling → Featured TV → On-air promo</strong>.\n  </p>\n\n  <div style="display:grid; grid-template-columns: 1fr; gap:10px; margin-top:12px;">\n    <div class="card" style="padding:14px;">\n      <div class="pill" style="color: rgba(236,72,153,.9);">What to submit</div>\n      <ul style="margin:10px 0 0; padding-left:18px; color: rgba(226,232,240,.9); line-height:1.6;">\n        <li><strong>Video link</strong> (YouTube / Vimeo) OR <strong>Drive link</strong> (share access)</li>\n        <li><strong>Artist name + title</strong> exactly how you want it displayed</li>\n        <li><strong>Best contact</strong> (email / IG / phone)</li>\n        <li><strong>Notes</strong>: release date, vibe, city, goals</li>\n      </ul>\n    </div>\n\n    <div class="card" style="padding:14px;">\n      <div class="pill" style="color: rgba(250,204,21,.95);">How it works</div>\n      <ol style="margin:10px 0 0; padding-left:18px; color: rgba(226,232,240,.9); line-height:1.6;">\n        <li><strong>Pick your lane</strong> (Monthly Visuals / Music Video Push / Reels Pack / Creator Pass)</li>\n        <li><strong>Checkout</strong> — you unlock instantly</li>\n        <li><strong>Submit</strong> your link on this page (use the “Submit Now” button)</li>\n        <li><strong>TKFM processes it</strong> and routes it into Featured + rotation when approved</li>\n      </ol>\n    </div>\n  </div>\n\n  <div class="soft" style="margin-top:12px; font-size:13px;">\n    <strong>Pro tip:</strong> clean cover image + strong first 10 seconds = better placement.\n  </div>\n</section>\n<!-- TKFM_VIDEO_PRO_COPY_END -->\n$1/s' "$F"

echo "OK: Pro copy inserted into $F"
echo "Backup: $BK/$F"
