#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Engine CTA Lane-Lock + Pro Customer Copy =="
echo "What this does:"
echo " - Replaces the top CTA bar on each engine page with lane-specific copy"
echo " - Locks the CTA to the correct planId per engine (no auto-picking)"
echo " - Keeps Neon Radio colors + subtle gold accent"
echo

STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/engine-cta-lane-lock-$STAMP"
mkdir -p "$BK"

START_MARK='<!-- TKFM: ENGINE CTA BAR START (safe) -->'
STOP_MARK='<!-- TKFM: ENGINE CTA BAR END (safe) -->'

STYLE_BLOCK='  <style id="tkfmPaidLaneCtaBarStyles">
  .tkfmCtaWrap{max-width:1200px;margin:14px auto 10px;padding:14px;border-radius:22px;background:rgba(2,6,23,.55);border:1px solid rgba(148,163,184,.18);box-shadow:0 20px 80px rgba(0,0,0,.35);color:#e2e8f0}
  .tkfmCtaTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}
  .tkfmCtaPill{font-size:.7rem;letter-spacing:.28em;text-transform:uppercase;color:rgba(34,211,238,.95)}
  .tkfmCtaH{margin:8px 0 6px;font-weight:900;letter-spacing:.2px;font-size:1.1rem}
  .tkfmCtaCopy{color:rgba(226,232,240,.78);line-height:1.55;max-width:860px}
  .tkfmCtaList{margin:10px 0 0;padding-left:18px;color:rgba(226,232,240,.88);line-height:1.6}
  .tkfmCtaBtns{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .tkfmCtaBtn{border-radius:999px;font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;font-weight:900;padding:.75rem 1.05rem;white-space:nowrap;border:1px solid rgba(34,211,238,.35);background:rgba(2,6,23,.65);color:#e2e8f0;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
  .tkfmCtaBtn:hover{border-color:rgba(34,211,238,.55)}
  .tkfmCtaBtnHot{background:linear-gradient(90deg, rgba(168,85,247,.35), rgba(236,72,153,.25));border-color:rgba(168,85,247,.35)}
  .tkfmCtaBtnGold{background:linear-gradient(90deg, rgba(250,204,21,.18), rgba(249,115,22,.10));border-color:rgba(250,204,21,.30);color:#fff7ed}
  .tkfmCtaMini{margin-top:10px;display:flex;gap:12px;flex-wrap:wrap;color:rgba(226,232,240,.68);font-size:.85rem}
  </style>'

mk_cta () {
  local title="$1"
  local pill="$2"
  local copy="$3"
  local list="$4"
  local plan="$5"
  local file="$6"

  cat <<HTML
$START_MARK
<section class="tkfmCtaWrap" role="region" aria-label="TKFM Paid Lane">
  <div class="tkfmCtaTop">
    <div>
      <div class="tkfmCtaPill">$pill</div>
      <div class="tkfmCtaH">$title</div>
      <div class="tkfmCtaCopy">$copy</div>
      <ul class="tkfmCtaList">
$list
      </ul>
    </div>
    <div class="tkfmCtaBtns">
      <button class="tkfmCtaBtn tkfmCtaBtnHot js-checkout" data-plan="$plan">Buy This Lane</button>
      <a class="tkfmCtaBtn tkfmCtaBtnGold" href="/$file?submit=1&lane=$plan">Submit Now</a>
      <a class="tkfmCtaBtn" href="/pricing.html">See All Pricing</a>
    </div>
  </div>
  <div class="tkfmCtaMini"><span>Lane ID:</span> <code style="opacity:.9">$plan</code> <span>• Submit routes into Featured + Autopilot</span></div>
</section>
$STOP_MARK
HTML
}

# Engine targets (locked)
declare -A PLAN
PLAN["video-engine.html"]="video_monthly_visuals"
PLAN["podcast-engine.html"]="podcast_monthly_boost"
PLAN["press-engine.html"]="press_run_pack"
PLAN["social-engine.html"]="social_starter_monthly"

# Pro copy per engine
declare -A PILL
declare -A TITLE
declare -A COPY
declare -A LIST

PILL["video-engine.html"]="TKFM VIDEO ENGINE • PAID VISUALS LANE"
TITLE["video-engine.html"]="Put your visuals on air — and make them move."
COPY["video-engine.html"]="Choose a package, checkout, then submit your link. We review it, schedule it, and push it through TKFM placements."
LIST["video-engine.html"]=$'        <li><strong>Submit:</strong> YouTube/Vimeo link or Drive link (share access)</li>\n        <li><strong>We deliver:</strong> Featured placements + rotation opportunities</li>\n        <li><strong>Fast follow-up:</strong> confirmation + scheduling notes</li>'

PILL["podcast-engine.html"]="TKFM PODCAST ENGINE • PAID BOOST LANE"
TITLE["podcast-engine.html"]="Get your episode featured — not buried."
COPY["podcast-engine.html"]="This lane is for creators who want real listens. Checkout, submit your episode link, and we slot it into TKFM’s Featured rail + rotation."
LIST["podcast-engine.html"]=$'        <li><strong>Submit:</strong> episode link + show name + guest + release date</li>\n        <li><strong>Placement:</strong> Featured podcast player on TKFM TV + promotion windows</li>\n        <li><strong>Optional:</strong> short intro clip for maximum clicks</li>'

PILL["press-engine.html"]="TKFM PRESS ENGINE • PAID PRESS RUN"
TITLE["press-engine.html"]="Press that looks official — and gets seen."
COPY["press-engine.html"]="Buy the pack, submit your materials, and we run a clean press pipeline: review → formatting → placement plan → delivery."
LIST["press-engine.html"]=$'        <li><strong>Submit:</strong> press link / EPK / one-sheet + socials</li>\n        <li><strong>We deliver:</strong> a structured press run plan + distribution-ready assets</li>\n        <li><strong>Goal:</strong> credibility + exposure that converts to streams</li>'

PILL["social-engine.html"]="TKFM SOCIAL ENGINE • PAID CAMPAIGN LANE"
TITLE["social-engine.html"]="Turn your social into an engine that feeds radio + label."
COPY["social-engine.html"]="This is not a free feature. Checkout for Social Starter, then submit your campaign. We build a clean push that feeds TKFM visibility."
LIST["social-engine.html"]=$'        <li><strong>Submit:</strong> goal + links + target city + budget notes</li>\n        <li><strong>We deliver:</strong> campaign setup + posting plan + featured options</li>\n        <li><strong>Upgrade path:</strong> Rotation Boost + Homepage Feature</li>'

PAGES=(video-engine.html podcast-engine.html press-engine.html social-engine.html)

for f in "${PAGES[@]}"; do
  if [ ! -f "$f" ]; then
    echo "SKIP missing: $f"
    continue
  fi

  cp -p "$f" "$BK/$f"

  # Ensure style exists in head (once)
  if ! grep -qi 'tkfmPaidLaneCtaBarStyles' "$f"; then
    awk -v INS="$STYLE_BLOCK" '
      BEGIN{done=0}
      {
        if(!done && tolower($0) ~ /<\/head>/){ print INS; done=1; }
        print $0;
      }
    ' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"
  fi

  # Remove any existing CTA block (idempotent)
  awk -v S="$START_MARK" -v T="$STOP_MARK" '
    BEGIN{skip=0}
    index($0,S){skip=1; next}
    index($0,T){skip=0; next}
    skip==0{print}
  ' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"

  # Build the new CTA block (locked lane)
  PLANID="${PLAN[$f]}"
  BODY="$(mk_cta "${TITLE[$f]}" "${PILL[$f]}" "${COPY[$f]}" "${LIST[$f]}" "$PLANID" "$f")"

  # Insert right after <body ...>
  awk -v INS="$BODY" '
    BEGIN{inserted=0}
    {
      print $0
      if(!inserted && tolower($0) ~ /<body[^>]*>/){
        inserted=1
        print INS
      }
    }
  ' "$f" > "$f.__tmp__" && mv "$f.__tmp__" "$f"

  echo "OK: $f (locked lane: $PLANID)"
done

echo
echo "DONE."
echo "Backups: $BK"
