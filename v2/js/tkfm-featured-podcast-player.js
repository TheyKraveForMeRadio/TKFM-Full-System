/* TKFM Featured Rail + Podcast Player Enhancer
   - Extends tkfm-featured-rail.js behavior by adding a Featured Podcast player
   - Does NOT modify existing rail markup; it attaches after the rail is rendered.
   - Works on any page containing #tkfmFeaturedRailHost.
*/
(function(){
  function qs(sel, root){ return (root||document).querySelector(sel); }
  function qsa(sel, root){ return Array.from((root||document).querySelectorAll(sel)); }
  function isAudio(url){ return /\.(mp3|m4a|wav|ogg)(\?|#|$)/i.test(url||""); }
  function isYouTube(url){ return /youtube\.com|youtu\.be/i.test(url||""); }
  function isSpotify(url){ return /open\.spotify\.com/i.test(url||""); }
  function isSoundCloud(url){ return /soundcloud\.com/i.test(url||""); }

  function spotifyEmbed(url){
    try{
      const u = new URL(url);
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        const kind = parts[0]; // episode/show/track/playlist/artist/album
        const id = parts[1];
        return `https://open.spotify.com/embed/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`;
      }
    } catch(e){}
    return url;
  }

  function youtubeEmbed(url){
    try{
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) {
        const id = u.pathname.replace("/","");
        return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
      }
      if (u.hostname.includes("youtube.com")) {
        const id = u.searchParams.get("v");
        if (id) return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
        // /embed already?
        if (u.pathname.startsWith("/embed/")) return url;
      }
    } catch(e){}
    return url;
  }

  function soundcloudEmbed(url){
    return "https://w.soundcloud.com/player/?url=" + encodeURIComponent(url);
  }

  function bestEmbed(url){
    if (!url) return "";
    if (isSpotify(url)) return spotifyEmbed(url);
    if (isYouTube(url)) return youtubeEmbed(url);
    if (isSoundCloud(url)) return soundcloudEmbed(url);
    return url;
  }

  function injectStyles(){
    if (document.getElementById("tkfmFeatPodPlayerStyles")) return;
    const css = `
      .tkfmFeatPlayerWrap{
        margin-top: 12px;
        border-radius: 18px;
        border: 1px solid rgba(34,211,238,.14);
        background: rgba(2,6,23,.35);
        padding: 12px;
      }
      .tkfmFeatPlayerTop{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
      .tkfmFeatPlayerTitle{font-weight:900;color:#e2e8f0}
      .tkfmFeatPlayerHint{font-size:.82rem;color:rgba(226,232,240,.65)}
      #tkfmFeaturedPodcastFrame{
        width:100%;
        height: 220px;
        border:0;
        border-radius: 14px;
        background: rgba(2,6,23,.55);
      }
      #tkfmFeaturedPodcastAudio{
        width:100%;
        margin-top:10px;
      }
      .tkfmMiniBtn{
        border:1px solid rgba(148,163,184,.22);
        background: rgba(2,6,23,.55);
        color:#e2e8f0;
        border-radius: 999px;
        padding: 8px 12px;
        font-weight: 900;
        letter-spacing:.08em;
        text-transform: uppercase;
        font-size:.72rem;
        cursor:pointer;
      }
      .tkfmMiniBtn:hover{border-color: rgba(34,211,238,.35)}
    `;
    const st = document.createElement("style");
    st.id = "tkfmFeatPodPlayerStyles";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function installPlayer(railWrap){
    if (!railWrap) return null;
    if (qs("#tkfmFeaturedPodcastPlayer", railWrap)) return qs("#tkfmFeaturedPodcastPlayer", railWrap);

    const wrap = document.createElement("div");
    wrap.className = "tkfmFeatPlayerWrap";
    wrap.id = "tkfmFeaturedPodcastPlayer";
    wrap.innerHTML = `
      <div class="tkfmFeatPlayerTop">
        <div>
          <div class="tkfmFeatPlayerTitle">Featured Podcast Player</div>
          <div class="tkfmFeatPlayerHint">Click a Podcast card to play here. If embed blocks, it opens a new tab.</div>
        </div>
        <div class="tkfmFeatPlayerBtns">
          <button class="tkfmMiniBtn" type="button" id="tkfmPodOpen">Open</button>
        </div>
      </div>
      <div style="margin-top:10px">
        <iframe id="tkfmFeaturedPodcastFrame" title="TKFM Featured Podcast" allow="autoplay; encrypted-media; clipboard-write" referrerpolicy="no-referrer"></iframe>
        <audio id="tkfmFeaturedPodcastAudio" controls></audio>
      </div>
    `;
    railWrap.appendChild(wrap);
    return wrap;
  }

  function boot(){
    const host = document.getElementById("tkfmFeaturedRailHost");
    if (!host) return;

    // Wait until the rail is rendered (tkfm-featured-rail.js sets data-tkfm-featured-rail=1)
    const triesMax = 80;
    let tries = 0;

    const timer = setInterval(()=>{
      tries++;
      const wrap = qs(".tkfmFeatWrap", host);
      const ready = host.getAttribute("data-tkfm-featured-rail") === "1";
      if (wrap && ready) {
        clearInterval(timer);
        injectStyles();
        const player = installPlayer(wrap);
        const frame = qs("#tkfmFeaturedPodcastFrame", player);
        const audio = qs("#tkfmFeaturedPodcastAudio", player);
        const openBtn = qs("#tkfmPodOpen", player);

        let currentUrl = "";

        function setUrl(url){
          currentUrl = url || "";
          if (openBtn) openBtn.onclick = ()=>{ if(currentUrl) window.open(currentUrl,"_blank","noopener,noreferrer"); };
          // reset both
          if (frame) frame.src = "about:blank";
          if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); }

          if (!currentUrl) return;

          if (isAudio(currentUrl)) {
            if (audio) { audio.src = currentUrl; audio.load(); audio.play().catch(()=>{}); }
            return;
          }

          const emb = bestEmbed(currentUrl);
          if (frame) frame.src = emb;
        }

        // Click behavior: POD items now play in player (instead of opening a new tab)
        host.addEventListener("click", (e)=>{
          const btn = e.target.closest(".tkfmFeatCard");
          if (!btn) return;
          const url = btn.getAttribute("data-url") || "";
          const type = (btn.getAttribute("data-type") || "").toLowerCase();
          const isPod = type.includes("podcast");

          if (isPod && url) {
            e.preventDefault();
            e.stopPropagation();
            setUrl(url);

            // If embed is likely to be blocked, still open tab as fallback
            // (we can't detect XFO reliably before load)
            setTimeout(()=>{
              if (frame && frame.src && frame.src !== "about:blank") return;
            }, 800);
          }
        }, true);

      } else if (tries >= triesMax) {
        clearInterval(timer);
      }
    }, 100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
