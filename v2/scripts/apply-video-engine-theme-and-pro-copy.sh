#!/usr/bin/env bash
set -euo pipefail

F="video-engine.html"
if [ ! -f "$F" ]; then
  echo "Missing $F (run from /v2)."
  exit 1
fi

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/video-engine-theme-pro-$STAMP"
mkdir -p "$BK"
cp -p "$F" "$BK/$F"

echo "== TKFM: Apply Video Engine theme + professional customer copy =="
echo "Backup: $BK/$F"

node <<'NODE'
import fs from "fs";

const file = "video-engine.html";
let s = fs.readFileSync(file, "utf8");

// Remove old injected blocks if present
s = s.replace(/<!--\s*TKFM_VIDEO_ENGINE_THEME_START\s*-->[\s\S]*?<!--\s*TKFM_VIDEO_ENGINE_THEME_END\s*-->\s*/g, "");
s = s.replace(/<!--\s*TKFM_VIDEO_ENGINE_PRO_COPY_START\s*-->[\s\S]*?<!--\s*TKFM_VIDEO_ENGINE_PRO_COPY_END\s*-->\s*/g, "");

const themeCss = `<!-- TKFM_VIDEO_ENGINE_THEME_START -->
<style id="tkfmVideoEngineTheme">
  :root{
    --bg:#020617;
    --cyan:#22d3ee; --blue:#3b82f6; --pink:#ec4899; --purple:#a855f7;
    --gold:#facc15; --amber:#f97316;
  }
  body{
    background:#020617;
    background-image:
      radial-gradient(circle at 0 0,rgba(56,189,248,0.22),transparent 55%),
      radial-gradient(circle at 100% 0,rgba(236,72,153,0.30),transparent 55%),
      radial-gradient(circle at 50% 100%,rgba(168,85,247,0.28),transparent 55%),
      radial-gradient(circle at 60% 50%,rgba(250,204,21,0.08),transparent 60%);
  }
  .card{background:rgba(2,6,23,.55);border:1px solid rgba(148,163,184,.18);transition:transform .12s ease,border-color .12s ease}
  .card:hover{border-color:rgba(56,189,248,.35);transform:translateY(-1px)}
  .pill{font-size:.7rem;letter-spacing:.28em;text-transform:uppercase}
  .btn{border-radius:999px;font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;font-weight:800;padding:.65rem 1rem;white-space:nowrap}
  .soft{color:rgba(226,232,240,.82)}
  .price{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;}
  .toast{position:fixed;left:50%;transform:translateX(-50%);bottom:22px;z-index:9999;max-width:92vw}
</style>
<!-- TKFM_VIDEO_ENGINE_THEME_END -->`;

const proCopy = `<!-- TKFM_VIDEO_ENGINE_PRO_COPY_START -->
<section class="card" style="padding:18px; margin:18px auto; max-width:1100px;">
  <div class="pill soft">TKFM RADIO • VIDEO ENGINE</div>
  <h2 style="margin:8px 0 6px 0; font-size:28px; letter-spacing:.02em;">Video placement that feeds radio visibility.</h2>
  <p class="soft" style="margin:0 0 12px 0; line-height:1.5;">
    This is a <strong>paid lane</strong>. You’re not “uploading to a free platform” — you’re booking placement and production inside the TKFM ecosystem.
    Purchases route into our <strong>Featured</strong> lane + <strong>Autopilot</strong> queue for review, scheduling, and promotion.
  </p>
  <div class="soft" style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">
    <div class="pill" style="border:1px solid rgba(34,211,238,.22); padding:8px 10px; border-radius:999px;">Public link required</div>
    <div class="pill" style="border:1px solid rgba(250,204,21,.20); padding:8px 10px; border-radius:999px;">Clean branding assets</div>
    <div class="pill" style="border:1px solid rgba(168,85,247,.22); padding:8px 10px; border-radius:999px;">Fast follow‑up</div>
  </div>
</section>
<!-- TKFM_VIDEO_ENGINE_PRO_COPY_END -->`;

function injectBefore(s, beforeNeedle, block){
  const idx = s.toLowerCase().indexOf(beforeNeedle.toLowerCase());
  if (idx === -1) return block + "\n" + s;
  return s.slice(0, idx) + block + "\n" + s.slice(idx);
}

// Put theme CSS right before </head> so it overrides page defaults
if (!s.includes('id="tkfmVideoEngineTheme"')) {
  s = injectBefore(s, "</head>", "\n" + themeCss + "\n");
}

// Put pro copy right after <body ...> opening
if (!s.includes("TKFM_VIDEO_ENGINE_PRO_COPY_START")) {
  const m = s.match(/<body[^>]*>/i);
  if (m && m.index !== undefined) {
    const insertAt = m.index + m[0].length;
    s = s.slice(0, insertAt) + "\n" + proCopy + "\n" + s.slice(insertAt);
  } else {
    s = proCopy + "\n" + s;
  }
}

fs.writeFileSync(file, s);
console.log("PATCHED:", file);
NODE
