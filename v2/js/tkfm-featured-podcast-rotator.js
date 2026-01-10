/* TKFM Radio TV — Featured Podcast Rotator (safe)
   - Auto-picks the first Featured Podcast on load (so listeners see it instantly)
   - Rotates through Podcast cards on a timer (no page wipe)
   - Pauses rotation on any user interaction (clicking a card / controls)
   Depends on:
   - Featured Rail is rendered (tkfm-featured-rail.js)
   - Podcast Player enhancer installed (tkfm-featured-podcast-player.js)
*/
(function(){
  function qs(sel, root){ return (root||document).querySelector(sel); }
  function qsa(sel, root){ return Array.from((root||document).querySelectorAll(sel)); }

  const ROTATE_MS = 60000; // 60 seconds
  let paused = false;
  let idx = 0;
  let cards = [];
  let timer = null;

  function setPaused(v){
    paused = !!v;
    const pill = qs("#tkfmPodAutoPill");
    if (pill) {
      pill.textContent = paused ? "AUTO: OFF" : "AUTO: ON";
      pill.style.borderColor = paused ? "rgba(148,163,184,.22)" : "rgba(34,211,238,.35)";
      pill.style.color = paused ? "rgba(226,232,240,.78)" : "rgba(34,211,238,.95)";
    }
  }

  function clickCard(i){
    if (!cards.length) return;
    idx = (i + cards.length) % cards.length;
    const c = cards[idx];
    if (!c) return;
    // Trigger the existing click handler installed by tkfm-featured-podcast-player.js
    c.dispatchEvent(new MouseEvent("click", { bubbles:true, cancelable:true, view:window }));
  }

  function next(){ clickCard(idx+1); }
  function prev(){ clickCard(idx-1); }

  function start(){
    stop();
    timer = setInterval(()=>{
      if (paused) return;
      next();
    }, ROTATE_MS);
  }
  function stop(){
    if (timer) clearInterval(timer);
    timer = null;
  }

  function injectControls(player){
    if (!player) return;
    if (qs("#tkfmPodRotatorControls", player)) return;

    const bar = document.createElement("div");
    bar.id = "tkfmPodRotatorControls";
    bar.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:10px";

    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <button type="button" class="tkfmMiniBtn" id="tkfmPodPrev">Prev</button>
        <button type="button" class="tkfmMiniBtn" id="tkfmPodNext">Next</button>
        <button type="button" class="tkfmMiniBtn" id="tkfmPodAutoToggle"><span id="tkfmPodAutoPill">AUTO: ON</span></button>
      </div>
      <div class="tkfmFeatPlayerHint" id="tkfmPodRotatorHint">Auto-picks a Featured Podcast on load. Auto-rotates every 60s.</div>
    `;

    // Place controls right under the existing player buttons row
    const top = qs(".tkfmFeatPlayerTop", player) || player.firstElementChild;
    if (top && top.parentElement) top.parentElement.insertBefore(bar, top.nextSibling);
    else player.appendChild(bar);

    const bPrev = qs("#tkfmPodPrev", bar);
    const bNext = qs("#tkfmPodNext", bar);
    const bAuto = qs("#tkfmPodAutoToggle", bar);

    if (bPrev) bPrev.addEventListener("click", ()=>{ setPaused(true); prev(); });
    if (bNext) bNext.addEventListener("click", ()=>{ setPaused(true); next(); });
    if (bAuto) bAuto.addEventListener("click", ()=>{ setPaused(!paused); });

    // Pause when user touches audio/iframe controls
    const audio = qs("#tkfmFeaturedPodcastAudio");
    if (audio) audio.addEventListener("play", ()=>setPaused(true));
  }

  function boot(){
    const host = document.getElementById("tkfmFeaturedRailHost");
    if (!host) return;

    let tries = 0;
    const max = 120;

    const t = setInterval(()=>{
      tries++;
      const wrap = qs(".tkfmFeatWrap", host);
      const ready = host.getAttribute("data-tkfm-featured-rail") === "1";
      const player = qs("#tkfmFeaturedPodcastPlayer", wrap);

      if (wrap && ready && player) {
        clearInterval(t);

        // Collect podcast cards
        cards = qsa(".tkfmFeatCard", host).filter(c => {
          const type = (c.getAttribute("data-type")||"").toLowerCase();
          return type.includes("podcast");
        });

        injectControls(player);

        // Pause rotation if user clicks ANY featured card
        host.addEventListener("click", ()=>setPaused(true), true);

        // Auto pick FIRST podcast immediately if available
        if (cards.length) {
          idx = 0;
          clickCard(0);
          start();
        } else {
          setPaused(true);
          const hint = qs("#tkfmPodRotatorHint");
          if (hint) hint.textContent = "No Featured Podcasts found yet (add some in media-feature-get).";
        }
      } else if (tries >= max) {
        clearInterval(t);
      }
    }, 100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
